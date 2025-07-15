import { NextRequest, NextResponse } from 'next/server';
import { handleStripeWebhook } from '@/lib/stripe-integration';
import { SentryTracker } from '@/lib/sentry.client';

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Parse the event
    let event;
    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error('Error parsing webhook body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    console.log('Received Stripe webhook event:', {
      type: event.type,
      id: event.id,
      created: event.created
    });

    // Handle the webhook event
    const result = await handleStripeWebhook(event, signature);

    if (!result.success) {
      console.error('Webhook handling failed:', result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};
