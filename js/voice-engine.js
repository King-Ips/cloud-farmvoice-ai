var VoiceEngine = {

  _recognition: null,
  _idleTimer: null,
  _idleCallback: null,

  _resetIdle() {
    if (this._idleTimer) clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => {
      console.log('Idle — returning to menu');
      this.stopListening();
      window.speechSynthesis.cancel();
      App.goTo('home');
      Home.load();
    }, 30000);
  },

  speak(text) {
    // Reset idle on every speak so registration never times out
    this._resetIdle();
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

  stopListening() {
    if (this._recognition) {
      try { this._recognition.abort(); } catch(e) {}
      this._recognition = null;
    }
  },

  listen() {
    this.stopListening();
    this._resetIdle();

    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
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

      const finish = (fn) => {
        if (resolved) return;
        resolved = true;
        this._recognition = null;
        fn();
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        console.log('User said:', transcript);
        const t = transcript.toLowerCase();

        if (t.includes('menu')) {
          finish(() => {
            window.speechSynthesis.cancel();
            App.goTo('home');
            Home.load();
          });
          return;
        }

        if (t.includes('logout') || t.includes('log out') || t.includes('sign out')) {
          finish(() => {
            window.speechSynthesis.cancel();
            App.logout();
          });
          return;
        }

        finish(() => resolve(t));
      };

      recognition.onerror = (event) => {
        console.error('Voice error:', event.error);
        if (event.error === 'no-speech') {
          if (!resolved) {
            this._resetIdle();
            try { recognition.start(); } catch(e) {}
          }
          return;
        }
        if (event.error === 'aborted') return;
        if (event.error === 'not-allowed') {
          finish(() => reject(event.error));
          return;
        }
        if (!resolved) finish(() => reject(event.error));
      };

      recognition.onend = () => {
        if (!resolved) {
          try { recognition.start(); } catch(e) {}
        }
      };

      setTimeout(() => {
        try { recognition.start(); } catch(e) {}
      }, 150);
    });
  },

  async ask(prompt) {
    await this.speak(prompt);
    await new Promise(r => setTimeout(r, 200));
    return await this.listen();
  }
};