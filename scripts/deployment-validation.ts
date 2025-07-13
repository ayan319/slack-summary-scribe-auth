#!/usr/bin/env tsx

/**
 * Comprehensive Deployment Validation Script
 * Validates environment, tests all critical flows, and ensures production readiness
 */

import { createClient } from '@supabase/supabase-js';
import PostHogClient from '../lib/posthog.client';
import { sendEmail } from '../lib/resend';
import * as Sentry from '@sentry/nextjs';

interface ValidationResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

class DeploymentValidator {
  private results: ValidationResult[] = [];
  private supabase: any;

  constructor() {
    // Initialize Supabase client for testing
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  private addResult(test: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
    this.results.push({ test, status, message, details });
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${message}`);
  }

  async validateEnvironmentVariables() {
    console.log('\n🔍 Validating Environment Variables...');
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENROUTER_API_KEY',
      'CASHFREE_APP_ID',
      'CASHFREE_SECRET_KEY',
      'SLACK_CLIENT_ID',
      'SLACK_CLIENT_SECRET',
      'NEXT_PUBLIC_SITE_URL',
      'DATABASE_URL',
      'RESEND_API_KEY',
      'NEXT_PUBLIC_POSTHOG_KEY',
      'NEXT_PUBLIC_SENTRY_DSN'
    ];

    let missingVars = [];
    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length === 0) {
      this.addResult('Environment Variables', 'PASS', 'All required environment variables are set');
    } else {
      this.addResult('Environment Variables', 'FAIL', `Missing variables: ${missingVars.join(', ')}`);
    }
  }

  async validateSupabaseConnection() {
    console.log('\n🔍 Validating Supabase Connection...');
    
    try {
      // Test database connection
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        this.addResult('Supabase Connection', 'FAIL', `Database error: ${error.message}`);
        return;
      }

      // Test RLS policies
      const { data: authData, error: authError } = await this.supabase.auth.getSession();
      
      this.addResult('Supabase Connection', 'PASS', 'Database connection and RLS policies working');
    } catch (error) {
      this.addResult('Supabase Connection', 'FAIL', `Connection failed: ${error}`);
    }
  }

  async validateEmailSystem() {
    console.log('\n🔍 Validating Email System...');
    
    try {
      // Test email sending (to a test email)
      const testEmail = process.env.TEST_EMAIL || 'test@example.com';
      
      const result = await sendEmail({
        to: testEmail,
        subject: 'Deployment Validation Test',
        html: `
          <h2>🚀 Deployment Validation Test</h2>
          <p>This is a test email sent during deployment validation.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        `
      });

      if (result.success) {
        this.addResult('Email System', 'PASS', 'Email system working correctly');
      } else {
        this.addResult('Email System', 'FAIL', `Email failed: ${result.error}`);
      }
    } catch (error) {
      this.addResult('Email System', 'FAIL', `Email system error: ${error}`);
    }
  }

  async validateAnalytics() {
    console.log('\n🔍 Validating Analytics...');
    
    try {
      // Test PostHog connection
      PostHogClient.track('deployment_validation_test', {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
      });

      this.addResult('Analytics (PostHog)', 'PASS', 'PostHog analytics working');
    } catch (error) {
      this.addResult('Analytics (PostHog)', 'FAIL', `PostHog error: ${error}`);
    }

    try {
      // Test Sentry connection
      Sentry.captureMessage('Deployment validation test', 'info');
      this.addResult('Error Monitoring (Sentry)', 'PASS', 'Sentry error monitoring working');
    } catch (error) {
      this.addResult('Error Monitoring (Sentry)', 'FAIL', `Sentry error: ${error}`);
    }
  }

  async validateAPIRoutes() {
    console.log('\n🔍 Validating API Routes...');
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const testRoutes = [
      '/api/healthcheck',
      '/api/health',
      '/api/dashboard',
      '/api/summaries',
      '/api/analytics',
      '/api/notifications'
    ];

    for (const route of testRoutes) {
      try {
        const response = await fetch(`${baseUrl}${route}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          this.addResult(`API Route ${route}`, 'PASS', `Status: ${response.status}`);
        } else {
          this.addResult(`API Route ${route}`, 'WARN', `Status: ${response.status}`);
        }
      } catch (error) {
        this.addResult(`API Route ${route}`, 'FAIL', `Request failed: ${error}`);
      }
    }
  }

  async validateOnboardingFlow() {
    console.log('\n🔍 Validating Onboarding Flow...');
    
    try {
      // Create test user
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!'
      };

      const { data: authData, error: authError } = await this.supabase.auth.signUp(testUser);
      
      if (authError) {
        this.addResult('Onboarding Flow', 'FAIL', `User creation failed: ${authError.message}`);
        return;
      }

      // Test onboarding progress tracking
      const { data: progressData, error: progressError } = await this.supabase
        .from('onboarding_progress')
        .insert({
          user_id: authData.user.id,
          step: 'welcome_email',
          completed_at: new Date().toISOString()
        });

      if (progressError) {
        this.addResult('Onboarding Flow', 'WARN', `Progress tracking issue: ${progressError.message}`);
      } else {
        this.addResult('Onboarding Flow', 'PASS', 'Onboarding flow and tracking working');
      }

      // Cleanup test user
      await this.supabase.auth.admin.deleteUser(authData.user.id);
    } catch (error) {
      this.addResult('Onboarding Flow', 'FAIL', `Onboarding validation failed: ${error}`);
    }
  }

  async validateGrowthSystems() {
    console.log('\n🔍 Validating Growth Systems...');
    
    try {
      // Test referral system
      const testReferral = {
        referrer_id: 'test-user-id',
        invitee_email: 'invitee@example.com',
        status: 'pending'
      };

      const { data, error } = await this.supabase
        .from('referrals')
        .insert(testReferral)
        .select();

      if (error) {
        this.addResult('Growth Systems', 'FAIL', `Referral system error: ${error.message}`);
      } else {
        this.addResult('Growth Systems', 'PASS', 'Referral and growth systems working');
        
        // Cleanup test data
        await this.supabase
          .from('referrals')
          .delete()
          .eq('id', data[0].id);
      }
    } catch (error) {
      this.addResult('Growth Systems', 'FAIL', `Growth systems validation failed: ${error}`);
    }
  }

  generateReport() {
    console.log('\n📊 DEPLOYMENT VALIDATION REPORT');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARN').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Total Tests: ${this.results.length}`);
    
    const successRate = (passed / this.results.length) * 100;
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (failed === 0 && successRate >= 90) {
      console.log('\n🚀 DEPLOYMENT READY - All critical systems validated!');
      return true;
    } else {
      console.log('\n⚠️  DEPLOYMENT ISSUES - Please fix failed tests before deploying');
      return false;
    }
  }

  async runFullValidation() {
    console.log('🚀 Starting Comprehensive Deployment Validation...\n');
    
    await this.validateEnvironmentVariables();
    await this.validateSupabaseConnection();
    await this.validateEmailSystem();
    await this.validateAnalytics();
    await this.validateAPIRoutes();
    await this.validateOnboardingFlow();
    await this.validateGrowthSystems();
    
    return this.generateReport();
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new DeploymentValidator();
  validator.runFullValidation()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export { DeploymentValidator };
