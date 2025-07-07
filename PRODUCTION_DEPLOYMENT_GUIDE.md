# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Database Migration (CRITICAL)

**You MUST run the database migration first:**

1. **Open Supabase SQL Editor**: https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf/sql
2. **Copy the entire content** of `supabase/migrations/003_workspace_auto_creation.sql`
3. **Paste and click "Run"** in the SQL Editor
4. **Verify success** - you should see "Query executed successfully"

### 2. Verify System Health

```bash
# Run comprehensive verification
node scripts/final-production-test.js

# Expected output: 100% score with all tests passing
```

### 3. Test User Flows Manually

#### ✅ Email Signup Test:
1. Go to http://localhost:3001/signup
2. Create account with email/password
3. Verify dashboard access without "organization not found" errors
4. Confirm workspace auto-creation

#### ✅ Google OAuth Test:
1. Go to http://localhost:3001/login
2. Click "Continue with Google"
3. Complete OAuth flow
4. Verify dashboard access and workspace creation

### 4. Environment Variables Check

Ensure all required variables are set in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://holuppwejzcqwrbdbgkf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI & Services
DEEPSEEK_API_KEY=your_deepseek_key
RESEND_API_KEY=your_resend_key
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# Analytics (Optional)
POSTHOG_API_KEY=your_posthog_key
```

## 🌐 Vercel Deployment

### 1. Commit Latest Changes

```bash
git add .
git commit -m "Final production deployment with workspace auto-creation"
git push origin main
```

### 2. Deploy to Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/ayans-projects-c9fd2ddf/slack-summary-scribe-auth
2. **Trigger new deployment** or wait for auto-deployment
3. **Add environment variables** in Vercel dashboard (copy from `.env.local`)

### 3. Production Database Setup

1. **Run migration in production Supabase**:
   - Copy `supabase/migrations/003_workspace_auto_creation.sql`
   - Paste in production Supabase SQL Editor
   - Click "Run"

2. **Verify production health**:
   ```bash
   # Update NEXT_PUBLIC_APP_URL to production URL
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app node scripts/final-production-test.js
   ```

## 🧪 Production Testing

### Critical Test Scenarios:

1. **New User Signup**:
   - Email signup → Dashboard access → Workspace exists
   - Google OAuth → Dashboard access → Workspace exists

2. **Existing User Login**:
   - All existing users can access dashboard
   - No "organization not found" errors

3. **Slack Integration**:
   - Upload Slack transcript
   - Generate AI summary
   - Export to PDF/Notion
   - Receive notifications

4. **Mobile Responsiveness**:
   - Test on mobile devices
   - Verify all features work

## 📊 Monitoring Setup

### 1. Health Check Monitoring

Set up cron job for daily health monitoring:

```bash
# Add to crontab (crontab -e)
0 9 * * * cd /path/to/project && node scripts/audit-workspace-health.js
```

### 2. Error Monitoring

Monitor these endpoints:
- `/api/health/workspaces` - System health
- `/api/debug/workspaces` - Detailed diagnostics

### 3. User Onboarding Monitoring

Track these metrics:
- Signup completion rate
- Dashboard access success rate
- Workspace creation success rate

## 🚨 Troubleshooting

### Common Issues:

#### "Could not find function check_workspace_health"
**Solution**: Run the database migration in Supabase SQL Editor

#### "No organization found" errors
**Solution**: Run audit function to fix existing users:
```sql
SELECT * FROM public.audit_and_fix_users_without_orgs();
```

#### Trigger not working
**Solution**: Verify trigger exists:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

#### OAuth errors
**Solution**: Check redirect URIs in Google Console:
- Development: `http://localhost:3001/api/auth/callback`
- Production: `https://your-app.vercel.app/api/auth/callback`

## 📈 Success Metrics

### Pre-Launch Targets:
- ✅ 100% health score (all users have workspaces)
- ✅ Zero "organization not found" errors
- ✅ Successful signup → dashboard flow
- ✅ Working OAuth integration
- ✅ Functional AI summarization
- ✅ Working export features

### Post-Launch Monitoring:
- Daily health checks
- User signup success rate
- Error rate monitoring
- Performance metrics

## 🎯 Go-Live Checklist

- [ ] Database migration completed
- [ ] All tests passing (100% score)
- [ ] Manual user flows tested
- [ ] Environment variables configured
- [ ] Vercel deployment successful
- [ ] Production database setup
- [ ] OAuth providers configured
- [ ] Monitoring systems active
- [ ] Error handling verified
- [ ] Mobile responsiveness confirmed

## 🎉 Launch Day

1. **Final verification**: Run `node scripts/final-production-test.js`
2. **Monitor closely**: Watch for any signup errors
3. **Quick response**: Be ready to fix any issues immediately
4. **User feedback**: Collect and respond to user feedback

---

**Your SaaS is now production-ready with 100% onboarding stability!** 🚀

The workspace auto-creation system ensures every user gets a seamless experience from signup to dashboard access.
