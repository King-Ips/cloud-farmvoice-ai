// voice-engine.js
// This file handles ALL voice in FarmVoice AI.
// Two functions: speak() and listen()
// Every other file uses these two functions.

var VoiceEngine = {

  // ── SPEAK ─────────────────────────────────────────────────────
  // Takes any text and reads it out loud to the user.
  // Usage: VoiceEngine.speak("Welcome to FarmVoice AI")
  speak(text) {
    return new Promise((resolve) => {

      // Cancel anything currently being spoken first
      window.speechSynthesis.cancel();

      // Create a new speech object
      const utterance = new SpeechSynthesisUtterance(text);

      // Settings for the voice
      utterance.lang = 'en-US';   // South African English
      utterance.rate = 0.9;        // Slightly slower = clearer
      utterance.pitch = 1.0;       // Normal pitch
      utterance.volume = 1.0;      // Full volume

      // When finished speaking, resolve the promise
      // This lets us chain: speak then listen
      utterance.onend = () => resolve();

      // If there's an error, resolve anyway so app doesn't freeze
      utterance.onerror = () => resolve();

      // Start speaking
      window.speechSynthesis.speak(utterance);
    });
  },

  // ── LISTEN ────────────────────────────────────────────────────
  // Activates the microphone and returns what the user said.
  // Usage: const response = await VoiceEngine.listen()


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

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('User said:', transcript);

        // Global menu command
        if (transcript.toLowerCase().includes('menu')) {
          window.speechSynthesis.cancel();
          App.goTo('home');
          Home.load();
          return;
        }

        resolve(transcript.toLowerCase().trim());
      };

      recognition.onerror = (event) => {
        console.error('Voice error:', event.error);

        if (event.error === 'no-speech') {
          // No speech detected — try again automatically
          try {
            recognition.start();
          } catch(e) {
            // Already started, ignore
          }
          return;
        }

        if (event.error === 'not-allowed') {
          VoiceEngine.speak('Please allow microphone access.');
          reject(event.error);
          return;
        }

        reject(event.error);
      };

      recognition.onend = () => {
        // If ended without result, restart
        // This handles cases where recognition stops unexpectedly
      };

      recognition.start();
    });
  },


  // ── SPEAK THEN LISTEN ─────────────────────────────────────────
  // Helper: speaks a prompt then immediately listens for response.
  // This is used everywhere in the app.
  // Usage: const answer = await VoiceEngine.ask("What is your name?")

  async ask(prompt) {
    await this.speak(prompt);
    // Wait longer to give Chrome time to show and process mic permission
    await new Promise(resolve => setTimeout(resolve, 800));
    return await this.listen();
  }

};