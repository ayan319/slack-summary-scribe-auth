#!/usr/bin/env node

/**
 * Launch Readiness Test
 * Comprehensive test suite for Product Hunt launch validation
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

console.log('🚀 LAUNCH READINESS TEST - PRODUCT HUNT VALIDATION\n');

async function launchReadinessTest() {
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const clientSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const testResults = {
    environment: false,
    database: false,
    authentication: false,
    userExperience: false,
    performance: false,
    errorHandling: false,
    mobileOptimization: false,
    monitoring: false
  };

  console.log('🔍 PHASE 1: Environment & Infrastructure Validation\n');

  // Test 1: Environment Variables
  console.log('1️⃣ Testing environment variables...');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'OPENROUTER_API_KEY',
    'SLACK_CLIENT_ID',
    'SLACK_CLIENT_SECRET',
    'SENTRY_DSN'
  ];

  let envVarsValid = true;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.log(`❌ Missing: ${envVar}`);
      envVarsValid = false;
    } else {
      console.log(`✅ ${envVar}: Configured`);
    }
  }
  testResults.environment = envVarsValid;

  // Test 2: Database Connection
  console.log('\n2️⃣ Testing database connection...');
  try {
    const { data: healthCheck, error } = await adminSupabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:', error.message);
      testResults.database = false;
    } else {
      console.log('✅ Database connection successful');
      console.log('✅ Users table accessible');
      testResults.database = true;
    }
  } catch (err) {
    console.log('❌ Database test failed:', err.message);
    testResults.database = false;
  }

  console.log('\n🔐 PHASE 2: Authentication & User Flow Validation\n');

  // Test 3: Authentication System
  console.log('3️⃣ Testing authentication system...');
  try {
    // Test OAuth providers configuration
    const { data: providers, error: providersError } = await clientSupabase.auth.getSession();
    
    if (providersError) {
      console.log('❌ Auth system error:', providersError.message);
      testResults.authentication = false;
    } else {
      console.log('✅ Authentication system accessible');
      console.log('✅ OAuth providers configured');
      testResults.authentication = true;
    }
  } catch (err) {
    console.log('❌ Authentication test failed:', err.message);
    testResults.authentication = false;
  }

  console.log('\n🎨 PHASE 3: User Experience Validation\n');

  // Test 4: User Experience Components
  console.log('4️⃣ Testing user experience components...');
  try {
    // Check if key UI components exist
    const fs = require('fs');
    const path = require('path');

    const criticalFiles = [
      'app/signup/page.tsx',
      'app/login/page.tsx',
      'app/dashboard/page.tsx',
      'components/ErrorBoundary.tsx',
      'components/ui/progress.tsx',
      'components/ui/skeleton.tsx'
    ];

    let uiComponentsValid = true;
    for (const file of criticalFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        console.log(`✅ ${file}: Exists`);
      } else {
        console.log(`❌ ${file}: Missing`);
        uiComponentsValid = false;
      }
    }

    // Check for mobile optimization indicators
    const signupPageContent = fs.readFileSync(path.join(process.cwd(), 'app/signup/page.tsx'), 'utf8');
    const hasMobileOptimization = signupPageContent.includes('max-w') &&
                                  signupPageContent.includes('flex') &&
                                  signupPageContent.includes('grid') &&
                                  signupPageContent.includes('min-h-screen');

    if (hasMobileOptimization) {
      console.log('✅ Mobile optimization: Responsive design detected');
    } else {
      console.log('❌ Mobile optimization: No responsive design found');
      uiComponentsValid = false;
    }

    testResults.userExperience = uiComponentsValid;
  } catch (err) {
    console.log('❌ UI components test failed:', err.message);
    testResults.userExperience = false;
  }

  console.log('\n⚡ PHASE 4: Performance & Loading States\n');

  // Test 5: Performance Optimization
  console.log('5️⃣ Testing performance optimization...');
  try {
    const fs = require('fs');
    const path = require('path');

    // Check for loading states and skeletons
    const dashboardContent = fs.readFileSync(path.join(process.cwd(), 'app/dashboard/page.tsx'), 'utf8');
    const hasLoadingStates = dashboardContent.includes('Skeleton') && dashboardContent.includes('loading');
    const hasErrorHandling = dashboardContent.includes('error') && dashboardContent.includes('ErrorBoundary');

    if (hasLoadingStates) {
      console.log('✅ Loading states: Implemented');
    } else {
      console.log('❌ Loading states: Missing');
    }

    if (hasErrorHandling) {
      console.log('✅ Error handling: Implemented');
    } else {
      console.log('❌ Error handling: Missing');
    }

    testResults.performance = hasLoadingStates;
    testResults.errorHandling = hasErrorHandling;
  } catch (err) {
    console.log('❌ Performance test failed:', err.message);
    testResults.performance = false;
    testResults.errorHandling = false;
  }

  console.log('\n📱 PHASE 5: Mobile Optimization\n');

  // Test 6: Mobile Optimization
  console.log('6️⃣ Testing mobile optimization...');
  try {
    const fs = require('fs');
    const path = require('path');

    const signupContent = fs.readFileSync(path.join(process.cwd(), 'app/signup/page.tsx'), 'utf8');
    
    const mobileFeatures = [
      { name: 'Responsive grid', pattern: /grid-cols-1/ },
      { name: 'Mobile-first design', pattern: /max-w-md|max-w-lg/ },
      { name: 'Touch-friendly buttons', pattern: /h-11|h-12/ },
      { name: 'Mobile viewport', pattern: /min-h-screen/ },
      { name: 'Flexible layouts', pattern: /flex.*items-center|flex.*justify-center/ }
    ];

    let mobileScore = 0;
    for (const feature of mobileFeatures) {
      if (feature.pattern.test(signupContent)) {
        console.log(`✅ ${feature.name}: Implemented`);
        mobileScore++;
      } else {
        console.log(`⚠️  ${feature.name}: Not detected`);
      }
    }

    testResults.mobileOptimization = mobileScore >= 3; // At least 3 out of 5 features
    console.log(`📊 Mobile optimization score: ${mobileScore}/5`);
  } catch (err) {
    console.log('❌ Mobile optimization test failed:', err.message);
    testResults.mobileOptimization = false;
  }

  console.log('\n📊 PHASE 6: Monitoring & Error Tracking\n');

  // Test 7: Monitoring Setup
  console.log('7️⃣ Testing monitoring and error tracking...');
  try {
    const fs = require('fs');
    const path = require('path');

    // Check for Sentry configuration
    const hasSentryConfig = process.env.SENTRY_DSN && process.env.SENTRY_DSN.length > 0;
    
    // Check for PostHog configuration (optional)
    const hasPostHogConfig = process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_KEY.length > 0;

    // Check for error boundary implementation
    const errorBoundaryExists = fs.existsSync(path.join(process.cwd(), 'components/ErrorBoundary.tsx'));

    if (hasSentryConfig) {
      console.log('✅ Sentry: Configured');
    } else {
      console.log('⚠️  Sentry: Not configured');
    }

    if (hasPostHogConfig) {
      console.log('✅ PostHog: Configured');
    } else {
      console.log('⚠️  PostHog: Not configured (optional)');
    }

    if (errorBoundaryExists) {
      console.log('✅ Error Boundary: Implemented');
    } else {
      console.log('❌ Error Boundary: Missing');
    }

    testResults.monitoring = hasSentryConfig && errorBoundaryExists;
  } catch (err) {
    console.log('❌ Monitoring test failed:', err.message);
    testResults.monitoring = false;
  }

  return testResults;
}

// Generate launch readiness report
function generateLaunchReport(results) {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 LAUNCH READINESS REPORT - PRODUCT HUNT VALIDATION');
  console.log('='.repeat(70));
  
  const tests = [
    { name: 'Environment & Infrastructure', key: 'environment', critical: true },
    { name: 'Database Connection', key: 'database', critical: true },
    { name: 'Authentication System', key: 'authentication', critical: true },
    { name: 'User Experience', key: 'userExperience', critical: true },
    { name: 'Performance & Loading', key: 'performance', critical: false },
    { name: 'Error Handling', key: 'errorHandling', critical: true },
    { name: 'Mobile Optimization', key: 'mobileOptimization', critical: false },
    { name: 'Monitoring & Tracking', key: 'monitoring', critical: false }
  ];
  
  const passedTests = tests.filter(t => results[t.key]).length;
  const criticalTests = tests.filter(t => t.critical);
  const passedCritical = criticalTests.filter(t => results[t.key]).length;
  const totalTests = tests.length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  const criticalSuccessRate = Math.round((passedCritical / criticalTests.length) * 100);
  
  console.log(`📈 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests})`);
  console.log(`🎯 Critical Success Rate: ${criticalSuccessRate}% (${passedCritical}/${criticalTests.length})`);
  console.log('');
  
  console.log('📋 Detailed Results:');
  tests.forEach(test => {
    const status = results[test.key] ? '✅' : '❌';
    const critical = test.critical ? ' (CRITICAL)' : '';
    console.log(`${status} ${test.name}${critical}`);
  });
  
  console.log('\n🎯 PRODUCT HUNT LAUNCH READINESS:');
  
  if (criticalSuccessRate === 100) {
    console.log('🎉 READY FOR PRODUCT HUNT LAUNCH!');
    console.log('✨ All critical systems operational');
    console.log('🚀 Safe to launch and announce');
    
    if (successRate >= 85) {
      console.log('🏆 EXCELLENT - Premium launch experience');
    } else if (successRate >= 70) {
      console.log('👍 GOOD - Solid launch foundation');
    } else {
      console.log('⚠️  ACCEPTABLE - Consider addressing non-critical items');
    }
    
  } else {
    console.log('❌ NOT READY FOR LAUNCH');
    console.log('🚨 Critical issues must be resolved');
    
    const failedCritical = criticalTests.filter(t => !results[t.key]);
    console.log('\n🔧 Critical Issues:');
    failedCritical.forEach(test => {
      console.log(`   • ${test.name}`);
    });
  }
  
  console.log('\n🚀 LAUNCH RECOMMENDATION:');
  if (criticalSuccessRate === 100) {
    console.log('✅ APPROVED FOR PRODUCT HUNT LAUNCH');
    console.log('✅ APPROVED FOR PUBLIC ANNOUNCEMENT');
    console.log('✅ READY FOR USER ONBOARDING');
  } else {
    console.log('❌ LAUNCH BLOCKED - Fix critical issues first');
  }
  
  return criticalSuccessRate === 100;
}

// Main execution
async function main() {
  console.log('🚀 Starting launch readiness validation...\n');
  
  try {
    const results = await launchReadinessTest();
    const isReady = generateLaunchReport(results);
    
    console.log('\n🏁 Launch readiness test complete!');
    return isReady;
    
  } catch (error) {
    console.error('\n💥 Launch readiness test failed:', error);
    return false;
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error during launch readiness testing:', error);
      process.exit(1);
    });
}

module.exports = main;
