var Assistant = {

  async load() {
    await VoiceEngine.speak('AI Assistant ready. What is your farming question? You can ask about animal health, vaccination, feeding, or current farming news.');
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
      await VoiceEngine.speak('Could not understand. Returning to main menu.');
      App.goTo('home');
      Home.load();
      return;
    }
    
    micBtn.classList.add('listening');
    try {
      const message = await VoiceEngine.listen();
      micBtn.classList.remove('listening');
      if (!message) {
        await this.voiceInput(retries + 1);
        return;
      }
      this.addBubble(message, 'user');
      await this.getResponse(message);
    } catch (e) {
      micBtn.classList.remove('listening');
      console.error('Voice input error:', e);
      await new Promise(r => setTimeout(r, 1000));
      await this.voiceInput(retries + 1);
    }
  },

  async getResponse(message) {
    const thinking = this.addBubble('Thinking...', 'assistant');
    const answer = await ClaudeAPI.askClaude(message);
    thinking.textContent = answer;

    const container = document.getElementById('chat-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }

    await VoiceEngine.speak(answer);
    await this.promptFollowUp();
  },

  async promptFollowUp() {
    try {
      const followUp = await VoiceEngine.ask('Say yes for another question, repeat to hear the answer again, or menu to go back.', 20000);
      if (followUp.includes('menu')) {
        App.goTo('home');
        Home.load();
      } else if (followUp.includes('yes')) {
        await VoiceEngine.speak('What is your question?');
        this.voiceInput();
      } else {
        App.goTo('home');
        Home.load();
      }
    } catch (e) {
      console.error('Follow up error:', e);
      App.goTo('home');
      Home.load();
    }
  },

  addBubble(text, sender) {
    const container = document.getElementById('chat-container');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}-bubble`;
    bubble.textContent = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
  }

};