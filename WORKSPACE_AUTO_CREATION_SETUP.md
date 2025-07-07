# 🚀 Workspace Auto-Creation Setup Guide

## Overview
This guide ensures 100% onboarding stability by automatically creating workspaces for all users (new and existing) and provides comprehensive monitoring for production launch.

## 🎯 What This System Does

✅ **Auto-creates workspaces** for every new user signup  
✅ **Fixes existing users** without workspaces  
✅ **Prevents "no organization" errors** on dashboard  
✅ **Provides health monitoring** for production  
✅ **Ensures idempotent operations** (safe to run multiple times)  

## 📋 Setup Steps

### 1. Deploy Database Migration

**IMPORTANT: Run this in Supabase SQL Editor (Dashboard > SQL Editor)**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf
2. Navigate to SQL Editor
3. Copy and paste the ENTIRE content of `supabase/migrations/003_workspace_auto_creation.sql`
4. Click "Run" to execute

This migration will:
- Create the `handle_new_user_signup()` function
- Set up the `on_auth_user_created` trigger
- Add audit and health check functions
- Fix all existing users without workspaces
- Add performance indexes

**Expected Output:**
You should see results showing users that were fixed and a health report.

### 2. Verify Migration Success

After running the migration, check the output for:

```sql
-- You should see results like:
user_id                              | user_email           | action_taken              | org_id
-------------------------------------|---------------------|---------------------------|--------
550e8400-e29b-41d4-a716-446655440000 | user@example.com    | Created default workspace | abc123...

-- Health check should show:
total_users | users_with_orgs | users_without_orgs | orphaned_orgs
------------|-----------------|-------------------|---------------
5           | 5               | 0                 | 0
```

### 3. Install Monitoring Scripts

Make the audit script executable:

```bash
chmod +x scripts/audit-workspace-health.js
npm install @supabase/supabase-js dotenv node-fetch
```

### 4. Test the System

Run comprehensive tests:

```bash
# Test all onboarding flows
node scripts/test-onboarding-flow.js

# Test workspace auto-creation specifically
node scripts/audit-workspace-health.js --test

# Run health audit
node scripts/audit-workspace-health.js
```

## 🔧 Production Monitoring

### Daily Health Checks

Add to your cron jobs or CI/CD:

```bash
# Run daily at 9 AM
0 9 * * * cd /path/to/project && node scripts/audit-workspace-health.js

# Run continuous monitoring (every 5 minutes)
node scripts/audit-workspace-health.js --monitor
```

### Health Check API Endpoint

Create an API endpoint for monitoring:

```typescript
// app/api/health/workspaces/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { data, error } = await supabase.rpc('check_workspace_health');
  
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  
  return Response.json(data[0]);
}
```

## 🧪 Testing Scenarios

### Test New User Signup

```bash
# Test email signup
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Verify workspace was created
node scripts/audit-workspace-health.js
```

### Test OAuth Signup

1. Go to `/login`
2. Click "Continue with Google"
3. Complete OAuth flow
4. Verify workspace creation in dashboard

### Test Existing User Fix

```sql
-- Manually create a user without workspace (for testing)
INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com');

-- Run audit function
SELECT * FROM public.audit_and_fix_users_without_orgs();
```

## 🚨 Troubleshooting

### Trigger Not Working

Check if trigger exists:

```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

Recreate if missing:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
```

### Users Still Without Workspaces

Run the audit function manually:

```sql
SELECT * FROM public.audit_and_fix_users_without_orgs();
```

### Performance Issues

Check indexes:

```sql
-- Verify indexes exist
\d+ user_organizations
\d+ organizations
```

## 📊 Monitoring Queries

### Check Recent Signups

```sql
SELECT 
  au.email,
  au.created_at,
  uo.role,
  o.name as workspace_name
FROM auth.users au
LEFT JOIN user_organizations uo ON au.id = uo.user_id
LEFT JOIN organizations o ON uo.organization_id = o.id
WHERE au.created_at > NOW() - INTERVAL '24 hours'
ORDER BY au.created_at DESC;
```

### Find Orphaned Data

```sql
-- Users without organizations
SELECT au.email, au.created_at
FROM auth.users au
LEFT JOIN user_organizations uo ON au.id = uo.user_id
WHERE uo.user_id IS NULL AND au.deleted_at IS NULL;

-- Organizations without users
SELECT o.name, o.created_at
FROM organizations o
LEFT JOIN user_organizations uo ON o.id = uo.organization_id
WHERE uo.organization_id IS NULL;
```

## 🔒 Security Notes

- All functions use `SECURITY DEFINER` for proper permissions
- RLS policies remain enforced
- Trigger only creates workspaces, doesn't bypass security
- Audit functions are safe to run multiple times

## 🎉 Success Criteria

After setup, you should have:

✅ **Zero users without workspaces**  
✅ **Auto-creation working for new signups**  
✅ **Health monitoring in place**  
✅ **No "no organization found" errors**  
✅ **Production-ready onboarding flow**  

## 📞 Support

If you encounter issues:

1. Check the Supabase logs for trigger execution
2. Run the health audit script
3. Verify environment variables are set
4. Test with the provided test scripts

Your SaaS is now ready for stable market launch! 🚀
