#!/usr/bin/env node

/**
 * Final Production Test Suite
 * Comprehensive testing before production deployment
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

async function test1_DatabaseSchema() {
  console.log('🔍 Test 1: Database Schema Verification');
  
  try {
    // Test all required tables exist
    const tables = ['organizations', 'user_organizations', 'users', 'summaries'];
    
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
    
    // Test functions exist
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_workspace_health');
    
    if (healthError) {
      console.error('❌ Health function not working:', healthError.message);
      return false;
    }
    
    console.log('✅ All database functions working');
    return true;
    
  } catch (error) {
    console.error('❌ Database schema test failed:', error.message);
    return false;
  }
}

async function test2_WorkspaceAutoCreation() {
  console.log('\n🏢 Test 2: Workspace Auto-Creation');
  
  try {
    // Create test user
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'test123456',
      user_metadata: { full_name: 'Test User' }
    });
    
    if (userError) {
      console.error('❌ Test user creation failed:', userError.message);
      return false;
    }
    
    console.log('✅ Test user created');
    
    // Wait for trigger
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check workspace creation
    const { data: orgData, error: orgError } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organizations(name)
      `)
      .eq('user_id', userData.user.id);
    
    if (orgError || !orgData || orgData.length === 0) {
      console.error('❌ Workspace auto-creation failed');
      return false;
    }
    
    console.log(`✅ Workspace auto-created: "${orgData[0].organizations.name}"`);
    
    // Clean up
    await supabase.auth.admin.deleteUser(userData.user.id);
    console.log('✅ Test user cleaned up');
    
    return true;
    
  } catch (error) {
    console.error('❌ Workspace auto-creation test failed:', error.message);
    return false;
  }
}

async function test3_APIEndpoints() {
  console.log('\n🌐 Test 3: API Endpoints');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch(`${BASE_URL}/api/health/workspaces`);
    if (!healthResponse.ok) {
      console.log('⚠️ Health API not accessible (server may not be running)');
      return false;
    }
    
    const healthData = await healthResponse.json();
    console.log(`✅ Health API working - Status: ${healthData.status}`);
    
    // Test debug endpoint
    const debugResponse = await fetch(`${BASE_URL}/api/debug/workspaces?action=trigger_status`);
    if (!debugResponse.ok) {
      console.log('⚠️ Debug API not accessible');
      return false;
    }
    
    const debugData = await debugResponse.json();
    console.log(`✅ Debug API working - Trigger exists: ${debugData.trigger.exists}`);
    
    return true;
    
  } catch (error) {
    console.log('⚠️ API endpoints test skipped (server not running)');
    return false;
  }
}

async function test4_AuthenticationFlow() {
  console.log('\n🔐 Test 4: Authentication Flow');
  
  try {
    // Test signup endpoint
    const signupResponse = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `auth-test-${Date.now()}@example.com`,
        password: 'test123456',
        name: 'Auth Test User'
      })
    });
    
    if (!signupResponse.ok) {
      console.log('⚠️ Auth signup endpoint not accessible');
      return false;
    }
    
    console.log('✅ Auth signup endpoint working');
    
    // Test login page
    const loginResponse = await fetch(`${BASE_URL}/login`);
    if (!loginResponse.ok) {
      console.log('⚠️ Login page not accessible');
      return false;
    }
    
    console.log('✅ Login page accessible');
    
    return true;
    
  } catch (error) {
    console.log('⚠️ Authentication flow test skipped (server not running)');
    return false;
  }
}

async function test5_DataIntegrity() {
  console.log('\n📊 Test 5: Data Integrity');
  
  try {
    // Run health check
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_workspace_health');
    
    if (healthError) {
      console.error('❌ Health check failed:', healthError.message);
      return false;
    }
    
    const health = healthData[0];
    console.log(`📈 Health Report:`);
    console.log(`   Total Users: ${health.total_users}`);
    console.log(`   Users with Orgs: ${health.users_with_orgs}`);
    console.log(`   Users without Orgs: ${health.users_without_orgs}`);
    
    // Fix any users without orgs
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
    
    // Final health check
    const { data: finalHealth } = await supabase
      .rpc('check_workspace_health');
    
    const final = finalHealth[0];
    const healthScore = final.total_users > 0 ? (final.users_with_orgs / final.total_users) * 100 : 100;
    
    console.log(`📊 Final Health Score: ${Math.round(healthScore)}%`);
    
    if (healthScore < 100) {
      console.error('❌ Health score below 100% - some users still without workspaces');
      return false;
    }
    
    console.log('✅ All users have workspaces');
    return true;
    
  } catch (error) {
    console.error('❌ Data integrity test failed:', error.message);
    return false;
  }
}

async function test6_EnvironmentVariables() {
  console.log('\n🔧 Test 6: Environment Variables');
  
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

async function generateFinalReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 FINAL PRODUCTION READINESS REPORT');
  console.log('='.repeat(60));
  
  const testNames = [
    'Database Schema',
    'Workspace Auto-Creation',
    'API Endpoints',
    'Authentication Flow',
    'Data Integrity',
    'Environment Variables'
  ];
  
  let passedTests = 0;
  
  testNames.forEach((name, index) => {
    const passed = results[index];
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (passed) passedTests++;
  });
  
  const overallScore = (passedTests / testNames.length) * 100;
  
  console.log('\n📊 OVERALL SCORE: ' + Math.round(overallScore) + '%');
  
  if (overallScore === 100) {
    console.log('\n🎉 SYSTEM IS PRODUCTION READY!');
    console.log('\n📋 Next Steps:');
    console.log('   1. ✅ Run migration in Supabase SQL Editor');
    console.log('   2. ✅ Test signup flow manually');
    console.log('   3. ✅ Deploy to Vercel');
    console.log('   4. ✅ Test production environment');
    console.log('   5. ✅ Set up monitoring');
    return true;
  } else {
    console.log('\n⚠️ SYSTEM NOT READY FOR PRODUCTION');
    console.log('\n🔧 Required Actions:');
    
    if (!results[0]) console.log('   • Run database migration in Supabase');
    if (!results[1]) console.log('   • Fix workspace auto-creation system');
    if (!results[2]) console.log('   • Start development server');
    if (!results[3]) console.log('   • Fix authentication endpoints');
    if (!results[4]) console.log('   • Fix data integrity issues');
    if (!results[5]) console.log('   • Configure missing environment variables');
    
    return false;
  }
}

async function main() {
  console.log('🚀 Final Production Test Suite\n');
  
  const results = [
    await test1_DatabaseSchema(),
    await test2_WorkspaceAutoCreation(),
    await test3_APIEndpoints(),
    await test4_AuthenticationFlow(),
    await test5_DataIntegrity(),
    await test6_EnvironmentVariables()
  ];
  
  const isReady = await generateFinalReport(results);
  
  if (!isReady) {
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  test1_DatabaseSchema,
  test2_WorkspaceAutoCreation,
  test3_APIEndpoints,
  test4_AuthenticationFlow,
  test5_DataIntegrity,
  test6_EnvironmentVariables,
  generateFinalReport
};
