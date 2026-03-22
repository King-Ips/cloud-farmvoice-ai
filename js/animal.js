var Animal = {

  currentAnimal: null,

  loadList(category) {
    const animals = FarmStorage.getAnimals(category);
    const container = document.getElementById('animal-list');
    container.innerHTML = '';

    if (animals.length === 0) {
      container.innerHTML = '<div class="empty-state">No animals yet. Tap + to add one.</div>';
      VoiceEngine.speak(`You have no ${category.toLowerCase()} yet. Say add to add one or say menu to go back.`);
      this.listenForListChoice(category, []);
      return;
    }

    animals.forEach(animal => {
      const card = document.createElement('div');
      card.className = 'animal-card';
      card.onclick = () => this.viewProfile(category, animal.id);

      const age = Vaccine.getAge(animal.dob);
      const alerts = Vaccine.getAlerts(animal);
      const badge = alerts.length > 0 ?
        `<span class="vaccine-badge">💉 Vaccine due</span>` : '';

      card.innerHTML = `
        <div class="animal-avatar">
          ${animal.photo ?
            `<img src="${animal.photo}" alt="${animal.name}">` :
            Livestock.getIcon(category)}
        </div>
        <div class="animal-info">
          <div class="animal-name">${animal.name}</div>
          <div class="animal-detail">${age}</div>
          ${animal.breed ? `<div class="animal-detail">${animal.breed}</div>` : ''}
        </div>
        ${badge}
      `;
      container.appendChild(card);
    });

    // Speak list summary
    const names = animals.map(a => a.name).join(', ');
    VoiceEngine.speak(
      `You have ${animals.length} ${category.toLowerCase()}. ` +
      `${names}. ` +
      `Say an animal name to open it, say add to add a new one, or say menu to go back.`
    );

    this.listenForListChoice(category, animals);
  },

  async listenForListChoice(category, animals) {
    try {
      const choice = await VoiceEngine.listen();

      if (choice.includes('menu')) {
        App.goTo('home');
        Home.load();
        return;
      }

      if (choice.includes('add')) {
        App.currentCategory = category;
        App.goTo('animal-add');
        this.startAdd();
        return;
      }

      if (choice.includes('back')) {
        App.goTo('livestock');
        Livestock.load();
        return;
      }

      // Check if user said an animal name
      const match = animals.find(a =>
        choice.includes(a.name.toLowerCase())
      );

      if (match) {
        this.viewProfile(category, match.id);
      } else {
        await VoiceEngine.speak('Sorry I did not understand. Say an animal name, add, or menu.');
        this.listenForListChoice(category, animals);
      }

    } catch (e) {
      console.error(e);
      await new Promise(r => setTimeout(r, 1000));
      this.listenForListChoice(category, animals);
    }
  },

  async startAdd() {
    const category = App.currentCategory;
    const prompt = document.getElementById('add-animal-prompt');

    try {
      // Step 1 — name
      prompt.textContent = 'Listening for animal name...';
      const name = await VoiceEngine.ask(
        `What is the name or number of your ${category ?
          category.slice(0, -1).toLowerCase() : 'animal'}?`
      );
      prompt.textContent = `Name: ${name}`;
      await VoiceEngine.speak(`Got it. ${name}.`);

      // Step 2 — date of birth
      prompt.textContent = 'Listening for date of birth...';
      const dobRaw = await VoiceEngine.ask(
        `When was ${name} born? Say the date. For example: 1 January 2025.`
      );
      prompt.textContent = `Name: ${name} | Born: ${dobRaw}`;
      await VoiceEngine.speak(`Born ${dobRaw}.`);

      // Parse date
      const dob = new Date(dobRaw);
      const dobString = isNaN(dob) ? dobRaw : dob.toISOString().split('T')[0];

      // Save animal
      const animal = FarmStorage.addAnimal(category || 'General', {
        name: name,
        dob: dobString,
        category: category || 'General'
      });

      this.currentAnimal = { ...animal, category: category || 'General' };

      await VoiceEngine.speak(`${name} has been saved.`);

      // Ask about photo
      const photoResponse = await VoiceEngine.ask(
        `Would you like to take a photo of ${name} so I can identify the breed? Say yes or no.`
      );

      if (photoResponse.includes('yes')) {
        prompt.textContent = `Tap Add Photo to take a photo of ${name}`;
        await VoiceEngine.speak('Please tap the Add Photo button.');
      } else {
        await VoiceEngine.speak(`${name} added successfully.`);
        this.viewProfile(category || 'General', animal.id);
      }

    } catch (e) {
      console.error('Add animal error:', e);
      prompt.textContent = 'Something went wrong. Please try again.';
      await VoiceEngine.speak('Something went wrong. Say menu to go back or try again.');
    }
  },

  viewProfile(category, id) {
    const animal = FarmStorage.getAnimalById(category, id);
    if (!animal) return;

    this.currentAnimal = { ...animal, category };
    App.goTo('animal-profile');

    // Fill in all fields
    document.getElementById('profile-name').textContent = animal.name;
    document.getElementById('profile-name-val').textContent = animal.name;
    document.getElementById('profile-dob').textContent = animal.dob || '—';
    document.getElementById('profile-age').textContent = Vaccine.getAge(animal.dob);
    document.getElementById('profile-breed').textContent = animal.breed || 'Unknown';
    document.getElementById('profile-colour').textContent = animal.colour || 'Unknown';
    document.getElementById('profile-category').textContent = category;

    // Photo
    if (animal.photo) {
      document.getElementById('profile-photo').innerHTML =
        `<img src="${animal.photo}" alt="${animal.name}">`;
    }

    // Vaccination schedule
    const vaccines = Vaccine.getSchedule(animal);
    const vaccineContainer = document.getElementById('profile-vaccines');
    vaccineContainer.innerHTML = vaccines.map(v => `
      <div class="vaccine-item">
        <span>${v.name}</span>
        <span class="${v.overdue || v.dueSoon ? 'vaccine-due' : 'vaccine-ok'}">
          ${v.overdue ? '⚠ Overdue' : v.dueSoon ? '⚠ Due soon' : '✓ ' + v.dueDate}
        </span>
      </div>
    `).join('');

    // Auto read profile
    this.readProfile();
  },

  readProfile() {
    const a = this.currentAnimal;
    if (!a) return;

    const age = Vaccine.getAge(a.dob);
    const alerts = Vaccine.getAlerts(a);
    const alertText = alerts.length > 0 ?
      `${a.name} has ${alerts.length} vaccination${alerts.length > 1 ? 's' : ''} due.` : '';

    VoiceEngine.speak(
      `${a.name} is ${age}. ` +
      `${a.breed && a.breed !== 'Unknown' ? `Breed: ${a.breed}.` : ''}` +
      `${a.colour && a.colour !== 'Unknown' ? ` Colour: ${a.colour}.` : ''}` +
      ` ${alertText}` +
      ` Say menu to go back or say read again to hear this again.`
    );

    this.listenOnProfile();
  },

  async listenOnProfile() {
    try {
      const choice = await VoiceEngine.listen();

      if (choice.includes('menu')) {
        App.goTo('home');
        Home.load();
      } else if (choice.includes('read') || choice.includes('again')) {
        this.readProfile();
      } else if (choice.includes('back')) {
        App.goTo('animal-list');
        Animal.loadList(this.currentAnimal.category);
      } else {
        await VoiceEngine.speak('Say menu to go back or say read again to hear the profile.');
        this.listenOnProfile();
      }
    } catch (e) {
      console.error(e);
      await new Promise(r => setTimeout(r, 1000));
      this.listenOnProfile();
    }
  }

};