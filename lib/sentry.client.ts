// Singleton Sentry client initialization for Next.js 15 App Router
// This file ensures Sentry Session Replay is initialized only once on the client
// and prevents "Multiple Sentry Session Replay instances are not supported" error

import * as Sentry from '@sentry/nextjs';

// Global flag to track initialization state
declare global {
  interface Window {
    __SENTRY_INITIALIZED__?: boolean;
  }
}

// Singleton pattern to prevent multiple initializations
let isInitialized = false;

export function initializeSentry() {
  // Prevent re-initialization during Next.js Fast Refresh in development
  if (isInitialized || typeof window === 'undefined') {
    return;
  }

  // Check global window flag to prevent multiple instances
  if (typeof window !== 'undefined' && window.__SENTRY_INITIALIZED__) {
    isInitialized = true;
    return;
  }

  // Additional safeguard using Sentry's getClient to check for existing client
  if (Sentry.getClient()) {
    isInitialized = true;
    if (typeof window !== 'undefined') {
      window.__SENTRY_INITIALIZED__ = true;
    }
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

      // Adjust this value in production, or use tracesSampler for greater control
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Setting this option to true will print useful information to the console while you're setting up Sentry.
      debug: process.env.NODE_ENV === 'development',

      replaysOnErrorSampleRate: 1.0,

      // This sets the sample rate to be 10%. You may want this to be 100% while
      // in development and sample at a lower rate in production
      replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.1,

      // Enhanced integrations with breadcrumbs
      integrations: [
        Sentry.replayIntegration({
          // Additional Replay configuration goes in here, for example:
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

    isInitialized = true;
    if (typeof window !== 'undefined') {
      window.__SENTRY_INITIALIZED__ = true;
    }
    console.log('✅ Sentry client initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Sentry client:', error);
  }
}

// Auto-initialize when this module is imported on the client side
if (typeof window !== 'undefined') {
  initializeSentry();
}

// Sentry utility class for consistent tracking across the application
export class SentryTracker {
  static addAPIBreadcrumb(method: string, endpoint: string, data?: any, extra?: any) {
    Sentry.addBreadcrumb({
      message: `API ${method} ${endpoint}`,
      category: 'api',
      level: 'info',
      data: { method, endpoint, ...data, ...extra },
    });
  }

  static addAuthBreadcrumb(action: string, status: string, success: boolean, extra?: any) {
    Sentry.addBreadcrumb({
      message: `Auth ${action} ${status}`,
      category: 'auth',
      level: success ? 'info' : 'error',
      data: { action, status, success, ...extra },
    });
  }

  static addDatabaseBreadcrumb(operation: string, table: string, success: boolean, extra?: any) {
    Sentry.addBreadcrumb({
      message: `Database ${operation} on ${table}`,
      category: 'database',
      level: success ? 'info' : 'error',
      data: { operation, table, success, ...extra },
    });
  }

  static addSummarizationBreadcrumb(type: string, status: string, processingTime?: number, extra?: any) {
    Sentry.addBreadcrumb({
      message: `Summarization ${type} ${status}`,
      category: 'ai',
      level: 'info',
      data: { type, status, processingTime, ...extra },
    });
  }

  static addSlackWebhookBreadcrumb(event: string, success: boolean, extra?: any) {
    Sentry.addBreadcrumb({
      message: `Slack webhook ${event}`,
      category: 'slack',
      level: success ? 'info' : 'error',
      data: { event, success, ...extra },
    });
  }

  static addUploadBreadcrumb(action: string, success: boolean, extra?: any) {
    Sentry.addBreadcrumb({
      message: `Upload ${action}`,
      category: 'upload',
      level: success ? 'info' : 'error',
      data: { action, success, ...extra },
    });
  }

  static setUserContext(user?: { id: string; email?: string; [key: string]: any }) {
    Sentry.setUser(user || null);
  }

  static captureException(error: Error, context?: { component?: string; action?: string; extra?: any }) {
    Sentry.captureException(error, {
      tags: {
        component: context?.component,
        action: context?.action,
      },
      extra: context?.extra,
    });
  }
}

export default initializeSentry;
