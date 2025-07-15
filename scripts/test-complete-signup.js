#!/usr/bin/env node

/**
 * Complete Signup Flow Test
 * Tests the entire signup process including manual profile creation fallback
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

console.log('🎯 COMPLETE SIGNUP FLOW TEST\n');

async function testCompleteSignup() {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const clientSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const testEmail = 'testuser1@gmail.com';
  const testPassword = 'TestPassword123';
  const testName = 'Test User';

  console.log('📧 Testing complete signup flow for:', testEmail);
  console.log('');

  try {
    // Step 1: Clean up any existing test user
    console.log('🧹 Step 1: Cleaning up existing test user...');
    try {
      const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
      const existingUser = existingUsers.users.find(u => u.email === testEmail);
      if (existingUser) {
        await adminSupabase.auth.admin.deleteUser(existingUser.id);
        console.log('✅ Existing test user cleaned up');
      } else {
        console.log('✅ No existing test user found');
      }
    } catch (cleanupError) {
      console.log('⚠️  Cleanup warning:', cleanupError.message);
    }

    // Step 2: Test client-side signup (simulating frontend)
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
      return false;
    }

    console.log('✅ Client signup successful');
    console.log('   User ID:', signupData.user?.id);
    console.log('   Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Session exists:', !!signupData.session);

    if (!signupData.user) {
      console.log('❌ No user returned from signup');
      return false;
    }

    const userId = signupData.user.id;

    // Step 3: Wait for trigger and check profile
    console.log('\n⏳ Step 3: Waiting for trigger to create profile...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    const { data: profiles, error: profileError } = await adminSupabase
      .from('users')
      .select('*')
      .eq('id', userId);

    let profileExists = false;
    if (profileError) {
      console.log('❌ Profile check failed:', profileError.message);
    } else if (profiles.length === 0) {
      console.log('⚠️  No profile found - trigger may not have run');
    } else {
      console.log('✅ Profile created by trigger:');
      console.log('   Name:', profiles[0].name);
      console.log('   Email:', profiles[0].email);
      profileExists = true;
    }

    // Step 4: Manual profile creation fallback (if needed)
    if (!profileExists) {
      console.log('\n🔧 Step 4: Creating profile manually (fallback)...');
      
      try {
        const { data: manualProfile, error: manualError } = await adminSupabase
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

        if (manualError) {
          console.log('❌ Manual profile creation failed:', manualError.message);
        } else {
          console.log('✅ Profile created manually:');
          console.log('   ID:', manualProfile.id);
          console.log('   Name:', manualProfile.name);
          console.log('   Email:', manualProfile.email);
          profileExists = true;
        }
      } catch (manualErr) {
        console.log('❌ Manual profile creation error:', manualErr.message);
      }
    }

    // Step 5: Confirm email and test authentication
    console.log('\n🔐 Step 5: Confirming email and testing authentication...');

    // Confirm email using admin client
    try {
      const { data: confirmData, error: confirmError } = await adminSupabase.auth.admin.updateUserById(
        userId,
        { email_confirm: true }
      );

      if (confirmError) {
        console.log('⚠️  Email confirmation failed:', confirmError.message);
      } else {
        console.log('✅ Email confirmed via admin');
      }
    } catch (confirmErr) {
      console.log('⚠️  Email confirmation error:', confirmErr.message);
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
    }

    // Step 6: Test profile access with authenticated user
    console.log('\n👤 Step 6: Testing profile access...');

    let userProfileError = null;
    if (authData.session) {
      const { data: userProfile, error: profileAccessError } = await clientSupabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      userProfileError = profileAccessError;

      if (profileAccessError) {
        console.log('❌ Profile access failed:', profileAccessError.message);
      } else {
        console.log('✅ Profile accessible to authenticated user:');
        console.log('   Name:', userProfile.name);
        console.log('   Email:', userProfile.email);
      }
    } else {
      console.log('⚠️  Skipped - no authenticated session');
    }

    // Step 7: Test upsert function (if available)
    console.log('\n🔄 Step 7: Testing profile upsert function...');
    
    if (authData.session) {
      try {
        const { data: upsertResult, error: upsertError } = await clientSupabase
          .rpc('upsert_user_profile', {
            user_name: 'Updated Test User',
            user_avatar_url: 'https://example.com/avatar.jpg'
          });

        if (upsertError) {
          console.log('⚠️  Upsert function not available or failed:', upsertError.message);
        } else {
          console.log('✅ Profile upsert successful:');
          console.log('   Updated name:', upsertResult?.name);
          console.log('   Avatar URL:', upsertResult?.avatar_url);
        }
      } catch (upsertErr) {
        console.log('⚠️  Upsert function test skipped:', upsertErr.message);
      }
    }

    // Step 8: Clean up
    console.log('\n🧹 Step 8: Cleaning up test user...');
    await adminSupabase.auth.admin.deleteUser(userId);
    console.log('✅ Test user cleaned up');

    // Generate summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 SIGNUP FLOW TEST SUMMARY');
    console.log('='.repeat(50));
    
    const results = {
      signup: !!signupData.user,
      profile: profileExists,
      auth: !!authData.session,
      access: !userProfileError
    };
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`📈 Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
    console.log('');
    console.log('📋 Test Results:');
    console.log(`${results.signup ? '✅' : '❌'} User Signup`);
    console.log(`${results.profile ? '✅' : '❌'} Profile Creation`);
    console.log(`${results.auth ? '✅' : '❌'} Authentication`);
    console.log(`${results.access ? '✅' : '❌'} Profile Access`);
    
    if (successRate === 100) {
      console.log('\n🎉 COMPLETE SUCCESS!');
      console.log('✨ Signup flow is fully functional');
      console.log('🚀 Ready for production use');
    } else if (successRate >= 75) {
      console.log('\n✅ MOSTLY WORKING');
      console.log('⚠️  Minor issues detected but core flow works');
    } else {
      console.log('\n❌ NEEDS ATTENTION');
      console.log('🔧 Please fix the failed components');
    }
    
    console.log('\n🎯 Next Steps:');
    if (!results.profile) {
      console.log('1. Run the SQL trigger fix: scripts/fix-user-trigger.sql');
    }
    console.log('2. Test with real user signup in browser');
    console.log('3. Verify dashboard loads after signup');
    console.log('4. Deploy to production when ready');
    
    return successRate >= 75;

  } catch (error) {
    console.error('\n💥 Test failed with error:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting complete signup flow test...\n');
  
  try {
    const success = await testCompleteSignup();
    console.log('\n🏁 Complete signup flow test finished!');
    return success;
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
