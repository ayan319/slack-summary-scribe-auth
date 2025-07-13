// Frontend email client utilities for calling the /api/send-email endpoint

export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendEmailResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    recipients: string[];
    subject: string;
  };
  rateLimit?: {
    remaining: number;
    resetTime: number;
  };
  error?: string;
}

/**
 * Send an email using the API endpoint
 */
export async function sendEmail(emailData: SendEmailRequest): Promise<SendEmailResponse> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * Send a simple text email
 */
export async function sendTextEmail(
  to: string | string[],
  subject: string,
  text: string
): Promise<SendEmailResponse> {
  return sendEmail({ to, subject, text });
}

/**
 * Send an HTML email
 */
export async function sendHtmlEmail(
  to: string | string[],
  subject: string,
  html: string
): Promise<SendEmailResponse> {
  return sendEmail({ to, subject, html });
}

/**
 * Send a rich email with both HTML and text
 */
export async function sendRichEmail(
  to: string | string[],
  subject: string,
  html: string,
  text: string
): Promise<SendEmailResponse> {
  return sendEmail({ to, subject, html, text });
}

/**
 * Send a notification email
 */
export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): Promise<SendEmailResponse> {
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
          .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Slack Summary Scribe</div>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>${message}</p>
            ${actionUrl && actionText ? `
              <p style="text-align: center;">
                <a href="${actionUrl}" class="button">${actionText}</a>
              </p>
            ` : ''}
          </div>
          <div class="footer">
            <p>This is an automated notification from Slack Summary Scribe.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${title}
    
    ${message}
    
    ${actionUrl && actionText ? `${actionText}: ${actionUrl}` : ''}
    
    ---
    This is an automated notification from Slack Summary Scribe.
  `;

  return sendEmail({
    to,
    subject: title,
    html: emailTemplate,
    text,
  });
}

/**
 * Check API endpoint status
 */
export async function checkEmailApiStatus(): Promise<{
  available: boolean;
  info?: any;
  error?: string;
}> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'GET',
    });

    if (response.ok) {
      const info = await response.json();
      return { available: true, info };
    } else {
      return { available: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}
