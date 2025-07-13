/**
 * Production-ready logging utility with structured logging and monitoring integration
 */

import * as Sentry from '@sentry/nextjs';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface LogContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  component?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
      stack: error?.stack
    };

    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // Log everything in development
    }

    // In production, only log INFO and above
    const levelPriority = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3,
      [LogLevel.FATAL]: 4
    };

    return levelPriority[level] >= levelPriority[LogLevel.INFO];
  }

  private logToConsole(entry: LogEntry): void {
    const { level, message, timestamp, context, error } = entry;
    
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    const fullMessage = `${prefix}${contextStr} ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(fullMessage, error);
        break;
      case LogLevel.INFO:
        console.info(fullMessage, error);
        break;
      case LogLevel.WARN:
        console.warn(fullMessage, error);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(fullMessage, error);
        break;
    }
  }

  private logToSentry(entry: LogEntry): void {
    const { level, message, context, error } = entry;

    // Set user context if available
    if (context?.userId) {
      Sentry.setUser({ id: context.userId });
    }

    // Add breadcrumb for context
    Sentry.addBreadcrumb({
      message,
      level: level as Sentry.SeverityLevel,
      category: context?.component || 'app',
      data: {
        ...context,
        timestamp: entry.timestamp
      }
    });

    // Send to Sentry based on level
    if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      if (error) {
        Sentry.captureException(error, {
          tags: {
            component: context?.component,
            action: context?.action,
            level
          },
          extra: context?.metadata,
          user: context?.userId ? { id: context.userId } : undefined
        });
      } else {
        Sentry.captureMessage(message, level as Sentry.SeverityLevel);
      }
    }
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry = this.formatMessage(level, message, context, error);

    // Always log to console
    this.logToConsole(entry);

    // Log to Sentry in production or for errors
    if (this.isProduction || level === LogLevel.ERROR || level === LogLevel.FATAL) {
      this.logToSentry(entry);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log(LogLevel.FATAL, message, context, error);
  }

  // Specialized logging methods for common use cases
  apiRequest(method: string, endpoint: string, context?: LogContext): void {
    this.info(`API ${method} ${endpoint}`, {
      ...context,
      component: 'api',
      action: 'request'
    });
  }

  apiResponse(method: string, endpoint: string, status: number, duration: number, context?: LogContext): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API ${method} ${endpoint} - ${status}`, {
      ...context,
      component: 'api',
      action: 'response',
      duration,
      metadata: { status }
    });
  }

  authEvent(action: string, success: boolean, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this.log(level, `Auth ${action} ${success ? 'successful' : 'failed'}`, {
      ...context,
      component: 'auth',
      action
    });
  }

  databaseOperation(operation: string, table: string, success: boolean, duration?: number, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, `Database ${operation} on ${table} ${success ? 'successful' : 'failed'}`, {
      ...context,
      component: 'database',
      action: operation,
      duration,
      metadata: { table }
    });
  }

  aiOperation(operation: string, model: string, success: boolean, duration?: number, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, `AI ${operation} with ${model} ${success ? 'successful' : 'failed'}`, {
      ...context,
      component: 'ai',
      action: operation,
      duration,
      metadata: { model }
    });
  }

  slackEvent(event: string, success: boolean, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this.log(level, `Slack ${event} ${success ? 'successful' : 'failed'}`, {
      ...context,
      component: 'slack',
      action: event
    });
  }

  uploadEvent(action: string, success: boolean, fileSize?: number, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    this.log(level, `Upload ${action} ${success ? 'successful' : 'failed'}`, {
      ...context,
      component: 'upload',
      action,
      metadata: { fileSize }
    });
  }

  performanceMetric(metric: string, value: number, unit: string, context?: LogContext): void {
    this.info(`Performance: ${metric} = ${value}${unit}`, {
      ...context,
      component: 'performance',
      action: 'metric',
      metadata: { metric, value, unit }
    });
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext): void {
    const level = severity === 'critical' ? LogLevel.FATAL : 
                 severity === 'high' ? LogLevel.ERROR :
                 severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, `Security: ${event}`, {
      ...context,
      component: 'security',
      action: event,
      metadata: { severity }
    });
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext, error?: Error) => logger.warn(message, context, error),
  error: (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context),
  fatal: (message: string, error?: Error, context?: LogContext) => logger.fatal(message, error, context),
  
  // Specialized methods
  api: {
    request: (method: string, endpoint: string, context?: LogContext) => 
      logger.apiRequest(method, endpoint, context),
    response: (method: string, endpoint: string, status: number, duration: number, context?: LogContext) => 
      logger.apiResponse(method, endpoint, status, duration, context)
  },
  
  auth: (action: string, success: boolean, context?: LogContext) => 
    logger.authEvent(action, success, context),
  
  db: (operation: string, table: string, success: boolean, duration?: number, context?: LogContext) => 
    logger.databaseOperation(operation, table, success, duration, context),
  
  ai: (operation: string, model: string, success: boolean, duration?: number, context?: LogContext) => 
    logger.aiOperation(operation, model, success, duration, context),
  
  slack: (event: string, success: boolean, context?: LogContext) => 
    logger.slackEvent(event, success, context),
  
  upload: (action: string, success: boolean, fileSize?: number, context?: LogContext) => 
    logger.uploadEvent(action, success, fileSize, context),
  
  performance: (metric: string, value: number, unit: string, context?: LogContext) => 
    logger.performanceMetric(metric, value, unit, context),
  
  security: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', context?: LogContext) => 
    logger.securityEvent(event, severity, context)
};

export default logger;
