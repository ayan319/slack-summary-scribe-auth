#!/usr/bin/env node

/**
 * Automated Basic Tests
 * 
 * This script performs basic automated tests to verify the application
 * is working correctly without infinite loading or major issues.
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Test configuration
const TESTS = [
  {
    name: 'Home Page Load',
    url: '/',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'Login Page Load',
    url: '/login',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'Signup Page Load',
    url: '/signup',
    expectedStatus: 200,
    timeout: 5000
  },
  {
    name: 'API Health Check',
    url: '/api/health',
    expectedStatus: 200,
    timeout: 3000
  },
  {
    name: 'API Root',
    url: '/api',
    expectedStatus: 200,
    timeout: 3000
  },
  {
    name: 'Dashboard (Unauthenticated)',
    url: '/dashboard',
    expectedStatus: [200, 302, 401], // Could redirect or show auth error
    timeout: 10000
  }
];

async function testUrl(test) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${test.url}`;
    const protocol = url.startsWith('https:') ? https : http;
    
    console.log(`🔍 Testing: ${test.name} (${url})`);
    
    const startTime = Date.now();
    
    const req = protocol.get(url, (res) => {
      const duration = Date.now() - startTime;
      
      // Check if status is expected
      const expectedStatuses = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus 
        : [test.expectedStatus];
      
      const statusOk = expectedStatuses.includes(res.statusCode);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          name: test.name,
          url: test.url,
          status: res.statusCode,
          duration,
          success: statusOk && duration < test.timeout,
          timeout: duration >= test.timeout,
          contentLength: data.length,
          contentType: res.headers['content-type'],
          error: null
        });
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        name: test.name,
        url: test.url,
        status: 0,
        duration,
        success: false,
        timeout: false,
        contentLength: 0,
        contentType: null,
        error: error.message
      });
    });
    
    req.setTimeout(test.timeout, () => {
      req.destroy();
      const duration = Date.now() - startTime;
      resolve({
        name: test.name,
        url: test.url,
        status: 0,
        duration,
        success: false,
        timeout: true,
        contentLength: 0,
        contentType: null,
        error: 'Request timeout'
      });
    });
  });
}

async function runAllTests() {
  console.log('🧪 Running Automated Basic Tests...\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Total Tests: ${TESTS.length}\n`);
  
  const results = [];
  
  for (const test of TESTS) {
    const result = await testUrl(test);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${result.name} - ${result.status} (${result.duration}ms)`);
    } else {
      console.log(`❌ ${result.name} - ${result.status || 'FAILED'} (${result.duration}ms)`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.timeout) {
        console.log(`   Timeout: Exceeded ${test.timeout}ms limit`);
      }
    }
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Summary:');
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const timeouts = results.filter(r => r.timeout).length;
  
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏰ Timeouts: ${timeouts}/${results.length}`);
  
  // Performance analysis
  console.log('\n⚡ Performance Analysis:');
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const maxDuration = Math.max(...results.map(r => r.duration));
  const minDuration = Math.min(...results.map(r => r.duration));
  
  console.log(`Average Response Time: ${avgDuration.toFixed(0)}ms`);
  console.log(`Fastest Response: ${minDuration}ms`);
  console.log(`Slowest Response: ${maxDuration}ms`);
  
  // Specific checks
  console.log('\n🔍 Specific Checks:');
  
  // Check for infinite loading indicators
  const slowResponses = results.filter(r => r.duration > 10000);
  if (slowResponses.length > 0) {
    console.log('⚠️  Slow responses detected (>10s) - potential infinite loading:');
    slowResponses.forEach(r => {
      console.log(`   - ${r.name}: ${r.duration}ms`);
    });
  } else {
    console.log('✅ No slow responses detected');
  }
  
  // Check for errors
  const errorResponses = results.filter(r => r.error);
  if (errorResponses.length > 0) {
    console.log('⚠️  Error responses detected:');
    errorResponses.forEach(r => {
      console.log(`   - ${r.name}: ${r.error}`);
    });
  } else {
    console.log('✅ No error responses detected');
  }
  
  // Check for timeouts
  if (timeouts > 0) {
    console.log('⚠️  Timeout issues detected - may indicate hanging requests');
  } else {
    console.log('✅ No timeout issues detected');
  }
  
  // Overall assessment
  console.log('\n🎯 Overall Assessment:');
  if (passed === results.length) {
    console.log('✅ All tests passed - Application appears stable');
  } else if (passed >= results.length * 0.8) {
    console.log('⚠️  Most tests passed - Minor issues detected');
  } else {
    console.log('❌ Multiple test failures - Significant issues detected');
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (timeouts > 0) {
    console.log('- Investigate timeout issues to prevent infinite loading');
  }
  if (maxDuration > 5000) {
    console.log('- Optimize slow endpoints for better user experience');
  }
  if (errorResponses.length > 0) {
    console.log('- Fix error responses to ensure reliability');
  }
  if (passed === results.length && maxDuration < 3000) {
    console.log('- Application is ready for testing and deployment');
  }
  
  return {
    total: results.length,
    passed,
    failed,
    timeouts,
    avgDuration,
    maxDuration,
    allPassed: passed === results.length
  };
}

// Run the tests
runAllTests().then((summary) => {
  console.log(`\n${summary.allPassed ? '✅' : '❌'} Automated basic testing completed`);
  process.exit(summary.allPassed ? 0 : 1);
}).catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
