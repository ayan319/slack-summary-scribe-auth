# 📊 Production Monitoring & Error Tracking Setup

## 🎯 **Monitoring Strategy Overview**

Comprehensive monitoring setup for Slack Summary Scribe SaaS to ensure 99.9% uptime and optimal user experience.

---

## 🚨 **1. Sentry Error Tracking Integration**

### **Setup Instructions**

#### **Step 1: Create Sentry Project**
1. **Go to**: [Sentry.io](https://sentry.io)
2. **Create account** or login
3. **Create new project**: Select "Next.js"
4. **Copy DSN**: Save for environment variables

#### **Step 2: Configure Environment Variables**
Add to Vercel environment variables:
```env
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
SENTRY_AUTH_TOKEN=your-auth-token
```

#### **Step 3: Verify Sentry Integration**
The application already has Sentry configured in:
- `lib/sentry.client.ts` - Client-side error tracking
- `instrumentation.ts` - Server-side instrumentation
- `app/layout.tsx` - Global error boundary

#### **Step 4: Test Error Tracking**
```javascript
// Test client-side error
throw new Error("Test Sentry integration");

// Test server-side error
fetch('/api/test-error');
```

### **Sentry Configuration Features**
- ✅ **Error Tracking**: Automatic error capture
- ✅ **Performance Monitoring**: API response times
- ✅ **Session Replay**: User interaction recording
- ✅ **Release Tracking**: Deploy-based error tracking
- ✅ **User Context**: Error attribution to users

---

## 📈 **2. Vercel Analytics & Monitoring**

### **Enable Vercel Analytics**
1. **Go to**: Vercel project dashboard
2. **Navigate**: Analytics tab
3. **Enable**: Web Analytics
4. **Configure**: Real User Monitoring (RUM)

### **Vercel Monitoring Features**
- ✅ **Traffic Analytics**: Page views, unique visitors
- ✅ **Performance Metrics**: Core Web Vitals
- ✅ **Function Logs**: Serverless function monitoring
- ✅ **Build Analytics**: Deployment performance
- ✅ **Edge Network**: Global performance insights

### **Custom Analytics Events**
```javascript
// Track custom events
import { track } from '@vercel/analytics';

// Track file uploads
track('file_upload', { fileType: 'pdf', fileSize: '2MB' });

// Track AI summarization
track('ai_summary_generated', { model: 'deepseek', duration: '15s' });

// Track user actions
track('slack_connected', { workspaceName: 'Company' });
```

---

## 🗄️ **3. Supabase Monitoring**

### **Database Monitoring**
1. **Go to**: Supabase Dashboard → Reports
2. **Monitor**:
   - Query performance
   - Connection counts
   - Database size
   - API usage

### **Log Monitoring with Logflare**
1. **Enable**: Supabase → Settings → Integrations → Logflare
2. **Configure**: Log retention and alerts
3. **Monitor**:
   - Authentication events
   - Database queries
   - API requests
   - Error rates

### **Supabase Alerts**
```sql
-- Set up database alerts
CREATE OR REPLACE FUNCTION notify_high_error_rate()
RETURNS trigger AS $$
BEGIN
  IF (SELECT COUNT(*) FROM error_logs WHERE created_at > NOW() - INTERVAL '5 minutes') > 10 THEN
    PERFORM pg_notify('high_error_rate', 'Error rate exceeded threshold');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 🔍 **4. Health Check Monitoring**

### **Internal Health Checks**
The application includes comprehensive health checks at `/api/health`:

```javascript
// Health check response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": "healthy",
    "ai": "healthy",
    "storage": "healthy"
  },
  "metrics": {
    "uptime": "99.9%",
    "responseTime": "150ms",
    "errorRate": "0.1%"
  }
}
```

### **External Monitoring Services**

#### **Option 1: UptimeRobot (Free)**
1. **Create account**: [UptimeRobot.com](https://uptimerobot.com)
2. **Add monitor**: HTTP(s) monitor
3. **URL**: `https://your-app.vercel.app/api/health`
4. **Interval**: 5 minutes
5. **Alerts**: Email, SMS, Slack

#### **Option 2: Pingdom**
1. **Create account**: [Pingdom.com](https://pingdom.com)
2. **Add check**: Uptime monitoring
3. **Configure**: Multi-location monitoring
4. **Alerts**: Multiple notification channels

#### **Option 3: Better Uptime**
1. **Create account**: [BetterUptime.com](https://betteruptime.com)
2. **Add monitor**: HTTP monitor
3. **Configure**: Status page
4. **Alerts**: Incident management

---

## 📊 **5. Custom Monitoring Dashboard**

### **Monitoring Metrics to Track**

#### **Application Metrics**
- **Uptime**: 99.9% target
- **Response Time**: < 2s average
- **Error Rate**: < 1% of requests
- **Throughput**: Requests per minute
- **User Sessions**: Active users

#### **Business Metrics**
- **User Registrations**: Daily signups
- **File Uploads**: Upload volume and success rate
- **AI Summaries**: Generation count and quality
- **Slack Connections**: OAuth success rate
- **Feature Usage**: Dashboard, export, etc.

#### **Infrastructure Metrics**
- **Database Performance**: Query times, connections
- **API Performance**: Endpoint response times
- **Storage Usage**: File storage consumption
- **Bandwidth**: Data transfer volumes
- **Function Execution**: Serverless function metrics

### **Dashboard Tools**

#### **Option 1: Grafana + Prometheus**
```yaml
# docker-compose.yml for monitoring stack
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

#### **Option 2: DataDog**
```javascript
// DataDog integration
import { datadogRum } from '@datadog/browser-rum';

datadogRum.init({
  applicationId: 'your-app-id',
  clientToken: 'your-client-token',
  site: 'datadoghq.com',
  service: 'slack-summary-scribe',
  env: 'production',
  version: '1.0.0',
  sessionSampleRate: 100,
  trackInteractions: true,
  trackResources: true,
  trackLongTasks: true,
});
```

---

## 🚨 **6. Alert Configuration**

### **Critical Alerts (Immediate Response)**
- **Service Down**: Health check fails
- **High Error Rate**: > 5% errors in 5 minutes
- **Database Issues**: Connection failures
- **Authentication Failures**: Auth service down
- **Payment Failures**: Billing system issues

### **Warning Alerts (Monitor Closely)**
- **Slow Response**: > 5s response times
- **High Memory Usage**: > 80% memory utilization
- **Disk Space**: > 85% storage used
- **API Rate Limits**: Approaching limits
- **User Experience**: Poor Core Web Vitals

### **Alert Channels**
```javascript
// Slack webhook for alerts
const alertToSlack = async (message, severity) => {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 ${severity}: ${message}`,
      channel: '#alerts',
      username: 'Monitoring Bot'
    })
  });
};

// Email alerts via Resend
const alertToEmail = async (message, severity) => {
  await fetch('/api/send-alert-email', {
    method: 'POST',
    body: JSON.stringify({ message, severity })
  });
};
```

---

## 📱 **7. Mobile App Monitoring**

### **PWA Monitoring**
```javascript
// Service worker monitoring
self.addEventListener('error', (event) => {
  Sentry.captureException(event.error);
});

// Network monitoring
self.addEventListener('fetch', (event) => {
  const startTime = Date.now();
  event.respondWith(
    fetch(event.request).then(response => {
      const duration = Date.now() - startTime;
      // Track API performance
      track('api_request', { 
        url: event.request.url, 
        duration,
        status: response.status 
      });
      return response;
    })
  );
});
```

---

## 🔧 **8. Monitoring Setup Checklist**

### **Pre-Production Setup**
- [ ] **Sentry project** created and configured
- [ ] **Environment variables** added to Vercel
- [ ] **Health check endpoint** tested
- [ ] **Vercel Analytics** enabled
- [ ] **Supabase monitoring** configured

### **Production Monitoring**
- [ ] **Uptime monitoring** service configured
- [ ] **Alert channels** tested (email, Slack)
- [ ] **Dashboard** created for key metrics
- [ ] **Error tracking** validated with test errors
- [ ] **Performance baselines** established

### **Ongoing Monitoring**
- [ ] **Daily health checks** automated
- [ ] **Weekly performance reviews** scheduled
- [ ] **Monthly monitoring reports** generated
- [ ] **Quarterly monitoring strategy** review
- [ ] **Alert fatigue** prevention measures

---

## 📊 **9. Monitoring Scripts**

### **Health Check Script**
```bash
#!/bin/bash
# health-check.sh
URL="https://your-app.vercel.app/api/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed: $RESPONSE"
  # Send alert
  curl -X POST $SLACK_WEBHOOK -d '{"text":"🚨 Health check failed"}'
fi
```

### **Performance Monitoring**
```javascript
// performance-monitor.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runPerformanceTest() {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {logLevel: 'info', output: 'json', port: chrome.port};
  const runnerResult = await lighthouse('https://your-app.vercel.app', options);
  
  const scores = runnerResult.lhr.categories;
  console.log('Performance Score:', scores.performance.score * 100);
  console.log('Accessibility Score:', scores.accessibility.score * 100);
  console.log('Best Practices Score:', scores['best-practices'].score * 100);
  console.log('SEO Score:', scores.seo.score * 100);
  
  await chrome.kill();
}
```

---

## ✅ **Success Metrics**

### **Monitoring KPIs**
- **Uptime**: 99.9% (8.76 hours downtime/year max)
- **Response Time**: 95th percentile < 2 seconds
- **Error Rate**: < 0.5% of all requests
- **MTTR**: Mean Time to Recovery < 15 minutes
- **Alert Accuracy**: < 5% false positives

### **User Experience Metrics**
- **Core Web Vitals**: All "Good" ratings
- **Page Load Time**: < 3 seconds
- **Time to Interactive**: < 5 seconds
- **First Contentful Paint**: < 1.5 seconds
- **Cumulative Layout Shift**: < 0.1

---

## 🚀 **Next Steps**

1. **Configure Sentry** with your project DSN
2. **Enable Vercel Analytics** in dashboard
3. **Set up uptime monitoring** with external service
4. **Configure alert channels** (Slack, email)
5. **Test all monitoring** with simulated failures
6. **Create monitoring dashboard** for key metrics
7. **Document incident response** procedures

**Your monitoring foundation is ready for production! 📊🚨**
