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
    if (isNaN(birth.getTime())) return 'Unknown age';
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    let days = now.getDate() - birth.getDate();
    
    // Adjust for day of month
    if (days < 0) {
      months--;
      // Get number of days in previous month
      const tempDate = new Date(now.getFullYear(), now.getMonth(), 0);
      days += tempDate.getDate();
    }
    
    // Adjust for month
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const totalMonths = years * 12 + months;
    if (totalMonths < 1) return 'Less than 1 month old';
    if (totalMonths < 12) return `${totalMonths} month${totalMonths > 1 ? 's' : ''} old`;
    if (months === 0) return `${years} year${years > 1 ? 's' : ''} old`;
    return `${years} year${years > 1 ? 's' : ''} and ${months} month${months > 1 ? 's' : ''} old`;
  },

  // Returns vaccination schedule for one animal
  getSchedule(animal) {
    if (!animal.dob) return [];
    const birth = new Date(animal.dob);
    if (isNaN(birth.getTime())) return [];
    
    return this.schedule.map(v => {
      const due = new Date(birth.getFullYear(), birth.getMonth() + v.monthsAfterBirth, birth.getDate());
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