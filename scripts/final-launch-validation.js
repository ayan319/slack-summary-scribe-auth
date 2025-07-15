#!/usr/bin/env node

/**
 * Final Launch Validation Script
 * Comprehensive check for production readiness
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`, exists ? 'green' : 'red');
  return exists;
}

function checkEnvironmentVariables() {
  log('\n🔍 ENVIRONMENT VARIABLES CHECK', 'bold');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXT_PUBLIC_SLACK_CLIENT_ID',
    'SLACK_CLIENT_SECRET',
    'OPENROUTER_API_KEY',
    'RESEND_API_KEY',
    'NEXT_PUBLIC_APP_URL',
    'NODE_ENV'
  ];
  
  let allPresent = true;
  
  // Read .env.local file
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    
    requiredVars.forEach(varName => {
      const regex = new RegExp(`^${varName}=.+`, 'm');
      const found = regex.test(envContent);
      log(`${found ? '✅' : '❌'} ${varName}`, found ? 'green' : 'red');
      if (!found) allPresent = false;
    });
  } catch (error) {
    log('❌ Could not read .env.local file', 'red');
    allPresent = false;
  }
  
  return allPresent;
}

function checkProjectStructure() {
  log('\n📁 PROJECT STRUCTURE CHECK', 'bold');
  
  const criticalFiles = [
    { path: 'package.json', desc: 'Package configuration' },
    { path: 'next.config.mjs', desc: 'Next.js configuration' },
    { path: 'tailwind.config.ts', desc: 'Tailwind configuration' },
    { path: 'app/layout.tsx', desc: 'Root layout' },
    { path: 'app/page.tsx', desc: 'Landing page' },
    { path: 'app/login/page.tsx', desc: 'Login page' },
    { path: 'app/signup/page.tsx', desc: 'Signup page' },
    { path: 'app/dashboard/page.tsx', desc: 'Dashboard page' },
    { path: 'app/pricing/page.tsx', desc: 'Pricing page' },
    { path: 'components/ui/logo.tsx', desc: 'Logo component' },
    { path: 'lib/supabase.ts', desc: 'Supabase client' },
    { path: 'lib/upsertUserProfile.ts', desc: 'User profile sync' }
  ];
  
  let allPresent = true;
  
  criticalFiles.forEach(file => {
    const exists = checkFileExists(file.path, file.desc);
    if (!exists) allPresent = false;
  });
  
  return allPresent;
}

function checkAPIRoutes() {
  log('\n🔌 API ROUTES CHECK', 'bold');
  
  const apiRoutes = [
    'app/api/health/route.ts',
    'app/api/dashboard/route.ts',
    'app/api/slack/webhook/route.ts',
    'app/api/slack/auth/route.ts',
    'app/api/slack/callback/route.ts',
    'app/api/export/pdf/route.ts',
    'app/api/export/excel/route.ts',
    'app/api/export/notion/route.ts'
  ];
  
  let allPresent = true;
  
  apiRoutes.forEach(route => {
    const exists = checkFileExists(route, `API Route: ${route.replace('app/api/', '').replace('/route.ts', '')}`);
    if (!exists) allPresent = false;
  });
  
  return allPresent;
}

function checkBuildArtifacts() {
  log('\n🏗️ BUILD ARTIFACTS CHECK', 'bold');
  
  const buildFiles = [
    { path: '.next', desc: 'Next.js build directory' },
    { path: 'public/sitemap.xml', desc: 'Sitemap' },
    { path: 'public/robots.txt', desc: 'Robots.txt' }
  ];
  
  let allPresent = true;
  
  buildFiles.forEach(file => {
    const exists = checkFileExists(file.path, file.desc);
    if (!exists) allPresent = false;
  });
  
  return allPresent;
}

function checkLaunchAssets() {
  log('\n🚀 LAUNCH ASSETS CHECK', 'bold');
  
  const launchFiles = [
    'scripts/test-e2e-flows.js',
    'scripts/performance-audit.js',
    'apply-migration.sql',
    'verify-migration.sql'
  ];
  
  let allPresent = true;
  
  launchFiles.forEach(file => {
    const exists = checkFileExists(file, `Launch Asset: ${file}`);
    if (!exists) allPresent = false;
  });
  
  return allPresent;
}

function checkPackageJson() {
  log('\n📦 PACKAGE.JSON VALIDATION', 'bold');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredScripts = [
      'build',
      'start',
      'dev',
      'validate-env',
      'deploy-production',
      'setup-monitoring',
      'setup-growth',
      'prepare-launch'
    ];
    
    let allScriptsPresent = true;
    
    requiredScripts.forEach(script => {
      const exists = packageJson.scripts && packageJson.scripts[script];
      log(`${exists ? '✅' : '❌'} Script: ${script}`, exists ? 'green' : 'red');
      if (!exists) allScriptsPresent = false;
    });
    
    // Check critical dependencies
    const criticalDeps = [
      'next',
      'react',
      'typescript',
      '@supabase/supabase-js',
      'tailwindcss'
    ];
    
    let allDepsPresent = true;
    
    criticalDeps.forEach(dep => {
      const exists = (packageJson.dependencies && packageJson.dependencies[dep]) ||
                    (packageJson.devDependencies && packageJson.devDependencies[dep]);
      log(`${exists ? '✅' : '❌'} Dependency: ${dep}`, exists ? 'green' : 'red');
      if (!exists) allDepsPresent = false;
    });
    
    return allScriptsPresent && allDepsPresent;
  } catch (error) {
    log('❌ Could not read or parse package.json', 'red');
    return false;
  }
}

function generateLaunchChecklist() {
  log('\n📋 FINAL LAUNCH CHECKLIST', 'bold');
  log('═══════════════════════════════════════', 'cyan');
  
  const checklist = [
    '🔧 Apply Supabase migration (apply-migration.sql)',
    '🚀 Deploy to Vercel with latest commit',
    '🔗 Update OAuth redirect URLs to production domain',
    '📧 Test email notifications with Resend',
    '🤖 Test AI summarization with DeepSeek',
    '💳 Test payment flow with Cashfree',
    '📊 Verify PostHog analytics tracking',
    '🐛 Verify Sentry error tracking',
    '📱 Test mobile responsiveness',
    '🔍 Run final E2E tests on production',
    '📈 Monitor performance metrics',
    '🎯 Prepare Product Hunt launch assets'
  ];
  
  checklist.forEach(item => {
    log(`☐ ${item}`, 'cyan');
  });
}

async function runFinalValidation() {
  log('🚀 FINAL LAUNCH VALIDATION', 'bold');
  log('═══════════════════════════════════════', 'cyan');
  log('Checking production readiness for Slack Summary Scribe SaaS', 'cyan');
  log('', 'reset');
  
  const checks = [
    { name: 'Environment Variables', fn: checkEnvironmentVariables },
    { name: 'Project Structure', fn: checkProjectStructure },
    { name: 'API Routes', fn: checkAPIRoutes },
    { name: 'Build Artifacts', fn: checkBuildArtifacts },
    { name: 'Launch Assets', fn: checkLaunchAssets },
    { name: 'Package Configuration', fn: checkPackageJson }
  ];
  
  let allPassed = true;
  const results = [];
  
  for (const check of checks) {
    const passed = check.fn();
    results.push({ name: check.name, passed });
    if (!passed) allPassed = false;
  }
  
  // Summary
  log('\n📊 VALIDATION SUMMARY', 'bold');
  log('═══════════════════════════════════════', 'cyan');
  
  results.forEach(result => {
    log(`${result.passed ? '✅' : '❌'} ${result.name}`, result.passed ? 'green' : 'red');
  });
  
  const passedCount = results.filter(r => r.passed).length;
  log(`\n📈 Overall Score: ${passedCount}/${results.length} checks passed`, 
      allPassed ? 'green' : 'yellow');
  
  if (allPassed) {
    log('\n🎉 LAUNCH READY! 🚀', 'green');
    log('Your Slack Summary Scribe SaaS is ready for production deployment!', 'green');
    generateLaunchChecklist();
  } else {
    log('\n⚠️ ISSUES DETECTED', 'yellow');
    log('Please address the failed checks before launching.', 'yellow');
  }
  
  return allPassed;
}

// Run if called directly
if (require.main === module) {
  runFinalValidation()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      log(`❌ Validation failed: ${error.message}`, 'red');
      process.exit(1);
    });
}

module.exports = { runFinalValidation };
