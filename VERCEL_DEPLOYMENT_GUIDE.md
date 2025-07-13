# 🚀 VERCEL DEPLOYMENT GUIDE

## ✅ STEP 1: PREPARE YOUR REPO FOR DEPLOYMENT
1️⃣ Open your terminal in your project folder.
2️⃣ Run:
```bash
git status
```
to ensure there are no pending changes.
3️⃣ If there are changes:
```bash
git add .
git commit -m "Prepare production deployment to Vercel"
git push origin main
```
✅ Confirm the repository on GitHub is up-to-date.

## 🔗 STEP 2: CONNECT TO VERCEL

1. **Go to Vercel Dashboard**: [vercel.com](https://vercel.com)
2. **Sign in** with your GitHub account
3. **Click "New Project"**
4. **Select your repository**: `slack-summary-scribe-auth`
5. **Click "Import"**

## ⚙️ STEP 3: CONFIGURE PROJECT SETTINGS

- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)

## 🔑 STEP 4: ENVIRONMENT VARIABLES SETUP

### **1. Environment Variables Setup**
Configure these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://holuppwejzcqwrbdbgkf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth
GOOGLE_CLIENT_ID=1077831703035-as3ec4pctdba8kpc53kt8o9qegde3a0c.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# GitHub OAuth
GITHUB_CLIENT_ID=Ov23lidzaWghmyRsJMDF
GITHUB_CLIENT_SECRET=46daecd82fd3d66de6744e355f0481bfd0d24ddc

# Slack OAuth
NEXT_PUBLIC_SLACK_CLIENT_ID=8996307659333.8996321533445
SLACK_CLIENT_SECRET=9ebbe3313ae29fb10d31dbb742fed179
SLACK_SIGNING_SECRET=8bd4591adb4c6e25e497eb51ee1acd88

# DeepSeek AI
DEEPSEEK_API_KEY=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

# Resend Email
RESEND_API_KEY=re_CFojG8Ne_4JKVu1Memmai8Ti4bVDWNQFn
EMAIL_FROM=noreply@summaryai.com
SUPPORT_EMAIL=saas.customer.suport01@gmail.com

# Slack Webhook
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/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

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024

# App URL (UPDATE FOR PRODUCTION)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Vercel
VERCEL_TOKEN=wi2zWlTQy8Jj3mzgZjVSBRJQ
VERCEL_ORG_ID=ayans-projects-c9fd2ddf
VERCEL_PROJECT_ID=prj_emwMKf4nvJDpPMBpuKiAHU61LShW
```

### **2. OAuth Redirect URLs Update**
After deployment, update OAuth providers:

**Google OAuth Console:**
- Add production redirect: `https://your-domain.vercel.app/api/auth/callback`

**GitHub OAuth App:**
- Add production redirect: `https://your-domain.vercel.app/api/auth/callback`

**Supabase Dashboard:**
- Update redirect URLs in Authentication → Providers
- Add both development and production URLs:
  ```
  http://localhost:3001/api/auth/callback
  https://your-domain.vercel.app/api/auth/callback
  ```

### **3. Database Schema Application**
Apply the database schema in Supabase SQL Editor:

1. Go to: `https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf`
2. Navigate to: SQL Editor
3. Copy and paste content from: `supabase/migrations/002_organizations.sql`
4. Execute the SQL to create all tables and RLS policies

## 🚀 Deployment Steps

### **Method 1: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### **Method 2: GitHub Integration**
1. Push code to GitHub repository
2. Connect repository in Vercel Dashboard
3. Configure environment variables
4. Deploy automatically on push

### **Method 3: Vercel Dashboard**
1. Go to Vercel Dashboard
2. Click "New Project"
3. Import from Git repository
4. Configure build settings:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Add environment variables
6. Deploy

## 🧪 Post-Deployment Testing

### **1. Basic Functionality**
- [ ] Landing page loads: `https://your-domain.vercel.app`
- [ ] Login page accessible: `https://your-domain.vercel.app/login`
- [ ] Dashboard redirects when unauthenticated
- [ ] Mobile responsiveness works

### **2. Authentication Flows**
- [ ] Email/password signup works
- [ ] Email/password login works
- [ ] Google OAuth redirects correctly
- [ ] GitHub OAuth redirects correctly
- [ ] User and organization creation works
- [ ] Session persistence works

### **3. Database Integration**
- [ ] User data saves correctly
- [ ] Organizations are created
- [ ] RLS policies work
- [ ] No console errors

## 🔧 Troubleshooting

### **Common Issues:**

**1. OAuth Redirect Mismatch**
```
Error: redirect_uri_mismatch
Solution: Update OAuth provider redirect URLs
```

**2. Environment Variables Missing**
```
Error: Missing Supabase environment variables
Solution: Add all required env vars in Vercel Dashboard
```

**3. Database Connection Issues**
```
Error: relation "organizations" does not exist
Solution: Apply database schema in Supabase SQL Editor
```

**4. CORS Issues**
```
Error: CORS policy blocked
Solution: Check Supabase CORS settings and API routes
```

## 📋 Production Checklist

### **Security:**
- [ ] All environment variables configured
- [ ] JWT secret changed from default
- [ ] HTTPS enforced
- [ ] Security headers configured (via vercel.json)
- [ ] RLS policies enabled

### **Performance:**
- [ ] Static assets cached
- [ ] API routes optimized
- [ ] Database queries efficient
- [ ] Images optimized

### **Monitoring:**
- [ ] Error tracking configured
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] User analytics

## 🎯 Success Criteria

✅ **Deployment Successful When:**
- Landing page loads without errors
- Authentication flows work completely
- Database operations function correctly
- Mobile experience is responsive
- No console errors in production
- OAuth providers work with production URLs

## 📞 Support

If deployment issues occur:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test OAuth redirect URLs
4. Confirm database schema is applied
5. Check Supabase logs for errors

**Estimated Deployment Time:** 15-30 minutes
**Prerequisites:** Supabase OAuth configuration completed
