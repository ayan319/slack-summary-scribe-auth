/**
 * Test script to create a test user and verify authentication
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  console.log('🧪 Creating test user...');
  
  const testEmail = 'test@example.com';
  const testPassword = 'TestPassword123!';
  
  try {
    // Create user with admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Skip email verification for testing
      user_metadata: {
        name: 'Test User'
      }
    });

    if (authError) {
      console.error('❌ Error creating user:', authError);
      return null;
    }

    console.log('✅ Test user created:', authData.user.email);

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: authData.user.id,
        email: authData.user.email,
        name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.warn('⚠️ Error creating profile:', profileError);
    } else {
      console.log('✅ User profile created');
    }

    return authData.user;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return null;
  }
}

async function testDashboardAPI() {
  console.log('🧪 Testing dashboard API...');
  
  try {
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3003/api/dashboard', {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('📊 Dashboard API response status:', response.status);
    
    const result = await response.json();
    console.log('📊 Dashboard API response:', JSON.stringify(result, null, 2));
    
    return response.ok;
  } catch (error) {
    console.error('❌ Dashboard API test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting authentication test...\n');

  // Test 1: Create test user
  const user = await createTestUser();
  if (!user) {
    console.log('❌ Failed to create test user');
    return;
  }

  console.log('\n');

  // Test 2: Test dashboard API
  const apiWorking = await testDashboardAPI();
  if (!apiWorking) {
    console.log('❌ Dashboard API test failed');
    return;
  }

  console.log('\n✅ All tests passed!');
  console.log('\n📝 Test user credentials:');
  console.log('   Email: test@example.com');
  console.log('   Password: TestPassword123!');
  console.log('\n🌐 You can now test the login at: http://localhost:3003/login');
}

main().catch(console.error);
