#!/usr/bin/env node

/**
 * Debug Authentication Flow
 * 
 * This script tests the authentication flow to identify where
 * the infinite loading issue is occurring.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

// Create client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuthFlow() {
  console.log('🔍 Debug Authentication Flow\n');

  try {
    // Step 1: Check Supabase connection
    console.log('1️⃣ Testing Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (healthError) {
      console.log('❌ Supabase connection error:', healthError.message);
      console.log('   Code:', healthError.code);
      console.log('   Details:', healthError.details);
    } else {
      console.log('✅ Supabase connection successful');
    }

    // Step 2: Check current session
    console.log('\n2️⃣ Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
    } else if (session) {
      console.log('✅ Active session found:');
      console.log('   User ID:', session.user.id);
      console.log('   Email:', session.user.email);
      console.log('   Expires:', new Date(session.expires_at * 1000).toISOString());
    } else {
      console.log('ℹ️  No active session');
    }

    // Step 3: Check users table structure
    console.log('\n3️⃣ Checking users table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
          ORDER BY ordinal_position;
        `
      });

    if (tableError) {
      console.log('⚠️  Could not check table structure (might not have exec_sql)');
    } else if (tableInfo) {
      console.log('✅ Users table structure:');
      tableInfo.forEach(col => {
        console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    // Step 4: Check RLS policies
    console.log('\n4️⃣ Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT policyname, permissive, roles, cmd, qual 
          FROM pg_policies 
          WHERE tablename = 'users' AND schemaname = 'public';
        `
      });

    if (policiesError) {
      console.log('⚠️  Could not check RLS policies (might not have exec_sql)');
    } else if (policies && policies.length > 0) {
      console.log('✅ RLS policies found:');
      policies.forEach(policy => {
        console.log(`   ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
      });
    } else {
      console.log('⚠️  No RLS policies found');
    }

    // Step 5: Test profile fetch (if session exists)
    if (session) {
      console.log('\n5️⃣ Testing profile fetch...');
      
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.log('❌ Profile fetch error:', profileError.message);
        console.log('   Code:', profileError.code);
        console.log('   Details:', profileError.details);
        console.log('   Hint:', profileError.hint);

        // Try to fetch without RLS
        console.log('\n   🔧 Attempting service role fetch...');
        // This would require service role key which we don't want to expose
        console.log('   (Service role test skipped for security)');

      } else if (profile) {
        console.log('✅ Profile found:');
        console.log('   ID:', profile.id);
        console.log('   Name:', profile.name);
        console.log('   Email:', profile.email);
      } else {
        console.log('⚠️  Profile not found (null result)');
      }
    }

    // Step 6: Test upsert function
    if (session) {
      console.log('\n6️⃣ Testing upsert function...');
      
      const { data: upsertResult, error: upsertError } = await supabase
        .rpc('upsert_user_profile', {
          user_name: 'Debug Test User',
          user_avatar_url: null
        });

      if (upsertError) {
        console.log('❌ Upsert function error:', upsertError.message);
        console.log('   Code:', upsertError.code);
      } else {
        console.log('✅ Upsert function works:');
        console.log('   Result:', upsertResult);
      }
    }

    // Step 7: Summary and recommendations
    console.log('\n🎯 Debug Summary:');
    console.log('================');
    
    if (!session) {
      console.log('❌ No active session - user needs to log in first');
      console.log('💡 Recommendation: Test with an authenticated user');
    } else {
      console.log('✅ Session is active');
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('❌ Profile not found in database');
          console.log('💡 Recommendation: Check if handle_new_user trigger is working');
        } else if (profileError.code === '42501') {
          console.log('❌ Permission denied - RLS policy issue');
          console.log('💡 Recommendation: Check RLS policies or temporarily disable RLS');
        } else {
          console.log('❌ Other profile fetch error');
          console.log('💡 Recommendation: Check database connection and table structure');
        }
      } else {
        console.log('✅ Profile fetch successful');
      }
    }

  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  }
}

// Run the debug
debugAuthFlow().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});
