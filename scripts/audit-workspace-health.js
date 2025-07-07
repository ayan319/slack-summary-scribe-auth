#!/usr/bin/env node

/**
 * Workspace Health Audit Script
 * Monitors and fixes users without organizations
 * Run this daily or as needed for production monitoring
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function auditWorkspaceHealth() {
  console.log('🔍 Starting Workspace Health Audit...\n');

  try {
    // 1. Check overall health
    console.log('📊 Checking workspace health...');
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_workspace_health');

    if (healthError) {
      console.error('❌ Error checking health:', healthError);
      return;
    }

    const health = healthData[0];
    console.log('📈 Health Report:');
    console.log(`   Total Users: ${health.total_users}`);
    console.log(`   Users with Orgs: ${health.users_with_orgs}`);
    console.log(`   Users without Orgs: ${health.users_without_orgs}`);
    console.log(`   Orphaned Orgs: ${health.orphaned_orgs}\n`);

    // 2. Fix users without organizations if any exist
    if (health.users_without_orgs > 0) {
      console.log('🔧 Fixing users without organizations...');
      
      const { data: fixData, error: fixError } = await supabase
        .rpc('audit_and_fix_users_without_orgs');

      if (fixError) {
        console.error('❌ Error fixing users:', fixError);
        return;
      }

      if (fixData && fixData.length > 0) {
        console.log('✅ Fixed users:');
        fixData.forEach(fix => {
          console.log(`   - ${fix.user_email}: ${fix.action_taken} (${fix.org_id})`);
        });
      } else {
        console.log('✅ No users needed fixing');
      }
    } else {
      console.log('✅ All users have organizations');
    }

    // 3. Check for recent signups without workspaces
    console.log('\n🔍 Checking recent signups...');
    const { data: recentUsers, error: recentError } = await supabase
      .from('auth.users')
      .select(`
        id,
        email,
        created_at,
        user_organizations!inner(organization_id)
      `)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .is('deleted_at', null);

    if (recentError) {
      console.warn('⚠️ Could not check recent users:', recentError.message);
    } else {
      console.log(`📅 Recent signups (24h): ${recentUsers?.length || 0}`);
    }

    // 4. Verify trigger is active
    console.log('\n🔍 Verifying trigger status...');
    const { data: triggerData, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .eq('trigger_name', 'on_auth_user_created');

    if (triggerError) {
      console.warn('⚠️ Could not check trigger status:', triggerError.message);
    } else if (triggerData && triggerData.length > 0) {
      console.log('✅ Auto-creation trigger is active');
    } else {
      console.log('❌ Auto-creation trigger is NOT active - needs setup!');
    }

    console.log('\n🎉 Workspace health audit completed successfully!');

  } catch (error) {
    console.error('💥 Audit failed:', error);
    process.exit(1);
  }
}

async function testWorkspaceCreation() {
  console.log('\n🧪 Testing workspace auto-creation...');
  
  try {
    // Create a test user to verify the trigger works
    const testEmail = `test-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      user_metadata: {
        full_name: 'Test User'
      }
    });

    if (error) {
      console.error('❌ Test user creation failed:', error);
      return;
    }

    console.log(`✅ Test user created: ${testEmail}`);

    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if workspace was created
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organizations(name)
      `)
      .eq('user_id', data.user.id);

    if (orgError) {
      console.error('❌ Error checking test workspace:', orgError);
      return;
    }

    if (orgData && orgData.length > 0) {
      console.log(`✅ Workspace auto-created: "${orgData[0].organizations.name}"`);
    } else {
      console.log('❌ No workspace created - trigger may not be working!');
    }

    // Clean up test user
    await supabase.auth.admin.deleteUser(data.user.id);
    console.log('🧹 Test user cleaned up');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testWorkspaceCreation();
  } else {
    await auditWorkspaceHealth();
  }

  if (args.includes('--monitor')) {
    console.log('\n🔄 Running in monitor mode (every 5 minutes)...');
    setInterval(auditWorkspaceHealth, 5 * 60 * 1000);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { auditWorkspaceHealth, testWorkspaceCreation };
