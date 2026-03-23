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
      recognition.continuous = true;

      let resolved = false;

      recognition.onresult = (event) => {
        if (resolved) return;
        
        const transcript = event.results[event.results.length - 1][0].transcript.trim();
        
        // Ignore empty results
        if (!transcript || transcript.length === 0) return;
        
        resolved = true;
        recognition.stop();
        console.log('User said:', transcript);

        if (transcript.toLowerCase().includes('menu')) {
          window.speechSynthesis.cancel();
          App.goTo('home');
          Home.load();
          return;
        }

        if (transcript.toLowerCase().includes('logout')) {
          window.speechSynthesis.cancel();
          App.logout();
          return;
        }

        resolve(transcript.toLowerCase().trim());
      };


      recognition.onerror = (event) => {
        console.error('Voice error:', event.error);

        if (event.error === 'no-speech') {
          // Keep going — continuous mode handles this
          return;
        }

        if (event.error === 'not-allowed') {
          VoiceEngine.speak('Please allow microphone access.');
          reject(event.error);
          return;
        }

        if (!resolved) reject(event.error);
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