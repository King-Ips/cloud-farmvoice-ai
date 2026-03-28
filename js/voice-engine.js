var VoiceEngine = {

  _recognition: null,
  _lastMessage: '',
  _isSupported: false,

  init() {
    // Check browser support
    this._isSupported = (
      'speechSynthesis' in window && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
    if (!this._isSupported) {
      console.warn('Speech API not fully supported in this browser');
    }
    return this._isSupported;
  },

  speak(text) {
    this._lastMessage = text;
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.error('Speech Synthesis not supported');
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.88;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
          console.error('Speech error:', e.error);
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('Speech synthesis error:', e);
        resolve();
      }
    });
  },

  

  stopListening() {
    if (this._recognition) {
      try { this._recognition.abort(); } catch(e) {}
      this._recognition = null;
    }
  },

  checkGlobal(t) {
    if (t.includes('repeat')) {
      if (this._lastMessage) this.speak(this._lastMessage);
      return true;
    }
    if (t.includes('log out') || t.includes('logout') || t.includes('sign out')) {
      App.logout();
      return true;
    }
    if (t.includes('go back') || t.includes('back')) {
      App.goBack();
      return true;
    }
    if (t.includes('menu')) {
      App.goTo('home');
      Home.load();
      return true;
    }
    return false;
  },

  listen(timeoutMs = 15000) {
    this.stopListening();
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition;
      
      if (!SR) {
        console.error('Speech Recognition API not supported in this browser');
        reject('Speech Recognition not supported');
        return;
      }

      try {
        const r = new SR();
        this._recognition = r;
        r.lang = 'en-US';
        r.interimResults = false;  // Do NOT capture interim results
        r.maxAlternatives = 1;
        r.continuous = false;

        let done = false;
        let timeoutHandle = null;

        const finish = (fn) => {
          if (done) return;
          done = true;
          if (timeoutHandle) clearTimeout(timeoutHandle);
          try { r.abort(); } catch(e) {}
          this._recognition = null;
          fn();
        };

        r.onstart = () => {
          console.log('Listening...');
        };

        r.onresult = (e) => {
          if (!e.results || !e.results.length) return;

          // Get the latest result - only final results will be available
          const latestResult = e.results[e.results.length - 1];
          
          // Safety check: only process final results
          if (!latestResult.isFinal) return;
          
          const transcript = latestResult[0].transcript.trim().toLowerCase();
          if (!transcript) return;
          
          console.log('Got final result:', transcript);

          // Check for global commands first
          if (this.checkGlobal(transcript)) {
            finish(() => {});
            return;
          }

          // Got a final result - resolve immediately and stop listening
          finish(() => resolve(transcript));
        };

        r.onerror = (e) => {
          console.error('Recognition error:', e.error);
          
          if (e.error === 'no-speech') {
            // User hasn't spoken yet - wait longer
            return;
          }

          if (e.error === 'aborted') {
            return;
          }

          if (e.error === 'network') {
            finish(() => reject('Network error - check internet'));
            return;
          }

          finish(() => reject(e.error || 'Recognition failed'));
        };

        r.onend = () => {
          // Recognition ended - if not done yet, it means no results
          if (!done) {
            finish(() => reject('No speech detected'));
          }
        };

        timeoutHandle = setTimeout(() => {
          if (!done) {
            finish(() => reject('Listening timeout'));
          }
        }, timeoutMs);

        // Start listening
        setTimeout(() => {
          try {
            r.start();
          } catch(x) {
            finish(() => reject('Failed to start listening'));
          }
        }, 150);
      } catch (e) {
        console.error('Speech Recognition setup error:', e);
        reject('Failed to initialize speech recognition');
      }
    });
  },

  async ask(prompt, timeoutMs = 20000) {
    await this.speak(prompt);
    await new Promise(r => setTimeout(r, 350));
    return await this.listen(timeoutMs);
  }
};







