import * as Sentry from '@sentry/nextjs';

// Sentry monitoring configuration
export const SENTRY_MONITORING_CONFIG = {
  releaseWebhookUrl: process.env.SENTRY_RELEASE_WEBHOOK_URL,
  alertWebhookUrl: process.env.SENTRY_ALERT_WEBHOOK_URL,
  errorThreshold: 10, // errors per minute
  performanceThreshold: 5000, // 5 seconds
  uptimeThreshold: 99.5 // 99.5% uptime
};

// Release data interface
export interface SentryReleaseData {
  version: string;
  environment: string;
  dateCreated: Date;
  dateReleased?: Date;
  commitCount: number;
  deployCount: number;
  newGroups: number;
  resolvedGroups: number;
  url?: string;
  projects: string[];
}

// Error alert data interface
export interface SentryErrorAlert {
  id: string;
  title: string;
  message: string;
  level: 'error' | 'warning' | 'info';
  timestamp: Date;
  environment: string;
  release?: string;
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
  tags: Record<string, string>;
  fingerprint: string[];
  url?: string;
  count: number;
  userCount: number;
}

// Performance alert data interface
export interface SentryPerformanceAlert {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  environment: string;
  transaction: string;
  duration: number;
  threshold: number;
  url?: string;
  tags: Record<string, string>;
}

// Create Sentry release
export async function createSentryRelease(
  version: string,
  environment: string = 'production'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG || !process.env.SENTRY_PROJECT) {
      console.warn('Sentry configuration incomplete, skipping release creation');
      return { success: false, error: 'Sentry not configured' };
    }

    const sentryUrl = `https://sentry.io/api/0/organizations/${process.env.SENTRY_ORG}/releases/`;
    
    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENTRY_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version,
        projects: [process.env.SENTRY_PROJECT],
        dateReleased: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Sentry release creation failed: ${response.status} ${errorData}`);
    }

    const releaseData = await response.json();
    console.log('Sentry release created successfully:', version);

    // Deploy the release to environment
    await deploySentryRelease(version, environment);

    return { success: true };
  } catch (error) {
    console.error('Error creating Sentry release:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Deploy Sentry release to environment
export async function deploySentryRelease(
  version: string,
  environment: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const sentryUrl = `https://sentry.io/api/0/organizations/${process.env.SENTRY_ORG}/releases/${version}/deploys/`;
    
    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENTRY_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        environment,
        dateStarted: new Date().toISOString(),
        dateFinished: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Sentry deploy failed: ${response.status} ${errorData}`);
    }

    console.log(`Sentry release ${version} deployed to ${environment}`);
    return { success: true };
  } catch (error) {
    console.error('Error deploying Sentry release:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send Sentry release notification
export async function sendSentryReleaseNotification(
  releaseData: SentryReleaseData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SENTRY_MONITORING_CONFIG.releaseWebhookUrl) {
      console.warn('Sentry release webhook URL not configured');
      return { success: false, error: 'Webhook URL not configured' };
    }

    const message = {
      text: `🚀 New Sentry Release: ${releaseData.version}`,
      attachments: [
        {
          color: '#362d59',
          fields: [
            {
              title: 'Version',
              value: releaseData.version,
              short: true
            },
            {
              title: 'Environment',
              value: releaseData.environment,
              short: true
            },
            {
              title: 'Commits',
              value: releaseData.commitCount.toString(),
              short: true
            },
            {
              title: 'Deploys',
              value: releaseData.deployCount.toString(),
              short: true
            },
            {
              title: 'New Issues',
              value: releaseData.newGroups.toString(),
              short: true
            },
            {
              title: 'Resolved Issues',
              value: releaseData.resolvedGroups.toString(),
              short: true
            },
            ...(releaseData.url ? [{
              title: 'Release URL',
              value: releaseData.url,
              short: false
            }] : [])
          ],
          footer: 'Sentry Release Notification',
          ts: Math.floor(releaseData.dateCreated.getTime() / 1000)
        }
      ]
    };

    const response = await fetch(SENTRY_MONITORING_CONFIG.releaseWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Release notification failed: ${response.status} ${response.statusText}`);
    }

    console.log('Sentry release notification sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending Sentry release notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send Sentry error alert
export async function sendSentryErrorAlert(
  alertData: SentryErrorAlert
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SENTRY_MONITORING_CONFIG.alertWebhookUrl) {
      console.warn('Sentry alert webhook URL not configured');
      return { success: false, error: 'Webhook URL not configured' };
    }

    const alertColor = {
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };

    const message = {
      text: `🚨 Sentry Alert: ${alertData.title}`,
      attachments: [
        {
          color: alertColor[alertData.level],
          fields: [
            {
              title: 'Level',
              value: alertData.level.toUpperCase(),
              short: true
            },
            {
              title: 'Environment',
              value: alertData.environment,
              short: true
            },
            {
              title: 'Count',
              value: alertData.count.toString(),
              short: true
            },
            {
              title: 'Users Affected',
              value: alertData.userCount.toString(),
              short: true
            },
            ...(alertData.release ? [{
              title: 'Release',
              value: alertData.release,
              short: true
            }] : []),
            ...(alertData.user ? [{
              title: 'User',
              value: alertData.user.email || alertData.user.username || alertData.user.id,
              short: true
            }] : []),
            {
              title: 'Message',
              value: alertData.message,
              short: false
            },
            ...(alertData.url ? [{
              title: 'View in Sentry',
              value: alertData.url,
              short: false
            }] : [])
          ],
          footer: 'Sentry Error Alert',
          ts: Math.floor(alertData.timestamp.getTime() / 1000)
        }
      ]
    };

    const response = await fetch(SENTRY_MONITORING_CONFIG.alertWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Error alert failed: ${response.status} ${response.statusText}`);
    }

    console.log('Sentry error alert sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending Sentry error alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send Sentry performance alert
export async function sendSentryPerformanceAlert(
  alertData: SentryPerformanceAlert
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!SENTRY_MONITORING_CONFIG.alertWebhookUrl) {
      console.warn('Sentry alert webhook URL not configured');
      return { success: false, error: 'Webhook URL not configured' };
    }

    const message = {
      text: `⚡ Sentry Performance Alert: ${alertData.title}`,
      attachments: [
        {
          color: '#ff9500',
          fields: [
            {
              title: 'Transaction',
              value: alertData.transaction,
              short: true
            },
            {
              title: 'Environment',
              value: alertData.environment,
              short: true
            },
            {
              title: 'Duration',
              value: `${alertData.duration}ms`,
              short: true
            },
            {
              title: 'Threshold',
              value: `${alertData.threshold}ms`,
              short: true
            },
            {
              title: 'Message',
              value: alertData.message,
              short: false
            },
            ...(alertData.url ? [{
              title: 'View in Sentry',
              value: alertData.url,
              short: false
            }] : [])
          ],
          footer: 'Sentry Performance Alert',
          ts: Math.floor(alertData.timestamp.getTime() / 1000)
        }
      ]
    };

    const response = await fetch(SENTRY_MONITORING_CONFIG.alertWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Performance alert failed: ${response.status} ${response.statusText}`);
    }

    console.log('Sentry performance alert sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending Sentry performance alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Monitor error rates and send alerts
export async function monitorErrorRates(): Promise<void> {
  try {
    // In a real implementation, you would query Sentry API for recent errors
    // For now, we'll simulate monitoring
    console.log('Monitoring error rates...');
    
    // This would be replaced with actual Sentry API calls
    const errorRate = Math.random() * 20; // Simulate error rate
    
    if (errorRate > SENTRY_MONITORING_CONFIG.errorThreshold) {
      await sendSentryErrorAlert({
        id: `alert-${Date.now()}`,
        title: 'High Error Rate Detected',
        message: `Error rate is ${errorRate.toFixed(2)} errors/minute, above threshold of ${SENTRY_MONITORING_CONFIG.errorThreshold}`,
        level: 'error',
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        tags: { alert_type: 'error_rate' },
        fingerprint: ['error-rate-alert'],
        count: Math.floor(errorRate),
        userCount: Math.floor(errorRate / 2)
      });
    }
  } catch (error) {
    console.error('Error monitoring error rates:', error);
  }
}

// Monitor performance and send alerts
export async function monitorPerformance(): Promise<void> {
  try {
    console.log('Monitoring performance...');
    
    // This would be replaced with actual Sentry API calls
    const avgResponseTime = Math.random() * 10000; // Simulate response time
    
    if (avgResponseTime > SENTRY_MONITORING_CONFIG.performanceThreshold) {
      await sendSentryPerformanceAlert({
        id: `perf-alert-${Date.now()}`,
        title: 'Slow Response Time Detected',
        message: `Average response time is ${avgResponseTime.toFixed(2)}ms, above threshold of ${SENTRY_MONITORING_CONFIG.performanceThreshold}ms`,
        timestamp: new Date(),
        environment: process.env.NODE_ENV || 'development',
        transaction: '/api/*',
        duration: avgResponseTime,
        threshold: SENTRY_MONITORING_CONFIG.performanceThreshold,
        tags: { alert_type: 'performance' }
      });
    }
  } catch (error) {
    console.error('Error monitoring performance:', error);
  }
}

// Convenience functions
export const sentryMonitoring = {
  // Release management
  createRelease: (version: string, environment?: string) => createSentryRelease(version, environment),
  deployRelease: (version: string, environment: string) => deploySentryRelease(version, environment),
  
  // Notifications
  notifyRelease: (releaseData: SentryReleaseData) => sendSentryReleaseNotification(releaseData),
  notifyError: (alertData: SentryErrorAlert) => sendSentryErrorAlert(alertData),
  notifyPerformance: (alertData: SentryPerformanceAlert) => sendSentryPerformanceAlert(alertData),
  
  // Monitoring
  monitorErrors: () => monitorErrorRates(),
  monitorPerformance: () => monitorPerformance()
};
