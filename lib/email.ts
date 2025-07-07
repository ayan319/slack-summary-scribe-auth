import { Resend } from 'resend';
import { render } from '@react-email/render';

// Email configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@summaryai.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@summaryai.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

// Initialize Resend (only if API key is available)
let resend: Resend | null = null;
if (RESEND_API_KEY && RESEND_API_KEY !== 're_123456789_your_resend_api_key_here') {
  resend = new Resend(RESEND_API_KEY);
  console.log('✅ Resend initialized with API key');
} else {
  console.log('⚠️ Resend API key not found, using fallback mode');
}

// Fallback email store for development
const emailLogs: Array<{
  timestamp: Date;
  to: string;
  subject: string;
  html: string;
  type: string;
}> = [];

export interface WelcomeEmailProps {
  email: string;
  name: string;
  planType: 'FREE' | 'PRO' | 'ENTERPRISE';
}

export interface PaymentConfirmationEmailProps {
  email: string;
  name: string;
  planName: string;
  amount: number;
  orderId: string;
}

// Helper function to send emails with fallback
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  type: string = 'general'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (resend) {
      // Use Resend in production
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      });

      if (error) {
        console.error('Resend email error:', error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Email sent via Resend to ${to}: ${subject}`);
      return { success: true, messageId: data?.id };
    } else {
      // Fallback mode for development
      emailLogs.push({
        timestamp: new Date(),
        to,
        subject,
        html,
        type,
      });

      console.log('\n📧 EMAIL SENT (Development Mode)');
      console.log('=====================================');
      console.log(`Type: ${type}`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('=====================================\n');

      return { success: true, messageId: `dev_${Date.now()}` };
    }
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Email verification function
export async function sendEmailVerification(
  email: string,
  name: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Slack Summary Scribe</div>
          </div>
          <div class="content">
            <h2>Welcome, ${name}!</h2>
            <p>Thank you for signing up for Slack Summary Scribe. To complete your registration and start using our AI-powered conversation summaries, please verify your email address.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
          </div>
          <div class="footer">
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  const result = await sendEmail(email, 'Verify your email address - Slack Summary Scribe', html, 'email-verification');
  return { success: result.success, error: result.error };
}

export async function sendWelcomeEmail({
  email,
  name,
  planType,
}: WelcomeEmailProps): Promise<void> {
  try {
    // For now, use simple HTML instead of React Email components
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Slack Summary Scribe! 🎉</h2>
        <p>Hi ${name},</p>
        <p>Welcome to the ${planType} plan! You're all set to start using our AI-powered conversation summaries.</p>
        <p>Best regards,<br>The Slack Summary Scribe Team</p>
      </div>
    `;

    await sendEmail(email, 'Welcome to Slack Summary Scribe! 🎉', html, 'welcome');
    console.log('Welcome email sent successfully to:', email);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

export async function sendPaymentConfirmationEmail({
  email,
  name,
  planName,
  amount,
  orderId,
}: PaymentConfirmationEmailProps): Promise<void> {
  try {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>Payment Confirmation</h1>
        <p>Hi ${name},</p>
        <p>Thank you for your payment! Your subscription to the ${planName} plan has been confirmed.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payment Details</h3>
          <p><strong>Plan:</strong> ${planName}</p>
          <p><strong>Amount:</strong> $${amount}</p>
          <p><strong>Order ID:</strong> ${orderId}</p>
        </div>
        <p>You can now access all features of your ${planName} plan.</p>
        <p>If you have any questions, please contact our support team.</p>
        <p>Best regards,<br>The Slack Summary Scribe Team</p>
      </div>
    `;

    if (resend) {
      await resend.emails.send({
        from: 'Slack Summary Scribe <billing@summaryai.com>',
        to: [email],
        subject: `Payment Confirmation - ${planName} Plan`,
        html: emailHtml,
      });
    } else {
      // Fallback logging
      emailLogs.push({
        timestamp: new Date(),
        to: email,
        subject: `Payment Confirmation - ${planName} Plan`,
        html: emailHtml,
        type: 'payment_confirmation',
      });
      console.log('📧 Payment confirmation email logged (Resend not available):', { email, planName, amount, orderId });
    }

    console.log('Payment confirmation email sent successfully to:', email);
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset your password</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
            .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
            .warning { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Slack Summary Scribe</div>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>Hi ${name},</p>
              <p>We received a request to reset your password for your Slack Summary Scribe account. If you made this request, click the button below to reset your password:</p>
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 12px;">${resetUrl}</p>
              <div class="warning">
                <p><strong>Security Notice:</strong></p>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>It can only be used once</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <p>Need help? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const result = await sendEmail(email, 'Reset your password - Slack Summary Scribe', html, 'password-reset');
    console.log('Password reset email sent successfully to:', email);
    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendSummaryNotification(
  email: string,
  name: string,
  summaryTitle: string,
  summaryUrl: string
): Promise<void> {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Your Summary is Ready! 📝</h2>
        <p>Hi ${name},</p>
        <p>We've generated a new summary for your Slack conversation:</p>
        <h3>${summaryTitle}</h3>
        <a href="${summaryUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Summary</a>
        <p>Best regards,<br>The Slack Summary Scribe Team</p>
      </div>
    `;

    await sendEmail(email, `New Summary Ready: ${summaryTitle}`, html, 'summary-notification');
    console.log('Summary notification sent successfully to:', email);
  } catch (error) {
    console.error('Failed to send summary notification:', error);
    throw error;
  }
}

// Utility functions for development
export const emailService = {
  /**
   * Get email logs for development
   */
  getLogs(): typeof emailLogs {
    return [...emailLogs];
  },

  /**
   * Clear email logs
   */
  clearLogs(): void {
    emailLogs.length = 0;
  },

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!resend;
  },

  /**
   * Get the last email sent (for testing)
   */
  getLastEmail(): typeof emailLogs[0] | null {
    return emailLogs.length > 0 ? emailLogs[emailLogs.length - 1] : null;
  }
};
