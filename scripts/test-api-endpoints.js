#!/usr/bin/env node

/**
 * Test API endpoints to ensure they're working properly
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    console.log(`🔍 Testing ${method} ${endpoint}...`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`   ✅ ${endpoint} - OK`);
      return true;
    } else {
      console.log(`   ❌ ${endpoint} - Error`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${endpoint} - Exception: ${error.message}`);
    return false;
  }
}

async function testAPIs() {
  console.log('🚀 Testing API endpoints...\n');
  
  const tests = [
    // Health check
    { endpoint: '/api/healthcheck', method: 'GET' },
    
    // Core APIs
    { endpoint: '/api/notifications', method: 'GET' },
    { endpoint: '/api/summaries', method: 'GET' },
    { endpoint: '/api/dashboard', method: 'GET' },
    
    // Other APIs
    { endpoint: '/api/analytics', method: 'GET' },
    { endpoint: '/api/uploads', method: 'GET' },
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    const success = await testEndpoint(test.endpoint, test.method, test.body);
    if (success) passed++;
    console.log(''); // Empty line for readability
  }
  
  console.log(`📊 Test Results: ${passed}/${total} endpoints passed`);
  
  if (passed === total) {
    console.log('🎉 All API endpoints are working!');
  } else {
    console.log('⚠️ Some API endpoints need attention');
  }
  
  return passed >= total * 0.8; // 80% pass rate
}

// Run tests
if (require.main === module) {
  testAPIs().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test runner error:', error);
    process.exit(1);
  });
}

module.exports = { testAPIs };
