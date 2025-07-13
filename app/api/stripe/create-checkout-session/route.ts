import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    const { plan, billing_cycle = 'monthly', success_url, cancel_url } = body;

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan is required' },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans = ['pro', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll simulate Stripe checkout
    // In production, this would create a real Stripe checkout session
    const mockCheckoutSession = await createMockCheckoutSession(
      userId,
      plan,
      billing_cycle,
      success_url,
      cancel_url
    );

    return NextResponse.json({
      success: true,
      data: {
        url: mockCheckoutSession.url,
        session_id: mockCheckoutSession.id
      }
    });

  } catch (error) {
    console.error('Stripe checkout API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createMockCheckoutSession(
  userId: string,
  plan: string,
  billingCycle: string,
  successUrl?: string,
  cancelUrl?: string
) {
  // Mock Stripe checkout session
  const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Plan pricing
  const pricing = {
    pro: {
      monthly: 29,
      yearly: 290 // 2 months free
    },
    enterprise: {
      monthly: 99,
      yearly: 990 // 2 months free
    }
  };

  const amount = pricing[plan as keyof typeof pricing][billingCycle as keyof typeof pricing.pro];

  // In demo mode, return a mock checkout URL
  const checkoutUrl = process.env.NODE_ENV === 'production'
    ? `https://checkout.stripe.com/pay/${sessionId}`
    : `http://localhost:3000/checkout/demo?session_id=${sessionId}&plan=${plan}&amount=${amount}`;

  return {
    id: sessionId,
    url: checkoutUrl,
    amount_total: amount * 100, // Stripe uses cents
    currency: 'usd',
    customer_email: null,
    metadata: {
      user_id: userId,
      plan: plan,
      billing_cycle: billingCycle
    },
    payment_status: 'unpaid',
    status: 'open'
  };
}

// Handle webhook events from Stripe
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, status } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // In production, this would verify the webhook signature
    // and update the user's subscription status
    console.log('Stripe webhook received:', { session_id, status });

    return NextResponse.json({
      success: true,
      message: 'Webhook processed'
    });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}