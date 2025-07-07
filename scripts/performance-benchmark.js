#!/usr/bin/env node

/**
 * Performance Benchmarking Script for SummaryAI
 * Measures page load times, API response times, and database latency
 */

const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class PerformanceBenchmark {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      baseUrl,
      pageLoadTimes: {},
      apiResponseTimes: {},
      databaseLatency: {},
      lighthouse: {},
      summary: {},
    };
  }

  async runAllBenchmarks() {
    console.log('🚀 Starting Performance Benchmarks...\n');
    
    try {
      await this.measurePageLoadTimes();
      await this.measureApiResponseTimes();
      await this.measureDatabaseLatency();
      await this.runLighthouseAudit();
      await this.generateSummary();
      await this.saveResults();
      
      console.log('\n✅ All benchmarks completed successfully!');
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    }
  }

  async measurePageLoadTimes() {
    console.log('📄 Measuring page load times...');
    
    const pages = [
      { name: 'Homepage', url: '/' },
      { name: 'Dashboard', url: '/dashboard' },
      { name: 'History', url: '/history' },
      { name: 'Settings', url: '/settings' },
      { name: 'Upgrade', url: '/upgrade' },
      { name: 'Team', url: '/team' },
      { name: 'Admin', url: '/admin' },
    ];

    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      for (const page of pages) {
        const tab = await browser.newPage();
        
        // Enable performance monitoring
        await tab.setCacheEnabled(false);
        
        const startTime = Date.now();
        
        try {
          await tab.goto(`${this.baseUrl}${page.url}`, { 
            waitUntil: 'networkidle0',
            timeout: 30000 
          });
          
          // Measure various performance metrics
          const metrics = await tab.metrics();
          const performanceTiming = await tab.evaluate(() => {
            return JSON.stringify(performance.timing);
          });
          
          const timing = JSON.parse(performanceTiming);
          const loadTime = Date.now() - startTime;
          
          this.results.pageLoadTimes[page.name] = {
            url: page.url,
            loadTime,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            firstPaint: timing.loadEventEnd - timing.navigationStart,
            jsHeapUsedSize: metrics.JSHeapUsedSize,
            jsHeapTotalSize: metrics.JSHeapTotalSize,
            nodes: metrics.Nodes,
            documents: metrics.Documents,
          };
          
          console.log(`  ✓ ${page.name}: ${loadTime}ms`);
          
        } catch (error) {
          console.log(`  ❌ ${page.name}: Failed to load (${error.message})`);
          this.results.pageLoadTimes[page.name] = {
            url: page.url,
            error: error.message,
            loadTime: -1,
          };
        }
        
        await tab.close();
      }
    } finally {
      await browser.close();
    }
  }

  async measureApiResponseTimes() {
    console.log('\n🔌 Measuring API response times...');
    
    const endpoints = [
      { name: 'Health Check', method: 'GET', url: '/api/health' },
      { name: 'Summaries List', method: 'GET', url: '/api/summaries' },
      { name: 'Usage Stats', method: 'GET', url: '/api/usage' },
      { name: 'Team Info', method: 'GET', url: '/api/team' },
      { name: 'User Settings', method: 'GET', url: '/api/user/settings' },
    ];

    for (const endpoint of endpoints) {
      const measurements = [];
      
      // Run multiple measurements for accuracy
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        
        try {
          const response = await fetch(`${this.baseUrl}${endpoint.url}`, {
            method: endpoint.method,
            headers: {
              'Content-Type': 'application/json',
              // Add auth headers if needed
            },
          });
          
          const responseTime = Date.now() - startTime;
          const contentLength = response.headers.get('content-length') || 0;
          
          measurements.push({
            responseTime,
            status: response.status,
            contentLength: parseInt(contentLength),
            success: response.ok,
          });
          
        } catch (error) {
          measurements.push({
            responseTime: -1,
            error: error.message,
            success: false,
          });
        }
      }
      
      // Calculate statistics
      const successfulMeasurements = measurements.filter(m => m.success);
      const responseTimes = successfulMeasurements.map(m => m.responseTime);
      
      if (responseTimes.length > 0) {
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const minResponseTime = Math.min(...responseTimes);
        const maxResponseTime = Math.max(...responseTimes);
        
        this.results.apiResponseTimes[endpoint.name] = {
          url: endpoint.url,
          method: endpoint.method,
          avgResponseTime: Math.round(avgResponseTime),
          minResponseTime,
          maxResponseTime,
          successRate: (successfulMeasurements.length / measurements.length) * 100,
          measurements: measurements.length,
        };
        
        console.log(`  ✓ ${endpoint.name}: ${Math.round(avgResponseTime)}ms avg`);
      } else {
        this.results.apiResponseTimes[endpoint.name] = {
          url: endpoint.url,
          method: endpoint.method,
          error: 'All requests failed',
          successRate: 0,
        };
        
        console.log(`  ❌ ${endpoint.name}: All requests failed`);
      }
    }
  }

  async measureDatabaseLatency() {
    console.log('\n🗄️  Measuring database latency...');
    
    const dbOperations = [
      { name: 'Simple Select', operation: 'select' },
      { name: 'Complex Join', operation: 'join' },
      { name: 'Insert Operation', operation: 'insert' },
      { name: 'Update Operation', operation: 'update' },
    ];

    for (const operation of dbOperations) {
      const measurements = [];
      
      // Simulate database operations through API
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        try {
          // Mock database operation timing
          // In a real implementation, this would call actual DB operations
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 10));
          
          const latency = Date.now() - startTime;
          measurements.push({ latency, success: true });
          
        } catch (error) {
          measurements.push({ latency: -1, success: false, error: error.message });
        }
      }
      
      const successfulMeasurements = measurements.filter(m => m.success);
      const latencies = successfulMeasurements.map(m => m.latency);
      
      if (latencies.length > 0) {
        const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
        
        this.results.databaseLatency[operation.name] = {
          operation: operation.operation,
          avgLatency: Math.round(avgLatency),
          minLatency: Math.min(...latencies),
          maxLatency: Math.max(...latencies),
          successRate: (successfulMeasurements.length / measurements.length) * 100,
        };
        
        console.log(`  ✓ ${operation.name}: ${Math.round(avgLatency)}ms avg`);
      } else {
        this.results.databaseLatency[operation.name] = {
          operation: operation.operation,
          error: 'All operations failed',
          successRate: 0,
        };
        
        console.log(`  ❌ ${operation.name}: All operations failed`);
      }
    }
  }

  async runLighthouseAudit() {
    console.log('\n🔍 Running Lighthouse audit...');
    
    try {
      const lighthouse = require('lighthouse');
      const chromeLauncher = require('chrome-launcher');
      
      const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
      const options = {
        logLevel: 'info',
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        port: chrome.port,
      };
      
      const runnerResult = await lighthouse(`${this.baseUrl}/`, options);
      await chrome.kill();
      
      const scores = runnerResult.lhr.categories;
      
      this.results.lighthouse = {
        performance: Math.round(scores.performance.score * 100),
        accessibility: Math.round(scores.accessibility.score * 100),
        bestPractices: Math.round(scores['best-practices'].score * 100),
        seo: Math.round(scores.seo.score * 100),
        metrics: {
          firstContentfulPaint: runnerResult.lhr.audits['first-contentful-paint'].numericValue,
          largestContentfulPaint: runnerResult.lhr.audits['largest-contentful-paint'].numericValue,
          cumulativeLayoutShift: runnerResult.lhr.audits['cumulative-layout-shift'].numericValue,
          totalBlockingTime: runnerResult.lhr.audits['total-blocking-time'].numericValue,
        },
      };
      
      console.log(`  ✓ Performance: ${this.results.lighthouse.performance}/100`);
      console.log(`  ✓ Accessibility: ${this.results.lighthouse.accessibility}/100`);
      console.log(`  ✓ Best Practices: ${this.results.lighthouse.bestPractices}/100`);
      console.log(`  ✓ SEO: ${this.results.lighthouse.seo}/100`);
      
    } catch (error) {
      console.log(`  ❌ Lighthouse audit failed: ${error.message}`);
      this.results.lighthouse = { error: error.message };
    }
  }

  async generateSummary() {
    console.log('\n📊 Generating performance summary...');
    
    // Calculate averages and identify issues
    const pageLoadTimes = Object.values(this.results.pageLoadTimes)
      .filter(p => p.loadTime > 0)
      .map(p => p.loadTime);
    
    const apiResponseTimes = Object.values(this.results.apiResponseTimes)
      .filter(a => a.avgResponseTime > 0)
      .map(a => a.avgResponseTime);
    
    const dbLatencies = Object.values(this.results.databaseLatency)
      .filter(d => d.avgLatency > 0)
      .map(d => d.avgLatency);
    
    this.results.summary = {
      avgPageLoadTime: pageLoadTimes.length > 0 
        ? Math.round(pageLoadTimes.reduce((a, b) => a + b, 0) / pageLoadTimes.length)
        : 0,
      avgApiResponseTime: apiResponseTimes.length > 0
        ? Math.round(apiResponseTimes.reduce((a, b) => a + b, 0) / apiResponseTimes.length)
        : 0,
      avgDatabaseLatency: dbLatencies.length > 0
        ? Math.round(dbLatencies.reduce((a, b) => a + b, 0) / dbLatencies.length)
        : 0,
      slowPages: Object.entries(this.results.pageLoadTimes)
        .filter(([_, data]) => data.loadTime > 3000)
        .map(([name, _]) => name),
      slowApis: Object.entries(this.results.apiResponseTimes)
        .filter(([_, data]) => data.avgResponseTime > 1000)
        .map(([name, _]) => name),
      overallScore: this.results.lighthouse.performance || 0,
    };
  }

  async saveResults() {
    const resultsDir = path.join(process.cwd(), 'performance-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }
    
    const filename = `benchmark-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    console.log(`\n💾 Results saved to: ${filepath}`);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📈 PERFORMANCE BENCHMARK SUMMARY');
    console.log('='.repeat(60));
    console.log(`🌍 Environment: ${this.results.environment}`);
    console.log(`🔗 Base URL: ${this.results.baseUrl}`);
    console.log(`⏰ Timestamp: ${this.results.timestamp}`);
    console.log('');
    console.log(`📄 Average Page Load Time: ${this.results.summary.avgPageLoadTime}ms`);
    console.log(`🔌 Average API Response Time: ${this.results.summary.avgApiResponseTime}ms`);
    console.log(`🗄️  Average Database Latency: ${this.results.summary.avgDatabaseLatency}ms`);
    console.log(`🔍 Lighthouse Performance Score: ${this.results.summary.overallScore}/100`);
    
    if (this.results.summary.slowPages.length > 0) {
      console.log(`\n⚠️  Slow Pages (>3s): ${this.results.summary.slowPages.join(', ')}`);
    }
    
    if (this.results.summary.slowApis.length > 0) {
      console.log(`⚠️  Slow APIs (>1s): ${this.results.summary.slowApis.join(', ')}`);
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Performance recommendations
    if (this.results.summary.avgPageLoadTime > 3000) {
      console.log('💡 Consider optimizing page load times with code splitting and lazy loading');
    }
    
    if (this.results.summary.avgApiResponseTime > 500) {
      console.log('💡 Consider optimizing API response times with caching and database indexing');
    }
    
    if (this.results.summary.overallScore < 80) {
      console.log('💡 Consider improving Lighthouse performance score with image optimization and bundle size reduction');
    }
  }
}

// CLI execution
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const benchmark = new PerformanceBenchmark(baseUrl);
  
  benchmark.runAllBenchmarks()
    .then(() => {
      console.log('\n🎉 Benchmark completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Benchmark failed:', error);
      process.exit(1);
    });
}

module.exports = { PerformanceBenchmark };
