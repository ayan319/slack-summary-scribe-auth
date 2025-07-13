import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { trackFeatureUsage } from '@/lib/analytics';
import { slackNotifications } from '@/lib/slack-notifications';
import { sendEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current user session (optional for feedback)
    const { data: { session } } = await supabase.auth.getSession();
    
    // Parse request body
    const body = await request.json();
    const {
      type,
      rating,
      feedback,
      email,
      allowContact,
      trigger,
      context,
      timestamp,
      userAgent,
      url
    } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Feedback type is required' },
        { status: 400 }
      );
    }

    if (type === 'satisfaction' && !rating) {
      return NextResponse.json(
        { success: false, error: 'Rating is required for satisfaction feedback' },
        { status: 400 }
      );
    }

    if (type !== 'satisfaction' && !feedback?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Feedback text is required' },
        { status: 400 }
      );
    }

    // Create feedback record
    const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const userId = session?.user?.id || 'anonymous';
    const userEmail = session?.user?.email || email || 'anonymous';

    const feedbackData = {
      id: feedbackId,
      userId,
      userEmail,
      type,
      rating: type === 'satisfaction' ? rating : undefined,
      feedback: feedback?.trim(),
      email: email?.trim(),
      allowContact: !!allowContact,
      trigger: trigger || 'manual',
      context: context || {},
      timestamp: timestamp || new Date().toISOString(),
      userAgent: userAgent || '',
      url: url || '',
      submittedAt: new Date().toISOString()
    };

    // In a real implementation, save to database
    console.log('Feedback submitted:', feedbackData);

    // Track the feedback submission
    await trackFeatureUsage(userId, 'feedback_submitted', {
      type,
      rating,
      trigger,
      hasEmail: !!email,
      allowContact
    });

    // Send notifications based on feedback type and severity
    await sendFeedbackNotifications(feedbackData);

    // Send confirmation email if user provided email and wants contact
    if (email && allowContact) {
      await sendFeedbackConfirmation(email, type, feedbackId);
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedbackId
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Send feedback notifications to team
async function sendFeedbackNotifications(feedbackData: any): Promise<void> {
  try {
    // Determine urgency based on feedback type and rating
    let urgency: 'low' | 'medium' | 'high' = 'medium';
    let emoji = '💬';
    
    if (feedbackData.type === 'bug') {
      urgency = 'high';
      emoji = '🐛';
    } else if (feedbackData.type === 'satisfaction' && feedbackData.rating <= 2) {
      urgency = 'high';
      emoji = '😞';
    } else if (feedbackData.type === 'feature') {
      urgency = 'medium';
      emoji = '💡';
    }

    // Send Slack notification
    await slackNotifications.errorOccurred({
      error: `${emoji} New ${feedbackData.type} feedback received`,
      context: `
        User: ${feedbackData.userEmail}
        Type: ${feedbackData.type}
        ${feedbackData.rating ? `Rating: ${feedbackData.rating}/5` : ''}
        Feedback: ${feedbackData.feedback || 'No text provided'}
        Contact allowed: ${feedbackData.allowContact ? 'Yes' : 'No'}
        Trigger: ${feedbackData.trigger}
        URL: ${feedbackData.url}
        Feedback ID: ${feedbackData.id}
      `
    });

    // Send email notification to team for high urgency feedback
    if (urgency === 'high' && process.env.FEEDBACK_NOTIFICATION_EMAIL) {
      await sendTeamFeedbackNotification(feedbackData);
    }

  } catch (error) {
    console.error('Error sending feedback notifications:', error);
  }
}

// Send team notification email for urgent feedback
async function sendTeamFeedbackNotification(feedbackData: any): Promise<void> {
  try {
    const urgencyColor = feedbackData.type === 'bug' ? '#dc2626' : '#f59e0b';
    const urgencyLabel = feedbackData.type === 'bug' ? 'BUG REPORT' : 'LOW SATISFACTION';
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚨 URGENT FEEDBACK</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">${urgencyLabel}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <table style="width: 100%; color: #4b5563;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">User:</td>
              <td style="padding: 8px 0;">${feedbackData.userEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Type:</td>
              <td style="padding: 8px 0;">${feedbackData.type}</td>
            </tr>
            ${feedbackData.rating ? `
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Rating:</td>
              <td style="padding: 8px 0;">${feedbackData.rating}/5</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Trigger:</td>
              <td style="padding: 8px 0;">${feedbackData.trigger}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Contact OK:</td>
              <td style="padding: 8px 0;">${feedbackData.allowContact ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">URL:</td>
              <td style="padding: 8px 0;">${feedbackData.url}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Submitted:</td>
              <td style="padding: 8px 0;">${new Date(feedbackData.submittedAt).toLocaleString()}</td>
            </tr>
          </table>
          
          ${feedbackData.feedback ? `
          <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px; border: 1px solid #d1d5db;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Feedback:</h3>
            <p style="margin: 0; color: #4b5563; line-height: 1.6;">${feedbackData.feedback}</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 20px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/feedback/${feedbackData.id}" style="background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View in Admin Panel
            </a>
          </div>
        </div>
      </div>
    `;

    await sendEmail({
      to: process.env.FEEDBACK_NOTIFICATION_EMAIL!,
      subject: `🚨 Urgent Feedback: ${urgencyLabel}`,
      html: emailContent
    });

  } catch (error) {
    console.error('Error sending team feedback notification:', error);
  }
}

// Send confirmation email to user
async function sendFeedbackConfirmation(
  userEmail: string,
  feedbackType: string,
  feedbackId: string
): Promise<void> {
  try {
    const typeEmoji = {
      general: '💬',
      bug: '🐛',
      feature: '💡',
      satisfaction: '⭐'
    };

    const typeLabel = {
      general: 'General Feedback',
      bug: 'Bug Report',
      feature: 'Feature Request',
      satisfaction: 'Satisfaction Survey'
    };

    const confirmationEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">Thank you for your feedback! 🙏</h1>
          <p style="color: #6b7280; font-size: 16px;">We've received your ${typeLabel[feedbackType as keyof typeof typeLabel] || 'feedback'}</p>
        </div>
        
        <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <div style="flex items-center; margin-bottom: 15px;">
            <span style="font-size: 24px; margin-right: 10px;">${typeEmoji[feedbackType as keyof typeof typeEmoji] || '💬'}</span>
            <h2 style="color: #065f46; margin: 0;">Feedback Received</h2>
          </div>
          <p style="color: #047857; line-height: 1.6; margin: 0;">
            Your feedback helps us improve Slack Summary Scribe for everyone. We review all feedback carefully and use it to guide our product development.
          </p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">What happens next?</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>📋 Our team will review your feedback within 24 hours</li>
            <li>🔍 For bug reports, we'll investigate and prioritize fixes</li>
            <li>💡 Feature requests are added to our product roadmap</li>
            <li>📞 If needed, we may reach out for more details</li>
          </ul>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #4b5563; margin: 0; text-align: center;">
            <strong>Feedback ID:</strong> ${feedbackId}
          </p>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            Back to Dashboard
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Have more feedback? 
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/feedback" style="color: #2563eb;">Share it here</a>
          </p>
        </div>
      </div>
    `;

    await sendEmail({
      to: userEmail,
      subject: `Thank you for your feedback! 🙏`,
      html: confirmationEmail
    });

  } catch (error) {
    console.error('Error sending feedback confirmation:', error);
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Feedback API is active',
    supportedTypes: ['general', 'bug', 'feature', 'satisfaction'],
    requiredFields: ['type'],
    optionalFields: ['rating', 'feedback', 'email', 'allowContact', 'trigger', 'context']
  });
}
