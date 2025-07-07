# 🚀 Vercel Deployment Guide - Slack Summarizer SaaS

## ✅ Pre-Deployment Checklist

### 1. Build Status
- ✅ **Production Build**: Successful (37 pages, 29 API endpoints)
- ✅ **Environment Variables**: All configured with production keys
- ✅ **Sentry Integration**: Source maps uploading successfully
- ✅ **DeepSeek R1 + OpenRouter**: Fully functional with fallback
- ✅ **Supabase**: Database and auth configured

### 2. Environment Variables for Vercel
Copy these to your Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENROUTER_API_KEY=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
NEXT_PUBLIC_SENTRY_DSN=https://57a22b6f1aa80a9dd2236bdfe7f13b49@o4509565369122816.ingest.us.sentry.io/4509565394419712
JWT_SECRET=SlackSummaryScribe2024_SecureJWT_ProductionKey_a4BMTkjFvtANy4EHk6Bo4rTvJrOUqFAGu5BQwJEfYxA
RESEND_API_KEY=re_CFojG8Ne_4JKVu1Memmai8Ti4bVDWNQFn
EMAIL_FROM="Slack Summary Scribe <noreply@your-domain.com>"
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Production ready: Complete deployment with all integrations"
git push origin main
```

### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### Step 3: Configure Environment Variables
1. In Vercel dashboard, go to Settings → Environment Variables
2. Add all variables from the list above
3. Set them for Production, Preview, and Development

### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete (~3-5 minutes)
3. Your app will be live at `https://your-project.vercel.app`

## 🔍 Post-Deployment Verification

### Critical Endpoints to Test
1. **Landing Page**: `https://your-domain.vercel.app/`
2. **Health Check**: `https://your-domain.vercel.app/api/healthcheck`
3. **Sentry Test**: `https://your-domain.vercel.app/api/test-sentry?error=true`
4. **Login Flow**: `https://your-domain.vercel.app/login`

### Integration Tests
1. **Google OAuth**: Test login with Google
2. **File Upload**: Upload a document and test AI summarization
3. **Slack Integration**: Connect Slack workspace and test summarization
4. **Error Tracking**: Check Sentry dashboard for captured errors

## 🛠 Troubleshooting

### Common Issues
1. **Environment Variables**: Ensure all are set in Vercel dashboard
2. **Supabase URLs**: Update redirect URLs to include your Vercel domain
3. **Sentry Project**: Configure Sentry project settings if source maps fail

### Vercel Build Logs
- Check Functions tab for any API route errors
- Monitor Real-time logs for runtime issues
- Use Vercel Analytics for performance monitoring

## 📊 Monitoring Setup

### Sentry Alerts
1. Go to Sentry dashboard
2. Set up alerts for:
   - Error rate > 5%
   - Performance issues
   - Failed API calls

### Vercel Analytics
1. Enable Vercel Analytics in dashboard
2. Monitor page load times
3. Track user engagement

## 🎯 Success Metrics

Your deployment is successful when:
- ✅ Landing page loads without errors
- ✅ Health check returns 200 OK
- ✅ Google OAuth login works
- ✅ File upload and AI summarization functional
- ✅ Sentry captures test errors
- ✅ All API endpoints respond correctly

## 🔄 Continuous Deployment

Future updates:
1. Push to `main` branch
2. Vercel automatically deploys
3. Run post-deployment tests
4. Monitor Sentry for new issues

## 📞 Support

If you encounter issues:
1. Check Vercel build logs
2. Verify environment variables
3. Test locally first with `npm run build && npm start`
4. Check Sentry for error details
