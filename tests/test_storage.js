// test_storage.js
// Basic tests for FarmStorage functionality

console.log('=== FarmStorage Tests ===\n');

// Test 1: User Management
console.log('Test 1: User Management');
FarmStorage.saveUser('John', 'Farmer', '1234');
const user = FarmStorage.getUser();
console.log('User saved and retrieved:', user.name, user.surname);
console.log('PIN verification (1234):', FarmStorage.verifyPin('1234', user.pinHash) ? '✓ PASS' : '✗ FAIL');
console.log('PIN verification (5678):', !FarmStorage.verifyPin('5678', user.pinHash) ? '✓ PASS' : '✗ FAIL');

// Test 2: Category Management
console.log('\nTest 2: Category Management');
FarmStorage.addCategory('Cattle');
FarmStorage.addCategory('Goats');
FarmStorage.addCategory('cattle'); // Should not duplicate
const categories = FarmStorage.getCategories();
console.log('Categories added:', categories);
console.log('Correct count (2):', categories.length === 2 ? '✓ PASS' : '✗ FAIL');

// Test 3: Animal Management
console.log('\nTest 3: Animal Management');
const animal1 = FarmStorage.addAnimal('Cattle', {
  name: 'bessie',
  breed: 'bonsmara',
  colour: 'brown'
});
console.log('Animal added:', animal1.name, 'with ID:', animal1.id);

const animals = FarmStorage.getAnimals('Cattle');
console.log('Animals in Cattle:', animals.length);
console.log('Correct count (1):', animals.length === 1 ? '✓ PASS' : '✗ FAIL');

// Test 4: Animal Updates
console.log('\nTest 4: Animal Updates');
FarmStorage.updateAnimal('Cattle', animal1.id, { breed: 'Angus' });
const updated = FarmStorage.getAnimalById('Cattle', animal1.id);
console.log('Updated breed:', updated.breed);
console.log('Correct update:', updated.breed === 'Angus' ? '✓ PASS' : '✗ FAIL');

// Test 5: Data Export
console.log('\nTest 5: Data Export/Import');
const backup = FarmStorage.exportData();
console.log('Backup created:', backup ? '✓ PASS' : '✗ FAIL');
console.log('Backup contains user:', backup.includes('John') ? '✓ PASS' : '✗ FAIL');
console.log('Backup contains categories:', backup.includes('Cattle') ? '✓ PASS' : '✗ FAIL');

// Test 6: Input Validation
console.log('\nTest 6: Input Validation');
const invalidAddResult = FarmStorage.addAnimal('Cattle', { breed: 'test' }); // No name
console.log('Reject animal without name:', invalidAddResult === null ? '✓ PASS' : '✗ FAIL');

const validAddResult = FarmStorage.addAnimal('Cattle', { name: 'Daisy' });
console.log('Accept animal with name:', validAddResult !== null ? '✓ PASS' : '✗ FAIL');

// Cleanup
console.log('\n=== Cleanup ===');
localStorage.clear();
console.log('Storage cleared');
