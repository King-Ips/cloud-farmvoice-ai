var Livestock = {

  load() {
    const categories = FarmStorage.getCategories();
    const container = document.getElementById('category-list');
    container.innerHTML = '';

    let totalAnimals = 0;
    categories.forEach(cat => totalAnimals += FarmStorage.getAnimals(cat).length);

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
    const alerts = Vaccine.getAllAlerts();
    let message = '';

    if (totalAnimals === 0) {
      message = 'You have no animals on your farm yet. ';
    } else {
      message = `You have ${totalAnimals} animal${totalAnimals !== 1 ? 's' : ''} across ${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}. `;
    }

    if (alerts.length > 0) {
      message += `You have ${alerts.length} vaccination${alerts.length > 1 ? 's' : ''} due. `;
    }

    message += `To add a new animal to your farm, say add. `;
    message += `To hear all your animals and vaccination details, say farm updates. `;
    message += `To remove an animal or category, say delete.`;

    await VoiceEngine.speak(message);
    this.listenForChoice(categories);
  },

  async listenForChoice(categories, retries = 0) {
    if (retries > 3) {
      await VoiceEngine.speak('No valid command. Returning to home.');
      App.goTo('home');
      Home.load();
      return;
    }
    
    try {
      const choice = await VoiceEngine.listen(20000);
      console.log('Livestock choice:', choice);

      if (choice.includes('add')) {
        await this.handleAddAnimal(categories);
        return;
      }
      if (choice.includes('farm update') || choice.includes('read') || choice.includes('update')) {
        await this.readAllAnimals(categories);
        return;
      }
      if (choice.includes('delete') || choice.includes('remove')) {
        await this.handleDelete(categories);
        return;
      }

      await VoiceEngine.speak('Say add to add an animal, farm updates to hear all animals, or delete to remove one.');
      await this.listenForChoice(categories, retries + 1);

    } catch (e) {
      if (e === 'aborted') return;
      await new Promise(r => setTimeout(r, 800));
      await this.listenForChoice(categories, retries + 1);
    }
  },

  async handleAddAnimal(categories) {
    if (categories.length === 0) {
      await VoiceEngine.speak('You have no categories yet. What type of livestock do you have? Say cows, goats, sheep, or chickens.');
      try {
        const catName = await VoiceEngine.listen();
        const formatted = catName.charAt(0).toUpperCase() + catName.slice(1).toLowerCase();
        FarmStorage.addCategory(formatted);
        App.currentCategory = formatted;
      } catch(e) { this.load(); return; }
    } else if (categories.length === 1) {
      App.currentCategory = categories[0];
    } else {
      const catList = categories.join(', ');
      await VoiceEngine.speak(`Which category does this animal belong to? You have ${catList}.`);
      try {
        const catChoice = await VoiceEngine.listen();
        const match = categories.find(cat => catChoice.includes(cat.toLowerCase()));
        if (match) {
          App.currentCategory = match;
        } else {
          const formatted = catChoice.charAt(0).toUpperCase() + catChoice.slice(1).toLowerCase();
          FarmStorage.addCategory(formatted);
          App.currentCategory = formatted;
        }
      } catch(e) { this.load(); return; }
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
        message += `In ${cat}: `;
        animals.forEach(animal => {
          const age = Vaccine.getAge(animal.dob);
          const alerts = Vaccine.getAlerts(animal);
          message += `${animal.name}, ${age}`;
          if (animal.breed && animal.breed !== 'Unknown') message += `, ${animal.breed}`;
          if (alerts.length > 0) message += `. Vaccination due`;
          message += '. ';
        });
      }
    });

    const allAlerts = Vaccine.getAllAlerts();
    if (allAlerts.length > 0) {
      message += `You have ${allAlerts.length} vaccination${allAlerts.length > 1 ? 's' : ''} due in total. `;
    }

    message += `Total animals on your farm: ${totalCount}.`;
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
    try {
      const choice = await VoiceEngine.listen();
      if (choice.includes('animal')) {
        await this.deleteAnimal(categories);
      } else if (choice.includes('category')) {
        await this.deleteCategory(categories);
      } else {
        await VoiceEngine.speak('Say animal or category.');
        await this.handleDelete(categories);
      }
    } catch(e) { this.load(); }
  },

  async deleteAnimal(categories) {
    try {
      await VoiceEngine.speak('Which category is the animal in?');
      const catChoice = await VoiceEngine.listen();
      const cat = categories.find(c => catChoice.includes(c.toLowerCase()));
      if (!cat) { await VoiceEngine.speak('Category not found.'); this.load(); return; }

      const animals = FarmStorage.getAnimals(cat);
      if (animals.length === 0) { await VoiceEngine.speak(`No animals in ${cat}.`); this.load(); return; }

      const names = animals.map(a => a.name).join(', ');
      await VoiceEngine.speak(`You have ${names} in ${cat}. Which animal would you like to delete?`);
      const nameChoice = await VoiceEngine.listen(20000);
      const animal = animals.find(a => nameChoice.includes(a.name.toLowerCase()));
      if (!animal) { await VoiceEngine.speak('Animal not found.'); this.load(); return; }

      await VoiceEngine.speak(`Are you sure you want to delete ${animal.name}? Say yes or no.`);
      const confirm = await VoiceEngine.listen();
      if (confirm.includes('yes')) {
        FarmStorage.saveAnimals(cat, animals.filter(a => a.id !== animal.id));
        await VoiceEngine.speak(`${animal.name} has been deleted.`);
      } else {
        await VoiceEngine.speak('Cancelled.');
      }
      this.load();
    } catch(e) { this.load(); }
  },

  async deleteCategory(categories) {
    try {
      await VoiceEngine.speak(`You have ${categories.join(', ')}. Which category would you like to delete?`);
      const choice = await VoiceEngine.listen();
      const cat = categories.find(c => choice.includes(c.toLowerCase()));
      if (!cat) { await VoiceEngine.speak('Category not found.'); this.load(); return; }

      const animals = FarmStorage.getAnimals(cat);
      await VoiceEngine.speak(`Are you sure you want to delete ${cat} and all ${animals.length} animals in it? Say yes or no.`);
      const confirm = await VoiceEngine.listen();
      if (confirm.includes('yes')) {
        FarmStorage.saveCategories(categories.filter(c => c !== cat));
        FarmStorage.saveAnimals(cat, []);
        await VoiceEngine.speak(`${cat} has been deleted.`);
      } else {
        await VoiceEngine.speak('Cancelled.');
      }
      this.load();
    } catch(e) { this.load(); }
  },

  openCategory(category) {
    App.currentCategory = category;
    document.getElementById('animal-list-title').textContent = category;
    App.goTo('animal-list');
    Animal.loadList(category);
  },

  getIcon(category) {
    const icons = {
      'Cows': '🐄', 'Cattle': '🐄', 'Goats': '🐐',
      'Sheep': '🐑', 'Chickens': '🐔', 'Pigs': '🐷',
      'Horses': '🐴', 'Ducks': '🦆'
    };
    return icons[category] || '🐾';
  }
};