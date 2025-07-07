/**
 * Email Notification Service
 * Handles all email communications including summary completion, usage warnings, etc.
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailNotificationData {
  to: string;
  from?: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export class EmailNotificationService {
  private static apiKey = process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY;
  private static fromEmail = process.env.FROM_EMAIL || 'noreply@summaryai.com';

  /**
   * Send summary completion notification
   */
  static async sendSummaryCompleted(data: {
    to: string;
    userName: string;
    summaryTitle: string;
    summaryId: string;
    confidence: number;
    processingTime: number;
  }) {
    const template = this.getSummaryCompletedTemplate(data);
    
    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      template: 'summary_completed',
      data
    });
  }

  /**
   * Send usage warning notification
   */
  static async sendUsageWarning(data: {
    to: string;
    userName: string;
    currentUsage: number;
    limit: number;
    plan: string;
    percentageUsed: number;
  }) {
    const template = this.getUsageWarningTemplate(data);
    
    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      template: 'usage_warning',
      data
    });
  }

  /**
   * Send weekly digest
   */
  static async sendWeeklyDigest(data: {
    to: string;
    userName: string;
    summariesCount: number;
    topSkills: string[];
    keyInsights: string[];
    weekStart: string;
    weekEnd: string;
  }) {
    const template = this.getWeeklyDigestTemplate(data);
    
    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      template: 'weekly_digest',
      data
    });
  }

  /**
   * Send welcome email
   */
  static async sendWelcomeEmail(data: {
    to: string;
    userName: string;
    plan: string;
  }) {
    const template = this.getWelcomeTemplate(data);
    
    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      template: 'welcome',
      data
    });
  }

  /**
   * Send team invitation
   */
  static async sendTeamInvitation(data: {
    to: string;
    inviterName: string;
    teamName: string;
    inviteLink: string;
  }) {
    const template = this.getTeamInvitationTemplate(data);
    
    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      template: 'team_invitation',
      data
    });
  }

  /**
   * Send referral reward notification
   */
  static async sendReferralReward(data: {
    to: string;
    userName: string;
    referredUserName: string;
    rewardType: string;
    rewardValue: string;
  }) {
    const template = this.getReferralRewardTemplate(data);
    
    return this.sendEmail({
      to: data.to,
      subject: template.subject,
      template: 'referral_reward',
      data
    });
  }

  /**
   * Core email sending function
   */
  private static async sendEmail(notification: EmailNotificationData): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email notification (dev mode):', {
          to: notification.to,
          subject: notification.subject,
          template: notification.template,
          data: notification.data
        });
        return true;
      }

      // Use SendGrid or Resend for production
      if (process.env.SENDGRID_API_KEY) {
        return await this.sendWithSendGrid(notification);
      } else if (process.env.RESEND_API_KEY) {
        return await this.sendWithResend(notification);
      } else {
        console.warn('No email service configured');
        return false;
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  /**
   * Send email using SendGrid
   */
  private static async sendWithSendGrid(notification: EmailNotificationData): Promise<boolean> {
    try {
      const { default: sgMail } = await import('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

      const template = this.getEmailTemplate(notification.template, notification.data);

      const msg = {
        to: notification.to,
        from: this.fromEmail,
        subject: notification.subject,
        text: template.text,
        html: template.html,
      };

      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('SendGrid error:', error);
      return false;
    }
  }

  /**
   * Send email using Resend
   */
  private static async sendWithResend(notification: EmailNotificationData): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [notification.to],
          subject: notification.subject,
          html: this.getEmailTemplate(notification.template, notification.data).html,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Resend error:', error);
      return false;
    }
  }

  /**
   * Get email template by type
   */
  private static getEmailTemplate(templateType: string, data: Record<string, any>): EmailTemplate {
    switch (templateType) {
      case 'summary_completed':
        return this.getSummaryCompletedTemplate(data);
      case 'usage_warning':
        return this.getUsageWarningTemplate(data);
      case 'weekly_digest':
        return this.getWeeklyDigestTemplate(data);
      case 'welcome':
        return this.getWelcomeTemplate(data);
      case 'team_invitation':
        return this.getTeamInvitationTemplate(data);
      case 'referral_reward':
        return this.getReferralRewardTemplate(data);
      default:
        throw new Error(`Unknown email template: ${templateType}`);
    }
  }

  /**
   * Summary completed email template
   */
  private static getSummaryCompletedTemplate(data: any): EmailTemplate {
    return {
      subject: `✅ Your summary "${data.summaryTitle}" is ready`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Summary Ready! 🎉</h2>
          <p>Hi ${data.userName},</p>
          <p>Your AI summary "<strong>${data.summaryTitle}</strong>" has been completed and is ready for review.</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Summary Details:</h3>
            <ul>
              <li><strong>Confidence Score:</strong> ${(data.confidence * 100).toFixed(1)}%</li>
              <li><strong>Processing Time:</strong> ${(data.processingTime / 1000).toFixed(1)} seconds</li>
            </ul>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/summaries/${data.summaryId}" 
             style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Summary
          </a>
          
          <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
            Best regards,<br>
            The SummaryAI Team
          </p>
        </div>
      `,
      text: `Hi ${data.userName},\n\nYour AI summary "${data.summaryTitle}" is ready! Confidence: ${(data.confidence * 100).toFixed(1)}%, Processing time: ${(data.processingTime / 1000).toFixed(1)}s\n\nView it here: ${process.env.NEXT_PUBLIC_APP_URL}/summaries/${data.summaryId}\n\nBest regards,\nThe SummaryAI Team`
    };
  }

  /**
   * Usage warning email template
   */
  private static getUsageWarningTemplate(data: any): EmailTemplate {
    const isNearLimit = data.percentageUsed >= 80;
    const emoji = isNearLimit ? '⚠️' : '📊';
    
    return {
      subject: `${emoji} Usage Update: ${data.percentageUsed}% of your ${data.plan} plan used`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${isNearLimit ? '#EF4444' : '#F59E0B'};">Usage Update ${emoji}</h2>
          <p>Hi ${data.userName},</p>
          <p>You've used <strong>${data.currentUsage} out of ${data.limit}</strong> summaries this month (${data.percentageUsed}% of your ${data.plan} plan).</p>
          
          ${isNearLimit ? `
            <div style="background: #FEF2F2; border: 1px solid #FECACA; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #DC2626; margin-top: 0;">Action Required</h3>
              <p>You're approaching your monthly limit. Consider upgrading to continue creating summaries without interruption.</p>
            </div>
          ` : ''}
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" 
             style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            ${isNearLimit ? 'Upgrade Plan' : 'View Usage'}
          </a>
          
          <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
            Best regards,<br>
            The SummaryAI Team
          </p>
        </div>
      `,
      text: `Hi ${data.userName},\n\nUsage update: ${data.currentUsage}/${data.limit} summaries used (${data.percentageUsed}% of ${data.plan} plan).\n\n${isNearLimit ? 'Consider upgrading: ' : 'View usage: '}${process.env.NEXT_PUBLIC_APP_URL}/pricing\n\nBest regards,\nThe SummaryAI Team`
    };
  }

  /**
   * Weekly digest email template
   */
  private static getWeeklyDigestTemplate(data: any): EmailTemplate {
    return {
      subject: `📊 Your weekly SummaryAI digest - ${data.summariesCount} summaries created`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Weekly Digest 📊</h2>
          <p>Hi ${data.userName},</p>
          <p>Here's your summary activity for ${data.weekStart} - ${data.weekEnd}:</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">This Week's Highlights:</h3>
            <ul>
              <li><strong>${data.summariesCount}</strong> summaries created</li>
              <li><strong>Top skills:</strong> ${data.topSkills.join(', ')}</li>
            </ul>
            
            <h4>Key Insights:</h4>
            <ul>
              ${data.keyInsights.map((insight: string) => `<li>${insight}</li>`).join('')}
            </ul>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
          
          <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
            Best regards,<br>
            The SummaryAI Team
          </p>
        </div>
      `,
      text: `Hi ${data.userName},\n\nWeekly digest (${data.weekStart} - ${data.weekEnd}):\n- ${data.summariesCount} summaries created\n- Top skills: ${data.topSkills.join(', ')}\n\nView dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nBest regards,\nThe SummaryAI Team`
    };
  }

  /**
   * Welcome email template
   */
  private static getWelcomeTemplate(data: any): EmailTemplate {
    return {
      subject: `Welcome to SummaryAI! 🎉`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Welcome to SummaryAI! 🎉</h2>
          <p>Hi ${data.userName},</p>
          <p>Welcome to SummaryAI! We're excited to help you transform your team conversations into actionable insights.</p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your ${data.plan} Plan Includes:</h3>
            <ul>
              <li>AI-powered conversation summaries</li>
              <li>Slack integration</li>
              <li>Export to multiple formats</li>
              <li>Team collaboration features</li>
            </ul>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Get Started
          </a>
          
          <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
            Need help? Reply to this email or visit our help center.<br><br>
            Best regards,<br>
            The SummaryAI Team
          </p>
        </div>
      `,
      text: `Hi ${data.userName},\n\nWelcome to SummaryAI! Your ${data.plan} plan is ready.\n\nGet started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard\n\nBest regards,\nThe SummaryAI Team`
    };
  }

  /**
   * Team invitation email template
   */
  private static getTeamInvitationTemplate(data: any): EmailTemplate {
    return {
      subject: `${data.inviterName} invited you to join ${data.teamName} on SummaryAI`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">You're Invited! 🎉</h2>
          <p>${data.inviterName} has invited you to join <strong>${data.teamName}</strong> on SummaryAI.</p>
          <p>SummaryAI helps teams transform conversations into actionable insights with AI-powered summaries.</p>
          
          <a href="${data.inviteLink}" 
             style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
          
          <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
            This invitation will expire in 7 days.<br><br>
            Best regards,<br>
            The SummaryAI Team
          </p>
        </div>
      `,
      text: `${data.inviterName} invited you to join ${data.teamName} on SummaryAI.\n\nAccept invitation: ${data.inviteLink}\n\nBest regards,\nThe SummaryAI Team`
    };
  }

  /**
   * Referral reward email template
   */
  private static getReferralRewardTemplate(data: any): EmailTemplate {
    return {
      subject: `🎉 You earned ${data.rewardValue} for referring ${data.referredUserName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Referral Reward! 🎉</h2>
          <p>Hi ${data.userName},</p>
          <p>Great news! <strong>${data.referredUserName}</strong> just signed up using your referral link.</p>
          
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">You've earned: ${data.rewardValue}</h3>
            <p>Your ${data.rewardType} has been applied to your account.</p>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/referrals" 
             style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Referrals
          </a>
          
          <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
            Keep sharing to earn more rewards!<br><br>
            Best regards,<br>
            The SummaryAI Team
          </p>
        </div>
      `,
      text: `Hi ${data.userName},\n\n${data.referredUserName} signed up with your referral! You earned: ${data.rewardValue}\n\nView referrals: ${process.env.NEXT_PUBLIC_APP_URL}/referrals\n\nBest regards,\nThe SummaryAI Team`
    };
  }
}
