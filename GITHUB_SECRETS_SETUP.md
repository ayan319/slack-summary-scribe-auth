# 🔐 GitHub Secrets & Variables Setup Guide

This guide helps you configure all required secrets and variables for the GitHub Actions workflow to run successfully.

## 📍 Where to Add Secrets & Variables

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Use the **Secrets** tab for sensitive data (API keys, tokens)
4. Use the **Variables** tab for non-sensitive configuration

---

## 🔑 Required Secrets

### **Database & Backend Services**
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
DEEPSEEK_API_KEY
```

### **Integrations**
```
NOTION_API_TOKEN
NOTION_DATABASE_ID
```

### **Deployment**
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### **Optional Notifications & Monitoring**
```
SLACK_WEBHOOK_URL          # Optional: For deployment notifications
SENTRY_AUTH_TOKEN          # Optional: For error tracking
SENTRY_ORG                 # Optional: Your Sentry organization
SENTRY_PROJECT             # Optional: Your Sentry project name
```

---

## 📊 Required Variables

### **Public Configuration**
```
NEXT_PUBLIC_APP_URL        # Your production URL (e.g., https://summaryai.com)
```

---

## 🛠️ How to Get Each Secret/Variable

### **Supabase**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role secret key

### **DeepSeek**
1. Go to [DeepSeek Platform](https://platform.deepseek.com/)
2. Create an account and navigate to API Keys
3. Create a new API key
4. Copy as `DEEPSEEK_API_KEY`

### **Notion** (Optional)
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the Internal Integration Token as `NOTION_API_TOKEN`
4. Create a database and copy its ID as `NOTION_DATABASE_ID`

### **Vercel**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to **Settings** → **Tokens**
3. Create a new token and copy as `VERCEL_TOKEN`
4. For ORG_ID and PROJECT_ID:
   - Install Vercel CLI: `npm i -g vercel`
   - Run `vercel link` in your project
   - Check `.vercel/project.json` for the IDs

### **Slack** (Optional)
1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app
3. Go to **Incoming Webhooks**
4. Create a webhook URL and copy as `SLACK_WEBHOOK_URL`

### **Sentry** (Optional)
1. Go to [Sentry](https://sentry.io/)
2. Go to **Settings** → **Auth Tokens**
3. Create a token with `project:releases` scope
4. Copy as `SENTRY_AUTH_TOKEN`

---

## ✅ Verification Checklist

- [ ] All required secrets are added to GitHub
- [ ] `NEXT_PUBLIC_APP_URL` variable is set
- [ ] Vercel project is linked and deployed
- [ ] Supabase project is configured
- [ ] DeepSeek API key has sufficient credits
- [ ] Optional services (Slack, Sentry) are configured if desired

---

## 🚨 Security Notes

- Never commit secrets to your repository
- Use environment-specific secrets for staging/production
- Regularly rotate API keys and tokens
- Monitor usage of API keys to detect unauthorized access

---

## 🔧 Testing the Workflow

After setting up all secrets:

1. Push to a feature branch to test the workflow
2. Check the **Actions** tab for any errors
3. Verify that all steps complete successfully
4. Test a deployment to the main branch

---

## 📞 Need Help?

If you encounter issues:
1. Check the GitHub Actions logs for specific error messages
2. Verify all secrets are correctly named (case-sensitive)
3. Ensure API keys have the necessary permissions
4. Test individual services outside of GitHub Actions first
