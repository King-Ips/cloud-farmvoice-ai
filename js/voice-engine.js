var VoiceEngine = {

  // Track active recognition to prevent conflicts
  _recognition: null,
  _idleTimer: null,

  speak(text) {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  },

  // Stop any active listener
  stopListening() {
    if (this._recognition) {
      try { this._recognition.stop(); } catch(e) {}
      this._recognition = null;
    }
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  },

  listen() {
    // Stop any existing listener first
    this.stopListening();

    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition
        || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert('Please use Chrome browser.');
        reject('not supported');
        return;
      }

      const recognition = new SpeechRecognition();
      this._recognition = recognition;

      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      let resolved = false;

      const done = (fn) => {
        if (resolved) return;
        resolved = true;
        this._recognition = null;
        clearTimeout(this._idleTimer);
        fn();
      };

      // Auto return to menu after 12 seconds of silence
      this._idleTimer = setTimeout(() => {
        done(() => {
          try { recognition.stop(); } catch(e) {}
          console.log('Idle — returning to menu');
          App.goTo('home');
          Home.load();
        });
      }, 30000);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('User said:', transcript);

        const t = transcript.toLowerCase().trim();

        // Global commands
        if (t.includes('menu')) {
          done(() => {
            window.speechSynthesis.cancel();
            App.goTo('home');
            Home.load();
          });
          return;
        }

        if (t.includes('logout') || t.includes('log out') || t.includes('sign out')) {
          done(() => {
            window.speechSynthesis.cancel();
            App.logout();
          });
          return;
        }

        done(() => resolve(t));
      };

      recognition.onerror = (event) => {
        console.error('Voice error:', event.error);

        if (event.error === 'no-speech') {
          // Restart silently on no-speech
          if (!resolved) {
            try { recognition.start(); } catch(e) {}
          }
          return;
        }

        if (event.error === 'aborted') {
          // Aborted intentionally — do nothing
          return;
        }

        if (event.error === 'not-allowed') {
          done(() => {
            VoiceEngine.speak('Please allow microphone access.');
            reject(event.error);
          });
          return;
        }

        done(() => reject(event.error));
      };

      // Small delay before starting
      setTimeout(() => {
        try {
          recognition.start();
        } catch(e) {
          console.error('Start error:', e);
        }
      }, 150);
    });
  },

  async ask(prompt) {
    await this.speak(prompt);
    await new Promise(resolve => setTimeout(resolve, 300));
    return await this.listen();
  }

};