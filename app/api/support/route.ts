import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@summaryai.com';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Demo mode - simulate user info
    const userId = 'demo-user-123';
    console.log('📧 Support: Demo mode active, user ID:', userId);

    // Demo mode - simulate database operation
    console.log('💾 Creating support ticket (demo mode):', {
      userId,
      name,
      email,
      subject,
      messageLength: message.length
    });

    // Create demo ticket
    const ticket = {
      id: 'demo-ticket-' + Date.now(),
      user_id: userId,
      name,
      email,
      subject: subject || 'Support Request',
      message,
      status: 'open',
      priority: 'medium',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ Support ticket created (demo mode):', ticket.id);

    // Send email to support team
    try {
      const emailSubject = subject 
        ? `Support Request: ${subject}` 
        : 'New Support Request';

      const emailContent = `
        <h2>New Support Request</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
        <p><strong>Ticket ID:</strong> ${ticket.id}</p>
        <p><strong>User ID:</strong> ${userId || 'Anonymous'}</p>
        
        <h3>Message:</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${message.replace(/\n/g, '<br>')}
        </div>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          This message was sent from the Slack Summary Scribe support form.
          <br>
          Timestamp: ${new Date().toISOString()}
        </p>
      `;

      await sendEmail({
        from: `Support Form <noreply@summaryai.com>`,
        to: [SUPPORT_EMAIL],
        subject: emailSubject,
        html: emailContent,
        replyTo: email
      });

      // Send confirmation email to user
      const confirmationContent = `
        <h2>Thank you for contacting us!</h2>
        <p>Hi ${name},</p>
        <p>We've received your support request and will get back to you within 24 hours.</p>
        
        <h3>Your Message:</h3>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          <strong>Subject:</strong> ${subject || 'No subject'}<br>
          <strong>Message:</strong> ${message.replace(/\n/g, '<br>')}
        </div>
        
        ${ticket?.id ? `<p><strong>Ticket ID:</strong> ${ticket.id}</p>` : ''}
        
        <p>If you have any urgent issues, please don't hesitate to reach out to us directly at ${SUPPORT_EMAIL}.</p>
        
        <p>Best regards,<br>The Slack Summary Scribe Team</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated confirmation email. Please do not reply to this message.
        </p>
      `;

      await sendEmail({
        from: `Slack Summary Scribe <noreply@summaryai.com>`,
        to: [email],
        subject: 'Support Request Received - Slack Summary Scribe',
        html: confirmationContent
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // If email fails but ticket was created, still return success
      if (ticket) {
        return NextResponse.json({
          success: true,
          message: 'Support ticket created successfully',
          ticketId: ticket.id
        });
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to send support email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Support request sent successfully',
      ticketId: ticket?.id
    });

  } catch (error) {
    console.error('Support API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
