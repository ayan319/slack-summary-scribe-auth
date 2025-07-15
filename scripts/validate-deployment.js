#!/usr/bin/env node

/**
 * Deployment Validation Script
 * Tests production deployment functionality
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://slack-summary-scribe-77p42dii8-ayans-projects-c9fd2ddf.vercel.app';

console.log('🔍 Validating Production Deployment...\n');

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test cases
const tests = [
  {
    name: 'Homepage Load',
    url: `${PRODUCTION_URL}/`,
    expectedStatus: 200,
    checkContent: (data) => data.includes('Slack Summary Scribe')
  },
  {
    name: 'Dashboard Page',
    url: `${PRODUCTION_URL}/dashboard`,
    expectedStatus: 200,
    checkContent: (data) => data.includes('dashboard') || data.includes('login')
  },
  {
    name: 'API Health Check',
    url: `${PRODUCTION_URL}/api/health`,
    expectedStatus: 200,
    checkContent: (data) => {
      try {
        const json = JSON.parse(data);
        return json.status === 'ok' || json.message;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Pricing Page',
    url: `${PRODUCTION_URL}/pricing`,
    expectedStatus: 200,
    checkContent: (data) => data.includes('pricing') || data.includes('plan')
  },
  {
    name: 'Login Page',
    url: `${PRODUCTION_URL}/login`,
    expectedStatus: 200,
    checkContent: (data) => data.includes('login') || data.includes('sign')
  },
  {
    name: 'API Models Endpoint',
    url: `${PRODUCTION_URL}/api/ai/models`,
    expectedStatus: 200,
    checkContent: (data) => {
      try {
        const json = JSON.parse(data);
        return Array.isArray(json) || json.models;
      } catch {
        return false;
      }
    }
  }
];

// Run validation tests
async function runValidation() {
  let passed = 0;
  let failed = 0;
  
  console.log('📋 Running Deployment Tests:\n');
  
  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}...`);
      const response = await makeRequest(test.url);
      
      // Check status code
      if (response.statusCode !== test.expectedStatus) {
        console.log(`❌ ${test.name}: Expected ${test.expectedStatus}, got ${response.statusCode}`);
        failed++;
        continue;
      }
      
      // Check content if specified
      if (test.checkContent && !test.checkContent(response.data)) {
        console.log(`❌ ${test.name}: Content validation failed`);
        failed++;
        continue;
      }
      
      console.log(`✅ ${test.name}: Passed`);
      passed++;
      
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n📊 Validation Results:');
  console.log(`✅ Passed: ${passed}/${tests.length}`);
  console.log(`❌ Failed: ${failed}/${tests.length}`);
  
  if (failed === 0) {
    console.log('\n🎉 All deployment validation tests passed!');
    console.log('🚀 Production deployment is fully functional');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Please check the deployment.');
    return false;
  }
}

// Additional checks
async function checkAdvancedFeatures() {
  console.log('\n🔧 Checking Advanced Features...\n');
  
  const advancedTests = [
    {
      name: 'Slack OAuth Endpoint',
      url: `${PRODUCTION_URL}/api/slack/auth`,
      expectedStatus: [200, 302, 400] // Various valid responses
    },
    {
      name: 'CRM Export Endpoint',
      url: `${PRODUCTION_URL}/api/crm/export`,
      expectedStatus: [200, 401, 405] // Auth required or method not allowed
    },
    {
      name: 'Smart Tags Endpoint',
      url: `${PRODUCTION_URL}/api/summaries/test/tags`,
      expectedStatus: [200, 401, 404] // Auth required or not found
    },
    {
      name: 'Cashfree Payment Endpoint',
      url: `${PRODUCTION_URL}/api/cashfree/order`,
      expectedStatus: [200, 401, 405] // Auth required or method not allowed
    }
  ];
  
  let advancedPassed = 0;
  
  for (const test of advancedTests) {
    try {
      console.log(`🔧 Testing: ${test.name}...`);
      const response = await makeRequest(test.url);
      
      if (test.expectedStatus.includes(response.statusCode)) {
        console.log(`✅ ${test.name}: Endpoint accessible (${response.statusCode})`);
        advancedPassed++;
      } else {
        console.log(`⚠️  ${test.name}: Unexpected status ${response.statusCode}`);
      }
      
    } catch (error) {
      console.log(`⚠️  ${test.name}: ${error.message}`);
    }
  }
  
  console.log(`\n🔧 Advanced Features: ${advancedPassed}/${advancedTests.length} accessible`);
}

// Run all validations
async function main() {
  const basicValidation = await runValidation();
  await checkAdvancedFeatures();
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Run E2E tests for complete functionality validation');
  console.log('2. Test advanced features with authentication');
  console.log('3. Monitor Sentry and PostHog for any issues');
  
  process.exit(basicValidation ? 0 : 1);
}

main().catch(console.error);
