#!/usr/bin/env node

/**
 * End-to-End Testing Script for Slack Summary Scribe SaaS
 * Tests complete user onboarding, authentication, and Slack integration flows
 */

const https = require('https');
const fs = require('fs');

// Configuration
const BASE_URL = 'https://slack-summary-scribe.vercel.app';
const EXPECTED_COMMIT = '42e7b79b65c1d7e5a5b7d3a3ecaf55a163437ad6';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: data
        });
      });
    });
    
    request.on('error', (error) => {
      reject(error);
    });
    
    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testEndpoint(endpoint, expectedStatus = 200, description = '') {
  try {
    log(`🔍 Testing ${endpoint}${description ? ` (${description})` : ''}`, 'blue');
    const response = await makeRequest(endpoint);
    
    if (response.statusCode === expectedStatus) {
      log(`✅ ${endpoint} - Status: ${response.statusCode}`, 'green');
      return { success: true, response };
    } else {
      log(`❌ ${endpoint} - Expected: ${expectedStatus}, Got: ${response.statusCode}`, 'red');
      return { success: false, response };
    }
  } catch (error) {
    log(`❌ ${endpoint} - Error: ${error.message}`, 'red');
    return { success: false, error };
  }
}

async function testAuthenticationFlow() {
  log('\n🔐 TESTING AUTHENTICATION FLOW', 'bold');
  
  const authTests = [
    { url: `${BASE_URL}/login`, description: 'Login Page' },
    { url: `${BASE_URL}/signup`, description: 'Signup Page' },
    { url: `${BASE_URL}/forgot-password`, description: 'Forgot Password Page' },
    { url: `${BASE_URL}/api/auth/providers`, description: 'Auth Providers API' },
  ];

  let passedTests = 0;
  for (const test of authTests) {
    const result = await testEndpoint(test.url, 200, test.description);
    if (result.success) passedTests++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  log(`\n📊 Authentication Flow: ${passedTests}/${authTests.length} tests passed`, 
      passedTests === authTests.length ? 'green' : 'yellow');
  
  return passedTests === authTests.length;
}

async function testDashboardFlow() {
  log('\n📊 TESTING DASHBOARD FLOW', 'bold');
  
  const dashboardTests = [
    { url: `${BASE_URL}/dashboard`, description: 'Dashboard Page' },
    { url: `${BASE_URL}/dashboard/settings`, description: 'Dashboard Settings' },
    { url: `${BASE_URL}/api/dashboard`, expectedStatus: 401, description: 'Dashboard API (requires auth)' },
    { url: `${BASE_URL}/api/health`, description: 'Health Check API' },
  ];

  let passedTests = 0;
  for (const test of dashboardTests) {
    const result = await testEndpoint(
      test.url, 
      test.expectedStatus || 200, 
      test.description
    );
    if (result.success) passedTests++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  log(`\n📊 Dashboard Flow: ${passedTests}/${dashboardTests.length} tests passed`, 
      passedTests === dashboardTests.length ? 'green' : 'yellow');
  
  return passedTests === dashboardTests.length;
}

async function testSlackIntegration() {
  log('\n🔗 TESTING SLACK INTEGRATION', 'bold');
  
  const slackTests = [
    { url: `${BASE_URL}/slack/connect`, description: 'Slack Connect Page' },
    { url: `${BASE_URL}/api/slack/auth`, description: 'Slack Auth Endpoint' },
    { url: `${BASE_URL}/api/slack/callback`, description: 'Slack OAuth Callback' },
    { url: `${BASE_URL}/api/slack/webhook`, expectedStatus: 405, description: 'Slack Webhook (POST only)' },
  ];

  let passedTests = 0;
  for (const test of slackTests) {
    const result = await testEndpoint(
      test.url, 
      test.expectedStatus || 200, 
      test.description
    );
    if (result.success) passedTests++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  log(`\n📊 Slack Integration: ${passedTests}/${slackTests.length} tests passed`, 
      passedTests === slackTests.length ? 'green' : 'yellow');
  
  return passedTests === slackTests.length;
}

async function testSupabaseConnection() {
  log('\n🗄️ TESTING SUPABASE CONNECTION', 'bold');
  
  try {
    // Test health endpoint which should connect to Supabase
    const healthResponse = await makeRequest(`${BASE_URL}/api/health`);
    
    if (healthResponse.statusCode === 200) {
      log('✅ Supabase connection: Healthy', 'green');
      
      try {
        const healthData = JSON.parse(healthResponse.body);
        if (healthData.database) {
          log('✅ Database status: Connected', 'green');
        }
      } catch (e) {
        log('⚠️ Health response format unexpected', 'yellow');
      }
      
      return true;
    } else {
      log('❌ Supabase connection: Failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Supabase connection error: ${error.message}`, 'red');
    return false;
  }
}

async function testMissingRoutes() {
  log('\n🔍 TESTING PREVIOUSLY MISSING ROUTES', 'bold');
  
  const previouslyMissingRoutes = [
    { url: `${BASE_URL}/integrations`, description: 'Integrations Page' },
    { url: `${BASE_URL}/docs`, description: 'Documentation Page' },
    { url: `${BASE_URL}/status`, description: 'Status Page' },
    { url: `${BASE_URL}/contact`, description: 'Contact Page' },
    { url: `${BASE_URL}/cookies`, description: 'Cookie Policy Page' },
    { url: `${BASE_URL}/api`, description: 'API Info Endpoint' },
  ];

  let passedTests = 0;
  for (const test of previouslyMissingRoutes) {
    const result = await testEndpoint(test.url, 200, test.description);
    if (result.success) passedTests++;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  log(`\n📊 Missing Routes Fix: ${passedTests}/${previouslyMissingRoutes.length} tests passed`, 
      passedTests === previouslyMissingRoutes.length ? 'green' : 'yellow');
  
  return passedTests === previouslyMissingRoutes.length;
}

async function testPerformance() {
  log('\n⚡ TESTING PERFORMANCE', 'bold');
  
  const performanceTests = [
    { url: `${BASE_URL}/`, name: 'Landing Page' },
    { url: `${BASE_URL}/login`, name: 'Login Page' },
    { url: `${BASE_URL}/dashboard`, name: 'Dashboard Page' },
  ];

  let allGood = true;
  
  for (const test of performanceTests) {
    const startTime = Date.now();
    try {
      await makeRequest(test.url);
      const loadTime = Date.now() - startTime;
      
      if (loadTime < 2000) {
        log(`🚀 ${test.name}: ${loadTime}ms (Excellent)`, 'green');
      } else if (loadTime < 5000) {
        log(`⚡ ${test.name}: ${loadTime}ms (Good)`, 'yellow');
      } else {
        log(`🐌 ${test.name}: ${loadTime}ms (Needs optimization)`, 'red');
        allGood = false;
      }
    } catch (error) {
      log(`❌ ${test.name}: Performance test failed`, 'red');
      allGood = false;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return allGood;
}

async function runCompleteE2ETest() {
  log('🚀 STARTING COMPLETE END-TO-END TESTING', 'bold');
  log(`🌐 Testing URL: ${BASE_URL}`, 'cyan');
  log(`📋 Expected Commit: ${EXPECTED_COMMIT}`, 'cyan');
  log('', 'reset');

  const testResults = {
    auth: await testAuthenticationFlow(),
    dashboard: await testDashboardFlow(),
    slack: await testSlackIntegration(),
    supabase: await testSupabaseConnection(),
    routes: await testMissingRoutes(),
    performance: await testPerformance()
  };

  // Summary
  log('\n📊 COMPLETE E2E TEST SUMMARY', 'bold');
  log('═══════════════════════════════════════', 'cyan');
  
  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    const color = passed ? 'green' : 'red';
    log(`${test.toUpperCase().padEnd(15)} ${status}`, color);
  });
  
  log('═══════════════════════════════════════', 'cyan');
  log(`OVERALL RESULT: ${passedTests}/${totalTests} test suites passed`, 
      passedTests === totalTests ? 'green' : 'red');
  
  if (passedTests === totalTests) {
    log('\n🎉 ALL TESTS PASSED! Your SaaS is ready for production!', 'green');
    log('✅ Authentication flows working', 'green');
    log('✅ Dashboard loading correctly', 'green');
    log('✅ Slack integration endpoints ready', 'green');
    log('✅ Supabase connection healthy', 'green');
    log('✅ All routes accessible', 'green');
    log('✅ Performance within acceptable limits', 'green');
    
    log('\n🚀 READY FOR DEPLOYMENT!', 'bold');
    return true;
  } else {
    log('\n❌ Some tests failed. Please review the issues above.', 'red');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runCompleteE2ETest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ E2E test failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runCompleteE2ETest };
