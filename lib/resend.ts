// Fallback email service without external dependencies

// Environment variables
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'noreply@summaryai.com';

// Email logs for fallback mode
const emailLogs: Array<{
  timestamp: Date;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from: string;
}> = [];

console.log('📧 Email service initialized in fallback mode (no external dependencies)');

// Email sending interface
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Email response interface
export interface EmailResponse {
  success: boolean;
  data?: {
    id: string;
  };
  error?: string;
}

/**
 * Send an email using fallback logging
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  try {
    // Validate required fields
    if (!options.to) {
      return { success: false, error: 'Recipient email address is required' };
    }

    if (!options.subject) {
      return { success: false, error: 'Email subject is required' };
    }

    if (!options.html && !options.text) {
      return { success: false, error: 'Email content (html or text) is required' };
    }

    // Log email in fallback mode
    const emailData = {
      timestamp: new Date(),
      from: options.from || FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    emailLogs.push(emailData);

    const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    console.log(`📧 [FALLBACK MODE] Email logged to: ${recipients}`);
    console.log(`📧 [FALLBACK MODE] Subject: ${options.subject}`);

    return { success: true, data: { id: `fallback-${Date.now()}` } };

  } catch (error) {
    console.error('Email sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send a simple text email
 */
export async function sendTextEmail(
  to: string | string[],
  subject: string,
  text: string,
  from?: string
): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject,
    text,
    from,
  });
}

/**
 * Send an HTML email
 */
export async function sendHtmlEmail(
  to: string | string[],
  subject: string,
  html: string,
  from?: string
): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject,
    html,
    from,
  });
}

/**
 * Send an email with both HTML and text content
 */
export async function sendRichEmail(
  to: string | string[],
  subject: string,
  html: string,
  text: string,
  from?: string
): Promise<EmailResponse> {
  return sendEmail({
    to,
    subject,
    html,
    text,
    from,
  });
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate multiple email addresses
 */
export function validateEmails(emails: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach(email => {
    if (isValidEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
}

/**
 * Get email logs (for development/testing)
 */
export function getEmailLogs() {
  return [...emailLogs];
}

/**
 * Clear email logs
 */
export function clearEmailLogs() {
  emailLogs.length = 0;
}

/**
 * Check if email service is configured (always false in fallback mode)
 */
export function isResendConfigured(): boolean {
  return false;
}

// Export default configuration
export const resendConfig = {
  fromEmail: FROM_EMAIL,
  isConfigured: false,
  mode: 'fallback',
};
