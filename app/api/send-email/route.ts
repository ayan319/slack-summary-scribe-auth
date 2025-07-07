import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, isValidEmail, validateEmails, type EmailOptions } from '@/lib/resend';
import { createRouteHandlerClient } from '@/lib/supabase';

// Rate limiting for email sending
const emailAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_EMAILS_PER_HOUR = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = emailAttempts.get(identifier);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    const resetTime = now + RATE_LIMIT_WINDOW;
    emailAttempts.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_EMAILS_PER_HOUR - 1, resetTime };
  }

  if (record.count >= MAX_EMAILS_PER_HOUR) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: MAX_EMAILS_PER_HOUR - record.count, resetTime: record.resetTime };
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next();

  try {
    // Get authenticated user using Supabase
    const supabase = createRouteHandlerClient(request, response);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required to send emails'
        },
        { status: 401 }
      );
    }

    // Rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `email:${user.id}:${clientIP}`;
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      const resetTimeMinutes = Math.ceil((rateLimit.resetTime - Date.now()) / (60 * 1000));
      return NextResponse.json(
        { 
          success: false, 
          error: `Rate limit exceeded. Try again in ${resetTimeMinutes} minutes.`,
          rateLimit: {
            remaining: 0,
            resetTime: rateLimit.resetTime
          }
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { to, subject, html, text, from, replyTo, cc, bcc } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Recipient email address (to) is required' },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Email subject is required' },
        { status: 400 }
      );
    }

    if (!html && !text) {
      return NextResponse.json(
        { success: false, error: 'Email content (html or text) is required' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const recipients = Array.isArray(to) ? to : [to];
    const { valid: validRecipients, invalid: invalidRecipients } = validateEmails(recipients);

    if (invalidRecipients.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid email addresses: ${invalidRecipients.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validate optional email fields
    if (cc) {
      const ccEmails = Array.isArray(cc) ? cc : [cc];
      const { invalid: invalidCC } = validateEmails(ccEmails);
      if (invalidCC.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid CC email addresses: ${invalidCC.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }

    if (bcc) {
      const bccEmails = Array.isArray(bcc) ? bcc : [bcc];
      const { invalid: invalidBCC } = validateEmails(bccEmails);
      if (invalidBCC.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Invalid BCC email addresses: ${invalidBCC.join(', ')}` 
          },
          { status: 400 }
        );
      }
    }

    if (replyTo && !isValidEmail(replyTo)) {
      return NextResponse.json(
        { success: false, error: 'Invalid reply-to email address' },
        { status: 400 }
      );
    }

    if (from && !isValidEmail(from)) {
      return NextResponse.json(
        { success: false, error: 'Invalid from email address' },
        { status: 400 }
      );
    }

    // Prepare email options
    const emailOptions: EmailOptions = {
      to: validRecipients,
      subject,
      html,
      text,
      from,
      replyTo,
      cc,
      bcc,
    };

    // Send email
    const result = await sendEmail(emailOptions);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to send email' 
        },
        { status: 500 }
      );
    }

    // Log successful email send
    console.log(`📧 Email sent by user ${user.email} to ${validRecipients.join(', ')}: ${subject}`);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Email sent successfully',
        data: {
          id: result.data?.id,
          recipients: validRecipients,
          subject
        },
        rateLimit: {
          remaining: rateLimit.remaining,
          resetTime: rateLimit.resetTime
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Send email API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing or documentation)
export async function GET() {
  return NextResponse.json(
    {
      message: 'Email sending API endpoint',
      method: 'POST',
      requiredFields: ['to', 'subject', 'html or text'],
      optionalFields: ['from', 'replyTo', 'cc', 'bcc'],
      rateLimit: `${MAX_EMAILS_PER_HOUR} emails per hour`,
      authentication: 'Required (JWT token in cookie)'
    },
    { status: 200 }
  );
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to send emails.' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to send emails.' },
    { status: 405 }
  );
}
