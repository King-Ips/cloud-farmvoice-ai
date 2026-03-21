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
      utterance.lang = 'en-ZA';   // South African English
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

      // Check if the browser supports voice recognition
      const SpeechRecognition = window.SpeechRecognition
        || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert('Your browser does not support voice recognition. Please use Chrome.');
        reject('not supported');
        return;
      }

      // Create a new recognition object
      const recognition = new SpeechRecognition();

      // Settings
      recognition.lang = 'en-ZA';        // South African English
      recognition.interimResults = false; // Only return final result
      recognition.maxAlternatives = 1;    // Only return best match

      // When user finishes speaking, return what they said
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('User said:', transcript); // Shows in console for debugging
        resolve(transcript.toLowerCase().trim());
      };

      // If there's an error (e.g. no microphone)
      recognition.onerror = (event) => {
        console.error('Voice error:', event.error);
        reject(event.error);
      };

      // Start listening
      recognition.start();
    });
  },

  // ── SPEAK THEN LISTEN ─────────────────────────────────────────
  // Helper: speaks a prompt then immediately listens for response.
  // This is used everywhere in the app.
  // Usage: const answer = await VoiceEngine.ask("What is your name?")
  async ask(prompt) {
    await this.speak(prompt);
    return await this.listen();
  }

};