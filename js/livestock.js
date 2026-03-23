var Livestock = {

  load() {
    const categories = FarmStorage.getCategories();
    const container = document.getElementById('category-list');
    container.innerHTML = '';

    // Calculate totals
    let totalAnimals = 0;
    categories.forEach(cat => {
      totalAnimals += FarmStorage.getAnimals(cat).length;
    });

    if (categories.length === 0) {
      container.innerHTML = '<div class="empty-state">No categories yet. Say add category to get started.</div>';
      this.speakSummary(categories, totalAnimals);
      return;
    }

    // Build category cards on screen
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

    this.speakSummary(categories, totalAnimals);
  },

  async speakSummary(categories, totalAnimals) {
    // Build summary message
    let message = '';

    if (categories.length === 0) {
      message = 'You have no livestock categories yet.';
    } else {
      message = `You have ${categories.length} livestock categor${categories.length !== 1 ? 'ies' : 'y'} and ${totalAnimals} animal${totalAnimals !== 1 ? 's' : ''} in total. `;
      categories.forEach(cat => {
        const count = FarmStorage.getAnimals(cat).length;
        message += `${cat}: ${count} animal${count !== 1 ? 's' : ''}. `;
      });
    }

    message += 'What would you like to do? Say add category, add animal, read all, a category name, or menu to go back.';
    await VoiceEngine.speak(message);
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

      if (choice.includes('add category')) {
        await this.addCategory();
        return;
      }

      if (choice.includes('add animal') || choice.includes('add')) {
        await this.handleAddAnimal(categories);
        return;
      }

      if (choice.includes('read all') || choice.includes('read everything')) {
        await this.readAllAnimals(categories);
        return;
      }

      // Check if user said a category name
      const match = categories.find(cat =>
        choice.includes(cat.toLowerCase())
      );

      if (match) {
        this.openCategory(match);
        return;
      }

      await VoiceEngine.speak('Sorry I did not understand. Say add category, add animal, read all, a category name, or menu.');
      this.listenForChoice(categories);

    } catch (e) {
      console.error(e);
      await new Promise(r => setTimeout(r, 1000));
      this.listenForChoice(categories);
    }
  },

  async handleAddAnimal(categories) {
    if (categories.length === 0) {
      await VoiceEngine.speak('You have no categories yet. Please add a category first. Say the category name like cows or goats.');
      const catName = await VoiceEngine.listen();
      const formatted = catName.charAt(0).toUpperCase() + catName.slice(1).toLowerCase();
      FarmStorage.addCategory(formatted);
      App.currentCategory = formatted;
    } else if (categories.length === 1) {
      App.currentCategory = categories[0];
    } else {
      const catList = categories.join(', ');
      await VoiceEngine.speak(`Which category? You have ${catList}.`);
      const catChoice = await VoiceEngine.listen();
      const match = categories.find(cat =>
        catChoice.includes(cat.toLowerCase())
      );
      if (match) {
        App.currentCategory = match;
      } else {
        const formatted = catChoice.charAt(0).toUpperCase() + catChoice.slice(1).toLowerCase();
        FarmStorage.addCategory(formatted);
        App.currentCategory = formatted;
      }
    }
    App.goTo('animal-add');
    Animal.startAdd();
  },

  async readAllAnimals(categories) {
    if (categories.length === 0) {
      await VoiceEngine.speak('You have no animals yet.');
      this.load();
      return;
    }

    let message = 'Here are all your animals. ';
    let totalCount = 0;

    categories.forEach(cat => {
      const animals = FarmStorage.getAnimals(cat);
      totalCount += animals.length;
      if (animals.length > 0) {
        message += `${cat}: `;
        animals.forEach(animal => {
          const age = Vaccine.getAge(animal.dob);
          const alerts = Vaccine.getAlerts(animal);
          message += `${animal.name}, ${age}`;
          if (animal.breed && animal.breed !== 'Unknown') message += `, ${animal.breed}`;
          if (alerts.length > 0) message += `, vaccination due`;
          message += '. ';
        });
      }
    });

    message += `Total: ${totalCount} animal${totalCount !== 1 ? 's' : ''}. Say menu to go back or say a category name to open it.`;
    await VoiceEngine.speak(message);
    this.listenForChoice(categories);
  },

  async addCategory() {
    try {
      const name = await VoiceEngine.ask('What type of livestock? Say cows, goats, sheep, chickens, or any other type.');
      const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
      FarmStorage.addCategory(formatted);
      await VoiceEngine.speak(`${formatted} added to your farm.`);
      this.load();
    } catch (e) {
      console.error(e);
      this.load();
    }
  },

  openCategory(category) {
    App.currentCategory = category;
    document.getElementById('animal-list-title').textContent = category;
    App.goTo('animal-list');
    Animal.loadList(category);
  },

  getIcon(category) {
    const icons = {
      'Cows': '🐄', 'Cattle': '🐄',
      'Goats': '🐐', 'Sheep': '🐑',
      'Chickens': '🐔', 'Pigs': '🐷',
      'Horses': '🐴', 'Ducks': '🦆'
    };
    return icons[category] || '🐾';
  }

};