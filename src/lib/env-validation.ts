// Environment variable validation for production deployment

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
  recommendations: string[];
}

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'CASHFREE_CLIENT_ID',
  'CASHFREE_CLIENT_SECRET',
  'SLACK_CLIENT_ID',
  'SLACK_CLIENT_SECRET',
  'DEEPSEEK_API_KEY',
  'RESEND_API_KEY',
  'EMAIL_FROM',
];

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'NEXT_PUBLIC_PLAUSIBLE_DOMAIN',
  'SENTRY_DSN',
  'REDIS_URL',
];

// Environment variables that should be URLs
const URL_ENV_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL',
  'SUPABASE_URL',
  'MONGODB_URI',
  'REDIS_URL',
  'SENTRY_DSN',
];

// Environment variables that should be email addresses
const EMAIL_ENV_VARS = [
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
];

// Validate environment variables
export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];

  // Check required variables
  REQUIRED_ENV_VARS.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Check recommended variables
  RECOMMENDED_ENV_VARS.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      warnings.push(`Recommended environment variable not set: ${varName}`);
    }
  });

  // Validate URL format
  URL_ENV_VARS.forEach(varName => {
    const value = process.env[varName];
    if (value && !isValidUrl(value)) {
      errors.push(`Invalid URL format for ${varName}: ${value}`);
    }
  });

  // Validate email format
  EMAIL_ENV_VARS.forEach(varName => {
    const value = process.env[varName];
    if (value && !isValidEmail(value)) {
      errors.push(`Invalid email format for ${varName}: ${value}`);
    }
  });

  // Specific validations
  validateSpecificEnvVars(errors, warnings, recommendations);

  return {
    valid: errors.length === 0 && missing.length === 0,
    errors,
    warnings,
    missing,
    recommendations,
  };
}

function validateSpecificEnvVars(
  errors: string[],
  warnings: string[],
  recommendations: string[]
) {
  // Validate NODE_ENV
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv !== 'production' && nodeEnv !== 'development') {
    warnings.push('NODE_ENV should be either "production" or "development"');
  }

  // Validate NEXT_PUBLIC_APP_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    if (nodeEnv === 'production' && !appUrl.startsWith('https://')) {
      errors.push('NEXT_PUBLIC_APP_URL must use HTTPS in production');
    }
    if (appUrl.endsWith('/')) {
      warnings.push('NEXT_PUBLIC_APP_URL should not end with a trailing slash');
    }
  }

  // Validate secrets length
  const secrets = ['NEXTAUTH_SECRET', 'JWT_SECRET', 'CASHFREE_WEBHOOK_SECRET'];
  secrets.forEach(secretName => {
    const secret = process.env[secretName];
    if (secret && secret.length < 32) {
      warnings.push(`${secretName} should be at least 32 characters long for security`);
    }
  });

  // Validate Cashfree environment
  const cashfreeClientId = process.env.CASHFREE_CLIENT_ID;
  if (cashfreeClientId) {
    if (nodeEnv === 'production' && cashfreeClientId.includes('test')) {
      errors.push('Using test Cashfree credentials in production environment');
    }
    if (nodeEnv === 'development' && !cashfreeClientId.includes('test')) {
      warnings.push('Using production Cashfree credentials in development environment');
    }
  }

  // Validate Slack configuration
  const slackClientId = process.env.SLACK_CLIENT_ID;
  if (slackClientId && slackClientId.length < 10) {
    warnings.push('SLACK_CLIENT_ID appears to be invalid (too short)');
  }

  // Database validation
  const hasDatabase = !!(
    process.env.DATABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.MONGODB_URI
  );
  if (!hasDatabase) {
    recommendations.push('Consider setting up a database for persistent data storage');
  }

  // Analytics validation
  if (!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && nodeEnv === 'production') {
    recommendations.push('Consider setting up analytics with Plausible for user insights');
  }

  // Error monitoring validation
  if (!process.env.SENTRY_DSN && nodeEnv === 'production') {
    recommendations.push('Consider setting up error monitoring with Sentry');
  }

  // Email validation
  const emailFrom = process.env.EMAIL_FROM;
  if (emailFrom && !emailFrom.includes('@')) {
    errors.push('EMAIL_FROM must be a valid email address');
  }

  // Rate limiting validation
  const rateLimit = process.env.RATE_LIMIT_MAX;
  if (rateLimit && (isNaN(Number(rateLimit)) || Number(rateLimit) < 1)) {
    warnings.push('RATE_LIMIT_MAX should be a positive number');
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Print validation results
export function printValidationResults(result: EnvValidationResult) {
  console.log('\n🔍 Environment Validation Results\n');

  if (result.valid) {
    console.log('✅ All required environment variables are properly configured!\n');
  } else {
    console.log('❌ Environment validation failed!\n');
  }

  if (result.errors.length > 0) {
    console.log('🚨 ERRORS (must fix):');
    result.errors.forEach(error => console.log(`  - ${error}`));
    console.log('');
  }

  if (result.missing.length > 0) {
    console.log('📋 MISSING REQUIRED VARIABLES:');
    result.missing.forEach(missing => console.log(`  - ${missing}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS (should fix):');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
    console.log('');
  }

  if (result.recommendations.length > 0) {
    console.log('💡 RECOMMENDATIONS:');
    result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    console.log('');
  }

  if (!result.valid) {
    console.log('Please fix the errors above before deploying to production.\n');
    process.exit(1);
  }
}

// Check if running in production
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// Get environment info
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
    hasDatabase: !!(
      process.env.DATABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.MONGODB_URI
    ),
    hasAnalytics: !!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    hasErrorMonitoring: !!process.env.SENTRY_DSN,
    hasEmail: !!process.env.RESEND_API_KEY,
    hasCaching: !!process.env.REDIS_URL,
    cashfreeMode: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  };
}

// Validate on module load in production
if (isProduction()) {
  const result = validateEnvironment();
  if (!result.valid) {
    printValidationResults(result);
  }
}
