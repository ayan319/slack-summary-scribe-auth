#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * Tests live Vercel deployment for all critical functionality
 */

import { config } from 'dotenv';

// Load environment variables
config();

const PRODUCTION_URL = process.argv[2] || 'https://your-domain.vercel.app';

console.log('🚀 PRODUCTION DEPLOYMENT VERIFICATION');
console.log('====================================');
console.log(`Testing: ${PRODUCTION_URL}`);
console.log('');

let allTests = [];

function addTest(category, name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${name}: ${status}${details ? ` - ${details}` : ''}`);
  allTests.push({ category, name, status, details });
}

async function testEndpoint(name, url, expectedStatus = 200, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Verification-Script/1.0'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (response.status === expectedStatus) {
      addTest('Endpoints', name, 'PASS', `${response.status} ${response.statusText}`);
      return true;
    } else {
      addTest('Endpoints', name, 'FAIL', `Expected ${expectedStatus}, got ${response.status}`);
      return false;
    }
  } catch (error) {
    addTest('Endpoints', name, 'FAIL', error.message);
    return false;
  }
}

async function testPageLoad(name, url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Production-Verification-Script/1.0'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      if (html.includes('<!DOCTYPE html>') && html.includes('</html>')) {
        addTest('Pages', name, 'PASS', `${response.status} - Valid HTML`);
        return true;
      } else {
        addTest('Pages', name, 'FAIL', 'Invalid HTML response');
        return false;
      }
    } else {
      addTest('Pages', name, 'FAIL', `${response.status} ${response.statusText}`);
      return false;
    }
  } catch (error) {
    addTest('Pages', name, 'FAIL', error.message);
    return false;
  }
}

async function runVerification() {
  console.log('1️⃣ CRITICAL PAGES');
  console.log('-----------------');
  
  await testPageLoad('Landing Page', `${PRODUCTION_URL}/`);
  await testPageLoad('Login Page', `${PRODUCTION_URL}/login`);
  await testPageLoad('Dashboard Page', `${PRODUCTION_URL}/dashboard`);
  await testPageLoad('Pricing Page', `${PRODUCTION_URL}/pricing`);
  await testPageLoad('Privacy Page', `${PRODUCTION_URL}/privacy`);
  await testPageLoad('Terms Page', `${PRODUCTION_URL}/terms`);

  console.log('');
  console.log('2️⃣ HEALTH CHECK ENDPOINTS');
  console.log('-------------------------');
  
  await testEndpoint('Health Check', `${PRODUCTION_URL}/api/healthcheck`);
  await testEndpoint('Sentry Test (Success)', `${PRODUCTION_URL}/api/test-sentry`);
  await testEndpoint('Sentry Test (Error)', `${PRODUCTION_URL}/api/test-sentry?error=true`, 500);

  console.log('');
  console.log('3️⃣ AUTHENTICATION ENDPOINTS');
  console.log('---------------------------');
  
  await testEndpoint('Auth Login', `${PRODUCTION_URL}/api/auth/login`, 405); // GET not allowed
  await testEndpoint('Auth Signup', `${PRODUCTION_URL}/api/auth/signup`, 405); // GET not allowed
  await testEndpoint('Auth Logout', `${PRODUCTION_URL}/api/auth/logout`, 405); // GET not allowed
  await testEndpoint('Auth Callback', `${PRODUCTION_URL}/api/auth/callback`, 302); // Should redirect

  console.log('');
  console.log('4️⃣ CORE API ENDPOINTS');
  console.log('---------------------');
  
  await testEndpoint('Dashboard API', `${PRODUCTION_URL}/api/dashboard`, 401); // Should require auth
  await testEndpoint('Summaries API', `${PRODUCTION_URL}/api/summaries?userId=test`, 401); // Should require auth
  await testEndpoint('Uploads API', `${PRODUCTION_URL}/api/uploads`, 401); // Should require auth

  console.log('');
  console.log('5️⃣ SLACK INTEGRATION');
  console.log('--------------------');
  
  await testEndpoint('Slack Auth', `${PRODUCTION_URL}/api/slack/auth`, 401); // Should require auth
  await testEndpoint('Slack Callback', `${PRODUCTION_URL}/api/slack/callback`, 302); // Should redirect
  await testEndpoint('Slack Summarize', `${PRODUCTION_URL}/api/slack/summarize`, 401, 'POST'); // Should require auth

  console.log('');
  console.log('6️⃣ EXPORT ENDPOINTS');
  console.log('-------------------');
  
  await testEndpoint('PDF Export', `${PRODUCTION_URL}/api/export/pdf`, 401, 'POST'); // Should require auth
  await testEndpoint('Excel Export', `${PRODUCTION_URL}/api/export/excel`, 401, 'POST'); // Should require auth
  await testEndpoint('Notion Export', `${PRODUCTION_URL}/api/export/notion`, 401, 'POST'); // Should require auth

  console.log('');
  console.log('7️⃣ SECURITY HEADERS');
  console.log('-------------------');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/`, { method: 'HEAD' });
    const headers = response.headers;
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];
    
    securityHeaders.forEach(header => {
      if (headers.get(header)) {
        addTest('Security', `${header} Header`, 'PASS', headers.get(header).substring(0, 50) + '...');
      } else {
        addTest('Security', `${header} Header`, 'WARN', 'Missing');
      }
    });
  } catch (error) {
    addTest('Security', 'Security Headers Check', 'FAIL', error.message);
  }

  console.log('');
  console.log('8️⃣ PERFORMANCE CHECK');
  console.log('--------------------');
  
  try {
    const start = Date.now();
    const response = await fetch(`${PRODUCTION_URL}/`);
    const loadTime = Date.now() - start;
    
    if (loadTime < 2000) {
      addTest('Performance', 'Page Load Time', 'PASS', `${loadTime}ms`);
    } else if (loadTime < 5000) {
      addTest('Performance', 'Page Load Time', 'WARN', `${loadTime}ms (slow)`);
    } else {
      addTest('Performance', 'Page Load Time', 'FAIL', `${loadTime}ms (too slow)`);
    }
    
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const sizeKB = Math.round(parseInt(contentLength) / 1024);
      if (sizeKB < 500) {
        addTest('Performance', 'Page Size', 'PASS', `${sizeKB}KB`);
      } else {
        addTest('Performance', 'Page Size', 'WARN', `${sizeKB}KB (large)`);
      }
    }
  } catch (error) {
    addTest('Performance', 'Performance Check', 'FAIL', error.message);
  }

  console.log('');
  console.log('🎯 VERIFICATION SUMMARY');
  console.log('=======================');

  const summary = allTests.reduce((acc, test) => {
    acc[test.status] = (acc[test.status] || 0) + 1;
    return acc;
  }, {});

  console.log(`Total Tests: ${allTests.length}`);
  console.log(`✅ Passed: ${summary.PASS || 0}`);
  console.log(`⚠️ Warnings: ${summary.WARN || 0}`);
  console.log(`❌ Failed: ${summary.FAIL || 0}`);

  const successRate = ((summary.PASS || 0) / allTests.length * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);

  const criticalFailures = allTests.filter(test => 
    test.status === 'FAIL' && 
    ['Pages', 'Endpoints'].includes(test.category) &&
    ['Landing Page', 'Health Check', 'Login Page'].includes(test.name)
  );

  if (criticalFailures.length === 0 && successRate >= 80) {
    console.log('');
    console.log('🎉 DEPLOYMENT VERIFICATION SUCCESSFUL!');
    console.log('✅ All critical systems are operational');
    console.log('✅ Production deployment is ready for users');
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Update DNS settings if using custom domain');
    console.log('2. Configure Slack app redirect URLs');
    console.log('3. Set up monitoring alerts');
    console.log('4. Test end-to-end user flows');
    process.exit(0);
  } else {
    console.log('');
    console.log('⚠️ DEPLOYMENT ISSUES DETECTED');
    console.log('Address the following before going live:');
    if (criticalFailures.length > 0) {
      criticalFailures.forEach(failure => {
        console.log(`❌ ${failure.name}: ${failure.details}`);
      });
    }
    if (successRate < 80) {
      console.log(`❌ Success rate too low: ${successRate}% (minimum 80% required)`);
    }
    process.exit(1);
  }
}

// Run verification
runVerification().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
