var VoiceEngine = {

  _recognition: null,
  _lastMessage: '',

  speak(text) {
    this._lastMessage = text;
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.88;
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

  listen() {
    this.stopListening();
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { alert('Please use Chrome.'); reject('not supported'); return; }

      const r = new SR();
      this._recognition = r;
      r.lang = 'en-US';
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.continuous = false;

      let done = false;
      const finish = (fn) => { if (done) return; done = true; this._recognition = null; fn(); };

      r.onresult = (e) => {
        const t = e.results[0][0].transcript.trim().toLowerCase();
        console.log('User said:', t);
        if (this.checkGlobal(t)) { finish(() => {}); return; }
        finish(() => resolve(t));
      };

      r.onerror = (e) => {
        if (e.error === 'no-speech') { try { r.start(); } catch(x) {} return; }
        if (e.error === 'aborted') return;
        finish(() => reject(e.error));
      };

      r.onend = () => { if (!done) { try { r.start(); } catch(x) {} } };

      setTimeout(() => { try { r.start(); } catch(x) {} }, 150);
    });
  },

  async ask(prompt) {
    await this.speak(prompt);
    await new Promise(r => setTimeout(r, 350));
    return await this.listen();
  }
};