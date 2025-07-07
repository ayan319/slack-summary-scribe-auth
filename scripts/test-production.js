#!/usr/bin/env node

/**
 * Production Testing Script for Slack Summary Scribe
 * Tests the complete user flow from signup to payment to dashboard
 */

const axios = require('axios');
const chalk = require('chalk');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_NAME = 'Test User';

class ProductionTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(name, testFn) {
    console.log(chalk.blue(`\n🧪 Testing: ${name}`));
    
    try {
      await testFn();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      console.log(chalk.green(`✅ ${name} - PASSED`));
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      console.log(chalk.red(`❌ ${name} - FAILED: ${error.message}`));
    }
  }

  async testPageLoad(path, expectedTitle) {
    const response = await axios.get(`${BASE_URL}${path}`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (expectedTitle && !response.data.includes(expectedTitle)) {
      throw new Error(`Page title "${expectedTitle}" not found`);
    }
  }

  async testApiEndpoint(path, method = 'GET', data = null, expectedStatus = 200) {
    const config = {
      method,
      url: `${BASE_URL}/api${path}`,
      data,
      validateStatus: () => true // Don't throw on non-2xx status
    };
    
    const response = await axios(config);
    
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }
    
    return response.data;
  }

  async testCashfreeOrder() {
    const orderData = {
      planId: 'PRO',
      customerName: TEST_NAME,
      customerEmail: TEST_EMAIL,
      userId: 'test-user-123'
    };
    
    const response = await this.testApiEndpoint('/cashfree/order', 'POST', orderData);
    
    if (!response.success) {
      throw new Error('Order creation failed');
    }
    
    if (!response.paymentLink) {
      throw new Error('Payment link not generated');
    }
    
    return response;
  }

  async testSubscriptionStatus() {
    const response = await this.testApiEndpoint('/subscription/status?userId=test-user-123');
    
    if (typeof response.isPaid !== 'boolean') {
      throw new Error('Invalid subscription status response');
    }
    
    return response;
  }

  async testSlackStatus() {
    const response = await this.testApiEndpoint('/slack/status');
    
    if (typeof response.connected !== 'boolean') {
      throw new Error('Invalid Slack status response');
    }
    
    return response;
  }

  async runAllTests() {
    console.log(chalk.yellow(`\n🚀 Starting Production Tests for ${BASE_URL}\n`));
    
    // Page Load Tests
    await this.runTest('Homepage loads', () => 
      this.testPageLoad('/', 'Slack Summary Scribe')
    );
    
    await this.runTest('Pricing page loads', () => 
      this.testPageLoad('/pricing', 'Pricing')
    );
    
    await this.runTest('Terms page loads', () => 
      this.testPageLoad('/terms', 'Terms of Service')
    );
    
    await this.runTest('Privacy page loads', () => 
      this.testPageLoad('/privacy', 'Privacy Policy')
    );
    
    await this.runTest('Login page loads', () => 
      this.testPageLoad('/login', 'Login')
    );
    
    await this.runTest('Signup page loads', () => 
      this.testPageLoad('/signup', 'Sign Up')
    );

    // API Tests
    await this.runTest('Health check API', () => 
      this.testApiEndpoint('/health')
    );
    
    await this.runTest('Subscription status API', () => 
      this.testSubscriptionStatus()
    );
    
    await this.runTest('Slack status API', () => 
      this.testSlackStatus()
    );
    
    // Payment Flow Tests
    await this.runTest('Cashfree order creation', () => 
      this.testCashfreeOrder()
    );

    // Security Tests
    await this.runTest('CORS headers', async () => {
      const response = await axios.options(`${BASE_URL}/api/health`);
      const corsHeader = response.headers['access-control-allow-origin'];
      if (!corsHeader) {
        throw new Error('CORS headers not set');
      }
    });

    await this.runTest('Security headers', async () => {
      const response = await axios.get(BASE_URL);
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'referrer-policy'
      ];
      
      for (const header of securityHeaders) {
        if (!response.headers[header]) {
          throw new Error(`Security header ${header} not set`);
        }
      }
    });

    // Performance Tests
    await this.runTest('Page load performance', async () => {
      const start = Date.now();
      await axios.get(BASE_URL);
      const loadTime = Date.now() - start;
      
      if (loadTime > 5000) {
        throw new Error(`Page load too slow: ${loadTime}ms`);
      }
    });

    // Mobile Responsiveness (basic check)
    await this.runTest('Mobile viewport meta tag', async () => {
      const response = await axios.get(BASE_URL);
      if (!response.data.includes('viewport')) {
        throw new Error('Mobile viewport meta tag not found');
      }
    });

    this.printResults();
  }

  printResults() {
    console.log(chalk.yellow('\n📊 Test Results Summary\n'));
    
    const total = this.results.passed + this.results.failed;
    const passRate = ((this.results.passed / total) * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(chalk.green(`Passed: ${this.results.passed}`));
    console.log(chalk.red(`Failed: ${this.results.failed}`));
    console.log(`Pass Rate: ${passRate}%\n`);
    
    if (this.results.failed > 0) {
      console.log(chalk.red('❌ Failed Tests:'));
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(chalk.red(`  - ${test.name}: ${test.error}`));
        });
      console.log('');
    }
    
    if (this.results.failed === 0) {
      console.log(chalk.green('🎉 All tests passed! Ready for production.'));
    } else {
      console.log(chalk.red('⚠️  Some tests failed. Please fix issues before deploying.'));
      process.exit(1);
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ProductionTester();
  tester.runAllTests().catch(error => {
    console.error(chalk.red('Test runner failed:'), error);
    process.exit(1);
  });
}

module.exports = ProductionTester;
