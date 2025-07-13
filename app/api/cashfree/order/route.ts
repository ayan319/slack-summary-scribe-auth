import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createSubscriptionOrder } from '@/lib/cashfree';
import { SubscriptionPlan } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email!;
    const userName = session.user.user_metadata?.name || session.user.email!;

    // Parse request body
    const body = await request.json();
    const { plan } = body;

    // Validate plan
    if (!plan || !['FREE', 'PRO', 'ENTERPRISE'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Invalid plan specified' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });

    if (existingSubscription && existingSubscription.plan === plan) {
      return NextResponse.json(
        { success: false, error: 'User already has this subscription plan' },
        { status: 400 }
      );
    }

    // For FREE plan, create subscription directly without payment
    if (plan === 'FREE') {
      // Cancel existing subscription if upgrading/downgrading
      if (existingSubscription) {
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: { status: 'CANCELED' }
        });
      }

      // Create free subscription
      const freeSubscription = await prisma.subscription.create({
        data: {
          userId,
          plan: 'FREE',
          status: 'ACTIVE',
          cashfreeOrderId: `free_${userId}_${Date.now()}`,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
        }
      });

      return NextResponse.json({
        success: true,
        subscription: freeSubscription,
        message: 'Free subscription activated successfully'
      });
    }

    // Create Cashfree order for paid plans
    const orderResult = await createSubscriptionOrder(
      userId,
      userEmail,
      userName,
      plan as SubscriptionPlan
    );

    if (!orderResult.success) {
      return NextResponse.json(
        { success: false, error: orderResult.error || 'Failed to create payment order' },
        { status: 500 }
      );
    }

    // Create pending subscription record
    const pendingSubscription = await prisma.subscription.create({
      data: {
        userId,
        plan: plan as SubscriptionPlan,
        status: 'INCOMPLETE',
        cashfreeOrderId: orderResult.order_id,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    return NextResponse.json({
      success: true,
      order_id: orderResult.order_id,
      payment_session_id: orderResult.payment_session_id,
      payment_url: orderResult.payment_url,
      subscription: pendingSubscription
    });

  } catch (error) {
    console.error('Error creating Cashfree order:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return available subscription plans
  const plans = {
    FREE: {
      name: 'Free',
      price: 0,
      currency: 'USD',
      features: [
        '1 Slack workspace',
        'Basic AI summaries',
        '10 summaries per month',
        'Email support'
      ],
      limits: {
        workspaces: 1,
        summariesPerMonth: 10
      }
    },
    PRO: {
      name: 'Pro',
      price: 29,
      currency: 'USD',
      features: [
        '3 Slack workspaces',
        'Advanced AI summaries',
        'Unlimited summaries',
        'Priority support',
        'Export to PDF/Notion'
      ],
      limits: {
        workspaces: 3,
        summariesPerMonth: -1
      }
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: 99,
      currency: 'USD',
      features: [
        'Unlimited Slack workspaces',
        'Advanced AI with custom models',
        'Unlimited summaries',
        '24/7 priority support',
        'Custom integrations',
        'Team management',
        'Advanced analytics'
      ],
      limits: {
        workspaces: -1,
        summariesPerMonth: -1
      }
    }
  };

  return NextResponse.json({ success: true, plans });
}
