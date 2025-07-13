import crypto from 'crypto';
import { prisma } from './prisma';

// Webhook event types
export enum WebhookEventType {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  SUBSCRIPTION_CREATED = 'subscription.created',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  SUBSCRIPTION_CANCELLED = 'subscription.cancelled',
  PAYMENT_SUCCESS = 'payment.success',
  PAYMENT_FAILED = 'payment.failed',
  SUMMARY_CREATED = 'summary.created',
  SUMMARY_COMPLETED = 'summary.completed',
  SUMMARY_FAILED = 'summary.failed',
  SLACK_CONNECTED = 'slack.connected',
  SLACK_DISCONNECTED = 'slack.disconnected',
  FILE_UPLOADED = 'file.uploaded',
  FILE_PROCESSED = 'file.processed',
  EXPORT_COMPLETED = 'export.completed'
}

// Webhook payload interface
export interface WebhookPayload {
  id: string;
  event: WebhookEventType;
  data: Record<string, any>;
  timestamp: string;
  version: string;
}

// Webhook endpoint interface
export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  active: boolean;
  organizationId?: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Webhook delivery attempt interface
export interface WebhookDelivery {
  id: string;
  webhookEndpointId: string;
  payload: WebhookPayload;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
}

// Generate webhook signature
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

// Verify webhook signature
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Create webhook payload
export function createWebhookPayload(
  event: WebhookEventType,
  data: Record<string, any>
): WebhookPayload {
  return {
    id: crypto.randomUUID(),
    event,
    data,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
}

// Send webhook to endpoint
export async function sendWebhook(
  endpoint: WebhookEndpoint,
  payload: WebhookPayload
): Promise<{
  success: boolean;
  status?: number;
  response?: string;
  error?: string;
}> {
  try {
    const payloadString = JSON.stringify(payload);
    const signature = generateWebhookSignature(payloadString, endpoint.secret);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-ID': payload.id,
        'User-Agent': 'SlackSummaryScribe-Webhooks/1.0'
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    const responseText = await response.text();

    if (response.ok) {
      console.log(`Webhook delivered successfully to ${endpoint.url}:`, {
        event: payload.event,
        status: response.status
      });
      
      return {
        success: true,
        status: response.status,
        response: responseText
      };
    } else {
      console.error(`Webhook delivery failed to ${endpoint.url}:`, {
        event: payload.event,
        status: response.status,
        response: responseText
      });
      
      return {
        success: false,
        status: response.status,
        response: responseText,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    console.error(`Webhook delivery error to ${endpoint.url}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Deliver webhook to all matching endpoints
export async function deliverWebhook(
  event: WebhookEventType,
  data: Record<string, any>,
  options?: {
    organizationId?: string;
    userId?: string;
  }
): Promise<void> {
  try {
    const payload = createWebhookPayload(event, data);

    // Get all active webhook endpoints that listen for this event
    const endpoints = await getWebhookEndpoints({
      event,
      organizationId: options?.organizationId,
      userId: options?.userId
    });

    if (endpoints.length === 0) {
      console.log(`No webhook endpoints found for event: ${event}`);
      return;
    }

    console.log(`Delivering webhook to ${endpoints.length} endpoints:`, {
      event,
      endpointCount: endpoints.length
    });

    // Send webhooks in parallel
    const deliveryPromises = endpoints.map(async (endpoint) => {
      try {
        const result = await sendWebhook(endpoint, payload);
        
        // Store delivery attempt (in a real implementation, you'd store this in the database)
        await storeWebhookDelivery(endpoint.id, payload, result);
        
        return result;
      } catch (error) {
        console.error(`Failed to deliver webhook to ${endpoint.url}:`, error);
        
        // Store failed delivery attempt
        await storeWebhookDelivery(endpoint.id, payload, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        return { success: false, error: 'Delivery failed' };
      }
    });

    await Promise.allSettled(deliveryPromises);
  } catch (error) {
    console.error('Error in deliverWebhook:', error);
  }
}

// Get webhook endpoints (mock implementation - replace with actual database queries)
async function getWebhookEndpoints(filters: {
  event: WebhookEventType;
  organizationId?: string;
  userId?: string;
}): Promise<WebhookEndpoint[]> {
  // In a real implementation, this would query the database
  // For now, return mock endpoints for demonstration
  
  const mockEndpoints: WebhookEndpoint[] = [
    {
      id: 'webhook-1',
      url: 'https://api.example.com/webhooks/slack-summary-scribe',
      secret: 'webhook-secret-123',
      events: [
        WebhookEventType.SUMMARY_COMPLETED,
        WebhookEventType.PAYMENT_SUCCESS,
        WebhookEventType.SUBSCRIPTION_CREATED
      ],
      active: true,
      organizationId: filters.organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  // Filter endpoints that listen for this event
  return mockEndpoints.filter(endpoint => 
    endpoint.active && 
    endpoint.events.includes(filters.event) &&
    (!filters.organizationId || endpoint.organizationId === filters.organizationId)
  );
}

// Store webhook delivery attempt (mock implementation)
async function storeWebhookDelivery(
  endpointId: string,
  payload: WebhookPayload,
  result: {
    success: boolean;
    status?: number;
    response?: string;
    error?: string;
  }
): Promise<void> {
  // In a real implementation, this would store the delivery attempt in the database
  console.log('Webhook delivery stored:', {
    endpointId,
    event: payload.event,
    success: result.success,
    status: result.status
  });
}

// Convenience functions for common webhook events
export const webhooks = {
  userCreated: (data: { userId: string; email: string; name: string }) =>
    deliverWebhook(WebhookEventType.USER_CREATED, data),

  subscriptionCreated: (data: { subscriptionId: string; userId: string; plan: string; amount: number }) =>
    deliverWebhook(WebhookEventType.SUBSCRIPTION_CREATED, data),

  paymentSuccess: (data: { paymentId: string; userId: string; amount: number; plan: string }) =>
    deliverWebhook(WebhookEventType.PAYMENT_SUCCESS, data),

  paymentFailed: (data: { paymentId: string; userId: string; amount: number; reason: string }) =>
    deliverWebhook(WebhookEventType.PAYMENT_FAILED, data),

  summaryCompleted: (data: { summaryId: string; userId: string; title: string; wordCount: number }, organizationId?: string) =>
    deliverWebhook(WebhookEventType.SUMMARY_COMPLETED, data, { organizationId }),

  slackConnected: (data: { userId: string; workspaceId: string; workspaceName: string }, organizationId?: string) =>
    deliverWebhook(WebhookEventType.SLACK_CONNECTED, data, { organizationId }),

  fileProcessed: (data: { fileId: string; userId: string; fileName: string; status: string }, organizationId?: string) =>
    deliverWebhook(WebhookEventType.FILE_PROCESSED, data, { organizationId }),

  exportCompleted: (data: { exportId: string; userId: string; format: string; summaryId: string }, organizationId?: string) =>
    deliverWebhook(WebhookEventType.EXPORT_COMPLETED, data, { organizationId })
};

// Webhook retry logic (for failed deliveries)
export async function retryFailedWebhooks(): Promise<void> {
  try {
    // In a real implementation, this would:
    // 1. Query the database for failed webhook deliveries that are due for retry
    // 2. Attempt to redeliver them
    // 3. Update the delivery status
    // 4. Implement exponential backoff for retries
    
    console.log('Webhook retry job started');
    
    // Mock implementation
    const failedDeliveries = await getFailedWebhookDeliveries();
    
    for (const delivery of failedDeliveries) {
      if (delivery.attempts < 5) { // Max 5 retry attempts
        console.log(`Retrying webhook delivery: ${delivery.id}`);
        // Retry logic would go here
      } else {
        console.log(`Max retries reached for webhook delivery: ${delivery.id}`);
        // Mark as permanently failed
      }
    }
    
    console.log('Webhook retry job completed');
  } catch (error) {
    console.error('Error in webhook retry job:', error);
  }
}

// Mock function to get failed webhook deliveries
async function getFailedWebhookDeliveries(): Promise<WebhookDelivery[]> {
  // In a real implementation, this would query the database
  return [];
}
