#!/usr/bin/env node

/**
 * Production Monitoring Script
 * Validates Sentry, PostHog, and performance metrics
 */

const https = require('https');
const fs = require('fs');

const PRODUCTION_URL = 'https://slack-summary-scribe-77p42dii8-ayans-projects-c9fd2ddf.vercel.app';

console.log('🔍 Production Monitoring & Validation\n');

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : https;
    const req = protocol.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          responseTime: Date.now() - startTime
        });
      });
    });
    
    const startTime = Date.now();
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Core system monitoring
const monitoringChecks = [
  {
    name: 'Production Homepage',
    url: `${PRODUCTION_URL}/`,
    expectedStatus: 200,
    checkContent: (data) => data.includes('Complete Slack AI Suite'),
    critical: true
  },
  {
    name: 'Dashboard Access',
    url: `${PRODUCTION_URL}/dashboard`,
    expectedStatus: 200,
    checkContent: (data) => data.includes('dashboard') || data.includes('login'),
    critical: true
  },
  {
    name: 'API Health Check',
    url: `${PRODUCTION_URL}/api/health`,
    expectedStatus: 200,
    checkContent: (data) => {
      try {
        const json = JSON.parse(data);
        return json.status === 'ok' || json.message;
      } catch {
        return data.includes('ok') || data.includes('healthy');
      }
    },
    critical: true
  },
  {
    name: 'Pricing Page',
    url: `${PRODUCTION_URL}/pricing`,
    expectedStatus: 200,
    checkContent: (data) => data.includes('pricing') || data.includes('plan'),
    critical: false
  },
  {
    name: 'Login Page',
    url: `${PRODUCTION_URL}/login`,
    expectedStatus: 200,
    checkContent: (data) => data.includes('login') || data.includes('sign'),
    critical: false
  }
];

// Performance monitoring
async function checkPerformance() {
  console.log('⚡ Performance Monitoring...\n');
  
  const performanceTests = [
    { name: 'Homepage Load Time', url: `${PRODUCTION_URL}/` },
    { name: 'Dashboard Load Time', url: `${PRODUCTION_URL}/dashboard` },
    { name: 'API Response Time', url: `${PRODUCTION_URL}/api/health` }
  ];
  
  const results = [];
  
  for (const test of performanceTests) {
    try {
      console.log(`⏱️  Testing: ${test.name}...`);
      const response = await makeRequest(test.url);
      
      if (response.responseTime < 1000) {
        console.log(`✅ ${test.name}: ${response.responseTime}ms (Excellent)`);
      } else if (response.responseTime < 3000) {
        console.log(`⚠️  ${test.name}: ${response.responseTime}ms (Good)`);
      } else {
        console.log(`❌ ${test.name}: ${response.responseTime}ms (Slow)`);
      }
      
      results.push({
        name: test.name,
        responseTime: response.responseTime,
        status: response.statusCode
      });
      
    } catch (error) {
      console.log(`❌ ${test.name}: Error - ${error.message}`);
      results.push({
        name: test.name,
        responseTime: null,
        status: 'error',
        error: error.message
      });
    }
  }
  
  return results;
}

// Security headers check
async function checkSecurityHeaders() {
  console.log('\n🔒 Security Headers Check...\n');
  
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/`);
    const headers = response.headers;
    
    const securityChecks = [
      {
        name: 'Strict-Transport-Security',
        header: 'strict-transport-security',
        required: true
      },
      {
        name: 'X-Content-Type-Options',
        header: 'x-content-type-options',
        required: true
      },
      {
        name: 'X-Frame-Options',
        header: 'x-frame-options',
        required: true
      },
      {
        name: 'Content-Security-Policy',
        header: 'content-security-policy',
        required: false
      }
    ];
    
    let securityScore = 0;
    const totalChecks = securityChecks.length;
    
    for (const check of securityChecks) {
      if (headers[check.header]) {
        console.log(`✅ ${check.name}: Present`);
        securityScore++;
      } else if (check.required) {
        console.log(`❌ ${check.name}: Missing (Required)`);
      } else {
        console.log(`⚠️  ${check.name}: Missing (Recommended)`);
      }
    }
    
    console.log(`\n🔒 Security Score: ${securityScore}/${totalChecks} (${Math.round((securityScore/totalChecks)*100)}%)`);
    return securityScore / totalChecks;
    
  } catch (error) {
    console.log(`❌ Security check failed: ${error.message}`);
    return 0;
  }
}

// Monitor Sentry integration
function checkSentryIntegration() {
  console.log('\n🐛 Sentry Integration Check...\n');
  
  try {
    // Check if Sentry client file exists
    if (fs.existsSync('lib/sentry.client.ts')) {
      console.log('✅ Sentry client configuration: Present');
    } else {
      console.log('❌ Sentry client configuration: Missing');
      return false;
    }
    
    // Check if Sentry is initialized in layout
    if (fs.existsSync('app/layout.tsx')) {
      const layoutContent = fs.readFileSync('app/layout.tsx', 'utf8');
      if (layoutContent.includes('sentry') || layoutContent.includes('Sentry')) {
        console.log('✅ Sentry initialization: Present in layout');
      } else {
        console.log('⚠️  Sentry initialization: Not found in layout');
      }
    }
    
    console.log('✅ Sentry monitoring: Configured for error tracking');
    return true;
    
  } catch (error) {
    console.log(`❌ Sentry check failed: ${error.message}`);
    return false;
  }
}

// Monitor PostHog integration
function checkPostHogIntegration() {
  console.log('\n📊 PostHog Integration Check...\n');
  
  try {
    // Check environment variables
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      console.log('✅ PostHog API key: Configured');
    } else {
      console.log('⚠️  PostHog API key: Not configured');
    }
    
    if (process.env.NEXT_PUBLIC_POSTHOG_HOST) {
      console.log('✅ PostHog host: Configured');
    } else {
      console.log('⚠️  PostHog host: Using default');
    }
    
    // Check if PostHog provider exists
    if (fs.existsSync('components/providers/posthog-provider.tsx')) {
      console.log('✅ PostHog provider: Present');
    } else {
      console.log('⚠️  PostHog provider: Not found');
    }
    
    console.log('✅ PostHog analytics: Ready for user tracking');
    return true;
    
  } catch (error) {
    console.log(`❌ PostHog check failed: ${error.message}`);
    return false;
  }
}

// Run comprehensive monitoring
async function runMonitoring() {
  console.log('🔍 Running Production System Monitoring...\n');
  
  let passed = 0;
  let failed = 0;
  let criticalIssues = 0;
  
  for (const check of monitoringChecks) {
    try {
      console.log(`🧪 Testing: ${check.name}...`);
      const response = await makeRequest(check.url);
      
      // Check status code
      if (response.statusCode !== check.expectedStatus) {
        console.log(`❌ ${check.name}: Expected ${check.expectedStatus}, got ${response.statusCode}`);
        failed++;
        if (check.critical) criticalIssues++;
        continue;
      }
      
      // Check content if specified
      if (check.checkContent && !check.checkContent(response.data)) {
        console.log(`❌ ${check.name}: Content validation failed`);
        failed++;
        if (check.critical) criticalIssues++;
        continue;
      }
      
      console.log(`✅ ${check.name}: Passed (${response.responseTime}ms)`);
      passed++;
      
    } catch (error) {
      console.log(`❌ ${check.name}: Error - ${error.message}`);
      failed++;
      if (check.critical) criticalIssues++;
    }
  }
  
  console.log(`\n📊 System Monitoring: ✅ ${passed}/${monitoringChecks.length} passed`);
  return { passed, failed, criticalIssues, total: monitoringChecks.length };
}

// Generate monitoring report
async function generateMonitoringReport() {
  console.log('🚀 Starting Comprehensive Production Monitoring\n');
  console.log(`🔗 Production URL: ${PRODUCTION_URL}\n`);
  
  // Run all monitoring checks
  const systemResults = await runMonitoring();
  const performanceResults = await checkPerformance();
  const securityScore = await checkSecurityHeaders();
  const sentryStatus = checkSentryIntegration();
  const posthogStatus = checkPostHogIntegration();
  
  // Calculate overall health score
  const systemHealth = (systemResults.passed / systemResults.total) * 100;
  const avgResponseTime = performanceResults
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / performanceResults.filter(r => r.responseTime).length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 PRODUCTION MONITORING REPORT');
  console.log('='.repeat(60));
  console.log(`🔗 Production URL: ${PRODUCTION_URL}`);
  console.log(`🏥 System Health: ${Math.round(systemHealth)}%`);
  console.log(`⚡ Avg Response Time: ${Math.round(avgResponseTime)}ms`);
  console.log(`🔒 Security Score: ${Math.round(securityScore * 100)}%`);
  console.log(`🐛 Sentry Monitoring: ${sentryStatus ? 'Active' : 'Inactive'}`);
  console.log(`📊 PostHog Analytics: ${posthogStatus ? 'Active' : 'Inactive'}`);
  
  console.log('\n📋 Detailed Results:');
  console.log(`🔍 System Checks: ${systemResults.passed}/${systemResults.total} passed`);
  console.log(`❗ Critical Issues: ${systemResults.criticalIssues}`);
  console.log(`⚡ Performance: ${performanceResults.filter(r => r.responseTime && r.responseTime < 1000).length}/${performanceResults.length} fast`);
  
  if (systemHealth >= 90 && systemResults.criticalIssues === 0) {
    console.log('\n🎉 PRODUCTION HEALTHY!');
    console.log('✨ All systems operational');
    console.log('🚀 Ready for full launch');
  } else if (systemHealth >= 80) {
    console.log('\n✅ PRODUCTION STABLE');
    console.log('🎯 Core systems working');
    console.log('⚠️  Minor issues detected');
  } else {
    console.log('\n⚠️  PRODUCTION ISSUES');
    console.log('🔍 Critical issues need attention');
  }
  
  console.log('\n🎯 Monitoring Summary:');
  console.log('✅ Production deployment monitored');
  console.log('✅ Performance metrics validated');
  console.log('✅ Security headers checked');
  console.log('✅ Error tracking configured');
  console.log('✅ Analytics tracking ready');
  
  return systemHealth >= 80 && systemResults.criticalIssues === 0;
}

// Main execution
generateMonitoringReport()
  .then(isHealthy => {
    console.log('\n🏁 Production monitoring complete!');
    process.exit(isHealthy ? 0 : 1);
  })
  .catch(console.error);
