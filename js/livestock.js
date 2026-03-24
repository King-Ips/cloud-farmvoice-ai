var Livestock = {

  load() {
    const categories = FarmStorage.getCategories();
    const container = document.getElementById('category-list');
    container.innerHTML = '';

    let totalAnimals = 0;
    categories.forEach(cat => {
      totalAnimals += FarmStorage.getAnimals(cat).length;
    });

    if (categories.length === 0) {
      container.innerHTML = '<div class="empty-state">No categories yet. Say add to get started.</div>';
    } else {
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
    }

    this.speakLivestockMenu(categories, totalAnimals);
  },

  async speakLivestockMenu(categories, totalAnimals) {
    let message = '';

    if (categories.length === 0) {
      message = 'You have no livestock yet. ';
    } else {
      message = `You have ${totalAnimals} animal${totalAnimals !== 1 ? 's' : ''} across ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}. `;
      categories.forEach(cat => {
        const count = FarmStorage.getAnimals(cat).length;
        message += `${cat}: ${count}. `;
      });
    }

    message += 'Say add to add an animal. Say read all to hear everything. Say delete to remove an animal or category. Say repeat to hear this again. Say menu to go back.';

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

      if (choice.includes('repeat')) {
        let totalAnimals = 0;
        categories.forEach(cat => totalAnimals += FarmStorage.getAnimals(cat).length);
        await this.speakLivestockMenu(categories, totalAnimals);
        return;
      }

      if (choice.includes('add')) {
        await this.handleAddAnimal(categories);
        return;
      }

      if (choice.includes('read all') || choice.includes('read everything') || choice.includes('read')) {
        await this.readAllAnimals(categories);
        return;
      }

      if (choice.includes('delete') || choice.includes('remove')) {
        await this.handleDelete(categories);
        return;
      }

      await VoiceEngine.speak('Say add, read all, delete, repeat, or menu.');
      this.listenForChoice(categories);

    } catch (e) {
      console.error('Livestock error:', e);
      if (e === 'aborted') return;
      await new Promise(r => setTimeout(r, 800));
      this.listenForChoice(categories);
    }
  },

  async handleAddAnimal(categories) {
    if (categories.length === 0) {
      await VoiceEngine.speak('You have no categories yet. What type of livestock do you have? Say cows, goats, sheep, or chickens.');
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
      const match = categories.find(cat => catChoice.includes(cat.toLowerCase()));
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
      await VoiceEngine.speak('You have no animals yet. Say add to add your first animal.');
      this.listenForChoice(categories);
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

    message += `Total: ${totalCount} animal${totalCount !== 1 ? 's' : ''}. Say repeat to hear again or say menu to go back.`;
    await VoiceEngine.speak(message);
    this.listenForChoice(categories);
  },

  async handleDelete(categories) {
    if (categories.length === 0) {
      await VoiceEngine.speak('You have nothing to delete yet.');
      this.listenForChoice(categories);
      return;
    }

    await VoiceEngine.speak('Would you like to delete an animal or a category? Say animal or category.');
    const choice = await VoiceEngine.listen();

    if (choice.includes('animal')) {
      await this.deleteAnimal(categories);
    } else if (choice.includes('category')) {
      await this.deleteCategory(categories);
    } else {
      await VoiceEngine.speak('Say animal or category.');
      await this.handleDelete(categories);
    }
  },

  async deleteAnimal(categories) {
    await VoiceEngine.speak('Which category is the animal in?');
    const catChoice = await VoiceEngine.listen();
    const cat = categories.find(c => catChoice.includes(c.toLowerCase()));

    if (!cat) {
      await VoiceEngine.speak('I did not recognise that category. Going back.');
      this.load();
      return;
    }

    const animals = FarmStorage.getAnimals(cat);
    if (animals.length === 0) {
      await VoiceEngine.speak(`You have no animals in ${cat}.`);
      this.load();
      return;
    }

    const names = animals.map(a => a.name).join(', ');
    await VoiceEngine.speak(`You have ${names} in ${cat}. Which animal would you like to delete?`);
    const nameChoice = await VoiceEngine.listen();
    const animal = animals.find(a => nameChoice.includes(a.name.toLowerCase()));

    if (!animal) {
      await VoiceEngine.speak('I did not recognise that animal name. Going back.');
      this.load();
      return;
    }

    await VoiceEngine.speak(`Are you sure you want to delete ${animal.name}? Say yes or no.`);
    const confirm = await VoiceEngine.listen();

    if (confirm.includes('yes')) {
      const updated = animals.filter(a => a.id !== animal.id);
      FarmStorage.saveAnimals(cat, updated);
      await VoiceEngine.speak(`${animal.name} has been deleted.`);
    } else {
      await VoiceEngine.speak('Cancelled.');
    }

    this.load();
  },

  async deleteCategory(categories) {
    const catList = categories.join(', ');
    await VoiceEngine.speak(`You have ${catList}. Which category would you like to delete?`);
    const choice = await VoiceEngine.listen();
    const cat = categories.find(c => choice.includes(c.toLowerCase()));

    if (!cat) {
      await VoiceEngine.speak('I did not recognise that category. Going back.');
      this.load();
      return;
    }

    const animals = FarmStorage.getAnimals(cat);
    await VoiceEngine.speak(`Are you sure you want to delete ${cat} and all ${animals.length} animals in it? Say yes or no.`);
    const confirm = await VoiceEngine.listen();

    if (confirm.includes('yes')) {
      const updated = categories.filter(c => c !== cat);
      FarmStorage.saveCategories(updated);
      FarmStorage.saveAnimals(cat, []);
      await VoiceEngine.speak(`${cat} has been deleted.`);
    } else {
      await VoiceEngine.speak('Cancelled.');
    }

    this.load();
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