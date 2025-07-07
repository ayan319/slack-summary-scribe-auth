# 🧪 Authentication Testing Guide

## 🚀 Complete Testing Checklist

### ✅ **Step 1: Configure Supabase Dashboard**

**IMPORTANT**: Before testing, you MUST configure Supabase Dashboard:

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf
2. **Navigate to Authentication → Providers**
3. **Enable Google OAuth**:
   - Client ID: `1077831703035-as3ec4pctdba8kpc53kt8o9qegde3a0c.apps.googleusercontent.com`
   - Client Secret: `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`
   - Redirect URL: `http://localhost:3001/api/auth/callback`
4. **Enable GitHub OAuth**:
   - Client ID: `Ov23lidzaWghmyRsJMDF`
   - Client Secret: `46daecd82fd3d66de6744e355f0481bfd0d24ddc`
   - Redirect URL: `http://localhost:3001/api/auth/callback`
5. **Configure Email Settings** (Authentication → Settings):
   - ✅ Enable email signup
   - ✅ Enable email login
   - ❌ **DISABLE** "Confirm email" for development testing
   - ✅ Enable password recovery

### ✅ **Step 2: Test Email/Password Authentication**

#### **Test Sign Up Flow:**
1. Go to: http://localhost:3001/login
2. Click "Don't have an account? Sign up"
3. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Create Account"
5. **Expected Result**: Success message + redirect to dashboard

#### **Test Sign In Flow:**
1. Go to: http://localhost:3001/login
2. Fill in:
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Sign In"
4. **Expected Result**: Success message + redirect to dashboard

#### **Test Error Handling:**
1. Try invalid email format: `invalid-email`
2. Try short password: `123`
3. Try wrong credentials: `wrong@email.com` / `wrongpass`
4. **Expected Result**: Clear error messages for each case

### ✅ **Step 3: Test OAuth Authentication**

#### **Test Google OAuth:**
1. Go to: http://localhost:3001/login
2. Click "Continue with Google"
3. **Expected Result**: 
   - Redirects to Google login
   - After Google auth, redirects back to dashboard
   - **NO MORE "Unsupported provider" error**

#### **Test GitHub OAuth:**
1. Go to: http://localhost:3001/login
2. Click "Continue with GitHub"
3. **Expected Result**: 
   - Redirects to GitHub login
   - After GitHub auth, redirects back to dashboard
   - **NO MORE "Unsupported provider" error**

### ✅ **Step 4: Test Email Verification (If Enabled)**

#### **Test Unconfirmed Email Flow:**
1. Enable "Confirm email" in Supabase Dashboard
2. Sign up with new email
3. Try to sign in before confirming
4. **Expected Result**: 
   - Error message about email confirmation
   - "Resend Verification Email" button appears
   - Click button → success message

### ✅ **Step 5: Test UI/UX Features**

#### **Test Form Validation:**
- Empty fields → validation errors
- Invalid email format → error message
- Short password → error message
- Loading states → spinners and disabled buttons

#### **Test Toggle Functionality:**
- Switch between Sign In/Sign Up → form resets
- Password visibility toggle → works correctly
- Error/success messages → clear and helpful

#### **Test Mobile Responsiveness:**
- Open on mobile/tablet → responsive design
- All buttons clickable → proper touch targets
- Form fields accessible → proper spacing

### ✅ **Step 6: Test Session Management**

#### **Test Authentication Persistence:**
1. Sign in successfully
2. Refresh the page
3. **Expected Result**: Still authenticated, no redirect to login

#### **Test Protected Routes:**
1. Go to: http://localhost:3001/dashboard (while signed out)
2. **Expected Result**: Redirects to login page

#### **Test Sign Out:**
1. Sign in successfully
2. Navigate to dashboard
3. Click sign out (if available)
4. **Expected Result**: Redirects to login, session cleared

### 🚨 **Common Issues & Solutions**

#### **"Unsupported provider: provider is not enabled"**
- ✅ **Solution**: Enable Google/GitHub in Supabase Dashboard
- ✅ **Check**: Correct Client ID/Secret entered
- ✅ **Verify**: Redirect URLs match exactly

#### **"Email not confirmed"**
- ✅ **Solution**: Disable email confirmation in Supabase for development
- ✅ **Alternative**: Use resend verification feature
- ✅ **Check**: Email templates configured correctly

#### **"Invalid login credentials"**
- ✅ **Check**: User account exists in Supabase
- ✅ **Verify**: Password is correct
- ✅ **Ensure**: Email confirmation not blocking login

#### **OAuth Redirect Issues**
- ✅ **Check**: Redirect URLs in Supabase match environment
- ✅ **Verify**: NEXT_PUBLIC_APP_URL is correct
- ✅ **Ensure**: OAuth providers have correct callback URLs

### 🎯 **Success Criteria**

**✅ All tests pass when:**
- Google OAuth works without errors
- GitHub OAuth works without errors  
- Email/password signup works
- Email/password signin works
- Error messages are clear and helpful
- UI is responsive and user-friendly
- Session persistence works correctly
- Protected routes redirect properly

### 📝 **Test Results Log**

**Date**: ___________

**Google OAuth**: ✅ / ❌ - Notes: ________________
**GitHub OAuth**: ✅ / ❌ - Notes: ________________  
**Email Signup**: ✅ / ❌ - Notes: ________________
**Email Signin**: ✅ / ❌ - Notes: ________________
**Error Handling**: ✅ / ❌ - Notes: ________________
**UI/UX**: ✅ / ❌ - Notes: ________________
**Session Management**: ✅ / ❌ - Notes: ________________

**Overall Status**: ✅ READY FOR PRODUCTION / ❌ NEEDS FIXES
