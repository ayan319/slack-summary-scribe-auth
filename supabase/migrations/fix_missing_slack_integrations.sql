-- Fix missing slack_integrations table and RLS policies
-- Run this in Supabase Dashboard > SQL Editor

-- Create slack_integrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS slack_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slack_team_id TEXT NOT NULL,
  slack_team_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  bot_token TEXT,
  bot_user_id TEXT,
  scope TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, slack_team_id)
);

-- Enable RLS on slack_integrations
ALTER TABLE slack_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for slack_integrations
CREATE POLICY IF NOT EXISTS "Users can view their organization integrations" ON slack_integrations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can manage their organization integrations" ON slack_integrations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Ensure RLS is enabled on all core tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Create missing RLS policies if they don't exist

-- Organizations policies
CREATE POLICY IF NOT EXISTS "Users can view organizations they belong to" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);

-- User_organizations policies  
CREATE POLICY IF NOT EXISTS "Users can view their organization memberships" ON user_organizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own organization memberships" ON user_organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users policies
CREATE POLICY IF NOT EXISTS "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Summaries policies
CREATE POLICY IF NOT EXISTS "Users can view their organization summaries" ON summaries
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can create summaries in their organizations" ON summaries
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update summaries in their organizations" ON summaries
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_slack_integrations_user_id ON slack_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_slack_integrations_organization_id ON slack_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_slack_integrations_slack_team_id ON slack_integrations(slack_team_id);

-- Create updated_at trigger for slack_integrations
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_slack_integrations_updated_at 
  BEFORE UPDATE ON slack_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the setup
SELECT 'slack_integrations table created successfully' as status;
