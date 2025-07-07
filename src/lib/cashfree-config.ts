import { Cashfree } from 'cashfree-pg';

// Initialize Cashfree with type assertions
(Cashfree as any).XClientId = process.env.CASHFREE_APP_ID!;
(Cashfree as any).XClientSecret = process.env.CASHFREE_SECRET_KEY!;
(Cashfree as any).XEnvironment = process.env.NODE_ENV === 'production'
  ? (Cashfree as any).Environment.PRODUCTION
  : (Cashfree as any).Environment.SANDBOX;

export { Cashfree };

// Cashfree configuration
export const cashfreeConfig = {
  appId: process.env.CASHFREE_APP_ID!,
  secretKey: process.env.CASHFREE_SECRET_KEY!,
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET!,
  returnUrl: process.env.NEXT_PUBLIC_APP_URL + '/dashboard?payment=success',
  notifyUrl: process.env.NEXT_PUBLIC_APP_URL + '/api/cashfree/webhook',
};

// Pricing plans for Cashfree
export const CASHFREE_PLANS = {
  PRO: {
    id: 'pro',
    name: 'Pro Plan',
    amount: 29.00,
    currency: 'USD',
    description: '100 AI summaries per month with advanced features',
    features: [
      '100 AI summaries per month',
      'Advanced Slack integration',
      'Custom templates',
      'Priority email support',
      'Advanced analytics',
      'Export to Notion/PDF',
      'Team collaboration',
      'Custom branding'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    amount: 99.00,
    currency: 'USD',
    description: 'Unlimited summaries with enterprise features',
    features: [
      'Unlimited AI summaries',
      'Enterprise Slack integration',
      'Custom AI models',
      '24/7 phone & chat support',
      'Advanced analytics & reporting',
      'All export options',
      'Advanced team management',
      'White-label solution',
      'SSO & SAML',
      'Custom integrations',
      'Dedicated account manager'
    ]
  }
} as const;

export type CashfreePlanId = keyof typeof CASHFREE_PLANS;

// Order status types
export type OrderStatus = 
  | 'ACTIVE'
  | 'PAID'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'TERMINATED';

export type PaymentStatus = 
  | 'SUCCESS'
  | 'PENDING'
  | 'FAILED'
  | 'CANCELLED'
  | 'USER_DROPPED';

// Interfaces
export interface CashfreeOrder {
  orderId: string;
  orderAmount: number;
  orderCurrency: string;
  customerDetails: {
    customerId: string;
    customerName?: string;
    customerEmail: string;
    customerPhone?: string;
  };
  orderMeta?: {
    returnUrl?: string;
    notifyUrl?: string;
    paymentMethods?: string;
  };
  orderNote?: string;
  orderTags?: Record<string, string>;
}

export interface CashfreePaymentLink {
  linkId: string;
  linkUrl: string;
  linkStatus: string;
  linkAmount: number;
  linkCurrency: string;
  linkPurpose: string;
  customerDetails: {
    customerName?: string;
    customerEmail: string;
    customerPhone?: string;
  };
  linkMeta?: {
    returnUrl?: string;
    notifyUrl?: string;
  };
  linkExpiry?: string;
  linkNotes?: Record<string, string>;
}

export interface WebhookData {
  type: string;
  data: {
    order: {
      orderId: string;
      orderAmount: number;
      orderCurrency: string;
      orderStatus: OrderStatus;
    };
    payment?: {
      paymentStatus: PaymentStatus;
      paymentAmount: number;
      paymentCurrency: string;
      paymentMessage: string;
      paymentTime: string;
      paymentMethod: string;
      paymentGroup: string;
    };
    customerDetails: {
      customerId: string;
      customerName?: string;
      customerEmail: string;
      customerPhone?: string;
    };
  };
}

// Helper functions
export function getPlanById(planId: string): typeof CASHFREE_PLANS[CashfreePlanId] | null {
  return CASHFREE_PLANS[planId.toUpperCase() as CashfreePlanId] || null;
}

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function generateOrderId(userId: string, planId: string): string {
  const timestamp = Date.now();
  return `order_${userId}_${planId}_${timestamp}`;
}

export function generateCustomerId(email: string): string {
  // Create a customer ID from email (remove special chars and make it unique)
  const baseId = email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  return `customer_${baseId}`;
}

// Validate Cashfree configuration
export function validateCashfreeConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!process.env.CASHFREE_APP_ID) {
    errors.push('CASHFREE_APP_ID is required');
  }

  if (!process.env.CASHFREE_SECRET_KEY) {
    errors.push('CASHFREE_SECRET_KEY is required');
  }

  if (!process.env.CASHFREE_WEBHOOK_SECRET) {
    errors.push('CASHFREE_WEBHOOK_SECRET is required');
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    errors.push('NEXT_PUBLIC_APP_URL is required for return URLs');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Create order request for Cashfree
export function createOrderRequest(
  orderId: string,
  amount: number,
  customerEmail: string,
  customerName: string,
  planId: string,
  userId: string
): CashfreeOrder {
  return {
    orderId,
    orderAmount: amount,
    orderCurrency: 'USD',
    customerDetails: {
      customerId: generateCustomerId(customerEmail),
      customerName,
      customerEmail,
    },
    orderMeta: {
      returnUrl: cashfreeConfig.returnUrl,
      notifyUrl: cashfreeConfig.notifyUrl,
    },
    orderNote: `Subscription payment for ${getPlanById(planId)?.name || planId}`,
    orderTags: {
      planId,
      userId,
      subscriptionType: 'monthly',
    },
  };
}

// Verify webhook signature
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  timestamp: string
): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', cashfreeConfig.webhookSecret)
      .update(timestamp + rawBody)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
