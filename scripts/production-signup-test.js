#!/usr/bin/env node

/**
 * Production Signup Flow Test
 * Comprehensive test for production deployment readiness
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

console.log('🚀 PRODUCTION SIGNUP FLOW TEST\n');

async function productionSignupTest() {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const clientSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Use a unique email for each test
  const timestamp = Date.now();
  const testEmail = `production-test-${timestamp}@gmail.com`;
  const testPassword = 'ProductionTest123';
  const testName = 'Production Test User';

  console.log('📧 Testing production signup flow for:', testEmail);
  console.log('');

  const testResults = {
    cleanup: false,
    signup: false,
    profileCreation: false,
    authentication: false,
    profileAccess: false,
    fallbackWorking: false
  };

  try {
    // Step 1: Clean up any existing test users
    console.log('🧹 Step 1: Cleaning up existing test users...');
    try {
      const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
      const testUsers = existingUsers.users.filter(u => u.email?.includes('production-test-'));
      
      for (const user of testUsers) {
        await adminSupabase.auth.admin.deleteUser(user.id);
      }
      
      console.log(`✅ Cleaned up ${testUsers.length} existing test users`);
      testResults.cleanup = true;
    } catch (cleanupError) {
      console.log('⚠️  Cleanup warning:', cleanupError.message);
      testResults.cleanup = true; // Don't fail on cleanup
    }

    // Step 2: Test client-side signup
    console.log('\n🚀 Step 2: Testing client-side signup...');
    
    const { data: signupData, error: signupError } = await clientSupabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: testName,
          full_name: testName
        }
      }
    });

    if (signupError) {
      console.log('❌ Client signup failed:', signupError.message);
      return testResults;
    }

    console.log('✅ Client signup successful');
    console.log('   User ID:', signupData.user?.id);
    console.log('   Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Session exists:', !!signupData.session);
    testResults.signup = true;

    if (!signupData.user) {
      console.log('❌ No user returned from signup');
      return testResults;
    }

    const userId = signupData.user.id;

    // Step 3: Wait and check for automatic profile creation
    console.log('\n⏳ Step 3: Checking automatic profile creation...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: profiles, error: profileError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', userId);

    let profileExists = false;
    if (profileError) {
      console.log('❌ Profile check failed:', profileError.message);
    } else if (profiles.length === 0) {
      console.log('⚠️  No profile found - trigger may not be working');
    } else if (profiles.length > 1) {
      console.log('⚠️  Multiple profiles found - possible duplicate issue');
      profileExists = true;
    } else {
      console.log('✅ Profile created automatically:');
      console.log('   Name:', profiles[0].name);
      console.log('   Email:', profiles[0].email);
      profileExists = true;
    }
    testResults.profileCreation = profileExists;

    // Step 4: Test fallback profile creation if needed
    if (!profileExists) {
      console.log('\n🔧 Step 4: Testing fallback profile creation...');
      
      try {
        const { data: fallbackProfile, error: fallbackError } = await adminSupabase
          .rpc('create_user_profile_fallback', {
            user_id: userId,
            user_email: testEmail,
            user_name: testName,
            user_avatar_url: null
          });

        if (fallbackError) {
          console.log('❌ Fallback profile creation failed:', fallbackError.message);
        } else {
          console.log('✅ Fallback profile created:');
          console.log('   ID:', fallbackProfile.id);
          console.log('   Name:', fallbackProfile.name);
          console.log('   Email:', fallbackProfile.email);
          profileExists = true;
          testResults.fallbackWorking = true;
        }
      } catch (fallbackErr) {
        console.log('❌ Fallback profile creation error:', fallbackErr.message);
      }
    }

    // Step 5: Confirm email and test authentication
    console.log('\n🔐 Step 5: Testing authentication...');
    
    // Confirm email using admin client
    try {
      await adminSupabase.auth.admin.updateUserById(userId, { email_confirm: true });
      console.log('✅ Email confirmed via admin');
    } catch (confirmErr) {
      console.log('⚠️  Email confirmation failed:', confirmErr.message);
    }
    
    // Sign out first
    await clientSupabase.auth.signOut();
    
    const { data: authData, error: authError } = await clientSupabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      console.log('❌ Authentication failed:', authError.message);
    } else {
      console.log('✅ Authentication successful');
      console.log('   Session exists:', !!authData.session);
      console.log('   User ID matches:', authData.user?.id === userId);
      testResults.authentication = true;
    }

    // Step 6: Test profile access with authenticated user
    console.log('\n👤 Step 6: Testing profile access...');
    
    if (authData.session) {
      const { data: userProfile, error: profileAccessError } = await clientSupabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileAccessError) {
        console.log('❌ Profile access failed:', profileAccessError.message);
      } else {
        console.log('✅ Profile accessible to authenticated user:');
        console.log('   Name:', userProfile.name);
        console.log('   Email:', userProfile.email);
        testResults.profileAccess = true;
      }
    } else {
      console.log('⚠️  Skipped - no authenticated session');
    }

    // Step 7: Clean up test user
    console.log('\n🧹 Step 7: Cleaning up test user...');
    await adminSupabase.auth.admin.deleteUser(userId);
    console.log('✅ Test user cleaned up');

    return testResults;

  } catch (error) {
    console.error('\n💥 Test failed with error:', error);
    return testResults;
  }
}

// Generate production readiness report
function generateProductionReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PRODUCTION READINESS REPORT');
  console.log('='.repeat(60));
  
  const tests = [
    { name: 'Environment Cleanup', key: 'cleanup', critical: false },
    { name: 'User Signup', key: 'signup', critical: true },
    { name: 'Profile Creation', key: 'profileCreation', critical: true },
    { name: 'User Authentication', key: 'authentication', critical: true },
    { name: 'Profile Access', key: 'profileAccess', critical: true },
    { name: 'Fallback Mechanism', key: 'fallbackWorking', critical: false }
  ];
  
  const passedTests = tests.filter(t => results[t.key]).length;
  const criticalTests = tests.filter(t => t.critical);
  const passedCritical = criticalTests.filter(t => results[t.key]).length;
  const totalTests = tests.length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  const criticalSuccessRate = Math.round((passedCritical / criticalTests.length) * 100);
  
  console.log(`📈 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  console.log(`🎯 Critical Success Rate: ${criticalSuccessRate}% (${passedCritical}/${criticalTests.length})`);
  console.log('');
  
  console.log('📋 Detailed Results:');
  tests.forEach(test => {
    const status = results[test.key] ? '✅' : '❌';
    const critical = test.critical ? ' (CRITICAL)' : '';
    console.log(`${status} ${test.name}${critical}`);
  });
  
  console.log('\n🎯 PRODUCTION READINESS ASSESSMENT:');
  
  if (criticalSuccessRate === 100) {
    console.log('🎉 READY FOR PRODUCTION!');
    console.log('✨ All critical components are working');
    console.log('🚀 Safe to deploy and launch');
    
    console.log('\n📋 Pre-Launch Checklist:');
    console.log('✅ Signup flow functional');
    console.log('✅ Profile creation working');
    console.log('✅ Authentication system stable');
    console.log('✅ User data access secured');
    
    if (results.fallbackWorking) {
      console.log('✅ Fallback mechanisms in place');
    } else {
      console.log('⚠️  Consider running database setup: scripts/production-database-setup.sql');
    }
    
  } else if (criticalSuccessRate >= 75) {
    console.log('⚠️  MOSTLY READY - Minor Issues');
    console.log('🔧 Address remaining issues before launch');
    
    const failedCritical = criticalTests.filter(t => !results[t.key]);
    console.log('\n🚨 Critical Issues to Fix:');
    failedCritical.forEach(test => {
      console.log(`   • ${test.name}`);
    });
    
  } else {
    console.log('❌ NOT READY FOR PRODUCTION');
    console.log('🚨 Critical issues must be resolved');
    
    const failedCritical = criticalTests.filter(t => !results[t.key]);
    console.log('\n🔧 Required Fixes:');
    failedCritical.forEach(test => {
      console.log(`   • ${test.name}`);
    });
  }
  
  console.log('\n🎯 Next Steps:');
  if (criticalSuccessRate < 100) {
    console.log('1. Run database setup: scripts/production-database-setup.sql');
    console.log('2. Re-run this test until all critical tests pass');
  }
  console.log('3. Test manually in browser');
  console.log('4. Deploy to Vercel with cache clear');
  console.log('5. Monitor with Sentry and PostHog');
  console.log('6. Prepare for Product Hunt launch');
  
  return criticalSuccessRate === 100;
}

// Main execution
async function main() {
  console.log('🚀 Starting production signup flow test...\n');
  
  try {
    const results = await productionSignupTest();
    const isReady = generateProductionReport(results);
    
    console.log('\n🏁 Production signup flow test complete!');
    return isReady;
    
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
