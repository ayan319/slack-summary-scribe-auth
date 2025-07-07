# 🧪 Authentication Testing Guide

## 🚀 Application Status
- **Running on:** http://localhost:3003
- **Environment:** Development
- **Database:** Supabase (holuppwejzcqwrbdbgkf)

## ⚠️ BEFORE TESTING - COMPLETE SETUP

### **1. Apply Database Schema**
```sql
-- Go to: https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf/sql
-- Copy/paste entire SUPABASE_SCHEMA_SETUP.sql content
-- Click "Run"
```

### **2. Enable OAuth Providers**
```
Go to: https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf/auth/providers

Google OAuth:
- Toggle ON
- Client ID: 1077831703035-as3ec4pctdba8kpc53kt8o9qegde3a0c.apps.googleusercontent.com
- Client Secret: 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
- Redirect URL: http://localhost:3003/api/auth/callback

GitHub OAuth:
- Toggle ON
- Client ID: Ov23lidzaWghmyRsJMDF
- Client Secret: 46daecd82fd3d66de6744e355f0481bfd0d24ddc
- Redirect URL: http://localhost:3003/api/auth/callback
```

## 🧪 TEST SCENARIOS

### **Test 1: Landing Page Access**
1. Open: http://localhost:3003
2. **Expected Results:**
   - ✅ Page loads without errors
   - ✅ No forced redirect to /login
   - ✅ "Get Started" button visible
   - ✅ Clean browser console (no errors)

### **Test 2: Email/Password Authentication**
1. Go to: http://localhost:3003/login
2. Try signing up with email/password
3. **Expected Results:**
   - ✅ Signup form works
   - ✅ No console errors
   - ✅ Redirects to dashboard after signup
   - ✅ User can logout and login again

### **Test 3: Google OAuth**
1. Go to: http://localhost:3003/login
2. Click "Continue with Google"
3. **Expected Results:**
   - ✅ NO "provider is not enabled" error
   - ✅ Redirects to Google OAuth
   - ✅ After authorization, returns to dashboard
   - ✅ User profile created in database

### **Test 4: GitHub OAuth**
1. Go to: http://localhost:3003/login
2. Click "Continue with GitHub"
3. **Expected Results:**
   - ✅ NO "provider is not enabled" error
   - ✅ Redirects to GitHub OAuth
   - ✅ After authorization, returns to dashboard
   - ✅ User profile created in database

### **Test 5: Dashboard Protection**
1. Open: http://localhost:3003/dashboard (without login)
2. **Expected Results:**
   - ✅ Redirects to /login
   - ✅ After login, redirects back to dashboard
   - ✅ Dashboard loads with user data

### **Test 6: Console Validation**
1. Open browser dev tools (F12)
2. Navigate through the app
3. **Expected Results:**
   - ✅ NO "Could not find a relationship" errors
   - ✅ NO "provider is not enabled" errors
   - ✅ NO forced redirects from landing page
   - ✅ Clean console during auth flows

## 🔍 DEBUGGING CHECKLIST

### **If OAuth shows "provider is not enabled":**
- [ ] Check Supabase Dashboard → Auth → Providers
- [ ] Ensure Google and GitHub are toggled ON
- [ ] Verify Client ID and Secret are correct
- [ ] Check redirect URL matches: http://localhost:3003/api/auth/callback

### **If "relationship not found" errors:**
- [ ] Apply database schema in Supabase SQL Editor
- [ ] Verify tables exist: organizations, user_organizations, users
- [ ] Check foreign key relationships are created

### **If dashboard doesn't load:**
- [ ] Check auth callback page exists
- [ ] Verify session handling in AuthGuard
- [ ] Check middleware configuration

## 📊 SUCCESS METRICS

**All tests should pass with:**
- ✅ 0 console errors
- ✅ 0 "provider not enabled" messages
- ✅ 0 "relationship not found" errors
- ✅ Successful auth flows for all methods
- ✅ Proper session management
- ✅ Dashboard access after login

## 🎯 PRODUCTION READINESS

When all tests pass:
- ✅ Authentication system is fully functional
- ✅ Database relationships are working
- ✅ OAuth providers are properly configured
- ✅ Session management is working
- ✅ Route protection is active
- ✅ Ready for production deployment

## 🚨 COMMON ISSUES & SOLUTIONS

**Issue:** "provider is not enabled"
**Solution:** Complete OAuth setup in Supabase Dashboard

**Issue:** "relationship not found"
**Solution:** Apply database schema in SQL Editor

**Issue:** Infinite redirect loops
**Solution:** Clear browser cookies and restart

**Issue:** Dashboard blank after login
**Solution:** Check auth callback and user creation

## 📝 TEST RESULTS LOG

```
[ ] Landing page loads correctly
[ ] Email/password signup works
[ ] Email/password login works
[ ] Google OAuth works (no errors)
[ ] GitHub OAuth works (no errors)
[ ] Dashboard loads after auth
[ ] Console is clean (no errors)
[ ] Session persists on refresh
[ ] Logout works correctly
[ ] Route protection works
```

**Overall Status:** ⚠️ Pending manual setup completion
