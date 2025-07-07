/**
 * Email Service for SummaryAI
 * Handles transactional emails using Resend API
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  loginUrl: string;
}

interface ExportCompleteEmailData {
  userName: string;
  userEmail: string;
  summaryTitle: string;
  notionUrl: string;
  summaryUrl: string;
}

interface TeamInviteEmailData {
  inviteeName: string;
  inviterName: string;
  teamName: string;
  inviteUrl: string;
  message?: string;
}

class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@summaryai.com';
  }

  private async sendEmail(data: EmailData): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('Email service not configured - RESEND_API_KEY missing');
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: data.from || this.fromEmail,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Email API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      console.log('Email sent successfully:', { to: data.to, subject: data.subject, id: result.id });
      return true;

    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const template = this.getWelcomeEmailTemplate(data);
    
    return this.sendEmail({
      to: data.userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendExportCompleteEmail(data: ExportCompleteEmailData): Promise<boolean> {
    const template = this.getExportCompleteEmailTemplate(data);
    
    return this.sendEmail({
      to: data.userEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendTeamInviteEmail(data: TeamInviteEmailData): Promise<boolean> {
    const template = this.getTeamInviteEmailTemplate(data);

    return this.sendEmail({
      to: data.inviteeName,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  async sendCustomEmail(data: { to: string; subject: string; html: string; text?: string }): Promise<boolean> {
    return this.sendEmail({
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text,
    });
  }

  private getWelcomeEmailTemplate(data: WelcomeEmailData): EmailTemplate {
    const subject = 'Welcome to SummaryAI! 🎉';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to SummaryAI</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 40px 20px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .feature { margin: 20px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; }
        .footer { background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to SummaryAI!</h1>
            <p style="color: #e2e8f0; margin: 10px 0 0 0;">Transform your conversations into actionable insights</p>
        </div>
        
        <div class="content">
            <h2>Hi ${data.userName}!</h2>
            
            <p>Welcome to SummaryAI! We're excited to help you transform your conversations into actionable insights with the power of AI.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.loginUrl}" class="button">Get Started Now</a>
            </div>
            
            <h3>What you can do with SummaryAI:</h3>
            
            <div class="feature">
                <h4>🧠 AI-Powered Summaries</h4>
                <p>Upload transcripts or connect Slack to get intelligent summaries with key points, action items, and insights.</p>
            </div>
            
            <div class="feature">
                <h4>📊 Export & Share</h4>
                <p>Export summaries to Notion, share with your team, or download as PDF for easy collaboration.</p>
            </div>
            
            <div class="feature">
                <h4>👥 Team Collaboration</h4>
                <p>Invite team members, manage workspaces, and collaborate on summaries together.</p>
            </div>
            
            <p>Ready to get started? Click the button above to access your dashboard and create your first AI summary!</p>
            
            <p>If you have any questions, just reply to this email. We're here to help!</p>
            
            <p>Best regards,<br>The SummaryAI Team</p>
        </div>
        
        <div class="footer">
            <p>© 2024 SummaryAI. All rights reserved.</p>
            <p>You received this email because you signed up for SummaryAI.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Welcome to SummaryAI! 🎉

Hi ${data.userName}!

Welcome to SummaryAI! We're excited to help you transform your conversations into actionable insights with the power of AI.

Get started: ${data.loginUrl}

What you can do with SummaryAI:

🧠 AI-Powered Summaries
Upload transcripts or connect Slack to get intelligent summaries with key points, action items, and insights.

📊 Export & Share
Export summaries to Notion, share with your team, or download as PDF for easy collaboration.

👥 Team Collaboration
Invite team members, manage workspaces, and collaborate on summaries together.

Ready to get started? Visit your dashboard and create your first AI summary!

If you have any questions, just reply to this email. We're here to help!

Best regards,
The SummaryAI Team

© 2024 SummaryAI. All rights reserved.
You received this email because you signed up for SummaryAI.
`;

    return { subject, html, text };
  }

  private getExportCompleteEmailTemplate(data: ExportCompleteEmailData): EmailTemplate {
    const subject = `✅ Your summary "${data.summaryTitle}" has been exported to Notion`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export Complete</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; font-weight: bold; }
        .content { padding: 30px 20px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
        .success-icon { font-size: 48px; margin: 20px 0; }
        .footer { background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="success-icon">✅</div>
            <h1>Export Complete!</h1>
        </div>
        
        <div class="content">
            <h2>Hi ${data.userName}!</h2>
            
            <p>Great news! Your summary "<strong>${data.summaryTitle}</strong>" has been successfully exported to Notion.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.notionUrl}" class="button">View in Notion</a>
                <a href="${data.summaryUrl}" class="button">View Summary</a>
            </div>
            
            <p>Your summary is now available in your Notion workspace and ready for collaboration. You can edit, share, or organize it however you like!</p>
            
            <p>Keep creating amazing summaries with SummaryAI!</p>
            
            <p>Best regards,<br>The SummaryAI Team</p>
        </div>
        
        <div class="footer">
            <p>© 2024 SummaryAI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
Export Complete! ✅

Hi ${data.userName}!

Great news! Your summary "${data.summaryTitle}" has been successfully exported to Notion.

View in Notion: ${data.notionUrl}
View Summary: ${data.summaryUrl}

Your summary is now available in your Notion workspace and ready for collaboration. You can edit, share, or organize it however you like!

Keep creating amazing summaries with SummaryAI!

Best regards,
The SummaryAI Team

© 2024 SummaryAI. All rights reserved.
`;

    return { subject, html, text };
  }

  private getTeamInviteEmailTemplate(data: TeamInviteEmailData): EmailTemplate {
    const subject = `You're invited to join ${data.teamName} on SummaryAI`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Invitation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; font-weight: bold; }
        .content { padding: 30px 20px; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
        .message-box { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>👥 Team Invitation</h1>
        </div>
        
        <div class="content">
            <h2>You're invited to join ${data.teamName}!</h2>
            
            <p><strong>${data.inviterName}</strong> has invited you to join their team on SummaryAI.</p>
            
            ${data.message ? `
            <div class="message-box">
                <h4>Personal message from ${data.inviterName}:</h4>
                <p>"${data.message}"</p>
            </div>
            ` : ''}
            
            <p>SummaryAI helps teams transform conversations into actionable insights with AI-powered summaries. Join ${data.teamName} to:</p>
            
            <ul>
                <li>🧠 Create intelligent summaries from meetings and conversations</li>
                <li>📊 Export and share summaries with your team</li>
                <li>👥 Collaborate on insights and action items</li>
                <li>🔗 Connect with Slack and other tools</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${data.inviteUrl}" class="button">Accept Invitation</a>
            </div>
            
            <p><small>This invitation will expire in 7 days. If you don't want to receive team invitations, you can ignore this email.</small></p>
        </div>
        
        <div class="footer">
            <p>© 2024 SummaryAI. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

    const text = `
You're invited to join ${data.teamName}! 👥

${data.inviterName} has invited you to join their team on SummaryAI.

${data.message ? `Personal message from ${data.inviterName}: "${data.message}"` : ''}

SummaryAI helps teams transform conversations into actionable insights with AI-powered summaries. Join ${data.teamName} to:

🧠 Create intelligent summaries from meetings and conversations
📊 Export and share summaries with your team  
👥 Collaborate on insights and action items
🔗 Connect with Slack and other tools

Accept invitation: ${data.inviteUrl}

This invitation will expire in 7 days. If you don't want to receive team invitations, you can ignore this email.

© 2024 SummaryAI. All rights reserved.
`;

    return { subject, html, text };
  }
}

export const emailService = new EmailService();
