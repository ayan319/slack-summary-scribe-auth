#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates all required environment variables and configurations
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  log('\n🔍 Checking .env.local file...', 'blue');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found!', 'red');
    return false;
  }
  
  log('✅ .env.local file exists', 'green');
  return true;
}

function validateRequiredEnvVars() {
  log('\n🔍 Validating required environment variables...', 'blue');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DEEPSEEK_API_KEY',
    'RESEND_API_KEY',
    'JWT_SECRET',
    'NEXT_PUBLIC_APP_URL'
  ];
  
  const optionalVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'SLACK_CLIENT_SECRET',
    'SLACK_SIGNING_SECRET',
    'NEXTAUTH_SECRET',
    'CASHFREE_APP_ID',
    'CASHFREE_SECRET_KEY'
  ];
  
  let allValid = true;
  
  // Check required variables
  log('\nRequired Variables:', 'bold');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      log(`❌ ${varName}: Missing or empty`, 'red');
      allValid = false;
    } else {
      log(`✅ ${varName}: Set`, 'green');
    }
  });
  
  // Check optional variables
  log('\nOptional Variables:', 'bold');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      log(`⚠️  ${varName}: Not set (optional)`, 'yellow');
    } else {
      log(`✅ ${varName}: Set`, 'green');
    }
  });
  
  return allValid;
}

function validateSupabaseConfig() {
  log('\n🔍 Validating Supabase configuration...', 'blue');
  
  const configPath = path.join(process.cwd(), 'supabase', 'config.toml');
  if (!fs.existsSync(configPath)) {
    log('❌ supabase/config.toml not found!', 'red');
    return false;
  }
  
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  // Check for correct port configuration
  if (configContent.includes('site_url = "http://localhost:3000"') || configContent.includes('site_url = "http://localhost:3001"')) {
    log('✅ Supabase site_url correctly configured for development', 'green');
  } else {
    log('❌ Supabase site_url should be http://localhost:3000 or http://localhost:3001', 'red');
    return false;
  }
  
  // Check for auth callback URLs
  if (configContent.includes('api/auth/callback')) {
    log('✅ Auth callback URLs configured', 'green');
  } else {
    log('⚠️  Auth callback URLs may need configuration', 'yellow');
  }
  
  return true;
}

function validatePackageJson() {
  log('\n🔍 Validating package.json...', 'blue');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    log('❌ package.json not found!', 'red');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Check for required dependencies
  const requiredDeps = [
    '@supabase/supabase-js',
    '@supabase/auth-helpers-nextjs',
    'next',
    'react',
    'typescript'
  ];
  
  let allDepsPresent = true;
  requiredDeps.forEach(dep => {
    const inDeps = packageJson.dependencies && packageJson.dependencies[dep];
    const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];

    if (inDeps) {
      log(`✅ ${dep}: ${packageJson.dependencies[dep]}`, 'green');
    } else if (inDevDeps) {
      log(`✅ ${dep}: ${packageJson.devDependencies[dep]} (dev)`, 'green');
    } else {
      log(`❌ ${dep}: Missing from dependencies`, 'red');
      allDepsPresent = false;
    }
  });
  
  return allDepsPresent;
}

function validateNextConfig() {
  log('\n🔍 Validating Next.js configuration...', 'blue');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  if (!fs.existsSync(nextConfigPath)) {
    log('❌ next.config.js not found!', 'red');
    return false;
  }
  
  const configContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check if build errors are being ignored (should be fixed for production)
  if (configContent.includes('ignoreBuildErrors: true')) {
    log('⚠️  TypeScript build errors are being ignored - should be fixed for production', 'yellow');
  }
  
  if (configContent.includes('ignoreDuringBuilds: true')) {
    log('⚠️  ESLint errors are being ignored - should be fixed for production', 'yellow');
  }
  
  log('✅ Next.js config file exists', 'green');
  return true;
}

function generateReport() {
  log('\n📊 ENVIRONMENT VALIDATION REPORT', 'bold');
  log('=====================================', 'blue');
  
  const checks = [
    { name: 'Environment File', fn: checkEnvFile },
    { name: 'Environment Variables', fn: validateRequiredEnvVars },
    { name: 'Supabase Configuration', fn: validateSupabaseConfig },
    { name: 'Package Dependencies', fn: validatePackageJson },
    { name: 'Next.js Configuration', fn: validateNextConfig }
  ];
  
  let allPassed = true;
  const results = [];
  
  checks.forEach(check => {
    const result = check.fn();
    results.push({ name: check.name, passed: result });
    if (!result) allPassed = false;
  });
  
  log('\n📋 Summary:', 'bold');
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? 'green' : 'red';
    log(`${status} ${result.name}`, color);
  });
  
  if (allPassed) {
    log('\n🎉 All environment checks passed! Ready for development.', 'green');
  } else {
    log('\n⚠️  Some environment checks failed. Please fix the issues above.', 'red');
  }
  
  return allPassed;
}

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Run validation
const isValid = generateReport();
process.exit(isValid ? 0 : 1);
