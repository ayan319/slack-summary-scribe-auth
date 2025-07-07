import { Resend } from 'resend';

// Environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.EMAIL_FROM || 'onboarding@resend.dev';

// Validate API key
if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

if (RESEND_API_KEY === 're_123456789_your_resend_api_key_here') {
  throw new Error('Please replace the placeholder RESEND_API_KEY with your actual API key');
}

// Initialize Resend client
export const resend = new Resend(RESEND_API_KEY);

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
 * Send an email using Resend
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

    // Send email using Resend
    const emailData: any = {
      from: options.from || FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      replyTo: options.replyTo,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
      attachments: options.attachments,
    };

    // Add content based on what's available
    if (options.html) {
      emailData.html = options.html;
    }
    if (options.text) {
      emailData.text = options.text;
    }

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No response data from Resend' };
    }

    console.log(`✅ Email sent successfully via Resend. ID: ${data.id}`);
    return { success: true, data: { id: data.id } };

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
 * Get Resend client instance (for advanced usage)
 */
export function getResendClient(): Resend {
  return resend;
}

/**
 * Check if Resend is properly configured
 */
export function isResendConfigured(): boolean {
  return !!RESEND_API_KEY && RESEND_API_KEY !== 're_123456789_your_resend_api_key_here';
}

// Export default configuration
export const resendConfig = {
  apiKey: RESEND_API_KEY,
  fromEmail: FROM_EMAIL,
  isConfigured: isResendConfigured(),
};
