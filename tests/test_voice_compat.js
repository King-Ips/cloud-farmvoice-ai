// test_voice_compat.js
// Test browser compatibility for voice APIs

console.log('=== Voice API Compatibility Test ===\n');

// Test 1: Speech Synthesis Support
console.log('Test 1: Speech Synthesis');
const hasSpeechSynthesis = 'speechSynthesis' in window;
console.log('speechSynthesis available:', hasSpeechSynthesis ? '✓ YES' : '✗ NO');

if (hasSpeechSynthesis) {
  const browserVoices = window.speechSynthesis.getVoices();
  console.log('Available voices:', browserVoices.length);
  console.log('English voices:', browserVoices.filter(v => v.lang.startsWith('en')).length);
}

// Test 2: Speech Recognition Support
console.log('\nTest 2: Speech Recognition');
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition;
const hasSpeechRecognition = !!SpeechRecognition;
console.log('SpeechRecognition available:', hasSpeechRecognition ? '✓ YES' : '✗ NO');

// Test 3: Microphone Permission
console.log('\nTest 3: Microphone Permissions');
if (navigator.permissions && navigator.permissions.query) {
  navigator.permissions.query({ name: 'microphone' })
    .then(result => {
      console.log('Microphone permission status:', result.state);
      // result.state can be: 'granted', 'denied', 'prompt'
    })
    .catch(err => console.log('Permission query not supported:', err));
} else {
  console.log('Permissions API not available (will prompt on first use)');
}

// Test 4: Overall Voice Support
console.log('\nTest 4: Overall Voice Support');
const voiceSupport = VoiceEngine.init();
console.log('VoiceEngine initialized:', voiceSupport ? '✓ YES' : '✗ NO');
console.log('Full voice UI available:', voiceSupport ? '✓ YES - Use app normally' : '⚠️  LIMITED - Text-only mode');

// Test 5: Browser Info
console.log('\nTest 5: Browser Information');
console.log('User Agent:', navigator.userAgent);
console.log('Language:', navigator.language);

// Test 6: Service Worker Support
console.log('\nTest 6: Service Worker & Offline Support');
console.log('Service Worker available:', 'serviceWorker' in navigator ? '✓ YES' : '✗ NO');
console.log('Cache API available:', 'caches' in window ? '✓ YES' : '✗ NO');

console.log('\n=== Recommendations ===');
if (!hasSpeechSynthesis) console.log('⚠️  Update browser for speech output');
if (!hasSpeechRecognition) console.log('⚠️  Update browser for voice input');
if (voiceSupport) {
  console.log('✓ Browser fully supports voice features');
} else {
  console.log('⚠️  Some voice features unavailable. App will still work with text.');
}
