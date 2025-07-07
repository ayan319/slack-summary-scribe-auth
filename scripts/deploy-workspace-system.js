#!/usr/bin/env node

/**
 * Deployment Script for Workspace Auto-Creation System
 * Deploys and verifies the complete workspace auto-creation system
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deployMigration() {
  console.log('🚀 Deploying Workspace Auto-Creation System...\n');

  try {
    // 1. Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '003_workspace_auto_creation.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return false;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded');

    // 2. Execute the migration
    console.log('⚡ Executing migration...');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.warn(`⚠️ Statement warning: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.warn(`⚠️ Statement error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`✅ Migration executed: ${successCount} successful, ${errorCount} warnings`);

    // 3. Verify trigger creation
    console.log('\n🔍 Verifying trigger creation...');
    const { data: triggerData, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation')
      .eq('trigger_name', 'on_auth_user_created');

    if (triggerError || !triggerData || triggerData.length === 0) {
      console.error('❌ Trigger verification failed');
      return false;
    }

    console.log('✅ Trigger created successfully');

    // 4. Verify functions
    console.log('\n🔍 Verifying functions...');
    const functions = [
      'handle_new_user_signup',
      'audit_and_fix_users_without_orgs',
      'check_workspace_health'
    ];

    for (const funcName of functions) {
      const { data: funcData, error: funcError } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_name', funcName)
        .eq('routine_schema', 'public');

      if (funcError || !funcData || funcData.length === 0) {
        console.error(`❌ Function ${funcName} not found`);
        return false;
      }

      console.log(`✅ Function ${funcName} created`);
    }

    // 5. Run initial health check
    console.log('\n📊 Running initial health check...');
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_workspace_health');

    if (healthError) {
      console.error('❌ Health check failed:', healthError);
      return false;
    }

    const health = healthData[0];
    console.log('📈 Health Report:');
    console.log(`   Total Users: ${health.total_users}`);
    console.log(`   Users with Orgs: ${health.users_with_orgs}`);
    console.log(`   Users without Orgs: ${health.users_without_orgs}`);
    console.log(`   Orphaned Orgs: ${health.orphaned_orgs}`);

    // 6. Fix existing users if needed
    if (health.users_without_orgs > 0) {
      console.log('\n🔧 Fixing existing users without workspaces...');
      const { data: fixData, error: fixError } = await supabase
        .rpc('audit_and_fix_users_without_orgs');

      if (fixError) {
        console.error('❌ Fix operation failed:', fixError);
        return false;
      }

      console.log(`✅ Fixed ${fixData?.length || 0} users`);
      
      if (fixData && fixData.length > 0) {
        fixData.forEach(fix => {
          console.log(`   - ${fix.user_email}: ${fix.action_taken}`);
        });
      }
    }

    console.log('\n🎉 Workspace Auto-Creation System deployed successfully!');
    return true;

  } catch (error) {
    console.error('💥 Deployment failed:', error);
    return false;
  }
}

async function testDeployment() {
  console.log('\n🧪 Testing deployment...');

  try {
    // Test function calls
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_workspace_health');

    if (healthError) {
      console.error('❌ Health check test failed:', healthError);
      return false;
    }

    console.log('✅ Health check function working');

    // Test trigger by creating a test user
    const testEmail = `deploy-test-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      user_metadata: {
        full_name: 'Deploy Test User'
      }
    });

    if (userError) {
      console.error('❌ Test user creation failed:', userError);
      return false;
    }

    console.log('✅ Test user created');

    // Wait for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if workspace was created
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role, organizations(name)')
      .eq('user_id', userData.user.id);

    if (orgError || !orgData || orgData.length === 0) {
      console.error('❌ Workspace auto-creation test failed');
      return false;
    }

    console.log(`✅ Workspace auto-created: "${orgData[0].organizations.name}"`);

    // Clean up test user
    await supabase.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Test user cleaned up');

    console.log('\n🎉 Deployment test PASSED!');
    return true;

  } catch (error) {
    console.error('💥 Deployment test failed:', error);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  console.log('🚀 Workspace Auto-Creation System Deployment\n');

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('✅ Environment variables configured');

  // Deploy the system
  const deploySuccess = await deployMigration();
  
  if (!deploySuccess) {
    console.error('\n❌ Deployment failed. Please check errors above.');
    process.exit(1);
  }

  // Test the deployment
  if (!args.includes('--skip-test')) {
    const testSuccess = await testDeployment();
    
    if (!testSuccess) {
      console.error('\n❌ Deployment test failed. System may not be working correctly.');
      process.exit(1);
    }
  }

  console.log('\n🎉 Workspace Auto-Creation System is ready for production!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Run: node scripts/test-onboarding-flow.js');
  console.log('   2. Set up monitoring: node scripts/audit-workspace-health.js --monitor');
  console.log('   3. Test your signup flow at /login');
  console.log('   4. Monitor health at /api/health/workspaces');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { deployMigration, testDeployment };
