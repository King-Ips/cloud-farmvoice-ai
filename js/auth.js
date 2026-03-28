var Auth = {

  currentPin: '',
  globalInstructionsShown: false,

  // ── INPUT VALIDATION HELPERS ──────────────────────
  _validateName(name) {
    if (!name || typeof name !== 'string') return false;
    name = name.trim();
    if (name.length < 2 || name.length > 50) return false;
    return /^[a-zA-Z\s'-]+$/.test(name);
  },

  _validatePin(pin) {
    if (!pin || typeof pin !== 'string') return false;
    const cleaned = pin.replace(/\D/g, '');
    return cleaned.length === 4;
  },

  _sanitizeName(name) {
    if (!name) return '';
    return name
      .trim()
      .slice(0, 50)
      .replace(/[^a-zA-Z\s'-]/g, '');
  },

  async playGlobalIntroduction() {
    const intro = `Welcome to FarmVoice AI. Before you continue, here are global commands that work anywhere in the app at any time. Say repeat to hear the current options again. Say go back to return to the previous screen. Say menu to go to the main menu. Say logout to exit the app. These commands work everywhere, always.`;
    await VoiceEngine.speak(intro);
    
    await new Promise(r => setTimeout(r, 500));
    await VoiceEngine.speak('Would you like to hear these instructions again? Say yes or no. If you do not respond, we will continue.');
    
    try {
      const response = await VoiceEngine.listen(5000);
      if (response && response.includes('yes')) {
        await this.playGlobalIntroduction();
      } else {
        this.globalInstructionsShown = true;
      }
    } catch(e) {
      this.globalInstructionsShown = true;
    }
  },

  showLogin() {
    VoiceEngine.stopListening();
    document.getElementById('view-login').classList.add('active');
    document.getElementById('view-register').classList.remove('active');
    const kbView = document.getElementById('view-register-keyboard');
    if (kbView) kbView.classList.remove('active');
  },

  showRegister() {
    VoiceEngine.stopListening();
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-register').classList.add('active');
    const kbView = document.getElementById('view-register-keyboard');
    if (kbView) kbView.classList.remove('active');
  },

  showKeyboardRegistration() {
    VoiceEngine.stopListening();
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-register').classList.remove('active');
    document.getElementById('view-register-keyboard').classList.add('active');
  },

  async submitKeyboardRegistration() {
    const name = document.getElementById('reg-name').value;
    const surname = document.getElementById('reg-surname').value;
    const pin = document.getElementById('reg-pin').value;

    if (!this._validateName(name)) {
      alert('Please enter a valid first name.');
      return;
    }
    if (!this._validateName(surname)) {
      alert('Please enter a valid surname.');
      return;
    }
    if (!this._validatePin(pin)) {
      alert('Please enter a valid 4-digit PIN.');
      return;
    }

    const saved = FarmStorage.saveUser(this._sanitizeName(name), this._sanitizeName(surname), pin);
    if (!saved) {
      alert('Failed to save your account. Please try again.');
      return;
    }

    alert(`Account created successfully! Welcome ${name}.`);
    this.globalInstructionsShown = true;
    this.speakGlobalInstructions(name);
  },

  async autoVoiceLogin() {
    const user = FarmStorage.getUser();
    if (!user) {
      await VoiceEngine.speak('No account found. Please create one.');
      await this.startRegistration();
      return;
    }
    if (!this.globalInstructionsShown) {
      await this.playGlobalIntroduction();
    }
    await VoiceEngine.speak(`Welcome back ${user.name}. Please say your 4 digit PIN.`);
    await new Promise(r => setTimeout(r, 500));
    await this.listenForPin();
  },

  async listenForPin() {
    const user = FarmStorage.getUser();
    if (!user || !user.pinHash) {
      await VoiceEngine.speak('Account data is corrupted. Please try again.');
      await this.startRegistration();
      return;
    }
    try {
      const response = await VoiceEngine.listen(20000);  // 20 second timeout for PIN entry
      const pin = response.replace(/\D/g, '').slice(0, 4);
      if (FarmStorage.verifyPin(pin, user.pinHash)) {
        await VoiceEngine.speak('PIN accepted.');
        await this.speakGlobalInstructions(user.name);
      } else {
        await VoiceEngine.speak('Incorrect PIN. Please try again.');
        // Don't infinitely loop on error, let them use the pin pad
      }
    } catch (e) {
      if (e === 'handled_global') return;
      console.warn('Voice pin entry failed or timed out:', e);
      // Let them use the manual PIN pad
    }
  },

  async speakGlobalInstructions(name) {
    await VoiceEngine.speak(`Welcome ${name}. You are now logged into FarmVoice AI.`);
    await new Promise(r => setTimeout(r, 300));
    App.goTo('home');
    Home.load();
  },

  pinPress(num) {
    if (this.currentPin.length < 4) {
      this.currentPin += num;
      this.updatePinDisplay();
      if (this.currentPin.length === 4) setTimeout(() => this.pinSubmit(), 300);
    }
  },

  pinClear() {
    this.currentPin = this.currentPin.slice(0, -1);
    this.updatePinDisplay();
  },

  updatePinDisplay() {
    const display = document.getElementById('pin-display');
    const filled = '● '.repeat(this.currentPin.length);
    const empty = '_ '.repeat(4 - this.currentPin.length);
    display.textContent = (filled + empty).trim();
  },

  pinSubmit() {
    const user = FarmStorage.getUser();
    if (!user || !user.pinHash) {
      VoiceEngine.speak('Account error. Please restart.');
      return;
    }
    if (FarmStorage.verifyPin(this.currentPin, user.pinHash)) {
      VoiceEngine.speak('PIN accepted.').then(() => {
        this.speakGlobalInstructions(user.name);
      });
    } else {
      VoiceEngine.speak('Incorrect PIN. Please try again.');
      this.currentPin = '';
      this.updatePinDisplay();
    }
  },

  voiceLogin() { this.autoVoiceLogin(); },

  async startRegistration() {
    const prompt = document.getElementById('register-prompt');
    try {
      if (!this.globalInstructionsShown) {
        await this.playGlobalIntroduction();
      }
      prompt.textContent = 'Listening for your first name...';
      this.setDot(0);
      const nameRaw = await VoiceEngine.ask('What is your first name?', 25000);
      
      if (!this._validateName(nameRaw)) {
        await VoiceEngine.speak('I could not understand that name. Let us try again.');
        await this.startRegistration();
        return;
      }
      const name = this._sanitizeName(nameRaw);
      prompt.textContent = `First name: ${name}`;
      await VoiceEngine.speak(`Nice to meet you ${name}.`);

      this.setDot(1);
      prompt.textContent = 'Listening for your surname...';
      const surnameRaw = await VoiceEngine.ask('What is your surname?', 25000);
      
      if (!this._validateName(surnameRaw)) {
        await VoiceEngine.speak('I could not understand that surname. Let us try again.');
        await this.startRegistration();
        return;
      }
      const surname = this._sanitizeName(surnameRaw);
      prompt.textContent = `Name: ${name} ${surname}`;
      await VoiceEngine.speak(`${name} ${surname}. Great.`);

      this.setDot(2);
      prompt.textContent = 'Listening for your PIN...';
      const pinRaw = await VoiceEngine.ask('Please say a 4 digit PIN. For example: 1 2 3 4.', 25000);
      
      if (!this._validatePin(pinRaw)) {
        await VoiceEngine.speak('I could not hear a clear 4 digit PIN. Let us try again.');
        await this.startRegistration();
        return;
      }
      const pin = pinRaw.replace(/\D/g, '').slice(0, 4);

      if (pin.length < 4) {
        await VoiceEngine.speak('I could not hear a clear PIN. Let us try again.');
        await this.startRegistration();
        return;
      }

      const confirmRaw = await VoiceEngine.ask(`You said ${pin.split('').join(' ')}. Say yes to confirm or no to try again.`, 20000);
      if (confirmRaw.includes('no')) {
        await VoiceEngine.speak('No problem. Let us try again.');
        await this.startRegistration();
        return;
      }

      const saved = FarmStorage.saveUser(name, surname, pin);
      if (!saved) {
        await VoiceEngine.speak('Failed to save your account. Please try again.');
        await this.startRegistration();
        return;
      }
      
      prompt.textContent = `Welcome ${name} ${surname}!`;
      this.setDot(2);

      await VoiceEngine.speak(`Account created! Welcome to FarmVoice AI ${name}.`);
      await this.speakGlobalInstructions(name);

    } catch (e) {
      if (e === 'handled_global') return;
      console.error('Registration error:', e);
      prompt.textContent = 'Something went wrong. Please try again.';
      await VoiceEngine.speak('Something went wrong. Let us try again.');
    }
  },

  setDot(index) {
    document.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i <= index);
    });
  }
};