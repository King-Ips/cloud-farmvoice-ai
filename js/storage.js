// storage.js
// Renamed to FarmStorage to avoid conflict with browser's built-in Storage object

var FarmStorage = {

  // ── USER ──────────────────────────────────────────────────────
  saveUser(name, surname, pinOrHash) {
    // Input validation
    if (!name || !surname || !pinOrHash) {
      console.error('Invalid user data: missing fields');
      return false;
    }
    if (typeof name !== 'string' || typeof surname !== 'string') {
      console.error('Invalid user data: invalid types');
      return false;
    }
    
    name = name.trim().slice(0, 50);
    surname = surname.trim().slice(0, 50);
    
    const pinHash = pinOrHash.length > 8 ? pinOrHash : this.hashPin(pinOrHash);
    const user = { name, surname, pinHash };
    localStorage.setItem('fv_user', JSON.stringify(user));
    return true;
  },

  getUser() {
    const user = localStorage.getItem('fv_user');
    if (!user) return null;
    const parsed = JSON.parse(user);
    // Migrate old format (pin) to new format (pinHash)
    if (parsed.pin && !parsed.pinHash) {
      parsed.pinHash = this.hashPin(parsed.pin);
      delete parsed.pin; // Remove old plain-text pin
      this.saveUser(parsed.name, parsed.surname, parsed.pinHash);
    }
    return parsed;
  },

  // ── LIVESTOCK CATEGORIES ──────────────────────────────────────
  saveCategories(categories) {
    localStorage.setItem('fv_categories', JSON.stringify(categories));
  },

  getCategories() {
    const cats = localStorage.getItem('fv_categories');
    return cats ? JSON.parse(cats) : [];
  },

  addCategory(name) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      console.error('Invalid category name');
      return [];
    }
    const categories = this.getCategories();
    const formatted = name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase().slice(0, 50);
    
    // Prevent duplicate categories
    if (!categories.includes(formatted)) {
      categories.push(formatted);
      this.saveCategories(categories);
    }
    return categories;
  },

  // ── ANIMALS ───────────────────────────────────────────────────
  saveAnimals(category, animals) {
    const key = 'fv_animals_' + category;
    localStorage.setItem(key, JSON.stringify(animals));
  },

  getAnimals(category) {
    const key = 'fv_animals_' + category;
    const animals = localStorage.getItem(key);
    return animals ? JSON.parse(animals) : [];
  },

  addAnimal(category, animal) {
    // Input validation
    if (!category || typeof category !== 'string' || !animal || typeof animal !== 'object') {
      console.error('Invalid animal data');
      return null;
    }
    if (!animal.name || typeof animal.name !== 'string' || animal.name.trim().length === 0) {
      console.error('Animal must have a name');
      return null;
    }
    
    // Sanitize animal data
    animal.name = animal.name.trim().slice(0, 100);
    animal.breed = (animal.breed || '').toString().trim().slice(0, 100);
    animal.notes = (animal.notes || '').toString().trim().slice(0, 500);
    
    const animals = this.getAnimals(category);
    animal.id = Date.now().toString();
    animals.push(animal);
    this.saveAnimals(category, animals);
    return animal;
  },

  getAnimalById(category, id) {
    const animals = this.getAnimals(category);
    return animals.find(a => a.id === id) || null;
  },

  updateAnimal(category, id, updates) {
    const animals = this.getAnimals(category);
    const index = animals.findIndex(a => a.id === id);
    if (index !== -1) {
      animals[index] = { ...animals[index], ...updates };
      this.saveAnimals(category, animals);
    }
  },

  clearAll() {
    localStorage.clear();
  },

  // ── BACKUP & EXPORT ──────────────────────────────────
  exportData() {
    try {
      const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        user: this.getUser(),
        categories: this.getCategories(),
        animals: {}
      };

      this.getCategories().forEach(cat => {
        backup.animals[cat] = this.getAnimals(cat);
      });

      return JSON.stringify(backup, null, 2);
    } catch (e) {
      console.error('Export failed:', e);
      return null;
    }
  },

  importData(jsonString) {
    try {
      const backup = JSON.parse(jsonString);
      
      // Validate backup structure
      if (!backup.version || !backup.user) {
        console.error('Invalid backup format');
        return false;
      }

      // Clear existing data
      this.clearAll();

      // Restore user
      if (backup.user && backup.user.name && backup.user.surname && backup.user.pinHash) {
        this.saveUser(backup.user.name, backup.user.surname, backup.user.pinHash);
      }

      // Restore categories and animals
      if (backup.categories && Array.isArray(backup.categories)) {
        this.saveCategories(backup.categories);
      }

      if (backup.animals && typeof backup.animals === 'object') {
        Object.keys(backup.animals).forEach(cat => {
          const animals = backup.animals[cat];
          if (Array.isArray(animals)) {
            this.saveAnimals(cat, animals);
          }
        });
      }

      console.log('Backup restored successfully');
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },

  downloadBackup() {
    const data = this.exportData();
    if (!data) {
      console.error('Failed to export data');
      return;
    }

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farmvoice-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  async uploadBackup(file) {
    try {
      const text = await file.text();
      return this.importData(text);
    } catch (e) {
      console.error('Failed to upload backup:', e);
      return false;
    }
  },

  // ── SIMPLE PIN HASHING ────────────────────────────────────
  // Simple hash for PIN (not cryptographically secure, but better than plain text)
  hashPin(pin) {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  },

  // Verify PIN against stored hash
  verifyPin(inputPin, storedHash) {
    return this.hashPin(inputPin) === storedHash;
  }

};