#!/usr/bin/env node

/**
 * Production Deployment Check
 * Comprehensive verification before production deployment
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEnvironmentVariables() {
  console.log('🔧 Checking Environment Variables...');
  
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'DEEPSEEK_API_KEY',
    'RESEND_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    return false;
  }

  console.log('✅ All required environment variables present');
  return true;
}

async function checkDatabaseSchema() {
  console.log('\n📊 Checking Database Schema...');

  try {
    // Check if tables exist
    const tables = ['users', 'organizations', 'user_organizations'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.error(`❌ Table ${table} not accessible:`, error.message);
        return false;
      }
      console.log(`✅ Table ${table} exists and accessible`);
    }

    // Check functions exist
    const functions = ['handle_new_user_signup', 'check_workspace_health', 'audit_and_fix_users_without_orgs'];
    
    for (const funcName of functions) {
      const { data, error } = await supabase
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_name', funcName)
        .eq('routine_schema', 'public');

      if (error || !data || data.length === 0) {
        console.error(`❌ Function ${funcName} not found`);
        return false;
      }
      console.log(`✅ Function ${funcName} exists`);
    }

    // Check trigger exists
    const { data: triggerData, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name')
      .eq('trigger_name', 'on_auth_user_created');

    if (triggerError || !triggerData || triggerData.length === 0) {
      console.error('❌ Trigger on_auth_user_created not found');
      return false;
    }

    console.log('✅ Trigger on_auth_user_created exists');
    return true;

  } catch (error) {
    console.error('❌ Database schema check failed:', error.message);
    return false;
  }
}

async function checkWorkspaceSystem() {
  console.log('\n🏢 Checking Workspace Auto-Creation System...');

  try {
    // Run health check
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_workspace_health');

    if (healthError) {
      console.error('❌ Health check failed:', healthError.message);
      return false;
    }

    const health = healthData[0];
    console.log('📊 Health Report:');
    console.log(`   Total Users: ${health.total_users}`);
    console.log(`   Users with Orgs: ${health.users_with_orgs}`);
    console.log(`   Users without Orgs: ${health.users_without_orgs}`);

    if (health.users_without_orgs > 0) {
      console.log('🔧 Fixing users without organizations...');
      const { data: fixData, error: fixError } = await supabase
        .rpc('audit_and_fix_users_without_orgs');

      if (fixError) {
        console.error('❌ Fix operation failed:', fixError.message);
        return false;
      }

      console.log(`✅ Fixed ${fixData?.length || 0} users`);
    }

    // Test trigger with a test user
    console.log('🧪 Testing trigger with test user...');
    const testEmail = `deploy-test-${Date.now()}@example.com`;
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      user_metadata: { full_name: 'Deploy Test User' }
    });

    if (userError) {
      console.error('❌ Test user creation failed:', userError.message);
      return false;
    }

    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check workspace creation
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select('role, organizations(name)')
      .eq('user_id', userData.user.id);

    if (orgError || !orgData || orgData.length === 0) {
      console.error('❌ Workspace auto-creation failed');
      return false;
    }

    console.log(`✅ Workspace auto-created: "${orgData[0].organizations.name}"`);

    // Clean up test user
    await supabase.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Test user cleaned up');

    return true;

  } catch (error) {
    console.error('❌ Workspace system check failed:', error.message);
    return false;
  }
}

async function checkAPIEndpoints() {
  console.log('\n🌐 Checking API Endpoints...');

  try {
    const fetch = require('node-fetch');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    // Check health endpoint
    const healthResponse = await fetch(`${baseUrl}/api/health/workspaces`);
    if (!healthResponse.ok) {
      console.log('⚠️ Health API endpoint not accessible (server may not be running)');
      return false;
    }

    const healthData = await healthResponse.json();
    console.log(`✅ Health API working - Status: ${healthData.status}`);

    // Check debug endpoint
    const debugResponse = await fetch(`${baseUrl}/api/debug/workspaces?action=trigger_status`);
    if (!debugResponse.ok) {
      console.log('⚠️ Debug API endpoint not accessible');
      return false;
    }

    const debugData = await debugResponse.json();
    console.log(`✅ Debug API working - Trigger exists: ${debugData.trigger.exists}`);

    return true;

  } catch (error) {
    console.log('⚠️ API endpoint check skipped (server not running)');
    return false;
  }
}

async function checkOAuthConfiguration() {
  console.log('\n🔐 Checking OAuth Configuration...');

  try {
    // This is a basic check - in production you'd want to test actual OAuth flow
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!googleClientId || !googleClientSecret) {
      console.error('❌ Google OAuth credentials missing');
      return false;
    }

    if (!googleClientId.includes('.apps.googleusercontent.com')) {
      console.error('❌ Invalid Google Client ID format');
      return false;
    }

    console.log('✅ Google OAuth credentials configured');
    console.log('💡 Manual verification needed: Test OAuth flow in browser');

    return true;

  } catch (error) {
    console.error('❌ OAuth configuration check failed:', error.message);
    return false;
  }
}

async function generateDeploymentReport() {
  console.log('\n📋 Generating Deployment Report...');

  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    app_url: process.env.NEXT_PUBLIC_APP_URL,
    checks: {
      environment_variables: false,
      database_schema: false,
      workspace_system: false,
      api_endpoints: false,
      oauth_configuration: false
    },
    recommendations: []
  };

  // Run all checks
  report.checks.environment_variables = await checkEnvironmentVariables();
  report.checks.database_schema = await checkDatabaseSchema();
  report.checks.workspace_system = await checkWorkspaceSystem();
  report.checks.api_endpoints = await checkAPIEndpoints();
  report.checks.oauth_configuration = await checkOAuthConfiguration();

  // Generate recommendations
  if (!report.checks.environment_variables) {
    report.recommendations.push('Configure missing environment variables');
  }
  if (!report.checks.database_schema) {
    report.recommendations.push('Run database migration in Supabase SQL Editor');
  }
  if (!report.checks.workspace_system) {
    report.recommendations.push('Fix workspace auto-creation system');
  }
  if (!report.checks.api_endpoints) {
    report.recommendations.push('Start development server and test API endpoints');
  }
  if (!report.checks.oauth_configuration) {
    report.recommendations.push('Configure OAuth providers in Supabase Dashboard');
  }

  const allPassed = Object.values(report.checks).every(check => check);
  
  console.log('\n📊 DEPLOYMENT REPORT');
  console.log('='.repeat(50));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Environment: ${report.environment}`);
  console.log(`Overall Status: ${allPassed ? '✅ READY' : '❌ NOT READY'}`);
  console.log('\nChecks:');
  
  Object.entries(report.checks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check.replace(/_/g, ' ')}`);
  });

  if (report.recommendations.length > 0) {
    console.log('\nRecommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }

  console.log('='.repeat(50));

  return allPassed;
}

async function main() {
  console.log('🚀 Production Deployment Check\n');

  const isReady = await generateDeploymentReport();

  if (isReady) {
    console.log('\n🎉 SYSTEM IS READY FOR PRODUCTION DEPLOYMENT!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Deploy to Vercel/production environment');
    console.log('   2. Run migration in production Supabase');
    console.log('   3. Update production environment variables');
    console.log('   4. Test production signup flow');
    console.log('   5. Set up production monitoring');
  } else {
    console.log('\n⚠️ SYSTEM NOT READY - Please fix issues above');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  checkEnvironmentVariables,
  checkDatabaseSchema,
  checkWorkspaceSystem,
  checkAPIEndpoints,
  checkOAuthConfiguration,
  generateDeploymentReport
};
