/**
 * Console warning cleaner for production builds
 * Filters out known non-critical warnings to reduce noise
 */

// Known non-critical warning patterns to filter out
const FILTERED_WARNINGS = [
  'Critical dependency: the request of a dependency is an expression',
  'OpenTelemetry',
  'Sentry Logger',
  'next-sitemap',
  'MODULE_TYPELESS_PACKAGE_JSON',
  'defaultProps will be removed',
  'componentWillReceiveProps has been renamed',
  'componentWillMount has been renamed',
  'componentWillUpdate has been renamed',
];

// Store original console methods
const originalConsole = {
  warn: console.warn,
  error: console.error,
  log: console.log,
};

/**
 * Initialize console filtering for production
 */
export function initConsoleFiltering() {
  if (process.env.NODE_ENV === 'production') {
    // Filter console.warn
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      const shouldFilter = FILTERED_WARNINGS.some(pattern => 
        message.includes(pattern)
      );
      
      if (!shouldFilter) {
        originalConsole.warn(...args);
      }
    };

    // Filter console.error for known non-critical errors
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      const shouldFilter = FILTERED_WARNINGS.some(pattern => 
        message.includes(pattern)
      );
      
      if (!shouldFilter) {
        originalConsole.error(...args);
      }
    };
  }
}

/**
 * Restore original console methods
 */
export function restoreConsole() {
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.log = originalConsole.log;
}

/**
 * Log application startup information
 */
export function logStartupInfo() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Slack Summary Scribe - Development Mode');
    console.log('📊 Enhanced Dashboard: /dashboard/enhanced');
    console.log('🔗 Slack Connect: /slack/connect');
    console.log('📁 File Upload: /upload');
    console.log('💰 Pricing: /pricing');
  } else {
    console.log('🚀 Slack Summary Scribe - Production Mode');
  }
}

/**
 * Enhanced error logging with context
 */
export function logError(error: Error, context?: Record<string, any>) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
    ...context,
  };

  // Always log errors, even in production
  originalConsole.error('Application Error:', errorInfo);
  
  return errorInfo;
}

/**
 * Performance logging
 */
export function logPerformance(label: string, startTime: number) {
  const duration = Date.now() - startTime;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`⚡ Performance [${label}]: ${duration}ms`);
  }
  
  return duration;
}

/**
 * API call logging
 */
export function logApiCall(
  method: string, 
  url: string, 
  status: number, 
  duration: number,
  error?: Error
) {
  const logData = {
    method,
    url,
    status,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    originalConsole.error('API Error:', { ...logData, error: error.message });
  } else if (process.env.NODE_ENV === 'development') {
    console.log('API Call:', logData);
  }
}

/**
 * User action logging
 */
export function logUserAction(action: string, data?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`👤 User Action [${action}]:`, data);
  }
}

/**
 * Feature flag logging
 */
export function logFeatureFlag(flag: string, enabled: boolean, context?: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🚩 Feature Flag [${flag}]: ${enabled ? 'ON' : 'OFF'}${context ? ` (${context})` : ''}`);
  }
}

/**
 * Analytics event logging
 */
export function logAnalyticsEvent(event: string, properties?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📈 Analytics [${event}]:`, properties);
  }
}

// Initialize on import in production
if (typeof window !== 'undefined') {
  initConsoleFiltering();
  logStartupInfo();
}
