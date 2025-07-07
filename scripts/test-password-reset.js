const { default: fetch } = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testPasswordResetFlow() {
  console.log('🧪 Testing Password Reset Flow...\n');
  
  try {
    // Use a unique email for this test
    const testEmail = `reset-test-${Date.now()}@example.com`;
    const testPassword = 'password123';
    const newPassword = 'newpassword456';
    const testName = 'Reset Test User';
    
    console.log(`Using test email: ${testEmail}`);
    
    // Test 1: Create a user first
    console.log('\n1️⃣ Creating test user...');
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
    console.log('Signup Response:', signupData.success ? 'Success' : 'Failed');
    
    if (!signupResponse.ok) {
      console.log('❌ Failed to create test user!');
      return;
    }
    
    console.log('✅ Test user created successfully!');
    
    // Test 2: Request password reset
    console.log('\n2️⃣ Testing Forgot Password Request...');
    const forgotResponse = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    });
    
    const forgotData = await forgotResponse.json();
    console.log('Forgot Password Response:', forgotData);
    
    if (!forgotResponse.ok) {
      console.log('❌ Forgot password request failed!');
      return;
    }
    
    console.log('✅ Password reset email sent successfully!');
    console.log('📧 Reset email should be sent (check logs)');
    
    // Test 3: Test with non-existent email (should still return success for security)
    console.log('\n3️⃣ Testing Forgot Password with Non-existent Email...');
    const nonExistentResponse = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'nonexistent@example.com' })
    });
    
    const nonExistentData = await nonExistentResponse.json();
    console.log('Non-existent Email Response:', nonExistentData);
    
    if (nonExistentResponse.ok && nonExistentData.success) {
      console.log('✅ Security: Non-existent email returns success (doesn\'t reveal user existence)');
    } else {
      console.log('⚠️ Security issue: Non-existent email reveals information');
    }
    
    // Test 4: Test password reset with invalid token
    console.log('\n4️⃣ Testing Password Reset with Invalid Token...');
    const invalidTokenResponse = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token: 'invalid-token-12345',
        password: newPassword
      })
    });
    
    const invalidTokenData = await invalidTokenResponse.json();
    console.log('Invalid Token Response:', invalidTokenData);
    
    if (invalidTokenResponse.status === 400 && invalidTokenData.message.includes('Invalid')) {
      console.log('✅ Password reset correctly rejects invalid token');
    } else {
      console.log('⚠️ Unexpected invalid token response');
    }
    
    // Test 5: Test token validation endpoint
    console.log('\n5️⃣ Testing Token Validation Endpoint...');
    const validateResponse = await fetch(`${BASE_URL}/api/auth/reset-password?token=invalid-token`);
    
    const validateData = await validateResponse.json();
    console.log('Token Validation Response:', validateData);
    
    if (validateResponse.status === 400 && validateData.message.includes('Invalid')) {
      console.log('✅ Token validation correctly rejects invalid token');
    } else {
      console.log('⚠️ Unexpected token validation response');
    }
    
    // Test 6: Test rate limiting
    console.log('\n6️⃣ Testing Rate Limiting...');
    console.log('Attempting multiple rapid forgot password requests...');
    
    for (let i = 0; i < 6; i++) {
      const rapidForgotResponse = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail })
      });
      
      const rapidForgotData = await rapidForgotResponse.json();
      console.log(`Request ${i + 1}:`, {
        status: rapidForgotResponse.status,
        success: rapidForgotData.success,
        message: rapidForgotData.message?.substring(0, 50) + '...'
      });
      
      if (rapidForgotResponse.status === 429) {
        console.log('✅ Rate limiting is working correctly!');
        break;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Test 7: Test password validation
    console.log('\n7️⃣ Testing Password Validation...');
    const weakPasswordResponse = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        token: 'some-token',
        password: '123' // Too weak
      })
    });
    
    const weakPasswordData = await weakPasswordResponse.json();
    console.log('Weak Password Response:', weakPasswordData);
    
    if (weakPasswordResponse.status === 400 && weakPasswordData.message.includes('8 characters')) {
      console.log('✅ Password validation is working correctly');
    } else {
      console.log('⚠️ Password validation might not be working');
    }
    
    // Test 8: Test login with original password (should still work)
    console.log('\n8️⃣ Testing Login with Original Password...');
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
    console.log('Login Response:', {
      success: loginData.success,
      userEmail: loginData.user?.email
    });
    
    if (loginResponse.ok) {
      console.log('✅ Login with original password still works (reset not completed)');
    } else {
      console.log('❌ Login with original password failed unexpectedly');
    }
    
    console.log('\n🎉 Password reset flow tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testPasswordResetFlow();
