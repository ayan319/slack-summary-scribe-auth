#!/usr/bin/env node

/**
 * QA Test Runner for Slack Summary Scribe
 * Runs comprehensive end-to-end tests with detailed reporting
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface QATestResult {
  scenario: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
  details?: any;
}

interface QAReport {
  timestamp: string;
  environment: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: QATestResult[];
  performance: {
    pageLoadTimes: Record<string, number>;
    apiResponseTimes: Record<string, number>;
    databaseLatency: number;
  };
  coverage: {
    scenarios: number;
    edgeCases: number;
    errorHandling: number;
  };
}

class QATestRunner {
  private results: QATestResult[] = [];
  private startTime: number = 0;
  private environment: string;

  constructor(environment: string = 'test') {
    this.environment = environment;
  }

  async runAllTests(): Promise<QAReport> {
    console.log('🚀 Starting Comprehensive QA Test Suite...\n');
    this.startTime = Date.now();

    // Test categories
    const testCategories = [
      'Core Functionality',
      'Slack Integration', 
      'Export Functionality',
      'Billing & Usage',
      'User Experience',
      'Performance & Edge Cases',
      'Security & Data Integrity',
    ];

    for (const category of testCategories) {
      console.log(`\n📋 Testing Category: ${category}`);
      await this.runCategoryTests(category);
    }

    return this.generateReport();
  }

  private async runCategoryTests(category: string): Promise<void> {
    try {
      // Run Playwright tests for this category
      const command = `npx playwright test tests/e2e/qa-scenarios.test.ts --grep "${category}" --reporter=json`;
      const output = execSync(command, { encoding: 'utf8', cwd: process.cwd() });
      
      const testResults = JSON.parse(output);
      this.processPlaywrightResults(testResults, category);
      
    } catch (error) {
      console.error(`❌ Error running tests for ${category}:`, error);
      this.results.push({
        scenario: `${category} - Test Execution`,
        status: 'FAIL',
        duration: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private processPlaywrightResults(testResults: any, category: string): void {
    if (testResults.suites) {
      testResults.suites.forEach((suite: any) => {
        suite.specs?.forEach((spec: any) => {
          spec.tests?.forEach((test: any) => {
            this.results.push({
              scenario: `${category} - ${test.title}`,
              status: test.outcome === 'expected' ? 'PASS' : 'FAIL',
              duration: test.results?.[0]?.duration || 0,
              error: test.results?.[0]?.error?.message,
              details: test.results?.[0],
            });
          });
        });
      });
    }
  }

  private async measurePerformance(): Promise<QAReport['performance']> {
    console.log('\n⚡ Measuring Performance Metrics...');
    
    const performance = {
      pageLoadTimes: {} as Record<string, number>,
      apiResponseTimes: {} as Record<string, number>,
      databaseLatency: 0,
    };

    // Measure page load times
    const pages = ['/', '/dashboard', '/history', '/settings', '/upgrade'];
    for (const page of pages) {
      try {
        const startTime = Date.now();
        const response = await fetch(`http://localhost:3000${page}`);
        const loadTime = Date.now() - startTime;
        performance.pageLoadTimes[page] = loadTime;
        console.log(`📄 ${page}: ${loadTime}ms`);
      } catch (error) {
        console.error(`❌ Failed to measure ${page}:`, error);
        performance.pageLoadTimes[page] = -1;
      }
    }

    // Measure API response times
    const apis = ['/api/summaries', '/api/usage', '/api/teams'];
    for (const api of apis) {
      try {
        const startTime = Date.now();
        await fetch(`http://localhost:3000${api}`);
        const responseTime = Date.now() - startTime;
        performance.apiResponseTimes[api] = responseTime;
        console.log(`🔌 ${api}: ${responseTime}ms`);
      } catch (error) {
        console.error(`❌ Failed to measure ${api}:`, error);
        performance.apiResponseTimes[api] = -1;
      }
    }

    // Measure database latency (mock for now)
    performance.databaseLatency = Math.random() * 50 + 10; // 10-60ms

    return performance;
  }

  private generateReport(): QAReport {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    const report: QAReport = {
      timestamp: new Date().toISOString(),
      environment: this.environment,
      totalTests: this.results.length,
      passed,
      failed,
      skipped,
      duration,
      results: this.results,
      performance: {
        pageLoadTimes: {},
        apiResponseTimes: {},
        databaseLatency: 0,
      },
      coverage: {
        scenarios: this.results.length,
        edgeCases: this.results.filter(r => r.scenario.includes('edge')).length,
        errorHandling: this.results.filter(r => r.scenario.includes('error') || r.scenario.includes('fail')).length,
      },
    };

    return report;
  }

  async saveReport(report: QAReport): Promise<void> {
    const reportsDir = path.join(process.cwd(), 'tests', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `qa-report-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`\n📊 QA Report saved to: ${filepath}`);

    // Also save a summary
    this.printSummary(report);
    this.saveHtmlReport(report, reportsDir);
  }

  private printSummary(report: QAReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 QA TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`🌍 Environment: ${report.environment}`);
    console.log(`⏱️  Duration: ${(report.duration / 1000).toFixed(2)}s`);
    console.log(`📊 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.passed} (${((report.passed / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${report.failed} (${((report.failed / report.totalTests) * 100).toFixed(1)}%)`);
    console.log(`⏭️  Skipped: ${report.skipped} (${((report.skipped / report.totalTests) * 100).toFixed(1)}%)`);
    
    console.log('\n📈 COVERAGE:');
    console.log(`🎯 Scenarios Covered: ${report.coverage.scenarios}`);
    console.log(`🔍 Edge Cases: ${report.coverage.edgeCases}`);
    console.log(`🛡️  Error Handling: ${report.coverage.errorHandling}`);

    if (report.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      report.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`   • ${result.scenario}: ${result.error || 'Unknown error'}`);
        });
    }

    console.log('\n' + '='.repeat(60));
    
    if (report.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Ready for production deployment.');
    } else {
      console.log('⚠️  Some tests failed. Please review and fix before deployment.');
    }
  }

  private saveHtmlReport(report: QAReport, reportsDir: string): void {
    const htmlContent = this.generateHtmlReport(report);
    const htmlFilename = `qa-report-${new Date().toISOString().split('T')[0]}-${Date.now()}.html`;
    const htmlFilepath = path.join(reportsDir, htmlFilename);
    
    fs.writeFileSync(htmlFilepath, htmlContent);
    console.log(`📄 HTML Report saved to: ${htmlFilepath}`);
  }

  private generateHtmlReport(report: QAReport): string {
    const passRate = ((report.passed / report.totalTests) * 100).toFixed(1);
    const statusColor = report.failed === 0 ? '#10B981' : report.failed < 5 ? '#F59E0B' : '#EF4444';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QA Test Report - Slack Summary Scribe</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .title { font-size: 28px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
        .subtitle { color: #6b7280; font-size: 16px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-value { font-size: 32px; font-weight: bold; color: ${statusColor}; }
        .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
        .results { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
        .results-header { background: #f9fafb; padding: 20px; border-bottom: 1px solid #e5e7eb; font-weight: 600; }
        .result-item { padding: 15px 20px; border-bottom: 1px solid #f3f4f6; display: flex; justify-content: between; align-items: center; }
        .result-item:last-child { border-bottom: none; }
        .status-pass { color: #10B981; font-weight: 600; }
        .status-fail { color: #EF4444; font-weight: 600; }
        .status-skip { color: #6B7280; font-weight: 600; }
        .duration { color: #6b7280; font-size: 14px; }
        .error { color: #EF4444; font-size: 12px; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">🎯 QA Test Report</div>
            <div class="subtitle">Slack Summary Scribe - ${report.timestamp}</div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${report.totalTests}</div>
                <div class="stat-label">Total Tests</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${passRate}%</div>
                <div class="stat-label">Pass Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(report.duration / 1000).toFixed(1)}s</div>
                <div class="stat-label">Duration</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${report.coverage.scenarios}</div>
                <div class="stat-label">Scenarios Covered</div>
            </div>
        </div>
        
        <div class="results">
            <div class="results-header">Test Results</div>
            ${report.results.map(result => `
                <div class="result-item">
                    <div style="flex: 1;">
                        <div>${result.scenario}</div>
                        ${result.error ? `<div class="error">${result.error}</div>` : ''}
                    </div>
                    <div style="text-align: right;">
                        <div class="status-${result.status.toLowerCase()}">${result.status}</div>
                        <div class="duration">${result.duration}ms</div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  }
}

// CLI execution
if (require.main === module) {
  const environment = process.argv[2] || 'test';
  const runner = new QATestRunner(environment);
  
  runner.runAllTests()
    .then(report => runner.saveReport(report))
    .catch(error => {
      console.error('❌ QA Test Runner failed:', error);
      process.exit(1);
    });
}

export { QATestRunner };
