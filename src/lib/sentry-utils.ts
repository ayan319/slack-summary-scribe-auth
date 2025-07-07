import * as Sentry from '@sentry/nextjs';

/**
 * Enhanced Sentry utilities for comprehensive error tracking and breadcrumbs
 */

export interface BreadcrumbData {
  [key: string]: any;
}

export class SentryTracker {
  /**
   * Add API call breadcrumb
   */
  static addAPIBreadcrumb(
    method: string,
    url: string,
    status?: number,
    data?: BreadcrumbData
  ) {
    Sentry.addBreadcrumb({
      message: `API ${method} ${url}`,
      category: 'api',
      level: status && status >= 400 ? 'error' : 'info',
      data: {
        method,
        url,
        status,
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }

  /**
   * Add Slack webhook event breadcrumb
   */
  static addSlackWebhookBreadcrumb(
    event: string,
    channel?: string,
    user?: string,
    data?: BreadcrumbData
  ) {
    Sentry.addBreadcrumb({
      message: `Slack webhook: ${event}`,
      category: 'slack',
      level: 'info',
      data: {
        event,
        channel,
        user,
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }

  /**
   * Add file upload breadcrumb
   */
  static addUploadBreadcrumb(
    fileName: string,
    fileSize: number,
    status: 'started' | 'processing' | 'completed' | 'failed',
    data?: BreadcrumbData
  ) {
    Sentry.addBreadcrumb({
      message: `File upload ${status}: ${fileName}`,
      category: 'upload',
      level: status === 'failed' ? 'error' : 'info',
      data: {
        fileName,
        fileSize,
        status,
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }

  /**
   * Add AI summarization breadcrumb
   */
  static addSummarizationBreadcrumb(
    source: 'slack' | 'upload' | 'manual',
    status: 'started' | 'completed' | 'failed',
    processingTime?: number,
    data?: BreadcrumbData
  ) {
    Sentry.addBreadcrumb({
      message: `AI summarization ${status} (${source})`,
      category: 'ai',
      level: status === 'failed' ? 'error' : 'info',
      data: {
        source,
        status,
        processingTime,
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }

  /**
   * Add authentication breadcrumb
   */
  static addAuthBreadcrumb(
    action: 'login' | 'logout' | 'signup' | 'oauth' | 'token_refresh',
    provider?: string,
    success?: boolean,
    data?: BreadcrumbData
  ) {
    Sentry.addBreadcrumb({
      message: `Auth ${action}${provider ? ` (${provider})` : ''}`,
      category: 'auth',
      level: success === false ? 'warning' : 'info',
      data: {
        action,
        provider,
        success,
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }

  /**
   * Add database operation breadcrumb
   */
  static addDatabaseBreadcrumb(
    operation: 'select' | 'insert' | 'update' | 'delete',
    table: string,
    success?: boolean,
    data?: BreadcrumbData
  ) {
    Sentry.addBreadcrumb({
      message: `Database ${operation} on ${table}`,
      category: 'database',
      level: success === false ? 'error' : 'info',
      data: {
        operation,
        table,
        success,
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }

  /**
   * Add user action breadcrumb
   */
  static addUserActionBreadcrumb(
    action: string,
    component?: string,
    data?: BreadcrumbData
  ) {
    Sentry.addBreadcrumb({
      message: `User action: ${action}${component ? ` in ${component}` : ''}`,
      category: 'user',
      level: 'info',
      data: {
        action,
        component,
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }

  /**
   * Add export operation breadcrumb
   */
  static addExportBreadcrumb(
    format: 'pdf' | 'excel' | 'notion',
    status: 'started' | 'completed' | 'failed',
    itemCount?: number,
    data?: BreadcrumbData
  ) {
    Sentry.addBreadcrumb({
      message: `Export ${format} ${status}`,
      category: 'export',
      level: status === 'failed' ? 'error' : 'info',
      data: {
        format,
        status,
        itemCount,
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }

  /**
   * Set user context for better error tracking
   */
  static setUserContext(userId: string | undefined, email?: string, organizationId?: string) {
    if (userId === undefined) {
      Sentry.setUser(null);
      Sentry.setTag('userId', '');
      Sentry.setTag('organizationId', '');
    } else {
      Sentry.setUser({
        id: userId,
        email,
        organizationId,
      });

      Sentry.setTag('userId', userId);
      if (organizationId) {
        Sentry.setTag('organizationId', organizationId);
      }
    }
  }

  /**
   * Clear user context on logout
   */
  static clearUserContext() {
    Sentry.setUser(null);
    Sentry.setTag('userId', null);
    Sentry.setTag('organizationId', null);
  }

  /**
   * Capture exception with enhanced context
   */
  static captureException(
    error: Error,
    context?: {
      component?: string;
      action?: string;
      userId?: string;
      extra?: BreadcrumbData;
    }
  ) {
    Sentry.withScope((scope) => {
      if (context?.component) {
        scope.setTag('component', context.component);
      }
      if (context?.action) {
        scope.setTag('action', context.action);
      }
      if (context?.userId) {
        scope.setTag('userId', context.userId);
      }
      if (context?.extra) {
        scope.setContext('extra', context.extra);
      }

      scope.setLevel('error');
      Sentry.captureException(error);
    });
  }

  /**
   * Capture message with context
   */
  static captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context?: BreadcrumbData
  ) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('messageContext', context);
      }
      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  }
}
