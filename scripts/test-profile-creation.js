#!/usr/bin/env node

/**
 * Test Profile Creation Script
 * 
 * This script tests the handle_new_user trigger and profile creation process
 * to ensure users get profiles created automatically on signup.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testProfileCreation() {
  console.log('🧪 Testing Profile Creation System...\n');

  try {
    // Step 1: Check if handle_new_user function exists
    console.log('1️⃣ Checking handle_new_user function...');
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT routine_name, routine_type 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
          AND routine_name = 'handle_new_user';
        `
      });

    if (funcError) {
      console.log('⚠️  Could not check function (might not have exec_sql)');
    } else if (functions && functions.length > 0) {
      console.log('✅ handle_new_user function exists');
    } else {
      console.log('❌ handle_new_user function not found');
    }

    // Step 2: Check if trigger exists
    console.log('\n2️⃣ Checking trigger on auth.users...');
    const { data: triggers, error: triggerError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT trigger_name, event_manipulation, action_timing
          FROM information_schema.triggers 
          WHERE trigger_schema = 'auth' 
          AND event_object_table = 'users'
          AND trigger_name = 'on_auth_user_created';
        `
      });

    if (triggerError) {
      console.log('⚠️  Could not check trigger (might not have exec_sql)');
    } else if (triggers && triggers.length > 0) {
      console.log('✅ on_auth_user_created trigger exists');
      console.log('   Event:', triggers[0].event_manipulation);
      console.log('   Timing:', triggers[0].action_timing);
    } else {
      console.log('❌ on_auth_user_created trigger not found');
    }

    // Step 3: Check recent user profiles
    console.log('\n3️⃣ Checking recent user profiles...');
    const { data: recentProfiles, error: profilesError } = await supabase
      .from('users')
      .select('id, email, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${recentProfiles.length} recent profiles:`);
      recentProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} (${profile.name}) - ${new Date(profile.created_at).toLocaleString()}`);
      });
    }

    // Step 4: Check auth users vs profiles count
    console.log('\n4️⃣ Comparing auth users vs profiles...');
    
    // Get auth users count (this might not work due to RLS)
    const { count: authUsersCount, error: authCountError } = await supabase
      .from('auth.users')
      .select('*', { count: 'exact', head: true });

    const { count: profilesCount, error: profileCountError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (authCountError) {
      console.log('⚠️  Could not count auth users (RLS restriction)');
    } else {
      console.log(`📊 Auth users: ${authUsersCount}`);
    }

    if (profileCountError) {
      console.error('❌ Error counting profiles:', profileCountError.message);
    } else {
      console.log(`📊 User profiles: ${profilesCount}`);
    }

    // Step 5: Test upsert_user_profile function
    console.log('\n5️⃣ Testing upsert_user_profile function...');
    const { data: upsertResult, error: upsertError } = await supabase
      .rpc('upsert_user_profile', {
        user_name: 'Test Profile Creation',
        user_avatar_url: 'https://example.com/test-avatar.jpg'
      });

    if (upsertError) {
      if (upsertError.code === 'PGRST116') {
        console.log('❌ upsert_user_profile function not found');
      } else {
        console.log('❌ upsert_user_profile error:', upsertError.message);
      }
    } else {
      console.log('✅ upsert_user_profile function works');
      console.log('   Result:', upsertResult);
    }

    console.log('\n🎯 Profile Creation Test Complete!');
    console.log('\n📋 Summary:');
    console.log('- Function exists: Check above');
    console.log('- Trigger exists: Check above');
    console.log(`- Recent profiles: ${recentProfiles?.length || 0} found`);
    console.log('- Upsert function: Check above');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProfileCreation().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
