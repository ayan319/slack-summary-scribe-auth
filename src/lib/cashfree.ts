import axios from 'axios';
import { SubscriptionPlan } from '@prisma/client';
import { CASHFREE_PLANS } from './cashfree-config';

// Cashfree configuration
export const cashfreeConfig = {
  appId: process.env.CASHFREE_APP_ID!,
  secretKey: process.env.CASHFREE_SECRET_KEY!,
  environment: process.env.CASHFREE_ENVIRONMENT || 'sandbox',
  baseUrl: process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg',
};

// Pricing plans
export const PRICING_PLANS = {
  PRO: {
    id: 'pro',
    name: 'Pro',
    amount: 29.00,
    currency: 'USD',
    description: '100 AI summaries per month with advanced features',
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    amount: 99.00,
    currency: 'USD',
    description: 'Unlimited summaries with enterprise features',
  }
} as const;

export type PlanId = keyof typeof PRICING_PLANS;

// Generate access token for Cashfree API
export async function getCashfreeToken(): Promise<string> {
  try {
    const response = await axios.post(
      `${cashfreeConfig.baseUrl}/auth/api/v2/cftoken/order`,
      {},
      {
        headers: {
          'X-Client-Id': cashfreeConfig.appId,
          'X-Client-Secret': cashfreeConfig.secretKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status === 'OK') {
      return response.data.cftoken;
    } else {
      throw new Error('Failed to get Cashfree token');
    }
  } catch (error) {
    console.error('Error getting Cashfree token:', error);
    throw error;
  }
}

// Create Cashfree order
export async function createCashfreeOrder(orderData: {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl: string;
  notifyUrl: string;
  orderNote?: string;
}) {
  try {
    const token = await getCashfreeToken();
    
    const response = await axios.post(
      `${cashfreeConfig.baseUrl}/orders`,
      {
        order_id: orderData.orderId,
        order_amount: orderData.orderAmount,
        order_currency: orderData.orderCurrency,
        customer_details: {
          customer_id: `customer_${orderData.customerEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone || '+1234567890',
        },
        order_meta: {
          return_url: orderData.returnUrl,
          notify_url: orderData.notifyUrl,
        },
        order_note: orderData.orderNote || 'Subscription payment',
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-api-version': '2022-09-01',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error creating Cashfree order:', error);
    throw error;
  }
}

// Get payment link
export async function getPaymentLink(orderToken: string): Promise<string> {
  return `${cashfreeConfig.baseUrl.replace('/pg', '')}/checkout?order_token=${orderToken}`;
}

// Verify payment signature
export function verifyPaymentSignature(
  orderId: string,
  orderAmount: string,
  referenceId: string,
  paymentStatus: string,
  paymentMode: string,
  paymentTime: string,
  signature: string
): boolean {
  try {
    const crypto = require('crypto');
    const signatureData = `${orderId}${orderAmount}${referenceId}${paymentStatus}${paymentMode}${paymentTime}`;
    const expectedSignature = crypto
      .createHmac('sha256', cashfreeConfig.secretKey)
      .update(signatureData)
      .digest('base64');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

// Generate unique order ID
export function generateOrderId(userId: string, planId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `order_${userId}_${planId}_${timestamp}_${random}`;
}

// Create subscription order
export async function createSubscriptionOrder(
  userId: string,
  userEmail: string,
  userName: string,
  plan: SubscriptionPlan
): Promise<any> {
  const planConfig = CASHFREE_PLANS[plan.toUpperCase() as keyof typeof CASHFREE_PLANS];
  const orderId = `sub_${userId}_${plan}_${Date.now()}`;

  const orderData = {
    orderId: orderId,
    orderAmount: planConfig.amount,
    orderCurrency: 'USD',
    customerName: userName,
    customerEmail: userEmail,
    returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/cashfree/webhook`,
    orderNote: `${planConfig.name} subscription`,
  };

  return createCashfreeOrder(orderData);
}

// Get plan by ID (legacy)
export function getPlanById(planId: string): typeof PRICING_PLANS[PlanId] | null {
  const plan = PRICING_PLANS[planId.toUpperCase() as PlanId];
  return plan || null;
}
