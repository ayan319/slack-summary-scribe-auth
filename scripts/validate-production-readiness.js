#!/usr/bin/env node

/**
 * Production Readiness Validation Script
 * Comprehensive testing of all critical endpoints and integrations
 */

import { config } from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
config();

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

console.log('🚀 PRODUCTION READINESS VALIDATION');
console.log('==================================');
console.log(`Testing against: ${BASE_URL}`);
console.log('');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function logTest(name, status, details = '') {
  totalTests++;
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${name}: ${status}${details ? ` - ${details}` : ''}`);
  
  if (status === 'PASS') passedTests++;
  else if (status === 'FAIL') failedTests++;
}

async function testEndpoint(name, url, expectedStatus = 200, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Production-Readiness-Validator/1.0'
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const isSuccess = response.status === expectedStatus;
    
    logTest(
      name,
      isSuccess ? 'PASS' : 'FAIL',
      `${response.status} ${response.statusText}`
    );
    
    return { success: isSuccess, response, status: response.status };
  } catch (error) {
    logTest(name, 'FAIL', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('1️⃣ ENVIRONMENT VARIABLE VALIDATION');
  console.log('-----------------------------------');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENROUTER_API_KEY',
    'NEXT_PUBLIC_SENTRY_DSN',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value !== 'your_' + varName.toLowerCase() + '_here') {
      logTest(`${varName}`, 'PASS', 'Configured');
    } else {
      logTest(`${varName}`, 'FAIL', 'Missing or placeholder');
    }
  });
  
  console.log('');
  console.log('2️⃣ HEALTH CHECK ENDPOINTS');
  console.log('-------------------------');
  
  await testEndpoint('Health Check', `${BASE_URL}/api/healthcheck`);
  await testEndpoint('Sentry Test (Success)', `${BASE_URL}/api/test-sentry`);
  await testEndpoint('Sentry Test (Error)', `${BASE_URL}/api/test-sentry?error=true`, 500);
  
  console.log('');
  console.log('3️⃣ AUTHENTICATION ENDPOINTS');
  console.log('---------------------------');
  
  await testEndpoint('Auth Login', `${BASE_URL}/api/auth/login`, 405, 'GET'); // Should reject GET
  await testEndpoint('Auth Signup', `${BASE_URL}/api/auth/signup`, 405, 'GET'); // Should reject GET
  await testEndpoint('Auth Logout', `${BASE_URL}/api/auth/logout`, 405, 'GET'); // Should reject GET
  
  console.log('');
  console.log('4️⃣ CORE API ENDPOINTS');
  console.log('---------------------');
  
  await testEndpoint('Dashboard API', `${BASE_URL}/api/dashboard`, 401); // Should require auth
  await testEndpoint('Summaries API', `${BASE_URL}/api/summaries?userId=test`, 401); // Should require auth
  await testEndpoint('Uploads API', `${BASE_URL}/api/uploads`, 401); // Should require auth
  
  console.log('');
  console.log('5️⃣ SLACK INTEGRATION ENDPOINTS');
  console.log('------------------------------');
  
  await testEndpoint('Slack Auth', `${BASE_URL}/api/slack/auth`, 401); // Should require auth
  await testEndpoint('Slack Callback', `${BASE_URL}/api/slack/callback`, 302); // Should redirect without params
  await testEndpoint('Slack Summarize', `${BASE_URL}/api/slack/summarize`, 401, 'POST'); // Should require auth
  
  console.log('');
  console.log('6️⃣ EXPORT ENDPOINTS');
  console.log('-------------------');

  await testEndpoint('PDF Export', `${BASE_URL}/api/export/pdf`, 401, 'POST'); // Should require auth
  await testEndpoint('Excel Export', `${BASE_URL}/api/export/excel`, 401, 'POST'); // Should require auth
  await testEndpoint('Notion Export', `${BASE_URL}/api/export/notion`, 401, 'POST'); // Should require auth
  
  console.log('');
  console.log('7️⃣ STATIC PAGES');
  console.log('---------------');
  
  await testEndpoint('Landing Page', `${BASE_URL}/`);
  await testEndpoint('Login Page', `${BASE_URL}/login`);
  await testEndpoint('Pricing Page', `${BASE_URL}/pricing`);
  await testEndpoint('Privacy Page', `${BASE_URL}/privacy`);
  await testEndpoint('Terms Page', `${BASE_URL}/terms`);
  await testEndpoint('Support Page', `${BASE_URL}/support`);
  
  console.log('');
  console.log('8️⃣ PROTECTED PAGES');
  console.log('------------------');
  
  await testEndpoint('Dashboard Page', `${BASE_URL}/dashboard`);
  await testEndpoint('Onboarding Page', `${BASE_URL}/onboarding`);
  
  console.log('');
  console.log('🎯 VALIDATION SUMMARY');
  console.log('====================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`⚠️ Warnings: ${totalTests - passedTests - failedTests}`);
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);
  
  if (failedTests === 0) {
    console.log('');
    console.log('🎉 ALL CRITICAL TESTS PASSED!');
    console.log('✅ Application is production-ready for Vercel deployment');
  } else {
    console.log('');
    console.log('⚠️ Some tests failed. Review the issues above before deployment.');
  }
  
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('❌ Validation script failed:', error);
  process.exit(1);
});
