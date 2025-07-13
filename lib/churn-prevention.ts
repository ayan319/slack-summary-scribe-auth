import { sendEmail } from './resend';
import { slackNotifications } from './slack-notifications';
import { trackFeatureUsage } from './analytics';

// Churn prevention configuration
export const CHURN_PREVENTION_CONFIG = {
  inactivityThresholds: {
    warning: 7 * 24 * 60 * 60 * 1000, // 7 days
    critical: 14 * 24 * 60 * 60 * 1000, // 14 days
    churn: 30 * 24 * 60 * 60 * 1000 // 30 days
  },
  emailSequences: {
    inactivityWarning: {
      subject: 'We miss you! Come back and create amazing summaries 💙',
      template: 'inactivity_warning'
    },
    inactivityCritical: {
      subject: 'Your account needs attention - Don\'t lose your progress! ⚠️',
      template: 'inactivity_critical'
    },
    winBack: {
      subject: 'Special offer: Come back with 50% off Pro! 🎁',
      template: 'win_back'
    },
    feedbackRequest: {
      subject: 'Help us improve - Quick 2-minute feedback 📝',
      template: 'feedback_request'
    }
  }
};

// User activity data interface
export interface UserActivity {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  signupDate: Date;
  lastActiveDate: Date;
  lastSummaryDate?: Date;
  lastSlackActivity?: Date;
  totalSummaries: number;
  totalUploads: number;
  hasConnectedSlack: boolean;
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  lastChurnEmail?: Date;
  unsubscribed: boolean;
}

// Calculate churn risk based on user activity
export function calculateChurnRisk(user: UserActivity): 'low' | 'medium' | 'high' | 'critical' {
  const now = Date.now();
  const daysSinceLastActive = (now - user.lastActiveDate.getTime()) / (24 * 60 * 60 * 1000);
  const daysSinceSignup = (now - user.signupDate.getTime()) / (24 * 60 * 60 * 1000);
  
  // Critical risk factors
  if (daysSinceLastActive > 30) return 'critical';
  if (daysSinceLastActive > 14 && user.totalSummaries === 0) return 'critical';
  
  // High risk factors
  if (daysSinceLastActive > 14) return 'high';
  if (daysSinceLastActive > 7 && user.totalSummaries < 3 && daysSinceSignup > 7) return 'high';
  
  // Medium risk factors
  if (daysSinceLastActive > 7) return 'medium';
  if (daysSinceLastActive > 3 && !user.hasConnectedSlack && daysSinceSignup > 3) return 'medium';
  
  return 'low';
}

// Generate churn prevention email templates
function generateChurnPreventionEmail(user: UserActivity, templateType: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const daysSinceLastActive = Math.floor((Date.now() - user.lastActiveDate.getTime()) / (24 * 60 * 60 * 1000));
  
  switch (templateType) {
    case 'inactivity_warning':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">We miss you! 💙</h1>
            <p style="color: #6b7280; font-size: 16px;">Come back and create amazing summaries</p>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #92400e; margin-bottom: 15px;">Hi ${user.name}!</h2>
            <p style="color: #a16207; line-height: 1.6;">
              It's been ${daysSinceLastActive} days since we last saw you. We hope everything is going well!
            </p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">What you might have missed:</h3>
            <ul style="color: #4b5563; line-height: 1.8;">
              <li>🚀 New AI models for better summaries</li>
              <li>📊 Enhanced analytics dashboard</li>
              <li>🔗 New integrations with popular tools</li>
              <li>⚡ Faster processing speeds</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${baseUrl}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Welcome Back
            </a>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Need help getting started again? 
              <a href="${baseUrl}/help" style="color: #2563eb;">Visit our help center</a>
            </p>
          </div>
        </div>
      `;

    case 'inactivity_critical':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin-bottom: 10px;">Your account needs attention ⚠️</h1>
            <p style="color: #6b7280; font-size: 16px;">Don't lose your progress!</p>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #dc2626; margin-bottom: 15px;">Hi ${user.name},</h2>
            <p style="color: #b91c1c; line-height: 1.6;">
              We noticed you haven't been active for ${daysSinceLastActive} days. We'd hate to see you go!
            </p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">Quick wins to get back on track:</h3>
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <h4 style="color: #374151; margin-bottom: 10px;">📄 Upload a document</h4>
              <p style="color: #6b7280; font-size: 14px;">Get an instant AI summary in under 30 seconds</p>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
              <h4 style="color: #374151; margin-bottom: 10px;">💬 Connect Slack</h4>
              <p style="color: #6b7280; font-size: 14px;">Automate your team communication summaries</p>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 6px;">
              <h4 style="color: #374151; margin-bottom: 10px;">🎯 Try templates</h4>
              <p style="color: #6b7280; font-size: 14px;">Use pre-built templates for common use cases</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${baseUrl}/dashboard" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Reactivate Account
            </a>
          </div>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Still having trouble? 
              <a href="${baseUrl}/contact" style="color: #2563eb;">Contact our support team</a>
            </p>
          </div>
        </div>
      `;

    case 'win_back':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Special offer just for you! 🎁</h1>
            <p style="color: #6b7280; font-size: 16px;">Come back with 50% off Pro</p>
          </div>
          
          <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #065f46; margin-bottom: 15px;">Hi ${user.name},</h2>
            <p style="color: #047857; line-height: 1.6;">
              We miss having you as part of our community! As a special welcome back offer, we're giving you 50% off Pro for the next 3 months.
            </p>
          </div>
          
          <div style="background: #f3e8ff; border: 1px solid #c084fc; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h3 style="color: #7c3aed; margin-bottom: 10px;">Limited Time Offer! ⏰</h3>
            <p style="color: #8b5cf6; margin-bottom: 15px;">Pro Plan - 50% Off</p>
            <p style="color: #7c3aed; font-size: 24px; font-weight: bold;">$14.50/month (normally $29)</p>
            <p style="color: #8b5cf6; font-size: 14px;">Valid for 7 days only</p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${baseUrl}/pricing?promo=WINBACK50" style="background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Claim Your Discount
            </a>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="color: #1f2937; margin-bottom: 15px;">Pro features include:</h3>
            <ul style="color: #4b5563; line-height: 1.8;">
              <li>🚀 Unlimited summaries</li>
              <li>⚡ Priority processing</li>
              <li>🎯 Advanced AI models</li>
              <li>📊 Team analytics</li>
            </ul>
          </div>
        </div>
      `;

    case 'feedback_request':
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Help us improve 📝</h1>
            <p style="color: #6b7280; font-size: 16px;">Quick 2-minute feedback</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-bottom: 15px;">Hi ${user.name},</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              We noticed you haven't been using Slack Summary Scribe lately. We'd love to understand why and how we can improve.
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${baseUrl}/feedback?user=${user.id}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Share Feedback (2 min)
            </a>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 6px; text-align: center;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              💡 Your feedback helps us build better features for everyone
            </p>
          </div>
        </div>
      `;

    default:
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Slack Summary Scribe</h1>
          <p>Hi ${user.name}, we'd love to have you back!</p>
          <a href="${baseUrl}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Return to Dashboard
          </a>
        </div>
      `;
  }
}

// Send churn prevention email
export async function sendChurnPreventionEmail(
  user: UserActivity,
  templateType: keyof typeof CHURN_PREVENTION_CONFIG.emailSequences
): Promise<{ success: boolean; error?: string }> {
  try {
    if (user.unsubscribed) {
      console.log(`User ${user.email} is unsubscribed, skipping churn email`);
      return { success: false, error: 'User unsubscribed' };
    }

    const config = CHURN_PREVENTION_CONFIG.emailSequences[templateType];
    const html = generateChurnPreventionEmail(user, templateType);
    
    const result = await sendEmail({
      to: user.email,
      subject: config.subject,
      html
    });
    
    if (result.success) {
      // Track the churn prevention email
      await trackFeatureUsage(user.id, 'churn_prevention_email_sent', { templateType });
      console.log(`Churn prevention email sent: ${templateType} to ${user.email}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error sending churn prevention email ${templateType}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Identify users at risk of churning
export function identifyChurnRiskUsers(users: UserActivity[]): {
  warning: UserActivity[];
  critical: UserActivity[];
  churn: UserActivity[];
} {
  const now = Date.now();
  const result: {
    warning: UserActivity[];
    critical: UserActivity[];
    churn: UserActivity[];
  } = { warning: [], critical: [], churn: [] };
  
  for (const user of users) {
    if (user.unsubscribed) continue;
    
    const daysSinceLastActive = (now - user.lastActiveDate.getTime()) / (24 * 60 * 60 * 1000);
    const daysSinceLastChurnEmail = user.lastChurnEmail 
      ? (now - user.lastChurnEmail.getTime()) / (24 * 60 * 60 * 1000)
      : Infinity;
    
    // Only send emails if enough time has passed since last churn email
    if (daysSinceLastChurnEmail < 3) continue;
    
    if (daysSinceLastActive >= 30) {
      result.churn.push(user);
    } else if (daysSinceLastActive >= 14) {
      result.critical.push(user);
    } else if (daysSinceLastActive >= 7) {
      result.warning.push(user);
    }
  }
  
  return result;
}

// Process churn prevention campaigns
export async function processChurnPrevention(users: UserActivity[]): Promise<{
  processed: number;
  sent: number;
  errors: number;
}> {
  console.log(`Processing churn prevention for ${users.length} users`);
  
  const churnRiskUsers = identifyChurnRiskUsers(users);
  let processed = 0;
  let sent = 0;
  let errors = 0;
  
  // Send warning emails
  for (const user of churnRiskUsers.warning) {
    processed++;
    const result = await sendChurnPreventionEmail(user, 'inactivityWarning');
    if (result.success) sent++;
    else errors++;
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Send critical emails
  for (const user of churnRiskUsers.critical) {
    processed++;
    const result = await sendChurnPreventionEmail(user, 'inactivityCritical');
    if (result.success) sent++;
    else errors++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Send win-back emails
  for (const user of churnRiskUsers.churn) {
    processed++;
    const result = await sendChurnPreventionEmail(user, 'winBack');
    if (result.success) sent++;
    else errors++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Notify team about churn risks
  if (churnRiskUsers.critical.length > 0 || churnRiskUsers.churn.length > 0) {
    await slackNotifications.errorOccurred({
      error: `Churn risk alert: ${churnRiskUsers.critical.length} critical, ${churnRiskUsers.churn.length} churn risk users`,
      context: 'Churn Prevention System'
    });
  }
  
  console.log(`Churn prevention completed: ${sent}/${processed} emails sent, ${errors} errors`);
  
  return { processed, sent, errors };
}

// Convenience functions
export const churnPrevention = {
  // Calculate risk for a single user
  calculateRisk: (user: UserActivity) => calculateChurnRisk(user),
  
  // Send specific churn prevention emails
  sendWarning: (user: UserActivity) => sendChurnPreventionEmail(user, 'inactivityWarning'),
  sendCritical: (user: UserActivity) => sendChurnPreventionEmail(user, 'inactivityCritical'),
  sendWinBack: (user: UserActivity) => sendChurnPreventionEmail(user, 'winBack'),
  sendFeedbackRequest: (user: UserActivity) => sendChurnPreventionEmail(user, 'feedbackRequest'),
  
  // Process all users
  processAll: (users: UserActivity[]) => processChurnPrevention(users),
  
  // Identify at-risk users
  identifyRisks: (users: UserActivity[]) => identifyChurnRiskUsers(users)
};
