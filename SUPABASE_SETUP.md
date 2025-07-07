# 🚀 Supabase Authentication Setup Guide

## 📋 Complete Setup Checklist

### 1️⃣ **OAuth Providers Configuration**

**🚨 CRITICAL STEP**: You MUST configure these in Supabase Dashboard to fix OAuth errors!

#### **Access Supabase Dashboard:**
1. Go to: `https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf`
2. Navigate to **Authentication → Providers**

#### **Google OAuth Setup:**
1. Find **Google** and click **Enable**
2. Add your credentials:
   ```
   Client ID: 1077831703035-as3ec4pctdba8kpc53kt8o9qegde3a0c.apps.googleusercontent.com
   Client Secret: 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
   ```
3. Set **Redirect URL** to:
   ```
   http://localhost:3001/api/auth/callback
   ```
4. Click **Save**

#### **GitHub OAuth Setup:**
1. Find **GitHub** and click **Enable**
2. Add your credentials:
   ```
   Client ID: Ov23lidzaWghmyRsJMDF
   Client Secret: 46daecd82fd3d66de6744e355f0481bfd0d24ddc
   ```
3. Set **Redirect URL** to:
   ```
   http://localhost:3001/api/auth/callback
   ```
4. Click **Save**

### 2️⃣ **Email Authentication Configuration**

#### **Enable Email Authentication:**
1. Go to **Authentication → Settings**
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure the following settings:

#### **For Development (Disable Email Confirmation):**
```
✅ Enable email signup
✅ Enable email login
❌ Confirm email (DISABLE for development)
✅ Enable email change
✅ Enable password recovery
```

#### **For Production (Enable Email Confirmation):**
```
✅ Enable email signup
✅ Enable email login
✅ Confirm email (ENABLE for production)
✅ Enable email change
✅ Enable password recovery
```

### 3️⃣ **Site URL Configuration**

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to:
   ```
   Development: http://localhost:3001
   Production: https://your-domain.com
   ```
3. Add **Redirect URLs**:
   ```
   http://localhost:3001/auth/callback
   http://localhost:3001/api/auth/callback
   https://your-domain.com/auth/callback (for production)
   https://your-domain.com/api/auth/callback (for production)
   ```

### 4️⃣ **Email Templates (Optional)**

1. Go to **Authentication → Email Templates**
2. Customize the email templates if needed:
   - **Confirm signup**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

## 🔧 Environment Variables Verification

Ensure your `.env.local` has these exact values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://holuppwejzcqwrbdbgkf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvbHVwcHdlanpjcXdyYmRiZ2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDQwMDQsImV4cCI6MjA2NDYyMDAwNH0.3BGIddubCa_P3fO2MJDu12j1kASJnrDrhKD92jCqR-Q
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvbHVwcHdlanpjcXdyYmRiZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA0NDAwNCwiZXhwIjoyMDY0NjIwMDA0fQ.gYzurAl5uvH6g6J0DdwT-ib2DVf2byyBhsaZ-3z7mYw

# Google OAuth
GOOGLE_CLIENT_ID=1077831703035-as3ec4pctdba8kpc53kt8o9qegde3a0c.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# GitHub OAuth
GITHUB_CLIENT_ID=Ov23lidzaWghmyRsJMDF
GITHUB_CLIENT_SECRET=46daecd82fd3d66de6744e355f0481bfd0d24ddc

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## ✅ Testing Checklist

After configuration, test these flows:

1. **Google OAuth**: Click "Continue with Google" → Should redirect and sign in
2. **GitHub OAuth**: Click "Continue with GitHub" → Should redirect and sign in  
3. **Email Signup**: Create account with email/password → Should work without confirmation (dev mode)
4. **Email Login**: Sign in with email/password → Should work immediately
5. **Error Handling**: Try invalid credentials → Should show clear error messages
6. **Resend Verification**: If confirmation enabled → Should offer resend option

## 🚨 Common Issues & Solutions

**"Unsupported provider: provider is not enabled"**
- ✅ Enable the provider in Supabase Dashboard
- ✅ Add correct Client ID/Secret
- ✅ Set proper redirect URLs

**"Email not confirmed"**
- ✅ Disable email confirmation for development
- ✅ Or use the resend verification feature
- ✅ Check spam folder for confirmation emails

**"Invalid login credentials"**
- ✅ Verify email/password are correct
- ✅ Ensure user account exists
- ✅ Check if email confirmation is required

## 🎯 Quick Fix Commands

Restart your development server after making changes:
```bash
npm run dev
```

Clear browser cache and cookies if authentication seems stuck.
