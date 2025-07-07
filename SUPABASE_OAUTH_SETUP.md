# 🔧 Supabase OAuth Configuration Guide

## 🚨 CRITICAL: Enable OAuth Providers in Supabase Dashboard

### **Step 1: Access Supabase Dashboard**
```
URL: https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf
Navigate to: Authentication → Providers
```

### **Step 2: Enable Google OAuth**
1. Find **Google** in the providers list
2. Click **Enable**
3. Configure with these exact credentials:
   ```
   Client ID: 1077831703035-as3ec4pctdba8kpc53kt8o9qegde3a0c.apps.googleusercontent.com
   Client Secret: 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
   ```
4. Set **Redirect URL** to:
   ```
   http://localhost:3001/api/auth/callback
   ```
5. Click **Save**

### **Step 3: Enable GitHub OAuth**
1. Find **GitHub** in the providers list
2. Click **Enable**
3. Configure with these exact credentials:
   ```
   Client ID: Ov23lidzaWghmyRsJMDF
   Client Secret: 46daecd82fd3d66de6744e355f0481bfd0d24ddc
   ```
4. Set **Redirect URL** to:
   ```
   http://localhost:3001/api/auth/callback
   ```
5. Click **Save**

### **Step 4: Configure Email Settings**
1. Go to **Authentication → Settings**
2. Configure these settings:
   ```
   ✅ Enable email signup
   ✅ Enable email login
   ❌ Disable "Confirm email" (for development)
   ✅ Enable password recovery
   ```

### **Step 5: Verify Configuration**
After saving, you should see:
- ✅ Google OAuth: Enabled
- ✅ GitHub OAuth: Enabled
- ✅ Email/Password: Enabled

## 🔍 Troubleshooting

### **Common Issues:**
1. **"Provider not enabled" error**: OAuth provider not enabled in dashboard
2. **"Invalid redirect URI" error**: Redirect URL mismatch
3. **"Invalid client" error**: Wrong Client ID/Secret

### **Verification Steps:**
1. Check provider status in Supabase Dashboard
2. Verify redirect URL exactly matches: `http://localhost:3001/api/auth/callback`
3. Ensure Client ID/Secret are correctly copied
4. Test OAuth flow after configuration

## ✅ Expected Result
After configuration, OAuth buttons should redirect to Google/GitHub login pages without errors.
