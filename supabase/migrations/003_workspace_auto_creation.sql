-- =====================================================
-- WORKSPACE AUTO-CREATION SYSTEM FOR MARKET LAUNCH
-- This migration ensures 100% onboarding stability
-- =====================================================

-- First, ensure all required tables exist
-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Create users table for additional user data if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create summaries table if it doesn't exist
CREATE TABLE IF NOT EXISTS summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  summary_data JSONB DEFAULT '{}',
  source TEXT DEFAULT 'slack',
  slack_channel TEXT,
  slack_message_ts TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Create function to handle new user signup and auto-create workspace
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- Get user name from metadata or email
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  -- Create user profile in users table
  INSERT INTO public.users (id, name, email, avatar_url, provider)
  VALUES (
    NEW.id,
    user_name,
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.app_metadata->>'provider', 'email')
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    provider = EXCLUDED.provider;

  -- Create default organization for the user
  INSERT INTO public.organizations (name)
  VALUES (user_name || '''s Workspace')
  RETURNING id INTO new_org_id;

  -- Link user to the organization as owner
  INSERT INTO public.user_organizations (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'owner');

  -- Log the workspace creation
  RAISE LOG 'Auto-created workspace % for user %', new_org_id, NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE LOG 'Error creating workspace for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger to automatically run on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- 3. Create function to audit and fix existing users without organizations
CREATE OR REPLACE FUNCTION public.audit_and_fix_users_without_orgs()
RETURNS TABLE(
  user_id UUID,
  user_email TEXT,
  action_taken TEXT,
  org_id UUID
) AS $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
  user_name TEXT;
BEGIN
  -- Find users in auth.users who don't have organizations
  FOR user_record IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.user_organizations uo ON au.id = uo.user_id
    WHERE uo.user_id IS NULL
      AND au.email IS NOT NULL
      AND au.deleted_at IS NULL
  LOOP
    -- Get user name
    user_name := COALESCE(
      user_record.raw_user_meta_data->>'full_name',
      user_record.raw_user_meta_data->>'name',
      split_part(user_record.email, '@', 1)
    );

    -- Create user profile if it doesn't exist
    INSERT INTO public.users (id, name, email, avatar_url, provider)
    VALUES (
      user_record.id,
      user_name,
      user_record.email,
      user_record.raw_user_meta_data->>'avatar_url',
      COALESCE(user_record.raw_user_meta_data->>'provider', 'email')
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email;

    -- Create default organization
    INSERT INTO public.organizations (name)
    VALUES (user_name || '''s Workspace')
    RETURNING id INTO new_org_id;

    -- Link user to organization as owner
    INSERT INTO public.user_organizations (user_id, organization_id, role)
    VALUES (user_record.id, new_org_id, 'owner');

    -- Return the action taken
    user_id := user_record.id;
    user_email := user_record.email;
    action_taken := 'Created default workspace';
    org_id := new_org_id;
    
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to check workspace health
CREATE OR REPLACE FUNCTION public.check_workspace_health()
RETURNS TABLE(
  total_users BIGINT,
  users_with_orgs BIGINT,
  users_without_orgs BIGINT,
  orphaned_orgs BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as total_users,
    (SELECT COUNT(DISTINCT uo.user_id) FROM public.user_organizations uo 
     JOIN auth.users au ON uo.user_id = au.id WHERE au.deleted_at IS NULL) as users_with_orgs,
    (SELECT COUNT(*) FROM auth.users au 
     LEFT JOIN public.user_organizations uo ON au.id = uo.user_id 
     WHERE uo.user_id IS NULL AND au.deleted_at IS NULL) as users_without_orgs,
    (SELECT COUNT(*) FROM public.organizations o 
     LEFT JOIN public.user_organizations uo ON o.id = uo.organization_id 
     WHERE uo.organization_id IS NULL) as orphaned_orgs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add unique constraint to prevent duplicate default workspaces
ALTER TABLE public.user_organizations 
DROP CONSTRAINT IF EXISTS unique_user_org;

ALTER TABLE public.user_organizations 
ADD CONSTRAINT unique_user_org UNIQUE (user_id, organization_id);

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_lookup 
ON public.user_organizations(user_id) WHERE role = 'owner';

-- 7. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.audit_and_fix_users_without_orgs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_workspace_health() TO authenticated;

-- 8. Run the audit function to fix existing users
SELECT * FROM public.audit_and_fix_users_without_orgs();

-- 9. Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for organizations table
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- 11. RLS Policies for user_organizations table
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;
CREATE POLICY "Users can view their organization memberships" ON user_organizations
  FOR SELECT USING (user_id = auth.uid());

-- 12. RLS Policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (id = auth.uid());

-- 13. RLS Policies for summaries table
DROP POLICY IF EXISTS "Users can view their organization summaries" ON summaries;
CREATE POLICY "Users can view their organization summaries" ON summaries
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- 14. Add additional performance indexes
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 15. Display health check results
SELECT * FROM public.check_workspace_health();
