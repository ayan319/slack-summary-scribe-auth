# 🧪 Post-Deployment Smoke Test Checklist

## Pre-Test Setup
- [ ] **Deployment URL**: `https://your-app.vercel.app`
- [ ] **Test Date**: `_____________`
- [ ] **Tester**: `_____________`
- [ ] **Browser**: Chrome / Firefox / Safari / Edge
- [ ] **Device**: Desktop / Mobile / Tablet

---

## 🏠 Landing Page Tests
- [ ] **Landing page loads** (`/`)
  - [ ] Page loads within 3 seconds
  - [ ] No console errors in browser dev tools
  - [ ] All images and icons display correctly
  - [ ] Navigation menu works
  - [ ] "Get Started" button is visible and clickable
  - [ ] Footer links work

- [ ] **Responsive Design**
  - [ ] Mobile view (375px width) displays correctly
  - [ ] Tablet view (768px width) displays correctly
  - [ ] Desktop view (1200px+ width) displays correctly
  - [ ] Navigation collapses to hamburger menu on mobile

---

## 🔐 Authentication Flow
- [ ] **Sign Up Process**
  - [ ] Sign up form loads (`/signup` or modal)
  - [ ] Email validation works
  - [ ] Password requirements enforced
  - [ ] Account creation succeeds
  - [ ] Email verification sent (if enabled)

- [ ] **Sign In Process**
  - [ ] Login form loads (`/login` or modal)
  - [ ] Valid credentials allow login
  - [ ] Invalid credentials show error
  - [ ] "Forgot password" link works (if enabled)
  - [ ] Redirects to dashboard after login

---

## 📊 Dashboard Tests
- [ ] **Dashboard Access** (`/dashboard`)
  - [ ] Dashboard loads for authenticated users
  - [ ] Unauthenticated users redirected to login
  - [ ] Page loads within 5 seconds
  - [ ] No console errors

- [ ] **Dashboard Content**
  - [ ] Welcome message displays user name
  - [ ] Summary cards show data or empty state
  - [ ] Analytics charts render (or show "No data" state)
  - [ ] Navigation sidebar/header works
  - [ ] Dark/light mode toggle works

- [ ] **Interactive Elements**
  - [ ] Notifications dropdown opens
  - [ ] User profile menu works
  - [ ] Settings page accessible
  - [ ] Logout functionality works

---

## 📁 File Upload Tests
- [ ] **Upload Page** (`/upload`)
  - [ ] Upload page loads correctly
  - [ ] Drag-and-drop area visible
  - [ ] File input button works
  - [ ] File type restrictions enforced (PDF, DOCX only)
  - [ ] File size limit enforced (20MB max)

- [ ] **Upload Process**
  - [ ] **Test PDF upload** (< 5MB)
    - [ ] File uploads successfully
    - [ ] Progress indicator shows
    - [ ] Success message displays
    - [ ] File appears in uploads list
  
  - [ ] **Test DOCX upload** (< 5MB)
    - [ ] File uploads successfully
    - [ ] Progress indicator shows
    - [ ] Success message displays
    - [ ] File appears in uploads list

  - [ ] **Error Handling**
    - [ ] Large files (>20MB) rejected with clear error
    - [ ] Invalid file types rejected
    - [ ] Network errors handled gracefully

---

## 🤖 AI Summarization Tests
- [ ] **AI Processing**
  - [ ] Upload triggers AI summarization
  - [ ] Loading state shows during processing
  - [ ] Summary generates within 30 seconds
  - [ ] Summary content is relevant and readable
  - [ ] Summary saves to database
  - [ ] Summary appears in dashboard

- [ ] **AI Features**
  - [ ] Summary rating system works
  - [ ] Tags are generated automatically
  - [ ] Summary can be edited/updated
  - [ ] Summary can be deleted

---

## 🔗 Slack Integration Tests
- [ ] **Slack OAuth** (`/slack/connect`)
  - [ ] Slack connect page loads
  - [ ] "Connect to Slack" button works
  - [ ] Redirects to Slack OAuth
  - [ ] OAuth callback handles success
  - [ ] OAuth callback handles errors
  - [ ] Connected workspace shows in dashboard

- [ ] **Slack Features** (if connected)
  - [ ] Workspace info displays correctly
  - [ ] Channel list loads
  - [ ] Disconnect option works
  - [ ] Slack notifications work (if enabled)

---

## 📤 Export & Download Tests
- [ ] **PDF Export**
  - [ ] Export to PDF button works
  - [ ] PDF generates and downloads
  - [ ] PDF content is formatted correctly
  - [ ] PDF includes all summary data

- [ ] **Notion Export** (if enabled)
  - [ ] Notion export button works
  - [ ] Notion authentication flow works
  - [ ] Export completes successfully
  - [ ] Content appears in Notion

- [ ] **Excel Export** (if enabled)
  - [ ] Excel export button works
  - [ ] Excel file downloads
  - [ ] Data is formatted correctly in spreadsheet

---

## 🎨 UI/UX Tests
- [ ] **Theme Toggle**
  - [ ] Dark mode toggle works
  - [ ] Light mode toggle works
  - [ ] Theme persists across page reloads
  - [ ] All components render correctly in both themes

- [ ] **Accessibility**
  - [ ] Tab navigation works throughout app
  - [ ] Focus indicators visible
  - [ ] Alt text present on images
  - [ ] Color contrast sufficient
  - [ ] Screen reader friendly (basic test)

---

## 📱 Mobile Responsiveness
- [ ] **Mobile Navigation**
  - [ ] Hamburger menu opens/closes
  - [ ] All navigation links work
  - [ ] Touch targets are appropriately sized
  - [ ] Scrolling works smoothly

- [ ] **Mobile Features**
  - [ ] File upload works on mobile
  - [ ] Forms are easy to fill on mobile
  - [ ] Buttons are easily tappable
  - [ ] Text is readable without zooming

---

## ⚡ Performance Tests
- [ ] **Page Load Times**
  - [ ] Landing page loads < 3 seconds
  - [ ] Dashboard loads < 5 seconds
  - [ ] Upload page loads < 3 seconds
  - [ ] No layout shift during loading

- [ ] **Network Tests**
  - [ ] App works on slow 3G connection
  - [ ] Offline behavior is graceful
  - [ ] Images load progressively
  - [ ] API calls have reasonable timeouts

---

## 🔍 Error Handling Tests
- [ ] **Network Errors**
  - [ ] API failures show user-friendly messages
  - [ ] Retry mechanisms work
  - [ ] App doesn't crash on network issues

- [ ] **User Errors**
  - [ ] Form validation messages are clear
  - [ ] Invalid inputs handled gracefully
  - [ ] Error boundaries catch React errors

---

## 🎯 Critical User Flows
- [ ] **Complete User Journey**
  - [ ] New user can sign up
  - [ ] User can upload a file
  - [ ] AI summary generates successfully
  - [ ] User can view summary in dashboard
  - [ ] User can export summary
  - [ ] User can connect Slack (optional)
  - [ ] User can log out and log back in

---

## ✅ Final Validation
- [ ] **All tests passed**
- [ ] **No critical errors found**
- [ ] **Performance is acceptable**
- [ ] **Ready for user acceptance testing**

---

## 📝 Notes & Issues Found
```
Date: ___________
Issues:
1. 
2. 
3. 

Recommendations:
1. 
2. 
3. 
```

---

## 🚀 Sign-off
- [ ] **Smoke tests completed**
- [ ] **Critical issues resolved**
- [ ] **Ready for production users**

**Tester Signature**: _________________ **Date**: _________

---

## 🔗 Quick Links
- **Production URL**: https://your-app.vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Sentry Dashboard**: https://sentry.io (if configured)
