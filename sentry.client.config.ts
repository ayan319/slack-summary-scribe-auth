// This file configures the initialization of Sentry on the browser/client side
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  release: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode
  debug: process.env.NODE_ENV === 'development',

  // Session Replay for debugging
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,

  // Integrations with reduced OpenTelemetry warnings
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Enhanced error filtering and context
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    const error = hint.originalException;

    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message as string;

      // Filter out common non-critical errors
      if (
        message.includes('Non-Error promise rejection captured') ||
        message.includes('ResizeObserver loop limit exceeded') ||
        message.includes('Script error') ||
        message.includes('Network request failed') ||
        message.includes('ChunkLoadError') ||
        message.includes('Loading chunk')
      ) {
        return null;
      }
    }

    // Add custom context for better debugging
    if (event.exception) {
      event.tags = {
        ...event.tags,
        errorBoundary: event.tags?.errorBoundary || false,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Add breadcrumb for the error context
      Sentry.addBreadcrumb({
        message: 'Error occurred',
        category: 'error',
        level: 'error',
        data: {
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
      });
    }

    return event;
  },

  // Set user context
  initialScope: {
    tags: {
      component: 'client'
    }
  }
});
