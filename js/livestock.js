var Livestock = {

  load() {
    const categories = FarmStorage.getCategories();
    const container = document.getElementById('category-list');
    container.innerHTML = '';

    if (categories.length === 0) {
      container.innerHTML = '<div class="empty-state">No categories yet. Say add to add one.</div>';
      this.speakMenu([]);
      return;
    }

    categories.forEach(cat => {
      const animals = FarmStorage.getAnimals(cat);
      const card = document.createElement('div');
      card.className = 'category-card';
      card.onclick = () => this.openCategory(cat);
      card.innerHTML = `
        <div class="category-icon">${this.getIcon(cat)}</div>
        <div class="category-info">
          <div class="category-name">${cat}</div>
          <div class="category-count">${animals.length} animal${animals.length !== 1 ? 's' : ''}</div>
        </div>
        <div style="font-size:20px;color:#6B7280">›</div>
      `;
      container.appendChild(card);
    });

    this.speakMenu(categories);
  },

  async speakMenu(categories) {
    if (categories.length === 0) {
      await VoiceEngine.speak('You have no livestock categories yet. Say add cows, add goats, or add chickens to get started. Or say menu to go back.');
    } else {
      const summary = categories.map(cat => {
        const count = FarmStorage.getAnimals(cat).length;
        return `${count} ${cat.toLowerCase()}`;
      }).join(', ');
      await VoiceEngine.speak(`You have ${summary}. Say the category name to open it, say add to add a new category, or say menu to go back.`);
    }
    this.listenForChoice(categories);
  },

  async listenForChoice(categories) {
    try {
      const choice = await VoiceEngine.listen();
      console.log('Livestock choice:', choice);

      if (choice.includes('menu')) {
        App.goTo('home');
        Home.load();
        return;
      }

      if (choice.includes('add')) {
        await this.addCategory();
        return;
      }

      // Check if user said a category name
      const match = categories.find(cat =>
        choice.includes(cat.toLowerCase())
      );

      if (match) {
        this.openCategory(match);
      } else {
        await VoiceEngine.speak('Sorry I did not understand. Say a category name, add, or menu.');
        this.listenForChoice(categories);
      }

    } catch (e) {
      console.error(e);
      await new Promise(r => setTimeout(r, 1000));
      this.listenForChoice(categories);
    }
  },

  getIcon(category) {
    const icons = {
      'Cows': '🐄', 'Cattle': '🐄',
      'Goats': '🐐', 'Sheep': '🐑',
      'Chickens': '🐔', 'Pigs': '🐷',
      'Horses': '🐴', 'Ducks': '🦆'
    };
    return icons[category] || '🐾';
  },

  openCategory(category) {
    App.currentCategory = category;
    document.getElementById('animal-list-title').textContent = category;
    App.goTo('animal-list');
    Animal.loadList(category);
  },

  async addCategory() {
    try {
      const name = await VoiceEngine.ask('What type of livestock would you like to add? Say cows, goats, sheep, or chickens.');
      const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      FarmStorage.addCategory(formatted);
      await VoiceEngine.speak(`${formatted} added to your farm.`);
      this.load();
    } catch (e) {
      console.error(e);
      this.load();
    }
  }

};