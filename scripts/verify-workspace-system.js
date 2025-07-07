#!/usr/bin/env node

/**
 * Verification Script for Workspace Auto-Creation System
 * Verifies the system is working without requiring exec_sql
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySystem() {
  console.log('🔍 Verifying Workspace Auto-Creation System...\n');

  try {
    // 1. Check if health function exists and works
    console.log('1️⃣ Testing health check function...');
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_workspace_health');

    if (healthError) {
      console.error('❌ Health check function not working:', healthError.message);
      console.log('💡 Please run the migration in Supabase SQL Editor first');
      return false;
    }

    const health = healthData[0];
    console.log('✅ Health check function working');
    console.log(`   Total Users: ${health.total_users}`);
    console.log(`   Users with Orgs: ${health.users_with_orgs}`);
    console.log(`   Users without Orgs: ${health.users_without_orgs}`);

    // 2. Test audit function
    console.log('\n2️⃣ Testing audit function...');
    const { data: auditData, error: auditError } = await supabase
      .rpc('audit_and_fix_users_without_orgs');

    if (auditError) {
      console.error('❌ Audit function not working:', auditError.message);
      return false;
    }

    console.log('✅ Audit function working');
    if (auditData && auditData.length > 0) {
      console.log(`   Fixed ${auditData.length} users:`);
      auditData.forEach(fix => {
        console.log(`   - ${fix.user_email}: ${fix.action_taken}`);
      });
    } else {
      console.log('   No users needed fixing');
    }

    // 3. Test trigger by creating a test user
    console.log('\n3️⃣ Testing auto-creation trigger...');
    const testEmail = `verify-test-${Date.now()}@example.com`;
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      user_metadata: {
        full_name: 'Verify Test User'
      }
    });

    if (userError) {
      console.error('❌ Test user creation failed:', userError.message);
      return false;
    }

    console.log('✅ Test user created');

    // Wait for trigger to execute
    console.log('   Waiting for trigger to execute...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if workspace was created
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organizations(name)
      `)
      .eq('user_id', userData.user.id);

    if (orgError) {
      console.error('❌ Error checking workspace:', orgError.message);
      return false;
    }

    if (!orgData || orgData.length === 0) {
      console.error('❌ No workspace created - trigger may not be working!');
      console.log('💡 Please check if the trigger was created in Supabase');
      return false;
    }

    console.log(`✅ Workspace auto-created: "${orgData[0].organizations.name}"`);
    console.log(`   User role: ${orgData[0].role}`);

    // Clean up test user
    await supabase.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Test user cleaned up');

    // 4. Final health check
    console.log('\n4️⃣ Final health check...');
    const { data: finalHealth, error: finalError } = await supabase
      .rpc('check_workspace_health');

    if (finalError) {
      console.error('❌ Final health check failed:', finalError.message);
      return false;
    }

    const final = finalHealth[0];
    console.log('📊 Final Health Report:');
    console.log(`   Total Users: ${final.total_users}`);
    console.log(`   Users with Orgs: ${final.users_with_orgs}`);
    console.log(`   Users without Orgs: ${final.users_without_orgs}`);
    console.log(`   Orphaned Orgs: ${final.orphaned_orgs}`);

    if (final.users_without_orgs > 0) {
      console.log('\n⚠️ Warning: Some users still without workspaces');
      console.log('💡 Run the audit function again or check the trigger');
      return false;
    }

    console.log('\n🎉 Workspace Auto-Creation System is working perfectly!');
    return true;

  } catch (error) {
    console.error('💥 Verification failed:', error.message);
    return false;
  }
}

async function testAPIEndpoint() {
  console.log('\n🌐 Testing API endpoint...');

  try {
    const fetch = require('node-fetch');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    
    const response = await fetch(`${baseUrl}/api/health/workspaces`);
    
    if (!response.ok) {
      console.log('⚠️ API endpoint not accessible (server may not be running)');
      return false;
    }

    const data = await response.json();
    console.log('✅ API endpoint working');
    console.log(`   Status: ${data.status}`);
    console.log(`   Health Score: ${data.healthScore}%`);
    console.log(`   Trigger Active: ${data.trigger.active}`);

    return true;

  } catch (error) {
    console.log('⚠️ API endpoint test skipped (server not running)');
    return false;
  }
}

async function main() {
  console.log('🚀 Workspace Auto-Creation System Verification\n');

  // Check environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('✅ Environment variables configured');

  // Verify the system
  const systemWorking = await verifySystem();
  
  if (!systemWorking) {
    console.error('\n❌ System verification failed. Please check the setup.');
    console.log('\n📋 Troubleshooting Steps:');
    console.log('   1. Run the migration in Supabase SQL Editor');
    console.log('   2. Check Supabase logs for errors');
    console.log('   3. Verify trigger exists in database');
    console.log('   4. Test manually creating a user');
    process.exit(1);
  }

  // Test API endpoint if server is running
  await testAPIEndpoint();

  console.log('\n🎉 System verification completed successfully!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Test signup flow at /login');
  console.log('   2. Monitor with: node scripts/audit-workspace-health.js');
  console.log('   3. Set up production monitoring');
  console.log('   4. Deploy to production');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { verifySystem, testAPIEndpoint };
