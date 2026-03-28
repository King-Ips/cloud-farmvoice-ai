// test_api_proxy.js
// Test the backend API proxy

console.log('=== API Proxy Tests ===\n');

// Test 1: API Endpoint Availability
async function testAPI() {
  console.log('Test 1: API Endpoint Check');
  try {
    const response = await fetch('/api/ask', { method: 'OPTIONS' });
    console.log('API endpoint accessible:', response.ok ? '✓ YES' : '✗ NO');
  } catch (e) {
    console.error('API check failed:', e.message);
  }
}

// Test 2: Test Ask API (with timeout for safety)
async function testAskAPI() {
  console.log('\nTest 2: Ask API');
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Test timeout')), 5000)
  );
  
  try {
    const promise = fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What is farming?' })
    }).then(r => r.json());
    
    const result = await Promise.race([promise, timeoutPromise]);
    console.log('API response received:', result.response ? '✓ YES' : '✗ NO');
    if (result.error) {
      console.log('Error message:', result.error);
    }
  } catch (e) {
    console.error('API test:', e.message);
  }
}

// Test 3: Input Validation
console.log('\nTest 3: Input Validation');
async function testValidation() {
  try {
    // Test with empty question
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '' })
    }).then(r => r.json());
    console.log('Empty input rejected:', response.error ? '✓ YES' : '✗ NO');
  } catch (e) {
    console.log('Empty input test error:', e.message);
  }
}

// Test 4: CORS Headers
console.log('\nTest 4: CORS Headers');
async function testCORS() {
  try {
    const response = await fetch('/js/app.js');
    const cors = response.headers.get('Access-Control-Allow-Origin');
    console.log('CORS header present:', cors ? `✓ YES (${cors})` : '✗ NO');
  } catch (e) {
    console.error('CORS check failed:', e.message);
  }
}

// Run all tests
console.log('Starting tests...\n');
testAPI();
testCORS();
testValidation();

// Note: Ask API test requires valid GEMINI_API_KEY in server
setTimeout(() => {
  testAskAPI();
}, 1000);
