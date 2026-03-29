var Tracker = {
  
  getLogs() {
    try {
      const data = localStorage.getItem('fv_logs');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveLogs(logs) {
    localStorage.setItem('fv_logs', JSON.stringify(logs));
  },

  logActivity(text) {
    const logs = this.getLogs();
    logs.push({
      id: Date.now().toString(),
      text: text,
      date: new Date().toLocaleString()
    });
    // Keep last 50 logs
    if (logs.length > 50) logs.shift();
    this.saveLogs(logs);
  },

  load() {
    const logs = this.getLogs();
    const container = document.getElementById('tracker-list');
    container.innerHTML = '';

    if (logs.length === 0) {
      container.innerHTML = '<div class="empty-state">No recent activity. Tap Add to log an event.</div>';
    } else {
      // Reverse to show newest first
      logs.slice().reverse().forEach(log => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
          <div class="category-info">
            <div class="category-name">${log.text}</div>
            <div class="category-count">${log.date}</div>
          </div>
        `;
        container.appendChild(card);
      });
    }

    this.speakLogs(logs);
  },

  async speakLogs(logs) {
    let message = '';
    if (logs.length === 0) {
      message = 'You have no recent farm activity logged. Say add to add a log entry.';
    } else {
      message = `You have ${logs.length} recent activity logs. `;
      const recent = logs.slice(-3).reverse();
      message += `Most recent: `;
      recent.forEach(l => { message += `${l.text} on ${l.date.split(',')[0]}. `; });
      message += 'Say add to record a new activity, or menu to go back.';
    }
    
    await VoiceEngine.speak(message);
    this.listenForChoice();
  },

  async listenForChoice(retries = 0) {
    if (retries > 3) {
      await VoiceEngine.speak('No valid command. Returning to home.');
      App.goTo('home');
      Home.load();
      return;
    }
    
    try {
      const choice = await VoiceEngine.listen();
      if (choice.includes('add')) {
        await this.startAddLog();
        return;
      }
      if (choice.includes('menu') || choice.includes('home')) {
        App.goTo('home');
        Home.load();
        return;
      }
      
      await VoiceEngine.speak('Say add to record an activity, or menu to go back.');
      await this.listenForChoice(retries + 1);
    } catch(e) {
      if (e === 'aborted' || e === 'handled_global') return;
      await new Promise(r => setTimeout(r, 800));
      await this.listenForChoice(retries + 1);
    }
  },

  startAddLog() {
    VoiceEngine.stopListening();
    this.startAddLog();
  },

  async startAddLog() {
    try {
      const logText = await VoiceEngine.ask('What activity would you like to log? For example, fixed fence, or bought feed.');
      if (logText) {
        this.logActivity(logText.charAt(0).toUpperCase() + logText.slice(1));
        await VoiceEngine.speak('Activity logged successfully.');
      }
      this.load();
    } catch(e) {
      if (e === 'handled_global') return;
      await VoiceEngine.speak('Action cancelled.');
      this.load();
    }
  }
};
