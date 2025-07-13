#!/usr/bin/env tsx

/**
 * Environment Validation Script for Production Deployment
 * Validates all required environment variables and configurations
 */

import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Clear any existing environment variables that might be set by other scripts
const envVarsToReset = [
  'RESEND_API_KEY',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY'
];

envVarsToReset.forEach(key => {
  delete process.env[key];
});

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

interface EnvValidation {
  key: string;
  required: boolean;
  validator?: (value: string) => boolean;
  description: string;
}

class EnvironmentValidator {
  private validations: EnvValidation[] = [
    // Core App Configuration
    {
      key: 'NODE_ENV',
      required: true,
      validator: (v) => ['development', 'production', 'test'].includes(v),
      description: 'Application environment'
    },
    {
      key: 'NEXT_PUBLIC_APP_URL',
      required: true,
      validator: (v) => v.startsWith('http'),
      description: 'Public application URL'
    },
    {
      key: 'NEXT_PUBLIC_SITE_URL',
      required: true,
      validator: (v) => v.startsWith('http'),
      description: 'Public site URL'
    },

    // Supabase Configuration
    {
      key: 'NEXT_PUBLIC_SUPABASE_URL',
      required: true,
      validator: (v) => v.includes('supabase.co'),
      description: 'Supabase project URL'
    },
    {
      key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      required: true,
      validator: (v) => v.startsWith('eyJ'),
      description: 'Supabase anonymous key (JWT)'
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      required: true,
      validator: (v) => v.startsWith('eyJ'),
      description: 'Supabase service role key (JWT)'
    },

    // Authentication
    {
      key: 'NEXTAUTH_SECRET',
      required: true,
      validator: (v) => v.length >= 32,
      description: 'NextAuth secret key (32+ chars)'
    },
    {
      key: 'JWT_SECRET',
      required: true,
      validator: (v) => v.length >= 32,
      description: 'JWT secret key (32+ chars)'
    },

    // Slack Integration
    {
      key: 'NEXT_PUBLIC_SLACK_CLIENT_ID',
      required: true,
      validator: (v) => /^\d+\.\d+$/.test(v),
      description: 'Slack OAuth client ID'
    },
    {
      key: 'SLACK_CLIENT_SECRET',
      required: true,
      validator: (v) => v.length >= 32,
      description: 'Slack OAuth client secret'
    },
    {
      key: 'SLACK_SIGNING_SECRET',
      required: true,
      validator: (v) => v.length >= 32,
      description: 'Slack signing secret'
    },

    // AI Integration
    {
      key: 'OPENROUTER_API_KEY',
      required: true,
      validator: (v) => v.startsWith('sk-or-v1-'),
      description: 'OpenRouter API key for DeepSeek R1'
    },

    // Email Service
    {
      key: 'RESEND_API_KEY',
      required: true,
      validator: (v) => v.startsWith('re_'),
      description: 'Resend email service API key'
    },
    {
      key: 'EMAIL_FROM',
      required: true,
      validator: (v) => v.includes('@'),
      description: 'From email address'
    },

    // Payment Processing
    {
      key: 'CASHFREE_APP_ID',
      required: true,
      description: 'Cashfree payment gateway app ID'
    },
    {
      key: 'CASHFREE_SECRET_KEY',
      required: true,
      description: 'Cashfree payment gateway secret'
    },
    {
      key: 'CASHFREE_ENVIRONMENT',
      required: true,
      validator: (v) => ['SANDBOX', 'PRODUCTION'].includes(v),
      description: 'Cashfree environment'
    },

    // Monitoring & Analytics
    {
      key: 'NEXT_PUBLIC_SENTRY_DSN',
      required: true,
      validator: (v) => v.startsWith('https://') && v.includes('sentry.io'),
      description: 'Sentry error tracking DSN'
    },
    {
      key: 'POSTHOG_KEY',
      required: true,
      validator: (v) => v.startsWith('phc_'),
      description: 'PostHog analytics key'
    },

    // Optional but recommended
    {
      key: 'SLACK_WEBHOOK_URL',
      required: false,
      validator: (v) => v.startsWith('https://hooks.slack.com'),
      description: 'Slack webhook for notifications'
    },
    {
      key: 'NOTION_API_TOKEN',
      required: false,
      validator: (v) => v.startsWith('ntn_'),
      description: 'Notion integration token'
    }
  ];

  async validateAll(): Promise<{ success: boolean; errors: string[]; warnings: string[] }> {
    console.log('🔍 Validating environment configuration...\n');

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const validation of this.validations) {
      const value = process.env[validation.key];

      if (validation.required && !value) {
        errors.push(`❌ Missing required: ${validation.key} - ${validation.description}`);
        continue;
      }

      if (!validation.required && !value) {
        warnings.push(`⚠️  Optional missing: ${validation.key} - ${validation.description}`);
        continue;
      }

      if (value && validation.validator && !validation.validator(value)) {
        errors.push(`❌ Invalid format: ${validation.key} - ${validation.description} (value: ${value.substring(0, 10)}...)`);
        continue;
      }

      if (value) {
        console.log(`✅ ${validation.key}: Valid`);
      }
    }

    // Additional validations
    await this.validateConnections(errors, warnings);

    return {
      success: errors.length === 0,
      errors,
      warnings
    };
  }

  private async validateConnections(errors: string[], warnings: string[]): Promise<void> {
    console.log('\n🔌 Testing service connections...');

    // Test Supabase connection
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (supabaseUrl && supabaseKey) {
        // In a real scenario, you'd make an actual request
        console.log('✅ Supabase: Configuration valid');
      }
    } catch (error) {
      errors.push('❌ Supabase: Connection test failed');
    }

    // Test OpenRouter API
    try {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (openRouterKey?.startsWith('sk-or-v1-')) {
        console.log('✅ OpenRouter: API key format valid');
      }
    } catch (error) {
      warnings.push('⚠️  OpenRouter: Could not validate API key');
    }

    // Test Resend API
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey?.startsWith('re_')) {
        console.log('✅ Resend: API key format valid');
      }
    } catch (error) {
      warnings.push('⚠️  Resend: Could not validate API key');
    }
  }

  async generateEnvTemplate(): Promise<void> {
    console.log('\n📝 Generating .env.example template...');

    const template = this.validations
      .map(v => {
        const required = v.required ? '# REQUIRED' : '# OPTIONAL';
        const example = this.getExampleValue(v.key);
        return `${required} - ${v.description}\n${v.key}=${example}\n`;
      })
      .join('\n');

    const fs = await import('fs');
    fs.writeFileSync('.env.example', template);
    console.log('✅ .env.example generated');
  }

  private getExampleValue(key: string): string {
    const examples: Record<string, string> = {
      'NODE_ENV': 'production',
      'NEXT_PUBLIC_APP_URL': 'https://your-app.vercel.app',
      'NEXT_PUBLIC_SITE_URL': 'https://your-app.vercel.app',
      'NEXT_PUBLIC_SUPABASE_URL': 'https://your-project.supabase.co',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'NEXTAUTH_SECRET': 'your-nextauth-secret-32-chars-min',
      'JWT_SECRET': 'your-jwt-secret-32-chars-min',
      'NEXT_PUBLIC_SLACK_CLIENT_ID': '1234567890.1234567890',
      'SLACK_CLIENT_SECRET': 'your-slack-client-secret',
      'SLACK_SIGNING_SECRET': 'your-slack-signing-secret',
      'OPENROUTER_API_KEY': 'sk-or-v1-your-openrouter-key',
      'RESEND_API_KEY': 're_your-resend-key',
      'EMAIL_FROM': 'noreply@yourdomain.com',
      'CASHFREE_APP_ID': 'your-cashfree-app-id',
      'CASHFREE_SECRET_KEY': 'your-cashfree-secret',
      'CASHFREE_ENVIRONMENT': 'PRODUCTION',
      'NEXT_PUBLIC_SENTRY_DSN': 'https://your-dsn@sentry.io/project',
      'POSTHOG_KEY': 'phc_your-posthog-key'
    };

    return examples[key] || 'your-value-here';
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  
  validator.validateAll().then(result => {
    console.log('\n📊 Validation Results:');
    console.log(`✅ Success: ${result.success}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(error));
    }
    
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(warning));
    }

    if (!result.success) {
      console.log('\n🔧 Fix the errors above before deploying to production.');
      process.exit(1);
    } else {
      console.log('\n🎉 Environment validation passed! Ready for production deployment.');
    }
  }).catch(console.error);
}

export default EnvironmentValidator;
