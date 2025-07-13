#!/usr/bin/env node

/**
 * Automated User Acceptance Testing (UAT) Suite
 * Comprehensive testing of critical user flows across browsers and devices
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://your-app.vercel.app';
const TEST_TIMEOUT = 30000; // 30 seconds
const SCREENSHOT_DIR = path.join(__dirname, 'uat-screenshots');

// Test user credentials
const TEST_USERS = {
  basic: {
    email: 'test.user1@example.com',
    password: 'TestUser123!'
  },
  power: {
    email: 'test.user2@example.com',
    password: 'TestUser456!'
  },
  admin: {
    email: 'test.admin@example.com',
    password: 'TestAdmin789!'
  }
};

// Device configurations for testing
const DEVICES = [
  { name: 'Desktop', viewport: { width: 1920, height: 1080 } },
  { name: 'Laptop', viewport: { width: 1366, height: 768 } },
  { name: 'Tablet', viewport: { width: 768, height: 1024 } },
  { name: 'Mobile', viewport: { width: 375, height: 667 } }
];

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class UATTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {
      timestamp: new Date().toISOString(),
      deploymentUrl: DEPLOYMENT_URL,
      totalTests: 0,
      passed: 0,
      failed: 0,
      scenarios: []
    };
  }

  async initialize(device = DEVICES[0]) {
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    await this.page.setViewport(device.viewport);
    
    // Set longer timeout for slow operations
    this.page.setDefaultTimeout(TEST_TIMEOUT);
    
    // Enable request interception for monitoring
    await this.page.setRequestInterception(true);
    this.page.on('request', request => request.continue());
    
    // Monitor console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        log(colors.red, `Console Error: ${msg.text()}`);
      }
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(SCREENSHOT_DIR, filename);
    
    await this.page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    
    return filepath;
  }

  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      log(colors.red, `Element not found: ${selector}`);
      return false;
    }
  }

  async testLandingPage() {
    log(colors.cyan, '🏠 Testing Landing Page...');
    
    const scenario = {
      name: 'Landing Page Load',
      steps: [],
      passed: false,
      errors: []
    };

    try {
      // Navigate to landing page
      const startTime = Date.now();
      await this.page.goto(DEPLOYMENT_URL, { waitUntil: 'networkidle0' });
      const loadTime = Date.now() - startTime;
      
      scenario.steps.push(`Page loaded in ${loadTime}ms`);
      
      // Check for key elements
      const checks = [
        { selector: 'h1', description: 'Main heading' },
        { selector: '[data-testid="get-started-button"], a[href*="signup"], button:contains("Get Started")', description: 'Get Started button' },
        { selector: 'nav, header', description: 'Navigation' }
      ];
      
      let allChecksPass = true;
      for (const check of checks) {
        const found = await this.waitForElement(check.selector, 5000);
        if (found) {
          scenario.steps.push(`✅ ${check.description} found`);
        } else {
          scenario.steps.push(`❌ ${check.description} missing`);
          scenario.errors.push(`Missing: ${check.description}`);
          allChecksPass = false;
        }
      }
      
      // Performance check
      if (loadTime > 5000) {
        scenario.errors.push(`Slow load time: ${loadTime}ms`);
        allChecksPass = false;
      }
      
      scenario.passed = allChecksPass && loadTime < 5000;
      
      if (scenario.passed) {
        log(colors.green, '✅ Landing page test passed');
      } else {
        log(colors.red, '❌ Landing page test failed');
        await this.takeScreenshot('landing-page-error');
      }
      
    } catch (error) {
      scenario.errors.push(error.message);
      scenario.passed = false;
      log(colors.red, `❌ Landing page test error: ${error.message}`);
    }
    
    this.results.scenarios.push(scenario);
    this.results.totalTests++;
    if (scenario.passed) this.results.passed++;
    else this.results.failed++;
    
    return scenario.passed;
  }

  async testUserRegistration() {
    log(colors.cyan, '👤 Testing User Registration...');
    
    const scenario = {
      name: 'User Registration',
      steps: [],
      passed: false,
      errors: []
    };

    try {
      // Navigate to signup
      await this.page.goto(`${DEPLOYMENT_URL}/signup`, { waitUntil: 'networkidle0' });
      
      // Look for signup form
      const emailInput = await this.page.$('input[type="email"], input[name="email"], [data-testid="email-input"]');
      const passwordInput = await this.page.$('input[type="password"], input[name="password"], [data-testid="password-input"]');
      const submitButton = await this.page.$('button[type="submit"], [data-testid="submit-button"], button:contains("Sign Up")');
      
      if (!emailInput || !passwordInput || !submitButton) {
        scenario.errors.push('Registration form elements not found');
        scenario.passed = false;
      } else {
        scenario.steps.push('✅ Registration form found');
        
        // Test form validation
        await emailInput.type('invalid-email');
        await passwordInput.type('weak');
        await submitButton.click();
        
        // Check for validation messages
        await this.page.waitForTimeout(2000);
        const validationMessage = await this.page.$('.error, .invalid, [role="alert"]');
        
        if (validationMessage) {
          scenario.steps.push('✅ Form validation working');
        } else {
          scenario.steps.push('⚠️ Form validation not detected');
        }
        
        scenario.passed = true;
      }
      
    } catch (error) {
      scenario.errors.push(error.message);
      scenario.passed = false;
      log(colors.red, `❌ Registration test error: ${error.message}`);
    }
    
    this.results.scenarios.push(scenario);
    this.results.totalTests++;
    if (scenario.passed) this.results.passed++;
    else this.results.failed++;
    
    return scenario.passed;
  }

  async testDashboardAccess() {
    log(colors.cyan, '📊 Testing Dashboard Access...');
    
    const scenario = {
      name: 'Dashboard Access',
      steps: [],
      passed: false,
      errors: []
    };

    try {
      // Navigate to dashboard
      await this.page.goto(`${DEPLOYMENT_URL}/dashboard`, { waitUntil: 'networkidle0' });
      
      // Check if redirected to login or dashboard loads
      const currentUrl = this.page.url();
      
      if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
        scenario.steps.push('✅ Redirected to login (expected for unauthenticated user)');
        scenario.passed = true;
      } else if (currentUrl.includes('/dashboard')) {
        // Check for dashboard elements
        const dashboardTitle = await this.waitForElement('h1, [data-testid="dashboard-title"]', 5000);
        if (dashboardTitle) {
          scenario.steps.push('✅ Dashboard loaded successfully');
          scenario.passed = true;
        } else {
          scenario.errors.push('Dashboard elements not found');
          scenario.passed = false;
        }
      } else {
        scenario.errors.push(`Unexpected redirect to: ${currentUrl}`);
        scenario.passed = false;
      }
      
    } catch (error) {
      scenario.errors.push(error.message);
      scenario.passed = false;
      log(colors.red, `❌ Dashboard test error: ${error.message}`);
    }
    
    this.results.scenarios.push(scenario);
    this.results.totalTests++;
    if (scenario.passed) this.results.passed++;
    else this.results.failed++;
    
    return scenario.passed;
  }

  async testFileUploadPage() {
    log(colors.cyan, '📁 Testing File Upload Page...');
    
    const scenario = {
      name: 'File Upload Page',
      steps: [],
      passed: false,
      errors: []
    };

    try {
      // Navigate to upload page
      await this.page.goto(`${DEPLOYMENT_URL}/upload`, { waitUntil: 'networkidle0' });
      
      // Check for upload elements
      const fileInput = await this.page.$('input[type="file"]');
      const uploadArea = await this.page.$('[data-testid="upload-area"], .upload-area, .dropzone');
      
      if (fileInput || uploadArea) {
        scenario.steps.push('✅ File upload interface found');
        
        // Check for file type restrictions
        const fileTypeText = await this.page.$eval('body', body => body.textContent);
        if (fileTypeText.includes('PDF') || fileTypeText.includes('DOCX')) {
          scenario.steps.push('✅ File type restrictions displayed');
        }
        
        scenario.passed = true;
      } else {
        scenario.errors.push('File upload interface not found');
        scenario.passed = false;
      }
      
    } catch (error) {
      scenario.errors.push(error.message);
      scenario.passed = false;
      log(colors.red, `❌ Upload page test error: ${error.message}`);
    }
    
    this.results.scenarios.push(scenario);
    this.results.totalTests++;
    if (scenario.passed) this.results.passed++;
    else this.results.failed++;
    
    return scenario.passed;
  }

  async testMobileResponsiveness() {
    log(colors.cyan, '📱 Testing Mobile Responsiveness...');
    
    const scenario = {
      name: 'Mobile Responsiveness',
      steps: [],
      passed: false,
      errors: []
    };

    try {
      // Set mobile viewport
      await this.page.setViewport({ width: 375, height: 667 });
      
      // Test landing page on mobile
      await this.page.goto(DEPLOYMENT_URL, { waitUntil: 'networkidle0' });
      
      // Check for mobile navigation
      const mobileNav = await this.page.$('button[aria-label*="menu"], .hamburger, [data-testid="mobile-menu"]');
      if (mobileNav) {
        scenario.steps.push('✅ Mobile navigation found');
      } else {
        scenario.steps.push('⚠️ Mobile navigation not detected');
      }
      
      // Check for horizontal scrolling
      const bodyWidth = await this.page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = 375;
      
      if (bodyWidth <= viewportWidth + 10) { // Allow small tolerance
        scenario.steps.push('✅ No horizontal scrolling');
      } else {
        scenario.errors.push(`Horizontal scrolling detected: ${bodyWidth}px > ${viewportWidth}px`);
      }
      
      // Check touch targets
      const buttons = await this.page.$$('button, a, input[type="submit"]');
      let smallTargets = 0;
      
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && (box.width < 44 || box.height < 44)) {
          smallTargets++;
        }
      }
      
      if (smallTargets === 0) {
        scenario.steps.push('✅ All touch targets appropriately sized');
      } else {
        scenario.errors.push(`${smallTargets} touch targets too small (<44px)`);
      }
      
      scenario.passed = scenario.errors.length === 0;
      
    } catch (error) {
      scenario.errors.push(error.message);
      scenario.passed = false;
      log(colors.red, `❌ Mobile responsiveness test error: ${error.message}`);
    }
    
    this.results.scenarios.push(scenario);
    this.results.totalTests++;
    if (scenario.passed) this.results.passed++;
    else this.results.failed++;
    
    return scenario.passed;
  }

  async generateReport() {
    const reportPath = path.join(__dirname, 'uat-test-report.json');
    const htmlReportPath = path.join(__dirname, 'uat-test-report.html');
    
    // Generate JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>UAT Test Report - ${this.results.timestamp}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4fd; padding: 15px; border-radius: 5px; text-align: center; }
        .scenario { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .passed { border-left: 5px solid #28a745; }
        .failed { border-left: 5px solid #dc3545; }
        .steps { font-size: 0.9em; margin: 10px 0; }
        .errors { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 UAT Test Report</h1>
        <p><strong>Deployment URL:</strong> ${this.results.deploymentUrl}</p>
        <p><strong>Test Time:</strong> ${this.results.timestamp}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>${this.results.totalTests}</h3>
            <p>Total Tests</p>
        </div>
        <div class="metric">
            <h3>${this.results.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric">
            <h3>${this.results.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>${Math.round((this.results.passed / this.results.totalTests) * 100)}%</h3>
            <p>Success Rate</p>
        </div>
    </div>
    
    <h2>Test Scenarios</h2>
    ${this.results.scenarios.map(scenario => `
        <div class="scenario ${scenario.passed ? 'passed' : 'failed'}">
            <h3>${scenario.name} ${scenario.passed ? '✅' : '❌'}</h3>
            <div class="steps">
                <strong>Steps:</strong>
                <ul>
                    ${scenario.steps.map(step => `<li>${step}</li>`).join('')}
                </ul>
            </div>
            ${scenario.errors.length > 0 ? `
                <div class="errors">
                    <strong>Errors:</strong>
                    <ul>
                        ${scenario.errors.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>`;
    
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    log(colors.blue, `\n📊 UAT Reports generated:`);
    log(colors.blue, `   JSON: ${reportPath}`);
    log(colors.blue, `   HTML: ${htmlReportPath}`);
  }

  async runAllTests(device = DEVICES[0]) {
    log(colors.blue + colors.bold, `\n🧪 Running UAT Tests on ${device.name}`);
    log(colors.blue, `🎯 Target: ${DEPLOYMENT_URL}\n`);
    
    await this.initialize(device);
    
    try {
      // Run all test scenarios
      await this.testLandingPage();
      await this.testUserRegistration();
      await this.testDashboardAccess();
      await this.testFileUploadPage();
      
      // Only test mobile responsiveness on mobile device
      if (device.name === 'Mobile') {
        await this.testMobileResponsiveness();
      }
      
      // Generate reports
      await this.generateReport();
      
      // Summary
      log(colors.blue + colors.bold, `\n📋 UAT Summary for ${device.name}:`);
      log(colors.blue, `   Total Tests: ${this.results.totalTests}`);
      log(colors.green, `   Passed: ${this.results.passed}`);
      log(colors.red, `   Failed: ${this.results.failed}`);
      log(colors.blue, `   Success Rate: ${Math.round((this.results.passed / this.results.totalTests) * 100)}%`);
      
      // Overall status
      if (this.results.failed === 0) {
        log(colors.green + colors.bold, `\n✅ ALL UAT TESTS PASSED ON ${device.name.toUpperCase()}`);
      } else {
        log(colors.red + colors.bold, `\n❌ ${this.results.failed} UAT TESTS FAILED ON ${device.name.toUpperCase()}`);
      }
      
    } finally {
      await this.cleanup();
    }
    
    return this.results.failed === 0;
  }
}

async function runUATSuite() {
  log(colors.blue + colors.bold, '\n🧪 Starting Comprehensive UAT Suite\n');
  
  const deviceToTest = process.argv.includes('--mobile') ? DEVICES[3] : 
                      process.argv.includes('--tablet') ? DEVICES[2] : 
                      process.argv.includes('--laptop') ? DEVICES[1] : DEVICES[0];
  
  const tester = new UATTester();
  const success = await tester.runAllTests(deviceToTest);
  
  if (success) {
    log(colors.green + colors.bold, '\n🎉 UAT SUITE COMPLETED SUCCESSFULLY!');
    log(colors.green, '   Your application is ready for production users!');
  } else {
    log(colors.red + colors.bold, '\n❌ UAT SUITE FAILED');
    log(colors.red, '   Review the test report and fix issues before production.');
    process.exit(1);
  }
}

// CLI handling
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node automated-uat-tests.js [options]

Options:
  --url <url>     Deployment URL to test
  --mobile        Test on mobile viewport
  --tablet        Test on tablet viewport
  --laptop        Test on laptop viewport
  --headless      Run in headless mode (default: true)
  --help, -h      Show this help message

Environment Variables:
  DEPLOYMENT_URL  Deployment URL to test
  HEADLESS        Set to 'false' to see browser (default: true)

Examples:
  node automated-uat-tests.js --url https://my-app.vercel.app
  node automated-uat-tests.js --mobile --headless false
  DEPLOYMENT_URL=https://my-app.vercel.app node automated-uat-tests.js
`);
  process.exit(0);
}

// Parse URL from command line
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  process.env.DEPLOYMENT_URL = process.argv[urlIndex + 1];
}

// Run UAT suite
runUATSuite().catch(error => {
  log(colors.red, `\n❌ UAT suite failed: ${error.message}`);
  process.exit(1);
});
