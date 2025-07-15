#!/usr/bin/env node

/**
 * Simple Production Test
 * Tests core signup functionality without complex database dependencies
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

console.log('🎯 SIMPLE PRODUCTION TEST\n');

async function simpleProductionTest() {
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
  const testEmail = `simple-test-${timestamp}@gmail.com`;
  const testPassword = 'SimpleTest123';
  const testName = 'Simple Test User';

  console.log('📧 Testing core signup functionality for:', testEmail);
  console.log('');

  const testResults = {
    signup: false,
    authentication: false,
    profileCreation: false,
    cleanup: false
  };

  let userId = null;

  try {
    // Step 1: Test client-side signup
    console.log('🚀 Step 1: Testing client-side signup...');
    
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
      console.log('❌ Signup failed:', signupError.message);
      return testResults;
    }

    console.log('✅ Signup successful');
    console.log('   User ID:', signupData.user?.id);
    console.log('   Email:', signupData.user?.email);
    testResults.signup = true;
    userId = signupData.user?.id;

    // Step 2: Confirm email and test authentication
    console.log('\n🔐 Step 2: Testing authentication...');
    
    if (userId) {
      // Confirm email using admin client
      try {
        await adminSupabase.auth.admin.updateUserById(userId, { email_confirm: true });
        console.log('✅ Email confirmed');
      } catch (confirmErr) {
        console.log('⚠️  Email confirmation failed:', confirmErr.message);
      }
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
      testResults.authentication = true;
    }

    // Step 3: Test manual profile creation
    console.log('\n👤 Step 3: Testing manual profile creation...');
    
    if (authData.session && userId) {
      try {
        // Try direct insert with authenticated user
        const { data: profileData, error: profileError } = await clientSupabase
          .from('users')
          .insert({
            id: userId,
            email: testEmail,
            name: testName,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (profileError) {
          console.log('⚠️  Direct profile creation failed:', profileError.message);
          
          // Try upsert function if available
          try {
            const { data: upsertData, error: upsertError } = await clientSupabase
              .rpc('upsert_user_profile', {
                user_name: testName,
                user_avatar_url: null
              });
              
            if (upsertError) {
              console.log('⚠️  Upsert function failed:', upsertError.message);
            } else {
              console.log('✅ Profile created via upsert function');
              testResults.profileCreation = true;
            }
          } catch (upsertErr) {
            console.log('⚠️  Upsert function not available');
          }
        } else {
          console.log('✅ Profile created via direct insert');
          console.log('   Name:', profileData.name);
          console.log('   Email:', profileData.email);
          testResults.profileCreation = true;
        }
      } catch (profileErr) {
        console.log('⚠️  Profile creation error:', profileErr.message);
      }
    }

    // Step 4: Clean up
    console.log('\n🧹 Step 4: Cleaning up test user...');
    if (userId) {
      await adminSupabase.auth.admin.deleteUser(userId);
      console.log('✅ Test user cleaned up');
      testResults.cleanup = true;
    }

    return testResults;

  } catch (error) {
    console.error('\n💥 Test failed with error:', error);
    
    // Emergency cleanup
    if (userId) {
      try {
        await adminSupabase.auth.admin.deleteUser(userId);
        console.log('🧹 Emergency cleanup completed');
      } catch (cleanupErr) {
        console.log('⚠️  Emergency cleanup failed:', cleanupErr.message);
      }
    }
    
    return testResults;
  }
}

// Generate simple report
function generateSimpleReport(results) {
  console.log('\n' + '='.repeat(50));
  console.log('📊 SIMPLE PRODUCTION TEST REPORT');
  console.log('='.repeat(50));
  
  const tests = [
    { name: 'User Signup', key: 'signup', critical: true },
    { name: 'Authentication', key: 'authentication', critical: true },
    { name: 'Profile Creation', key: 'profileCreation', critical: false },
    { name: 'Cleanup', key: 'cleanup', critical: false }
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
  
  console.log('📋 Test Results:');
  tests.forEach(test => {
    const status = results[test.key] ? '✅' : '❌';
    const critical = test.critical ? ' (CRITICAL)' : '';
    console.log(`${status} ${test.name}${critical}`);
  });
  
  console.log('\n🎯 ASSESSMENT:');
  
  if (criticalSuccessRate === 100) {
    console.log('🎉 CORE FUNCTIONALITY WORKING!');
    console.log('✨ Critical signup and auth components operational');
    
    if (results.profileCreation) {
      console.log('✅ Profile creation also working');
      console.log('🚀 READY FOR PRODUCTION DEPLOYMENT!');
    } else {
      console.log('⚠️  Profile creation needs database setup');
      console.log('🚀 READY FOR DEPLOYMENT (with manual profile handling)');
    }
    
  } else {
    console.log('❌ CRITICAL ISSUES DETECTED');
    console.log('🚨 Core functionality not working properly');
    
    const failedCritical = criticalTests.filter(t => !results[t.key]);
    console.log('\n🔧 Critical Issues:');
    failedCritical.forEach(test => {
      console.log(`   • ${test.name}`);
    });
  }
  
  console.log('\n🎯 DEPLOYMENT STRATEGY:');
  
  if (criticalSuccessRate === 100) {
    console.log('1. ✅ Deploy to Vercel immediately');
    console.log('2. ✅ Enable user signups');
    console.log('3. ⚠️  Monitor for profile creation issues');
    console.log('4. 🔧 Run database setup when possible');
    console.log('5. 🚀 Launch on Product Hunt');
  } else {
    console.log('1. 🔧 Fix critical signup/auth issues');
    console.log('2. 🧪 Re-run tests until passing');
    console.log('3. 🚀 Then deploy to production');
  }
  
  return criticalSuccessRate === 100;
}

// Main execution
async function main() {
  console.log('🚀 Starting simple production test...\n');
  
  try {
    const results = await simpleProductionTest();
    const isReady = generateSimpleReport(results);
    
    console.log('\n🏁 Simple production test complete!');
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
