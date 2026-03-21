// storage.js
// Renamed to FarmStorage to avoid conflict with browser's built-in Storage object

var FarmStorage = {

  // ── USER ──────────────────────────────────────────────────────
  saveUser(name, surname, pin) {
    const user = { name, surname, pin };
    localStorage.setItem('fv_user', JSON.stringify(user));
  },

  getUser() {
    const user = localStorage.getItem('fv_user');
    return user ? JSON.parse(user) : null;
  },

  // ── LIVESTOCK CATEGORIES ──────────────────────────────────────
  saveCategories(categories) {
    localStorage.setItem('fv_categories', JSON.stringify(categories));
  },

  getCategories() {
    const cats = localStorage.getItem('fv_categories');
    return cats ? JSON.parse(cats) : [];
  },

  addCategory(name) {w
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
  }

};