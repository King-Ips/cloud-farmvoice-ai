var Vaccine = {

  // Standard vaccination schedule by age in months
  schedule: [
    { name: 'Blackleg & Pulpy Kidney', monthsAfterBirth: 3 },
    { name: 'Brucellosis', monthsAfterBirth: 6 },
    { name: 'Lumpy Skin Disease', monthsAfterBirth: 12 },
    { name: 'Foot and Mouth Disease', monthsAfterBirth: 18 },
    { name: 'Annual Booster', monthsAfterBirth: 24 }
  ],

  // Returns human readable age string
  getAge(dob) {
    if (!dob) return 'Unknown age';
    const birth = new Date(dob);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 +
                   (now.getMonth() - birth.getMonth());
    if (months < 1) return 'Less than 1 month old';
    if (months < 12) return `${months} month${months > 1 ? 's' : ''} old`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years} year${years > 1 ? 's' : ''} ${rem} months old` : `${years} year${years > 1 ? 's' : ''} old`;
  },

  // Returns vaccination schedule for one animal
  getSchedule(animal) {
    if (!animal.dob) return [];
    const birth = new Date(animal.dob);
    return this.schedule.map(v => {
      const due = new Date(birth);
      due.setMonth(due.getMonth() + v.monthsAfterBirth);
      const now = new Date();
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
      return {
        name: v.name,
        dueDate: due.toLocaleDateString('en-ZA'),
        overdue: diffDays < 0,
        dueSoon: diffDays >= 0 && diffDays <= 30,
        daysUntil: diffDays
      };
    });
  },

  // Returns only overdue or due-soon vaccinations for one animal
  getAlerts(animal) {
    return this.getSchedule(animal).filter(v => v.overdue || v.dueSoon);
  },

  // Returns all alerts across all animals
  getAllAlerts() {
    const categories = FarmStorage.getCategories();
    let all = [];
    categories.forEach(cat => {
      FarmStorage.getAnimals(cat).forEach(animal => {
        const alerts = this.getAlerts(animal);
        alerts.forEach(a => all.push({ ...a, animalName: animal.name }));
      });
    });
    return all;
  }

};