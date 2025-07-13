#!/usr/bin/env node

/**
 * Automated Smoke Testing Suite
 * Comprehensive post-deployment validation for Slack Summary Scribe
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Configuration
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://your-app.vercel.app';
const TIMEOUT = 15000; // 15 seconds
const USER_AGENT = 'SmokeTest/1.0 (Deployment Verification)';

// Test results storage
let testResults = {
  timestamp: new Date().toISOString(),
  deploymentUrl: DEPLOYMENT_URL,
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  criticalFailures: 0,
  tests: []
};

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const startTime = Date.now();
    
    const requestOptions = {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        ...options.headers
      },
      timeout: TIMEOUT
    };
    
    const req = protocol.get(url, requestOptions, (res) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          responseTime,
          data,
          headers: res.headers,
          url
        });
      });
    });
    
    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT}ms`));
    });
    
    req.on('error', reject);
  });
}

// Test definitions
const SMOKE_TESTS = [
  {
    name: 'Landing Page Load',
    path: '/',
    critical: true,
    checks: [
      { type: 'status', expected: 200 },
      { type: 'responseTime', max: 5000 },
      { type: 'content', contains: ['SummaryAI', 'Slack'] },
      { type: 'headers', required: ['content-type'] }
    ]
  },
  {
    name: 'Health Check API',
    path: '/api/health',
    critical: true,
    checks: [
      { type: 'status', expected: 200 },
      { type: 'responseTime', max: 3000 },
      { type: 'json', required: ['status', 'timestamp'] },
      { type: 'content', contains: ['healthy'] }
    ]
  },
  {
    name: 'Dashboard Page',
    path: '/dashboard',
    critical: true,
    checks: [
      { type: 'status', expected: [200, 302, 401] }, // May redirect to login
      { type: 'responseTime', max: 8000 }
    ]
  },
  {
    name: 'Upload Page',
    path: '/upload',
    critical: true,
    checks: [
      { type: 'status', expected: [200, 302, 401] },
      { type: 'responseTime', max: 5000 }
    ]
  },
  {
    name: 'Pricing Page',
    path: '/pricing',
    critical: false,
    checks: [
      { type: 'status', expected: 200 },
      { type: 'responseTime', max: 5000 },
      { type: 'content', contains: ['Free', 'Pro', 'Enterprise'] }
    ]
  },
  {
    name: 'Slack Connect Page',
    path: '/slack/connect',
    critical: false,
    checks: [
      { type: 'status', expected: [200, 302, 401] },
      { type: 'responseTime', max: 5000 }
    ]
  },
  {
    name: 'Analytics API',
    path: '/api/analytics',
    critical: false,
    checks: [
      { type: 'status', expected: [200, 401, 403] },
      { type: 'responseTime', max: 5000 }
    ]
  },
  {
    name: 'Notifications API',
    path: '/api/notifications',
    critical: false,
    checks: [
      { type: 'status', expected: [200, 401, 403] },
      { type: 'responseTime', max: 5000 }
    ]
  },
  {
    name: 'Summarize API',
    path: '/api/summarize',
    critical: true,
    checks: [
      { type: 'status', expected: [200, 401, 405] }, // 405 for GET request
      { type: 'responseTime', max: 3000 }
    ]
  }
];

async function runTest(test) {
  const url = `${DEPLOYMENT_URL}${test.path}`;
  const testResult = {
    name: test.name,
    path: test.path,
    critical: test.critical,
    passed: false,
    warnings: [],
    errors: [],
    metrics: {}
  };
  
  try {
    log(colors.cyan, `🧪 Testing: ${test.name} (${test.path})`);
    
    const response = await makeRequest(url);
    testResult.metrics = {
      statusCode: response.statusCode,
      responseTime: response.responseTime,
      contentLength: response.data.length
    };
    
    let checksPassed = 0;
    let totalChecks = test.checks.length;
    
    // Run all checks
    for (const check of test.checks) {
      try {
        const checkResult = await runCheck(check, response);
        if (checkResult.passed) {
          checksPassed++;
        } else {
          if (checkResult.critical) {
            testResult.errors.push(checkResult.message);
          } else {
            testResult.warnings.push(checkResult.message);
          }
        }
      } catch (error) {
        testResult.errors.push(`Check failed: ${error.message}`);
      }
    }
    
    // Determine overall test result
    testResult.passed = checksPassed === totalChecks && testResult.errors.length === 0;
    
    // Log result
    if (testResult.passed) {
      log(colors.green, `  ✅ PASSED (${response.responseTime}ms)`);
    } else if (testResult.errors.length > 0) {
      log(colors.red, `  ❌ FAILED - ${testResult.errors.join(', ')}`);
    } else {
      log(colors.yellow, `  ⚠️  PASSED WITH WARNINGS - ${testResult.warnings.join(', ')}`);
    }
    
  } catch (error) {
    testResult.errors.push(error.message);
    testResult.passed = false;
    log(colors.red, `  ❌ ERROR: ${error.message}`);
  }
  
  return testResult;
}

async function runCheck(check, response) {
  switch (check.type) {
    case 'status':
      const expectedStatuses = Array.isArray(check.expected) ? check.expected : [check.expected];
      const passed = expectedStatuses.includes(response.statusCode);
      return {
        passed,
        critical: true,
        message: passed ? 'Status OK' : `Expected status ${check.expected}, got ${response.statusCode}`
      };
      
    case 'responseTime':
      const timePassed = response.responseTime <= check.max;
      return {
        passed: timePassed,
        critical: false,
        message: timePassed ? 'Response time OK' : `Response time ${response.responseTime}ms exceeds ${check.max}ms`
      };
      
    case 'content':
      const contentChecks = check.contains.map(text => response.data.includes(text));
      const allContentPresent = contentChecks.every(Boolean);
      return {
        passed: allContentPresent,
        critical: false,
        message: allContentPresent ? 'Content checks passed' : `Missing content: ${check.contains.filter((_, i) => !contentChecks[i]).join(', ')}`
      };
      
    case 'json':
      try {
        const jsonData = JSON.parse(response.data);
        const hasRequired = check.required.every(field => jsonData.hasOwnProperty(field));
        return {
          passed: hasRequired,
          critical: true,
          message: hasRequired ? 'JSON structure valid' : `Missing JSON fields: ${check.required.filter(field => !jsonData.hasOwnProperty(field)).join(', ')}`
        };
      } catch (error) {
        return {
          passed: false,
          critical: true,
          message: 'Invalid JSON response'
        };
      }
      
    case 'headers':
      const hasHeaders = check.required.every(header => response.headers[header]);
      return {
        passed: hasHeaders,
        critical: false,
        message: hasHeaders ? 'Headers present' : `Missing headers: ${check.required.filter(header => !response.headers[header]).join(', ')}`
      };
      
    default:
      return { passed: true, critical: false, message: 'Unknown check type' };
  }
}

async function generateReport() {
  const reportPath = path.join(__dirname, 'smoke-test-report.json');
  const htmlReportPath = path.join(__dirname, 'smoke-test-report.html');
  
  // Generate JSON report
  fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
  
  // Generate HTML report
  const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>Smoke Test Report - ${testResults.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; }
        .test { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .passed { border-left: 5px solid #28a745; }
        .failed { border-left: 5px solid #dc3545; }
        .warning { border-left: 5px solid #ffc107; }
        .metrics { font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Smoke Test Report</h1>
        <p><strong>Deployment URL:</strong> ${testResults.deploymentUrl}</p>
        <p><strong>Test Time:</strong> ${testResults.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>${testResults.totalTests}</h3>
            <p>Total Tests</p>
        </div>
        <div class="metric">
            <h3>${testResults.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric">
            <h3>${testResults.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>${testResults.criticalFailures}</h3>
            <p>Critical Failures</p>
        </div>
    </div>
    
    <h2>Test Results</h2>
    ${testResults.tests.map(test => `
        <div class="test ${test.passed ? 'passed' : (test.errors.length > 0 ? 'failed' : 'warning')}">
            <h3>${test.name} ${test.passed ? '✅' : (test.errors.length > 0 ? '❌' : '⚠️')}</h3>
            <p><strong>Path:</strong> ${test.path}</p>
            <div class="metrics">
                ${test.metrics.statusCode ? `Status: ${test.metrics.statusCode} | ` : ''}
                ${test.metrics.responseTime ? `Response Time: ${test.metrics.responseTime}ms | ` : ''}
                ${test.metrics.contentLength ? `Content Length: ${test.metrics.contentLength} bytes` : ''}
            </div>
            ${test.errors.length > 0 ? `<p><strong>Errors:</strong> ${test.errors.join(', ')}</p>` : ''}
            ${test.warnings.length > 0 ? `<p><strong>Warnings:</strong> ${test.warnings.join(', ')}</p>` : ''}
        </div>
    `).join('')}
</body>
</html>`;
  
  fs.writeFileSync(htmlReportPath, htmlReport);
  
  log(colors.blue, `\n📊 Reports generated:`);
  log(colors.blue, `   JSON: ${reportPath}`);
  log(colors.blue, `   HTML: ${htmlReportPath}`);
}

async function runSmokeTests() {
  log(colors.blue + colors.bold, `\n🧪 Starting Comprehensive Smoke Tests`);
  log(colors.blue, `🎯 Target: ${DEPLOYMENT_URL}\n`);
  
  testResults.totalTests = SMOKE_TESTS.length;
  
  // Run all tests
  for (const test of SMOKE_TESTS) {
    const result = await runTest(test);
    testResults.tests.push(result);
    
    if (result.passed) {
      testResults.passed++;
    } else {
      testResults.failed++;
      if (result.critical && result.errors.length > 0) {
        testResults.criticalFailures++;
      }
    }
    
    if (result.warnings.length > 0) {
      testResults.warnings++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Generate reports
  await generateReport();
  
  // Summary
  log(colors.blue + colors.bold, `\n📋 Smoke Test Summary:`);
  log(colors.blue, `   Total Tests: ${testResults.totalTests}`);
  log(colors.green, `   Passed: ${testResults.passed}`);
  log(colors.red, `   Failed: ${testResults.failed}`);
  log(colors.yellow, `   Warnings: ${testResults.warnings}`);
  log(colors.red, `   Critical Failures: ${testResults.criticalFailures}`);
  
  // Overall status
  if (testResults.criticalFailures > 0) {
    log(colors.red + colors.bold, `\n❌ SMOKE TESTS FAILED`);
    log(colors.red, `   Critical issues detected. Review and fix before proceeding.`);
    process.exit(1);
  } else if (testResults.failed > 0) {
    log(colors.yellow + colors.bold, `\n⚠️  SMOKE TESTS PASSED WITH ISSUES`);
    log(colors.yellow, `   Some non-critical tests failed. Review and fix if needed.`);
  } else {
    log(colors.green + colors.bold, `\n✅ ALL SMOKE TESTS PASSED`);
    log(colors.green, `   Your deployment is working correctly!`);
  }
  
  // Next steps
  log(colors.blue, `\n🎯 Next Steps:`);
  log(colors.blue, `   1. Review detailed test report (HTML)`);
  log(colors.blue, `   2. Run manual smoke tests for UI/UX`);
  log(colors.blue, `   3. Set up monitoring and alerts`);
  log(colors.blue, `   4. Begin user acceptance testing`);
  
  console.log('');
}

// CLI handling
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node automated-smoke-tests.js [options]

Options:
  --url <url>     Deployment URL to test
  --help, -h      Show this help message

Environment Variables:
  DEPLOYMENT_URL  Deployment URL to test

Examples:
  node automated-smoke-tests.js --url https://my-app.vercel.app
  DEPLOYMENT_URL=https://my-app.vercel.app node automated-smoke-tests.js
`);
  process.exit(0);
}

// Parse URL from command line
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  process.env.DEPLOYMENT_URL = process.argv[urlIndex + 1];
}

// Run the tests
runSmokeTests().catch(error => {
  log(colors.red, `\n❌ Smoke tests failed: ${error.message}`);
  process.exit(1);
});
