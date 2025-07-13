import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { WebhookEventType, webhooks } from '@/lib/webhooks';
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

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email!;
    const userName = session.user.user_metadata?.name || session.user.email!;

    // Parse request body
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { success: false, error: 'Missing type or data' },
        { status: 400 }
      );
    }

    console.log('Processing webhook trigger:', { type, userId });

    // Handle different webhook types
    switch (type) {
      case 'test_notification':
        // Test notification for development
        await Promise.all([
          slackNotifications.userSignup({
            name: userName,
            email: userEmail,
            plan: 'Free'
          }),
          sendEmail({
            to: userEmail,
            subject: 'Test Notification from Slack Summary Scribe',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">Test Notification</h1>
                <p>This is a test notification from your Slack Summary Scribe webhook system.</p>
                <p><strong>User:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              </div>
            `
          })
        ]);
        break;

      case 'summary_completed':
        // Summary completion notifications
        const { summaryId, title, wordCount, processingTime } = data;
        
        await Promise.all([
          // Send Slack notification
          slackNotifications.summaryGenerated({
            userName,
            summaryTitle: title,
            wordCount: wordCount || 0,
            processingTime: processingTime || 0
          }),
          
          // Send email notification
          sendEmail({
            to: userEmail,
            subject: 'Your AI Summary is Ready! 📄',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #2563eb; margin-bottom: 10px;">Summary Complete! ✨</h1>
                  <p style="color: #6b7280; font-size: 16px;">Your AI-powered summary is ready to view</p>
                </div>
                
                <div style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #1e40af; margin-bottom: 15px;">Hi ${userName}!</h2>
                  <p style="color: #1e3a8a; line-height: 1.6;">
                    Your summary "${title}" has been processed and is ready for review.
                  </p>
                </div>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="color: #1f2937; margin-bottom: 15px;">Summary Details</h3>
                  <p style="color: #4b5563; margin-bottom: 10px;"><strong>Title:</strong> ${title}</p>
                  <p style="color: #4b5563; margin-bottom: 10px;"><strong>Word Count:</strong> ${wordCount || 'N/A'} words</p>
                  <p style="color: #4b5563;"><strong>Processing Time:</strong> ${processingTime || 'N/A'}ms</p>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    View Summary
                  </a>
                </div>
              </div>
            `
          }),
          
          // Trigger webhook
          webhooks.summaryCompleted({
            summaryId,
            userId,
            title,
            wordCount: wordCount || 0
          })
        ]);
        break;

      case 'slack_connected':
        // Slack workspace connection notifications
        const { workspaceId, workspaceName } = data;
        
        await Promise.all([
          // Send Slack notification
          slackNotifications.workspaceConnected({
            userName,
            workspaceName,
            teamId: workspaceId
          }),
          
          // Send email notification
          sendEmail({
            to: userEmail,
            subject: 'Slack Workspace Connected Successfully! 🔗',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #059669; margin-bottom: 10px;">Slack Connected! 🎉</h1>
                  <p style="color: #6b7280; font-size: 16px;">Your workspace is ready for AI summaries</p>
                </div>
                
                <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #065f46; margin-bottom: 15px;">Hi ${userName}!</h2>
                  <p style="color: #047857; line-height: 1.6;">
                    Great news! Your Slack workspace "${workspaceName}" has been successfully connected to Slack Summary Scribe.
                  </p>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    Go to Dashboard
                  </a>
                </div>
              </div>
            `
          }),
          
          // Trigger webhook
          webhooks.slackConnected({
            userId,
            workspaceId,
            workspaceName
          })
        ]);
        break;

      case 'payment_success':
        // Payment success notifications
        const { plan, amount, orderId } = data;
        
        await Promise.all([
          // Send Slack notification
          slackNotifications.paymentSuccess({
            customerName: userName,
            plan,
            amount,
            orderId
          }),
          
          // Send email notification
          sendEmail({
            to: userEmail,
            subject: `Subscription Confirmed - Welcome to ${plan}! 🚀`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #059669; margin-bottom: 10px;">Payment Successful! 🎉</h1>
                  <p style="color: #6b7280; font-size: 16px;">Your ${plan} subscription is now active</p>
                </div>
                
                <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #065f46; margin-bottom: 15px;">Hi ${userName}!</h2>
                  <p style="color: #047857; line-height: 1.6;">
                    Thank you for upgrading to ${plan}! Your payment of $${amount} has been processed successfully.
                  </p>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                    Access Your Dashboard
                  </a>
                </div>
              </div>
            `
          }),
          
          // Trigger webhook
          webhooks.paymentSuccess({
            paymentId: orderId,
            userId,
            amount,
            plan
          })
        ]);
        break;

      case 'error_occurred':
        // Error notifications
        const { error, context } = data;
        
        await slackNotifications.errorOccurred({
          error,
          user: userName,
          context
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown webhook type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Send error notification
    try {
      await slackNotifications.errorOccurred({
        error: error instanceof Error ? error.message : 'Unknown error',
        context: 'Webhook processing'
      });
    } catch (notificationError) {
      console.error('Failed to send error notification:', notificationError);
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is active',
    supportedEvents: Object.values(WebhookEventType)
  });
}
