#!/usr/bin/env node

/**
 * Prepare Vercel Production Deployment
 * Validates environment variables and provides deployment checklist
 */

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const REQUIRED_ENV_VARS = [
  // Core Application
  'NEXT_PUBLIC_SITE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  
  // Google OAuth
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  
  // Slack
  'SLACK_CLIENT_ID',
  'SLACK_CLIENT_SECRET',
  'SLACK_SIGNING_SECRET',
  'SLACK_BOT_TOKEN',
  
  // OpenRouter AI
  'OPENROUTER_API_KEY',
  
  // Notion
  'NOTION_API_TOKEN',
  'NOTION_DATABASE_ID',
  
  // Email Service
  'RESEND_API_KEY',
  'EMAIL_FROM',
  
  // Error Tracking
  'NEXT_PUBLIC_SENTRY_DSN',
  'SENTRY_DSN'
];

function checkEnvironmentVariables() {
  console.log('🔧 Checking Environment Variables...\n');
  
  const missing = [];
  const present = [];
  
  REQUIRED_ENV_VARS.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
      console.log(`✅ ${varName}: Set`);
    } else {
      missing.push(varName);
      console.log(`❌ ${varName}: Missing`);
    }
  });
  
  console.log(`\n📊 Environment Variables Status:`);
  console.log(`✅ Present: ${present.length}/${REQUIRED_ENV_VARS.length}`);
  console.log(`❌ Missing: ${missing.length}/${REQUIRED_ENV_VARS.length}`);
  
  if (missing.length > 0) {
    console.log(`\n🚨 Missing Variables:`);
    missing.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }
  
  return true;
}

function validateProductionUrls() {
  console.log('🌐 Validating Production URLs...\n');
  
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  
  if (siteUrl && siteUrl.includes('localhost')) {
    console.log('⚠️  NEXT_PUBLIC_SITE_URL contains localhost - update for production');
    console.log(`   Current: ${siteUrl}`);
    console.log(`   Should be: https://your-domain.vercel.app`);
  } else {
    console.log('✅ NEXT_PUBLIC_SITE_URL is production-ready');
  }
  
  if (nextAuthUrl && nextAuthUrl.includes('localhost')) {
    console.log('⚠️  NEXTAUTH_URL contains localhost - update for production');
    console.log(`   Current: ${nextAuthUrl}`);
    console.log(`   Should be: https://your-domain.vercel.app`);
  } else {
    console.log('✅ NEXTAUTH_URL is production-ready');
  }
}

async function runProductionChecks() {
  console.log('🎯 VERCEL PRODUCTION DEPLOYMENT PREPARATION\n');
  console.log('=' .repeat(60));
  
  // Check environment variables
  const envValid = checkEnvironmentVariables();
  
  // Validate URLs
  validateProductionUrls();
  
  // Final checklist
  console.log('\n📋 PRODUCTION DEPLOYMENT CHECKLIST:\n');
  console.log('□ 1. Update NEXT_PUBLIC_SITE_URL to production domain');
  console.log('□ 2. Update NEXTAUTH_URL to production domain');
  console.log('□ 3. Set all environment variables in Vercel dashboard');
  console.log('□ 4. Verify Supabase RLS policies for production');
  console.log('□ 5. Test Slack OAuth redirect URLs');
  console.log('□ 6. Verify Google OAuth redirect URLs');
  console.log('□ 7. Test OpenRouter API key limits');
  console.log('□ 8. Verify Notion API permissions');
  console.log('□ 9. Test Resend email sending');
  console.log('□ 10. Verify Sentry error tracking');
  
  console.log('\n🚀 DEPLOYMENT COMMANDS:\n');
  console.log('# Deploy to Vercel:');
  console.log('vercel --prod');
  console.log('');
  console.log('# Or push to main branch if auto-deployment is enabled:');
  console.log('git add .');
  console.log('git commit -m "feat: production deployment ready"');
  console.log('git push origin main');
  
  if (envValid) {
    console.log('\n🎉 READY FOR PRODUCTION DEPLOYMENT!');
    console.log('✅ All environment variables are configured');
    console.log('🚀 Your Slack Summary Scribe SaaS is production-ready');
  } else {
    console.log('\n⚠️  DEPLOYMENT PREPARATION INCOMPLETE');
    console.log('❌ Please set missing environment variables before deployment');
  }
}

// Run the preparation
runProductionChecks();
