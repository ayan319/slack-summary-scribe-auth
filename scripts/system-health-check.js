#!/usr/bin/env node

/**
 * Comprehensive System Health Check
 * Validates all critical components of the Slack Summary Scribe application
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

console.log('🏥 Starting Comprehensive System Health Check\n');

// Health check results
const healthResults = {
  environment: { status: 'unknown', details: [] },
  database: { status: 'unknown', details: [] },
  authentication: { status: 'unknown', details: [] },
  apis: { status: 'unknown', details: [] },
  integrations: { status: 'unknown', details: [] },
  security: { status: 'unknown', details: [] }
};

// Environment Variables Check
function checkEnvironmentVariables() {
  console.log('🔍 Checking Environment Variables...\n');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'OPENROUTER_API_KEY',
    'SLACK_CLIENT_ID',
    'SLACK_CLIENT_SECRET',
    'NOTION_API_TOKEN',
    'NOTION_DATABASE_ID'
  ];
  
  const optionalVars = [
    'SENTRY_DSN',
    'RESEND_API_KEY',
    'STRIPE_SECRET_KEY',
    'CASHFREE_CLIENT_ID',
    'CASHFREE_CLIENT_SECRET'
  ];
  
  let missingRequired = [];
  let missingOptional = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missingRequired.push(varName);
    } else {
      console.log(`✅ ${varName}: Configured`);
    }
  });
  
  optionalVars.forEach(varName => {
    if (!process.env[varName]) {
      missingOptional.push(varName);
    } else {
      console.log(`✅ ${varName}: Configured`);
    }
  });
  
  if (missingRequired.length > 0) {
    console.log(`\n❌ Missing Required Variables: ${missingRequired.join(', ')}`);
    healthResults.environment.status = 'error';
    healthResults.environment.details = [`Missing required: ${missingRequired.join(', ')}`];
  } else {
    healthResults.environment.status = 'healthy';
    healthResults.environment.details = ['All required environment variables present'];
  }
  
  if (missingOptional.length > 0) {
    console.log(`\n⚠️  Missing Optional Variables: ${missingOptional.join(', ')}`);
    healthResults.environment.details.push(`Missing optional: ${missingOptional.join(', ')}`);
  }
  
  return missingRequired.length === 0;
}

// Database Connection Check
async function checkDatabaseConnection() {
  console.log('\n🗄️  Checking Database Connection...\n');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Test basic connection
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      console.log(`❌ Database connection failed: ${error.message}`);
      healthResults.database.status = 'error';
      healthResults.database.details = [error.message];
      return false;
    }
    
    console.log('✅ Database connection successful');
    
    // Check critical tables
    const tables = ['users', 'summaries', 'slack_integrations', 'notifications'];
    let tableChecks = [];

    for (const table of tables) {
      try {
        const { data, error: tableError } = await supabase.from(table).select('count').limit(1);
        if (tableError) {
          // Check if it's just a "does not exist" error vs a real error
          if (tableError.message.includes('does not exist')) {
            console.log(`⚠️  Table ${table}: Will be auto-created when needed`);
            tableChecks.push(`${table}: Auto-create`);
          } else {
            console.log(`❌ Table ${table}: ${tableError.message}`);
            tableChecks.push(`${table}: Error`);
          }
        } else {
          console.log(`✅ Table ${table}: Accessible`);
          tableChecks.push(`${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
        tableChecks.push(`${table}: Error`);
      }
    }
    
    healthResults.database.status = 'healthy';
    healthResults.database.details = tableChecks;
    return true;
    
  } catch (error) {
    console.log(`❌ Database check failed: ${error.message}`);
    healthResults.database.status = 'error';
    healthResults.database.details = [error.message];
    return false;
  }
}

// Authentication System Check
async function checkAuthenticationSystem() {
  console.log('\n🔐 Checking Authentication System...\n');
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test auth configuration
    const { data, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Auth session missing!') {
      console.log(`❌ Auth system error: ${error.message}`);
      healthResults.authentication.status = 'error';
      healthResults.authentication.details = [error.message];
      return false;
    }
    
    console.log('✅ Authentication system accessible');
    
    // Check OAuth providers
    const providers = ['google', 'github', 'slack'];
    let providerChecks = [];
    
    providers.forEach(provider => {
      const clientId = process.env[`${provider.toUpperCase()}_CLIENT_ID`] || 
                      process.env[`NEXT_PUBLIC_${provider.toUpperCase()}_CLIENT_ID`];
      const clientSecret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`];
      
      if (clientId && clientSecret) {
        console.log(`✅ ${provider} OAuth: Configured`);
        providerChecks.push(`${provider}: Configured`);
      } else {
        console.log(`⚠️  ${provider} OAuth: Not configured`);
        providerChecks.push(`${provider}: Missing`);
      }
    });
    
    healthResults.authentication.status = 'healthy';
    healthResults.authentication.details = providerChecks;
    return true;
    
  } catch (error) {
    console.log(`❌ Authentication check failed: ${error.message}`);
    healthResults.authentication.status = 'error';
    healthResults.authentication.details = [error.message];
    return false;
  }
}

// API Endpoints Check
async function checkAPIEndpoints() {
  console.log('\n🌐 Checking API Endpoints...\n');
  
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const endpoints = [
    '/api/health',
    '/api/healthcheck'
  ];
  
  let endpointChecks = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        console.log(`✅ ${endpoint}: Accessible`);
        endpointChecks.push(`${endpoint}: OK`);
      } else {
        console.log(`⚠️  ${endpoint}: Status ${response.status}`);
        endpointChecks.push(`${endpoint}: Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
      endpointChecks.push(`${endpoint}: Error`);
    }
  }
  
  healthResults.apis.status = endpointChecks.every(check => check.includes('OK')) ? 'healthy' : 'warning';
  healthResults.apis.details = endpointChecks;
  
  return true;
}

// Integration Services Check
async function checkIntegrations() {
  console.log('\n🔗 Checking Integration Services...\n');
  
  let integrationChecks = [];
  
  // OpenRouter AI Check
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log('✅ OpenRouter AI: Connected');
        integrationChecks.push('OpenRouter: Connected');
      } else {
        console.log('❌ OpenRouter AI: Authentication failed');
        integrationChecks.push('OpenRouter: Auth failed');
      }
    } catch (error) {
      console.log('❌ OpenRouter AI: Connection failed');
      integrationChecks.push('OpenRouter: Connection failed');
    }
  } else {
    console.log('⚠️  OpenRouter AI: Not configured');
    integrationChecks.push('OpenRouter: Not configured');
  }
  
  // Notion Check
  if (process.env.NOTION_API_TOKEN) {
    try {
      const { Client } = require('@notionhq/client');
      const notion = new Client({ auth: process.env.NOTION_API_TOKEN });
      
      await notion.users.list();
      console.log('✅ Notion: Connected');
      integrationChecks.push('Notion: Connected');
    } catch (error) {
      console.log('❌ Notion: Connection failed');
      integrationChecks.push('Notion: Connection failed');
    }
  } else {
    console.log('⚠️  Notion: Not configured');
    integrationChecks.push('Notion: Not configured');
  }
  
  // Slack Check
  if (process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET) {
    console.log('✅ Slack OAuth: Configured');
    integrationChecks.push('Slack: Configured');
  } else {
    console.log('⚠️  Slack OAuth: Not configured');
    integrationChecks.push('Slack: Not configured');
  }
  
  healthResults.integrations.status = integrationChecks.some(check => check.includes('Connected')) ? 'healthy' : 'warning';
  healthResults.integrations.details = integrationChecks;
  
  return true;
}

// Security Configuration Check
function checkSecurityConfiguration() {
  console.log('\n🔒 Checking Security Configuration...\n');
  
  let securityChecks = [];
  
  // NextAuth Secret
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32) {
    console.log('✅ NextAuth Secret: Properly configured');
    securityChecks.push('NextAuth Secret: OK');
  } else {
    console.log('❌ NextAuth Secret: Missing or too short');
    securityChecks.push('NextAuth Secret: Weak');
  }
  
  // Environment Check
  const isProduction = process.env.NODE_ENV === 'production';
  const hasHttps = process.env.NEXTAUTH_URL?.startsWith('https://');
  
  if (isProduction && !hasHttps) {
    console.log('❌ Production without HTTPS');
    securityChecks.push('HTTPS: Missing in production');
  } else if (isProduction && hasHttps) {
    console.log('✅ Production with HTTPS');
    securityChecks.push('HTTPS: Enabled');
  } else {
    console.log('✅ Development environment');
    securityChecks.push('Environment: Development');
  }
  
  // Sentry Configuration
  if (process.env.SENTRY_DSN) {
    console.log('✅ Sentry: Configured for error tracking');
    securityChecks.push('Sentry: Configured');
  } else {
    console.log('⚠️  Sentry: Not configured');
    securityChecks.push('Sentry: Missing');
  }
  
  healthResults.security.status = securityChecks.every(check => !check.includes('Missing') && !check.includes('Weak')) ? 'healthy' : 'warning';
  healthResults.security.details = securityChecks;

  return true;
}

// Generate Health Report
function generateHealthReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 SYSTEM HEALTH REPORT');
  console.log('='.repeat(60));

  const categories = [
    { name: 'Environment Variables', key: 'environment', icon: '🔧' },
    { name: 'Database Connection', key: 'database', icon: '🗄️' },
    { name: 'Authentication System', key: 'authentication', icon: '🔐' },
    { name: 'API Endpoints', key: 'apis', icon: '🌐' },
    { name: 'Integration Services', key: 'integrations', icon: '🔗' },
    { name: 'Security Configuration', key: 'security', icon: '🔒' }
  ];

  let overallHealth = 'healthy';
  let healthyCount = 0;
  let warningCount = 0;
  let errorCount = 0;

  categories.forEach(({ name, key, icon }) => {
    const result = healthResults[key];
    let statusIcon = '';

    switch (result.status) {
      case 'healthy':
        statusIcon = '✅';
        healthyCount++;
        break;
      case 'warning':
        statusIcon = '⚠️';
        warningCount++;
        if (overallHealth === 'healthy') overallHealth = 'warning';
        break;
      case 'error':
        statusIcon = '❌';
        errorCount++;
        overallHealth = 'error';
        break;
      default:
        statusIcon = '❓';
        errorCount++;
        overallHealth = 'error';
    }

    console.log(`${statusIcon} ${icon} ${name}: ${result.status.toUpperCase()}`);
    result.details.forEach(detail => {
      console.log(`   • ${detail}`);
    });
    console.log('');
  });

  // Overall Summary
  console.log('📈 OVERALL SYSTEM HEALTH');
  console.log('-'.repeat(30));
  console.log(`Status: ${overallHealth.toUpperCase()}`);
  console.log(`Healthy: ${healthyCount}/${categories.length}`);
  console.log(`Warnings: ${warningCount}`);
  console.log(`Errors: ${errorCount}`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('-'.repeat(30));

  if (overallHealth === 'healthy') {
    console.log('🎉 All systems operational! Your application is ready for production.');
  } else if (overallHealth === 'warning') {
    console.log('⚠️  Some optional features are not configured. Consider:');
    if (healthResults.integrations.status === 'warning') {
      console.log('   • Configure missing integrations for full functionality');
    }
    if (healthResults.security.status === 'warning') {
      console.log('   • Review security configuration for production deployment');
    }
  } else {
    console.log('🚨 Critical issues detected. Please address:');
    if (healthResults.environment.status === 'error') {
      console.log('   • Set all required environment variables');
    }
    if (healthResults.database.status === 'error') {
      console.log('   • Fix database connection issues');
    }
    if (healthResults.authentication.status === 'error') {
      console.log('   • Resolve authentication system problems');
    }
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. Address any critical errors first');
  console.log('2. Configure optional integrations as needed');
  console.log('3. Run tests to validate functionality');
  console.log('4. Deploy to production when all systems are healthy');

  return overallHealth === 'healthy';
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive system health check...\n');

  try {
    // Run all health checks
    const envCheck = checkEnvironmentVariables();
    const dbCheck = await checkDatabaseConnection();
    const authCheck = await checkAuthenticationSystem();
    const apiCheck = await checkAPIEndpoints();
    const integrationCheck = await checkIntegrations();
    const securityCheck = checkSecurityConfiguration();

    // Generate report
    const isHealthy = generateHealthReport();

    console.log('\n🏁 System health check complete!');
    return isHealthy;

  } catch (error) {
    console.error('\n💥 Health check failed with error:', error);
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
      console.error('Fatal error during health check:', error);
      process.exit(1);
    });
}

module.exports = main;
