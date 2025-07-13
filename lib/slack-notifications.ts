import { WebClient } from '@slack/web-api';

// Slack notification configuration
export const SLACK_CONFIG = {
  webhookUrl: process.env.SLACK_WEBHOOK_URL,
  botToken: process.env.SLACK_BOT_TOKEN,
  channelId: process.env.SLACK_NOTIFICATION_CHANNEL || '#general'
};

// Initialize Slack client
const slack = SLACK_CONFIG.botToken ? new WebClient(SLACK_CONFIG.botToken) : null;

// Notification types
export enum NotificationType {
  USER_SIGNUP = 'user_signup',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUMMARY_GENERATED = 'summary_generated',
  ERROR_OCCURRED = 'error_occurred',
  WORKSPACE_CONNECTED = 'workspace_connected',
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed'
}

// Slack message templates
export const SLACK_TEMPLATES = {
  [NotificationType.USER_SIGNUP]: (data: { name: string; email: string; plan: string }) => ({
    text: `🎉 New user signup!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🎉 *New User Signup*\n\n*Name:* ${data.name}\n*Email:* ${data.email}\n*Plan:* ${data.plan}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${Math.floor(Date.now() / 1000)}^{date_short} at {time}|${new Date().toISOString()}>`
          }
        ]
      }
    ]
  }),

  [NotificationType.SUBSCRIPTION_CREATED]: (data: { name: string; plan: string; amount: number }) => ({
    text: `💰 New subscription created!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `💰 *New Subscription*\n\n*Customer:* ${data.name}\n*Plan:* ${data.plan}\n*Amount:* $${data.amount}/month`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${Math.floor(Date.now() / 1000)}^{date_short} at {time}|${new Date().toISOString()}>`
          }
        ]
      }
    ]
  }),

  [NotificationType.SUMMARY_GENERATED]: (data: { userName: string; summaryTitle: string; wordCount: number; processingTime: number }) => ({
    text: `📄 New summary generated!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `📄 *Summary Generated*\n\n*User:* ${data.userName}\n*Title:* ${data.summaryTitle}\n*Word Count:* ${data.wordCount}\n*Processing Time:* ${data.processingTime}ms`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${Math.floor(Date.now() / 1000)}^{date_short} at {time}|${new Date().toISOString()}>`
          }
        ]
      }
    ]
  }),

  [NotificationType.ERROR_OCCURRED]: (data: { error: string; user?: string; context?: string }) => ({
    text: `🚨 Error occurred!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🚨 *Error Alert*\n\n*Error:* ${data.error}${data.user ? `\n*User:* ${data.user}` : ''}${data.context ? `\n*Context:* ${data.context}` : ''}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${Math.floor(Date.now() / 1000)}^{date_short} at {time}|${new Date().toISOString()}>`
          }
        ]
      }
    ]
  }),

  [NotificationType.WORKSPACE_CONNECTED]: (data: { userName: string; workspaceName: string; teamId: string }) => ({
    text: `🔗 Slack workspace connected!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `🔗 *Slack Workspace Connected*\n\n*User:* ${data.userName}\n*Workspace:* ${data.workspaceName}\n*Team ID:* ${data.teamId}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${Math.floor(Date.now() / 1000)}^{date_short} at {time}|${new Date().toISOString()}>`
          }
        ]
      }
    ]
  }),

  [NotificationType.PAYMENT_SUCCESS]: (data: { customerName: string; plan: string; amount: number; orderId: string }) => ({
    text: `✅ Payment successful!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ *Payment Successful*\n\n*Customer:* ${data.customerName}\n*Plan:* ${data.plan}\n*Amount:* $${data.amount}\n*Order ID:* ${data.orderId}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${Math.floor(Date.now() / 1000)}^{date_short} at {time}|${new Date().toISOString()}>`
          }
        ]
      }
    ]
  }),

  [NotificationType.PAYMENT_FAILED]: (data: { customerName: string; plan: string; amount: number; reason: string }) => ({
    text: `❌ Payment failed!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `❌ *Payment Failed*\n\n*Customer:* ${data.customerName}\n*Plan:* ${data.plan}\n*Amount:* $${data.amount}\n*Reason:* ${data.reason}`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${Math.floor(Date.now() / 1000)}^{date_short} at {time}|${new Date().toISOString()}>`
          }
        ]
      }
    ]
  })
};

// Send notification via webhook
export async function sendSlackWebhookNotification(
  type: NotificationType,
  data: any
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SLACK_CONFIG.webhookUrl) {
      console.warn('Slack webhook URL not configured, skipping notification');
      return { success: false, error: 'Webhook URL not configured' };
    }

    const template = SLACK_TEMPLATES[type];
    if (!template) {
      throw new Error(`No template found for notification type: ${type}`);
    }

    const message = template(data);

    const response = await fetch(SLACK_CONFIG.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`Slack notification sent successfully: ${type}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending Slack webhook notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send notification via bot token
export async function sendSlackBotNotification(
  type: NotificationType,
  data: any,
  channel?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!slack) {
      console.warn('Slack bot token not configured, skipping notification');
      return { success: false, error: 'Bot token not configured' };
    }

    const template = SLACK_TEMPLATES[type];
    if (!template) {
      throw new Error(`No template found for notification type: ${type}`);
    }

    const message = template(data);
    const targetChannel = channel || SLACK_CONFIG.channelId;

    const result = await slack.chat.postMessage({
      channel: targetChannel,
      text: message.text,
      blocks: message.blocks,
    });

    if (!result.ok) {
      throw new Error(`Slack bot message failed: ${result.error}`);
    }

    console.log(`Slack bot notification sent successfully: ${type}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending Slack bot notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Main notification function (tries webhook first, then bot)
export async function sendSlackNotification(
  type: NotificationType,
  data: any,
  options?: {
    channel?: string;
    preferBot?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try bot first if preferred and available
    if (options?.preferBot && slack) {
      const botResult = await sendSlackBotNotification(type, data, options.channel);
      if (botResult.success) {
        return botResult;
      }
    }

    // Try webhook
    if (SLACK_CONFIG.webhookUrl) {
      const webhookResult = await sendSlackWebhookNotification(type, data);
      if (webhookResult.success) {
        return webhookResult;
      }
    }

    // Try bot as fallback if not preferred
    if (!options?.preferBot && slack) {
      const botResult = await sendSlackBotNotification(type, data, options?.channel);
      if (botResult.success) {
        return botResult;
      }
    }

    return { success: false, error: 'No Slack notification method available' };
  } catch (error) {
    console.error('Error in sendSlackNotification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Convenience functions for specific notifications
export const slackNotifications = {
  userSignup: (data: { name: string; email: string; plan: string }) =>
    sendSlackNotification(NotificationType.USER_SIGNUP, data),

  subscriptionCreated: (data: { name: string; plan: string; amount: number }) =>
    sendSlackNotification(NotificationType.SUBSCRIPTION_CREATED, data),

  summaryGenerated: (data: { userName: string; summaryTitle: string; wordCount: number; processingTime: number }) =>
    sendSlackNotification(NotificationType.SUMMARY_GENERATED, data),

  errorOccurred: (data: { error: string; user?: string; context?: string }) =>
    sendSlackNotification(NotificationType.ERROR_OCCURRED, data),

  workspaceConnected: (data: { userName: string; workspaceName: string; teamId: string }) =>
    sendSlackNotification(NotificationType.WORKSPACE_CONNECTED, data),

  paymentSuccess: (data: { customerName: string; plan: string; amount: number; orderId: string }) =>
    sendSlackNotification(NotificationType.PAYMENT_SUCCESS, data),

  paymentFailed: (data: { customerName: string; plan: string; amount: number; reason: string }) =>
    sendSlackNotification(NotificationType.PAYMENT_FAILED, data)
};
