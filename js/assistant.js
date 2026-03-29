var Assistant = {

  async load() {
    await VoiceEngine.speak('AI assistant ready. Ask me anything about livestock, crops, or farming.');
    this.voiceInput();
  },

  async sendMessage() {
    const input = document.getElementById('chat-input');
    if (!input) return;
    const message = input.value.trim();
    if (!message || message.length === 0) {
      await VoiceEngine.speak('Please ask a question.');
      return;
    }
    input.value = '';
    this.addBubble(message, 'user');
    await this.getResponse(message);
  },

  async voiceInput(retries = 0) {
    const micBtn = document.getElementById('mic-btn');
    if (retries > 3) {
      if (micBtn) micBtn.classList.remove('listening');
      await VoiceEngine.speak('Could not understand. Returning to main menu.');
      App.goTo('home');
      Home.load();
      return;
    }
    
    if (micBtn) micBtn.classList.add('listening');
    try {
      const message = await VoiceEngine.listen();
      if (micBtn) micBtn.classList.remove('listening');
      if (!message) {
        await this.voiceInput(retries + 1);
        return;
      }
      this.addBubble(message, 'user');
      await this.getResponse(message);
    } catch (e) {
      if (micBtn) micBtn.classList.remove('listening');
      if (e === 'handled_global') return;
      console.error('Voice input error:', e);
      await new Promise(r => setTimeout(r, 1000));
      await this.voiceInput(retries + 1);
    }
  },

  async getResponse(message) {
    const thinking = this.addBubble('Thinking...', 'assistant');

    try {
      const answer = await ClaudeAPI.askClaude(message);

      this.lastAnswer = answer;

      thinking.textContent = answer;

      const container = document.getElementById('chat-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }

      await VoiceEngine.speak(answer);
      await this.promptFollowUp();

    } catch (e) {
      console.error('Claude error:', e);

      thinking.textContent = 'Sorry, I could not get a response.';

      await VoiceEngine.speak('Sorry, I could not get a response.');
      await this.voiceInput();
    }
  },


  async promptFollowUp() {
  try {
    const followUp = await VoiceEngine.ask(
      'Say yes for another question, repeat to hear again, or menu to go back.',
      20000
    );

    const f = (followUp || '').toLowerCase();

    if (f.includes('menu')) {
      App.goTo('home');
      Home.load();
    } else if (f.includes('yes')) {
      await VoiceEngine.speak('What is your question?');
      this.voiceInput();
    } else if (f.includes('repeat')) {
      await VoiceEngine.speak(this.lastAnswer || 'No previous answer.');
      await this.promptFollowUp();
    } else {
      await VoiceEngine.speak('I did not catch that. Please say yes, repeat, or menu.');
      await this.promptFollowUp();
    }

  } catch (e) {
    if (e === 'handled_global') return;
    App.goTo('home');
    Home.load();
  }
},

  
  addBubble(text, sender) {
    const container = document.getElementById('chat-container');
    if (!container) return { textContent: () => {} };
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}-bubble`;
    bubble.textContent = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
  }

};