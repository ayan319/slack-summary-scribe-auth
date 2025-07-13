#!/usr/bin/env tsx

/**
 * End-to-End Onboarding Flow Testing
 * Tests complete user journey from signup to first summary
 */

// Mock environment variables for testing
process.env.RESEND_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';

import { createClient } from '@supabase/supabase-js';
import { sendOnboardingEmail, scheduleOnboardingSequence } from '../lib/onboarding-automation';
import { satisfactionSurveys } from '../lib/satisfaction-surveys';
import { createReferralCode } from '../lib/viral-growth';
import PostHogClient from '../lib/posthog.client';

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration: number;
  data?: any;
}

class OnboardingE2ETest {
  private results: TestResult[] = [];
  private supabase: any;
  private testUser: any;
  private startTime: number = 0;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  private addResult(step: string, status: 'PASS' | 'FAIL', message: string, data?: any) {
    const duration = Date.now() - this.startTime;
    this.results.push({ step, status, message, duration, data });
    
    const emoji = status === 'PASS' ? '✅' : '❌';
    console.log(`${emoji} ${step}: ${message} (${duration}ms)`);
  }

  async step1_UserSignup() {
    console.log('\n🔄 Step 1: User Signup...');
    this.startTime = Date.now();

    try {
      const testEmail = `e2e-test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';

      const { data, error } = await this.supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'E2E Test User',
            company: 'Test Company'
          }
        }
      });

      if (error) {
        this.addResult('User Signup', 'FAIL', `Signup failed: ${error.message}`);
        return false;
      }

      this.testUser = data.user;
      this.addResult('User Signup', 'PASS', `User created: ${testEmail}`);
      return true;
    } catch (error) {
      this.addResult('User Signup', 'FAIL', `Signup error: ${error}`);
      return false;
    }
  }

  async step2_WorkspaceCreation() {
    console.log('\n🔄 Step 2: Workspace Creation...');
    this.startTime = Date.now();

    try {
      // Create default workspace for user
      const { data, error } = await this.supabase
        .from('workspaces')
        .insert({
          name: 'Default Workspace',
          owner_id: this.testUser.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        this.addResult('Workspace Creation', 'FAIL', `Workspace creation failed: ${error.message}`);
        return false;
      }

      // Add user to workspace
      const { error: memberError } = await this.supabase
        .from('workspace_members')
        .insert({
          workspace_id: data.id,
          user_id: this.testUser.id,
          role: 'owner'
        });

      if (memberError) {
        this.addResult('Workspace Creation', 'FAIL', `Member addition failed: ${memberError.message}`);
        return false;
      }

      this.addResult('Workspace Creation', 'PASS', `Workspace created: ${data.name}`);
      return true;
    } catch (error) {
      this.addResult('Workspace Creation', 'FAIL', `Workspace error: ${error}`);
      return false;
    }
  }

  async step3_OnboardingEmailSequence() {
    console.log('\n🔄 Step 3: Onboarding Email Sequence...');
    this.startTime = Date.now();

    try {
      // Trigger welcome email
      const welcomeResult = await sendOnboardingEmail({
        id: this.testUser.id,
        email: this.testUser.email,
        name: this.testUser.name,
        signupDate: new Date(),
        plan: 'free',
        onboardingStep: 1,
        hasConnectedSlack: false,
        hasCreatedSummary: false,
        hasUploadedFile: false
      }, 'welcome');
      if (!welcomeResult.success) {
        this.addResult('Welcome Email', 'FAIL', `Welcome email failed: ${welcomeResult.error}`);
        return false;
      }

      // Track onboarding event
      PostHogClient.track('onboarding_step_completed', {
        user_id: this.testUser.id,
        step: 'welcome_email'
      });

      // Trigger feature introduction email
      const featureResult = await sendOnboardingEmail({
        id: this.testUser.id,
        email: this.testUser.email,
        name: this.testUser.name,
        signupDate: new Date(),
        plan: 'free',
        onboardingStep: 2,
        hasConnectedSlack: false,
        hasCreatedSummary: false,
        hasUploadedFile: false
      }, 'getting_started');
      if (!featureResult.success) {
        this.addResult('Feature Email', 'FAIL', `Feature email failed: ${featureResult.error}`);
        return false;
      }

      this.addResult('Onboarding Email Sequence', 'PASS', 'All onboarding emails sent successfully');
      return true;
    } catch (error) {
      this.addResult('Onboarding Email Sequence', 'FAIL', `Email sequence error: ${error}`);
      return false;
    }
  }

  async step4_SlackIntegrationFlow() {
    console.log('\n🔄 Step 4: Slack Integration Flow...');
    this.startTime = Date.now();

    try {
      // Simulate Slack OAuth completion
      const { data, error } = await this.supabase
        .from('slack_integrations')
        .insert({
          user_id: this.testUser.id,
          team_id: 'T1234567890',
          team_name: 'Test Team',
          access_token: 'xoxb-test-token',
          bot_user_id: 'U1234567890',
          is_active: true
        })
        .select()
        .single();

      if (error) {
        this.addResult('Slack Integration', 'FAIL', `Slack integration failed: ${error.message}`);
        return false;
      }

      // Track integration completion
      PostHogClient.track('onboarding_step_completed', {
        user_id: this.testUser.id,
        step: 'slack_connected'
      });

      this.addResult('Slack Integration Flow', 'PASS', 'Slack integration completed');
      return true;
    } catch (error) {
      this.addResult('Slack Integration Flow', 'FAIL', `Integration error: ${error}`);
      return false;
    }
  }

  async step5_FirstSummaryGeneration() {
    console.log('\n🔄 Step 5: First Summary Generation...');
    this.startTime = Date.now();

    try {
      // Create test summary
      const { data, error } = await this.supabase
        .from('summaries')
        .insert({
          user_id: this.testUser.id,
          title: 'Test Summary - E2E Flow',
          content: 'This is a test summary generated during E2E testing.',
          channel_name: '#general',
          message_count: 10,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        this.addResult('Summary Generation', 'FAIL', `Summary creation failed: ${error.message}`);
        return false;
      }

      // Track summary generation
      PostHogClient.track('summary_generated', {
        user_id: this.testUser.id,
        summary_id: data.id,
        channel: '#general',
        message_count: 10
      });

      // Track onboarding completion
      PostHogClient.track('onboarding_step_completed', {
        user_id: this.testUser.id,
        step: 'first_summary'
      });

      this.addResult('First Summary Generation', 'PASS', `Summary created: ${data.title}`);
      return true;
    } catch (error) {
      this.addResult('First Summary Generation', 'FAIL', `Summary error: ${error}`);
      return false;
    }
  }

  async step6_SatisfactionSurvey() {
    console.log('\n🔄 Step 6: Satisfaction Survey...');
    this.startTime = Date.now();

    try {
      // Trigger satisfaction survey
      const surveyResult = await satisfactionSurveys.trigger({
        userId: this.testUser.id,
        trigger: 'post_summary',
        context: { summaryId: 'test-summary-id' }
      });
      
      if (!surveyResult.success) {
        this.addResult('Satisfaction Survey', 'FAIL', 'Survey trigger failed');
        return false;
      }

      this.addResult('Satisfaction Survey', 'PASS', 'Satisfaction survey sent successfully');
      return true;
    } catch (error) {
      this.addResult('Satisfaction Survey', 'FAIL', `Survey error: ${error}`);
      return false;
    }
  }

  async step7_ReferralFlow() {
    console.log('\n🔄 Step 7: Referral Flow...');
    this.startTime = Date.now();

    try {
      // Create referral code
      const referralResult = await createReferralCode(
        this.testUser.id,
        this.testUser.email,
        this.testUser.name
      );

      if (!referralResult.success) {
        this.addResult('Referral Flow', 'FAIL', `Referral failed: ${referralResult.error}`);
        return false;
      }

      this.addResult('Referral Flow', 'PASS', 'Referral invitation created successfully');
      return true;
    } catch (error) {
      this.addResult('Referral Flow', 'FAIL', `Referral error: ${error}`);
      return false;
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      if (this.testUser) {
        // Delete test user and related data
        await this.supabase.auth.admin.deleteUser(this.testUser.id);
        console.log('✅ Test user cleaned up');
      }
    } catch (error) {
      console.log('⚠️  Cleanup warning:', error);
    }
  }

  generateReport() {
    console.log('\n📊 E2E ONBOARDING TEST REPORT');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total Steps: ${this.results.length}`);
    console.log(`⏱️  Total Duration: ${totalDuration}ms`);
    
    const successRate = (passed / this.results.length) * 100;
    console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (failed === 0) {
      console.log('\n🚀 ONBOARDING FLOW VALIDATED - Ready for production!');
      return true;
    } else {
      console.log('\n⚠️  ONBOARDING ISSUES - Please fix failed steps');
      
      // Show failed steps
      console.log('\nFailed Steps:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  ❌ ${r.step}: ${r.message}`));
      
      return false;
    }
  }

  async runFullTest() {
    console.log('🚀 Starting E2E Onboarding Flow Test...\n');
    
    try {
      const step1 = await this.step1_UserSignup();
      if (!step1) return false;

      const step2 = await this.step2_WorkspaceCreation();
      if (!step2) return false;

      const step3 = await this.step3_OnboardingEmailSequence();
      if (!step3) return false;

      const step4 = await this.step4_SlackIntegrationFlow();
      if (!step4) return false;

      const step5 = await this.step5_FirstSummaryGeneration();
      if (!step5) return false;

      const step6 = await this.step6_SatisfactionSurvey();
      if (!step6) return false;

      const step7 = await this.step7_ReferralFlow();
      if (!step7) return false;

      return this.generateReport();
    } catch (error) {
      console.error('❌ E2E test failed:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }
}

// Run test if called directly
if (require.main === module) {
  const test = new OnboardingE2ETest();
  test.runFullTest()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    });
}

export { OnboardingE2ETest };
