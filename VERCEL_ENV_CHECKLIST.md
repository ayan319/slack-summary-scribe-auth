# 🔑 VERCEL ENVIRONMENT VARIABLES CHECKLIST

## 📋 **REQUIRED ENVIRONMENT VARIABLES**

Copy and paste these into Vercel Dashboard → Project Settings → Environment Variables:

### **🔐 CORE AUTHENTICATION (REQUIRED)**
```
NEXT_PUBLIC_SUPABASE_URL=https://holuppwejzcqwrbdbgkf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvbHVwcHdlampjcXdyYmRiZ2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3NzE5NzQsImV4cCI6MjA1MjM0Nzk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvbHVwcHdlampjcXdyYmRiZ2tmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjc3MTk3NCwiZXhwIjoyMDUyMzQ3OTc0fQ.SERVICE_ROLE_KEY_HERE
```

### **🔒 SECURITY & JWT**
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
NEXTAUTH_SECRET=your-nextauth-secret-key-for-production
NEXTAUTH_URL=https://your-vercel-domain.vercel.app
```

### **📧 EMAIL SERVICES (RESEND)**
```
RESEND_API_KEY=re_CFojG8Ne_4JKVu1Memmai8Ti4bVDWNQFn
EMAIL_FROM=noreply@summaryai.com
SUPPORT_EMAIL=saas.customer.suport01@gmail.com
```

### **🤖 AI SERVICES (DEEPSEEK/OPENROUTER)**
```
DEEPSEEK_API_KEY=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
OPENROUTER_API_KEY=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
```

### **🔗 SLACK INTEGRATION**
```
NEXT_PUBLIC_SLACK_CLIENT_ID=8996307659333.8996321533445
SLACK_CLIENT_SECRET=9ebbe3313ae29fb10d31dbb742fed179
SLACK_SIGNING_SECRET=8bd4591adb4c6e25e497eb51ee1acd88
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/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
```

### **🔍 MONITORING & ANALYTICS**
```
SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project
SENTRY_AUTH_TOKEN=your_sentry_auth_token
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

### **💳 PAYMENT PROCESSING (CASHFREE)**
```
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENVIRONMENT=production
```

### **🌐 APP CONFIGURATION**
```
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Slack Summary Scribe
NEXT_PUBLIC_APP_DESCRIPTION=AI-powered Slack conversation summarization
```

## 🔄 **OAUTH PROVIDERS (OPTIONAL)**

### **Google OAuth**
```
GOOGLE_CLIENT_ID=1077831703035-as3ec4pctdba8kpc53kt8o9qegde3a0c.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### **GitHub OAuth**
```
GITHUB_CLIENT_ID=Ov23lidzaWghmyRsJMDF
GITHUB_CLIENT_SECRET=46daecd82fd3d66de6744e355f0481bfd0d24ddc
```

## ⚙️ **VERCEL-SPECIFIC VARIABLES**
```
VERCEL_TOKEN=wi2zWlTQy8Jj3mzgZjVSBRJQ
VERCEL_ORG_ID=ayans-projects-c9fd2ddf
VERCEL_PROJECT_ID=prj_emwMKf4nvJDpPMBpuKiAHU61LShW
```

## 📝 **ENVIRONMENT SETUP INSTRUCTIONS**

### **1. In Vercel Dashboard:**
1. Go to your project settings
2. Click "Environment Variables"
3. Add each variable with its value
4. Set environment to "Production, Preview, Development"

### **2. Update Domain-Specific Variables:**
After deployment, update these with your actual Vercel domain:
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`

### **3. OAuth Redirect URLs:**
Update OAuth providers with your new domain:
- **Google**: `https://your-domain.vercel.app/api/auth/callback/google`
- **GitHub**: `https://your-domain.vercel.app/api/auth/callback/github`
- **Slack**: `https://your-domain.vercel.app/api/slack/callback`

## ✅ **VERIFICATION CHECKLIST**

After setting environment variables:
- [ ] All required variables added to Vercel
- [ ] Domain-specific URLs updated
- [ ] OAuth redirect URLs configured
- [ ] Test deployment successful
- [ ] Authentication flows working
- [ ] API routes responding
- [ ] Email notifications working
- [ ] AI services responding
- [ ] Analytics tracking active

## 🚨 **SECURITY NOTES**

- ✅ Never commit API keys to Git
- ✅ Use different keys for production vs development
- ✅ Rotate keys regularly
- ✅ Monitor usage and set up alerts
- ✅ Use environment-specific configurations

## 🎯 **QUICK DEPLOYMENT STEPS**

1. **Copy environment variables** from this checklist
2. **Paste into Vercel** project settings
3. **Update domain-specific URLs** after deployment
4. **Configure OAuth redirects** with providers
5. **Test all functionality** after deployment
6. **Monitor logs** for any issues

Your SaaS application will be production-ready once all environment variables are configured! 🚀
