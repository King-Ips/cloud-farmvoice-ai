var VoiceEngine = {

  recognition: null,
  isListening: false,

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-ZA'; // good for SA users
    this.recognition.interimResults = false;
    this.recognition.continuous = false;
  },

  speak(text) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) {
        console.warn('Speech synthesis not supported');
        resolve();
        return;
      }

      const utter = new SpeechSynthesisUtterance(text);
      utter.onend = () => resolve();
      utter.onerror = () => resolve();

      window.speechSynthesis.speak(utter);
    });
  },

  listen(timeout = 10000) {
    return new Promise((resolve, reject) => {

      if (!this.recognition) {
        this.init();
      }

      if (!this.recognition) {
        reject('no_speech_support');
        return;
      }

      let finished = false;

      const cleanup = () => {
        if (this.recognition) {
          this.recognition.onresult = null;
          this.recognition.onerror = null;
          this.recognition.onend = null;
        }
        this.isListening = false;
      };

      this.recognition.onresult = (event) => {
        if (finished) return;
        finished = true;

        const transcript = event.results[0][0].transcript.trim();
        cleanup();

        // GLOBAL COMMAND HANDLING
        if (window.App && App.handleGlobalCommand(transcript)) {
          resolve(transcript);
        } else {
          reject('handled_global');
        }
      };

      this.recognition.onerror = (event) => {
        if (finished) return;
        finished = true;
        cleanup();
        reject(event.error);
      };

      this.recognition.onend = () => {
        if (finished) return;
        finished = true;
        cleanup();
        resolve(null); // silence
      };

      this.isListening = true;
      this.recognition.start();

      // TIMEOUT
      setTimeout(() => {
        if (!finished) {
          finished = true;
          try { this.recognition.stop(); } catch (e) {}
          cleanup();
          resolve(null);
        }
      }, timeout);

    });
  },

  async ask(question, timeout = 10000) {
    await this.speak(question);
    return await this.listen(timeout);
  }

};