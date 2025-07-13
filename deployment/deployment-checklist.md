# 🚀 Production Deployment Checklist

## Pre-Deployment Validation

### ✅ Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings reviewed (critical errors fixed)
- [ ] Build completes successfully (`npm run build`)
- [ ] No console errors in development
- [ ] All tests passing (`npm test`)

### ✅ Environment Configuration
- [ ] Run environment validation: `node deployment/validate-env.js`
- [ ] All required environment variables configured
- [ ] Secrets properly marked as "secret" type in Vercel
- [ ] HTTPS URLs verified for production
- [ ] Database connections tested

### ✅ Security Review
- [ ] No hardcoded secrets in code
- [ ] API routes have proper authentication
- [ ] CORS settings configured correctly
- [ ] CSP headers implemented
- [ ] Rate limiting in place

---

## Vercel Deployment Steps

### 1️⃣ Repository Preparation
- [ ] **Clean main branch**: Ensure latest code is on main/production branch
- [ ] **Remove dev branches**: Clean up unnecessary feature branches
- [ ] **Final commit**: Commit with message "Production deployment ready"
- [ ] **Push to GitHub**: `git push origin main`

### 2️⃣ Vercel Project Setup
- [ ] **Connect repository**: Link GitHub repo to Vercel project
- [ ] **Configure build settings**:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`
- [ ] **Set Node.js version**: 18.x or 20.x

### 3️⃣ Environment Variables
- [ ] **Add all required variables** (use template from `deployment/vercel-env-template.json`)
- [ ] **Set target environments**: production, preview, development
- [ ] **Mark secrets appropriately**: Use "secret" type for sensitive data
- [ ] **Verify URLs**: Ensure all URLs use HTTPS

### 4️⃣ Deploy & Verify
- [ ] **Trigger deployment**: Push to main or deploy manually
- [ ] **Monitor build logs**: Check for any build errors
- [ ] **Verify build success**: All 52 static pages generated
- [ ] **Check deployment URL**: Confirm app is accessible

---

## Post-Deployment Verification

### 🧪 Smoke Testing
- [ ] **Run smoke tests**: Use `deployment/smoke-test-checklist.md`
- [ ] **Test critical paths**: Authentication, upload, AI processing
- [ ] **Verify integrations**: Supabase, OpenRouter, Slack
- [ ] **Check mobile responsiveness**: Test on different devices
- [ ] **Validate performance**: Page load times under 5 seconds

### 📊 Monitoring Setup
- [ ] **Enable Vercel Analytics**: Monitor traffic and performance
- [ ] **Configure Sentry**: Error tracking and monitoring
- [ ] **Set up health checks**: Monitor `/api/health` endpoint
- [ ] **Database monitoring**: Supabase dashboard alerts
- [ ] **Uptime monitoring**: External service (optional)

---

## Rollback & Recovery Plan

### 🔄 Immediate Rollback (< 5 minutes)
If critical issues are discovered:

1. **Vercel Dashboard Rollback**:
   - Go to Vercel project dashboard
   - Click "Deployments" tab
   - Find last stable deployment
   - Click "..." → "Promote to Production"

2. **DNS/Domain Issues**:
   - Check domain configuration in Vercel
   - Verify DNS settings with domain provider
   - Use Vercel's default `.vercel.app` URL as backup

3. **Environment Variable Issues**:
   - Check Vercel environment variables
   - Redeploy with corrected variables
   - Use preview deployment for testing

### 🛠️ Database Recovery
If database issues occur:

1. **Supabase Backup Restore**:
   - Access Supabase dashboard
   - Go to Database → Backups
   - Restore from latest backup
   - Verify data integrity

2. **Migration Rollback**:
   - Identify problematic migration
   - Run rollback scripts if available
   - Restore from backup if necessary

### 📞 Incident Response
1. **Immediate Actions**:
   - Document the issue and timeline
   - Notify stakeholders if user-facing
   - Implement rollback if necessary
   - Monitor error rates and user reports

2. **Communication**:
   - Update status page (if available)
   - Notify users via email/Slack (if needed)
   - Document resolution steps
   - Post-mortem analysis

---

## Monitoring & Alerts

### 📈 Key Metrics to Monitor
- [ ] **Uptime**: 99.9% target
- [ ] **Response Time**: < 2s for API calls
- [ ] **Error Rate**: < 1% of requests
- [ ] **Build Success**: 100% deployment success
- [ ] **Database Performance**: Query times < 500ms

### 🚨 Alert Configuration
- [ ] **Vercel Alerts**: Build failures, high error rates
- [ ] **Sentry Alerts**: New errors, performance issues
- [ ] **Supabase Alerts**: Database connection issues
- [ ] **Custom Alerts**: Business-critical functionality

### 📊 Dashboard Setup
- [ ] **Vercel Analytics**: Traffic and performance
- [ ] **Sentry Dashboard**: Error tracking and trends
- [ ] **Supabase Dashboard**: Database metrics
- [ ] **Custom Dashboard**: Business metrics (optional)

---

## User Acceptance Testing (UAT)

### 👥 Test User Setup
- [ ] **Create test accounts**: 3-5 test users with different roles
- [ ] **Prepare test data**: Sample documents and Slack workspaces
- [ ] **Test scenarios**: Cover all critical user journeys
- [ ] **Device testing**: Mobile, tablet, desktop
- [ ] **Browser testing**: Chrome, Firefox, Safari, Edge

### 📝 UAT Checklist
- [ ] **User Registration**: New users can sign up successfully
- [ ] **File Upload**: Documents upload and process correctly
- [ ] **AI Summarization**: Summaries generate with good quality
- [ ] **Slack Integration**: OAuth flow works end-to-end
- [ ] **Export Features**: PDF, Notion, Excel exports work
- [ ] **Mobile Experience**: All features work on mobile devices

---

## Go-Live Checklist

### 🎯 Final Validation
- [ ] **All smoke tests passed**
- [ ] **UAT completed successfully**
- [ ] **Monitoring configured and active**
- [ ] **Rollback plan tested and ready**
- [ ] **Team notified and ready for support**

### 📢 Launch Activities
- [ ] **Update documentation**: Ensure all guides are current
- [ ] **Notify stakeholders**: Inform team of successful deployment
- [ ] **Monitor closely**: Watch metrics for first 24 hours
- [ ] **Gather feedback**: Collect user feedback and issues
- [ ] **Plan improvements**: Document lessons learned

---

## Post-Launch Monitoring (First 24 Hours)

### ⏰ Monitoring Schedule
- **First 2 hours**: Check every 15 minutes
- **Next 6 hours**: Check every hour
- **Next 16 hours**: Check every 4 hours
- **Ongoing**: Daily health checks

### 📊 Key Metrics to Watch
- [ ] **Error rates**: Should remain < 1%
- [ ] **Response times**: Should stay < 2s
- [ ] **User registrations**: Track new user signups
- [ ] **Feature usage**: Monitor upload and AI processing
- [ ] **Database performance**: Watch for slow queries

### 🔧 Common Issues & Solutions
- **High error rates**: Check logs, rollback if necessary
- **Slow performance**: Monitor database and API response times
- **User complaints**: Investigate specific issues quickly
- **Integration failures**: Verify third-party service status

---

## ✅ Deployment Sign-off

### Final Checklist
- [ ] **Deployment completed successfully**
- [ ] **All tests passed**
- [ ] **Monitoring active**
- [ ] **Team ready for support**
- [ ] **Documentation updated**

**Deployment Lead**: _________________ **Date**: _________

**Technical Review**: _________________ **Date**: _________

**Business Approval**: _________________ **Date**: _________

---

## 📞 Emergency Contacts

### Technical Team
- **Lead Developer**: [Contact info]
- **DevOps Engineer**: [Contact info]
- **Database Admin**: [Contact info]

### Service Providers
- **Vercel Support**: https://vercel.com/support
- **Supabase Support**: https://supabase.com/support
- **Sentry Support**: https://sentry.io/support

### Escalation Path
1. **Technical Lead** (immediate issues)
2. **Engineering Manager** (persistent issues)
3. **CTO/Technical Director** (critical business impact)
