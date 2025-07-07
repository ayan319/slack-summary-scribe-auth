import { NextRequest } from 'next/server';
import { RateLimiter } from './tokens';

// Security configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  AUTH_RATE_LIMIT: {
    maxAttempts: 5,
    windowMinutes: 15
  },
  EMAIL_RATE_LIMIT: {
    maxAttempts: 3,
    windowMinutes: 60
  },
  PASSWORD_RESET_RATE_LIMIT: {
    maxAttempts: 3,
    windowMinutes: 60
  },
  
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SPECIAL: false,
  
  // Token expiration
  EMAIL_VERIFICATION_HOURS: 24,
  PASSWORD_RESET_HOURS: 1,
  JWT_EXPIRATION_DAYS: 7,
  
  // Security headers
  SECURITY_HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';"
  }
};

// Global rate limiters
export const rateLimiters = {
  auth: new RateLimiter(
    SECURITY_CONFIG.AUTH_RATE_LIMIT.maxAttempts,
    SECURITY_CONFIG.AUTH_RATE_LIMIT.windowMinutes
  ),
  email: new RateLimiter(
    SECURITY_CONFIG.EMAIL_RATE_LIMIT.maxAttempts,
    SECURITY_CONFIG.EMAIL_RATE_LIMIT.windowMinutes
  ),
  passwordReset: new RateLimiter(
    SECURITY_CONFIG.PASSWORD_RESET_RATE_LIMIT.maxAttempts,
    SECURITY_CONFIG.PASSWORD_RESET_RATE_LIMIT.windowMinutes
  )
};

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  // Use the first available IP
  const ip = forwardedFor?.split(',')[0]?.trim() || 
            realIP || 
            cfConnectingIP || 
            'unknown';
  
  return ip;
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
} {
  const errors: string[] = [];
  
  if (password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.PASSWORD_MIN_LENGTH} characters long`);
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_NUMBERS && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (SECURITY_CONFIG.PASSWORD_REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Calculate strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (errors.length === 0) {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 12;
    
    const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;
    
    if (criteriaCount >= 4) {
      strength = 'strong';
    } else if (criteriaCount >= 2) {
      strength = 'medium';
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength
  };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): {
  isValid: boolean;
  error?: string;
} {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  
  // Check for common disposable email domains (optional)
  const disposableDomains = [
    '10minutemail.com',
    'tempmail.org',
    'guerrillamail.com',
    'mailinator.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (domain && disposableDomains.includes(domain)) {
    return { isValid: false, error: 'Please use a permanent email address' };
  }
  
  return { isValid: true };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Check for suspicious patterns in input
 */
export function detectSuspiciousActivity(input: string): {
  isSuspicious: boolean;
  reason?: string;
} {
  // Check for SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /(--|\/\*|\*\/|;)/,
    /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      return { isSuspicious: true, reason: 'Potential SQL injection attempt' };
    }
  }
  
  // Check for XSS patterns
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return { isSuspicious: true, reason: 'Potential XSS attempt' };
    }
  }
  
  // Check for excessive length
  if (input.length > 10000) {
    return { isSuspicious: true, reason: 'Input too long' };
  }
  
  return { isSuspicious: false };
}

/**
 * Log security events
 */
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  severity: 'low' | 'medium' | 'high' = 'medium'
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    severity,
    details,
    userAgent: details.userAgent || 'unknown',
    ip: details.ip || 'unknown'
  };
  
  // In production, you would send this to a security monitoring service
  console.log(`[SECURITY ${severity.toUpperCase()}]`, JSON.stringify(logEntry));
  
  // For high severity events, you might want to trigger alerts
  if (severity === 'high') {
    // TODO: Implement alerting mechanism (email, Slack, etc.)
    console.error('🚨 HIGH SEVERITY SECURITY EVENT:', logEntry);
  }
}

/**
 * Security middleware helper
 */
export function createSecurityResponse(
  message: string,
  statusCode: number = 400,
  logEvent?: {
    event: string;
    details: Record<string, any>;
    severity?: 'low' | 'medium' | 'high';
  }
) {
  if (logEvent) {
    logSecurityEvent(logEvent.event, logEvent.details, logEvent.severity);
  }
  
  return Response.json(
    { success: false, message },
    { status: statusCode }
  );
}

/**
 * Clean up expired rate limit records periodically
 */
export function cleanupRateLimiters() {
  rateLimiters.auth.cleanup();
  rateLimiters.email.cleanup();
  rateLimiters.passwordReset.cleanup();
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimiters, 5 * 60 * 1000);
}
