#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates all required environment variables for Vercel deployment
 */

import chalk from 'chalk';

// Required environment variables for production
const REQUIRED_VARS = {
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Supabase project URL',
    pattern: /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
    example: 'https://your-project.supabase.co'
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    description: 'Supabase anonymous key',
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  },
  'SUPABASE_SERVICE_ROLE_KEY': {
    description: 'Supabase service role key',
    pattern: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    secret: true
  },
  'OPENROUTER_API_KEY': {
    description: 'OpenRouter API key for DeepSeek AI',
    pattern: /^sk-or-v1-[a-f0-9]{64}$/,
    example: 'sk-or-v1-...',
    secret: true
  },
  'NEXT_PUBLIC_SITE_URL': {
    description: 'Deployed site URL',
    pattern: /^https:\/\/[a-z0-9-]+\.vercel\.app$|^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/,
    example: 'https://your-app.vercel.app'
  }
};

// Optional environment variables
const OPTIONAL_VARS = {
  'SLACK_CLIENT_ID': {
    description: 'Slack OAuth client ID',
    pattern: /^\d+\.\d+$/,
    example: '1234567890.1234567890'
  },
  'SLACK_CLIENT_SECRET': {
    description: 'Slack OAuth client secret',
    pattern: /^[a-f0-9]{32}$/,
    example: 'abcdef1234567890abcdef1234567890',
    secret: true
  },
  'NEXTAUTH_SECRET': {
    description: 'NextAuth.js secret',
    pattern: /^.{32,}$/,
    example: 'Generate with: openssl rand -base64 32',
    secret: true
  },
  'SENTRY_DSN': {
    description: 'Sentry error tracking DSN',
    pattern: /^https:\/\/[a-f0-9]+@[a-z0-9.-]+\.ingest\.sentry\.io\/\d+$/,
    example: 'https://...@sentry.io/...'
  },
  'RESEND_API_KEY': {
    description: 'Resend email API key',
    pattern: /^re_[a-zA-Z0-9_-]+$/,
    example: 're_...',
    secret: true
  }
};

function validateEnvironment() {
  console.log(chalk.blue.bold('\n🔍 Validating Production Environment Variables\n'));

  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  console.log(chalk.yellow.bold('Required Variables:'));
  for (const [key, config] of Object.entries(REQUIRED_VARS)) {
    const value = process.env[key];
    
    if (!value) {
      console.log(chalk.red(`❌ ${key}: MISSING`));
      console.log(chalk.gray(`   ${config.description}`));
      console.log(chalk.gray(`   Example: ${config.example}\n`));
      hasErrors = true;
    } else if (!config.pattern.test(value)) {
      console.log(chalk.red(`❌ ${key}: INVALID FORMAT`));
      console.log(chalk.gray(`   ${config.description}`));
      console.log(chalk.gray(`   Expected pattern: ${config.pattern}\n`));
      hasErrors = true;
    } else {
      const displayValue = config.secret ? '***HIDDEN***' : value;
      console.log(chalk.green(`✅ ${key}: ${displayValue}`));
    }
  }

  // Check optional variables
  console.log(chalk.yellow.bold('\nOptional Variables:'));
  for (const [key, config] of Object.entries(OPTIONAL_VARS)) {
    const value = process.env[key];
    
    if (!value) {
      console.log(chalk.yellow(`⚠️  ${key}: NOT SET (optional)`));
      console.log(chalk.gray(`   ${config.description}\n`));
      hasWarnings = true;
    } else if (!config.pattern.test(value)) {
      console.log(chalk.red(`❌ ${key}: INVALID FORMAT`));
      console.log(chalk.gray(`   ${config.description}`));
      console.log(chalk.gray(`   Expected pattern: ${config.pattern}\n`));
      hasErrors = true;
    } else {
      const displayValue = config.secret ? '***HIDDEN***' : value;
      console.log(chalk.green(`✅ ${key}: ${displayValue}`));
    }
  }

  // Security checks
  console.log(chalk.yellow.bold('\nSecurity Validation:'));
  
  // Check HTTPS URLs (only in production)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (siteUrl) {
    if (isDevelopment) {
      // Development: Allow HTTP for localhost
      if (siteUrl.startsWith('http://localhost') || siteUrl.startsWith('https://localhost')) {
        console.log(chalk.green('✅ Site URL configured for development'));
      } else {
        console.log(chalk.yellow('⚠️ Development site URL should use localhost'));
      }
    } else {
      // Production: Require HTTPS
      if (!siteUrl.startsWith('https://')) {
        console.log(chalk.red('❌ NEXT_PUBLIC_SITE_URL must use HTTPS in production'));
        hasErrors = true;
      } else {
        console.log(chalk.green('✅ Site URL uses HTTPS'));
      }
    }
  }

  // Check Supabase URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
    console.log(chalk.red('❌ NEXT_PUBLIC_SUPABASE_URL must use HTTPS'));
    hasErrors = true;
  } else if (supabaseUrl) {
    console.log(chalk.green('✅ Supabase URL uses HTTPS'));
  }

  // Summary
  console.log(chalk.blue.bold('\n📋 Validation Summary:'));
  
  if (hasErrors) {
    console.log(chalk.red.bold('❌ VALIDATION FAILED - Fix errors before deployment'));
    console.log(chalk.yellow('💡 See deployment/vercel-env-template.json for setup guide'));
    process.exit(1);
  } else if (hasWarnings) {
    console.log(chalk.yellow.bold('⚠️  VALIDATION PASSED WITH WARNINGS'));
    console.log(chalk.green('✅ Ready for deployment (some optional features may not work)'));
  } else {
    console.log(chalk.green.bold('✅ VALIDATION PASSED - Ready for production deployment!'));
  }

  console.log(chalk.blue('\n🚀 Next steps:'));
  console.log('1. Add these variables to Vercel dashboard');
  console.log('2. Deploy to Vercel');
  console.log('3. Run post-deployment smoke tests');
  console.log('');
}

// Install chalk if not available
try {
  require('chalk');
} catch (e) {
  console.log('Installing chalk for colored output...');
  require('child_process').execSync('npm install chalk --no-save', { stdio: 'inherit' });
}

// Run validation
validateEnvironment();
