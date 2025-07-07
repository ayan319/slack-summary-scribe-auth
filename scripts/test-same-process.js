const { default: fetch } = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testSameProcess() {
  console.log('🧪 Testing Auth Flow in Same Process...\n');
  
  try {
    // Use a unique email for this test
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    console.log(`Using test email: ${testEmail}`);
    
    // Test 1: Signup
    console.log('\n1️⃣ Testing Signup...');
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: testEmail,
        password: testPassword
      })
    });
    
    const signupData = await signupResponse.json();
    console.log('Signup Response:', signupData);
    
    if (!signupResponse.ok) {
      console.log('❌ Signup failed!');
      return;
    }
    
    console.log('✅ Signup successful!');
    
    // Extract JWT token from signup
    const signupCookies = signupResponse.headers.get('set-cookie');
    let authToken = null;
    if (signupCookies) {
      const tokenMatch = signupCookies.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
        console.log('Extracted Auth Token from Signup:', authToken.substring(0, 50) + '...');
      }
    }
    
    // Test 2: Login immediately after signup
    console.log('\n2️⃣ Testing Login (immediately after signup)...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed!');
      console.log('This suggests the fallback store is not persisting between requests');
      return;
    }
    
    console.log('✅ Login successful!');
    
    // Extract JWT token from login
    const loginCookies = loginResponse.headers.get('set-cookie');
    if (loginCookies) {
      const tokenMatch = loginCookies.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
        console.log('Extracted Auth Token from Login:', authToken.substring(0, 50) + '...');
      }
    }
    
    if (!authToken) {
      console.log('❌ No auth token found!');
      return;
    }
    
    // Test 3: Dashboard Access
    console.log('\n3️⃣ Testing Dashboard Access...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${authToken}`
      }
    });
    
    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard Response:', dashboardData);
    
    if (!dashboardResponse.ok) {
      console.log('❌ Dashboard access failed!');
      return;
    }
    
    console.log('✅ Dashboard access successful!');
    console.log('User Data:', dashboardData.user);
    console.log('Stats:', dashboardData.stats);
    
    console.log('\n🎉 All tests passed! Auth flow is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testSameProcess();
