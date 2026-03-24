var Home = {

  load() {
    const user = FarmStorage.getUser();
    if (!user) return;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' :
                     hour < 17 ? 'Good afternoon' : 'Good evening';

    document.getElementById('home-greeting').textContent = greeting;
    document.getElementById('home-username').textContent = `${user.name} ${user.surname}`;

    const categories = FarmStorage.getCategories();
    let totalAnimals = 0;
    categories.forEach(cat => totalAnimals += FarmStorage.getAnimals(cat).length);

    document.getElementById('stat-categories').textContent = categories.length;
    document.getElementById('stat-animals').textContent = totalAnimals;

    const alerts = Vaccine.getAllAlerts();
    document.getElementById('stat-vaccines').textContent = alerts.length;

    if (alerts.length > 0) {
      document.getElementById('alert-banner').style.display = 'flex';
      document.getElementById('alert-text').textContent =
        `${alerts.length} animal${alerts.length > 1 ? 's' : ''} due for vaccination`;
    } else {
      document.getElementById('alert-banner').style.display = 'none';
    }

    this.loadRecentAnimals(categories);
    this.speakMainMenu(user, totalAnimals, categories.length, alerts.length);
  },

  async speakMainMenu(user, totalAnimals, totalCategories, totalAlerts) {
    let message = `Hello ${user.name}. `;

    if (totalAlerts > 0) {
      message += `You have ${totalAlerts} vaccination${totalAlerts > 1 ? 's' : ''} due. `;
    }

    if (totalAnimals > 0) {
      message += `You have ${totalAnimals} animal${totalAnimals !== 1 ? 's' : ''} on your farm. `;
    }

    message += 'Say livestock for My Livestock. Say AI for the AI Assistant. Say logout to exit. Say repeat to hear this again.';

    await VoiceEngine.speak(message);
    this.listenForMainChoice();
  },

  async listenForMainChoice() {
    try {
      const choice = await VoiceEngine.listen();
      const t = choice.toLowerCase().trim();
      console.log('Main menu choice:', t);

      if (t.includes('livestock') || t.includes('animals') || t.includes('farm')) {
        App.goTo('livestock');
        Livestock.load();

      } else if (t.includes('ai') || t.includes('assistant') || t.includes('help')) {
        App.goTo('assistant');
        Assistant.load();

      } else if (t.includes('logout') || t.includes('log out')) {
        App.logout();

      } else if (t.includes('repeat')) {
        const user = FarmStorage.getUser();
        const categories = FarmStorage.getCategories();
        let totalAnimals = 0;
        categories.forEach(cat => totalAnimals += FarmStorage.getAnimals(cat).length);
        const alerts = Vaccine.getAllAlerts();
        await this.speakMainMenu(user, totalAnimals, categories.length, alerts.length);

      } else {
        await VoiceEngine.speak('Say livestock, AI, logout, or repeat.');
        this.listenForMainChoice();
      }

    } catch (e) {
      console.error('Menu error:', e);
      if (e === 'aborted') return;
      await new Promise(r => setTimeout(r, 800));
      this.listenForMainChoice();
    }
  },

  loadRecentAnimals(categories) {
    const container = document.getElementById('recent-animals');
    container.innerHTML = '';

    let allAnimals = [];
    categories.forEach(cat => {
      FarmStorage.getAnimals(cat).forEach(animal =>
        allAnimals.push({ ...animal, category: cat })
      );
    });

    if (allAnimals.length === 0) {
      container.innerHTML = '<div class="empty-state">No animals yet. Say livestock then add to start.</div>';
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

  voiceCommand() {
    const user = FarmStorage.getUser();
    const categories = FarmStorage.getCategories();
    let totalAnimals = 0;
    categories.forEach(cat => totalAnimals += FarmStorage.getAnimals(cat).length);
    const alerts = Vaccine.getAllAlerts();
    this.speakMainMenu(user, totalAnimals, categories.length, alerts.length);
  }

};