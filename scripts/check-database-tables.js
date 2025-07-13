#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseTables() {
  console.log('🔍 CHECKING DATABASE TABLES');
  console.log('===========================\n');

  // List of required tables for the SaaS application
  const requiredTables = [
    'users',
    'organizations', 
    'user_organizations',
    'summaries',
    'notifications',
    'slack_integrations',
    'exports',
    'transcripts'
  ];

  console.log('📋 Checking required tables...\n');

  const tableStatus = {};

  for (const table of requiredTables) {
    try {
      console.log(`Checking ${table}...`);
      
      // Try to select from the table to see if it exists
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
        tableStatus[table] = { exists: false, error: error.message };
      } else {
        console.log(`✅ ${table}: Exists (${count || 0} rows)`);
        tableStatus[table] = { exists: true, count: count || 0 };
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
      tableStatus[table] = { exists: false, error: err.message };
    }
  }

  console.log('\n📊 SUMMARY');
  console.log('===========');
  
  const existingTables = Object.keys(tableStatus).filter(table => tableStatus[table].exists);
  const missingTables = Object.keys(tableStatus).filter(table => !tableStatus[table].exists);

  console.log(`✅ Existing tables: ${existingTables.length}/${requiredTables.length}`);
  if (existingTables.length > 0) {
    existingTables.forEach(table => {
      console.log(`   - ${table} (${tableStatus[table].count} rows)`);
    });
  }

  if (missingTables.length > 0) {
    console.log(`\n❌ Missing tables: ${missingTables.length}`);
    missingTables.forEach(table => {
      console.log(`   - ${table}: ${tableStatus[table].error}`);
    });
  }

  // Check some basic API functionality
  console.log('\n🧪 TESTING API FUNCTIONALITY');
  console.log('=============================');

  // Test auth.users table access
  try {
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.log('❌ Auth users access: Failed -', authError.message);
    } else {
      console.log(`✅ Auth users access: Working (${authUsers.users.length} users)`);
    }
  } catch (err) {
    console.log('❌ Auth users access: Failed -', err.message);
  }

  // Test if we can create a test record (if users table exists)
  if (tableStatus.users && tableStatus.users.exists) {
    console.log('\n🔧 Testing table write access...');
    
    try {
      // Try to insert a test record
      const testUser = {
        id: '00000000-0000-0000-0000-000000000000', // Test UUID
        name: 'Test User',
        email: 'test@example.com'
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert(testUser);

      if (insertError) {
        console.log('⚠️ Write test: Failed (expected for production) -', insertError.message);
      } else {
        console.log('✅ Write test: Success');
        
        // Clean up test record
        await supabase
          .from('users')
          .delete()
          .eq('id', testUser.id);
      }
    } catch (err) {
      console.log('⚠️ Write test: Failed -', err.message);
    }
  }

  console.log('\n🎯 RECOMMENDATIONS');
  console.log('==================');

  if (missingTables.length > 0) {
    console.log('❌ Database schema is incomplete');
    console.log('   → Run: node scripts/apply-consolidated-schema.js');
    console.log('   → Or apply: supabase/migrations/999_consolidated_production_schema.sql');
  } else {
    console.log('✅ All required tables exist');
    console.log('   → Database schema is ready for production');
  }

  return {
    totalTables: requiredTables.length,
    existingTables: existingTables.length,
    missingTables: missingTables.length,
    tableStatus
  };
}

if (require.main === module) {
  checkDatabaseTables()
    .then(result => {
      console.log(`\n📈 Final Status: ${result.existingTables}/${result.totalTables} tables ready`);
      process.exit(result.missingTables > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Database check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseTables };
