var Assistant = {

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    this.addBubble(message, 'user');
    await this.getResponse(message);
  },

  async voiceInput() {
    const micBtn = document.getElementById('mic-btn');
    micBtn.classList.add('listening');
    try {
      const message = await VoiceEngine.listen();
      micBtn.classList.remove('listening');
      if (!message) return;
      this.addBubble(message, 'user');
      await this.getResponse(message);
    } catch (e) {
      micBtn.classList.remove('listening');
      console.error(e);
    }
  },

  async getResponse(message) {
    const thinking = this.addBubble('Thinking...', 'assistant');
    const answer = await ClaudeAPI.askClaude(message);
    thinking.textContent = answer;

    const container = document.getElementById('chat-container');
    container.scrollTop = container.scrollHeight;

    await VoiceEngine.speak(answer);

    // Ask for follow up
    try {
      const followUp = await VoiceEngine.ask('Do you have another question? Or say menu to go back.');
      if (followUp.includes('menu')) {
        App.goTo('home');
        Home.load();
      } else if (!followUp.includes('no') && followUp.length > 3) {
        this.addBubble(followUp, 'user');
        await this.getResponse(followUp);
      } else {
        App.goTo('home');
        Home.load();
      }
    } catch (e) {
      console.error(e);
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