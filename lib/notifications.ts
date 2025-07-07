import { supabaseAdmin } from './supabase';

export interface NotificationData {
  userId: string;
  organizationId?: string;
  type: 'upload_complete' | 'summary_ready' | 'export_complete' | 'system';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

/**
 * Create an in-app notification
 */
export async function createNotification(notification: NotificationData): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available for notification creation');
      return false;
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: notification.userId,
        organization_id: notification.organizationId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data
      });

    if (error) {
      console.error('Failed to create notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Notification creation error:', error);
    return false;
  }
}

/**
 * Send push notification to user
 */
export async function sendPushNotification(
  userId: string, 
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available for push notification');
      return false;
    }

    // Get user's push subscription from database
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('push_subscription')
      .eq('id', userId)
      .single();

    if (error || !user?.push_subscription) {
      console.log('No push subscription found for user:', userId);
      return false;
    }

    const webpush = await import('web-push');
    
    // Configure web-push (you'll need to set these environment variables)
    webpush.setVapidDetails(
      'mailto:' + (process.env.VAPID_EMAIL || 'support@summaryai.com'),
      process.env.VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || ''
    );

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      data: payload.data || {}
    });

    await webpush.sendNotification(user.push_subscription, pushPayload);
    return true;

  } catch (error) {
    console.error('Push notification error:', error);
    return false;
  }
}

/**
 * Send Slack notification via webhook
 */
export async function sendSlackNotification(
  userId: string,
  message: string,
  title?: string
): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available for Slack notification');
      return false;
    }

    // Get user's Slack webhook URL from database
    const { data: slackIntegration, error } = await supabaseAdmin
      .from('slack_integrations')
      .select('webhook_url, team_name')
      .eq('user_id', userId)
      .eq('active', true)
      .single();

    if (error || !slackIntegration?.webhook_url) {
      console.log('No active Slack integration found for user:', userId);
      return false;
    }

    const slackPayload = {
      text: title ? `*${title}*\n${message}` : message,
      username: 'Slack Summary Scribe',
      icon_emoji: ':robot_face:',
      attachments: title ? [{
        color: 'good',
        fields: [{
          title: title,
          value: message,
          short: false
        }]
      }] : undefined
    };

    const response = await fetch(slackIntegration.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload)
    });

    if (!response.ok) {
      console.error('Slack webhook failed:', response.statusText);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Slack notification error:', error);
    return false;
  }
}

/**
 * Send comprehensive notification (in-app + push + Slack)
 */
export async function sendComprehensiveNotification(
  notification: NotificationData,
  pushPayload?: PushNotificationPayload,
  slackMessage?: string
): Promise<{
  inApp: boolean;
  push: boolean;
  slack: boolean;
}> {
  const results = {
    inApp: false,
    push: false,
    slack: false
  };

  // Send in-app notification
  results.inApp = await createNotification(notification);

  // Send push notification if payload provided
  if (pushPayload) {
    results.push = await sendPushNotification(notification.userId, pushPayload);
  }

  // Send Slack notification if message provided
  if (slackMessage) {
    results.slack = await sendSlackNotification(
      notification.userId, 
      slackMessage, 
      notification.title
    );
  }

  return results;
}

/**
 * Notification templates for common events
 */
export const NotificationTemplates = {
  uploadComplete: (fileName: string) => ({
    title: 'Upload Complete',
    message: `Your file "${fileName}" has been uploaded successfully and is being processed.`,
    pushPayload: {
      title: 'Upload Complete',
      body: `${fileName} uploaded successfully`,
      data: { type: 'upload_complete' }
    },
    slackMessage: `📁 File uploaded: *${fileName}* is now being processed for summarization.`
  }),

  summaryReady: (fileName: string, summaryId: string) => ({
    title: 'Summary Ready',
    message: `Your summary for "${fileName}" is ready to view!`,
    pushPayload: {
      title: 'Summary Ready',
      body: `Summary for ${fileName} is complete`,
      data: { type: 'summary_ready', summaryId }
    },
    slackMessage: `✅ Summary complete: Your summary for *${fileName}* is ready! View it in your dashboard.`
  }),

  exportComplete: (exportType: string, fileName: string) => ({
    title: 'Export Complete',
    message: `Your ${exportType.toUpperCase()} export for "${fileName}" is ready for download!`,
    pushPayload: {
      title: 'Export Complete',
      body: `${exportType.toUpperCase()} export ready for ${fileName}`,
      data: { type: 'export_complete', exportType }
    },
    slackMessage: `📄 Export ready: Your *${exportType.toUpperCase()}* export for *${fileName}* is available for download.`
  }),

  processingFailed: (fileName: string, error: string) => ({
    title: 'Processing Failed',
    message: `Failed to process "${fileName}": ${error}`,
    pushPayload: {
      title: 'Processing Failed',
      body: `Failed to process ${fileName}`,
      data: { type: 'processing_failed' }
    },
    slackMessage: `❌ Processing failed: Unable to process *${fileName}*. Please try uploading again.`
  })
};

/**
 * Get user's notification preferences
 */
export async function getUserNotificationPreferences(userId: string) {
  try {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available for notification preferences');
      return {
        email: true,
        push: true,
        slack: true,
        digest: true
      };
    }

    const { data, error } = await supabaseAdmin
      .from('user_preferences')
      .select('notification_preferences')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Return default preferences
      return {
        inApp: true,
        push: true,
        slack: true,
        email: false
      };
    }

    return data.notification_preferences || {
      inApp: true,
      push: true,
      slack: true,
      email: false
    };
  } catch (error) {
    console.error('Error getting notification preferences:', error);
    return {
      inApp: true,
      push: true,
      slack: true,
      email: false
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available for marking notification as read');
      return false;
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    return !error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Get unread notifications for user
 */
export async function getUnreadNotifications(userId: string, limit: number = 10) {
  try {
    if (!supabaseAdmin) {
      console.warn('Supabase admin client not available for fetching notifications');
      return [];
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}
