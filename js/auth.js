var Auth = {

  currentPin: '',

  showLogin() {
    document.getElementById('view-login').classList.add('active');
    document.getElementById('view-register').classList.remove('active');
  },

  showRegister() {
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-register').classList.add('active');
  },

  // ── AUTO VOICE LOGIN ─────────────────────────────────────────
  // Runs automatically after tap — no button needed
  async autoVoiceLogin() {
    const user = FarmStorage.getUser();
    await VoiceEngine.speak(`Welcome back ${user.name}. Please say your 4 digit PIN.`);
    await this.listenForPin();
  },

  async listenForPin() {
    const user = FarmStorage.getUser();
    try {
      const response = await VoiceEngine.listen();
      const pin = response.replace(/\D/g, '').slice(0, 4);

      if (pin === user.pin) {
        await VoiceEngine.speak(`Welcome back ${user.name}. Your farm is ready.`);
        App.goTo('home');
        Home.load();
      } else {
        await VoiceEngine.speak('Incorrect PIN. Please try again.');
        await this.listenForPin();
      }
    } catch (e) {
      await VoiceEngine.speak('Could not hear you. Please try again.');
      await this.listenForPin();
    }
  },

  // ── PIN PAD (backup for sighted users) ───────────────────────
  pinPress(num) {
    if (this.currentPin.length < 4) {
      this.currentPin += num;
      this.updatePinDisplay();
      if (this.currentPin.length === 4) {
        setTimeout(() => this.pinSubmit(), 300);
      }
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
    if (this.currentPin === user.pin) {
      VoiceEngine.speak(`Welcome back ${user.name}`);
      setTimeout(() => {
        App.goTo('home');
        Home.load();
      }, 800);
    } else {
      VoiceEngine.speak('Incorrect PIN. Please try again.');
      this.currentPin = '';
      this.updatePinDisplay();
    }
  },

  voiceLogin() {
    this.autoVoiceLogin();
  },

  // ── REGISTRATION ─────────────────────────────────────────────
  // Runs automatically — fully voice driven
  async startRegistration() {
    const prompt = document.getElementById('register-prompt');

    try {
      // Welcome
      await VoiceEngine.speak('Welcome to FarmVoice AI. I will help you set up your account. Let\'s get started.');

      // Step 1 — name
      prompt.textContent = 'Listening for your first name...';
      this.setDot(0);
      const name = await VoiceEngine.ask('What is your first name?');
      prompt.textContent = `First name: ${name}`;
      await VoiceEngine.speak(`Nice to meet you ${name}.`);

      // Step 2 — surname
      this.setDot(1);
      prompt.textContent = 'Listening for your surname...';
      const surname = await VoiceEngine.ask('What is your surname?');
      prompt.textContent = `Name: ${name} ${surname}`;
      await VoiceEngine.speak(`${name} ${surname}. Great.`);

      // Step 3 — PIN
      this.setDot(2);
      prompt.textContent = 'Listening for your PIN...';
      const pinRaw = await VoiceEngine.ask('Please say a 4 digit PIN you will use to log in. For example: 1 2 3 4.');
      const pin = pinRaw.replace(/\D/g, '').slice(0, 4);

      if (pin.length < 4) {
        await VoiceEngine.speak('I could not hear a clear 4 digit PIN. Let\'s try again.');
        await this.startRegistration();
        return;
      }

      // Confirm PIN
      const confirmRaw = await VoiceEngine.ask(`You said ${pin.split('').join(' ')}. Say yes to confirm or no to try again.`);

      if (confirmRaw.includes('no')) {
        await VoiceEngine.speak('No problem. Let\'s try again.');
        await this.startRegistration();
        return;
      }

      // Save account
      FarmStorage.saveUser(name, surname, pin);
      prompt.textContent = `Welcome ${name} ${surname}!`;
      this.setDot(2);

      // Welcome and explain features
      await VoiceEngine.speak(`Account created! Welcome to FarmVoice AI ${name}.`);
      await VoiceEngine.speak('Here is what you can do. Say: my livestock to manage your animals. Say: AI assistant to ask farming questions. Say: add animal to add a new animal.');

      // Go to home
      App.goTo('home');
      Home.load();

    } catch (e) {
      console.error('Registration error:', e);
      prompt.textContent = 'Something went wrong. Please try again.';
      await VoiceEngine.speak('Something went wrong. Let\'s try again.');
      //dont call the search engine
    }
  },

  setDot(index) {
    document.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('active', i <= index);
    });
  }

};