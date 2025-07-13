import { sendEmail } from './resend';
import { trackOnboardingEvent } from './analytics';

// Onboarding sequence configuration
export const ONBOARDING_CONFIG = {
  sequences: {
    welcome: {
      delay: 0, // Immediate
      subject: 'Welcome to Slack Summary Scribe! 🎉',
      template: 'welcome'
    },
    getting_started: {
      delay: 24 * 60 * 60 * 1000, // 24 hours
      subject: 'Ready to create your first AI summary? 🚀',
      template: 'getting_started'
    },
    slack_integration: {
      delay: 3 * 24 * 60 * 60 * 1000, // 3 days
      subject: 'Connect Slack for powerful team summaries 💬',
      template: 'slack_integration'
    },
    feature_discovery: {
      delay: 7 * 24 * 60 * 60 * 1000, // 7 days
      subject: 'Discover advanced features to boost productivity 📈',
      template: 'feature_discovery'
    },
    upgrade_prompt: {
      delay: 14 * 24 * 60 * 60 * 1000, // 14 days
      subject: 'Unlock unlimited summaries with Pro 🔓',
      template: 'upgrade_prompt'
    }
  }
};

// User onboarding data interface
export interface OnboardingUser {
  id: string;
  email: string;
  name: string;
  signupDate: Date;
  plan: 'free' | 'pro' | 'enterprise';
  hasConnectedSlack: boolean;
  hasCreatedSummary: boolean;
  hasUploadedFile: boolean;
  lastActiveDate?: Date;
  onboardingStep: number;
}

// Onboarding email templates
export const ONBOARDING_TEMPLATES = {
  welcome: (user: OnboardingUser) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to Slack Summary Scribe! 🎉</h1>
        <p style="color: #6b7280; font-size: 16px;">Transform your team communication with AI-powered summaries</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1f2937; margin-bottom: 15px;">Hi ${user.name}! 👋</h2>
        <p style="color: #4b5563; line-height: 1.6;">
          Thank you for joining Slack Summary Scribe! We're excited to help you and your team save hours every week with AI-powered conversation summaries.
        </p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin-bottom: 15px;">What's next?</h3>
        <ul style="color: #4b5563; line-height: 1.8;">
          <li>✅ Connect your Slack workspace to start getting summaries</li>
          <li>📄 Upload documents to try our AI summarization</li>
          <li>🔗 Explore export options to share with your team</li>
          <li>💡 Check out our help center for tips and tricks</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Get Started Now
        </a>
      </div>
      
      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
        <p style="color: #6b7280; font-size: 14px;">
          Need help? Reply to this email or visit our 
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/help" style="color: #2563eb;">help center</a>
        </p>
      </div>
    </div>
  `,

  getting_started: (user: OnboardingUser) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Ready to create your first summary? 🚀</h1>
        <p style="color: #6b7280; font-size: 16px;">Let's get you started with AI-powered summarization</p>
      </div>
      
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #1e40af; margin-bottom: 15px;">Hi ${user.name}!</h2>
        <p style="color: #1e3a8a; line-height: 1.6;">
          It's been 24 hours since you joined us. Ready to experience the power of AI summarization?
        </p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin-bottom: 15px;">Quick Start Guide:</h3>
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <h4 style="color: #374151; margin-bottom: 10px;">1. Upload a Document</h4>
          <p style="color: #6b7280; font-size: 14px;">Try uploading a PDF or Word document to see our AI in action</p>
        </div>
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <h4 style="color: #374151; margin-bottom: 10px;">2. Connect Slack</h4>
          <p style="color: #6b7280; font-size: 14px;">Link your workspace for automatic conversation summaries</p>
        </div>
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px;">
          <h4 style="color: #374151; margin-bottom: 10px;">3. Export & Share</h4>
          <p style="color: #6b7280; font-size: 14px;">Export to PDF, Notion, or share with your team</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/upload" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-right: 10px;">
          Upload Document
        </a>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/slack/connect" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Connect Slack
        </a>
      </div>
    </div>
  `,

  slack_integration: (user: OnboardingUser) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Supercharge your team with Slack integration 💬</h1>
        <p style="color: #6b7280; font-size: 16px;">Turn conversations into actionable insights</p>
      </div>
      
      <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #065f46; margin-bottom: 15px;">Hi ${user.name}!</h2>
        <p style="color: #047857; line-height: 1.6;">
          ${user.hasConnectedSlack ? 
            "Great job connecting Slack! Here's how to get the most out of it:" :
            "Ready to unlock the full power of team collaboration? Connect your Slack workspace!"
          }
        </p>
      </div>
      
      ${user.hasConnectedSlack ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">Pro Tips for Slack Integration:</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>🔍 Use /summarize in any channel for instant summaries</li>
            <li>⏰ Set up automatic daily/weekly channel summaries</li>
            <li>📊 Track team decisions and action items</li>
            <li>🔗 Share summaries across channels and teams</li>
          </ul>
        </div>
      ` : `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">Why connect Slack?</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>📝 Automatic conversation summaries</li>
            <li>🎯 Extract key decisions and action items</li>
            <li>⚡ Save hours of reading through chat history</li>
            <li>🤝 Keep everyone aligned with shared summaries</li>
          </ul>
        </div>
      `}
      
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/slack/connect" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          ${user.hasConnectedSlack ? 'Manage Slack Settings' : 'Connect Slack Now'}
        </a>
      </div>
    </div>
  `,

  feature_discovery: (user: OnboardingUser) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Discover advanced features 📈</h1>
        <p style="color: #6b7280; font-size: 16px;">Boost your productivity with these powerful tools</p>
      </div>
      
      <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #92400e; margin-bottom: 15px;">Hi ${user.name}!</h2>
        <p style="color: #a16207; line-height: 1.6;">
          You've been with us for a week! Let's explore some advanced features that can take your productivity to the next level.
        </p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin-bottom: 15px;">Advanced Features:</h3>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <h4 style="color: #374151; margin-bottom: 10px;">🎯 Smart Templates</h4>
          <p style="color: #6b7280; font-size: 14px;">Create custom summary templates for different meeting types</p>
        </div>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <h4 style="color: #374151; margin-bottom: 10px;">📊 Analytics Dashboard</h4>
          <p style="color: #6b7280; font-size: 14px;">Track your team's communication patterns and productivity</p>
        </div>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
          <h4 style="color: #374151; margin-bottom: 10px;">🔗 Integrations</h4>
          <p style="color: #6b7280; font-size: 14px;">Connect with Notion, Google Drive, and other tools</p>
        </div>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 6px;">
          <h4 style="color: #374151; margin-bottom: 10px;">🤖 AI Customization</h4>
          <p style="color: #6b7280; font-size: 14px;">Fine-tune AI models for your specific use cases</p>
        </div>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/features" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Explore Features
        </a>
      </div>
    </div>
  `,

  upgrade_prompt: (user: OnboardingUser) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Ready to unlock unlimited summaries? 🔓</h1>
        <p style="color: #6b7280; font-size: 16px;">Upgrade to Pro and supercharge your workflow</p>
      </div>
      
      <div style="background: #f3e8ff; border: 1px solid #c084fc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #7c3aed; margin-bottom: 15px;">Hi ${user.name}!</h2>
        <p style="color: #8b5cf6; line-height: 1.6;">
          You've been exploring Slack Summary Scribe for 2 weeks. Ready to unlock the full potential with unlimited summaries?
        </p>
      </div>
      
      <div style="margin-bottom: 30px;">
        <h3 style="color: #1f2937; margin-bottom: 15px;">Pro Features Include:</h3>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px;">
            <h4 style="color: #374151; margin-bottom: 10px;">🚀 Unlimited Summaries</h4>
            <p style="color: #6b7280; font-size: 14px;">No monthly limits</p>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px;">
            <h4 style="color: #374151; margin-bottom: 10px;">⚡ Priority Processing</h4>
            <p style="color: #6b7280; font-size: 14px;">Faster AI processing</p>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px;">
            <h4 style="color: #374151; margin-bottom: 10px;">🎯 Advanced AI Models</h4>
            <p style="color: #6b7280; font-size: 14px;">GPT-4 and Claude access</p>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 6px;">
            <h4 style="color: #374151; margin-bottom: 10px;">📊 Team Analytics</h4>
            <p style="color: #6b7280; font-size: 14px;">Detailed insights</p>
          </div>
        </div>
      </div>
      
      <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <h3 style="color: #065f46; margin-bottom: 10px;">Special Launch Offer! 🎉</h3>
        <p style="color: #047857; margin-bottom: 15px;">Get 50% off your first 3 months</p>
        <p style="color: #059669; font-size: 24px; font-weight: bold;">$14.50/month (normally $29)</p>
      </div>
      
      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL}/pricing?promo=LAUNCH50" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
          Upgrade to Pro Now
        </a>
      </div>
    </div>
  `
};

// Send onboarding email
export async function sendOnboardingEmail(
  user: OnboardingUser,
  templateKey: keyof typeof ONBOARDING_TEMPLATES
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = ONBOARDING_CONFIG.sequences[templateKey];
    const template = ONBOARDING_TEMPLATES[templateKey];
    
    if (!config || !template) {
      throw new Error(`Invalid template key: ${templateKey}`);
    }

    const html = template(user);
    
    const result = await sendEmail({
      to: user.email,
      subject: config.subject,
      html
    });
    
    if (result.success) {
      // Track the email sent
      await trackOnboardingEvent(user.id, 'step_completed', templateKey);
      console.log(`Onboarding email sent: ${templateKey} to ${user.email}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error sending onboarding email ${templateKey}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Schedule onboarding sequence
export async function scheduleOnboardingSequence(user: OnboardingUser): Promise<void> {
  console.log(`Scheduling onboarding sequence for user: ${user.email}`);
  
  // Send welcome email immediately
  await sendOnboardingEmail(user, 'welcome');
  
  // Schedule subsequent emails (in a real implementation, you'd use a job queue)
  // For now, we'll just log the schedule
  Object.entries(ONBOARDING_CONFIG.sequences).forEach(([key, config]) => {
    if (key !== 'welcome') {
      console.log(`Scheduled ${key} email for ${new Date(Date.now() + config.delay).toISOString()}`);
    }
  });
}

// Check if user should receive next onboarding email
export function shouldSendOnboardingEmail(
  user: OnboardingUser,
  templateKey: keyof typeof ONBOARDING_TEMPLATES
): boolean {
  const config = ONBOARDING_CONFIG.sequences[templateKey];
  if (!config) return false;
  
  const timeSinceSignup = Date.now() - user.signupDate.getTime();
  const shouldSendByTime = timeSinceSignup >= config.delay;
  
  // Additional logic based on user behavior
  switch (templateKey) {
    case 'slack_integration':
      // Don't send if user already connected Slack
      return shouldSendByTime && !user.hasConnectedSlack;
    
    case 'upgrade_prompt':
      // Only send to free users
      return shouldSendByTime && user.plan === 'free';
    
    default:
      return shouldSendByTime;
  }
}

// Process onboarding emails (would be called by a cron job)
export async function processOnboardingEmails(users: OnboardingUser[]): Promise<void> {
  console.log(`Processing onboarding emails for ${users.length} users`);
  
  for (const user of users) {
    for (const templateKey of Object.keys(ONBOARDING_CONFIG.sequences) as Array<keyof typeof ONBOARDING_TEMPLATES>) {
      if (shouldSendOnboardingEmail(user, templateKey)) {
        await sendOnboardingEmail(user, templateKey);
        // Add delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}
