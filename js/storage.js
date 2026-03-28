// storage.js
// Renamed to FarmStorage to avoid conflict with browser's built-in Storage object

var FarmStorage = {

  // ── USER ──────────────────────────────────────────────────────
  saveUser(name, surname, pinOrHash) {
    // Handle both plain PIN and pre-hashed PIN
    const pinHash = pinOrHash.length > 8 ? pinOrHash : this.hashPin(pinOrHash);
    const user = { name, surname, pinHash };
    localStorage.setItem('fv_user', JSON.stringify(user));
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
    const categories = this.getCategories();
    const formatted = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
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