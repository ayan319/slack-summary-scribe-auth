'use client';

import posthog from 'posthog-js';

// PostHog client-side configuration
export function initPostHog() {
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    // Check if PostHog is already initialized
    if (!window.__POSTHOG_INITIALIZED__) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        person_profiles: 'identified_only',
        capture_pageview: false, // We'll manually capture pageviews
        capture_pageleave: true,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('PostHog loaded successfully');
          }
        },
        // Privacy settings
        respect_dnt: true,
        opt_out_capturing_by_default: false,
        // Performance settings
        // Feature flags
        bootstrap: {
          featureFlags: {},
        },
        // Session recording (optional)
        disable_session_recording: process.env.NODE_ENV === 'development',
        // Advanced settings
        cross_subdomain_cookie: false,
        persistence: 'localStorage+cookie',
        cookie_expiration: 365, // days
        upgrade: true,
        disable_persistence: false,
        // Custom properties
        property_blacklist: ['$current_url', '$referrer'],
        sanitize_properties: (properties, event) => {
          // Remove sensitive data
          if (properties.$current_url) {
            properties.$current_url = properties.$current_url.replace(/[?&]token=[^&]+/g, '');
          }
          return properties;
        }
      });

      // Mark as initialized
      window.__POSTHOG_INITIALIZED__ = true;
    }
  }
}

// Analytics tracking functions
export const analytics = {
  // Page tracking
  pageview: (url?: string) => {
    if (typeof window !== 'undefined' && posthog) {
      posthog.capture('$pageview', {
        $current_url: url || window.location.href,
        timestamp: new Date().toISOString()
      });
    }
  },

  // User identification
  identify: (userId: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.identify(userId, {
        ...properties,
        identified_at: new Date().toISOString()
      });
    }
  },

  // User properties
  setUserProperties: (properties: Record<string, any>) => {
    if (posthog) {
      posthog.setPersonProperties(properties);
    }
  },

  // Event tracking
  track: (event: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.capture(event, {
        ...properties,
        timestamp: new Date().toISOString(),
        page_url: typeof window !== 'undefined' ? window.location.href : undefined
      });
    }
  },

  // Business events
  trackSubscription: (action: 'created' | 'upgraded' | 'downgraded' | 'cancelled', plan: string, amount?: number) => {
    analytics.track('subscription_' + action, {
      plan,
      amount,
      currency: 'USD'
    });
  },

  trackPayment: (status: 'success' | 'failed', amount: number, plan: string, paymentMethod?: string) => {
    analytics.track('payment_' + status, {
      amount,
      plan,
      payment_method: paymentMethod,
      currency: 'USD'
    });
  },

  trackSlackIntegration: (action: 'connected' | 'disconnected' | 'summarized', workspaceId?: string) => {
    analytics.track('slack_' + action, {
      workspace_id: workspaceId
    });
  },

  trackFileUpload: (fileType: string, fileSize: number, processingTime?: number) => {
    analytics.track('file_uploaded', {
      file_type: fileType,
      file_size_mb: Math.round(fileSize / (1024 * 1024) * 100) / 100,
      processing_time_ms: processingTime
    });
  },

  trackExport: (format: 'pdf' | 'excel' | 'notion', summaryId: string) => {
    analytics.track('summary_exported', {
      export_format: format,
      summary_id: summaryId
    });
  },

  trackOnboarding: (step: string, completed: boolean) => {
    analytics.track('onboarding_step', {
      step,
      completed,
      step_number: parseInt(step.replace(/\D/g, '')) || 0
    });
  },

  trackFeatureUsage: (feature: string, context?: Record<string, any>) => {
    analytics.track('feature_used', {
      feature_name: feature,
      ...context
    });
  },

  // Error tracking
  trackError: (error: string, context?: Record<string, any>) => {
    analytics.track('error_occurred', {
      error_message: error,
      error_context: context,
      user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    });
  },

  // Performance tracking
  trackPerformance: (metric: string, value: number, unit: string) => {
    analytics.track('performance_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: unit
    });
  },

  // A/B testing
  getFeatureFlag: (flag: string): boolean | string | undefined => {
    if (posthog) {
      return posthog.getFeatureFlag(flag);
    }
    return undefined;
  },

  isFeatureEnabled: (flag: string): boolean => {
    if (posthog) {
      return posthog.isFeatureEnabled(flag) ?? false;
    }
    return false;
  },

  // Group analytics (for team/organization tracking)
  group: (groupType: string, groupKey: string, properties?: Record<string, any>) => {
    if (posthog) {
      posthog.group(groupType, groupKey, properties);
    }
  },

  // Reset user (for logout)
  reset: () => {
    if (posthog) {
      posthog.reset();
    }
  },

  // Opt out/in
  optOut: () => {
    if (posthog) {
      posthog.opt_out_capturing();
    }
  },

  optIn: () => {
    if (posthog) {
      posthog.opt_in_capturing();
    }
  },

  // Get events (placeholder for analytics)
  getEvents: async (eventNames: string[], since: Date): Promise<Record<string, number>> => {
    // This would integrate with PostHog API to get event counts
    // For now, return mock data
    const events: Record<string, number> = {};
    eventNames.forEach(name => {
      events[name] = Math.floor(Math.random() * 100);
    });
    return events;
  }
};

// Type declarations
declare global {
  interface Window {
    __POSTHOG_INITIALIZED__?: boolean;
  }
}

export default analytics;
