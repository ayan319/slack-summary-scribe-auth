#!/usr/bin/env node

/**
 * Monitoring Setup and Validation Script
 * Configures and tests monitoring systems for production deployment
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

// Configuration
const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'https://your-app.vercel.app';
const SENTRY_DSN = process.env.SENTRY_DSN;
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;

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

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'MonitoringSetup/1.0',
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000
    };
    
    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data,
          headers: res.headers
        });
      });
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testHealthEndpoint() {
  log(colors.cyan, '\n🔍 Testing Health Check Endpoint...');
  
  try {
    const response = await makeRequest(`${DEPLOYMENT_URL}/api/health`);
    
    if (response.statusCode === 200) {
      const healthData = JSON.parse(response.data);
      log(colors.green, '✅ Health endpoint is working');
      log(colors.blue, `   Status: ${healthData.status}`);
      log(colors.blue, `   Timestamp: ${healthData.timestamp}`);
      log(colors.blue, `   Environment: ${healthData.environment || 'Unknown'}`);
      
      if (healthData.services) {
        log(colors.blue, '   Services:');
        Object.entries(healthData.services).forEach(([service, status]) => {
          const icon = status === 'healthy' ? '✅' : '❌';
          log(colors.blue, `     ${icon} ${service}: ${status}`);
        });
      }
      
      return { success: true, data: healthData };
    } else {
      log(colors.red, `❌ Health endpoint returned ${response.statusCode}`);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    log(colors.red, `❌ Health endpoint test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSentryIntegration() {
  log(colors.cyan, '\n🚨 Testing Sentry Integration...');
  
  if (!SENTRY_DSN) {
    log(colors.yellow, '⚠️  SENTRY_DSN not configured - skipping Sentry test');
    return { success: false, skipped: true };
  }
  
  try {
    // Test Sentry DSN format
    const dsnPattern = /^https:\/\/[a-f0-9]+@[a-z0-9.-]+\.ingest\.sentry\.io\/\d+$/;
    if (!dsnPattern.test(SENTRY_DSN)) {
      log(colors.red, '❌ Invalid Sentry DSN format');
      return { success: false, error: 'Invalid DSN format' };
    }
    
    log(colors.green, '✅ Sentry DSN format is valid');
    
    // Test error endpoint (if exists)
    try {
      const response = await makeRequest(`${DEPLOYMENT_URL}/api/test-sentry`);
      if (response.statusCode === 200) {
        log(colors.green, '✅ Sentry test endpoint is working');
      }
    } catch (error) {
      log(colors.yellow, '⚠️  Sentry test endpoint not available (optional)');
    }
    
    return { success: true };
  } catch (error) {
    log(colors.red, `❌ Sentry integration test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSlackAlerts() {
  log(colors.cyan, '\n💬 Testing Slack Alert Integration...');
  
  if (!SLACK_WEBHOOK) {
    log(colors.yellow, '⚠️  SLACK_WEBHOOK_URL not configured - skipping Slack test');
    return { success: false, skipped: true };
  }
  
  try {
    const testMessage = {
      text: '🧪 Test alert from Slack Summary Scribe monitoring setup',
      channel: '#alerts',
      username: 'Monitoring Bot',
      icon_emoji: ':robot_face:'
    };
    
    const response = await makeRequest(SLACK_WEBHOOK, {
      method: 'POST',
      body: JSON.stringify(testMessage)
    });
    
    if (response.statusCode === 200) {
      log(colors.green, '✅ Slack webhook is working');
      log(colors.blue, '   Test message sent to Slack channel');
      return { success: true };
    } else {
      log(colors.red, `❌ Slack webhook returned ${response.statusCode}`);
      return { success: false, error: `HTTP ${response.statusCode}` };
    }
  } catch (error) {
    log(colors.red, `❌ Slack alert test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function validateEnvironmentVariables() {
  log(colors.cyan, '\n🔧 Validating Monitoring Environment Variables...');
  
  const requiredVars = {
    'DEPLOYMENT_URL': DEPLOYMENT_URL,
    'SENTRY_DSN': SENTRY_DSN,
    'SLACK_WEBHOOK_URL': SLACK_WEBHOOK
  };
  
  const optionalVars = {
    'VERCEL_URL': process.env.VERCEL_URL,
    'NEXT_PUBLIC_VERCEL_ENV': process.env.NEXT_PUBLIC_VERCEL_ENV
  };
  
  let allValid = true;
  
  log(colors.blue, 'Required Variables:');
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (value) {
      log(colors.green, `  ✅ ${key}: Configured`);
    } else {
      log(colors.red, `  ❌ ${key}: Missing`);
      allValid = false;
    }
  });
  
  log(colors.blue, '\nOptional Variables:');
  Object.entries(optionalVars).forEach(([key, value]) => {
    if (value) {
      log(colors.green, `  ✅ ${key}: ${value}`);
    } else {
      log(colors.yellow, `  ⚠️  ${key}: Not set`);
    }
  });
  
  return { success: allValid };
}

async function generateMonitoringConfig() {
  log(colors.cyan, '\n📝 Generating Monitoring Configuration...');
  
  const config = {
    deployment: {
      url: DEPLOYMENT_URL,
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'production',
      timestamp: new Date().toISOString()
    },
    monitoring: {
      sentry: {
        enabled: !!SENTRY_DSN,
        dsn: SENTRY_DSN ? 'configured' : 'not configured'
      },
      slack: {
        enabled: !!SLACK_WEBHOOK,
        webhook: SLACK_WEBHOOK ? 'configured' : 'not configured'
      },
      vercel: {
        analytics: 'manual setup required',
        functions: 'automatic'
      }
    },
    healthChecks: {
      internal: `${DEPLOYMENT_URL}/api/health`,
      external: 'setup required'
    },
    alerts: {
      critical: ['service_down', 'high_error_rate', 'database_issues'],
      warning: ['slow_response', 'high_memory', 'api_limits'],
      channels: ['slack', 'email']
    }
  };
  
  const configPath = path.join(__dirname, 'monitoring-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  log(colors.green, `✅ Monitoring configuration saved to: ${configPath}`);
  return { success: true, configPath };
}

async function generateUptimeMonitoringScript() {
  log(colors.cyan, '\n⏰ Generating Uptime Monitoring Script...');
  
  const script = `#!/bin/bash
# Uptime monitoring script for ${DEPLOYMENT_URL}
# Run this script every 5 minutes via cron

URL="${DEPLOYMENT_URL}/api/health"
TIMEOUT=10
SLACK_WEBHOOK="${SLACK_WEBHOOK || 'YOUR_SLACK_WEBHOOK_URL'}"

# Function to send Slack alert
send_alert() {
    local message="$1"
    local severity="$2"
    
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST "$SLACK_WEBHOOK" \\
            -H "Content-Type: application/json" \\
            -d "{
                \\"text\\": \\"🚨 $severity: $message\\",
                \\"channel\\": \\"#alerts\\",
                \\"username\\": \\"Uptime Monitor\\"
            }"
    fi
}

# Check health endpoint
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL")
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

if [ "$RESPONSE" -eq 200 ]; then
    echo "[$TIMESTAMP] ✅ Health check passed (HTTP $RESPONSE)"
else
    echo "[$TIMESTAMP] ❌ Health check failed (HTTP $RESPONSE)"
    send_alert "Health check failed for ${DEPLOYMENT_URL} (HTTP $RESPONSE)" "CRITICAL"
fi

# Check response time
START_TIME=$(date +%s%N)
curl -s "$URL" > /dev/null
END_TIME=$(date +%s%N)
RESPONSE_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

if [ $RESPONSE_TIME -gt 5000 ]; then
    echo "[$TIMESTAMP] ⚠️  Slow response time: ${RESPONSE_TIME}ms"
    send_alert "Slow response time: ${RESPONSE_TIME}ms for ${DEPLOYMENT_URL}" "WARNING"
else
    echo "[$TIMESTAMP] ✅ Response time OK: ${RESPONSE_TIME}ms"
fi
`;
  
  const scriptPath = path.join(__dirname, 'uptime-monitor.sh');
  fs.writeFileSync(scriptPath, script);
  fs.chmodSync(scriptPath, '755');
  
  log(colors.green, `✅ Uptime monitoring script saved to: ${scriptPath}`);
  log(colors.blue, '   To use: Add to crontab with: */5 * * * * /path/to/uptime-monitor.sh');
  
  return { success: true, scriptPath };
}

async function runMonitoringSetup() {
  log(colors.blue + colors.bold, '\n📊 Setting Up Production Monitoring\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    overall: { success: true, warnings: 0, errors: 0 }
  };
  
  // Run all monitoring tests
  const tests = [
    { name: 'Environment Variables', test: validateEnvironmentVariables },
    { name: 'Health Endpoint', test: testHealthEndpoint },
    { name: 'Sentry Integration', test: testSentryIntegration },
    { name: 'Slack Alerts', test: testSlackAlerts }
  ];
  
  for (const { name, test } of tests) {
    const result = await test();
    result.name = name;
    results.tests.push(result);
    
    if (!result.success && !result.skipped) {
      results.overall.errors++;
      results.overall.success = false;
    } else if (result.skipped) {
      results.overall.warnings++;
    }
  }
  
  // Generate configuration files
  await generateMonitoringConfig();
  await generateUptimeMonitoringScript();
  
  // Summary
  log(colors.blue + colors.bold, '\n📋 Monitoring Setup Summary:');
  log(colors.blue, `   Tests Run: ${results.tests.length}`);
  log(colors.green, `   Passed: ${results.tests.filter(t => t.success).length}`);
  log(colors.yellow, `   Skipped: ${results.tests.filter(t => t.skipped).length}`);
  log(colors.red, `   Failed: ${results.overall.errors}`);
  
  // Overall status
  if (results.overall.success) {
    if (results.overall.warnings > 0) {
      log(colors.yellow + colors.bold, '\n⚠️  MONITORING SETUP COMPLETED WITH WARNINGS');
      log(colors.yellow, '   Some optional monitoring features are not configured.');
    } else {
      log(colors.green + colors.bold, '\n✅ MONITORING SETUP COMPLETED SUCCESSFULLY');
      log(colors.green, '   All monitoring systems are ready for production!');
    }
  } else {
    log(colors.red + colors.bold, '\n❌ MONITORING SETUP FAILED');
    log(colors.red, '   Fix the errors above before deploying to production.');
    process.exit(1);
  }
  
  // Next steps
  log(colors.blue, '\n🎯 Next Steps:');
  log(colors.blue, '   1. Configure external uptime monitoring (UptimeRobot, Pingdom)');
  log(colors.blue, '   2. Set up Vercel Analytics in dashboard');
  log(colors.blue, '   3. Configure Supabase log monitoring');
  log(colors.blue, '   4. Test alert channels with real incidents');
  log(colors.blue, '   5. Create monitoring dashboard');
  
  console.log('');
}

// CLI handling
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node setup-monitoring.js [options]

Options:
  --url <url>     Deployment URL to monitor
  --help, -h      Show this help message

Environment Variables:
  DEPLOYMENT_URL     Deployment URL to monitor
  SENTRY_DSN         Sentry error tracking DSN
  SLACK_WEBHOOK_URL  Slack webhook for alerts

Examples:
  node setup-monitoring.js --url https://my-app.vercel.app
  DEPLOYMENT_URL=https://my-app.vercel.app node setup-monitoring.js
`);
  process.exit(0);
}

// Parse URL from command line
const urlIndex = process.argv.indexOf('--url');
if (urlIndex !== -1 && process.argv[urlIndex + 1]) {
  process.env.DEPLOYMENT_URL = process.argv[urlIndex + 1];
}

// Run monitoring setup
runMonitoringSetup().catch(error => {
  log(colors.red, `\n❌ Monitoring setup failed: ${error.message}`);
  process.exit(1);
});
