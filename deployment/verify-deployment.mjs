#!/usr/bin/env node

/**
 * Post-Deployment Verification Script
 * Tests critical endpoints and functionality after deployment
 */

import https from 'https';
import http from 'http';

// Configuration
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://your-app.vercel.app';
const TIMEOUT = 10000; // 10 seconds

// Test endpoints
const ENDPOINTS = [
  { path: '/', name: 'Landing Page', critical: true },
  { path: '/api/health', name: 'Health Check API', critical: true },
  { path: '/dashboard', name: 'Dashboard', critical: true },
  { path: '/upload', name: 'Upload Page', critical: true },
  { path: '/pricing', name: 'Pricing Page', critical: false },
  { path: '/slack/connect', name: 'Slack Connect', critical: false },
  { path: '/api/analytics', name: 'Analytics API', critical: false },
  { path: '/api/notifications', name: 'Notifications API', critical: false }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    const req = protocol.get(url, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data,
          headers: res.headers
        });
      });
    });
    
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

async function testEndpoint(endpoint) {
  const url = `${DEPLOYMENT_URL}${endpoint.path}`;
  
  try {
    const response = await makeRequest(url);
    const { statusCode, responseTime } = response;
    
    // Determine if test passed
    const isSuccess = statusCode >= 200 && statusCode < 400;
    const isRedirect = statusCode >= 300 && statusCode < 400;
    
    if (isSuccess || (isRedirect && !endpoint.critical)) {
      log(colors.green, `✅ ${endpoint.name}: ${statusCode} (${responseTime}ms)`);
      return { success: true, critical: endpoint.critical };
    } else {
      log(colors.red, `❌ ${endpoint.name}: ${statusCode} (${responseTime}ms)`);
      return { success: false, critical: endpoint.critical };
    }
  } catch (error) {
    log(colors.red, `❌ ${endpoint.name}: ${error.message}`);
    return { success: false, critical: endpoint.critical };
  }
}

async function checkBuildInfo() {
  try {
    const response = await makeRequest(`${DEPLOYMENT_URL}/api/health`);
    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      log(colors.blue, `\n📊 Build Information:`);
      log(colors.blue, `   Timestamp: ${data.timestamp || 'Unknown'}`);
      log(colors.blue, `   Environment: ${data.environment || 'Unknown'}`);
      log(colors.blue, `   Version: ${data.version || 'Unknown'}`);
    }
  } catch (error) {
    log(colors.yellow, `⚠️  Could not retrieve build info: ${error.message}`);
  }
}

async function runDeploymentTests() {
  log(colors.blue + colors.bold, `\n🚀 Verifying Deployment: ${DEPLOYMENT_URL}\n`);
  
  const results = [];
  let criticalFailures = 0;
  let totalFailures = 0;
  
  // Test all endpoints
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (!result.success) {
      totalFailures++;
      if (result.critical) {
        criticalFailures++;
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Check build information
  await checkBuildInfo();
  
  // Summary
  log(colors.blue + colors.bold, `\n📋 Deployment Verification Summary:`);
  log(colors.blue, `   Total Tests: ${ENDPOINTS.length}`);
  log(colors.green, `   Passed: ${results.filter(r => r.success).length}`);
  log(colors.red, `   Failed: ${totalFailures}`);
  log(colors.red, `   Critical Failures: ${criticalFailures}`);
  
  // Overall status
  if (criticalFailures > 0) {
    log(colors.red + colors.bold, `\n❌ DEPLOYMENT VERIFICATION FAILED`);
    log(colors.red, `   Critical endpoints are not working. Check logs and fix issues.`);
    process.exit(1);
  } else if (totalFailures > 0) {
    log(colors.yellow + colors.bold, `\n⚠️  DEPLOYMENT VERIFICATION PASSED WITH WARNINGS`);
    log(colors.yellow, `   Some non-critical endpoints failed. Review and fix if needed.`);
  } else {
    log(colors.green + colors.bold, `\n✅ DEPLOYMENT VERIFICATION PASSED`);
    log(colors.green, `   All endpoints are working correctly!`);
  }
  
  // Next steps
  log(colors.blue, `\n🎯 Next Steps:`);
  log(colors.blue, `   1. Run comprehensive smoke tests: deployment/smoke-test-checklist.md`);
  log(colors.blue, `   2. Set up monitoring and alerts`);
  log(colors.blue, `   3. Create test user accounts for UAT`);
  log(colors.blue, `   4. Enable Vercel Analytics`);
  log(colors.blue, `   5. Notify team of successful deployment`);
  
  console.log('');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node verify-deployment.js [options]

Options:
  --url <url>     Deployment URL to test (default: https://your-app.vercel.app)
  --help, -h      Show this help message

Environment Variables:
  DEPLOYMENT_URL  Deployment URL to test

Examples:
  node verify-deployment.js --url https://my-app.vercel.app
  DEPLOYMENT_URL=https://my-app.vercel.app node verify-deployment.js
`);
  process.exit(0);
}

// Parse URL from command line
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  const customUrl = process.argv[urlIndex + 1];
  if (customUrl.startsWith('http')) {
    process.env.DEPLOYMENT_URL = customUrl;
  } else {
    log(colors.red, 'Error: URL must start with http:// or https://');
    process.exit(1);
  }
}

// Run the tests
runDeploymentTests().catch(error => {
  log(colors.red, `\n❌ Verification failed: ${error.message}`);
  process.exit(1);
});
