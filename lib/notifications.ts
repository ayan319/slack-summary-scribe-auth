import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export interface NotificationData {
  userId: string;
  organizationId?: string;
  type: 'upload_complete' | 'summary_ready' | 'export_complete' | 'system' | 'file_uploaded' | 'summary_completed' | 'export_triggered';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
}

/**
 * Create an in-app notification
 */
export async function createNotification(notification: NotificationData): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        organization_id: notification.organizationId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to create notification:', error);
      return false;
    }

    // Show toast notification
    toast.success(notification.title, {
      description: notification.message
    });

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * Send push notification (demo mode)
 */
export async function sendPushNotification(
  userId: string, 
  payload: PushNotificationPayload
): Promise<boolean> {
  console.log('📱 Sending push notification (demo mode):', { userId, payload });
  return true;
}

/**
 * Send Slack notification (demo mode)
 */
export async function sendSlackNotification(
  userId: string,
  message: string,
  title?: string
): Promise<boolean> {
  console.log('💬 Sending Slack notification (demo mode):', { userId, message, title });
  return true;
}

/**
 * Send email notification (demo mode)
 */
export async function sendEmailNotification(
  userId: string,
  subject: string,
  message: string,
  templateData?: Record<string, unknown>
): Promise<boolean> {
  console.log('📧 Sending email notification (demo mode):', { userId, subject, message, templateData });
  return true;
}

/**
 * Send notification via all enabled channels (demo mode)
 */
export async function sendNotification(
  notification: NotificationData,
  channels: {
    inApp?: boolean;
    email?: boolean;
    push?: boolean;
    slack?: boolean;
  } = { inApp: true }
): Promise<boolean> {
  console.log('🔔 Sending multi-channel notification (demo mode):', { notification, channels });
  
  let success = true;
  
  if (channels.inApp) {
    success = success && await createNotification(notification);
  }
  
  if (channels.email) {
    success = success && await sendEmailNotification(
      notification.userId,
      notification.title,
      notification.message,
      notification.data
    );
  }
  
  if (channels.push) {
    success = success && await sendPushNotification(notification.userId, {
      title: notification.title,
      body: notification.message,
      data: notification.data
    });
  }
  
  if (channels.slack) {
    success = success && await sendSlackNotification(
      notification.userId,
      notification.message,
      notification.title
    );
  }
  
  return success;
}

/**
 * Get user's notification preferences (demo mode)
 */
export async function getUserNotificationPreferences(userId: string) {
  console.log('⚙️ Getting notification preferences (demo mode):', userId);
  
  return {
    email: true,
    push: true,
    slack: true,
    digest: true
  };
}

/**
 * Update user's notification preferences (demo mode)
 */
export async function updateUserNotificationPreferences(
  userId: string,
  preferences: {
    email?: boolean;
    push?: boolean;
    slack?: boolean;
    digest?: boolean;
  }
): Promise<boolean> {
  console.log('⚙️ Updating notification preferences (demo mode):', { userId, preferences });
  return true;
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }

    return true;
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
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
}

/**
 * Send digest email (demo mode)
 */
export async function sendDigestEmail(userId: string, period: 'daily' | 'weekly'): Promise<boolean> {
  console.log('📊 Sending digest email (demo mode):', { userId, period });
  return true;
}

/**
 * Schedule digest notifications (demo mode)
 */
export async function scheduleDigestNotifications(): Promise<void> {
  console.log('⏰ Scheduling digest notifications (demo mode)');
}

// Notification helpers for common scenarios

/**
 * Notify when file upload is complete (demo mode)
 */
export async function notifyUploadComplete(
  userId: string,
  fileName: string,
  organizationId?: string
): Promise<boolean> {
  return sendNotification({
    userId,
    organizationId,
    type: 'upload_complete',
    title: 'Upload Complete',
    message: `Your file "${fileName}" has been uploaded successfully`,
    data: { fileName }
  }, { inApp: true, email: true });
}

/**
 * Notify when summary is ready (demo mode)
 */
export async function notifySummaryReady(
  userId: string,
  summaryId: string,
  fileName: string,
  organizationId?: string
): Promise<boolean> {
  return sendNotification({
    userId,
    organizationId,
    type: 'summary_ready',
    title: 'Summary Ready',
    message: `Your summary for "${fileName}" is ready to view`,
    data: { summaryId, fileName }
  }, { inApp: true, push: true });
}

/**
 * Notify when export is complete (demo mode)
 */
export async function notifyExportComplete(
  userId: string,
  exportType: string,
  downloadUrl: string,
  organizationId?: string
): Promise<boolean> {
  return sendNotification({
    userId,
    organizationId,
    type: 'export_complete',
    title: 'Export Complete',
    message: `Your ${exportType} export is ready for download`,
    data: { exportType, downloadUrl }
  }, { inApp: true, email: true });
}
