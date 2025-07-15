#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates all required environment variables for production deployment
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  
  // OpenRouter AI
  'OPENROUTER_API_KEY',
  
  // Cashfree Payments
  'CASHFREE_APP_ID',
  'CASHFREE_SECRET_KEY',
  

  
  // Email Service
  'RESEND_API_KEY',
  
  // Analytics & Monitoring
  'POSTHOG_KEY',
  'POSTHOG_HOST',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  
  // Slack OAuth
  'NEXT_PUBLIC_SLACK_CLIENT_ID',
  'SLACK_CLIENT_SECRET',
  'SLACK_SIGNING_SECRET',
  
  // App Configuration
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL'
];

const optionalEnvVars = [
  // Stripe Fallback (optional since Cashfree is primary)
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',

  // CRM Integrations
  'HUBSPOT_CLIENT_ID',
  'HUBSPOT_CLIENT_SECRET',
  'SALESFORCE_CLIENT_ID',
  'SALESFORCE_CLIENT_SECRET',
  'NOTION_CLIENT_ID',
  'NOTION_CLIENT_SECRET'
];

console.log('🔍 Validating Environment Variables...\n');

let missingRequired = [];
let missingOptional = [];
let validCount = 0;

// Check required variables
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
    validCount++;
  } else {
    console.log(`❌ ${envVar}: Missing`);
    missingRequired.push(envVar);
  }
});

console.log('\n📋 Optional Variables:');
// Check optional variables
optionalEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set`);
    validCount++;
  } else {
    console.log(`⚠️  ${envVar}: Not set (optional)`);
    missingOptional.push(envVar);
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Valid: ${validCount}/${requiredEnvVars.length + optionalEnvVars.length}`);
console.log(`❌ Missing Required: ${missingRequired.length}`);
console.log(`⚠️  Missing Optional: ${missingOptional.length}`);

if (missingRequired.length > 0) {
  console.log('\n🚨 CRITICAL: Missing required environment variables:');
  missingRequired.forEach(envVar => {
    console.log(`   - ${envVar}`);
  });
  console.log('\n❌ Deployment validation FAILED');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
  console.log('🚀 Ready for production deployment');
  process.exit(0);
}
