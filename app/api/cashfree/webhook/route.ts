import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature } from '@/lib/cashfree';
import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';

interface CashfreeWebhookPayload {
  type: string;
  data: {
    order: {
      order_id: string;
      order_amount: number;
      order_currency: string;
      order_status: string;
    };
    payment: {
      cf_payment_id: string;
      payment_status: string;
      payment_amount: number;
      payment_currency: string;
      payment_message: string;
      payment_time: string;
      bank_reference: string;
      auth_id: string;
      payment_method: {
        card?: {
          channel: string;
          card_number: string;
          card_network: string;
          card_type: string;
          card_country: string;
          card_bank_name: string;
        };
        upi?: {
          channel: string;
          upi_id: string;
        };
        netbanking?: {
          channel: string;
          netbanking_bank_code: string;
          netbanking_bank_name: string;
        };
      };
    };
    customer_details: {
      customer_name: string;
      customer_id: string;
      customer_email: string;
      customer_phone: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature') || '';

    // Verify webhook signature
    if (!verifyPaymentSignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload: CashfreeWebhookPayload = JSON.parse(rawBody);
    
    console.log('Cashfree webhook received:', {
      type: payload.type,
      orderId: payload.data.order.order_id,
      orderStatus: payload.data.order.order_status,
      paymentStatus: payload.data.payment.payment_status
    });

    // Handle different webhook types
    switch (payload.type) {
      case 'PAYMENT_SUCCESS_WEBHOOK':
        await handlePaymentSuccess(payload);
        break;
      case 'PAYMENT_FAILED_WEBHOOK':
        await handlePaymentFailed(payload);
        break;
      case 'PAYMENT_USER_DROPPED_WEBHOOK':
        await handlePaymentDropped(payload);
        break;
      default:
        console.log('Unhandled webhook type:', payload.type);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing Cashfree webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(payload: CashfreeWebhookPayload) {
  const { order, payment } = payload.data;
  
  try {
    // Find the subscription by Cashfree order ID
    const subscription = await prisma.subscription.findFirst({
      where: {
        cashfreeOrderId: order.order_id
      }
    });

    if (!subscription) {
      console.error('Subscription not found for order:', order.order_id);
      return;
    }

    // Update subscription status to ACTIVE
    await prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        status: 'ACTIVE',
        cashfreePaymentId: payment.cf_payment_id,
        updatedAt: new Date()
      }
    });

    // Cancel any other active subscriptions for this user
    await prisma.subscription.updateMany({
      where: {
        userId: subscription.userId,
        id: { not: subscription.id },
        status: 'ACTIVE'
      },
      data: {
        status: 'CANCELED'
      }
    });

    console.log('Payment success processed:', {
      subscriptionId: subscription.id,
      orderId: order.order_id,
      paymentId: payment.cf_payment_id,
      amount: payment.payment_amount
    });

    // TODO: Send confirmation email to user
    // TODO: Log analytics event
    // TODO: Send Slack notification if configured

  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
}

async function handlePaymentFailed(payload: CashfreeWebhookPayload) {
  const { order, payment } = payload.data;
  
  try {
    // Update subscription status to FAILED
    await prisma.subscription.updateMany({
      where: {
        cashfreeOrderId: order.order_id
      },
      data: {
        status: 'CANCELED',
        cashfreePaymentId: payment.cf_payment_id,
        updatedAt: new Date()
      }
    });

    console.log('Payment failure processed:', {
      orderId: order.order_id,
      paymentId: payment.cf_payment_id,
      reason: payment.payment_message
    });

    // TODO: Send failure notification email
    // TODO: Log analytics event

  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

async function handlePaymentDropped(payload: CashfreeWebhookPayload) {
  const { order } = payload.data;
  
  try {
    // Update subscription status to CANCELLED
    await prisma.subscription.updateMany({
      where: {
        cashfreeOrderId: order.order_id
      },
      data: {
        status: 'CANCELED',
        updatedAt: new Date()
      }
    });

    console.log('Payment dropped processed:', {
      orderId: order.order_id
    });

    // TODO: Log analytics event

  } catch (error) {
    console.error('Error handling payment dropped:', error);
    throw error;
  }
}

// Handle GET requests (for webhook verification)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Cashfree webhook endpoint is active'
  });
}
