# Manual Signup Flow Test Guide

## 🎯 Purpose
This guide helps you manually test the complete signup flow in a real browser environment.

## 📋 Prerequisites
1. ✅ Development server running (`npm run dev`)
2. ✅ Supabase database configured
3. ✅ Environment variables set
4. ✅ Database trigger fixed (run `scripts/fix-user-trigger.sql` in Supabase SQL Editor)

## 🧪 Test Steps

### Step 1: Clean Environment
1. Open browser in incognito/private mode
2. Navigate to `http://localhost:3000/signup`
3. Open browser developer tools (F12)
4. Check console for any errors

### Step 2: Test Password Validation
Try these passwords to verify validation:
- ❌ `123` (too short)
- ❌ `password` (no uppercase/numbers)
- ❌ `PASSWORD` (no lowercase/numbers)
- ❌ `Password` (no numbers)
- ✅ `TestPassword123` (should work)

### Step 3: Test Email Validation
Try these emails:
- ❌ `invalid-email` (invalid format)
- ❌ `test@` (incomplete)
- ✅ `your-test-email@gmail.com` (should work)

### Step 4: Complete Signup
1. Fill in the form:
   - **Name**: `Test User`
   - **Email**: `your-test-email@gmail.com`
   - **Password**: `TestPassword123`
   - **Confirm Password**: `TestPassword123`

2. Click "Create Account"

3. Watch the console for logs:
   ```
   🚀 Starting signup process for: your-test-email@gmail.com
   ✅ Signup successful: [object]
   🎉 User signed in immediately
   ```

4. Should see success toast: "Welcome to Slack Summary Scribe!"

5. Should redirect to `/dashboard` after 1 second

### Step 5: Verify Dashboard Access
1. Dashboard should load without infinite redirects
2. Should see user name in header
3. Should see user email in profile section
4. Check console for any errors

### Step 6: Test Profile Creation
1. Open browser developer tools
2. Go to Network tab
3. Look for API calls to `/api/dashboard`
4. Should return user data without errors

### Step 7: Test Sign Out and Sign In
1. Click sign out button
2. Should redirect to home page
3. Navigate to `/login`
4. Sign in with same credentials
5. Should redirect back to dashboard

## 🔍 Expected Results

### ✅ Success Indicators
- [ ] Signup form validates inputs correctly
- [ ] User account created in Supabase Auth
- [ ] User profile created in `public.users` table
- [ ] Immediate redirect to dashboard (no infinite loading)
- [ ] Dashboard displays user information
- [ ] Sign out/sign in cycle works

### ❌ Failure Indicators
- [ ] Infinite loading on dashboard
- [ ] Console errors about missing user
- [ ] 403/401 errors in network tab
- [ ] Profile not found errors
- [ ] Redirect loops

## 🛠️ Troubleshooting

### Issue: Infinite Loading on Dashboard
**Solution**: Check if user profile was created
```sql
-- Run in Supabase SQL Editor
SELECT * FROM public.users WHERE email = 'your-test-email@gmail.com';
```

### Issue: Profile Not Created
**Solution**: Run the trigger fix
```sql
-- Copy and run scripts/fix-user-trigger.sql in Supabase SQL Editor
```

### Issue: 403 Forbidden Errors
**Solution**: Check RLS policies
```sql
-- Verify RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### Issue: Email Confirmation Required
**Solution**: Disable email confirmation in Supabase
1. Go to Supabase Dashboard
2. Authentication > Settings
3. Disable "Enable email confirmations"

## 📊 Test Report Template

```
# Signup Flow Test Report

**Date**: [DATE]
**Tester**: [YOUR NAME]
**Environment**: Development/Production

## Test Results
- [ ] ✅/❌ Password validation
- [ ] ✅/❌ Email validation  
- [ ] ✅/❌ User signup
- [ ] ✅/❌ Profile creation
- [ ] ✅/❌ Dashboard access
- [ ] ✅/❌ Sign out/in cycle

## Issues Found
1. [Describe any issues]
2. [Include console errors]
3. [Note any workarounds]

## Overall Status
- [ ] ✅ Ready for production
- [ ] ⚠️ Minor issues (specify)
- [ ] ❌ Major issues (specify)
```

## 🚀 Production Deployment Checklist

Before deploying to production:
- [ ] All manual tests pass
- [ ] Database trigger is working
- [ ] Email confirmation is configured
- [ ] Error handling is user-friendly
- [ ] Loading states are smooth
- [ ] No console errors in production build

## 📞 Support

If you encounter issues:
1. Check the console logs
2. Verify environment variables
3. Run the database health check: `node scripts/system-health-check.js`
4. Check Supabase dashboard for user creation
5. Review the trigger function in Supabase SQL Editor
