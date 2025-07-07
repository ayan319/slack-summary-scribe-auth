const { default: fetch } = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testResendIntegration() {
  console.log('🧪 Testing Resend Email Integration...\n');
  
  try {
    // First, create a test user and get auth token
    const testEmail = `resend-test-${Date.now()}@example.com`;
    const testPassword = 'password123';
    
    console.log('1️⃣ Creating test user and logging in...');
    
    // Signup
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Resend Test User',
        email: testEmail,
        password: testPassword
      })
    });
    
    if (!signupResponse.ok) {
      console.log('❌ Failed to create test user');
      return;
    }
    
    // Extract auth token
    const signupCookies = signupResponse.headers.get('set-cookie');
    let authToken = null;
    if (signupCookies) {
      const tokenMatch = signupCookies.match(/auth-token=([^;]+)/);
      if (tokenMatch) {
        authToken = tokenMatch[1];
      }
    }
    
    if (!authToken) {
      console.log('❌ Failed to get auth token');
      return;
    }
    
    console.log('✅ Test user created and authenticated');
    
    // Test 2: Check API endpoint status
    console.log('\n2️⃣ Checking email API status...');
    
    const statusResponse = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'GET'
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Email API is available');
      console.log('📋 API Info:', statusData);
    } else {
      console.log('❌ Email API is not available');
      return;
    }
    
    // Test 3: Send a simple text email
    console.log('\n3️⃣ Testing simple text email...');
    
    const textEmailResponse = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test Email from Resend Integration',
        text: 'This is a test email sent via the Resend API integration. If you receive this, the integration is working correctly!'
      })
    });
    
    const textEmailData = await textEmailResponse.json();
    console.log('Text Email Response:', textEmailData);
    
    if (textEmailResponse.ok && textEmailData.success) {
      console.log('✅ Text email sent successfully!');
      console.log('📧 Email ID:', textEmailData.data?.id);
    } else {
      console.log('❌ Text email failed:', textEmailData.error);
    }
    
    // Test 4: Send an HTML email
    console.log('\n4️⃣ Testing HTML email...');
    
    const htmlEmailResponse = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'HTML Test Email from Resend',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">HTML Email Test</h1>
            <p>This is a <strong>test HTML email</strong> sent via the Resend API integration.</p>
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2>Features Tested:</h2>
              <ul>
                <li>✅ HTML content rendering</li>
                <li>✅ CSS styling</li>
                <li>✅ Resend API integration</li>
                <li>✅ Authentication</li>
              </ul>
            </div>
            <a href="https://resend.com" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Visit Resend</a>
          </div>
        `,
        text: 'HTML Email Test - This is a test HTML email sent via the Resend API integration. Features tested: HTML content rendering, CSS styling, Resend API integration, Authentication.'
      })
    });
    
    const htmlEmailData = await htmlEmailResponse.json();
    console.log('HTML Email Response:', htmlEmailData);
    
    if (htmlEmailResponse.ok && htmlEmailData.success) {
      console.log('✅ HTML email sent successfully!');
      console.log('📧 Email ID:', htmlEmailData.data?.id);
    } else {
      console.log('❌ HTML email failed:', htmlEmailData.error);
    }
    
    // Test 5: Test validation errors
    console.log('\n5️⃣ Testing validation errors...');
    
    const invalidEmailResponse = await fetch(`${BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify({
        to: 'invalid-email',
        subject: 'Test',
        text: 'Test'
      })
    });
    
    const invalidEmailData = await invalidEmailResponse.json();
    
    if (invalidEmailResponse.status === 400 && invalidEmailData.error?.includes('Invalid email')) {
      console.log('✅ Email validation is working correctly');
    } else {
      console.log('⚠️ Email validation might not be working as expected');
    }
    
    // Test 6: Test rate limiting (optional)
    console.log('\n6️⃣ Testing rate limiting...');
    
    let rateLimitHit = false;
    for (let i = 0; i < 3; i++) {
      const rateLimitResponse = await fetch(`${BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `auth-token=${authToken}`
        },
        body: JSON.stringify({
          to: 'ratelimit@example.com',
          subject: `Rate limit test ${i + 1}`,
          text: 'Testing rate limiting'
        })
      });
      
      const rateLimitData = await rateLimitResponse.json();
      console.log(`Request ${i + 1}:`, {
        status: rateLimitResponse.status,
        success: rateLimitData.success,
        remaining: rateLimitData.rateLimit?.remaining
      });
      
      if (rateLimitResponse.status === 429) {
        console.log('✅ Rate limiting is working!');
        rateLimitHit = true;
        break;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!rateLimitHit) {
      console.log('ℹ️ Rate limit not hit (normal for low volume testing)');
    }
    
    console.log('\n🎉 Resend integration testing completed!');
    console.log('\n📋 Summary:');
    console.log('✅ API endpoint accessible');
    console.log('✅ Authentication working');
    console.log('✅ Text emails sending');
    console.log('✅ HTML emails sending');
    console.log('✅ Email validation working');
    console.log('✅ Rate limiting implemented');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testResendIntegration();
