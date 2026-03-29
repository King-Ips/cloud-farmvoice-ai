var Crops = {
  
  getCrops() {
    try {
      const data = localStorage.getItem('fv_crops');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCrops(crops) {
    localStorage.setItem('fv_crops', JSON.stringify(crops));
  },

  load() {
    const crops = this.getCrops();
    const container = document.getElementById('crop-list');
    container.innerHTML = '';
    
    document.getElementById('stat-crops').textContent = crops.length;

    if (crops.length === 0) {
      container.innerHTML = '<div class="empty-state">No crops planted yet. Tap + or say add to start.</div>';
    } else {
      crops.forEach(crop => {
        const card = document.createElement('div');
        card.className = 'category-card'; // Reusing style
        card.innerHTML = `
          <div class="category-icon">🌱</div>
          <div class="category-info">
            <div class="category-name">${crop.name}</div>
            <div class="category-count">Planted: ${crop.plantedDate}</div>
          </div>
          <button class="icon-btn" onclick="Crops.deleteCrop('${crop.id}')" aria-label="Delete Crop">
            <span aria-hidden="true" style="color:var(--danger)">×</span>
          </button>
        `;
        container.appendChild(card);
      });
    }

    this.speakCropsMenu(crops);
  },

  async speakCropsMenu(crops) {
    let message = '';
    if (crops.length === 0) {
      message = 'You have no crops planted. Say add to add a crop.';
    } else {
      message = `You have ${crops.length} crop${crops.length !== 1 ? 's' : ''} planted. `;
      crops.forEach(c => { message += `${c.name}. `; });
      message += 'Say add to plant another, or delete to remove one.';
    }
    
    await VoiceEngine.speak(message);
    this.listenForChoice(crops);
  },

  async listenForChoice(crops, retries = 0) {
    if (retries > 3) {
      await VoiceEngine.speak('No valid command. Returning to home.');
      App.goTo('home');
      Home.load();
      return;
    }
    
    try {
      const choice = await VoiceEngine.listen();
      const t = (choice || '').toLowerCase();
      if (t.includes('add')) {
        await this.startAdd();
        return;
      }
      if (t.includes('delete') || t.includes('remove')) {
        await this.handleDelete(crops);
        return;
      }
      
      await VoiceEngine.speak('Say add to add a crop, or delete to remove one.');
      await this.listenForChoice(crops, retries + 1);
    } catch(e) {
      if (e === 'aborted' || e === 'handled_global') return;
      await new Promise(r => setTimeout(r, 800));
      await this.listenForChoice(crops, retries + 1);
    }
  },

  async startAdd() {
    try {
      const name = await VoiceEngine.ask('What crop are you planting? For example, maize, wheat, or tomatoes.');
      await VoiceEngine.speak(`Got it. ${name}.`);
      
      const dateRaw = await VoiceEngine.ask('When did you plant it? Say today, or a specific date.');
      const plantedDate = dateRaw.includes('today') ? new Date().toISOString().split('T')[0] : dateRaw;

      const crops = this.getCrops();
      crops.push({
        id: Date.now().toString(),
        name: name.charAt(0).toUpperCase() + name.slice(1),
        plantedDate: plantedDate
      });
      this.saveCrops(crops);
      await VoiceEngine.speak(`${name} has been added to your crops.`);
      this.load();
    } catch(e) {
      if (e === 'handled_global') return;
      console.error(e);
      await VoiceEngine.speak('Cancelled adding crop.');
      this.load();
    }
  },

  async handleDelete(crops) {
    if (crops.length === 0) {
      await VoiceEngine.speak('No crops to delete.');
      this.load();
      return;
    }
    
    try {
      const names = crops.map(c => c.name).join(', ');
      const choice = await VoiceEngine.ask(`Which crop would you like to delete? You have ${names}.`);
      
      const t = (choice || '').toLowerCase();
      const crop = crops.find(c => t.includes(c.name.toLowerCase()));
      if (!crop) {
        await VoiceEngine.speak('Crop not found.');
        this.load();
        return;
      }
      
      const confirm = await VoiceEngine.ask(`Delete ${crop.name}? Say yes to confirm.`);
      if (confirm.includes('yes')) {
        this.deleteCrop(crop.id);
        await VoiceEngine.speak(`${crop.name} deleted.`);
      } else {
        await VoiceEngine.speak('Cancelled.');
        this.load();
      }
    } catch(e) {
      if (e === 'handled_global') return;
      this.load();
    }
  },


  deleteCrop(id) {
    let crops = this.getCrops();
    crops = crops.filter(c => c.id !== id);
    this.saveCrops(crops);
    this.load();
  }
};
