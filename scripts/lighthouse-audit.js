const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration for Lighthouse audit
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'first-meaningful-paint',
      'speed-index',
      'interactive',
      'cumulative-layout-shift',
      'total-blocking-time',
      'accessibility',
      'best-practices',
      'seo',
      'performance'
    ],
  },
};

// URLs to audit
const urls = [
  'http://localhost:3001',
  'http://localhost:3001/dashboard/enhanced',
  'http://localhost:3001/slack/connect',
  'http://localhost:3001/upload',
  'http://localhost:3001/pricing'
];

// Performance thresholds
const thresholds = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 90,
  'first-contentful-paint': 2000,
  'largest-contentful-paint': 2500,
  'cumulative-layout-shift': 0.1,
  'total-blocking-time': 300
};

async function runLighthouseAudit(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  try {
    const runnerResult = await lighthouse(url, {
      port: chrome.port,
      disableDeviceEmulation: false,
      emulatedFormFactor: 'desktop'
    }, config);

    const { lhr } = runnerResult;
    
    return {
      url,
      scores: {
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        'best-practices': Math.round(lhr.categories['best-practices'].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100)
      },
      metrics: {
        'first-contentful-paint': lhr.audits['first-contentful-paint'].numericValue,
        'largest-contentful-paint': lhr.audits['largest-contentful-paint'].numericValue,
        'cumulative-layout-shift': lhr.audits['cumulative-layout-shift'].numericValue,
        'total-blocking-time': lhr.audits['total-blocking-time'].numericValue,
        'speed-index': lhr.audits['speed-index'].numericValue,
        'interactive': lhr.audits['interactive'].numericValue
      },
      opportunities: lhr.audits['unused-javascript'] ? {
        'unused-javascript': lhr.audits['unused-javascript'].details?.items?.length || 0,
        'unused-css-rules': lhr.audits['unused-css-rules'].details?.items?.length || 0,
        'render-blocking-resources': lhr.audits['render-blocking-resources'].details?.items?.length || 0
      } : {}
    };
  } finally {
    await chrome.kill();
  }
}

function checkThresholds(results) {
  const issues = [];
  
  results.forEach(result => {
    // Check score thresholds
    Object.entries(result.scores).forEach(([category, score]) => {
      if (thresholds[category] && score < thresholds[category]) {
        issues.push({
          url: result.url,
          type: 'score',
          category,
          actual: score,
          expected: thresholds[category],
          severity: score < thresholds[category] - 10 ? 'high' : 'medium'
        });
      }
    });
    
    // Check metric thresholds
    Object.entries(result.metrics).forEach(([metric, value]) => {
      if (thresholds[metric] && value > thresholds[metric]) {
        issues.push({
          url: result.url,
          type: 'metric',
          metric,
          actual: Math.round(value),
          expected: thresholds[metric],
          severity: value > thresholds[metric] * 1.5 ? 'high' : 'medium'
        });
      }
    });
  });
  
  return issues;
}

function generateReport(results, issues) {
  const timestamp = new Date().toISOString();
  
  const report = {
    timestamp,
    summary: {
      totalUrls: results.length,
      averageScores: {
        performance: Math.round(results.reduce((sum, r) => sum + r.scores.performance, 0) / results.length),
        accessibility: Math.round(results.reduce((sum, r) => sum + r.scores.accessibility, 0) / results.length),
        'best-practices': Math.round(results.reduce((sum, r) => sum + r.scores['best-practices'], 0) / results.length),
        seo: Math.round(results.reduce((sum, r) => sum + r.scores.seo, 0) / results.length)
      },
      issuesCount: {
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        total: issues.length
      }
    },
    results,
    issues,
    recommendations: generateRecommendations(results, issues)
  };
  
  return report;
}

function generateRecommendations(results, issues) {
  const recommendations = [];
  
  // Performance recommendations
  const performanceIssues = issues.filter(i => i.category === 'performance' || i.metric?.includes('paint'));
  if (performanceIssues.length > 0) {
    recommendations.push({
      category: 'Performance',
      priority: 'high',
      suggestions: [
        'Optimize images with next/image component',
        'Implement code splitting for large components',
        'Use dynamic imports for non-critical features',
        'Minimize JavaScript bundle size',
        'Enable compression (gzip/brotli)'
      ]
    });
  }
  
  // Accessibility recommendations
  const accessibilityIssues = issues.filter(i => i.category === 'accessibility');
  if (accessibilityIssues.length > 0) {
    recommendations.push({
      category: 'Accessibility',
      priority: 'high',
      suggestions: [
        'Add alt text to all images',
        'Ensure proper heading hierarchy',
        'Improve color contrast ratios',
        'Add ARIA labels to interactive elements',
        'Test keyboard navigation'
      ]
    });
  }
  
  // SEO recommendations
  const seoIssues = issues.filter(i => i.category === 'seo');
  if (seoIssues.length > 0) {
    recommendations.push({
      category: 'SEO',
      priority: 'medium',
      suggestions: [
        'Add meta descriptions to all pages',
        'Optimize page titles',
        'Implement structured data',
        'Improve internal linking',
        'Add robots.txt and sitemap'
      ]
    });
  }
  
  return recommendations;
}

async function main() {
  console.log('🔍 Starting Lighthouse audit...');
  console.log(`📊 Auditing ${urls.length} URLs`);
  
  const results = [];
  
  for (const url of urls) {
    console.log(`\n🌐 Auditing: ${url}`);
    try {
      const result = await runLighthouseAudit(url);
      results.push(result);
      
      // Log immediate results
      console.log(`✅ Performance: ${result.scores.performance}/100`);
      console.log(`♿ Accessibility: ${result.scores.accessibility}/100`);
      console.log(`🛡️ Best Practices: ${result.scores['best-practices']}/100`);
      console.log(`🔍 SEO: ${result.scores.seo}/100`);
    } catch (error) {
      console.error(`❌ Failed to audit ${url}:`, error.message);
    }
  }
  
  // Check thresholds and generate report
  const issues = checkThresholds(results);
  const report = generateReport(results, issues);
  
  // Save report
  const reportPath = path.join(__dirname, '..', 'lighthouse-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  // Console summary
  console.log('\n📋 AUDIT SUMMARY');
  console.log('================');
  console.log(`📊 Average Scores:`);
  console.log(`   Performance: ${report.summary.averageScores.performance}/100`);
  console.log(`   Accessibility: ${report.summary.averageScores.accessibility}/100`);
  console.log(`   Best Practices: ${report.summary.averageScores['best-practices']}/100`);
  console.log(`   SEO: ${report.summary.averageScores.seo}/100`);
  
  console.log(`\n🚨 Issues Found: ${report.summary.issuesCount.total}`);
  console.log(`   High Priority: ${report.summary.issuesCount.high}`);
  console.log(`   Medium Priority: ${report.summary.issuesCount.medium}`);
  
  if (issues.length > 0) {
    console.log('\n⚠️ ISSUES DETAILS:');
    issues.forEach(issue => {
      const emoji = issue.severity === 'high' ? '🔴' : '🟡';
      if (issue.type === 'score') {
        console.log(`${emoji} ${issue.url} - ${issue.category}: ${issue.actual}/100 (expected: ${issue.expected}+)`);
      } else {
        console.log(`${emoji} ${issue.url} - ${issue.metric}: ${issue.actual}ms (expected: <${issue.expected}ms)`);
      }
    });
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      console.log(`\n${rec.category} (${rec.priority} priority):`);
      rec.suggestions.forEach(suggestion => {
        console.log(`   • ${suggestion}`);
      });
    });
  }
  
  console.log(`\n📄 Full report saved to: ${reportPath}`);
  
  // Exit with error code if critical issues found
  const criticalIssues = issues.filter(i => i.severity === 'high').length;
  if (criticalIssues > 0) {
    console.log(`\n❌ Audit failed with ${criticalIssues} critical issues`);
    process.exit(1);
  } else {
    console.log('\n✅ Audit passed! All metrics meet thresholds.');
    process.exit(0);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the audit
main().catch(console.error);
