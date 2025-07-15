import { NextRequest, NextResponse } from 'next/server';
import { createStripeCheckoutSession } from '@/lib/stripe-integration';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SentryTracker } from '@/lib/sentry.client';

/**
 * POST /api/stripe/checkout
 * Create Stripe checkout session for subscription
 */
export async function POST(request: NextRequest) {
  try {
    const { plan, organization_id } = await request.json();

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Validate plan
    if (!['PRO', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be PRO or ENTERPRISE' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization if not provided
    let orgId = organization_id;
    if (!orgId) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!userOrg) {
        return NextResponse.json(
          { error: 'No organization found for user' },
          { status: 400 }
        );
      }

      orgId = userOrg.organization_id;
    }

    // Check if user already has an active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['ACTIVE', 'TRIALING'])
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const checkoutResult = await createStripeCheckoutSession(
      user.id,
      user.email!,
      plan,
      orgId
    );

    if (!checkoutResult.success) {
      return NextResponse.json(
        { 
          error: checkoutResult.error || 'Failed to create checkout session',
          details: 'Stripe checkout creation failed'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        session_id: checkoutResult.session_id,
        checkout_url: checkoutResult.checkout_url,
        plan,
        message: 'Checkout session created successfully'
      }
    });

  } catch (error) {
    console.error('Stripe checkout API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/stripe/checkout
 * Get checkout session status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Retrieve session from Stripe
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to retrieve checkout session' },
        { status: 400 }
      );
    }

    const session = await response.json();

    // Verify session belongs to current user
    if (session.metadata?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        session_id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        customer_email: session.customer_email,
        amount_total: session.amount_total,
        currency: session.currency,
        metadata: session.metadata
      }
    });

  } catch (error) {
    console.error('Get Stripe checkout session API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
