var Home = {

  load() {
    const user = FarmStorage.getUser();
    if (!user) return;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

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
      document.getElementById('alert-text').textContent = `${alerts.length} animal${alerts.length > 1 ? 's' : ''} due for vaccination`;
    } else {
      document.getElementById('alert-banner').style.display = 'none';
    }

    this.loadRecentAnimals(categories);
    this.speakMainMenu(user, totalAnimals, categories.length, alerts.length);
  },

  async speakMainMenu(user, totalAnimals, totalCategories, totalAlerts) {
    let message = `Hello ${user.name}. `;
    if (totalAlerts > 0) message += `You have ${totalAlerts} vaccination${totalAlerts > 1 ? 's' : ''} due. `;
    message += `You have ${totalAnimals} animal${totalAnimals !== 1 ? 's' : ''} in ${totalCategories} categor${totalCategories !== 1 ? 'ies' : 'y'}. `;
    message += 'What would you like to do? Say 1 for My Livestock. Say 2 for AI Assistant. Say logout to exit.';

    await VoiceEngine.speak(message);
    this.listenForMainChoice();
  },

  async listenForMainChoice() {
    try {
      const choice = await VoiceEngine.listen();
      const t = choice.toLowerCase().trim();

      if (t.includes('menu')) {
        Home.load();
        return;
      }

      if (t.includes('1') || t.includes('livestock') || t.includes('animals') || t.includes('manage')) {
        App.goTo('livestock');
        Livestock.load();
      } 
      else if (t.includes('2') || t.includes('assistant') || t.includes('ai') || t.includes('help') || t.includes('question')) {
        App.goTo('assistant');
        Assistant.load();
      } 
      else if (t.includes('logout') || t.includes('log out')) {
        App.logout();
      } 
      else {
        await VoiceEngine.speak('Sorry, say 1 for My Livestock or 2 for AI Assistant.');
        this.listenForMainChoice();
      }
    } catch (e) {
      console.error('Main menu error:', e);
      await new Promise(r => setTimeout(r, 800));
      this.listenForMainChoice();
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
      container.innerHTML = '<div class="empty-state">No animals yet.<br>Say "1" then "add animal" to get started.</div>';
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
    const badge = alerts.length > 0 ? `<span class="vaccine-badge">💉 Vaccine due</span>` : '';

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
  }
};