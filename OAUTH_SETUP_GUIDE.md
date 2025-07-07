# 🔐 OAuth Configuration Guide - PRODUCTION FIX

## ⚠️ CRITICAL: Complete These Steps to Fix OAuth Issues

### **Step 1: Apply Database Schema First**

1. **Go to Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf/sql
   ```

2. **Copy and paste the ENTIRE content from:**
   ```
   SUPABASE_SCHEMA_SETUP.sql
   ```

3. **Click "Run" to execute the SQL**

### **Step 2: Configure OAuth in Supabase Dashboard**

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf/auth/providers
   ```

2. **Enable Google OAuth:**
   - Toggle ON "Google"
   - Client ID: `1077831703035-as3ec4pctdba8kpc53kt8o9qegde3a0c.apps.googleusercontent.com`
   - Client Secret: `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`
   - Redirect URL: `http://localhost:3002/api/auth/callback`

3. **Enable GitHub OAuth:**
   - Toggle ON "GitHub"
   - Client ID: `Ov23lidzaWghmyRsJMDF`
   - Client Secret: `46daecd82fd3d66de6744e355f0481bfd0d24ddc`
   - Redirect URL: `http://localhost:3002/api/auth/callback`

### **Step 2: Apply Database Schema**

1. **Go to Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf/sql
   ```

2. **Copy and paste the entire content from:**
   ```
   SUPABASE_SCHEMA_SETUP.sql
   ```

3. **Click "Run" to execute the SQL**

### **Step 3: Test Authentication Flow**

1. **Visit:** `http://localhost:3002`
2. **Click:** "Get Started" → Should redirect to `/login`
3. **Try:** Email/password signup
4. **Try:** Google OAuth login
5. **Try:** GitHub OAuth login
6. **Verify:** Dashboard loads after successful login

## ✅ Success Criteria

When everything is working correctly:

- ✅ Landing page loads without errors
- ✅ Login page shows Google and GitHub buttons
- ✅ OAuth buttons work without "provider not enabled" errors
- ✅ Email/password authentication works
- ✅ Dashboard loads after successful login
- ✅ No console errors about missing relationships
- ✅ User organizations are created automatically
5. Copy the Client ID and Client Secret

### Step 2: Supabase Configuration
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to Authentication → Providers
3. Find "Google" and click to configure
4. Enable the Google provider
5. Add your Google Client ID and Client Secret
6. Set the redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

---

## 2️⃣ GitHub OAuth Setup

### Step 1: GitHub Developer Settings
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: SummaryAI
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-project.supabase.co/auth/v1/callback`
4. Click "Register application"
5. Copy the Client ID and generate a Client Secret

### Step 2: Supabase Configuration
1. Go to your Supabase Dashboard
2. Navigate to Authentication → Providers
3. Find "GitHub" and click to configure
4. Enable the GitHub provider
5. Add your GitHub Client ID and Client Secret
6. Set the redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

---

## 3️⃣ Environment Variables Update

Update your `.env.local` file with the OAuth credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Other services...
```

---

## 4️⃣ Slack OAuth Setup (Optional)

### Step 1: Slack App Configuration
1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new Slack app
3. Configure OAuth & Permissions:
   - Add redirect URLs:
     ```
     http://localhost:3000/api/slack/callback
     https://your-vercel-domain.vercel.app/api/slack/callback
     ```
   - Add required scopes:
     - `channels:read`, `channels:history`
     - `groups:read`, `groups:history`
     - `im:read`, `im:history`
     - `mpim:read`, `mpim:history`
     - `users:read`, `team:read`
4. Get Client ID, Client Secret, and Signing Secret

### Step 2: Environment Variables
```env
# Slack OAuth
NEXT_PUBLIC_SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_SIGNING_SECRET=your-slack-signing-secret
```

---

## 5️⃣ Verification Steps

### Test OAuth Locally
1. Restart your development server: `npm run dev`
2. Go to `http://localhost:3000/login`
3. Click "Continue with Google" - should redirect to Google consent screen
4. Click "Continue with GitHub" - should redirect to GitHub authorization
5. Complete the OAuth flow and verify redirect to `/dashboard`

### Test OAuth in Production
1. Deploy to Vercel with environment variables
2. Update OAuth redirect URIs to include production domain
3. Test the same flow on your live site

---

## 🔧 Troubleshooting

### Common Issues:

1. **"Unsupported provider" error**
   - Ensure the provider is enabled in Supabase Dashboard
   - Check that Client ID and Secret are correctly set

2. **"Invalid redirect URI" error**
   - Verify redirect URIs match exactly in OAuth provider settings
   - Ensure Supabase redirect URL is correct

3. **"Client ID not found" error**
   - Double-check environment variables are loaded
   - Restart development server after updating `.env.local`

4. **OAuth consent screen issues**
   - Ensure OAuth consent screen is configured in Google Cloud Console
   - Add test users if app is in testing mode

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are loaded: `console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)`
3. Check Supabase logs in Dashboard → Logs
4. Verify OAuth provider status in Supabase Dashboard

---

## 📋 Checklist

- [ ] Google OAuth enabled in Supabase
- [ ] GitHub OAuth enabled in Supabase  
- [ ] Environment variables updated
- [ ] Development server restarted
- [ ] OAuth flows tested locally
- [ ] Redirect URIs configured correctly
- [ ] Production deployment tested

---

## 🚀 Next Steps

Once OAuth is working:
1. Test the complete user flow (login → dashboard → features)
2. Verify user creation and organization setup
3. Test on mobile devices
4. Prepare for production deployment

---

**Note**: The redirect URI for Supabase OAuth should always be:
`https://your-project.supabase.co/auth/v1/callback`

This is different from your application's callback route (`/auth/callback`) which handles the post-OAuth logic.
