// Simulate the app's localStorage interaction

// Simulate OLD data format (before our fix)
const oldUserData = { name: "John", surname: "Doe", pin: "1234" };
console.log("OLD DATA FORMAT:", JSON.stringify(oldUserData));

// Simulate FarmStorage with new code
const FarmStorage = {
  hashPin(pin) {
    let hash = 0;
    for (let i = 0; i < pin.length; i++) {
      const char = pin.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  },
  verifyPin(inputPin, storedHash) {
    return this.hashPin(inputPin) === storedHash;
  }
};

// NEW data format
const newUserData = { name: "John", surname: "Doe", pinHash: FarmStorage.hashPin("1234") };
console.log("NEW DATA FORMAT:", JSON.stringify(newUserData));

// THE PROBLEM: Old data doesn't have pinHash
console.log("\n=== THE BUG ===");
console.log("Old data has pin:", oldUserData.pin);
console.log("Old data has pinHash:", oldUserData.pinHash); // undefined!
console.log("New code expects pinHash:", newUserData.pinHash);

// Try to verify with old data
console.log("\n=== What happens when app runs with OLD data ===");
try {
  const result = FarmStorage.verifyPin("1234", oldUserData.pinHash);
  console.log("verifyPin result:", result);
} catch (e) {
  console.log("ERROR:", e.message);
}

console.log("\nApp will FAIL because oldUserData.pinHash is undefined");
