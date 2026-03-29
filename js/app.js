var App = {

  currentScreen: 'loading',
  previousScreen: 'home',
  currentCategory: null,

  goTo(screenName) {

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById('screen-' + screenName);
    if (screen) {
      screen.classList.add('active');
      this.previousScreen = this.currentScreen;
      this.currentScreen = screenName;

      // Auto-load controllers to hydrate screens with data
      if (screenName === 'home' && window.Home) Home.load();
      if (screenName === 'livestock' && window.Livestock) Livestock.load();
      if (screenName === 'crops' && window.Crops) Crops.load();
    }
  },

  goBack() {
    if (this.previousScreen === 'loading' || this.previousScreen === 'auth') {
      this.goTo('home');
    } else {
      this.goTo(this.previousScreen);
    }
  },

  logout() {
    try {
      const user = FarmStorage.getUser();
      const name = user ? user.name : 'Farmer';
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      
      VoiceEngine.speak(`Goodbye ${name}. Your farm is safe.`).then(() => {
        FarmStorage.clearAll();
        location.reload();
      }).catch((e) => {
        console.error('Logout speak error:', e);
        FarmStorage.clearAll();
        location.reload();
      });
    } catch (e) {
      console.error('Logout error:', e);
      FarmStorage.clearAll();
      location.reload();
    }
  },


  handleGlobalCommand(transcript) {
    const t = transcript.toLowerCase().trim();
    
    if (t.includes('menu') || t.includes('home')) {
      this.goTo('home');
      if (window.Home) Home.load();
      VoiceEngine.speak('Going to home menu.');
      return true;
    }
    
    if (t.includes('crop')) {
      this.goTo('crops');
      if (window.Crops) Crops.load();
      VoiceEngine.speak('Going to crops.');
      return true;
    }
    
    if (t.includes('assistant') || t.includes('ai') || t.includes('agent')) {
      this.goTo('assistant');
      if (window.Assistant) Assistant.load();
      VoiceEngine.speak('Opening AI assistant.');
      return true;
    }
    
    if (t.includes('live') || t.includes('stock') || t.includes('animal')) {
      this.goTo('livestock');
      if (window.Livestock) Livestock.load();
      VoiceEngine.speak('Going to livestock.');
      return true;
    }
    
    if (t.includes('back') || t.includes('go back')) {
      this.goBack();
      VoiceEngine.speak('Going back.');
      return true;
    }
    
    if (t.includes('logout') || t.includes('exit') || t.includes('bye')) {
      this.logout();
      return true;
    }
    
    if (t.includes('repeat') || t.includes('again')) {
      VoiceEngine.speak('Global commands: menu, livestock, crops, assistant, back, logout, repeat.');
      return true;
    }
    
    return false;
  },


  async start() {
    this.goTo('loading');
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.showTapToStart();
  },

  showTapToStart() {
    const tap = document.createElement('div');
    tap.id = 'screen-tap';
    tap.style.cssText = `
      position: fixed;
      inset: 0;
      background: linear-gradient(160deg, #2D6A4F, #40916C);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      cursor: pointer;
      color: white;
      text-align: center;
      padding: 40px;
    `;
    tap.innerHTML = `
      <div style="font-size:80px;margin-bottom:24px">🌾</div>
      <h1 style="font-size:32px;font-weight:700;margin-bottom:12px">FarmVoice AI</h1>
      <p style="font-size:18px;opacity:0.9;margin-bottom:48px">Your farm. Your voice. Your AI.</p>
      <div style="
        background:rgba(255,255,255,0.2);
        border:2px solid rgba(255,255,255,0.6);
        border-radius:20px;
        padding:20px 40px;
        font-size:18px;
        font-weight:600;
      ">👆 Tap anywhere to start</div>
      <p style="margin-top:24px;font-size:13px;opacity:0.7">
        Helper taps once — farmer speaks forever
      </p>
    `;

    tap.addEventListener('click', () => {
      tap.remove();
      this.launch();
    });

    document.body.appendChild(tap);
  },

  async launch() {
    const user = FarmStorage.getUser();
    if (user) {
      this.goTo('auth');
      Auth.showLogin();
      // Automatically start voice login — no button needed
      await Auth.autoVoiceLogin();
    } else {
      this.goTo('auth');
      Auth.showRegister();
      // Automatically start registration — no button needed
      await Auth.startRegistration();
    }
  }

};

window.onload = () => App.start();