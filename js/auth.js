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

  _extractPin(str) {
    if (!str) return '';
    const map = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
      'oh': '0'
    };
    let result = str.toLowerCase();
    for (const [word, digit] of Object.entries(map)) {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      result = result.replace(regex, digit);
    }
    return result.replace(/\D/g, '');
  },

  _validatePin(pin) {
    if (!pin || typeof pin !== 'string') return false;
    return this._extractPin(pin).length >= 4;
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
    await this.listenForPin();
  },

  async listenForPin() {
    const user = FarmStorage.getUser();
    if (!user || !user.pinHash) {
      await VoiceEngine.speak('Account data is corrupted. Please try again.');
      await this.startRegistration();
      return;
    }
    
    let attempts = 0;
    while (attempts < 3) {
      try {
        const promptText = attempts === 0 
           ? `Welcome back ${user.name}. Please say your 4 digit PIN. For example: 1 2 3 4.` 
           : `Please say your 4 digit PIN again.`;
        const response = await VoiceEngine.ask(promptText, 25000);
        const pin = this._extractPin(response).slice(0, 4);
        
        if (pin.length === 4 && FarmStorage.verifyPin(pin, user.pinHash)) {
          await VoiceEngine.speak('PIN accepted. Logging you in.');
          await this.speakGlobalInstructions(user.name);
          return;
        } else if (pin.length === 4) {
          attempts++;
          if (attempts < 3) {
            await VoiceEngine.speak('Incorrect PIN. Please try again.');
          } else {
            await VoiceEngine.speak('Too many failed attempts. Please use the keyboard to enter your PIN.');
          }
        } else {
          attempts++;
          if (attempts < 3) {
            await VoiceEngine.speak('I could not hear a clear 4 digit PIN. Please try again.');
          } else {
            await VoiceEngine.speak('Too many failed attempts. Please use the keyboard to enter your PIN.');
          }
        }
      } catch (e) {
        if (e === 'handled_global') return;
        
        attempts++;
        console.warn('Voice pin entry failed or timed out:', e);
        if (attempts < 3) {
          await VoiceEngine.speak('I did not catch that clearly. Please try again.');
        } else {
          await VoiceEngine.speak('Too many failed attempts. Please use the keyboard to enter your PIN.');
        }
      }
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
      
      let name = '';
      let nameAttempts = 0;
      this.setDot(0);
      while (!name && nameAttempts < 3) {
        prompt.textContent = 'Listening for your first name...';
        try {
          const nameRaw = await VoiceEngine.ask('What is your first name?', 25000);
          if (this._validateName(nameRaw)) {
            name = this._sanitizeName(nameRaw);
            prompt.textContent = `First name: ${name}`;
            await VoiceEngine.speak(`Nice to meet you ${name}.`);
          } else {
            nameAttempts++;
            if (nameAttempts < 3) {
              await VoiceEngine.speak('I could not understand that name. Let us try again.');
              await new Promise(r => setTimeout(r, 500));
            }
          }
        } catch(e) {
          if (e === 'handled_global') return;
          nameAttempts++;
          console.warn('Name input error:', e);
          if (nameAttempts < 3) {
            await VoiceEngine.speak('I did not catch your name clearly. Let us try again.');
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
      if (!name) {
        await VoiceEngine.speak('Too many failed attempts. Please use the keyboard to register.');
        this.showKeyboardRegistration();
        return;
      }

      let surname = '';
      let surnameAttempts = 0;
      this.setDot(1);
      while (!surname && surnameAttempts < 3) {
        prompt.textContent = 'Listening for your surname...';
        try {
          const surnameRaw = await VoiceEngine.ask('What is your surname?', 25000);
          if (this._validateName(surnameRaw)) {
            surname = this._sanitizeName(surnameRaw);
            prompt.textContent = `Name: ${name} ${surname}`;
            await VoiceEngine.speak(`${name} ${surname}. Great.`);
          } else {
            surnameAttempts++;
            if (surnameAttempts < 3) {
              await VoiceEngine.speak('I could not understand that surname. Let us try again.');
              await new Promise(r => setTimeout(r, 500));
            }
          }
        } catch(e) {
          if (e === 'handled_global') return;
          surnameAttempts++;
          console.warn('Surname input error:', e);
          if (surnameAttempts < 3) {
            await VoiceEngine.speak('I did not catch your surname clearly. Let us try again.');
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
      if (!surname) {
        await VoiceEngine.speak('Too many failed attempts. Please use the keyboard to register.');
        this.showKeyboardRegistration();
        return;
      }

      let pin = '';
      let pinAttempts = 0;
      this.setDot(2);
      while (!pin && pinAttempts < 3) {
        prompt.textContent = 'Listening for your PIN...';
        try {
          const pinRaw = await VoiceEngine.ask('Please say a 4 digit PIN. For example: 1 2 3 4.', 25000);
          if (this._validatePin(pinRaw)) {
            const extracted = this._extractPin(pinRaw);
            const tempPin = extracted.slice(0, 4);
            try {
              const confirmRaw = await VoiceEngine.ask(`You said ${tempPin.split('').join(' ')}. Say yes to confirm or no to try again.`, 20000);
              if (confirmRaw.includes('yes')) {
                pin = tempPin;
                await VoiceEngine.speak('PIN confirmed. Setting up your account.');
              } else if (confirmRaw.includes('no')) {
                await VoiceEngine.speak('No problem. Let us try again.');
                await new Promise(r => setTimeout(r, 500));
              } else {
                pinAttempts++;
                if (pinAttempts < 3) {
                  await VoiceEngine.speak('I did not catch your response. Please say yes to confirm or no to try again.');
                  await new Promise(r => setTimeout(r, 500));
                }
              }
            } catch (confirmError) {
              if (confirmError === 'handled_global') return;
              console.warn('PIN confirmation error:', confirmError);
              pinAttempts++;
              if (pinAttempts < 3) {
                await VoiceEngine.speak('I did not catch your response clearly. Let us try the PIN again.');
                await new Promise(r => setTimeout(r, 1000));
              }
            }
          } else {
            pinAttempts++;
            if (pinAttempts < 3) {
              await VoiceEngine.speak('I could not hear a clear 4 digit PIN. Let us try again.');
              await new Promise(r => setTimeout(r, 500));
            }
          }
        } catch(e) {
          if (e === 'handled_global') return;
          pinAttempts++;
          console.warn('Pin input error:', e);
          if (pinAttempts < 3) {
            await VoiceEngine.speak('I did not catch your PIN clearly. Let us try again.');
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
      if (!pin) {
        await VoiceEngine.speak('Too many failed attempts. Please use the keyboard to register.');
        this.showKeyboardRegistration();
        return;
      }

      const saved = FarmStorage.saveUser(name, surname, pin);
      if (!saved) {
        await VoiceEngine.speak('Failed to save your account. Please try again.');
        prompt.textContent = 'Failed to save account.';
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