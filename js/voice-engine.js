var VoiceEngine = {

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

  listen() {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition
        || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert('Please use Chrome browser.');
        reject('not supported');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;

      let resolved = false;
      let idleTimer = null;

      // Auto return to menu after 15 seconds of silence
      idleTimer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          recognition.stop();
          console.log('Idle timeout — returning to menu');
          App.goTo('home');
          Home.load();
        }
      }, 15000);

      recognition.onresult = (event) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(idleTimer);

        const transcript = event.results[0][0].transcript;
        console.log('User said:', transcript);

        // Global commands work from anywhere
        if (transcript.toLowerCase().includes('menu')) {
          window.speechSynthesis.cancel();
          App.goTo('home');
          Home.load();
          return;
        }

        if (transcript.toLowerCase().includes('logout') ||
            transcript.toLowerCase().includes('log out') ||
            transcript.toLowerCase().includes('sign out')) {
          window.speechSynthesis.cancel();
          App.logout();
          return;
        }

        resolve(transcript.toLowerCase().trim());
      };

      recognition.onerror = (event) => {
        console.error('Voice error:', event.error);

        if (event.error === 'no-speech') {
          if (!resolved) {
            recognition.stop();
            setTimeout(() => {
              try { recognition.start(); } catch(e) {}
            }, 100);
          }
          return;
        }

        if (event.error === 'not-allowed') {
          clearTimeout(idleTimer);
          VoiceEngine.speak('Please allow microphone access.');
          reject(event.error);
          return;
        }

        if (!resolved) {
          clearTimeout(idleTimer);
          reject(event.error);
        }
      };

      setTimeout(() => {
        try {
          recognition.start();
        } catch(e) {
          console.error('Recognition start error:', e);
        }
      }, 100);
    });
  },

  async ask(prompt) {
    await this.speak(prompt);
    await new Promise(resolve => setTimeout(resolve, 300));
    return await this.listen();
  }

};