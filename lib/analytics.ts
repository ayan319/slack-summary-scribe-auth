import posthog from 'posthog-js';
import { supabaseAdmin } from './supabase';

// Client-side PostHog instance
let posthogClient: typeof posthog | null = null;

// Server-side PostHog instance
let posthogServer: any = null;

/**
 * Initialize PostHog client-side
 */
export function initializePostHog() {
  if (typeof window !== 'undefined' && !posthogClient) {
    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (apiKey) {
      posthog.init(apiKey, {
        api_host: host,
        capture_pageview: false, // We'll manually capture pageviews
        capture_pageleave: true,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.debug();
          }
        }
      });
      posthogClient = posthog;
    }
  }
  return posthogClient;
}

/**
 * Get server-side PostHog instance
 */
async function getServerPostHog() {
  if (!posthogServer && typeof window === 'undefined') {
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';

    if (apiKey) {
      try {
        const { PostHog } = await import('posthog-node');
        posthogServer = new PostHog(apiKey, { host });
      } catch (error) {
        console.warn('PostHog server-side not available:', error);
      }
    }
  }
  return posthogServer;
}

/**
 * Track event client-side
 */
export function trackEvent(event: string, properties?: Record<string, any>) {
  if (posthogClient) {
    posthogClient.capture(event, properties);
  }
}

/**
 * Track page view
 */
export function trackPageView(path?: string) {
  if (posthogClient) {
    posthogClient.capture('$pageview', {
      $current_url: path || window.location.href
    });
  }
}

/**
 * Identify user
 */
export function identifyUser(userId: string, properties?: Record<string, any>) {
  if (posthogClient) {
    posthogClient.identify(userId, properties);
  }
}

/**
 * Track event server-side
 */
export async function trackServerEvent(
  userId: string,
  event: string,
  properties?: Record<string, any>
) {
  const posthog = await getServerPostHog();
  if (posthog) {
    posthog.capture({
      distinctId: userId,
      event,
      properties
    });
  }

  // Store analytics event in Supabase
  try {
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('analytics_events')
        .insert({
          user_id: userId,
          event_type: event,
          event_data: properties || {},
          session_id: properties?.sessionId,
          ip_address: properties?.ipAddress,
          user_agent: properties?.userAgent,
          created_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('Failed to store analytics event:', error);
  }
}

/**
 * Analytics event types
 */
export const AnalyticsEvents = {
  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_PROFILE_UPDATED: 'user_profile_updated',

  // Subscription events
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',

  // Payment events
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_REFUNDED: 'payment_refunded',

  // File upload events
  FILE_UPLOADED: 'file_uploaded',
  FILE_PROCESSING_STARTED: 'file_processing_started',
  FILE_PROCESSING_COMPLETED: 'file_processing_completed',
  FILE_PROCESSING_FAILED: 'file_processing_failed',

  // Summary events
  SUMMARY_GENERATED: 'summary_generated',
  SUMMARY_VIEWED: 'summary_viewed',
  SUMMARY_SHARED: 'summary_shared',
  SUMMARY_DELETED: 'summary_deleted',

  // Export events
  EXPORT_STARTED: 'export_started',
  EXPORT_COMPLETED: 'export_completed',
  EXPORT_FAILED: 'export_failed',

  // Slack events
  SLACK_CONNECTED: 'slack_connected',
  SLACK_DISCONNECTED: 'slack_disconnected',
  SLACK_SUMMARY_GENERATED: 'slack_summary_generated',
  SLACK_OAUTH_STARTED: 'slack_oauth_started',
  SLACK_OAUTH_COMPLETED: 'slack_oauth_completed',

  // Organization events
  ORGANIZATION_CREATED: 'organization_created',
  ORGANIZATION_JOINED: 'organization_joined',
  TEAM_MEMBER_INVITED: 'team_member_invited',
  TEAM_MEMBER_REMOVED: 'team_member_removed',

  // Notification events
  NOTIFICATION_SENT: 'notification_sent',
  NOTIFICATION_CLICKED: 'notification_clicked',
  PUSH_NOTIFICATION_ENABLED: 'push_notification_enabled',
  EMAIL_NOTIFICATION_SENT: 'email_notification_sent',

  // Onboarding events
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_SKIPPED: 'onboarding_skipped',

  // Feature usage
  FEATURE_USED: 'feature_used',
  DARK_MODE_TOGGLED: 'dark_mode_toggled',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',

  // Page views
  PAGE_VIEW: 'page_view',
  DASHBOARD_VIEW: 'dashboard_view',
  UPLOADS_TAB_VIEW: 'uploads_tab_view',
  SUMMARIES_TAB_VIEW: 'summaries_tab_view',
  PRICING_PAGE_VIEW: 'pricing_page_view',
  LANDING_PAGE_VIEW: 'landing_page_view',

  // Error events
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
  UPLOAD_ERROR: 'upload_error',
  PROCESSING_ERROR: 'processing_error'
};

/**
 * Track file upload
 */
export async function trackFileUpload(
  userId: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  organizationId?: string
) {
  await trackServerEvent(userId, AnalyticsEvents.FILE_UPLOADED, {
    fileName,
    fileSize,
    fileType,
    organizationId
  });
}

/**
 * Track summary generation
 */
export async function trackSummaryGeneration(
  userId: string,
  summaryId: string,
  sourceType: string,
  wordCount?: number,
  organizationId?: string
) {
  await trackServerEvent(userId, AnalyticsEvents.SUMMARY_GENERATED, {
    summaryId,
    sourceType,
    wordCount,
    organizationId
  });
}

/**
 * Track export
 */
export async function trackExport(
  userId: string,
  exportType: string,
  summaryId: string,
  organizationId?: string
) {
  await trackServerEvent(userId, AnalyticsEvents.EXPORT_STARTED, {
    exportType,
    summaryId,
    organizationId
  });
}

/**
 * Track notification sent
 */
export async function trackNotificationSent(
  userId: string,
  notificationType: string,
  channel: 'in_app' | 'slack' | 'email',
  organizationId?: string
) {
  await trackServerEvent(userId, AnalyticsEvents.NOTIFICATION_SENT, {
    notificationType,
    channel,
    organizationId
  });
}

/**
 * Track subscription events
 */
export async function trackSubscriptionEvent(
  userId: string,
  action: 'created' | 'upgraded' | 'downgraded' | 'cancelled' | 'renewed',
  plan: string,
  amount?: number,
  organizationId?: string
) {
  const eventMap = {
    created: AnalyticsEvents.SUBSCRIPTION_CREATED,
    upgraded: AnalyticsEvents.SUBSCRIPTION_UPGRADED,
    downgraded: AnalyticsEvents.SUBSCRIPTION_DOWNGRADED,
    cancelled: AnalyticsEvents.SUBSCRIPTION_CANCELLED,
    renewed: AnalyticsEvents.SUBSCRIPTION_RENEWED
  };

  await trackServerEvent(userId, eventMap[action], {
    plan,
    amount,
    currency: 'USD',
    organizationId
  });
}

/**
 * Track payment events
 */
export async function trackPaymentEvent(
  userId: string,
  action: 'initiated' | 'success' | 'failed' | 'refunded',
  amount: number,
  plan: string,
  paymentMethod?: string,
  organizationId?: string
) {
  const eventMap = {
    initiated: AnalyticsEvents.PAYMENT_INITIATED,
    success: AnalyticsEvents.PAYMENT_SUCCESS,
    failed: AnalyticsEvents.PAYMENT_FAILED,
    refunded: AnalyticsEvents.PAYMENT_REFUNDED
  };

  await trackServerEvent(userId, eventMap[action], {
    amount,
    plan,
    payment_method: paymentMethod,
    currency: 'USD',
    organizationId
  });
}

/**
 * Track onboarding progress
 */
export async function trackOnboardingEvent(
  userId: string,
  action: 'started' | 'step_completed' | 'completed' | 'skipped',
  step?: string,
  organizationId?: string
) {
  const eventMap = {
    started: AnalyticsEvents.ONBOARDING_STARTED,
    step_completed: AnalyticsEvents.ONBOARDING_STEP_COMPLETED,
    completed: AnalyticsEvents.ONBOARDING_COMPLETED,
    skipped: AnalyticsEvents.ONBOARDING_SKIPPED
  };

  await trackServerEvent(userId, eventMap[action], {
    step,
    organizationId
  });
}

/**
 * Track feature usage
 */
export async function trackFeatureUsage(
  userId: string,
  feature: string,
  context?: Record<string, any>,
  organizationId?: string
) {
  await trackServerEvent(userId, AnalyticsEvents.FEATURE_USED, {
    feature_name: feature,
    ...context,
    organizationId
  });
}

/**
 * Track Slack integration events
 */
export async function trackSlackEvent(
  userId: string,
  action: 'connected' | 'disconnected' | 'oauth_started' | 'oauth_completed' | 'summary_generated',
  workspaceId?: string,
  organizationId?: string
) {
  const eventMap = {
    connected: AnalyticsEvents.SLACK_CONNECTED,
    disconnected: AnalyticsEvents.SLACK_DISCONNECTED,
    oauth_started: AnalyticsEvents.SLACK_OAUTH_STARTED,
    oauth_completed: AnalyticsEvents.SLACK_OAUTH_COMPLETED,
    summary_generated: AnalyticsEvents.SLACK_SUMMARY_GENERATED
  };

  await trackServerEvent(userId, eventMap[action], {
    workspace_id: workspaceId,
    organizationId
  });
}

/**
 * Get analytics data for admin dashboard
 */
export async function getAnalyticsData(
  startDate: Date,
  endDate: Date,
  organizationId?: string
) {
  try {
    // Demo mode - return sample analytics data
    console.log('📊 Getting analytics data (demo mode):', { startDate, endDate, organizationId });

    const demoAnalytics = [
      {
        id: 'analytics-1',
        user_id: 'demo-user-123',
        event_type: 'file_upload',
        event_data: { fileName: 'demo-file.pdf', fileSize: 1024000 },
        created_at: new Date().toISOString(),
        session_id: 'demo-session-123'
      },
      {
        id: 'analytics-2',
        user_id: 'demo-user-123',
        event_type: 'summary_generated',
        event_data: { summaryId: 'summary-123', processingTime: 2500 },
        created_at: new Date(Date.now() - 3600000).toISOString(),
        session_id: 'demo-session-123'
      }
    ];

    return demoAnalytics;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return { data: [], error: 'Failed to fetch analytics data' };
  }
}

/**
 * Get usage metrics
 */
export async function getUsageMetrics(organizationId?: string) {
  try {
    // Demo mode - return sample usage metrics
    console.log('📊 Getting usage metrics (demo mode):', { organizationId });

    return {
      uploads: 15,
      summaries: 12,
      exports: 8,
      activeUsers: 3
    };
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    return {
      uploads: 0,
      summaries: 0,
      exports: 0,
      activeUsers: 0
    };
  }
}

/**
 * Get daily activity data for charts
 */
export async function getDailyActivityData(days: number = 30, organizationId?: string) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await getAnalyticsData(startDate, new Date(), organizationId);

    if (!analytics || !Array.isArray(analytics)) return [];

    // Group by date
    const dailyData: Record<string, any> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      dailyData[dateStr] = {
        date: dateStr,
        uploads: 0,
        summaries: 0,
        exports: 0,
        pageViews: 0
      };
    }

    analytics.forEach(event => {
      const dateStr = event.created_at.split('T')[0];
      if (dailyData[dateStr]) {
        switch (event.event_type) {
          case AnalyticsEvents.FILE_UPLOADED:
            dailyData[dateStr].uploads++;
            break;
          case AnalyticsEvents.SUMMARY_GENERATED:
            dailyData[dateStr].summaries++;
            break;
          case AnalyticsEvents.EXPORT_STARTED:
            dailyData[dateStr].exports++;
            break;
          case AnalyticsEvents.PAGE_VIEW:
            dailyData[dateStr].pageViews++;
            break;
        }
      }
    });

    return Object.values(dailyData).reverse();
  } catch (error) {
    console.error('Error fetching daily activity data:', error);
    return [];
  }
}
