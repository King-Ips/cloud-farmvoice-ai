var Home = {

  load() {
    const user = FarmStorage.getUser();
    if (!user) return;

    // Set greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' :
                     hour < 17 ? 'Good afternoon' : 'Good evening';

    document.getElementById('home-greeting').textContent = greeting;
    document.getElementById('home-username').textContent = user.name + ' ' + user.surname;

    // Load stats
    const categories = FarmStorage.getCategories();
    let totalAnimals = 0;
    categories.forEach(cat => {
      totalAnimals += FarmStorage.getAnimals(cat).length;
    });

    document.getElementById('stat-categories').textContent = categories.length;
    document.getElementById('stat-animals').textContent = totalAnimals;

    // Check vaccination alerts
    const alerts = Vaccine.getAllAlerts();
    document.getElementById('stat-vaccines').textContent = alerts.length;

    if (alerts.length > 0) {
      document.getElementById('alert-banner').style.display = 'flex';
      document.getElementById('alert-text').textContent =
        `${alerts.length} animal${alerts.length > 1 ? 's' : ''} due for vaccination`;
    }

    // Load recent animals
    this.loadRecentAnimals(categories);

    // Speak greeting
    VoiceEngine.speak(`${greeting} ${user.name}. You have ${totalAnimals} animals across ${categories.length} categories.`);
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
      container.innerHTML = '<div class="empty-state">No animals added yet. Tap Add Animal to start.</div>';
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
        ${animal.photo ? `<img src="${animal.photo}" alt="${animal.name}">` : '🐄'}
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
    try {
      const command = await VoiceEngine.ask('What would you like to do? Say: my livestock, add animal, or AI assistant.');
      if (command.includes('livestock')) App.goTo('livestock');
      else if (command.includes('add')) App.goTo('animal-add');
      else if (command.includes('assistant') || command.includes('ai')) App.goTo('assistant');
      else VoiceEngine.speak('Sorry, I did not understand. Please try again.');
    } catch (e) {
      console.error(e);
    }
  }

};