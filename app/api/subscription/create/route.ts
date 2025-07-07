import { NextRequest, NextResponse } from 'next/server';

// Mock subscription storage (replace with actual database in production)
const mockSubscriptions: Array<{
  id: string;
  userId: string;
  plan: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: Date;
  currentPeriodEnd: Date;
}> = [];

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    features: ['1 Slack workspace', 'Basic summaries', 'Email support'],
    limits: {
      workspaces: 1,
      summariesPerMonth: 10
    }
  },
  PRO: {
    name: 'Pro',
    price: 29,
    currency: 'USD',
    features: ['3 Slack workspaces', 'Advanced AI summaries', 'Export options', 'Priority support'],
    limits: {
      workspaces: 3,
      summariesPerMonth: 100
    }
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 99,
    currency: 'USD',
    features: ['Unlimited workspaces', 'Custom AI models', 'Team management', '24/7 support'],
    limits: {
      workspaces: -1, // unlimited
      summariesPerMonth: -1 // unlimited
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, plan, paymentMethodId, billingCycle = 'monthly' } = body;

    // Validate required fields
    if (!userId || !plan) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: userId and plan are required' 
        },
        { status: 400 }
      );
    }

    // Validate plan
    const planKey = plan.toUpperCase();
    if (!SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid plan. Available plans: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}` 
        },
        { status: 400 }
      );
    }

    const selectedPlan = SUBSCRIPTION_PLANS[planKey as keyof typeof SUBSCRIPTION_PLANS];

    // For free plan, no payment processing needed
    if (planKey === 'FREE') {
      const freeSubscription = {
        id: `sub_free_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        plan: planKey,
        status: 'ACTIVE',
        amount: 0,
        currency: 'USD',
        createdAt: new Date(),
        currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      };

      mockSubscriptions.push(freeSubscription);

      return NextResponse.json(
        { 
          success: true, 
          message: 'Free subscription activated successfully',
          subscription: freeSubscription,
          plan: selectedPlan
        },
        { status: 201 }
      );
    }

    // For paid plans, simulate payment processing
    if (!paymentMethodId) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Payment method is required for paid plans' 
        },
        { status: 400 }
      );
    }

    // Simulate Stripe payment processing
    console.log(`Processing payment for user ${userId} with plan ${planKey}`);
    console.log(`Payment method: ${paymentMethodId}`);
    console.log(`Amount: $${selectedPlan.price} ${selectedPlan.currency}`);

    // Simulate payment success (in production, this would call Stripe API)
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for simulation

    if (!paymentSuccess) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Payment failed. Please check your payment method and try again.' 
        },
        { status: 402 }
      );
    }

    // Calculate subscription period
    const periodLength = billingCycle === 'yearly' ? 365 : 30;
    const currentPeriodEnd = new Date(Date.now() + periodLength * 24 * 60 * 60 * 1000);

    // Create subscription
    const newSubscription = {
      id: `sub_${planKey.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      plan: planKey,
      status: 'ACTIVE',
      amount: selectedPlan.price,
      currency: selectedPlan.currency,
      createdAt: new Date(),
      currentPeriodEnd
    };

    // Store subscription (in production, this would be saved to database)
    mockSubscriptions.push(newSubscription);

    // Log for development (remove in production)
    console.log(`New subscription created: ${newSubscription.id} for user ${userId}`);

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Subscription created successfully',
        subscription: newSubscription,
        plan: selectedPlan,
        billing: {
          cycle: billingCycle,
          nextBillingDate: currentPeriodEnd,
          amount: selectedPlan.price,
          currency: selectedPlan.currency
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Subscription creation error:', error);
    
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid JSON in request body' 
        },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error. Please try again later.' 
      },
      { status: 500 }
    );
  }
}

// Get subscription plans
export async function GET() {
  return NextResponse.json(
    { 
      success: true, 
      plans: SUBSCRIPTION_PLANS 
    },
    { status: 200 }
  );
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Method not allowed. Use POST to create a subscription or GET to view plans.' 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Method not allowed. Use POST to create a subscription or GET to view plans.' 
    },
    { status: 405 }
  );
}
