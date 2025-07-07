# 🧪 Testing Checklist - Slack Summary Scribe

## ⚠️ BEFORE TESTING: Complete Setup Steps

1. **Apply Database Schema:**
   - Go to: https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf/sql
   - Copy/paste content from `SUPABASE_SCHEMA_SETUP.sql`
   - Click "Run"

2. **Configure OAuth Providers:**
   - Go to: https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf/auth/providers
   - Enable Google with credentials from `OAUTH_SETUP_GUIDE.md`
   - Enable GitHub with credentials from `OAUTH_SETUP_GUIDE.md`

## 🎯 Core Authentication Tests

### **Test 1: Landing Page Access**
- [ ] Visit: http://localhost:3002
- [ ] Page loads without errors
- [ ] "Get Started" button is visible
- [ ] No authentication required

### **Test 2: Email/Password Signup**
- [ ] Click "Get Started" → redirects to `/login`
- [ ] Click "Sign up" tab
- [ ] Enter: name, email, password
- [ ] Submit form
- [ ] Check for success message
- [ ] Verify email verification prompt

### **Test 3: Email/Password Login**
- [ ] Go to `/login`
- [ ] Enter: email, password
- [ ] Submit form
- [ ] Should redirect to `/auth/callback`
- [ ] Then redirect to `/dashboard`
- [ ] Dashboard loads successfully

### **Test 4: Google OAuth Login**
- [ ] Go to `/login`
- [ ] Click "Continue with Google"
- [ ] Should NOT show "provider not enabled" error
- [ ] Complete Google OAuth flow
- [ ] Should redirect to `/auth/callback`
- [ ] Then redirect to `/dashboard`
- [ ] Dashboard loads successfully

### **Test 5: GitHub OAuth Login**
- [ ] Go to `/login`
- [ ] Click "Continue with GitHub"
- [ ] Should NOT show "provider not enabled" error
- [ ] Complete GitHub OAuth flow
- [ ] Should redirect to `/auth/callback`
- [ ] Then redirect to `/dashboard`
- [ ] Dashboard loads successfully

## 🔍 Database Relationship Tests

### **Test 6: User Organization Creation**
- [ ] After successful login (any method)
- [ ] Check browser console for errors
- [ ] Should NOT see "relationship not found" errors
- [ ] User should have a default organization created
- [ ] Dashboard should display organization info

### **Test 7: Session Persistence**
- [ ] Login successfully
- [ ] Refresh the page
- [ ] Should remain logged in
- [ ] Dashboard should still be accessible

### **Test 8: Logout Functionality**
- [ ] From dashboard, click logout
- [ ] Should redirect to landing page
- [ ] Visiting `/dashboard` should redirect to `/login`

## 🚨 Error Scenarios

### **Test 9: Invalid Credentials**
- [ ] Try login with wrong password
- [ ] Should show error message
- [ ] Should NOT crash the app

### **Test 10: Network Errors**
- [ ] Disconnect internet briefly
- [ ] Try to login
- [ ] Should show appropriate error message

## 📱 Mobile Responsiveness

### **Test 11: Mobile Layout**
- [ ] Open browser dev tools
- [ ] Switch to mobile view (iPhone/Android)
- [ ] Landing page looks good
- [ ] Login page is responsive
- [ ] Dashboard is mobile-friendly

## ✅ Success Criteria

**All tests should pass with:**
- ✅ No console errors
- ✅ No "provider not enabled" errors
- ✅ No "relationship not found" errors
- ✅ Smooth authentication flow
- ✅ Dashboard loads after login
- ✅ Mobile responsive design

## 🐛 Common Issues & Solutions

**Issue:** "provider is not enabled"
**Solution:** Complete OAuth setup in Supabase Dashboard

**Issue:** "relationship not found"
**Solution:** Apply database schema in Supabase SQL Editor

**Issue:** Dashboard doesn't load
**Solution:** Check auth callback route and session handling

**Issue:** Redirect loop
**Solution:** Clear browser cookies and try again

## 📋 Production Readiness

After all tests pass:
- [ ] Update redirect URLs for production domain
- [ ] Configure Vercel environment variables
- [ ] Test production deployment
- [ ] Verify SSL certificates
- [ ] Test with real users

**Estimated Testing Time:** 15-20 minutes
