const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection...');
console.log('Supabase URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? 'Present' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSupabase() {
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Connection error:', error);
      return;
    }
    
    console.log('✅ Basic connection successful');
    
    // Test 2: Create a test user
    console.log('\n2️⃣ Testing user creation...');
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK' // "password123"
    };
    
    // First, try to delete existing user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', testUser.email);
    
    if (deleteError) {
      console.log('⚠️ Delete error (might be expected):', deleteError.message);
    }
    
    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();
    
    if (insertError) {
      console.log('❌ User creation error:', insertError);
      return;
    }
    
    console.log('✅ User created successfully:', newUser);
    
    // Test 3: Query the user
    console.log('\n3️⃣ Testing user query...');
    const { data: queriedUser, error: queryError } = await supabase
      .from('users')
      .select('id, name, email, password_hash')
      .eq('email', testUser.email)
      .single();
    
    if (queryError) {
      console.log('❌ User query error:', queryError);
      return;
    }
    
    console.log('✅ User query successful:', queriedUser);
    
    // Test 4: Test summaries table
    console.log('\n4️⃣ Testing summaries table...');
    const { data: summariesData, error: summariesError } = await supabase
      .from('summaries')
      .select('count')
      .limit(1);
    
    if (summariesError) {
      console.log('❌ Summaries table error:', summariesError);
    } else {
      console.log('✅ Summaries table accessible');
    }
    
    // Test 5: Test workspaces table
    console.log('\n5️⃣ Testing workspaces table...');
    const { data: workspacesData, error: workspacesError } = await supabase
      .from('workspaces')
      .select('count')
      .limit(1);
    
    if (workspacesError) {
      console.log('❌ Workspaces table error:', workspacesError);
    } else {
      console.log('✅ Workspaces table accessible');
    }
    
    console.log('\n🎉 Supabase tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSupabase();
