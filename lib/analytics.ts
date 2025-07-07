import posthog from 'posthog-js';
import { PostHog } from 'posthog-node';
import { supabaseAdmin } from './supabase';

// Client-side PostHog instance
let posthogClient: typeof posthog | null = null;

// Server-side PostHog instance
let posthogServer: PostHog | null = null;

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
function getServerPostHog() {
  if (!posthogServer) {
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';

    if (apiKey) {
      posthogServer = new PostHog(apiKey, { host });
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
  const posthog = getServerPostHog();
  if (posthog) {
    posthog.capture({
      distinctId: userId,
      event,
      properties
    });
  }

  // Also store in our own analytics table for internal analysis
  try {
    if (supabaseAdmin) {
      await supabaseAdmin
      .from('analytics')
      .insert({
        user_id: userId,
        event_type: event,
        event_data: properties || {},
        session_id: properties?.sessionId,
        ip_address: properties?.ipAddress,
        user_agent: properties?.userAgent
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
  
  // File upload events
  FILE_UPLOADED: 'file_uploaded',
  FILE_PROCESSING_STARTED: 'file_processing_started',
  FILE_PROCESSING_COMPLETED: 'file_processing_completed',
  FILE_PROCESSING_FAILED: 'file_processing_failed',
  
  // Summary events
  SUMMARY_GENERATED: 'summary_generated',
  SUMMARY_VIEWED: 'summary_viewed',
  SUMMARY_SHARED: 'summary_shared',
  
  // Export events
  EXPORT_STARTED: 'export_started',
  EXPORT_COMPLETED: 'export_completed',
  EXPORT_FAILED: 'export_failed',
  
  // Slack events
  SLACK_CONNECTED: 'slack_connected',
  SLACK_DISCONNECTED: 'slack_disconnected',
  SLACK_SUMMARY_GENERATED: 'slack_summary_generated',
  
  // Organization events
  ORGANIZATION_CREATED: 'organization_created',
  ORGANIZATION_JOINED: 'organization_joined',
  TEAM_MEMBER_INVITED: 'team_member_invited',
  
  // Notification events
  NOTIFICATION_SENT: 'notification_sent',
  NOTIFICATION_CLICKED: 'notification_clicked',
  PUSH_NOTIFICATION_ENABLED: 'push_notification_enabled',
  
  // Page views
  PAGE_VIEW: 'page_view',
  DASHBOARD_VIEW: 'dashboard_view',
  UPLOADS_TAB_VIEW: 'uploads_tab_view',
  SUMMARIES_TAB_VIEW: 'summaries_tab_view'
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
 * Get analytics data for admin dashboard
 */
export async function getAnalyticsData(
  startDate: Date,
  endDate: Date,
  organizationId?: string
) {
  try {
    if (!supabaseAdmin) {
      return { data: [], error: 'Database not available' };
    }

    let query = supabaseAdmin
      .from('analytics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (organizationId) {
      // Get users in organization first
      const { data: orgUsers } = await supabaseAdmin!
        .from('user_organizations')
        .select('user_id')
        .eq('organization_id', organizationId);

      if (orgUsers && orgUsers.length > 0) {
        const userIds = orgUsers.map((u: any) => u.user_id);
        query = query.in('user_id', userIds);
      }
    }

    const { data: analytics, error } = await query;

    if (error) {
      console.error('Analytics query error:', error);
      return { data: [], error: error.message };
    }

    return analytics || [];
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
    if (!supabaseAdmin) {
      return {
        uploadsCount: 0,
        summariesCount: 0,
        exportsCount: 0,
        error: 'Database not available'
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get file uploads count
    let uploadsQuery = supabaseAdmin
      .from('file_uploads')
      .select('id', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (organizationId) {
      uploadsQuery = uploadsQuery.eq('organization_id', organizationId);
    }

    const { count: uploadsCount } = await uploadsQuery;

    // Get summaries count
    let summariesQuery = supabaseAdmin
      .from('summaries')
      .select('id', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (organizationId) {
      summariesQuery = summariesQuery.eq('organization_id', organizationId);
    }

    const { count: summariesCount } = await summariesQuery;

    // Get exports count
    let exportsQuery = supabaseAdmin
      .from('exports')
      .select('id', { count: 'exact' })
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (organizationId) {
      exportsQuery = exportsQuery.eq('organization_id', organizationId);
    }

    const { count: exportsCount } = await exportsQuery;

    // Get active users count
    const analytics = await getAnalyticsData(thirtyDaysAgo, new Date(), organizationId);
    const activeUsers = analytics && Array.isArray(analytics) ? new Set(analytics.map(a => a.user_id)).size : 0;

    return {
      uploads: uploadsCount || 0,
      summaries: summariesCount || 0,
      exports: exportsCount || 0,
      activeUsers
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
