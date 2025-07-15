#!/usr/bin/env node

/**
 * Performance Audit Script for Slack Summary Scribe
 * Tests key performance metrics and Core Web Vitals
 */

const https = require('https');
const fs = require('fs');

// Configuration
const BASE_URL = 'https://slack-summary-scribe.vercel.app';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const request = https.get(url, options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: data,
          responseTime: endTime - startTime,
          size: Buffer.byteLength(data, 'utf8')
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

async function testPagePerformance(path, name) {
  try {
    log(`🔍 Testing ${name} (${path})`, 'blue');
    const response = await makeRequest(`${BASE_URL}${path}`);
    
    const metrics = {
      responseTime: response.responseTime,
      size: response.size,
      statusCode: response.statusCode
    };
    
    // Performance scoring
    let score = 100;
    let issues = [];
    
    // Response time scoring
    if (metrics.responseTime > 3000) {
      score -= 30;
      issues.push(`Slow response time: ${metrics.responseTime}ms`);
    } else if (metrics.responseTime > 1500) {
      score -= 15;
      issues.push(`Moderate response time: ${metrics.responseTime}ms`);
    }
    
    // Size scoring
    if (metrics.size > 1000000) { // 1MB
      score -= 20;
      issues.push(`Large page size: ${(metrics.size / 1024).toFixed(1)}KB`);
    } else if (metrics.size > 500000) { // 500KB
      score -= 10;
      issues.push(`Moderate page size: ${(metrics.size / 1024).toFixed(1)}KB`);
    }
    
    // Status code check
    if (metrics.statusCode !== 200) {
      score -= 50;
      issues.push(`Non-200 status code: ${metrics.statusCode}`);
    }
    
    // Display results
    const scoreColor = score >= 90 ? 'green' : score >= 70 ? 'yellow' : 'red';
    log(`  📊 Performance Score: ${score}/100`, scoreColor);
    log(`  ⏱️  Response Time: ${metrics.responseTime}ms`, 
        metrics.responseTime < 1000 ? 'green' : metrics.responseTime < 2000 ? 'yellow' : 'red');
    log(`  📦 Page Size: ${(metrics.size / 1024).toFixed(1)}KB`, 
        metrics.size < 200000 ? 'green' : metrics.size < 500000 ? 'yellow' : 'red');
    log(`  🔗 Status: ${metrics.statusCode}`, 
        metrics.statusCode === 200 ? 'green' : 'red');
    
    if (issues.length > 0) {
      log(`  ⚠️  Issues:`, 'yellow');
      issues.forEach(issue => log(`    • ${issue}`, 'yellow'));
    }
    
    log('', 'reset');
    
    return { name, score, metrics, issues };
  } catch (error) {
    log(`❌ ${name}: ${error.message}`, 'red');
    return { name, score: 0, error: error.message };
  }
}

async function testCoreWebVitals() {
  log('🎯 Core Web Vitals Assessment', 'bold');
  log('Note: This is a basic server-side assessment. For full CWV metrics, use browser tools.', 'cyan');
  log('', 'reset');
  
  const pages = [
    { path: '/', name: 'Landing Page' },
    { path: '/login', name: 'Login Page' },
    { path: '/signup', name: 'Signup Page' },
    { path: '/pricing', name: 'Pricing Page' },
    { path: '/dashboard', name: 'Dashboard Page' }
  ];
  
  const results = [];
  
  for (const page of pages) {
    const result = await testPagePerformance(page.path, page.name);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
  
  return results;
}

async function testAPIPerformance() {
  log('🔌 API Performance Testing', 'bold');
  
  const apiEndpoints = [
    { path: '/api/health', name: 'Health Check' },
    { path: '/api/healthcheck', name: 'System Health' },
    { path: '/api', name: 'API Info' }
  ];
  
  const results = [];
  
  for (const endpoint of apiEndpoints) {
    const result = await testPagePerformance(endpoint.path, endpoint.name);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  return results;
}

async function generatePerformanceReport(pageResults, apiResults) {
  log('📊 PERFORMANCE AUDIT REPORT', 'bold');
  log('═══════════════════════════════════════', 'cyan');
  
  // Calculate overall scores
  const allResults = [...pageResults, ...apiResults].filter(r => !r.error);
  const averageScore = allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length;
  const totalTests = pageResults.length + apiResults.length;
  const passedTests = allResults.length;
  
  // Page Performance Summary
  log('\n📄 PAGE PERFORMANCE:', 'bold');
  pageResults.forEach(result => {
    if (result.error) {
      log(`❌ ${result.name}: Error - ${result.error}`, 'red');
    } else {
      const scoreColor = result.score >= 90 ? 'green' : result.score >= 70 ? 'yellow' : 'red';
      log(`${result.score >= 90 ? '✅' : result.score >= 70 ? '⚠️' : '❌'} ${result.name}: ${result.score}/100`, scoreColor);
    }
  });
  
  // API Performance Summary
  log('\n🔌 API PERFORMANCE:', 'bold');
  apiResults.forEach(result => {
    if (result.error) {
      log(`❌ ${result.name}: Error - ${result.error}`, 'red');
    } else {
      const scoreColor = result.score >= 90 ? 'green' : result.score >= 70 ? 'yellow' : 'red';
      log(`${result.score >= 90 ? '✅' : result.score >= 70 ? '⚠️' : '❌'} ${result.name}: ${result.score}/100`, scoreColor);
    }
  });
  
  // Overall Assessment
  log('\n🎯 OVERALL ASSESSMENT:', 'bold');
  log(`📊 Average Performance Score: ${averageScore.toFixed(1)}/100`, 
      averageScore >= 90 ? 'green' : averageScore >= 70 ? 'yellow' : 'red');
  log(`✅ Tests Passed: ${passedTests}/${totalTests}`, 
      passedTests === totalTests ? 'green' : 'yellow');
  
  // Recommendations
  log('\n💡 RECOMMENDATIONS:', 'bold');
  const allIssues = allResults.flatMap(r => r.issues || []);
  const uniqueIssues = [...new Set(allIssues)];
  
  if (uniqueIssues.length === 0) {
    log('🎉 No performance issues detected! Your site is well optimized.', 'green');
  } else {
    uniqueIssues.forEach(issue => {
      log(`• ${issue}`, 'yellow');
    });
  }
  
  // Core Web Vitals Guidelines
  log('\n📏 CORE WEB VITALS TARGETS:', 'bold');
  log('• LCP (Largest Contentful Paint): < 2.5s', 'cyan');
  log('• FID (First Input Delay): < 100ms', 'cyan');
  log('• CLS (Cumulative Layout Shift): < 0.1', 'cyan');
  log('• TTFB (Time to First Byte): < 600ms', 'cyan');
  
  log('\n🔧 OPTIMIZATION TIPS:', 'bold');
  log('• Use next/image for optimized images', 'cyan');
  log('• Implement proper caching headers', 'cyan');
  log('• Minimize JavaScript bundle size', 'cyan');
  log('• Use CDN for static assets', 'cyan');
  log('• Implement lazy loading for non-critical content', 'cyan');
  
  return {
    averageScore,
    passedTests,
    totalTests,
    pageResults,
    apiResults
  };
}

async function runPerformanceAudit() {
  log('🚀 STARTING PERFORMANCE AUDIT', 'bold');
  log(`🌐 Testing URL: ${BASE_URL}`, 'cyan');
  log('', 'reset');
  
  try {
    const pageResults = await testCoreWebVitals();
    const apiResults = await testAPIPerformance();
    const report = await generatePerformanceReport(pageResults, apiResults);
    
    // Final verdict
    if (report.averageScore >= 90 && report.passedTests === report.totalTests) {
      log('\n🎉 PERFORMANCE AUDIT: EXCELLENT!', 'green');
      log('Your application is ready for production launch! 🚀', 'green');
    } else if (report.averageScore >= 70) {
      log('\n⚠️ PERFORMANCE AUDIT: GOOD', 'yellow');
      log('Consider addressing the recommendations above for optimal performance.', 'yellow');
    } else {
      log('\n❌ PERFORMANCE AUDIT: NEEDS IMPROVEMENT', 'red');
      log('Please address the performance issues before launch.', 'red');
    }
    
    return report.averageScore >= 70;
  } catch (error) {
    log(`❌ Performance audit failed: ${error.message}`, 'red');
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  runPerformanceAudit()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Performance audit failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runPerformanceAudit };
