/**
 * Base URL utility for Slack Summary Scribe SaaS
 * 
 * Automatically handles protocol and port resolution:
 * - Development: http://localhost:3000 (or custom port)
 * - Production: https://your-production-domain.com
 * 
 * Prevents SSL protocol errors in local development
 */

/**
 * Get the base URL for the application
 * Forces HTTP on localhost to prevent SSL protocol errors
 * Uses HTTPS automatically in production
 */
export function getBaseUrl(): string {
  // Client-side: Force HTTP for localhost to avoid SSL errors
  if (typeof window !== "undefined") {
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return "http://localhost:3000";
    }
    return window.location.origin;
  }

  // Server-side: Use environment variable or default
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/**
 * Get the API base URL for internal API calls
 */
export const getApiBaseUrl = (): string => {
  return `${getBaseUrl()}/api`;
};

/**
 * Validate the current base URL configuration
 * Comprehensive checks for development and production
 * Warns about potential SSL and protocol issues
 */
export const validateBaseUrl = (): { isValid: boolean; warnings: string[] } => {
  const baseUrl = getBaseUrl();
  const warnings: string[] = [];
  let isValid = true;

  // Development environment checks
  if (process.env.NODE_ENV === 'development') {
    // Check for HTTPS on localhost
    if (baseUrl.startsWith('https://localhost')) {
      warnings.push(
        '⚠️ WARNING: Using HTTPS in development will cause SSL protocol errors.\n' +
        'Update NEXT_PUBLIC_SITE_URL to use http://localhost:3000 for local development.\n' +
        'Current URL: ' + baseUrl
      );
      isValid = false;
    }

    // Check for correct port
    const portMatch = baseUrl.match(/:(\d+)/);
    const port = portMatch ? portMatch[1] : '3000';
    const expectedPort = process.env.PORT || '3000';

    if (port !== expectedPort) {
      warnings.push(
        `⚠️ WARNING: Port mismatch detected. Using ${port} but expected ${expectedPort}.\n` +
        'This may cause connection issues with the development server.'
      );
    }

    // Log development URL
    console.log('🔧 Development Base URL:', baseUrl);
  }
  // Production environment checks
  else {
    // Ensure HTTPS for production
    if (!baseUrl.startsWith('https://') && !baseUrl.includes('localhost')) {
      warnings.push(
        '⚠️ WARNING: Production URLs should use HTTPS for security.\n' +
        'Current URL: ' + baseUrl
      );
      isValid = false;
    }
  }

  // Display warnings
  warnings.forEach(warning => console.warn(warning));

  return { isValid, warnings };
};

/**
 * Create an absolute URL from a relative path
 */
export const createAbsoluteUrl = (path: string): string => {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Check if we're running in a secure context (HTTPS)
 */
export const isSecureContext = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:';
  }
  
  return getBaseUrl().startsWith('https://');
};
