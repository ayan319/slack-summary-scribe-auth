# 🚀 VERCEL STALE DEPLOYMENT FIX GUIDE

## 📋 **CURRENT COMMIT STATUS**
- **Latest Commit Hash**: `9a6f8f6104e04450ad28e25075b0b915a4a815bc`
- **Commit Message**: "Sync latest fixes for Vercel deployment issues - Clean migration script"
- **GitHub Status**: ✅ Successfully pushed to `origin/main`

## 🔧 **STEP-BY-STEP VERCEL CACHE CLEARING**

### **Method 1: Force Redeploy with Cache Clear**

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your project: `slack-summary-scribe-auth`

2. **Access Deployments**
   - Click on "Deployments" tab
   - Find the latest deployment

3. **Force Redeploy with Cache Clear**
   - Click the three dots (⋮) next to the latest deployment
   - Select "Redeploy"
   - ✅ **IMPORTANT**: Check "Clear cache before deploying"
   - Click "Redeploy"

### **Method 2: Disconnect & Reconnect GitHub (If Cache Clear Not Available)**

1. **Disconnect GitHub Integration**
   - Go to Project → Settings → Git
   - Click "Disconnect" next to GitHub repository

2. **Reconnect Repository**
   - Click "Connect Git Repository"
   - Select your GitHub account
   - Choose `slack-summary-scribe-auth` repository
   - Click "Import"

3. **Configure and Deploy**
   - Verify project settings
   - Click "Deploy"

## 🔑 **STEP 3: VERIFY ENVIRONMENT VARIABLES**

### **Required Environment Variables for Vercel**

```bash
# Core Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://holuppwejzcqwrbdbgkf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Authentication & Security
NEXTAUTH_SECRET=your-nextauth-secret-key-for-production
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app

# AI Services
DEEPSEEK_API_KEY=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
OPENROUTER_API_KEY=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

# Email Services
RESEND_API_KEY=re_CFojG8Ne_4JKVu1Memmai8Ti4bVDWNQFn
EMAIL_FROM=noreply@summaryai.com

# Slack Integration
NEXT_PUBLIC_SLACK_CLIENT_ID=8996307659333.8996321533445
SLACK_CLIENT_SECRET=9ebbe3313ae29fb10d31dbb742fed179
SLACK_SIGNING_SECRET=8bd4591adb4c6e25e497eb51ee1acd88

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
```

### **How to Update Environment Variables**

1. **Go to Vercel Project Settings**
   - Project → Settings → Environment Variables

2. **Update Domain-Specific Variables**
   - Replace `your-vercel-domain` with your actual Vercel domain
   - Set for "Production", "Preview", and "Development"

3. **Trigger Redeploy After Changes**
   - Any environment variable change requires a redeploy
   - Use the cache-clear method above

## 🗄️ **STEP 4: RUN SUPABASE MIGRATIONS**

### **Apply RLS Migration for User Upsert Fix**

```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20250113000000_fix_users_upsert_policy.sql

-- Drop existing users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create comprehensive policies for users table that support UPSERT
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a policy that allows UPSERT operations (INSERT + UPDATE)
CREATE POLICY "Users can upsert own profile" ON users
  FOR ALL USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant necessary permissions for authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### **Alternative: Use Supabase CLI (if available)**

```bash
# If you have Supabase CLI configured
supabase db push

# Or using npx
npx supabase db push
```

## 🔗 **STEP 5: UPDATE OAUTH REDIRECT URLS**

### **Update OAuth Providers with New Vercel Domain**

1. **Google OAuth Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services → Credentials
   - Update Authorized redirect URIs:
   ```
   https://your-vercel-domain.vercel.app/api/auth/callback/google
   ```

2. **GitHub OAuth App**
   - Go to GitHub → Settings → Developer settings → OAuth Apps
   - Update Authorization callback URL:
   ```
   https://your-vercel-domain.vercel.app/api/auth/callback/github
   ```

3. **Slack OAuth App**
   - Go to [Slack API](https://api.slack.com/apps)
   - OAuth & Permissions → Redirect URLs:
   ```
   https://your-vercel-domain.vercel.app/api/slack/callback
   ```

4. **Supabase Authentication**
   - Go to Supabase Dashboard → Authentication → Providers
   - Update Site URL and Redirect URLs:
   ```
   https://your-vercel-domain.vercel.app
   ```

## ✅ **STEP 6: DEPLOYMENT VERIFICATION CHECKLIST**

### **After Deployment, Test These Features:**

- [ ] **Landing Page**: Loads correctly without errors
- [ ] **Authentication**: Google/GitHub/Slack login works
- [ ] **Dashboard**: Loads without infinite spinner
- [ ] **User Creation**: No Supabase RLS errors
- [ ] **404 Pages**: Route correctly to not-found page
- [ ] **Console**: No production errors in browser console
- [ ] **Mobile**: Responsive design works on mobile devices
- [ ] **API Routes**: All endpoints respond correctly

### **Verification Commands**

```bash
# Check if commit hash matches in Vercel
curl -s https://your-vercel-domain.vercel.app/api/health | jq

# Test authentication endpoint
curl -s https://your-vercel-domain.vercel.app/api/auth/session

# Verify Supabase connection
curl -s https://your-vercel-domain.vercel.app/api/dashboard
```

## 🚨 **TROUBLESHOOTING STALE DEPLOYMENTS**

### **If Old Project Still Shows:**

1. **Clear Browser Cache**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear browser cache completely

2. **Check Vercel Domain**
   - Ensure you're visiting the correct Vercel domain
   - Check if domain is pointing to the right project

3. **Verify Deployment Status**
   - Confirm deployment shows "Ready" status
   - Check deployment logs for any errors

4. **DNS Propagation** (if using custom domain)
   - DNS changes can take up to 48 hours
   - Use [DNS Checker](https://dnschecker.org/) to verify

### **Emergency: Complete Project Recreation**

If stale cache persists:

1. **Export Environment Variables**
   - Download all environment variables from Vercel

2. **Delete Vercel Project**
   - Project → Settings → Advanced → Delete Project

3. **Create New Project**
   - Import from GitHub again
   - Restore environment variables
   - Deploy fresh

## 📊 **SUCCESS CRITERIA**

- ✅ Latest commit hash `9a6f8f6` visible in Vercel deployment
- ✅ No stale cache issues
- ✅ All authentication flows working
- ✅ Dashboard loads without infinite spinner
- ✅ Clean production console (no errors)
- ✅ Mobile responsiveness maintained

## 📞 **SUPPORT**

If issues persist after following this guide:
1. Check Vercel deployment logs
2. Verify Supabase connection
3. Test authentication flows step by step
4. Monitor browser console for errors

**Your deployment should now be fresh and working perfectly!** 🎉
