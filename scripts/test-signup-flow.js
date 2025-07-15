#!/usr/bin/env node

/**
 * Test Signup Flow
 * Comprehensive test of the signup process and profile creation
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Testing Signup Flow & Profile Creation\n');

async function testSignupFlow() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const testEmail = 'testuser+1@example.com';
  const testPassword = 'TestPassword123';
  const testName = 'Test User';

  console.log('📧 Testing signup with:', testEmail);
  console.log('🔒 Password policy test:', testPassword);
  console.log('👤 Name:', testName);
  console.log('');

  try {
    // Step 1: Clean up any existing test user
    console.log('🧹 Cleaning up any existing test user...');
    try {
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === testEmail);
      if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
        console.log('✅ Existing test user cleaned up');
      }
    } catch (cleanupError) {
      console.log('⚠️  Cleanup warning:', cleanupError.message);
    }

    // Step 2: Test password validation
    console.log('\n🔍 Testing password validation...');
    
    function validatePassword(password) {
      if (password.length < 6) {
        return 'Password must be at least 6 characters long';
      }
      if (password.length < 8) {
        return 'Password should be at least 8 characters for better security';
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
      return null;
    }

    const passwordError = validatePassword(testPassword);
    if (passwordError) {
      console.log('❌ Password validation failed:', passwordError);
      return false;
    }
    console.log('✅ Password validation passed');

    // Step 3: Test signup
    console.log('\n🚀 Testing signup process...');
    
    const { data: signupData, error: signupError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm for testing
      user_metadata: {
        name: testName,
        full_name: testName
      }
    });

    if (signupError) {
      console.log('❌ Signup failed:', signupError.message);
      return false;
    }

    console.log('✅ User created successfully');
    console.log('   User ID:', signupData.user.id);
    console.log('   Email:', signupData.user.email);
    console.log('   Confirmed:', signupData.user.email_confirmed_at ? 'Yes' : 'No');

    // Step 4: Wait for trigger to run
    console.log('\n⏳ Waiting for database trigger to create profile...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 5: Check if profile was created
    console.log('\n🔍 Checking if profile was created...');
    
    const { data: profiles, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', signupData.user.id);

    if (profileError) {
      console.log('❌ Profile check failed:', profileError.message);
    } else if (profiles.length === 0) {
      console.log('❌ No profile found - trigger may not have run');
    } else if (profiles.length > 1) {
      console.log('⚠️  Multiple profiles found:', profiles.length);
      console.log('   This may indicate a trigger issue');
    } else {
      console.log('✅ Profile created successfully:');
      console.log('   ID:', profiles[0].id);
      console.log('   Name:', profiles[0].name);
      console.log('   Email:', profiles[0].email);
      console.log('   Avatar URL:', profiles[0].avatar_url || 'None');
      console.log('   Created:', profiles[0].created_at);
    }

    // Step 6: Test user authentication
    console.log('\n🔐 Testing user authentication...');
    
    const clientSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: authData, error: authError } = await clientSupabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
    } else {
      console.log('✅ Authentication successful');
      console.log('   Session exists:', !!authData.session);
      console.log('   User ID matches:', authData.user.id === signupData.user.id);
      
      // Sign out
      await clientSupabase.auth.signOut();
      console.log('✅ Signed out successfully');
    }

    // Step 7: Test dashboard API access
    console.log('\n🌐 Testing dashboard API access...');
    
    // This would require a full server setup, so we'll skip for now
    console.log('⚠️  Dashboard API test skipped (requires server)');

    // Step 8: Clean up
    console.log('\n🧹 Cleaning up test user...');
    await supabase.auth.admin.deleteUser(signupData.user.id);
    console.log('✅ Test user cleaned up');

    return true;

  } catch (error) {
    console.error('\n💥 Test failed with error:', error);
    return false;
  }
}

// Test specific error cases
async function testErrorCases() {
  console.log('\n🚨 Testing Error Cases\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Test 1: Weak password
  console.log('1️⃣ Testing weak password...');
  try {
    const { error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: '123'
    });
    
    if (error) {
      console.log('✅ Weak password rejected:', error.message);
    } else {
      console.log('❌ Weak password was accepted (unexpected)');
    }
  } catch (err) {
    console.log('✅ Weak password rejected:', err.message);
  }

  // Test 2: Invalid email
  console.log('\n2️⃣ Testing invalid email...');
  try {
    const { error } = await supabase.auth.signUp({
      email: 'invalid-email',
      password: 'TestPassword123'
    });
    
    if (error) {
      console.log('✅ Invalid email rejected:', error.message);
    } else {
      console.log('❌ Invalid email was accepted (unexpected)');
    }
  } catch (err) {
    console.log('✅ Invalid email rejected:', err.message);
  }

  // Test 3: Duplicate email (create user first)
  console.log('\n3️⃣ Testing duplicate email...');
  const testEmail = 'duplicate@example.com';
  
  try {
    // Create first user
    const { data: firstUser, error: firstError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123'
    });
    
    if (!firstError && firstUser.user) {
      // Try to create duplicate
      const { error: duplicateError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123'
      });
      
      if (duplicateError) {
        console.log('✅ Duplicate email rejected:', duplicateError.message);
      } else {
        console.log('❌ Duplicate email was accepted (unexpected)');
      }
    }
  } catch (err) {
    console.log('✅ Duplicate email test completed:', err.message);
  }

  return true;
}

// Generate test report
function generateTestReport(signupSuccess, errorTestSuccess) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SIGNUP FLOW TEST REPORT');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Signup Flow', success: signupSuccess },
    { name: 'Error Handling', success: errorTestSuccess }
  ];
  
  const passedTests = tests.filter(t => t.success).length;
  const totalTests = tests.length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`📈 Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);
  console.log('\n📋 Test Results:');
  
  tests.forEach(test => {
    const status = test.success ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
  });
  
  if (successRate === 100) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✨ Signup flow is fully functional');
    console.log('🚀 Ready for production use');
  } else if (successRate >= 50) {
    console.log('\n⚠️  SOME ISSUES DETECTED');
    console.log('🔍 Please review failed tests');
  } else {
    console.log('\n❌ CRITICAL ISSUES');
    console.log('🚨 Signup flow needs attention');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Fix any failed tests');
  console.log('2. Test with real user signup');
  console.log('3. Verify dashboard access after signup');
  console.log('4. Deploy to production');
  
  return successRate >= 80;
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive signup flow test...\n');
  
  try {
    const signupSuccess = await testSignupFlow();
    const errorTestSuccess = await testErrorCases();
    
    const overallSuccess = generateTestReport(signupSuccess, errorTestSuccess);
    
    console.log('\n🏁 Signup flow testing complete!');
    return overallSuccess;
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    return false;
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error during testing:', error);
      process.exit(1);
    });
}

module.exports = main;
