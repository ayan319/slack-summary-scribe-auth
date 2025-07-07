# 🚀 Production Environment Setup Guide

## 📋 Environment Variables Checklist

### Required for Production Deployment

Copy these environment variables to your Vercel dashboard or production environment:

```env
# ===== CORE APPLICATION =====
NEXT_PUBLIC_APP_URL=https://summaryai.com
NODE_ENV=production

# ===== SUPABASE CONFIGURATION =====
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ===== OAUTH PROVIDERS =====
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth  
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Slack OAuth (Optional)
NEXT_PUBLIC_SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_SIGNING_SECRET=your-slack-signing-secret

# ===== AI SERVICES =====
DEEPSEEK_API_KEY=your-deepseek-api-key

# ===== EMAIL SERVICES =====
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@summaryai.com
SUPPORT_EMAIL=support@summaryai.com

# ===== ANALYTICS =====
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
POSTHOG_API_KEY=your-posthog-api-key
POSTHOG_HOST=https://app.posthog.com

# ===== PUSH NOTIFICATIONS =====
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=support@summaryai.com

# ===== SECURITY =====
JWT_SECRET=your-jwt-secret-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://summaryai.com

# ===== OPTIONAL SERVICES =====
# Cashfree Payments (if using)
NEXT_PUBLIC_CASHFREE_APP_ID=your-cashfree-app-id
CASHFREE_SECRET_KEY=your-cashfree-secret-key

# Sentry Error Tracking (if using)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

---

## 🔧 Vercel Deployment Setup

### 1. Connect Repository
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository: `slack-summary-scribe-auth`

### 2. Configure Build Settings
```bash
# Build Command
npm run build

# Output Directory
.next

# Install Command  
npm install

# Development Command
npm run dev
```

### 3. Environment Variables
1. Go to Project Settings → Environment Variables
2. Add all the environment variables listed above
3. Set them for Production, Preview, and Development environments

### 4. Domain Configuration
1. Go to Project Settings → Domains
2. Add your custom domain: `summaryai.com`
3. Configure DNS records as instructed by Vercel

---

## 🗄️ Supabase Production Setup

### 1. Database Configuration
```sql
-- Ensure all migrations are applied
-- Run these in Supabase SQL Editor:

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. Storage Configuration
1. Go to Supabase Dashboard → Storage
2. Ensure `file-uploads` bucket exists
3. Verify storage policies are set correctly

### 3. Authentication Providers
1. Go to Authentication → Providers
2. Enable Google OAuth with production credentials
3. Enable GitHub OAuth with production credentials
4. Set redirect URLs to production domain

---

## 🔐 OAuth Provider Production Setup

### Google OAuth Production
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Update OAuth 2.0 Client:
   - Add production redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - Add authorized domains: `summaryai.com`
3. Configure OAuth consent screen for production
4. Remove test users restriction

### GitHub OAuth Production  
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Update OAuth App:
   - Homepage URL: `https://summaryai.com`
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`

---

## 📧 Email Service Setup

### Resend Production
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Verify your domain: `summaryai.com`
3. Add DNS records for domain verification
4. Generate production API key
5. Set up DMARC, SPF, and DKIM records

### Email Templates
Ensure these email addresses are configured:
- `noreply@summaryai.com` - System emails
- `support@summaryai.com` - Support emails
- `hello@summaryai.com` - Marketing emails

---

## 📊 Analytics Setup

### PostHog Production
1. Go to [PostHog Dashboard](https://app.posthog.com)
2. Create production project
3. Get production API keys
4. Configure event tracking
5. Set up dashboards and insights

---

## 🔔 Push Notifications Setup

### VAPID Keys Generation
```bash
# Generate VAPID keys
npx web-push generate-vapid-keys

# Add to environment variables:
# NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public-key>
# VAPID_PRIVATE_KEY=<private-key>
```

---

## 🛡️ Security Checklist

### Environment Security
- [ ] All API keys are secured and not exposed
- [ ] JWT secrets are strong and unique
- [ ] Database service role key is protected
- [ ] OAuth secrets are not in client code

### Database Security
- [ ] RLS policies are enabled on all tables
- [ ] User data is properly isolated
- [ ] Admin access is restricted
- [ ] Backup strategy is in place

### Application Security
- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] Rate limiting is implemented
- [ ] Input validation is comprehensive

---

## 🚀 Deployment Steps

### Pre-Deployment
1. [ ] All environment variables configured
2. [ ] OAuth providers updated with production URLs
3. [ ] Database migrations applied
4. [ ] Email domain verified
5. [ ] Analytics configured

### Deployment
1. [ ] Push code to main branch
2. [ ] Vercel auto-deploys
3. [ ] Verify deployment success
4. [ ] Test all OAuth flows
5. [ ] Test core functionality

### Post-Deployment
1. [ ] Monitor error rates
2. [ ] Check analytics tracking
3. [ ] Verify email delivery
4. [ ] Test mobile responsiveness
5. [ ] Monitor performance metrics

---

## 🔍 Testing Production

### Critical Tests
```bash
# Test OAuth flows
1. Google OAuth login/signup
2. GitHub OAuth login/signup
3. User dashboard access
4. File upload and summarization
5. Export functionality
6. Support form submission

# Test on multiple devices
1. Desktop browsers (Chrome, Firefox, Safari, Edge)
2. Mobile browsers (iOS Safari, Android Chrome)
3. Different screen sizes
```

### Performance Tests
- [ ] Page load times < 3 seconds
- [ ] API response times < 500ms
- [ ] File upload performance
- [ ] Export generation speed

---

## 📞 Support & Monitoring

### Error Monitoring
- Set up error tracking (Sentry recommended)
- Configure alert notifications
- Monitor API error rates
- Track user feedback

### Performance Monitoring
- Monitor Core Web Vitals
- Track API performance
- Monitor database performance
- Set up uptime monitoring

---

## ✅ Launch Readiness Checklist

- [ ] All environment variables configured
- [ ] OAuth providers working in production
- [ ] Database properly configured
- [ ] Email delivery working
- [ ] Analytics tracking functional
- [ ] Push notifications working
- [ ] Error monitoring active
- [ ] Performance monitoring active
- [ ] Security measures in place
- [ ] Backup strategy implemented

---

**🎉 Ready for Launch!**

Once all items are checked, your SaaS application is ready for public launch at `https://summaryai.com`!
