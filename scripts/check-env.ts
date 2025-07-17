#!/usr/bin/env node

/**
 * Environment Validation Script for Slack Summary Scribe
 * 
 * Validates environment configuration and warns about potential SSL/protocol issues
 * in development vs production environments.
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: '.env.local' });

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validate environment configuration
 */
function validateEnvironment(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    warnings: [],
    errors: []
  };

  // Force development mode for localhost URLs
  let isDevelopment = process.env.NODE_ENV === 'development';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  // If site URL contains localhost, treat as development regardless of NODE_ENV
  if (siteUrl && (siteUrl.includes('localhost') || siteUrl.includes('127.0.0.1'))) {
    isDevelopment = true;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  console.log('🔍 Environment Validation for Slack Summary Scribe\n');
  console.log(`Environment: ${isDevelopment ? 'Development' : 'Production'}`);
  console.log(`Site URL: ${siteUrl || 'Not set'}`);
  console.log(`App URL: ${appUrl || 'Not set'}`);
  console.log(`NextAuth URL: ${nextAuthUrl || 'Not set'}\n`);

  // Check for .env.local file
  if (!existsSync('.env.local')) {
    result.errors.push('Missing .env.local file');
    result.isValid = false;
  }

  // Validate NEXT_PUBLIC_SITE_URL
  if (siteUrl) {
    if (isDevelopment) {
      // Development: Should use HTTP localhost
      if (siteUrl.startsWith('https://localhost')) {
        result.warnings.push(
          'NEXT_PUBLIC_SITE_URL uses HTTPS in development. This may cause SSL protocol errors.\n' +
          'Consider using http://localhost:3000 for local development.'
        );
      } else if (!siteUrl.startsWith('http://localhost')) {
        result.warnings.push(
          'NEXT_PUBLIC_SITE_URL should use localhost in development.\n' +
          'Current value may cause connection issues.'
        );
      } else {
        console.log('✅ Site URL correctly configured for development');
      }
    } else {
      // Production: Should use HTTPS
      if (!siteUrl.startsWith('https://')) {
        result.errors.push('NEXT_PUBLIC_SITE_URL must use HTTPS in production');
        result.isValid = false;
      } else {
        console.log('✅ Site URL correctly configured for production');
      }
    }
  } else {
    result.warnings.push('NEXT_PUBLIC_SITE_URL is not set');
  }

  // Validate port consistency
  if (isDevelopment && siteUrl) {
    const urlMatch = siteUrl.match(/:(\d+)/);
    const port = urlMatch ? urlMatch[1] : '3000';
    const expectedPort = process.env.PORT || '3000';
    
    if (port !== expectedPort) {
      result.warnings.push(
        `Port mismatch: NEXT_PUBLIC_SITE_URL uses port ${port} but expected port is ${expectedPort}`
      );
    }
  }

  // Validate Supabase configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    result.errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
    result.isValid = false;
  } else if (!supabaseUrl.startsWith('https://')) {
    result.errors.push('NEXT_PUBLIC_SUPABASE_URL must use HTTPS');
    result.isValid = false;
  }

  if (!supabaseKey) {
    result.errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
    result.isValid = false;
  }

  return result;
}

/**
 * Main validation function
 */
function main() {
  const result = validateEnvironment();

  // Display warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.log(`   ${warning}`);
    });
    console.log('');
  }

  // Display errors
  if (result.errors.length > 0) {
    console.log('❌ Errors:');
    result.errors.forEach(error => {
      console.log(`   ${error}`);
    });
    console.log('');
  }

  // Final result
  if (result.isValid) {
    console.log('✅ Environment validation passed!');
    if (result.warnings.length === 0) {
      console.log('🎉 No issues found - ready for development/deployment!');
    }
  } else {
    console.log('❌ Environment validation failed!');
    console.log('Please fix the errors above before proceeding.');
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  main();
}

export { validateEnvironment };
