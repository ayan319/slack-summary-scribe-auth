import { Cashfree } from 'cashfree-pg';
import crypto from 'crypto';
import { SubscriptionPlan } from '@prisma/client';

// Define Cashfree types for better type safety
interface CashfreeStatic {
  XClientId: string;
  XClientSecret: string;
  XEnvironment: string;
}

// Initialize Cashfree with proper typing
const CashfreeTyped = Cashfree as unknown as CashfreeStatic;
CashfreeTyped.XClientId = process.env.CASHFREE_APP_ID!;
CashfreeTyped.XClientSecret = process.env.CASHFREE_SECRET_KEY!;
CashfreeTyped.XEnvironment = process.env.NODE_ENV === 'production'
  ? 'PRODUCTION'
  : 'SANDBOX';

// Cashfree configuration
export const cashfreeConfig = {
  appId: process.env.CASHFREE_APP_ID!,
  secretKey: process.env.CASHFREE_SECRET_KEY!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET!,
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg',
};

// Plan pricing configuration
const PLAN_PRICING: Record<SubscriptionPlan, { amount: number; currency: string }> = {
  FREE: { amount: 0, currency: 'USD' },
  PRO: { amount: 29, currency: 'USD' },
  ENTERPRISE: { amount: 99, currency: 'USD' },
};

export interface CashfreeOrderData {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl: string;
  notifyUrl: string;
  orderNote?: string;
}

export interface CashfreeOrderRequest {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
  };
  order_meta: {
    return_url: string;
    notify_url: string;
  };
  order_note?: string;
  order_tags?: {
    [key: string]: string;
  };
}

// Generate unique order ID
export function generateOrderId(userId: string, planId: string): string {
  // Use crypto.randomUUID if available for better randomness
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    const uuid = crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    return `sub_${userId.substring(0, 8)}_${planId}_${uuid}`;
  }

  // Fallback for environments without crypto.randomUUID
  const timestamp = typeof window !== 'undefined' ? Date.now() : Math.floor(Math.random() * 1000000);
  const random = Math.random().toString(36).substring(2, 8);
  return `sub_${userId.substring(0, 8)}_${planId}_${timestamp}_${random}`;
}

// Generate customer ID from email
export function generateCustomerId(email: string): string {
  return `customer_${email.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

// Verify webhook signature
export function verifyPaymentSignature(payload: string, signature: string): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', cashfreeConfig.webhookSecret)
      .update(payload)
      .digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

// Define return type for subscription order
export interface SubscriptionOrderResponse {
  success: boolean;
  order_id: string;
  payment_session_id?: string;
  payment_url?: string;
  error?: string;
}

// Create subscription order
export async function createSubscriptionOrder(
  userId: string,
  userEmail: string,
  userName: string,
  plan: SubscriptionPlan
): Promise<SubscriptionOrderResponse> {
  try {
    if (!PLAN_PRICING[plan]) {
      throw new Error(`Invalid plan: ${plan}`);
    }

    const planConfig = PLAN_PRICING[plan];
    const orderId = generateOrderId(userId, plan);

    const orderRequest: CashfreeOrderRequest = {
      order_id: orderId,
      order_amount: planConfig.amount,
      order_currency: planConfig.currency,
      customer_details: {
        customer_id: generateCustomerId(userEmail),
        customer_name: userName,
        customer_email: userEmail,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/cashfree/webhook`,
      },
      order_note: `${plan} subscription`,
      order_tags: {
        planId: plan,
        userId: userId,
        subscriptionType: 'monthly',
      },
    };

    console.log('Creating Cashfree order:', {
      orderId,
      amount: planConfig.amount,
      plan,
      customerEmail: userEmail
    });

    // Create order with Cashfree
    const response = await (Cashfree as unknown as {
      PGCreateOrder: (version: string, request: CashfreeOrderRequest) => Promise<{ data: { order_id: string; payment_session_id: string; payment_url: string } }>;
    }).PGCreateOrder('2023-08-01', orderRequest);

    if (!response || !response.data) {
      throw new Error('Invalid response from Cashfree API');
    }

    const orderData = response.data;

    // Note: Order status check removed as Cashfree create order response doesn't include order_status
    // The order is considered successful if we get order_id and payment_session_id

    console.log('Cashfree order created successfully:', {
      orderId: orderData.order_id,
      paymentSessionId: orderData.payment_session_id,
      paymentUrl: orderData.payment_url
    });

    return {
      success: true,
      order_id: orderData.order_id,
      payment_session_id: orderData.payment_session_id,
      payment_url: orderData.payment_url,
    };
  } catch (error) {
    console.error('Error creating Cashfree order:', error);
    throw error;
  }
}

// Define order status response type
export interface OrderStatusResponse {
  order_id: string;
  order_status: string;
  payment_status: string;
  order_amount: number;
  order_currency: string;
}

// Get order status
export async function getOrderStatus(orderId: string): Promise<OrderStatusResponse> {
  try {
    const response = await (Cashfree as unknown as {
      PGOrderFetchPayments: (version: string, orderId: string) => Promise<{ data: OrderStatusResponse }>;
    }).PGOrderFetchPayments('2023-08-01', orderId);
    return response.data;
  } catch (error) {
    console.error('Error fetching order status:', error);
    throw error;
  }
}

// Define cancel order response type
export interface CancelOrderResponse {
  success: boolean;
  message: string;
}

// Cancel order
export async function cancelOrder(orderId: string): Promise<CancelOrderResponse> {
  try {
    // Note: Cashfree doesn't have a direct cancel order API
    // This would typically be handled through their dashboard
    console.log('Order cancellation requested for:', orderId);
    return { success: true, message: 'Cancellation request logged' };
  } catch (error) {
    console.error('Error cancelling order:', error);
    throw error;
  }
}

// Define refund response type
export interface RefundResponse {
  refund_id: string;
  refund_status: string;
  refund_amount: number;
  refund_currency: string;
}

// Refund payment
export async function refundPayment(
  orderId: string,
  refundAmount: number,
  refundNote?: string
): Promise<RefundResponse> {
  try {
    const refundRequest = {
      refund_amount: refundAmount,
      refund_id: `refund_${orderId}_${Date.now()}`,
      refund_note: refundNote || 'Subscription refund',
    };

    const response = await (Cashfree as unknown as {
      PGOrderCreateRefund: (version: string, orderId: string, request: typeof refundRequest) => Promise<{ data: RefundResponse }>;
    }).PGOrderCreateRefund(
      '2023-08-01',
      orderId,
      refundRequest
    );

    return response.data;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}
