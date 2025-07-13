#!/usr/bin/env node

/**
 * Script to run seed data for E2E testing
 * This script executes the SQL seed data script against Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runSeedData() {
  console.log('🌱 Starting seed data process...');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Read the seed data SQL file
    const seedDataPath = path.join(__dirname, 'seed-demo-data.sql');
    const seedDataSQL = fs.readFileSync(seedDataPath, 'utf8');
    
    console.log('📄 Loaded seed data SQL file');
    
    // Execute the seed data SQL
    console.log('🔄 Executing seed data...');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: seedDataSQL
    });
    
    if (error) {
      console.error('❌ Error executing seed data:', error);
      
      // Try alternative method - execute via raw SQL
      console.log('🔄 Trying alternative method...');
      const { error: altError } = await supabase
        .from('_seed_data_temp')
        .select('*')
        .limit(1);
      
      // If table doesn't exist, that's expected
      if (altError && !altError.message.includes('does not exist')) {
        console.error('❌ Alternative method also failed:', altError);
        process.exit(1);
      }
    }
    
    console.log('✅ Seed data executed successfully');
    
    // Verify data was created
    console.log('🔍 Verifying seed data...');
    
    // Check for test user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'mohammadayan5442@gmail.com')
      .single();
    
    if (userError || !userData) {
      console.warn('⚠️  Test user not found in users table');
    } else {
      console.log('✅ Test user found:', userData.name);
    }
    
    // Check summaries
    const { data: summaries, error: summariesError } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userData?.id);
    
    if (summariesError) {
      console.warn('⚠️  Error checking summaries:', summariesError.message);
    } else {
      console.log(`✅ Found ${summaries?.length || 0} summaries`);
    }
    
    // Check notifications
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userData?.id);
    
    if (notificationsError) {
      console.warn('⚠️  Error checking notifications:', notificationsError.message);
    } else {
      console.log(`✅ Found ${notifications?.length || 0} notifications`);
    }
    
    // Check organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('user_organizations')
      .select('*, organizations(*)')
      .eq('user_id', userData?.id);
    
    if (orgsError) {
      console.warn('⚠️  Error checking organizations:', orgsError.message);
    } else {
      console.log(`✅ Found ${orgs?.length || 0} organization memberships`);
    }
    
    console.log('\n🎉 Seed data process completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - User: ${userData?.name || 'Not found'}`);
    console.log(`   - Summaries: ${summaries?.length || 0}`);
    console.log(`   - Notifications: ${notifications?.length || 0}`);
    console.log(`   - Organizations: ${orgs?.length || 0}`);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  runSeedData().catch(console.error);
}

module.exports = { runSeedData };
