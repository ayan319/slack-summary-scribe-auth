/**
 * Analytics and Monitoring Service
 * Integrates with Mixpanel for usage tracking and Sentry for error monitoring
 */

import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
    persistence: 'localStorage'
  });
}

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
}

export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  plan?: string;
  teamId?: string;
  company?: string;
  signupDate?: string;
}

export class Analytics {
  /**
   * Track an event
   */
  static track(event: string, properties?: Record<string, any>, userId?: string) {
    try {
      if (typeof window === 'undefined') return;

      // Add common properties
      const enrichedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        environment: process.env.NODE_ENV
      };

      // Track with Mixpanel
      if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
        mixpanel.track(event, enrichedProperties);
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Analytics Event:', event, enrichedProperties);
      }

      // Send to custom analytics endpoint
      this.sendToCustomAnalytics(event, enrichedProperties, userId);

    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  /**
   * Identify a user
   */
  static identify(userProperties: UserProperties) {
    try {
      if (typeof window === 'undefined') return;

      const { userId, ...properties } = userProperties;

      // Identify with Mixpanel
      if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
        mixpanel.identify(userId);
        mixpanel.people.set(properties);
      }

      // Log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('👤 User Identified:', userProperties);
      }

    } catch (error) {
      console.error('Analytics identify error:', error);
    }
  }

  /**
   * Track page view
   */
  static pageView(page: string, properties?: Record<string, any>) {
    this.track('Page Viewed', {
      page,
      title: document.title,
      ...properties
    });
  }

  /**
   * Track summary creation
   */
  static summaryCreated(properties: {
    summaryId: string;
    source: string;
    aiModel: string;
    processingTime: number;
    confidence: number;
    wordCount: number;
    userId: string;
    teamId?: string;
  }) {
    this.track('Summary Created', properties, properties.userId);
  }

  /**
   * Track export usage
   */
  static exportUsed(properties: {
    summaryId: string;
    exportType: string;
    userId: string;
    teamId?: string;
  }) {
    this.track('Export Used', properties, properties.userId);
  }

  /**
   * Track plan upgrade
   */
  static planUpgraded(properties: {
    fromPlan: string;
    toPlan: string;
    userId: string;
    revenue: number;
  }) {
    this.track('Plan Upgraded', properties, properties.userId);
  }

  /**
   * Track user signup
   */
  static userSignedUp(properties: {
    userId: string;
    email: string;
    source: string; // 'slack', 'email', 'google'
    plan: string;
    company?: string;
  }) {
    this.track('User Signed Up', properties, properties.userId);
  }

  /**
   * Track Slack integration
   */
  static slackConnected(properties: {
    userId: string;
    teamId: string;
    teamName: string;
    scope: string;
  }) {
    this.track('Slack Connected', properties, properties.userId);
  }

  /**
   * Track feature usage
   */
  static featureUsed(feature: string, properties?: Record<string, any>, userId?: string) {
    this.track('Feature Used', {
      feature,
      ...properties
    }, userId);
  }

  /**
   * Track errors (non-critical)
   */
  static trackError(error: Error, context?: Record<string, any>) {
    this.track('Error Occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorName: error.name,
      ...context
    });
  }

  /**
   * Send to custom analytics endpoint
   */
  private static async sendToCustomAnalytics(
    event: string, 
    properties: Record<string, any>, 
    userId?: string
  ) {
    try {
      if (process.env.NODE_ENV === 'development') return;

      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          properties,
          userId,
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      // Silently fail - don't break user experience for analytics
      console.warn('Custom analytics failed:', error);
    }
  }
}

// Predefined event tracking functions
export const trackSummaryCreated = (properties: Parameters<typeof Analytics.summaryCreated>[0]) => 
  Analytics.summaryCreated(properties);

export const trackExportUsed = (properties: Parameters<typeof Analytics.exportUsed>[0]) => 
  Analytics.exportUsed(properties);

export const trackPlanUpgraded = (properties: Parameters<typeof Analytics.planUpgraded>[0]) => 
  Analytics.planUpgraded(properties);

export const trackUserSignedUp = (properties: Parameters<typeof Analytics.userSignedUp>[0]) => 
  Analytics.userSignedUp(properties);

export const trackSlackConnected = (properties: Parameters<typeof Analytics.slackConnected>[0]) => 
  Analytics.slackConnected(properties);

export const trackFeatureUsed = (feature: string, properties?: Record<string, any>, userId?: string) => 
  Analytics.featureUsed(feature, properties, userId);

// React hook for analytics
export const useAnalytics = () => {
  return {
    track: Analytics.track,
    identify: Analytics.identify,
    pageView: Analytics.pageView,
    trackSummaryCreated,
    trackExportUsed,
    trackPlanUpgraded,
    trackUserSignedUp,
    trackSlackConnected,
    trackFeatureUsed
  };
};

// Performance monitoring
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  static startTiming(operation: string) {
    this.marks.set(operation, performance.now());
  }

  /**
   * End timing and track the duration
   */
  static endTiming(operation: string, properties?: Record<string, any>) {
    const startTime = this.marks.get(operation);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.marks.delete(operation);

      Analytics.track('Performance Timing', {
        operation,
        duration,
        ...properties
      });

      return duration;
    }
    return null;
  }

  /**
   * Track API response times
   */
  static trackApiCall(endpoint: string, method: string, duration: number, status: number) {
    Analytics.track('API Call', {
      endpoint,
      method,
      duration,
      status,
      success: status >= 200 && status < 300
    });
  }
}

// Error boundary integration
export const trackErrorBoundary = (error: Error, errorInfo: any) => {
  Analytics.track('Error Boundary Triggered', {
    errorMessage: error.message,
    errorStack: error.stack,
    componentStack: errorInfo.componentStack
  });
};
