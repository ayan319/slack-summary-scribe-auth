const { default: fetch } = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testAuthFlow() {
  console.log('🧪 Testing Complete Authentication Flow...\n');
  
  try {
    // Test 1: Signup
    console.log('1️⃣ Testing Signup...');
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const signupData = await signupResponse.json();
    console.log('Signup Response:', signupData);
    
    if (signupResponse.ok) {
      console.log('✅ Signup successful!');
    } else {
      console.log('⚠️ Signup failed (might be expected if user exists)');
    }
    
    // Extract cookies from signup
    const signupCookies = signupResponse.headers.get('set-cookie');
    console.log('Signup Cookies:', signupCookies);
    
    // Test 2: Login
    console.log('\n2️⃣ Testing Login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login Response:', loginData);
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed!');
      return;
    }
    
    console.log('✅ Login successful!');
    
    // Extract JWT token from login
    const loginCookies = loginResponse.headers.get('set-cookie');
    console.log('Login Cookies:', loginCookies);
    
    // Parse the auth-token cookie
    let authToken = null;
    if (loginCookies) {
      const tokenMatch = loginCookies.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
        console.log('Extracted Auth Token:', authToken.substring(0, 50) + '...');
      }
    }
    
    if (!authToken) {
      console.log('❌ No auth token found in login response!');
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
    
    // Test 4: Logout
    console.log('\n4️⃣ Testing Logout...');
    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': `auth-token=${authToken}`
      }
    });
    
    const logoutData = await logoutResponse.json();
    console.log('Logout Response:', logoutData);
    
    if (!logoutResponse.ok) {
      console.log('❌ Logout failed!');
      return;
    }
    
    console.log('✅ Logout successful!');
    
    // Test 5: Dashboard Access After Logout (should fail)
    console.log('\n5️⃣ Testing Dashboard Access After Logout (should fail)...');
    const dashboardAfterLogoutResponse = await fetch(`${BASE_URL}/api/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${authToken}`
      }
    });
    
    if (dashboardAfterLogoutResponse.status === 401) {
      console.log('✅ Dashboard correctly blocked after logout!');
    } else {
      console.log('⚠️ Dashboard access after logout should be blocked');
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAuthFlow();
