var Home = {

  load() {
    const user = FarmStorage.getUser();
    if (!user) return;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' :
                     hour < 17 ? 'Good afternoon' : 'Good evening';

    document.getElementById('home-greeting').textContent = greeting;
    document.getElementById('home-username').textContent = user.name + ' ' + user.surname;

    const categories = FarmStorage.getCategories();
    let totalAnimals = 0;
    categories.forEach(cat => {
      totalAnimals += FarmStorage.getAnimals(cat).length;
    });

    document.getElementById('stat-categories').textContent = categories.length;
    document.getElementById('stat-animals').textContent = totalAnimals;

    const alerts = Vaccine.getAllAlerts();
    document.getElementById('stat-vaccines').textContent = alerts.length;

    if (alerts.length > 0) {
      document.getElementById('alert-banner').style.display = 'flex';
      document.getElementById('alert-text').textContent =
        `${alerts.length} animal${alerts.length > 1 ? 's' : ''} due for vaccination`;
    }

    this.loadRecentAnimals(categories);
    this.speakMenu(user, totalAnimals, categories.length, alerts.length);
  },

  async speakMenu(user, totalAnimals, totalCategories, totalAlerts) {
    let message = `Hello ${user.name}. `;

    if (totalAlerts > 0) {
      message += `You have ${totalAlerts} vaccination${totalAlerts > 1 ? 's' : ''} due. `;
    }

    if (totalAnimals > 0) {
      message += `You have ${totalAnimals} animal${totalAnimals !== 1 ? 's' : ''} on your farm. `;
    }

    message += 'What would you like to do? Say 1 for My Livestock. Say 2 for AI Assistant. Say 3 to Add an Animal.';

    await VoiceEngine.speak(message);
    this.listenForMenuChoice();
  },

  async listenForMenuChoice() {
    try {
      document.getElementById('home-greeting').textContent = '🎤 Listening...';
      
      const choice = await VoiceEngine.listen();
      console.log('Menu choice:', choice);

      // Ignore empty or too short responses
      if (!choice || choice.length < 1) {
        this.listenForMenuChoice();
        return;
      }

      // Reset greeting
      document.getElementById('home-greeting').textContent = 
        new Date().getHours() < 12 ? 'Good morning' : 
        new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

      if (choice.includes('menu')) {
        Home.load();
        return;
      }

      if (choice.includes('1') || choice.includes('livestock') || choice.includes('animals')) {
        App.goTo('livestock');
        Livestock.load();

      } else if (choice.includes('2') || choice.includes('assistant') || choice.includes('ai')) {
        App.goTo('assistant');
        await VoiceEngine.speak('AI Assistant ready. What is your farming question?');
        Assistant.load();

      } else if (choice.includes('3') || choice.includes('add')) {
        await VoiceEngine.speak('Which livestock category? Say cows, goats, sheep, or chickens.');
        const catChoice = await VoiceEngine.listen();
        const formatted = catChoice.charAt(0).toUpperCase() + catChoice.slice(1).toLowerCase();
        FarmStorage.addCategory(formatted);
        App.currentCategory = formatted;
        App.goTo('animal-add');
        Animal.startAdd();

      } else {
        await VoiceEngine.speak(`I heard ${choice}. Say livestock, assistant, or add.`);
        this.listenForMenuChoice();
      }

    } catch (e) {
      console.error('Menu error:', e);
      await new Promise(r => setTimeout(r, 1000));
      this.listenForMenuChoice();
    }
  },

  loadRecentAnimals(categories) {
    const container = document.getElementById('recent-animals');
    container.innerHTML = '';

    let allAnimals = [];
    categories.forEach(cat => {
      FarmStorage.getAnimals(cat).forEach(animal => {
        allAnimals.push({ ...animal, category: cat });
      });
    });

    if (allAnimals.length === 0) {
      container.innerHTML = '<div class="empty-state">No animals yet. Say 3 to add your first animal.</div>';
      return;
    }

    allAnimals.slice(-5).reverse().forEach(animal => {
      const card = this.createAnimalCard(animal);
      container.appendChild(card);
    });
  },

  createAnimalCard(animal) {
    const card = document.createElement('div');
    card.className = 'animal-card';
    card.onclick = () => Animal.viewProfile(animal.category, animal.id);

    const age = Vaccine.getAge(animal.dob);
    const alerts = Vaccine.getAlerts(animal);
    const badge = alerts.length > 0 ?
      `<span class="vaccine-badge">💉 Vaccine due</span>` : '';

    card.innerHTML = `
      <div class="animal-avatar">
        ${animal.photo ?
          `<img src="${animal.photo}" alt="${animal.name}">` :
          Livestock.getIcon(animal.category)}
      </div>
      <div class="animal-info">
        <div class="animal-name">${animal.name}</div>
        <div class="animal-detail">${animal.category} · ${age}</div>
        ${animal.breed ? `<div class="animal-detail">${animal.breed}</div>` : ''}
      </div>
      ${badge}
    `;
    return card;
  },

  async voiceCommand() {
    await VoiceEngine.speak('What would you like to do? Say 1 for Livestock, 2 for AI Assistant, or 3 to Add an Animal.');
    this.listenForMenuChoice();
  }

};