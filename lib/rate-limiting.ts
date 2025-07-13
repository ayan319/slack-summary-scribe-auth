/**
 * Rate limiting and usage limits for production SaaS
 */

import { NextRequest } from 'next/server';
import { log } from './logger';

// Rate limiting configuration
export const RATE_LIMITS = {
  // API endpoints
  api: {
    default: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
    upload: { requests: 10, window: 60 * 1000 }, // 10 uploads per minute
    ai: { requests: 20, window: 60 * 1000 }, // 20 AI requests per minute
    auth: { requests: 5, window: 60 * 1000 }, // 5 auth attempts per minute
  },
  
  // User plan limits
  plans: {
    free: {
      summaries_per_month: 5,
      file_size_mb: 10,
      ai_requests_per_day: 10,
      slack_channels: 1
    },
    pro: {
      summaries_per_month: 100,
      file_size_mb: 20,
      ai_requests_per_day: 100,
      slack_channels: 5
    },
    enterprise: {
      summaries_per_month: -1, // unlimited
      file_size_mb: 50,
      ai_requests_per_day: 500,
      slack_channels: -1 // unlimited
    }
  }
};

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check rate limit for a given key
 */
export function checkRateLimit(
  key: string, 
  limit: { requests: number; window: number }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key);
  }

  const currentEntry = rateLimitStore.get(key);

  if (!currentEntry) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + limit.window
    });
    
    return {
      allowed: true,
      remaining: limit.requests - 1,
      resetTime: now + limit.window
    };
  }

  if (currentEntry.count >= limit.requests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: currentEntry.resetTime
    };
  }

  // Increment count
  currentEntry.count++;
  rateLimitStore.set(key, currentEntry);

  return {
    allowed: true,
    remaining: limit.requests - currentEntry.count,
    resetTime: currentEntry.resetTime
  };
}

/**
 * Get rate limit key for request
 */
export function getRateLimitKey(request: NextRequest, type: string, userId?: string): string {
  const ip = request.headers.get('x-forwarded-for') || 
            request.headers.get('x-real-ip') || 
            'unknown';
  
  if (userId) {
    return `${type}:user:${userId}`;
  }
  
  return `${type}:ip:${ip}`;
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  type: keyof typeof RATE_LIMITS.api,
  getUserId?: (request: NextRequest) => Promise<string | null>
) {
  return async (request: NextRequest) => {
    try {
      const userId = getUserId ? await getUserId(request) : null;
      const key = getRateLimitKey(request, type, userId || undefined);
      const limit = RATE_LIMITS.api[type];
      
      const result = checkRateLimit(key, limit);
      
      if (!result.allowed) {
        log.security('Rate limit exceeded', 'medium', {
          userId: userId || undefined,
          component: 'rate-limiting',
          action: type,
          metadata: { key, limit }
        });
        
        return Response.json(
          { 
            error: 'Rate limit exceeded',
            code: 'RATE_LIMITED',
            resetTime: result.resetTime
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.requests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }
      
      return null; // Allow request to continue
    } catch (error) {
      log.error('Rate limiting error', error as Error, {
        component: 'rate-limiting',
        action: type
      });
      
      // Allow request on error (fail open)
      return null;
    }
  };
}

/**
 * Check user plan limits
 */
export async function checkPlanLimits(
  userId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: boolean }> {
  try {
    // Get user's current plan (implement based on your subscription system)
    const userPlan = await getUserPlan(userId);
    const limits = RATE_LIMITS.plans[userPlan as keyof typeof RATE_LIMITS.plans];
    
    if (!limits) {
      return { allowed: false, reason: 'Invalid plan' };
    }
    
    switch (action) {
      case 'create_summary':
        const summariesThisMonth = await getUserSummariesCount(userId, 'month');
        if (limits.summaries_per_month !== -1 && summariesThisMonth >= limits.summaries_per_month) {
          return { 
            allowed: false, 
            reason: 'Monthly summary limit exceeded',
            upgradeRequired: true
          };
        }
        break;
        
      case 'upload_file':
        const fileSizeMB = metadata?.fileSize ? metadata.fileSize / (1024 * 1024) : 0;
        if (fileSizeMB > limits.file_size_mb) {
          return { 
            allowed: false, 
            reason: `File size exceeds ${limits.file_size_mb}MB limit`,
            upgradeRequired: true
          };
        }
        break;
        
      case 'ai_request':
        const aiRequestsToday = await getUserAIRequestsCount(userId, 'day');
        if (limits.ai_requests_per_day !== -1 && aiRequestsToday >= limits.ai_requests_per_day) {
          return { 
            allowed: false, 
            reason: 'Daily AI request limit exceeded',
            upgradeRequired: true
          };
        }
        break;
        
      case 'slack_channel':
        const slackChannels = await getUserSlackChannelsCount(userId);
        if (limits.slack_channels !== -1 && slackChannels >= limits.slack_channels) {
          return { 
            allowed: false, 
            reason: 'Slack channel limit exceeded',
            upgradeRequired: true
          };
        }
        break;
    }
    
    return { allowed: true };
  } catch (error) {
    log.error('Plan limit check error', error as Error, {
      userId,
      component: 'plan-limits',
      action,
      metadata
    });
    
    // Allow on error (fail open)
    return { allowed: true };
  }
}

/**
 * Helper functions (implement based on your database schema)
 */
async function getUserPlan(userId: string): Promise<string> {
  // TODO: Implement based on your subscription system
  // For now, return 'free' as default
  return 'free';
}

async function getUserSummariesCount(userId: string, period: 'day' | 'month'): Promise<number> {
  // TODO: Implement database query
  return 0;
}

async function getUserAIRequestsCount(userId: string, period: 'day' | 'month'): Promise<number> {
  // TODO: Implement database query
  return 0;
}

async function getUserSlackChannelsCount(userId: string): Promise<number> {
  // TODO: Implement database query
  return 0;
}

/**
 * Usage tracking for analytics and billing
 */
export async function trackUsage(
  userId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // TODO: Implement usage tracking in database
    log.info('Usage tracked', {
      userId,
      component: 'usage-tracking',
      action,
      metadata
    });
  } catch (error) {
    log.error('Usage tracking error', error as Error, {
      userId,
      component: 'usage-tracking',
      action,
      metadata
    });
  }
}

/**
 * Security headers middleware
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.openrouter.ai https://*.supabase.co https://*.sentry.io wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    
    // Security headers
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // HSTS (only in production with HTTPS)
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    })
  };
}

/**
 * Input validation and sanitization
 */
export function validateInput(input: any, rules: Record<string, any>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = input[field];
    
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value !== undefined && value !== null) {
      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push(`${field} must be a string`);
      }
      
      if (rule.type === 'number' && typeof value !== 'number') {
        errors.push(`${field} must be a number`);
      }
      
      if (rule.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} must be a valid email`);
      }
      
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${field} must be at least ${rule.minLength} characters`);
      }
      
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${field} must be no more than ${rule.maxLength} characters`);
      }
      
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${field} format is invalid`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}
