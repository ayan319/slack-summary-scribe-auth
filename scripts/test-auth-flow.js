const { createClient } = require('@supabase/supabase-js');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAuthFlow() {
  log(colors.blue + colors.bold, '🧪 Testing Complete Authentication Flow...\n');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let session = null;
  let testsPassed = 0;
  let totalTests = 0;

  try {
    // Test 1: Signup
    totalTests++;
    log(colors.cyan, '1️⃣ Testing Signup...');

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      options: {
        data: { name: 'Test User' }
      }
    });

    if (signupError) {
      log(colors.red, `❌ Signup failed: ${signupError.message}`);
    } else {
      testsPassed++;
      log(colors.green, `✅ Signup successful for: ${signupData.user?.email}`);
    }

    // Test 2: Login
    totalTests++;
    log(colors.cyan, '\n2️⃣ Testing Login...');

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    if (loginError) {
      log(colors.red, `❌ Login failed: ${loginError.message}`);
    } else if (loginData.user && loginData.session) {
      testsPassed++;
      session = loginData.session;
      log(colors.green, `✅ Login successful for: ${loginData.user.email}`);
      log(colors.blue, `   Session token: ${loginData.session.access_token.substring(0, 20)}...`);
    }

    // Test 3: Dashboard API
    totalTests++;
    log(colors.cyan, '\n3️⃣ Testing Dashboard API...');

    if (session) {
      const dashboardResponse = await fetch(`${BASE_URL}/api/dashboard`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (dashboardResponse.ok) {
        testsPassed++;
        const dashboardData = await dashboardResponse.json();
        log(colors.green, '✅ Dashboard API successful');
        log(colors.blue, `   User: ${dashboardData.data?.user?.email || 'Unknown'}`);
      } else {
        const errorText = await dashboardResponse.text();
        log(colors.red, `❌ Dashboard API failed: ${dashboardResponse.status}`);
        log(colors.red, `   Response: ${errorText}`);
      }
    } else {
      log(colors.red, '❌ No session available for dashboard test');
    }

    // Test 4: Session Validation
    totalTests++;
    log(colors.cyan, '\n4️⃣ Testing Session Validation...');

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      log(colors.red, `❌ Session validation failed: ${sessionError.message}`);
    } else if (sessionData.session) {
      testsPassed++;
      log(colors.green, '✅ Session validation successful');
      log(colors.blue, `   User: ${sessionData.session.user.email}`);
    } else {
      log(colors.red, '❌ No session found during validation');
    }

    // Test 5: Logout
    totalTests++;
    log(colors.cyan, '\n5️⃣ Testing Logout...');

    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      log(colors.red, `❌ Logout failed: ${logoutError.message}`);
    } else {
      testsPassed++;
      log(colors.green, '✅ Logout successful');
    }

    // Summary
    log(colors.blue + colors.bold, '\n📋 Test Summary:');
    log(colors.blue, `   Total Tests: ${totalTests}`);
    log(colors.green, `   Passed: ${testsPassed}`);
    log(colors.red, `   Failed: ${totalTests - testsPassed}`);
    log(colors.blue, `   Success Rate: ${Math.round((testsPassed / totalTests) * 100)}%`);

    if (testsPassed === totalTests) {
      log(colors.green + colors.bold, '\n🎉 ALL TESTS PASSED! Auth flow is working correctly.');
      return true;
    } else {
      log(colors.red + colors.bold, '\n❌ SOME TESTS FAILED! Please review and fix issues.');
      return false;
    }
  } catch (error) {
    log(colors.red + colors.bold, `\n❌ Test suite failed: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  const success = await testAuthFlow();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}
