/**
 * Onboarding Email Sequence for SummaryAI
 * Automated drip campaign using Resend with smart timing logic
 */

import { emailService } from './email-service';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface OnboardingEmailData {
  userId: string;
  userEmail: string;
  userName: string;
  signupDate: string;
  plan: 'free' | 'pro' | 'enterprise';
  hasCreatedSummary?: boolean;
  hasInvitedTeam?: boolean;
  hasExported?: boolean;
}

interface EmailSequenceStep {
  id: string;
  name: string;
  delayHours: number;
  condition?: (data: OnboardingEmailData) => boolean;
  template: string;
}

// Define the onboarding email sequence
const ONBOARDING_SEQUENCE: EmailSequenceStep[] = [
  {
    id: 'welcome',
    name: 'Welcome & Getting Started',
    delayHours: 0, // Immediate
    template: 'welcome',
  },
  {
    id: 'first_summary',
    name: 'Create Your First Summary',
    delayHours: 24,
    condition: (data) => !data.hasCreatedSummary,
    template: 'first_summary',
  },
  {
    id: 'tips_and_tricks',
    name: 'Tips & Tricks for Better Summaries',
    delayHours: 72,
    condition: (data) => !!data.hasCreatedSummary,
    template: 'tips_and_tricks',
  },
  {
    id: 'team_collaboration',
    name: 'Invite Your Team',
    delayHours: 120, // 5 days
    condition: (data) => !data.hasInvitedTeam && !!data.hasCreatedSummary,
    template: 'team_collaboration',
  },
  {
    id: 'export_features',
    name: 'Export to Your Favorite Tools',
    delayHours: 168, // 7 days
    condition: (data) => !data.hasExported && !!data.hasCreatedSummary,
    template: 'export_features',
  },
  {
    id: 'upgrade_prompt',
    name: 'Unlock Advanced Features',
    delayHours: 240, // 10 days
    condition: (data) => data.plan === 'free' && !!data.hasCreatedSummary,
    template: 'upgrade_prompt',
  },
  {
    id: 'success_stories',
    name: 'How Teams Use SummaryAI',
    delayHours: 336, // 14 days
    template: 'success_stories',
  },
];

class OnboardingEmailService {
  /**
   * Start onboarding sequence for a new user
   */
  async startOnboardingSequence(userData: OnboardingEmailData): Promise<void> {
    try {
      // Store user in onboarding sequence
      const { error } = await supabase
        .from('onboarding_sequences')
        .insert({
          user_id: userData.userId,
          user_email: userData.userEmail,
          user_name: userData.userName,
          signup_date: userData.signupDate,
          plan: userData.plan,
          current_step: 0,
          status: 'active',
          created_at: new Date().toISOString(),
        });

      if (error) {
        throw new Error(`Failed to start onboarding sequence: ${error.message}`);
      }

      // Send welcome email immediately
      await this.sendOnboardingEmail(userData, ONBOARDING_SEQUENCE[0]);

      // Schedule remaining emails
      await this.scheduleNextEmails(userData);

      console.log('Onboarding sequence started for user:', userData.userId);
    } catch (error) {
      console.error('Error starting onboarding sequence:', error);
      throw error;
    }
  }

  /**
   * Update user progress and trigger conditional emails
   */
  async updateUserProgress(userId: string, progress: Partial<OnboardingEmailData>): Promise<void> {
    try {
      // Update user progress in database
      const { error } = await supabase
        .from('onboarding_sequences')
        .update({
          has_created_summary: progress.hasCreatedSummary,
          has_invited_team: progress.hasInvitedTeam,
          has_exported: progress.hasExported,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) {
        throw new Error(`Failed to update user progress: ${error.message}`);
      }

      // Check if any conditional emails should be triggered
      await this.checkConditionalEmails(userId);

      console.log('User progress updated:', { userId, progress });
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  }

  /**
   * Send a specific onboarding email
   */
  private async sendOnboardingEmail(userData: OnboardingEmailData, step: EmailSequenceStep): Promise<void> {
    try {
      const emailData = {
        userName: userData.userName,
        userEmail: userData.userEmail,
        plan: userData.plan,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
        upgradeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/upgrade`,
        teamUrl: `${process.env.NEXT_PUBLIC_APP_URL}/team`,
        exportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=export`,
      };

      switch (step.template) {
        case 'welcome':
          await emailService.sendWelcomeEmail(emailData);
          break;
        case 'first_summary':
          await this.sendFirstSummaryEmail(emailData);
          break;
        case 'tips_and_tricks':
          await this.sendTipsAndTricksEmail(emailData);
          break;
        case 'team_collaboration':
          await this.sendTeamCollaborationEmail(emailData);
          break;
        case 'export_features':
          await this.sendExportFeaturesEmail(emailData);
          break;
        case 'upgrade_prompt':
          await this.sendUpgradePromptEmail(emailData);
          break;
        case 'success_stories':
          await this.sendSuccessStoriesEmail(emailData);
          break;
      }

      // Log email sent
      await this.logEmailSent(userData.userId, step.id);

      console.log(`Onboarding email sent: ${step.name} to ${userData.userEmail}`);
    } catch (error) {
      console.error(`Error sending onboarding email ${step.id}:`, error);
      throw error;
    }
  }

  /**
   * Schedule next emails in the sequence
   */
  private async scheduleNextEmails(userData: OnboardingEmailData): Promise<void> {
    // In a production environment, you would use a job queue like Bull or Agenda
    // For now, we'll use setTimeout for demonstration
    
    for (let i = 1; i < ONBOARDING_SEQUENCE.length; i++) {
      const step = ONBOARDING_SEQUENCE[i];
      const delayMs = step.delayHours * 60 * 60 * 1000;

      setTimeout(async () => {
        try {
          // Get latest user data
          const { data: userSequence } = await supabase
            .from('onboarding_sequences')
            .select('*')
            .eq('user_id', userData.userId)
            .single();

          if (!userSequence || userSequence.status !== 'active') {
            return; // User unsubscribed or sequence stopped
          }

          // Check if condition is met
          if (step.condition) {
            const currentUserData: OnboardingEmailData = {
              ...userData,
              hasCreatedSummary: userSequence.has_created_summary,
              hasInvitedTeam: userSequence.has_invited_team,
              hasExported: userSequence.has_exported,
            };

            if (!step.condition(currentUserData)) {
              console.log(`Skipping email ${step.id} - condition not met`);
              return;
            }
          }

          // Send the email
          await this.sendOnboardingEmail(userData, step);

          // Update current step
          await supabase
            .from('onboarding_sequences')
            .update({ current_step: i })
            .eq('user_id', userData.userId);

        } catch (error) {
          console.error(`Error in scheduled email ${step.id}:`, error);
        }
      }, delayMs);
    }
  }

  /**
   * Check and trigger conditional emails based on user actions
   */
  private async checkConditionalEmails(userId: string): Promise<void> {
    // This would implement logic to check if user actions should trigger
    // immediate emails or modify the sequence
    console.log('Checking conditional emails for user:', userId);
  }

  /**
   * Log that an email was sent
   */
  private async logEmailSent(userId: string, stepId: string): Promise<void> {
    try {
      await supabase
        .from('onboarding_email_logs')
        .insert({
          user_id: userId,
          step_id: stepId,
          sent_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging email sent:', error);
    }
  }

  /**
   * Stop onboarding sequence for a user
   */
  async stopOnboardingSequence(userId: string): Promise<void> {
    try {
      await supabase
        .from('onboarding_sequences')
        .update({
          status: 'stopped',
          stopped_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      console.log('Onboarding sequence stopped for user:', userId);
    } catch (error) {
      console.error('Error stopping onboarding sequence:', error);
    }
  }

  // Email template methods
  private async sendFirstSummaryEmail(data: any): Promise<void> {
    const subject = "Ready to create your first AI summary? 🧠";
    const html = `
      <h2>Hi ${data.userName}!</h2>
      <p>Welcome to SummaryAI! We're excited to help you transform your conversations into actionable insights.</p>
      <p>Ready to create your first summary? It takes less than 2 minutes:</p>
      <ol>
        <li>Upload a meeting transcript or paste conversation text</li>
        <li>Click "Generate Summary"</li>
        <li>Watch AI extract key points and action items</li>
      </ol>
      <a href="${data.loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Create Your First Summary</a>
      <p>Need help? Just reply to this email - we're here to help!</p>
    `;
    
    // Implementation would use your email service
    console.log('Sending first summary email to:', data.userEmail);
  }

  private async sendTipsAndTricksEmail(data: any): Promise<void> {
    const subject = "5 tips to get better AI summaries ✨";
    // Implementation for tips and tricks email
    console.log('Sending tips and tricks email to:', data.userEmail);
  }

  private async sendTeamCollaborationEmail(data: any): Promise<void> {
    const subject = "Invite your team to SummaryAI 👥";
    // Implementation for team collaboration email
    console.log('Sending team collaboration email to:', data.userEmail);
  }

  private async sendExportFeaturesEmail(data: any): Promise<void> {
    const subject = "Export summaries to Notion, PDF, and more 📊";
    // Implementation for export features email
    console.log('Sending export features email to:', data.userEmail);
  }

  private async sendUpgradePromptEmail(data: any): Promise<void> {
    const subject = "Unlock unlimited summaries with Pro 🚀";
    // Implementation for upgrade prompt email
    console.log('Sending upgrade prompt email to:', data.userEmail);
  }

  private async sendSuccessStoriesEmail(data: any): Promise<void> {
    const subject = "How teams save 10+ hours weekly with SummaryAI 📈";
    // Implementation for success stories email
    console.log('Sending success stories email to:', data.userEmail);
  }
}

export const onboardingEmailService = new OnboardingEmailService();

// Helper function to trigger onboarding for new users
export async function startUserOnboarding(userData: OnboardingEmailData): Promise<void> {
  await onboardingEmailService.startOnboardingSequence(userData);
}

// Helper function to update user progress
export async function updateOnboardingProgress(
  userId: string, 
  progress: Partial<OnboardingEmailData>
): Promise<void> {
  await onboardingEmailService.updateUserProgress(userId, progress);
}
