const { default: fetch } = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testEmailVerificationFlow() {
  console.log('🧪 Testing Email Verification Flow...\n');
  
  try {
    // Use a unique email for this test
    const testEmail = `verify-test-${Date.now()}@example.com`;
    const testPassword = 'password123';
    const testName = 'Verification Test User';
    
    console.log(`Using test email: ${testEmail}`);
    
    // Test 1: Signup with email verification
    console.log('\n1️⃣ Testing Signup with Email Verification...');
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: testName,
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
    console.log('📧 Email verification should be sent (check logs)');
    console.log('👤 User email verified status:', signupData.user?.emailVerified);
    
    // Extract JWT token from signup
    const signupCookies = signupResponse.headers.get('set-cookie');
    let authToken = null;
    if (signupCookies) {
      const tokenMatch = signupCookies.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
        console.log('Extracted Auth Token:', authToken.substring(0, 50) + '...');
      }
    }
    
    // Test 2: Dashboard access (should work but show verification banner)
    console.log('\n2️⃣ Testing Dashboard Access (unverified user)...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${authToken}`
      }
    });
    
    const dashboardData = await dashboardResponse.json();
    console.log('Dashboard Response:', {
      success: dashboardData.success || 'N/A',
      userEmailVerified: dashboardData.user?.emailVerified,
      statsCount: dashboardData.stats ? Object.keys(dashboardData.stats).length : 0
    });
    
    if (!dashboardResponse.ok) {
      console.log('❌ Dashboard access failed!');
      return;
    }
    
    console.log('✅ Dashboard access successful (unverified user can still access)');
    
    // Test 3: Resend verification email
    console.log('\n3️⃣ Testing Resend Verification Email...');
    const resendResponse = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Cookie': `auth-token=${authToken}`
      }
    });
    
    const resendData = await resendResponse.json();
    console.log('Resend Response:', resendData);
    
    if (resendResponse.ok) {
      console.log('✅ Resend verification email successful!');
    } else {
      console.log('⚠️ Resend verification email failed (might be rate limited)');
    }
    
    // Test 4: Mock email verification (since we can't easily get the token from email logs)
    console.log('\n4️⃣ Testing Email Verification with Mock Token...');
    const mockToken = 'mock-verification-token-for-testing';
    
    const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: mockToken })
    });
    
    const verifyData = await verifyResponse.json();
    console.log('Verification Response:', verifyData);
    
    if (verifyResponse.status === 400 && verifyData.message.includes('Invalid')) {
      console.log('✅ Email verification correctly rejects invalid token');
    } else {
      console.log('⚠️ Unexpected verification response');
    }
    
    // Test 5: Rate limiting test
    console.log('\n5️⃣ Testing Rate Limiting...');
    console.log('Attempting multiple rapid resend requests...');
    
    for (let i = 0; i < 3; i++) {
      const rapidResendResponse = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Cookie': `auth-token=${authToken}`
        }
      });
      
      const rapidResendData = await rapidResendResponse.json();
      console.log(`Request ${i + 1}:`, {
        status: rapidResendResponse.status,
        success: rapidResendData.success,
        message: rapidResendData.message?.substring(0, 50) + '...'
      });
      
      if (rapidResendResponse.status === 429) {
        console.log('✅ Rate limiting is working correctly!');
        break;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n🎉 Email verification flow tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailVerificationFlow();
