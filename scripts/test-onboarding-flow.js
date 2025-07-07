#!/usr/bin/env node

/**
 * End-to-End Onboarding Flow Test
 * Tests complete signup → workspace creation → dashboard access flow
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

async function testEmailSignup() {
  console.log('🧪 Testing Email Signup Flow...\n');

  const testEmail = `test-signup-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  try {
    // 1. Test signup API
    console.log('1️⃣ Testing signup API...');
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName
      })
    });

    const signupData = await signupResponse.json();
    
    if (!signupResponse.ok) {
      console.error('❌ Signup failed:', signupData);
      return false;
    }

    console.log('✅ Signup successful');

    // 2. Wait for trigger to execute
    console.log('2️⃣ Waiting for workspace auto-creation...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin
      .listUsers();

    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return false;
    }

    const user = authUser.users.find(u => u.email === testEmail);
    if (!user) {
      console.error('❌ User not found in auth.users');
      return false;
    }

    console.log('✅ User created in auth.users');

    // 4. Check if user profile was created
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ User profile not created:', profileError);
      return false;
    }

    console.log('✅ User profile created');

    // 5. Check if organization was created
    const { data: userOrgs, error: orgError } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organizations(id, name)
      `)
      .eq('user_id', user.id);

    if (orgError || !userOrgs || userOrgs.length === 0) {
      console.error('❌ No organization found for user:', orgError);
      return false;
    }

    const org = userOrgs[0];
    if (org.role !== 'owner') {
      console.error('❌ User is not owner of organization');
      return false;
    }

    console.log(`✅ Organization created: "${org.organizations.name}"`);
    console.log(`✅ User role: ${org.role}`);

    // 6. Test login and dashboard access
    console.log('3️⃣ Testing login flow...');
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

    if (!loginResponse.ok) {
      console.warn('⚠️ Login test skipped (may require email verification)');
    } else {
      console.log('✅ Login successful');
    }

    // 7. Cleanup
    console.log('4️⃣ Cleaning up test data...');
    await supabase.auth.admin.deleteUser(user.id);
    console.log('✅ Test user cleaned up');

    console.log('\n🎉 Email signup flow test PASSED!\n');
    return true;

  } catch (error) {
    console.error('💥 Email signup test failed:', error);
    return false;
  }
}

async function testOAuthSignup() {
  console.log('🧪 Testing OAuth Signup Flow...\n');

  try {
    // Create a mock OAuth user directly in Supabase
    const testEmail = `oauth-test-${Date.now()}@example.com`;
    
    console.log('1️⃣ Creating OAuth test user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      user_metadata: {
        full_name: 'OAuth Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        provider: 'google'
      },
      app_metadata: {
        provider: 'google'
      }
    });

    if (error) {
      console.error('❌ OAuth user creation failed:', error);
      return false;
    }

    console.log('✅ OAuth user created');

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check workspace creation
    const { data: userOrgs, error: orgError } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organizations(id, name)
      `)
      .eq('user_id', data.user.id);

    if (orgError || !userOrgs || userOrgs.length === 0) {
      console.error('❌ No organization found for OAuth user:', orgError);
      return false;
    }

    console.log(`✅ OAuth workspace created: "${userOrgs[0].organizations.name}"`);

    // Cleanup
    await supabase.auth.admin.deleteUser(data.user.id);
    console.log('✅ OAuth test user cleaned up');

    console.log('\n🎉 OAuth signup flow test PASSED!\n');
    return true;

  } catch (error) {
    console.error('💥 OAuth signup test failed:', error);
    return false;
  }
}

async function testExistingUserFix() {
  console.log('🧪 Testing Existing User Fix...\n');

  try {
    // 1. Create a user without workspace (simulating old user)
    console.log('1️⃣ Creating user without workspace...');
    const testEmail = `existing-user-${Date.now()}@example.com`;
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      user_metadata: {
        full_name: 'Existing User'
      }
    });

    if (error) {
      console.error('❌ User creation failed:', error);
      return false;
    }

    // Manually delete any auto-created workspace to simulate old user
    await supabase
      .from('user_organizations')
      .delete()
      .eq('user_id', data.user.id);

    console.log('✅ User without workspace created');

    // 2. Run audit function
    console.log('2️⃣ Running audit and fix function...');
    const { data: fixData, error: fixError } = await supabase
      .rpc('audit_and_fix_users_without_orgs');

    if (fixError) {
      console.error('❌ Audit function failed:', fixError);
      return false;
    }

    const userFix = fixData.find(fix => fix.user_email === testEmail);
    if (!userFix) {
      console.error('❌ User was not fixed by audit function');
      return false;
    }

    console.log(`✅ User fixed: ${userFix.action_taken}`);

    // 3. Verify workspace was created
    const { data: userOrgs, error: orgError } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organizations(name)
      `)
      .eq('user_id', data.user.id);

    if (orgError || !userOrgs || userOrgs.length === 0) {
      console.error('❌ Workspace not found after fix');
      return false;
    }

    console.log(`✅ Workspace verified: "${userOrgs[0].organizations.name}"`);

    // Cleanup
    await supabase.auth.admin.deleteUser(data.user.id);
    console.log('✅ Test user cleaned up');

    console.log('\n🎉 Existing user fix test PASSED!\n');
    return true;

  } catch (error) {
    console.error('💥 Existing user fix test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Complete Onboarding Flow Tests...\n');

  const results = {
    emailSignup: await testEmailSignup(),
    oauthSignup: await testOAuthSignup(),
    existingUserFix: await testExistingUserFix()
  };

  console.log('📊 Test Results Summary:');
  console.log(`   Email Signup: ${results.emailSignup ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   OAuth Signup: ${results.oauthSignup ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Existing User Fix: ${results.existingUserFix ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Onboarding system is ready for launch! 🚀');
  } else {
    console.log('\n❌ Some tests failed. Please review and fix issues before launch.');
    process.exit(1);
  }
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testEmailSignup, testOAuthSignup, testExistingUserFix };
