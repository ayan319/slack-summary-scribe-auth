#!/usr/bin/env node

/**
 * Vercel Deployment Validation Script
 * Validates that the latest deployment is working correctly
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const VERCEL_DOMAIN = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL;
const EXPECTED_COMMIT = '9a6f8f6104e04450ad28e25075b0b915a4a815bc';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
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
    
    request.setTimeout(10000, () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function validateEndpoint(endpoint, expectedStatus = 200, description = '') {
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

async function validateDeployment() {
  if (!VERCEL_DOMAIN) {
    log('❌ VERCEL_DOMAIN not set. Please set VERCEL_URL or NEXT_PUBLIC_APP_URL', 'red');
    process.exit(1);
  }

  const baseUrl = VERCEL_DOMAIN.startsWith('http') ? VERCEL_DOMAIN : `https://${VERCEL_DOMAIN}`;
  
  log(`🚀 Validating Vercel Deployment: ${baseUrl}`, 'bold');
  log(`📋 Expected Commit: ${EXPECTED_COMMIT}`, 'blue');
  log('', 'reset');

  const tests = [
    // Core pages
    { url: `${baseUrl}/`, description: 'Landing Page' },
    { url: `${baseUrl}/login`, description: 'Login Page' },
    { url: `${baseUrl}/dashboard`, description: 'Dashboard Page' },
    { url: `${baseUrl}/pricing`, description: 'Pricing Page' },
    { url: `${baseUrl}/features`, description: 'Features Page' },
    { url: `${baseUrl}/help`, description: 'Help Page' },
    { url: `${baseUrl}/support`, description: 'Support Page' },
    
    // API endpoints
    { url: `${baseUrl}/api/health`, description: 'Health Check API' },
    { url: `${baseUrl}/api/dashboard`, expectedStatus: 401, description: 'Dashboard API (should require auth)' },
    
    // Static files
    { url: `${baseUrl}/sitemap.xml`, description: 'Sitemap' },
    { url: `${baseUrl}/robots.txt`, description: 'Robots.txt' },
    
    // 404 handling
    { url: `${baseUrl}/non-existent-page`, expectedStatus: 404, description: '404 Page' }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    const result = await validateEndpoint(
      test.url, 
      test.expectedStatus || 200, 
      test.description
    );
    
    if (result.success) {
      passedTests++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  log('', 'reset');
  log('📊 VALIDATION SUMMARY', 'bold');
  log(`✅ Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('🎉 All tests passed! Deployment is working correctly.', 'green');
    
    // Additional checks
    log('', 'reset');
    log('🔍 ADDITIONAL CHECKS', 'bold');
    
    try {
      // Check if we can get build info
      const healthResponse = await makeRequest(`${baseUrl}/api/health`);
      if (healthResponse.statusCode === 200) {
        try {
          const healthData = JSON.parse(healthResponse.body);
          log(`📦 Build Status: ${healthData.status || 'Unknown'}`, 'blue');
          log(`🕐 Timestamp: ${healthData.timestamp || 'Unknown'}`, 'blue');
        } catch (e) {
          log('📦 Health endpoint responded but data format unexpected', 'yellow');
        }
      }
    } catch (error) {
      log('⚠️ Could not retrieve additional build info', 'yellow');
    }
    
    log('', 'reset');
    log('✅ DEPLOYMENT VALIDATION COMPLETE', 'green');
    log('🚀 Your application is ready for production!', 'green');
    
  } else {
    log(`❌ ${totalTests - passedTests} tests failed. Please check the deployment.`, 'red');
    process.exit(1);
  }
}

// Performance test
async function performanceTest() {
  if (!VERCEL_DOMAIN) return;
  
  const baseUrl = VERCEL_DOMAIN.startsWith('http') ? VERCEL_DOMAIN : `https://${VERCEL_DOMAIN}`;
  
  log('', 'reset');
  log('⚡ PERFORMANCE TEST', 'bold');
  
  const startTime = Date.now();
  try {
    await makeRequest(`${baseUrl}/`);
    const loadTime = Date.now() - startTime;
    
    if (loadTime < 1000) {
      log(`🚀 Landing page load time: ${loadTime}ms (Excellent)`, 'green');
    } else if (loadTime < 3000) {
      log(`⚡ Landing page load time: ${loadTime}ms (Good)`, 'yellow');
    } else {
      log(`🐌 Landing page load time: ${loadTime}ms (Needs optimization)`, 'red');
    }
  } catch (error) {
    log(`❌ Performance test failed: ${error.message}`, 'red');
  }
}

// Main execution
async function main() {
  try {
    await validateDeployment();
    await performanceTest();
  } catch (error) {
    log(`❌ Validation failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateDeployment, performanceTest };
