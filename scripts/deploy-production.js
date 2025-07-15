#!/usr/bin/env node

/**
 * Production Deployment Script
 * Handles Vercel deployment with cache clear and validation
 */

const { execSync } = require('child_process');

console.log('🚀 Starting Production Deployment Process...\n');

// Step 1: Validate environment
console.log('1️⃣ Validating Environment Variables...');
try {
  execSync('node scripts/validate-env.js', { stdio: 'inherit' });
  console.log('✅ Environment validation passed\n');
} catch (error) {
  console.error('❌ Environment validation failed');
  process.exit(1);
}

// Step 2: Build locally to ensure no issues
console.log('2️⃣ Running Local Build Test...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Local build successful\n');
} catch (error) {
  console.error('❌ Local build failed');
  process.exit(1);
}

// Step 3: Check if we have Vercel CLI
console.log('3️⃣ Checking Vercel CLI...');
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI available\n');
  
  // Step 4: Deploy to Vercel with force flag to clear cache
  console.log('4️⃣ Deploying to Vercel (Production)...');
  try {
    execSync('vercel --prod --force', { stdio: 'inherit' });
    console.log('✅ Vercel deployment successful\n');
  } catch (error) {
    console.error('❌ Vercel deployment failed');
    console.log('📝 Note: Automatic deployment may be in progress via GitHub integration');
  }
  
} catch (error) {
  console.log('⚠️  Vercel CLI not available - relying on GitHub integration');
  console.log('📝 Deployment will be handled automatically by Vercel GitHub integration\n');
}

// Step 5: Provide deployment info
console.log('📋 Deployment Information:');
console.log('🔗 Production URL: https://slack-summary-scribe.vercel.app');
console.log('📊 Vercel Dashboard: https://vercel.com/dashboard');
console.log('📈 Monitor deployment at: https://vercel.com/ayans-projects-c9fd2ddf/slack-summary-scribe');

console.log('\n✅ Production deployment process completed!');
console.log('🎯 Next: Validate deployment and run E2E tests');
