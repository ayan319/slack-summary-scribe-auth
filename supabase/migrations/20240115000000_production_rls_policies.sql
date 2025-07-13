-- Production RLS Policies for User Data Isolation
-- This migration ensures all tables have proper Row Level Security policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update organization" ON organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;

DROP POLICY IF EXISTS "Users can view own organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Organization owners can manage memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can join organizations" ON user_organizations;

DROP POLICY IF EXISTS "Users can view own summaries" ON summaries;
DROP POLICY IF EXISTS "Users can create own summaries" ON summaries;
DROP POLICY IF EXISTS "Users can update own summaries" ON summaries;
DROP POLICY IF EXISTS "Users can delete own summaries" ON summaries;

DROP POLICY IF EXISTS "Users can view own slack integrations" ON slack_integrations;
DROP POLICY IF EXISTS "Users can manage own slack integrations" ON slack_integrations;

DROP POLICY IF EXISTS "Users can view own uploads" ON uploads;
DROP POLICY IF EXISTS "Users can manage own uploads" ON uploads;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can manage own notifications" ON notifications;

DROP POLICY IF EXISTS "Users can view own onboarding steps" ON onboarding_steps;
DROP POLICY IF EXISTS "Users can manage own onboarding steps" ON onboarding_steps;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations table policies
CREATE POLICY "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization owners can update organization" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- User organizations table policies
CREATE POLICY "Users can view own organization memberships" ON user_organizations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization owners can manage memberships" ON user_organizations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Users can join organizations" ON user_organizations
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Summaries table policies
CREATE POLICY "Users can view own summaries" ON summaries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own summaries" ON summaries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own summaries" ON summaries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own summaries" ON summaries
  FOR DELETE USING (user_id = auth.uid());

-- Slack integrations table policies
CREATE POLICY "Users can view own slack integrations" ON slack_integrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own slack integrations" ON slack_integrations
  FOR ALL USING (user_id = auth.uid());

-- Uploads table policies
CREATE POLICY "Users can view own uploads" ON uploads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own uploads" ON uploads
  FOR ALL USING (user_id = auth.uid());

-- Notifications table policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Onboarding steps table policies
CREATE POLICY "Users can view own onboarding steps" ON onboarding_steps
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own onboarding steps" ON onboarding_steps
  FOR ALL USING (user_id = auth.uid());

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  );
  
  -- Create default organization for user
  INSERT INTO public.organizations (id, name, slug, created_by, created_at, updated_at)
  VALUES (
    gen_random_uuid(),
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)) || '''s Workspace',
    lower(replace(COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), ' ', '-')) || '-workspace',
    new.id,
    now(),
    now()
  );
  
  -- Add user as owner of the organization
  INSERT INTO public.user_organizations (user_id, organization_id, role, created_at, updated_at)
  VALUES (
    new.id,
    (SELECT id FROM public.organizations WHERE created_by = new.id ORDER BY created_at DESC LIMIT 1),
    'owner',
    now(),
    now()
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to update user updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_organizations_updated_at BEFORE UPDATE ON user_organizations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_slack_integrations_updated_at BEFORE UPDATE ON slack_integrations
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE ON uploads
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_onboarding_steps_updated_at BEFORE UPDATE ON onboarding_steps
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure service role can bypass RLS for admin operations
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE user_organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE summaries FORCE ROW LEVEL SECURITY;
ALTER TABLE slack_integrations FORCE ROW LEVEL SECURITY;
ALTER TABLE uploads FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps FORCE ROW LEVEL SECURITY;
