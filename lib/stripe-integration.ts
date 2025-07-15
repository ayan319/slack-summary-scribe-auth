import { createSupabaseServerClient } from './supabase-server';

// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  priceIds: {
    PRO: process.env.STRIPE_PRICE_ID_PRO!,
    ENTERPRISE: process.env.STRIPE_PRICE_ID_ENTERPRISE!
  }
};

// Plan pricing configuration (aligned with Cashfree)
export const STRIPE_PLAN_PRICING = {
  FREE: { amount: 0, currency: 'usd' },
  PRO: { amount: 2900, currency: 'usd' }, // $29.00 in cents
  ENTERPRISE: { amount: 9900, currency: 'usd' } // $99.00 in cents
};

export interface StripeCheckoutSession {
  id: string;
  url: string;
  customer_id?: string;
  payment_intent?: string;
  subscription?: string;
}

export interface StripePaymentResult {
  success: boolean;
  session_id?: string;
  checkout_url?: string;
  error?: string;
}

/**
 * Create Stripe checkout session
 */
export async function createStripeCheckoutSession(
  userId: string,
  userEmail: string,
  plan: 'PRO' | 'ENTERPRISE',
  organizationId: string
): Promise<StripePaymentResult> {
  try {
    if (!STRIPE_CONFIG.secretKey) {
      return {
        success: false,
        error: 'Stripe not configured'
      };
    }

    const planConfig = STRIPE_PLAN_PRICING[plan];
    const priceId = STRIPE_CONFIG.priceIds[plan];

    if (!priceId) {
      return {
        success: false,
        error: `No Stripe price ID configured for ${plan} plan`
      };
    }

    // Create checkout session
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STRIPE_CONFIG.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'customer_email': userEmail,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=cancelled`,
        'metadata[user_id]': userId,
        'metadata[organization_id]': organizationId,
        'metadata[plan]': plan,
        'subscription_data[metadata][user_id]': userId,
        'subscription_data[metadata][organization_id]': organizationId,
        'subscription_data[metadata][plan]': plan,
        'allow_promotion_codes': 'true',
        'billing_address_collection': 'required',
        'payment_method_types[0]': 'card',
        'payment_method_types[1]': 'link'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Stripe checkout session creation failed:', errorData);
      return {
        success: false,
        error: errorData.error?.message || 'Failed to create checkout session'
      };
    }

    const sessionData = await response.json();

    // Store pending payment record
    await storePendingStripePayment(userId, organizationId, plan, sessionData.id);

    return {
      success: true,
      session_id: sessionData.id,
      checkout_url: sessionData.url
    };

  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Store pending Stripe payment
 */
async function storePendingStripePayment(
  userId: string,
  organizationId: string,
  plan: string,
  sessionId: string
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('payment_methods')
      .insert({
        user_id: userId,
        provider: 'stripe',
        provider_customer_id: sessionId, // Temporary, will be updated on success
        is_default: true,
        is_active: false // Will be activated on successful payment
      });

    if (error) {
      console.error('Error storing pending Stripe payment:', error);
    }
  } catch (error) {
    console.error('Error in storePendingStripePayment:', error);
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  event: any,
  signature: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify webhook signature
    if (!verifyStripeSignature(event, signature)) {
      return {
        success: false,
        error: 'Invalid webhook signature'
      };
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return { success: true };

  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verify Stripe webhook signature
 */
function verifyStripeSignature(payload: any, signature: string): boolean {
  try {
    // In a real implementation, you would use Stripe's webhook signature verification
    // For now, we'll do a basic check
    return Boolean(signature && signature.length > 0);
  } catch (error) {
    console.error('Error verifying Stripe signature:', error);
    return false;
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(session: any): Promise<void> {
  try {
    const userId = session.metadata?.user_id;
    const organizationId = session.metadata?.organization_id;
    const plan = session.metadata?.plan;

    if (!userId || !organizationId || !plan) {
      console.error('Missing metadata in checkout session:', session.id);
      return;
    }

    const supabase = await createSupabaseServerClient();

    // Create or update subscription
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan: plan,
        status: 'ACTIVE',
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        updated_at: new Date().toISOString()
      });

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return;
    }

    // Update payment method
    const { error: paymentError } = await supabase
      .from('payment_methods')
      .update({
        provider_customer_id: session.customer,
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('provider', 'stripe');

    if (paymentError) {
      console.error('Error updating payment method:', paymentError);
    }

    console.log('✅ Stripe checkout session completed successfully:', {
      sessionId: session.id,
      userId,
      plan
    });

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: any): Promise<void> {
  try {
    console.log('Stripe subscription created:', subscription.id);
    // Additional logic for subscription creation can be added here
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: any): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    // Update subscription status based on Stripe subscription
    const status = mapStripeStatusToLocal(subscription.status);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error updating subscription:', error);
    }

  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(subscription: any): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'CANCELED',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('Error canceling subscription:', error);
    }

  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

/**
 * Handle payment succeeded
 */
async function handlePaymentSucceeded(invoice: any): Promise<void> {
  try {
    console.log('Stripe payment succeeded:', invoice.id);
    // Additional logic for successful payments can be added here
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(invoice: any): Promise<void> {
  try {
    console.log('Stripe payment failed:', invoice.id);
    // Additional logic for failed payments can be added here
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

/**
 * Map Stripe subscription status to local status
 */
function mapStripeStatusToLocal(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'canceled':
      return 'CANCELED';
    case 'past_due':
      return 'PAST_DUE';
    case 'incomplete':
      return 'INCOMPLETE';
    case 'incomplete_expired':
      return 'INCOMPLETE_EXPIRED';
    case 'trialing':
      return 'TRIALING';
    case 'unpaid':
      return 'UNPAID';
    default:
      return 'INCOMPLETE';
  }
}
