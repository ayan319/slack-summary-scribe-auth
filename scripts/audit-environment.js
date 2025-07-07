#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔍 COMPREHENSIVE ENVIRONMENT AUDIT');
console.log('===================================\n');

// User's requested variables for validation
const userRequestedVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'DEEPSEEK_API_KEY',
  'SLACK_CLIENT_SECRET',
  'SLACK_SIGNING_SECRET',
  'NEXT_PUBLIC_SLACK_CLIENT_ID',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'SUPPORT_EMAIL',
  'JWT_SECRET',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'CASHFREE_APP_ID',
  'CASHFREE_SECRET_KEY',
  'CASHFREE_ENVIRONMENT',
  'POSTHOG_KEY',
  'POSTHOG_HOST',
  'SENTRY_DSN',
  'NEXT_PUBLIC_APP_URL'
];

// Additional variables found in .env.local
const additionalVars = [
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_AUTH_TOKEN',
  'SENTRY_ORG', 
  'SENTRY_PROJECT',
  'NOTION_API_TOKEN',
  'NOTION_DATABASE_ID',
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID',
  'SLACK_WEBHOOK_URL'
];

let validCount = 0;
let missingCount = 0;
let placeholderCount = 0;
const missingVars = [];
const placeholderVars = [];

console.log('📋 USER REQUESTED VARIABLES:');
console.log('============================');

userRequestedVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.log(`❌ ${varName}: MISSING`);
    missingCount++;
    missingVars.push(varName);
  } else if (value.includes('your-') || value.includes('change-in-production')) {
    console.log(`⚠️  ${varName}: PLACEHOLDER VALUE`);
    placeholderCount++;
    placeholderVars.push(varName);
  } else {
    console.log(`✅ ${varName}: SET`);
    validCount++;
  }
});

console.log('\n📋 ADDITIONAL VARIABLES:');
console.log('========================');

additionalVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.trim() === '') {
    console.log(`❌ ${varName}: MISSING`);
  } else if (value.includes('your-') || value.includes('change-in-production')) {
    console.log(`⚠️  ${varName}: PLACEHOLDER VALUE`);
  } else {
    console.log(`✅ ${varName}: SET`);
  }
});

console.log('\n📊 SUMMARY:');
console.log('===========');
console.log(`✅ Valid: ${validCount}`);
console.log(`❌ Missing: ${missingCount}`);
console.log(`⚠️  Placeholders: ${placeholderCount}`);
console.log(`📝 Total Requested: ${userRequestedVars.length}`);

if (missingCount > 0) {
  console.log('\n🚨 MISSING VARIABLES:');
  console.log('====================');
  missingVars.forEach(varName => {
    console.log(`- ${varName}`);
  });
}

if (placeholderCount > 0) {
  console.log('\n⚠️  PLACEHOLDER VARIABLES:');
  console.log('=========================');
  placeholderVars.forEach(varName => {
    console.log(`- ${varName}: ${process.env[varName]}`);
  });
}

console.log('\n🎯 PRODUCTION READINESS:');
console.log('========================');
if (missingCount === 0 && placeholderCount === 0) {
  console.log('✅ All environment variables are production-ready!');
} else {
  console.log('❌ Environment needs attention before production deployment.');
  if (missingCount > 0) {
    console.log(`   - ${missingCount} missing variables need to be added`);
  }
  if (placeholderCount > 0) {
    console.log(`   - ${placeholderCount} placeholder values need to be updated`);
  }
}
