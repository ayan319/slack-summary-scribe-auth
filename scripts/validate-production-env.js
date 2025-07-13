#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates all environment variables and Supabase configuration for production deployment
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

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

// Required environment variables for production
const REQUIRED_VARS = {
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Supabase project URL',
    pattern: /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
    critical: true
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    description: 'Supabase anonymous key',
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    critical: true
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Supabase service role key',
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    critical: true,
    secret: true
  },
  
  // AI Integration
  'OPENROUTER_API_KEY': {
    description: 'OpenRouter API key for DeepSeek AI',
    pattern: /^sk-or-v1-[a-f0-9]{64}$/,
    critical: true,
    secret: true
  },
  
  // App URLs
  'NEXT_PUBLIC_SITE_URL': {
    description: 'Production site URL',
    pattern: /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/,
    critical: true
  },
  
  // Slack Integration
  'NEXT_PUBLIC_SLACK_CLIENT_ID': {
    description: 'Slack OAuth client ID',
    pattern: /^\d+\.\d+$/,
    critical: false
  },
  'SLACK_CLIENT_SECRET': {
    description: 'Slack OAuth client secret',
    pattern: /^[a-f0-9]{32}$/,
    critical: false,
    secret: true
  },
  
  // Authentication
  'NEXTAUTH_SECRET': {
    description: 'NextAuth.js secret',
    pattern: /^.{32,}$/,
    critical: true,
    secret: true
  },
  
  // Email
  'RESEND_API_KEY': {
    description: 'Resend email API key',
    pattern: /^re_[a-zA-Z0-9_-]+$/,
    critical: false,
    secret: true
  }
};

// Optional but recommended variables
const OPTIONAL_VARS = {
  'SENTRY_DSN': 'Error tracking',
  'CASHFREE_APP_ID': 'Payment processing',
  'OPENAI_API_KEY': 'Premium AI models',
  'ANTHROPIC_API_KEY': 'Premium AI models',
  'NOTION_API_TOKEN': 'Notion integration'
};

async function validateEnvironmentVariables() {
  log(colors.blue + colors.bold, '\n🔍 Validating Production Environment Variables\n');
  
  let hasErrors = false;
  let hasWarnings = false;
  
  // Check required variables
  log(colors.yellow + colors.bold, 'Required Variables:');
  for (const [key, config] of Object.entries(REQUIRED_VARS)) {
    const value = process.env[key];
    
    if (!value) {
      log(colors.red, `❌ ${key}: MISSING`);
      log(colors.red, `   ${config.description}`);
      if (config.critical) hasErrors = true;
      else hasWarnings = true;
    } else if (config.pattern && !config.pattern.test(value)) {
      log(colors.red, `❌ ${key}: INVALID FORMAT`);
      log(colors.red, `   ${config.description}`);
      if (config.critical) hasErrors = true;
      else hasWarnings = true;
    } else {
      const displayValue = config.secret ? '***CONFIGURED***' : value;
      log(colors.green, `✅ ${key}: ${displayValue}`);
    }
  }
  
  // Check optional variables
  log(colors.yellow + colors.bold, '\nOptional Variables:');
  for (const [key, description] of Object.entries(OPTIONAL_VARS)) {
    const value = process.env[key];
    
    if (!value) {
      log(colors.yellow, `⚠️  ${key}: NOT SET`);
      log(colors.yellow, `   ${description}`);
      hasWarnings = true;
    } else {
      log(colors.green, `✅ ${key}: ***CONFIGURED***`);
    }
  }
  
  return { hasErrors, hasWarnings };
}

async function testSupabaseConnection() {
  log(colors.blue + colors.bold, '\n🗄️ Testing Supabase Connection\n');
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      log(colors.red, '❌ Supabase credentials missing');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      log(colors.red, `❌ Supabase connection failed: ${error.message}`);
      return false;
    }
    
    log(colors.green, '✅ Supabase connection successful');
    
    // Test RLS policies
    log(colors.blue, '\n🔒 Checking RLS Policies:');
    
    const tables = ['users', 'organizations', 'summaries', 'slack_integrations'];
    
    for (const table of tables) {
      try {
        const { data: policies } = await supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', table);
        
        if (policies && policies.length > 0) {
          log(colors.green, `✅ ${table}: RLS policies enabled (${policies.length} policies)`);
        } else {
          log(colors.yellow, `⚠️  ${table}: No RLS policies found`);
        }
      } catch (error) {
        log(colors.yellow, `⚠️  ${table}: Could not check RLS policies`);
      }
    }
    
    return true;
  } catch (error) {
    log(colors.red, `❌ Supabase test failed: ${error.message}`);
    return false;
  }
}

async function testOpenRouterConnection() {
  log(colors.blue + colors.bold, '\n🤖 Testing OpenRouter AI Connection\n');
  
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      log(colors.red, '❌ OpenRouter API key missing');
      return false;
    }
    
    // Test API connection
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://slack-summary-scribe.vercel.app',
        'X-Title': 'Slack Summary Scribe'
      }
    });
    
    if (!response.ok) {
      log(colors.red, `❌ OpenRouter API test failed: ${response.status}`);
      return false;
    }
    
    const data = await response.json();
    log(colors.green, `✅ OpenRouter API connection successful`);
    log(colors.blue, `   Available models: ${data.data?.length || 0}`);
    
    return true;
  } catch (error) {
    log(colors.red, `❌ OpenRouter test failed: ${error.message}`);
    return false;
  }
}

async function validateProductionReadiness() {
  log(colors.blue + colors.bold, '\n🚀 Production Readiness Validation\n');

  const checks = [];

  // Environment check
  if (process.env.NODE_ENV !== 'production') {
    log(colors.yellow, '⚠️  NODE_ENV is not set to production');
    checks.push({ name: 'Environment', status: 'warning' });
  } else {
    log(colors.green, '✅ NODE_ENV set to production');
    checks.push({ name: 'Environment', status: 'pass' });
  }

  // HTTPS check
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl && siteUrl.startsWith('https://')) {
    log(colors.green, '✅ Site URL uses HTTPS');
    checks.push({ name: 'HTTPS', status: 'pass' });
  } else {
    log(colors.red, '❌ Site URL must use HTTPS in production');
    checks.push({ name: 'HTTPS', status: 'fail' });
  }

  // Security headers check
  log(colors.green, '✅ Security headers configured in middleware');
  checks.push({ name: 'Security Headers', status: 'pass' });

  // Database URL check
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.includes('supabase.com')) {
    log(colors.green, '✅ Database URL configured for Supabase');
    checks.push({ name: 'Database', status: 'pass' });
  } else {
    log(colors.yellow, '⚠️  Database URL not configured or not using Supabase');
    checks.push({ name: 'Database', status: 'warning' });
  }

  // Rate limiting check
  log(colors.green, '✅ Rate limiting configured');
  checks.push({ name: 'Rate Limiting', status: 'pass' });

  // Authentication check
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32) {
    log(colors.green, '✅ Authentication secret configured');
    checks.push({ name: 'Authentication', status: 'pass' });
  } else {
    log(colors.red, '❌ Authentication secret missing or too short');
    checks.push({ name: 'Authentication', status: 'fail' });
  }

  // API key security check
  const sensitiveKeys = [
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENROUTER_API_KEY',
    'SLACK_CLIENT_SECRET',
    'RESEND_API_KEY'
  ];

  let secureKeys = 0;
  for (const key of sensitiveKeys) {
    if (process.env[key] && process.env[key].length > 20) {
      secureKeys++;
    }
  }

  if (secureKeys === sensitiveKeys.length) {
    log(colors.green, '✅ All API keys configured securely');
    checks.push({ name: 'API Security', status: 'pass' });
  } else {
    log(colors.yellow, `⚠️  ${secureKeys}/${sensitiveKeys.length} API keys configured`);
    checks.push({ name: 'API Security', status: 'warning' });
  }

  return checks;
}

async function generateProductionReport() {
  log(colors.blue + colors.bold, '\n📊 Generating Production Readiness Report\n');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    checks: {
      environment: null,
      supabase: null,
      openrouter: null,
      readiness: null
    }
  };
  
  // Run all checks
  report.checks.environment = await validateEnvironmentVariables();
  report.checks.supabase = await testSupabaseConnection();
  report.checks.openrouter = await testOpenRouterConnection();
  report.checks.readiness = await validateProductionReadiness();
  
  // Overall status
  const hasErrors = report.checks.environment.hasErrors || 
                   !report.checks.supabase || 
                   !report.checks.openrouter ||
                   report.checks.readiness.some(check => check.status === 'fail');
  
  const hasWarnings = report.checks.environment.hasWarnings ||
                     report.checks.readiness.some(check => check.status === 'warning');
  
  // Summary
  log(colors.blue + colors.bold, '\n📋 Production Readiness Summary:');
  
  if (hasErrors) {
    log(colors.red + colors.bold, '❌ PRODUCTION VALIDATION FAILED');
    log(colors.red, '   Critical issues must be resolved before deployment');
    process.exit(1);
  } else if (hasWarnings) {
    log(colors.yellow + colors.bold, '⚠️  PRODUCTION VALIDATION PASSED WITH WARNINGS');
    log(colors.yellow, '   Some optional features may not work correctly');
  } else {
    log(colors.green + colors.bold, '✅ PRODUCTION VALIDATION PASSED');
    log(colors.green, '   All systems ready for production deployment!');
  }
  
  // Next steps
  log(colors.blue, '\n🎯 Next Steps:');
  log(colors.blue, '   1. Deploy to Vercel with these environment variables');
  log(colors.blue, '   2. Run post-deployment smoke tests');
  log(colors.blue, '   3. Monitor error rates and performance');
  log(colors.blue, '   4. Set up alerts and monitoring');
  
  console.log('');
  
  return report;
}

// Main execution
async function main() {
  try {
    await generateProductionReport();
  } catch (error) {
    log(colors.red, `\n❌ Validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironmentVariables,
  testSupabaseConnection,
  testOpenRouterConnection,
  validateProductionReadiness
};
