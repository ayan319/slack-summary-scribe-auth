import { Resend } from 'resend';
import { render } from '@react-email/render';
import WelcomeEmail from '../emails/WelcomeEmail';
import PaymentConfirmationEmail from '../emails/PaymentConfirmationEmail';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const emailConfig = {
  from: process.env.EMAIL_FROM || 'Slack Summary Scribe <noreply@slacksummaryscribe.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@slacksummaryscribe.com',
};

// Email templates
export const emailTemplates = {
  welcome: {
    subject: 'Welcome to Slack Summary Scribe! 🎉',
    getHtml: (data: { name: string; planType: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Slack Summary Scribe</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Slack Summary Scribe!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Transform your Slack conversations into actionable insights</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${data.name}! 👋</h2>
            
            <p>Thank you for joining Slack Summary Scribe! You're now part of a community that values efficient communication and actionable insights.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">Your ${data.planType} Plan is Active</h3>
              <p style="margin-bottom: 0;">You can now start generating AI-powered summaries from your Slack conversations.</p>
            </div>
            
            <h3>What's Next?</h3>
            <ol style="padding-left: 20px;">
              <li><strong>Connect Your Slack Workspace:</strong> Link your Slack account to start analyzing conversations</li>
              <li><strong>Generate Your First Summary:</strong> Select channels and let our AI create insightful summaries</li>
              <li><strong>Export & Share:</strong> Download summaries as PDF or export to Notion</li>
            </ol>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Get Started Now</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
              Need help? Reply to this email or visit our <a href="${process.env.NEXT_PUBLIC_APP_URL}/support" style="color: #667eea;">support center</a>.
            </p>
          </div>
        </body>
      </html>
    `,
    getText: (data: { name: string; planType: string }) => `
      Welcome to Slack Summary Scribe!
      
      Hi ${data.name}!
      
      Thank you for joining Slack Summary Scribe! You're now part of a community that values efficient communication and actionable insights.
      
      Your ${data.planType} Plan is Active
      You can now start generating AI-powered summaries from your Slack conversations.
      
      What's Next?
      1. Connect Your Slack Workspace: Link your Slack account to start analyzing conversations
      2. Generate Your First Summary: Select channels and let our AI create insightful summaries
      3. Export & Share: Download summaries as PDF or export to Notion
      
      Get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
      
      Need help? Reply to this email or visit our support center.
    `
  },

  paymentConfirmation: {
    subject: 'Payment Confirmed - Welcome to Premium! 💳',
    getHtml: (data: { name: string; planType: string; amount: number; paymentId: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Payment Confirmed! ✅</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your premium subscription is now active</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Thank you, ${data.name}! 🎉</h2>
            
            <p>Your payment has been successfully processed and your ${data.planType} subscription is now active.</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #495057;">Payment Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Plan:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right;">${data.planType}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6;"><strong>Amount:</strong></td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #dee2e6; text-align: right;">$${data.amount.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Payment ID:</strong></td>
                  <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 12px;">${data.paymentId}</td>
                </tr>
              </table>
            </div>
            
            <h3>What's Unlocked?</h3>
            <ul style="padding-left: 20px;">
              ${data.planType === 'PRO' ? `
                <li>100 AI summaries per month</li>
                <li>Advanced Slack integration</li>
                <li>Export to Notion & PDF</li>
                <li>Priority email support</li>
              ` : `
                <li>Unlimited AI summaries</li>
                <li>Enterprise Slack integration</li>
                <li>Custom AI models</li>
                <li>24/7 phone & chat support</li>
                <li>White-label solution</li>
              `}
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Access Your Dashboard</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
            
            <p style="color: #6c757d; font-size: 14px; margin-bottom: 0;">
              Questions about your subscription? Contact us at <a href="mailto:billing@slacksummaryscribe.com" style="color: #28a745;">billing@slacksummaryscribe.com</a>
            </p>
          </div>
        </body>
      </html>
    `,
    getText: (data: { name: string; planType: string; amount: number; paymentId: string }) => `
      Payment Confirmed!
      
      Thank you, ${data.name}!
      
      Your payment has been successfully processed and your ${data.planType} subscription is now active.
      
      Payment Details:
      - Plan: ${data.planType}
      - Amount: $${data.amount.toFixed(2)}
      - Payment ID: ${data.paymentId}
      
      Access your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
      
      Questions? Contact us at billing@slacksummaryscribe.com
    `
  }
};

// Send welcome email
export async function sendWelcomeEmail(data: {
  email: string;
  name: string;
  planType: string;
}) {
  try {
    const emailHtml = await render(WelcomeEmail({
      name: data.name,
      planType: data.planType
    }));

    const result = await resend.emails.send({
      from: emailConfig.from,
      to: data.email,
      subject: 'Welcome to Slack Summary Scribe! 🎉',
      html: emailHtml,
      replyTo: emailConfig.replyTo,
    });

    console.log('Welcome email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}

// Send payment confirmation email
export async function sendPaymentConfirmationEmail(data: {
  email: string;
  name: string;
  planType: string;
  amount: number;
  paymentId: string;
}) {
  try {
    const emailHtml = await render(PaymentConfirmationEmail({
      name: data.name,
      planType: data.planType,
      amount: data.amount,
      paymentId: data.paymentId
    }));

    const result = await resend.emails.send({
      from: emailConfig.from,
      to: data.email,
      subject: 'Payment Confirmed - Welcome to Premium! 💳',
      html: emailHtml,
      replyTo: emailConfig.replyTo,
    });

    console.log('Payment confirmation email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
}

// Send generic notification email
export async function sendNotificationEmail(data: {
  email: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const result = await resend.emails.send({
      from: emailConfig.from,
      to: data.email,
      subject: data.subject,
      html: data.html,
      text: data.text || data.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      replyTo: emailConfig.replyTo,
    });

    console.log('Notification email sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
}

// Validate email configuration
export function validateEmailConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.RESEND_API_KEY) {
    errors.push('RESEND_API_KEY is required');
  }

  if (!process.env.EMAIL_FROM) {
    errors.push('EMAIL_FROM is required');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL is required for email links');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
