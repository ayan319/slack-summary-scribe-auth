import { performanceMonitor } from './performance-monitor';
import { databaseMonitor } from './database-monitor';
import { slackNotifications } from './slack-notifications';
import { sendEmail } from './resend';

// Alert configuration
export const ALERT_CONFIG = {
  thresholds: {
    errorRate: 5, // errors per minute
    responseTime: 5000, // 5 seconds
    memoryUsage: 500 * 1024 * 1024, // 500MB
    cpuUsage: 80, // 80%
    diskUsage: 90, // 90%
    databaseConnections: 80, // 80% of max connections
    queueLength: 100, // 100 jobs in queue
    uptimePercentage: 99.5 // 99.5% uptime
  },
  cooldownPeriods: {
    error: 5 * 60 * 1000, // 5 minutes
    performance: 10 * 60 * 1000, // 10 minutes
    system: 15 * 60 * 1000 // 15 minutes
  },
  recipients: {
    critical: process.env.CRITICAL_ALERT_EMAILS?.split(',') || [],
    warning: process.env.WARNING_ALERT_EMAILS?.split(',') || [],
    info: process.env.INFO_ALERT_EMAILS?.split(',') || []
  }
};

// Alert severity levels
export enum AlertSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info'
}

// Alert types
export enum AlertType {
  ERROR_RATE = 'error_rate',
  RESPONSE_TIME = 'response_time',
  MEMORY_USAGE = 'memory_usage',
  CPU_USAGE = 'cpu_usage',
  DISK_USAGE = 'disk_usage',
  DATABASE_PERFORMANCE = 'database_performance',
  QUEUE_LENGTH = 'queue_length',
  UPTIME = 'uptime',
  CUSTOM = 'custom'
}

// Alert data interface
export interface AlertData {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  value: number;
  threshold: number;
  unit: string;
  environment: string;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
}

// Alert state management
class AlertManager {
  private static instance: AlertManager;
  private activeAlerts: Map<string, AlertData> = new Map();
  private lastAlertTimes: Map<string, number> = new Map();

  private constructor() {}

  public static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  // Check if alert should be sent (respects cooldown)
  public shouldSendAlert(alertKey: string, severity: AlertSeverity): boolean {
    const now = Date.now();
    const lastAlertTime = this.lastAlertTimes.get(alertKey) || 0;
    
    let cooldownPeriod: number;
    switch (severity) {
      case AlertSeverity.CRITICAL:
        cooldownPeriod = ALERT_CONFIG.cooldownPeriods.error;
        break;
      case AlertSeverity.WARNING:
        cooldownPeriod = ALERT_CONFIG.cooldownPeriods.performance;
        break;
      case AlertSeverity.INFO:
        cooldownPeriod = ALERT_CONFIG.cooldownPeriods.system;
        break;
    }

    return (now - lastAlertTime) >= cooldownPeriod;
  }

  // Record alert sent
  public recordAlert(alertKey: string, alert: AlertData): void {
    this.lastAlertTimes.set(alertKey, Date.now());
    this.activeAlerts.set(alertKey, alert);
  }

  // Resolve alert
  public resolveAlert(alertKey: string): void {
    const alert = this.activeAlerts.get(alertKey);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.activeAlerts.set(alertKey, alert);
    }
  }

  // Get active alerts
  public getActiveAlerts(): AlertData[] {
    return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolved);
  }
}

// Send alert notification
export async function sendAlert(alert: AlertData): Promise<{ success: boolean; error?: string }> {
  try {
    const alertManager = AlertManager.getInstance();
    const alertKey = `${alert.type}-${alert.environment}`;

    // Check cooldown
    if (!alertManager.shouldSendAlert(alertKey, alert.severity)) {
      console.log(`Alert ${alertKey} is in cooldown, skipping`);
      return { success: false, error: 'Alert in cooldown' };
    }

    // Record the alert
    alertManager.recordAlert(alertKey, alert);

    // Send Slack notification
    await sendSlackAlert(alert);

    // Send email notification
    await sendEmailAlert(alert);

    console.log(`Alert sent: ${alert.title}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send Slack alert
async function sendSlackAlert(alert: AlertData): Promise<void> {
  const severityEmoji = {
    [AlertSeverity.CRITICAL]: '🚨',
    [AlertSeverity.WARNING]: '⚠️',
    [AlertSeverity.INFO]: 'ℹ️'
  };

  const severityColor = {
    [AlertSeverity.CRITICAL]: '#dc2626',
    [AlertSeverity.WARNING]: '#f59e0b',
    [AlertSeverity.INFO]: '#3b82f6'
  };

  await slackNotifications.errorOccurred({
    error: `${severityEmoji[alert.severity]} ${alert.title}`,
    context: `${alert.message}\nValue: ${alert.value}${alert.unit}\nThreshold: ${alert.threshold}${alert.unit}\nEnvironment: ${alert.environment}`
  });
}

// Send email alert
async function sendEmailAlert(alert: AlertData): Promise<void> {
  const recipients = ALERT_CONFIG.recipients[alert.severity];
  if (recipients.length === 0) return;

  const severityColor = {
    [AlertSeverity.CRITICAL]: '#dc2626',
    [AlertSeverity.WARNING]: '#f59e0b',
    [AlertSeverity.INFO]: '#3b82f6'
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${severityColor[alert.severity]}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">${alert.severity.toUpperCase()} ALERT</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">${alert.title}</p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width: 100%; color: #4b5563;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Alert Type:</td>
            <td style="padding: 8px 0;">${alert.type.replace('_', ' ').toUpperCase()}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Environment:</td>
            <td style="padding: 8px 0;">${alert.environment}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Current Value:</td>
            <td style="padding: 8px 0;">${alert.value}${alert.unit}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Threshold:</td>
            <td style="padding: 8px 0;">${alert.threshold}${alert.unit}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600;">Timestamp:</td>
            <td style="padding: 8px 0;">${alert.timestamp.toISOString()}</td>
          </tr>
        </table>
        
        <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 6px; border: 1px solid #d1d5db;">
          <h3 style="margin: 0 0 10px 0; color: #1f2937;">Message:</h3>
          <p style="margin: 0; color: #4b5563; line-height: 1.6;">${alert.message}</p>
        </div>
        
        ${alert.metadata ? `
          <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px; border: 1px solid #d1d5db;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">Additional Details:</h3>
            <pre style="margin: 0; color: #6b7280; font-size: 12px; overflow-x: auto;">${JSON.stringify(alert.metadata, null, 2)}</pre>
          </div>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
        <p>Slack Summary Scribe - Automated Alert System</p>
      </div>
    </div>
  `;

  // Send to all recipients
  await Promise.allSettled(
    recipients.map(email =>
      sendEmail({
        to: email.trim(),
        subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        html
      })
    )
  );
}

// Monitor system metrics and send alerts
export async function monitorSystemMetrics(): Promise<void> {
  try {
    console.log('Monitoring system metrics...');

    // Get performance stats
    const perfStats = performanceMonitor.getStats(5 * 60 * 1000); // Last 5 minutes
    const dbStats = databaseMonitor.getStats(5 * 60 * 1000);

    // Check error rate
    if (perfStats.errorRate > ALERT_CONFIG.thresholds.errorRate) {
      await sendAlert({
        id: `error-rate-${Date.now()}`,
        type: AlertType.ERROR_RATE,
        severity: AlertSeverity.CRITICAL,
        title: 'High Error Rate Detected',
        message: `Error rate is ${perfStats.errorRate.toFixed(2)}% over the last 5 minutes`,
        timestamp: new Date(),
        value: perfStats.errorRate,
        threshold: ALERT_CONFIG.thresholds.errorRate,
        unit: '%',
        environment: process.env.NODE_ENV || 'development'
      });
    }

    // Check response time
    if (perfStats.p95ResponseTime > ALERT_CONFIG.thresholds.responseTime) {
      await sendAlert({
        id: `response-time-${Date.now()}`,
        type: AlertType.RESPONSE_TIME,
        severity: AlertSeverity.WARNING,
        title: 'Slow Response Time Detected',
        message: `95th percentile response time is ${perfStats.p95ResponseTime}ms`,
        timestamp: new Date(),
        value: perfStats.p95ResponseTime,
        threshold: ALERT_CONFIG.thresholds.responseTime,
        unit: 'ms',
        environment: process.env.NODE_ENV || 'development'
      });
    }

    // Check database performance
    if (dbStats.p95QueryTime > 2000) { // 2 seconds
      await sendAlert({
        id: `db-performance-${Date.now()}`,
        type: AlertType.DATABASE_PERFORMANCE,
        severity: AlertSeverity.WARNING,
        title: 'Slow Database Queries Detected',
        message: `95th percentile database query time is ${dbStats.p95QueryTime}ms`,
        timestamp: new Date(),
        value: dbStats.p95QueryTime,
        threshold: 2000,
        unit: 'ms',
        environment: process.env.NODE_ENV || 'development',
        metadata: {
          totalQueries: dbStats.totalQueries,
          slowQueries: dbStats.slowQueries,
          successRate: dbStats.successRate
        }
      });
    }

    console.log('System metrics monitoring completed');
  } catch (error) {
    console.error('Error monitoring system metrics:', error);
  }
}

// Monitor endpoint health
export async function monitorEndpointHealth(): Promise<void> {
  try {
    console.log('Monitoring endpoint health...');

    const endpoints = [
      { url: '/api/health', name: 'Health Check' },
      { url: '/api/summaries', name: 'Summaries API' },
      { url: '/api/upload', name: 'Upload API' },
      { url: '/api/slack/status', name: 'Slack API' }
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}${endpoint.url}`, {
          method: 'GET',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        if (!response.ok) {
          await sendAlert({
            id: `endpoint-error-${endpoint.name}-${Date.now()}`,
            type: AlertType.CUSTOM,
            severity: AlertSeverity.CRITICAL,
            title: `Endpoint Error: ${endpoint.name}`,
            message: `${endpoint.url} returned ${response.status} ${response.statusText}`,
            timestamp: new Date(),
            value: response.status,
            threshold: 200,
            unit: '',
            environment: process.env.NODE_ENV || 'development',
            metadata: { endpoint: endpoint.url, responseTime }
          });
        } else if (responseTime > ALERT_CONFIG.thresholds.responseTime) {
          await sendAlert({
            id: `endpoint-slow-${endpoint.name}-${Date.now()}`,
            type: AlertType.RESPONSE_TIME,
            severity: AlertSeverity.WARNING,
            title: `Slow Endpoint: ${endpoint.name}`,
            message: `${endpoint.url} took ${responseTime}ms to respond`,
            timestamp: new Date(),
            value: responseTime,
            threshold: ALERT_CONFIG.thresholds.responseTime,
            unit: 'ms',
            environment: process.env.NODE_ENV || 'development',
            metadata: { endpoint: endpoint.url }
          });
        }
      } catch (error) {
        await sendAlert({
          id: `endpoint-timeout-${endpoint.name}-${Date.now()}`,
          type: AlertType.CUSTOM,
          severity: AlertSeverity.CRITICAL,
          title: `Endpoint Timeout: ${endpoint.name}`,
          message: `${endpoint.url} failed to respond: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          value: 0,
          threshold: 1,
          unit: '',
          environment: process.env.NODE_ENV || 'development',
          metadata: { endpoint: endpoint.url, error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    console.log('Endpoint health monitoring completed');
  } catch (error) {
    console.error('Error monitoring endpoint health:', error);
  }
}

// Convenience functions
export const automatedAlerts = {
  // Send alerts
  send: (alert: AlertData) => sendAlert(alert),
  
  // Monitoring functions
  monitorSystem: () => monitorSystemMetrics(),
  monitorEndpoints: () => monitorEndpointHealth(),
  
  // Alert management
  getActive: () => AlertManager.getInstance().getActiveAlerts(),
  resolve: (alertKey: string) => AlertManager.getInstance().resolveAlert(alertKey)
};
