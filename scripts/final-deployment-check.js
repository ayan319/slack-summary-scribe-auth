#!/usr/bin/env node

/**
 * Final Deployment Readiness Check
 * Comprehensive validation before Vercel deployment
 */

import { config } from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Load environment variables
config();

console.log('🚀 FINAL DEPLOYMENT READINESS CHECK');
console.log('===================================');
console.log('');

let allChecks = [];

function addCheck(category, name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${name}: ${status}${details ? ` - ${details}` : ''}`);
  allChecks.push({ category, name, status, details });
}

function runCommand(command, description) {
  try {
    console.log(`\n🔄 ${description}...`);
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    addCheck('Build', description, 'PASS');
    return { success: true, output };
  } catch (error) {
    addCheck('Build', description, 'FAIL', error.message);
    return { success: false, error: error.message };
  }
}

console.log('1️⃣ ENVIRONMENT VALIDATION');
console.log('-------------------------');

// Critical environment variables
const criticalEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENROUTER_API_KEY',
  'NEXT_PUBLIC_SENTRY_DSN'
];

criticalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && !value.includes('your_') && !value.includes('placeholder')) {
    addCheck('Environment', varName, 'PASS');
  } else {
    addCheck('Environment', varName, 'FAIL', 'Missing or placeholder value');
  }
});

console.log('');
console.log('2️⃣ BUILD VALIDATION');
console.log('-------------------');

// Test build
const buildResult = runCommand('npm run build', 'Production Build');

if (buildResult.success) {
  // Check if .next directory exists
  if (fs.existsSync('.next')) {
    addCheck('Build', 'Build Output', 'PASS', '.next directory created');
  } else {
    addCheck('Build', 'Build Output', 'FAIL', '.next directory missing');
  }
  
  // Check for critical build files
  const criticalFiles = [
    '.next/BUILD_ID',
    '.next/static',
    '.next/server'
  ];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      addCheck('Build', `Build File: ${file}`, 'PASS');
    } else {
      addCheck('Build', `Build File: ${file}`, 'FAIL', 'Missing');
    }
  });
}

console.log('');
console.log('3️⃣ DEPENDENCY VALIDATION');
console.log('------------------------');

// Check package.json for critical dependencies
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const criticalDeps = [
    'next',
    '@supabase/supabase-js',
    '@sentry/nextjs',
    'openai'
  ];
  
  criticalDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      addCheck('Dependencies', dep, 'PASS');
    } else {
      addCheck('Dependencies', dep, 'FAIL', 'Missing dependency');
    }
  });
  
} catch (error) {
  addCheck('Dependencies', 'Package.json', 'FAIL', 'Cannot read package.json');
}

console.log('');
console.log('4️⃣ CONFIGURATION VALIDATION');
console.log('---------------------------');

// Check critical config files
const configFiles = [
  'next.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  '.env'
];

configFiles.forEach(file => {
  if (fs.existsSync(file)) {
    addCheck('Configuration', file, 'PASS');
  } else {
    addCheck('Configuration', file, 'FAIL', 'Missing config file');
  }
});

// Check Sentry configuration
try {
  if (fs.existsSync('sentry.client.config.ts') && 
      fs.existsSync('sentry.server.config.ts') && 
      fs.existsSync('sentry.edge.config.ts')) {
    addCheck('Configuration', 'Sentry Config', 'PASS', 'All Sentry configs present');
  } else {
    addCheck('Configuration', 'Sentry Config', 'WARN', 'Some Sentry configs missing');
  }
} catch (error) {
  addCheck('Configuration', 'Sentry Config', 'FAIL', error.message);
}

console.log('');
console.log('5️⃣ SECURITY VALIDATION');
console.log('----------------------');

// Check for sensitive data in public files
const publicFiles = [
  'README.md',
  'package.json',
  '.env.example'
];

let sensitiveDataFound = false;
publicFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{48}/g, // API keys
      /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWT tokens
      /[a-zA-Z0-9]{32,}/g // Long strings that might be secrets
    ];
    
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(content) && !file.includes('.example')) {
        sensitiveDataFound = true;
        addCheck('Security', `${file} - Sensitive Data`, 'FAIL', 'Potential secrets found');
      }
    });
  }
});

if (!sensitiveDataFound) {
  addCheck('Security', 'Public Files', 'PASS', 'No sensitive data in public files');
}

console.log('');
console.log('6️⃣ DEPLOYMENT READINESS');
console.log('-----------------------');

// Check Vercel configuration
if (fs.existsSync('vercel.json')) {
  addCheck('Deployment', 'Vercel Config', 'PASS', 'vercel.json present');
} else {
  addCheck('Deployment', 'Vercel Config', 'WARN', 'vercel.json missing (optional)');
}

// Check for .vercelignore
if (fs.existsSync('.vercelignore')) {
  addCheck('Deployment', 'Vercel Ignore', 'PASS', '.vercelignore present');
} else {
  addCheck('Deployment', 'Vercel Ignore', 'WARN', '.vercelignore missing (optional)');
}

console.log('');
console.log('🎯 FINAL SUMMARY');
console.log('================');

const summary = allChecks.reduce((acc, check) => {
  acc[check.status] = (acc[check.status] || 0) + 1;
  return acc;
}, {});

console.log(`Total Checks: ${allChecks.length}`);
console.log(`✅ Passed: ${summary.PASS || 0}`);
console.log(`⚠️ Warnings: ${summary.WARN || 0}`);
console.log(`❌ Failed: ${summary.FAIL || 0}`);

const successRate = ((summary.PASS || 0) / allChecks.length * 100).toFixed(1);
console.log(`Success Rate: ${successRate}%`);

const criticalFailures = allChecks.filter(check => 
  check.status === 'FAIL' && 
  ['Environment', 'Build', 'Dependencies'].includes(check.category)
);

if (criticalFailures.length === 0) {
  console.log('');
  console.log('🎉 DEPLOYMENT READY!');
  console.log('✅ All critical checks passed');
  console.log('✅ Application is ready for Vercel deployment');
  console.log('');
  console.log('📋 NEXT STEPS:');
  console.log('1. Push code to GitHub repository');
  console.log('2. Connect repository to Vercel');
  console.log('3. Configure environment variables in Vercel dashboard');
  console.log('4. Deploy to production');
  process.exit(0);
} else {
  console.log('');
  console.log('⚠️ CRITICAL ISSUES FOUND');
  console.log('Fix the following before deployment:');
  criticalFailures.forEach(failure => {
    console.log(`❌ ${failure.name}: ${failure.details}`);
  });
  process.exit(1);
}
