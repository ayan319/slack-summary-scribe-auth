#!/usr/bin/env node

/**
 * Production End-to-End Flow Testing Script
 * Tests all critical user flows with real data and authentication
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';

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

class ProductionFlowTester {
  constructor() {
    this.supabase = null;
    this.session = null;
    this.user = null;
    this.organization = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      totalTests: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async initialize() {
    log(colors.blue + colors.bold, '\n🚀 Initializing Production Flow Testing\n');
    
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    if (!this.supabase) {
      throw new Error('Failed to initialize Supabase client');
    }

    log(colors.green, '✅ Supabase client initialized');
  }

  async testUserAuthentication() {
    log(colors.cyan, '\n👤 Testing User Authentication Flow...');
    
    const test = {
      name: 'User Authentication',
      steps: [],
      passed: false,
      errors: []
    };

    try {
      // Test sign up
      log(colors.blue, '   Testing user signup...');
      const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: {
            name: 'Test User'
          }
        }
      });

      if (signUpError && !signUpError.message.includes('already registered')) {
        test.errors.push(`Signup failed: ${signUpError.message}`);
      } else {
        test.steps.push('✅ User signup successful or user already exists');
      }

      // Test sign in
      log(colors.blue, '   Testing user signin...');
      const { data: signInData, error: signInError } = await this.supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });

      if (signInError) {
        test.errors.push(`Signin failed: ${signInError.message}`);
      } else {
        this.session = signInData.session;
        this.user = signInData.user;
        test.steps.push('✅ User signin successful');
        test.steps.push(`✅ Session established for user: ${this.user.email}`);
      }

      // Test session validation
      log(colors.blue, '   Testing session validation...');
      const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        test.errors.push('Session validation failed');
      } else {
        test.steps.push('✅ Session validation successful');
      }

      test.passed = test.errors.length === 0 && this.session && this.user;

    } catch (error) {
      test.errors.push(`Authentication test error: ${error.message}`);
      test.passed = false;
    }

    this.testResults.tests.push(test);
    this.testResults.totalTests++;
    if (test.passed) this.testResults.passed++;
    else this.testResults.failed++;

    if (test.passed) {
      log(colors.green, '✅ Authentication flow test passed');
    } else {
      log(colors.red, '❌ Authentication flow test failed');
      test.errors.forEach(error => log(colors.red, `   ${error}`));
    }

    return test.passed;
  }

  async testDatabaseOperations() {
    log(colors.cyan, '\n🗄️ Testing Database Operations...');
    
    const test = {
      name: 'Database Operations',
      steps: [],
      passed: false,
      errors: []
    };

    try {
      if (!this.user) {
        test.errors.push('No authenticated user for database tests');
        test.passed = false;
        this.testResults.tests.push(test);
        this.testResults.totalTests++;
        this.testResults.failed++;
        return false;
      }

      // Test user profile creation/update
      log(colors.blue, '   Testing user profile operations...');
      const { data: userData, error: userError } = await this.supabase
        .from('users')
        .upsert({
          id: this.user.id,
          email: this.user.email,
          name: 'Test User Updated',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) {
        test.errors.push(`User profile operation failed: ${userError.message}`);
      } else {
        test.steps.push('✅ User profile operations successful');
      }

      // Test organization operations
      log(colors.blue, '   Testing organization operations...');
      const { data: orgData, error: orgError } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('created_by', this.user.id)
        .limit(1);

      if (orgError) {
        test.errors.push(`Organization query failed: ${orgError.message}`);
      } else {
        if (orgData && orgData.length > 0) {
          this.organization = orgData[0];
          test.steps.push('✅ Organization found');
        } else {
          test.steps.push('⚠️ No organization found (may be created by trigger)');
        }
      }

      // Test summary creation
      log(colors.blue, '   Testing summary creation...');
      const testSummary = {
        id: `test-summary-${Date.now()}`,
        user_id: this.user.id,
        title: 'Test Summary',
        content: 'This is a test summary created during production flow testing.',
        source_type: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: summaryData, error: summaryError } = await this.supabase
        .from('summaries')
        .insert(testSummary)
        .select()
        .single();

      if (summaryError) {
        test.errors.push(`Summary creation failed: ${summaryError.message}`);
      } else {
        test.steps.push('✅ Summary creation successful');
        
        // Test summary retrieval
        const { data: retrievedSummary, error: retrieveError } = await this.supabase
          .from('summaries')
          .select('*')
          .eq('id', testSummary.id)
          .single();

        if (retrieveError) {
          test.errors.push(`Summary retrieval failed: ${retrieveError.message}`);
        } else {
          test.steps.push('✅ Summary retrieval successful');
        }

        // Clean up test summary
        await this.supabase
          .from('summaries')
          .delete()
          .eq('id', testSummary.id);
        
        test.steps.push('✅ Test summary cleaned up');
      }

      test.passed = test.errors.length === 0;

    } catch (error) {
      test.errors.push(`Database test error: ${error.message}`);
      test.passed = false;
    }

    this.testResults.tests.push(test);
    this.testResults.totalTests++;
    if (test.passed) this.testResults.passed++;
    else this.testResults.failed++;

    if (test.passed) {
      log(colors.green, '✅ Database operations test passed');
    } else {
      log(colors.red, '❌ Database operations test failed');
      test.errors.forEach(error => log(colors.red, `   ${error}`));
    }

    return test.passed;
  }

  async testAPIEndpoints() {
    log(colors.cyan, '\n🔌 Testing API Endpoints...');
    
    const test = {
      name: 'API Endpoints',
      steps: [],
      passed: false,
      errors: []
    };

    try {
      if (!this.session) {
        test.errors.push('No session available for API tests');
        test.passed = false;
        this.testResults.tests.push(test);
        this.testResults.totalTests++;
        this.testResults.failed++;
        return false;
      }

      const headers = {
        'Authorization': `Bearer ${this.session.access_token}`,
        'Content-Type': 'application/json'
      };

      // Test health endpoint
      log(colors.blue, '   Testing health endpoint...');
      const healthResponse = await fetch(`${DEPLOYMENT_URL}/api/health`);
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        test.steps.push(`✅ Health endpoint: ${healthData.status}`);
      } else {
        test.errors.push(`Health endpoint failed: ${healthResponse.status}`);
      }

      // Test dashboard endpoint
      log(colors.blue, '   Testing dashboard endpoint...');
      const dashboardResponse = await fetch(`${DEPLOYMENT_URL}/api/dashboard`, {
        headers
      });

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        test.steps.push('✅ Dashboard endpoint successful');
        if (dashboardData.user) {
          test.steps.push(`✅ User data returned: ${dashboardData.user.email}`);
        }
      } else {
        test.errors.push(`Dashboard endpoint failed: ${dashboardResponse.status}`);
      }

      // Test uploads endpoint
      log(colors.blue, '   Testing uploads endpoint...');
      const uploadsResponse = await fetch(`${DEPLOYMENT_URL}/api/uploads`, {
        headers
      });

      if (uploadsResponse.ok) {
        test.steps.push('✅ Uploads endpoint successful');
      } else {
        test.errors.push(`Uploads endpoint failed: ${uploadsResponse.status}`);
      }

      test.passed = test.errors.length === 0;

    } catch (error) {
      test.errors.push(`API test error: ${error.message}`);
      test.passed = false;
    }

    this.testResults.tests.push(test);
    this.testResults.totalTests++;
    if (test.passed) this.testResults.passed++;
    else this.testResults.failed++;

    if (test.passed) {
      log(colors.green, '✅ API endpoints test passed');
    } else {
      log(colors.red, '❌ API endpoints test failed');
      test.errors.forEach(error => log(colors.red, `   ${error}`));
    }

    return test.passed;
  }

  async testFileUploadAndAI() {
    log(colors.cyan, '\n📁 Testing File Upload & AI Summarization...');

    const test = {
      name: 'File Upload & AI Summarization',
      steps: [],
      passed: false,
      errors: []
    };

    try {
      if (!this.session) {
        test.errors.push('No session available for file upload tests');
        test.passed = false;
        this.testResults.tests.push(test);
        this.testResults.totalTests++;
        this.testResults.failed++;
        return false;
      }

      // Test OpenRouter connection first
      log(colors.blue, '   Testing OpenRouter API connection...');

      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': DEPLOYMENT_URL,
          'X-Title': 'Slack Summary Scribe'
        }
      });

      if (openRouterResponse.ok) {
        const models = await openRouterResponse.json();
        test.steps.push(`✅ OpenRouter API connected (${models.data?.length || 0} models available)`);
      } else {
        test.errors.push(`OpenRouter API failed: ${openRouterResponse.status}`);
      }

      // Test AI summarization with text
      log(colors.blue, '   Testing AI summarization with text...');

      const summaryResponse = await fetch(`${DEPLOYMENT_URL}/api/ai/summarize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: 'This is a comprehensive test document for AI summarization. It contains multiple paragraphs of sample content to verify that the AI integration is working correctly in production. The document discusses various topics including project management, team collaboration, and technical implementation details. This should provide enough content for the AI to generate a meaningful summary that demonstrates the system\'s capabilities.',
          title: 'Production Test Document'
        })
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        test.steps.push('✅ AI summarization endpoint successful');
        if (summaryData.summary) {
          test.steps.push('✅ AI summary generated successfully');
          test.steps.push(`✅ Summary length: ${summaryData.summary.length} characters`);
        }
        if (summaryData.id) {
          test.steps.push('✅ Summary saved to database');
        }
      } else {
        const errorText = await summaryResponse.text();
        test.errors.push(`AI summarization failed: ${summaryResponse.status} - ${errorText}`);
      }

      // Test file upload endpoint
      log(colors.blue, '   Testing file upload endpoint...');

      // Create a test text file
      const testFileContent = 'This is a test file for upload validation. It contains sample content to verify the file upload and processing pipeline.';
      const testFile = new Blob([testFileContent], { type: 'text/plain' });

      const formData = new FormData();
      formData.append('file', testFile, 'test-document.txt');
      formData.append('title', 'Test Upload Document');

      const uploadResponse = await fetch(`${DEPLOYMENT_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.session.access_token}`
        },
        body: formData
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        test.steps.push('✅ File upload endpoint successful');
        if (uploadData.id) {
          test.steps.push('✅ Upload record created');
        }
      } else {
        const errorText = await uploadResponse.text();
        test.errors.push(`File upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      test.passed = test.errors.length === 0;

    } catch (error) {
      test.errors.push(`File upload & AI test error: ${error.message}`);
      test.passed = false;
    }

    this.testResults.tests.push(test);
    this.testResults.totalTests++;
    if (test.passed) this.testResults.passed++;
    else this.testResults.failed++;

    if (test.passed) {
      log(colors.green, '✅ File upload & AI integration test passed');
    } else {
      log(colors.red, '❌ File upload & AI integration test failed');
      test.errors.forEach(error => log(colors.red, `   ${error}`));
    }

    return test.passed;
  }

  async generateReport() {
    log(colors.blue + colors.bold, '\n📊 Generating Production Flow Test Report\n');
    
    const reportPath = path.join(__dirname, 'production-flow-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    // Summary
    log(colors.blue, `📋 Test Summary:`);
    log(colors.blue, `   Total Tests: ${this.testResults.totalTests}`);
    log(colors.green, `   Passed: ${this.testResults.passed}`);
    log(colors.red, `   Failed: ${this.testResults.failed}`);
    log(colors.blue, `   Success Rate: ${Math.round((this.testResults.passed / this.testResults.totalTests) * 100)}%`);
    
    // Overall status
    if (this.testResults.failed === 0) {
      log(colors.green + colors.bold, '\n✅ ALL PRODUCTION FLOW TESTS PASSED');
      log(colors.green, '   Your application is ready for real users!');
    } else {
      log(colors.red + colors.bold, '\n❌ SOME PRODUCTION FLOW TESTS FAILED');
      log(colors.red, '   Review and fix issues before launching to users.');
    }
    
    log(colors.blue, `\n📄 Detailed report saved to: ${reportPath}`);
    
    return this.testResults.failed === 0;
  }

  async cleanup() {
    if (this.supabase && this.session) {
      await this.supabase.auth.signOut();
      log(colors.blue, '🧹 Cleaned up test session');
    }
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      const authPassed = await this.testUserAuthentication();
      const dbPassed = await this.testDatabaseOperations();
      const apiPassed = await this.testAPIEndpoints();
      const fileAiPassed = await this.testFileUploadAndAI();
      
      const allPassed = await this.generateReport();
      
      await this.cleanup();
      
      return allPassed;
    } catch (error) {
      log(colors.red, `\n❌ Production flow testing failed: ${error.message}`);
      await this.cleanup();
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new ProductionFlowTester();
  const success = await tester.runAllTests();
  
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ProductionFlowTester;
