// This file configures the initialization of Sentry on the server side.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  // Enhanced server integrations
  integrations: [
    Sentry.httpIntegration({
      breadcrumbs: true,
    }),
  ],

  // Enhanced performance monitoring
  // profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Enhanced error filtering and server context
  beforeSend(event, hint) {
    // Filter out known non-critical errors
    const error = hint.originalException;

    if (error && typeof error === 'object' && 'message' in error) {
      const message = error.message as string;

      // Filter out common non-critical errors
      if (
        message.includes('ECONNRESET') ||
        message.includes('ENOTFOUND') ||
        message.includes('timeout') ||
        message.includes('Rate limit exceeded') ||
        message.includes('EPIPE') ||
        message.includes('socket hang up')
      ) {
        return null;
      }
    }

    // Add server-specific context
    if (event.exception) {
      event.tags = {
        ...event.tags,
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV,
      };

      // Add server breadcrumb
      Sentry.addBreadcrumb({
        message: 'Server error occurred',
        category: 'server',
        level: 'error',
        data: {
          timestamp: new Date().toISOString(),
          pid: process.pid,
          memory: process.memoryUsage(),
        },
      });
    }

    return event;
  },
  
  // Set server context
  initialScope: {
    tags: {
      component: 'server'
    }
  }
});
