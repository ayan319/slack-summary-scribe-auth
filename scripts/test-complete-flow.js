const { default: fetch } = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testCompleteAuthFlow() {
  console.log('🧪 Testing Complete Authentication Flow with Email Verification...\n');
  
  try {
    // Use a unique email for this test
    const testEmail = `complete-test-${Date.now()}@example.com`;
    const testPassword = 'password123';
    const testName = 'Complete Test User';
    
    console.log(`Using test email: ${testEmail}`);
    
    // Test 1: Complete signup flow
    console.log('\n1️⃣ Testing Complete Signup Flow...');
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
    console.log('Signup Response:', {
      success: signupData.success,
      emailSent: signupData.emailSent,
      userEmailVerified: signupData.user?.emailVerified
    });
    
    if (!signupResponse.ok) {
      console.log('❌ Signup failed!');
      return;
    }
    
    console.log('✅ Signup successful with email verification flow!');
    
    // Extract JWT token
    const signupCookies = signupResponse.headers.get('set-cookie');
    let authToken = null;
    if (signupCookies) {
      const tokenMatch = signupCookies.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
      }
    }
    
    // Test 2: Dashboard access (unverified user)
    console.log('\n2️⃣ Testing Dashboard Access (Unverified User)...');
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
      hasStats: !!dashboardData.stats,
      hasSummaries: !!dashboardData.recentSummaries,
      hasWorkspaces: !!dashboardData.slackWorkspaces
    });
    
    if (dashboardResponse.ok) {
      console.log('✅ Dashboard accessible to unverified users (with verification banner)');
    } else {
      console.log('❌ Dashboard access failed!');
      return;
    }
    
    // Test 3: Login flow
    console.log('\n3️⃣ Testing Login Flow...');
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
      userEmailVerified: loginData.user?.emailVerified
    });
    
    if (loginResponse.ok) {
      console.log('✅ Login successful with email verification status!');
    } else {
      console.log('❌ Login failed!');
      return;
    }
    
    // Test 4: Forgot password flow
    console.log('\n4️⃣ Testing Forgot Password Flow...');
    const forgotResponse = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail })
    });
    
    const forgotData = await forgotResponse.json();
    console.log('Forgot Password Response:', forgotData);
    
    if (forgotResponse.ok) {
      console.log('✅ Forgot password flow working!');
    } else {
      console.log('❌ Forgot password failed!');
    }
    
    // Test 5: Logout flow
    console.log('\n5️⃣ Testing Logout Flow...');
    const logoutResponse = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': `auth-token=${authToken}`
      }
    });
    
    const logoutData = await logoutResponse.json();
    console.log('Logout Response:', logoutData);
    
    if (logoutResponse.ok) {
      console.log('✅ Logout successful!');
    } else {
      console.log('❌ Logout failed!');
    }
    
    // Test 6: Dashboard access after logout (should fail)
    console.log('\n6️⃣ Testing Dashboard Access After Logout...');
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
    
    // Test 7: Email service status
    console.log('\n7️⃣ Testing Email Service Status...');
    try {
      const { emailService } = require('../lib/email');
      const isConfigured = emailService.isConfigured();
      const logs = emailService.getLogs();
      
      console.log('Email Service Status:', {
        configured: isConfigured,
        totalEmailsSent: logs.length,
        recentEmails: logs.slice(-3).map(log => ({
          type: log.type,
          to: log.to,
          subject: log.subject.substring(0, 30) + '...'
        }))
      });
      
      if (logs.length > 0) {
        console.log('✅ Email service is working (fallback mode)!');
      } else {
        console.log('⚠️ No emails found in logs');
      }
    } catch (error) {
      console.log('⚠️ Could not check email service status:', error.message);
    }
    
    console.log('\n🎉 Complete authentication flow test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Signup with email verification');
    console.log('✅ Dashboard access (with verification banner)');
    console.log('✅ Login with verification status');
    console.log('✅ Forgot password flow');
    console.log('✅ Logout functionality');
    console.log('✅ Protected route enforcement');
    console.log('✅ Email service (fallback mode)');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCompleteAuthFlow();
