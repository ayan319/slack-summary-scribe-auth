import { slackNotifications } from './slack-notifications';
import { sendEmail } from './resend';

// Deployment notification configuration
export const DEPLOYMENT_CONFIG = {
  slackWebhookUrl: process.env.DEPLOYMENT_SLACK_WEBHOOK_URL,
  discordWebhookUrl: process.env.DEPLOYMENT_DISCORD_WEBHOOK_URL,
  notificationEmails: process.env.DEPLOYMENT_NOTIFICATION_EMAILS?.split(',') || [],
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
};

// Deployment status types
export enum DeploymentStatus {
  STARTED = 'started',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Deployment data interface
export interface DeploymentData {
  id: string;
  status: DeploymentStatus;
  environment: string;
  branch: string;
  commit: {
    sha: string;
    message: string;
    author: string;
    url?: string;
  };
  url?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  buildLogs?: string;
  error?: string;
}

// Send Slack deployment notification
export async function sendSlackDeploymentNotification(
  deployment: DeploymentData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!DEPLOYMENT_CONFIG.slackWebhookUrl) {
      console.warn('Slack webhook URL not configured for deployment notifications');
      return { success: false, error: 'Webhook URL not configured' };
    }

    const statusEmoji = {
      [DeploymentStatus.STARTED]: '🚀',
      [DeploymentStatus.SUCCESS]: '✅',
      [DeploymentStatus.FAILED]: '❌',
      [DeploymentStatus.CANCELLED]: '⏹️'
    };

    const statusColor = {
      [DeploymentStatus.STARTED]: '#36a3eb',
      [DeploymentStatus.SUCCESS]: '#28a745',
      [DeploymentStatus.FAILED]: '#dc3545',
      [DeploymentStatus.CANCELLED]: '#6c757d'
    };

    const message = {
      text: `${statusEmoji[deployment.status]} Deployment ${deployment.status}`,
      attachments: [
        {
          color: statusColor[deployment.status],
          fields: [
            {
              title: 'Environment',
              value: deployment.environment,
              short: true
            },
            {
              title: 'Branch',
              value: deployment.branch,
              short: true
            },
            {
              title: 'Commit',
              value: `\`${deployment.commit.sha.substring(0, 7)}\` ${deployment.commit.message}`,
              short: false
            },
            {
              title: 'Author',
              value: deployment.commit.author,
              short: true
            },
            ...(deployment.duration ? [{
              title: 'Duration',
              value: `${Math.round(deployment.duration / 1000)}s`,
              short: true
            }] : []),
            ...(deployment.url ? [{
              title: 'URL',
              value: deployment.url,
              short: false
            }] : []),
            ...(deployment.error ? [{
              title: 'Error',
              value: deployment.error,
              short: false
            }] : [])
          ],
          footer: 'Slack Summary Scribe',
          ts: Math.floor(deployment.startTime.getTime() / 1000)
        }
      ]
    };

    const response = await fetch(DEPLOYMENT_CONFIG.slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('Slack deployment notification sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending Slack deployment notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send Discord deployment notification
export async function sendDiscordDeploymentNotification(
  deployment: DeploymentData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!DEPLOYMENT_CONFIG.discordWebhookUrl) {
      console.warn('Discord webhook URL not configured for deployment notifications');
      return { success: false, error: 'Webhook URL not configured' };
    }

    const statusEmoji = {
      [DeploymentStatus.STARTED]: '🚀',
      [DeploymentStatus.SUCCESS]: '✅',
      [DeploymentStatus.FAILED]: '❌',
      [DeploymentStatus.CANCELLED]: '⏹️'
    };

    const statusColor = {
      [DeploymentStatus.STARTED]: 0x36a3eb,
      [DeploymentStatus.SUCCESS]: 0x28a745,
      [DeploymentStatus.FAILED]: 0xdc3545,
      [DeploymentStatus.CANCELLED]: 0x6c757d
    };

    const embed = {
      title: `${statusEmoji[deployment.status]} Deployment ${deployment.status.toUpperCase()}`,
      color: statusColor[deployment.status],
      fields: [
        {
          name: 'Environment',
          value: deployment.environment,
          inline: true
        },
        {
          name: 'Branch',
          value: deployment.branch,
          inline: true
        },
        {
          name: 'Commit',
          value: `\`${deployment.commit.sha.substring(0, 7)}\` ${deployment.commit.message}`,
          inline: false
        },
        {
          name: 'Author',
          value: deployment.commit.author,
          inline: true
        },
        ...(deployment.duration ? [{
          name: 'Duration',
          value: `${Math.round(deployment.duration / 1000)}s`,
          inline: true
        }] : []),
        ...(deployment.url ? [{
          name: 'URL',
          value: deployment.url,
          inline: false
        }] : []),
        ...(deployment.error ? [{
          name: 'Error',
          value: deployment.error,
          inline: false
        }] : [])
      ],
      footer: {
        text: 'Slack Summary Scribe'
      },
      timestamp: deployment.startTime.toISOString()
    };

    const message = {
      embeds: [embed]
    };

    const response = await fetch(DEPLOYMENT_CONFIG.discordWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('Discord deployment notification sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending Discord deployment notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send email deployment notification
export async function sendEmailDeploymentNotification(
  deployment: DeploymentData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (DEPLOYMENT_CONFIG.notificationEmails.length === 0) {
      console.warn('No notification emails configured for deployment notifications');
      return { success: false, error: 'No notification emails configured' };
    }

    const statusEmoji = {
      [DeploymentStatus.STARTED]: '🚀',
      [DeploymentStatus.SUCCESS]: '✅',
      [DeploymentStatus.FAILED]: '❌',
      [DeploymentStatus.CANCELLED]: '⏹️'
    };

    const subject = `${statusEmoji[deployment.status]} Deployment ${deployment.status} - ${deployment.environment}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2563eb; margin-bottom: 10px;">
            ${statusEmoji[deployment.status]} Deployment ${deployment.status.toUpperCase()}
          </h1>
          <p style="color: #6b7280; font-size: 16px;">Slack Summary Scribe</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <table style="width: 100%; color: #4b5563;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Environment:</td>
              <td style="padding: 8px 0;">${deployment.environment}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Branch:</td>
              <td style="padding: 8px 0;">${deployment.branch}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Commit:</td>
              <td style="padding: 8px 0;">
                <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 4px;">
                  ${deployment.commit.sha.substring(0, 7)}
                </code>
                ${deployment.commit.message}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Author:</td>
              <td style="padding: 8px 0;">${deployment.commit.author}</td>
            </tr>
            ${deployment.duration ? `
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Duration:</td>
              <td style="padding: 8px 0;">${Math.round(deployment.duration / 1000)}s</td>
            </tr>
            ` : ''}
            ${deployment.url ? `
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">URL:</td>
              <td style="padding: 8px 0;">
                <a href="${deployment.url}" style="color: #2563eb;">${deployment.url}</a>
              </td>
            </tr>
            ` : ''}
            ${deployment.error ? `
            <tr>
              <td style="padding: 8px 0; font-weight: 600;">Error:</td>
              <td style="padding: 8px 0; color: #dc2626;">${deployment.error}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="text-align: center; color: #6b7280; font-size: 14px;">
          <p>Deployment notification from Slack Summary Scribe</p>
          <p>Time: ${deployment.startTime.toISOString()}</p>
        </div>
      </div>
    `;

    // Send to all configured notification emails
    const results = await Promise.allSettled(
      DEPLOYMENT_CONFIG.notificationEmails.map(email =>
        sendEmail({
          to: email.trim(),
          subject,
          html
        })
      )
    );

    const successCount = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    console.log(`Email deployment notifications sent: ${successCount}/${DEPLOYMENT_CONFIG.notificationEmails.length}`);
    
    return { 
      success: successCount > 0,
      error: successCount === 0 ? 'All email notifications failed' : undefined
    };
  } catch (error) {
    console.error('Error sending email deployment notification:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Send all deployment notifications
export async function sendDeploymentNotifications(
  deployment: DeploymentData
): Promise<{
  success: boolean;
  results: {
    slack: { success: boolean; error?: string };
    discord: { success: boolean; error?: string };
    email: { success: boolean; error?: string };
  };
}> {
  console.log('Sending deployment notifications:', {
    id: deployment.id,
    status: deployment.status,
    environment: deployment.environment
  });

  // Send all notifications in parallel
  const [slackResult, discordResult, emailResult] = await Promise.allSettled([
    sendSlackDeploymentNotification(deployment),
    sendDiscordDeploymentNotification(deployment),
    sendEmailDeploymentNotification(deployment)
  ]);

  const results = {
    slack: slackResult.status === 'fulfilled' ? slackResult.value : { success: false, error: 'Promise rejected' },
    discord: discordResult.status === 'fulfilled' ? discordResult.value : { success: false, error: 'Promise rejected' },
    email: emailResult.status === 'fulfilled' ? emailResult.value : { success: false, error: 'Promise rejected' }
  };

  const overallSuccess = Object.values(results).some(result => result.success);

  return {
    success: overallSuccess,
    results
  };
}

// Convenience functions for different deployment events
export const deploymentNotifications = {
  // Deployment started
  started: (deployment: Omit<DeploymentData, 'status'>) =>
    sendDeploymentNotifications({ ...deployment, status: DeploymentStatus.STARTED }),

  // Deployment succeeded
  success: (deployment: Omit<DeploymentData, 'status'>) =>
    sendDeploymentNotifications({ ...deployment, status: DeploymentStatus.SUCCESS }),

  // Deployment failed
  failed: (deployment: Omit<DeploymentData, 'status'>) =>
    sendDeploymentNotifications({ ...deployment, status: DeploymentStatus.FAILED }),

  // Deployment cancelled
  cancelled: (deployment: Omit<DeploymentData, 'status'>) =>
    sendDeploymentNotifications({ ...deployment, status: DeploymentStatus.CANCELLED })
};
