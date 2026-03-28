var Animal = {

  currentAnimal: null,

  loadList(category) {
    const animals = FarmStorage.getAnimals(category);
    const container = document.getElementById('animal-list');
    container.innerHTML = '';

    if (animals.length === 0) {
      container.innerHTML = '<div class="empty-state">No animals yet.</div>';
      VoiceEngine.speak(`You have no ${category.toLowerCase()} yet. Say add to add one.`);
      return;
    }

    animals.forEach(animal => {
      const card = document.createElement('div');
      card.className = 'animal-card';
      card.onclick = () => this.viewProfile(category, animal.id);
      const age = Vaccine.getAge(animal.dob);
      const alerts = Vaccine.getAlerts(animal);
      const badge = alerts.length > 0 ? `<span class="vaccine-badge">💉 Vaccine due</span>` : '';
      card.innerHTML = `
        <div class="animal-avatar">
          ${animal.photo ? `<img src="${animal.photo}" alt="${animal.name}">` : Livestock.getIcon(category)}
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
  },

  async startAdd() {
    const category = App.currentCategory;
    const prompt = document.getElementById('add-animal-prompt');

    try {
      prompt.textContent = 'Listening for animal name...';
      const name = await VoiceEngine.ask(
        `What is the name or number of your ${category ? category.slice(0,-1).toLowerCase() : 'animal'}?`
      );
      prompt.textContent = `Name: ${name}`;
      await VoiceEngine.speak(`Got it. ${name}.`);

      prompt.textContent = 'Listening for date of birth...';
      const dobRaw = await VoiceEngine.ask(
        `When was ${name} born? Please say the day, month and year. For example: 5 March 2024.`
      );
      prompt.textContent = `Born: ${dobRaw}`;

      // Improved date parsing - handle format like "5 March 2024"
      let dobString = dobRaw;
      try {
        const d = new Date(dobRaw);
        if (!isNaN(d.getTime())) {
          dobString = d.toISOString().split('T')[0];
        }
      } catch (e) {
        // Keep original string if parsing fails
        dobString = dobRaw;
      }
      
      await VoiceEngine.speak(`Date of birth: ${dobRaw}.`);

      const animal = FarmStorage.addAnimal(category || 'General', {
        name: name,
        dob: dobString,
        category: category || 'General'
      });

      this.currentAnimal = { ...animal, category: category || 'General' };
      await VoiceEngine.speak(`${name} has been saved successfully.`);

      // Read back the animal information
      const age = Vaccine.getAge(dobString);
      await VoiceEngine.speak(`${name} is ${age}. Category: ${category || 'General'}.`);

      // Ask about photo
      const photoResponse = await VoiceEngine.ask(
        `Would you like to take a photo of ${name} so I can identify the breed? Say yes or no.`
      );

      if (photoResponse.includes('yes')) {
        prompt.textContent = `Tap Add Photo to take a photo of ${name}`;
        await VoiceEngine.speak('Please tap the Add Photo button to take or upload a photo.');
      } else {
        // Show animal profile to user
        this.viewProfile(category || 'General', animal.id);
      }

    } catch (e) {
      console.error('Add animal error:', e);
      if (e === 'aborted') return;
      await VoiceEngine.speak('Something went wrong. Going back to livestock.');
      App.goTo('livestock');
      Livestock.load();
    }
  },

  viewProfile(category, id) {
    const animal = FarmStorage.getAnimalById(category, id);
    if (!animal) return;

    this.currentAnimal = { ...animal, category };
    App.goTo('animal-profile');

    document.getElementById('profile-name').textContent = animal.name;
    document.getElementById('profile-name-val').textContent = animal.name;
    document.getElementById('profile-dob').textContent = animal.dob || '—';
    document.getElementById('profile-age').textContent = Vaccine.getAge(animal.dob);
    document.getElementById('profile-breed').textContent = animal.breed || 'Unknown';
    document.getElementById('profile-colour').textContent = animal.colour || 'Unknown';
    document.getElementById('profile-category').textContent = category;

    if (animal.photo) {
      document.getElementById('profile-photo').innerHTML =
        `<img src="${animal.photo}" alt="${animal.name}">`;
    }

    const vaccines = Vaccine.getSchedule(animal);
    document.getElementById('profile-vaccines').innerHTML = vaccines.map(v => `
      <div class="vaccine-item">
        <span>${v.name}</span>
        <span class="${v.overdue || v.dueSoon ? 'vaccine-due' : 'vaccine-ok'}">
          ${v.overdue ? '⚠ Overdue' : v.dueSoon ? '⚠ Due soon' : '✓ ' + v.dueDate}
        </span>
      </div>
    `).join('');

    this.readProfile();
  },

  async readProfile() {
    const a = this.currentAnimal;
    if (!a) return;
    const age = Vaccine.getAge(a.dob);
    const alerts = Vaccine.getAlerts(a);
    const alertText = alerts.length > 0 ?
      `${a.name} has ${alerts.length} vaccination${alerts.length > 1 ? 's' : ''} due.` : 'No vaccinations due.';

    await VoiceEngine.speak(
      `${a.name} is ${age}. ` +
      `${a.breed && a.breed !== 'Unknown' ? `Breed: ${a.breed}. ` : ''}` +
      `${a.colour && a.colour !== 'Unknown' ? `Colour: ${a.colour}. ` : ''}` +
      `Category: ${a.category}. ` +
      alertText
    );

    // Ask what user would like to do next
    await VoiceEngine.speak('What would you like to do? Say add to add another animal, livestock to go back, or menu to go to the main menu.');
    
    try {
      const choice = await VoiceEngine.listen();
      const t = choice.toLowerCase().trim();
      
      if (t.includes('add')) {
        App.goTo('animal-add');
        Animal.startAdd();
      } else if (t.includes('livestock')) {
        App.goTo('livestock');
        Livestock.load();
      } else {
        // Default: listen again
        this.readProfile();
      }
    } catch (e) {
      if (e === 'aborted') return;
      await new Promise(r => setTimeout(r, 800));
      this.readProfile();
    }
  }
};