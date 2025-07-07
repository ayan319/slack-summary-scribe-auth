// Use Web Crypto API for Edge Runtime compatibility
import { randomBytes, createHash } from 'crypto';

/**
 * Generate a secure random token
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate email verification token with expiration
 */
export function generateEmailVerificationToken(): {
  token: string;
  expires: Date;
} {
  const token = generateSecureToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 24); // 24 hours from now

  return { token, expires };
}

/**
 * Generate password reset token with expiration
 */
export function generatePasswordResetToken(): {
  token: string;
  expires: Date;
} {
  const token = generateSecureToken();
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour from now

  return { token, expires };
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiresAt: string | Date): boolean {
  const expiration = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
  return expiration < new Date();
}

/**
 * Hash a token for secure storage (optional, for extra security)
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a token against its hash
 */
export function verifyTokenHash(token: string, hash: string): boolean {
  return hashToken(token) === hash;
}

/**
 * Generate a time-based one-time token (for rate limiting)
 */
export function generateTimeBasedToken(identifier: string, windowMinutes: number = 5): string {
  const now = new Date();
  const window = Math.floor(now.getTime() / (windowMinutes * 60 * 1000));
  return createHash('sha256').update(`${identifier}-${window}`).digest('hex');
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMinutes: number = 15
  ) {}

  /**
   * Check if an identifier is rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      return false;
    }

    // Reset if window has passed
    if (now > record.resetTime) {
      this.attempts.delete(identifier);
      return false;
    }

    return record.count >= this.maxAttempts;
  }

  /**
   * Check rate limit and return detailed information
   */
  checkLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      // First attempt
      const resetTime = now + (this.windowMinutes * 60 * 1000);
      this.attempts.set(identifier, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: this.maxAttempts - 1,
        resetTime: Math.ceil((resetTime - now) / (60 * 1000)) // minutes until reset
      };
    }

    // Reset if window has passed
    if (now > record.resetTime) {
      const resetTime = now + (this.windowMinutes * 60 * 1000);
      this.attempts.set(identifier, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: this.maxAttempts - 1,
        resetTime: Math.ceil((resetTime - now) / (60 * 1000))
      };
    }

    // Check if limit exceeded
    if (record.count >= this.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.ceil((record.resetTime - now) / (60 * 1000))
      };
    }

    // Increment and allow
    record.count++;
    return {
      allowed: true,
      remaining: this.maxAttempts - record.count,
      resetTime: Math.ceil((record.resetTime - now) / (60 * 1000))
    };
  }

  /**
   * Record an attempt
   */
  recordAttempt(identifier: string): void {
    const now = Date.now();
    const resetTime = now + (this.windowMinutes * 60 * 1000);
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime });
    } else {
      record.count++;
    }
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - record.count);
  }

  /**
   * Get time until reset (in minutes)
   */
  getTimeUntilReset(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || Date.now() > record.resetTime) {
      return 0;
    }
    return Math.ceil((record.resetTime - Date.now()) / (60 * 1000));
  }

  /**
   * Clear attempts for an identifier
   */
  clearAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clear all expired records
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Global rate limiters
export const authRateLimiter = new RateLimiter(5, 15); // 5 attempts per 15 minutes
export const emailRateLimiter = new RateLimiter(3, 60); // 3 emails per hour
