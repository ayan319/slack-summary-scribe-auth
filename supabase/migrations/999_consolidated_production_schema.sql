-- =====================================================
-- CONSOLIDATED PRODUCTION SCHEMA
-- Single migration file for clean production deployment
-- Replaces all previous conflicting migrations
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables in correct order to avoid foreign key conflicts
DROP TABLE IF EXISTS slack_integrations CASCADE;
DROP TABLE IF EXISTS summaries CASCADE;
DROP TABLE IF EXISTS user_organizations CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS exports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;

-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_organizations table (many-to-many relationship)
CREATE TABLE user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Create users table for additional user data
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  provider TEXT,
  settings JSONB DEFAULT '{}',
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create summaries table
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  summary_data JSONB DEFAULT '{}',
  source TEXT DEFAULT 'slack' CHECK (source IN ('slack', 'upload', 'manual')),
  slack_channel TEXT,
  slack_message_ts TEXT,
  slack_thread_ts TEXT,
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create slack_integrations table
CREATE TABLE slack_integrations (
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

-- Create file_uploads table
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  upload_status TEXT DEFAULT 'pending' CHECK (upload_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_result JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exports table
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'notion', 'slack', 'crm', 'excel')),
  export_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slack_integrations_updated_at BEFORE UPDATE ON slack_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_uploads_updated_at BEFORE UPDATE ON file_uploads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exports_updated_at BEFORE UPDATE ON exports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update organizations they own" ON organizations
    FOR UPDATE USING (
        id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- RLS Policies for user_organizations
CREATE POLICY "Users can view their organization memberships" ON user_organizations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Organization owners can manage memberships" ON user_organizations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- RLS Policies for summaries
CREATE POLICY "Users can view summaries in their organizations" ON summaries
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create summaries in their organizations" ON summaries
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own summaries" ON summaries
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own summaries" ON summaries
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for slack_integrations
CREATE POLICY "Users can view slack integrations in their organizations" ON slack_integrations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization admins can manage slack integrations" ON slack_integrations
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- RLS Policies for file_uploads
CREATE POLICY "Users can view file uploads in their organizations" ON file_uploads
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create file uploads in their organizations" ON file_uploads
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for exports
CREATE POLICY "Users can view exports in their organizations" ON exports
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create exports in their organizations" ON exports
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        organization_id IN (
            SELECT organization_id FROM user_organizations
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own support tickets" ON support_tickets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create support tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Workspace Auto-Creation Function
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Get user details from auth.users
    SELECT email, COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', email)
    INTO user_email, user_name
    FROM auth.users
    WHERE id = NEW.id;

    BEGIN
        -- Create user profile
        INSERT INTO users (id, name, email, provider)
        VALUES (
            NEW.id,
            COALESCE(user_name, user_email, 'User'),
            COALESCE(user_email, 'user@example.com'),
            COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
        )
        ON CONFLICT (id) DO NOTHING;

        -- Create default organization
        INSERT INTO organizations (name, slug)
        VALUES (
            COALESCE(user_name, 'User') || '''s Workspace',
            'workspace-' || LOWER(REPLACE(NEW.id::text, '-', ''))
        )
        RETURNING id INTO new_org_id;

        -- Add user as owner of the organization
        INSERT INTO user_organizations (user_id, organization_id, role)
        VALUES (NEW.id, new_org_id, 'owner');

        -- Log successful creation
        RAISE NOTICE 'Successfully created workspace for user %', NEW.id;

    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE WARNING 'Failed to create workspace for user %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_signup();

-- Health Check Function
CREATE OR REPLACE FUNCTION check_workspace_health()
RETURNS TABLE (
    total_users BIGINT,
    users_with_orgs BIGINT,
    users_without_orgs BIGINT,
    health_percentage NUMERIC
) AS $$
BEGIN
    SELECT
        COUNT(*) as total,
        COUNT(uo.user_id) as with_orgs,
        COUNT(*) - COUNT(uo.user_id) as without_orgs,
        CASE
            WHEN COUNT(*) = 0 THEN 100
            ELSE ROUND((COUNT(uo.user_id)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        END as health_pct
    INTO total_users, users_with_orgs, users_without_orgs, health_percentage
    FROM auth.users au
    LEFT JOIN user_organizations uo ON au.id = uo.user_id;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Audit and Fix Function
CREATE OR REPLACE FUNCTION audit_and_fix_users_without_orgs()
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    action_taken TEXT
) AS $$
DECLARE
    user_record RECORD;
    new_org_id UUID;
BEGIN
    FOR user_record IN
        SELECT au.id, au.email, COALESCE(au.raw_user_meta_data->>'name', au.email) as name
        FROM auth.users au
        LEFT JOIN user_organizations uo ON au.id = uo.user_id
        WHERE uo.user_id IS NULL
    LOOP
        BEGIN
            -- Create user profile if not exists
            INSERT INTO users (id, name, email)
            VALUES (user_record.id, user_record.name, user_record.email)
            ON CONFLICT (id) DO NOTHING;

            -- Create default organization
            INSERT INTO organizations (name, slug)
            VALUES (
                user_record.name || '''s Workspace',
                'workspace-' || LOWER(REPLACE(user_record.id::text, '-', ''))
            )
            RETURNING id INTO new_org_id;

            -- Add user as owner
            INSERT INTO user_organizations (user_id, organization_id, role)
            VALUES (user_record.id, new_org_id, 'owner');

            -- Return success
            user_id := user_record.id;
            user_email := user_record.email;
            action_taken := 'Created workspace and user profile';
            RETURN NEXT;

        EXCEPTION WHEN OTHERS THEN
            -- Return error
            user_id := user_record.id;
            user_email := user_record.email;
            action_taken := 'ERROR: ' || SQLERRM;
            RETURN NEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_org_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(role);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);

CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_org_id ON summaries(organization_id);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_source ON summaries(source);
CREATE INDEX IF NOT EXISTS idx_summaries_archived ON summaries(is_archived);

CREATE INDEX IF NOT EXISTS idx_slack_integrations_org_id ON slack_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_slack_integrations_team_id ON slack_integrations(slack_team_id);
CREATE INDEX IF NOT EXISTS idx_slack_integrations_active ON slack_integrations(is_active);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_org_id ON file_uploads(organization_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(upload_status);

CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_org_id ON exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_exports_summary_id ON exports(summary_id);
CREATE INDEX IF NOT EXISTS idx_exports_type ON exports(export_type);
CREATE INDEX IF NOT EXISTS idx_exports_status ON exports(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Insert sample data for testing (optional)
-- This will be executed only if no organizations exist
DO $$
DECLARE
    test_user_id UUID;
    test_org_id UUID;
    test_slack_integration_id UUID;
BEGIN
    -- Check if test user exists in auth.users
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'mohammadayan5442@gmail.com'
    LIMIT 1;

    IF test_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found test user: %', test_user_id;

        -- Ensure user profile exists
        INSERT INTO users (id, name, email, provider, settings)
        VALUES (
            test_user_id,
            'Ayan',
            'mohammadayan5442@gmail.com',
            'email',
            '{"theme": "dark", "notifications": true}'
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            updated_at = NOW();

        -- Create or get test organization
        INSERT INTO organizations (name, slug, settings)
        VALUES (
            'Ayan''s Workspace',
            'ayans-workspace',
            '{"plan": "pro", "features": ["ai_summaries", "slack_integration", "exports"]}'
        )
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            settings = EXCLUDED.settings,
            updated_at = NOW()
        RETURNING id INTO test_org_id;

        -- Ensure user is owner of organization
        INSERT INTO user_organizations (user_id, organization_id, role, permissions)
        VALUES (
            test_user_id,
            test_org_id,
            'owner',
            '{"admin": true, "billing": true, "integrations": true}'
        )
        ON CONFLICT (user_id, organization_id) DO UPDATE SET
            role = EXCLUDED.role,
            permissions = EXCLUDED.permissions;

        -- Create Slack integration
        INSERT INTO slack_integrations (
            user_id, organization_id, slack_team_id, slack_team_name,
            access_token, bot_token, bot_user_id, scope, is_active
        )
        VALUES (
            test_user_id, test_org_id, 'T1234567890', 'Ayan''s Team',
            'xoxp-test-token', 'xoxb-test-bot-token', 'U1234567890',
            'channels:read,chat:write,files:read', true
        )
        ON CONFLICT (organization_id, slack_team_id) DO UPDATE SET
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        RETURNING id INTO test_slack_integration_id;

        -- Insert demo summaries
        INSERT INTO summaries (user_id, organization_id, title, content, summary_data, source, slack_channel, metadata, tags)
        VALUES
        (
            test_user_id, test_org_id,
            'Weekly Team Standup - Sprint Planning',
            'Team discussed upcoming sprint goals and task assignments. Key decisions made on architecture changes and timeline adjustments. Sarah will lead the frontend redesign, Mike will handle backend optimizations, and Lisa will focus on testing automation.',
            '{"participants": ["Sarah", "Mike", "Lisa", "Ayan"], "duration": "45 minutes", "action_items": 3, "decisions": 2}',
            'slack', '#general',
            '{"channel_id": "C1234567890", "message_count": 23, "thread_count": 5}',
            ARRAY['standup', 'sprint-planning', 'team-meeting']
        ),
        (
            test_user_id, test_org_id,
            'Product Launch Discussion',
            'Comprehensive review of the upcoming product launch. Marketing strategy finalized, launch date confirmed for next month. Need to coordinate with sales team and prepare customer support documentation.',
            '{"participants": ["Product Team", "Marketing", "Sales"], "duration": "60 minutes", "action_items": 8, "decisions": 4}',
            'slack', '#product',
            '{"channel_id": "C2345678901", "message_count": 45, "thread_count": 12}',
            ARRAY['product-launch', 'marketing', 'strategy']
        ),
        (
            test_user_id, test_org_id,
            'Technical Architecture Review',
            'Deep dive into system architecture improvements. Discussed microservices migration, database optimization strategies, and security enhancements. Decided to implement Redis caching and upgrade to PostgreSQL 15.',
            '{"participants": ["Engineering Team"], "duration": "90 minutes", "action_items": 12, "decisions": 6}',
            'slack', '#engineering',
            '{"channel_id": "C3456789012", "message_count": 67, "thread_count": 18}',
            ARRAY['architecture', 'technical', 'database', 'performance']
        ),
        (
            test_user_id, test_org_id,
            'Customer Feedback Analysis',
            'Analyzed recent customer feedback and support tickets. Identified key pain points in user onboarding and feature requests. Priority items include improving documentation and adding bulk operations.',
            '{"participants": ["Support Team", "Product"], "duration": "30 minutes", "action_items": 5, "decisions": 3}',
            'upload', NULL,
            '{"file_type": "pdf", "file_size": "2.3MB", "pages": 15}',
            ARRAY['customer-feedback', 'support', 'product-improvement']
        ),
        (
            test_user_id, test_org_id,
            'Q4 Budget Planning Session',
            'Quarterly budget review and planning for Q4. Allocated resources for new hires, infrastructure upgrades, and marketing campaigns. Approved additional budget for AI/ML initiatives.',
            '{"participants": ["Leadership Team"], "duration": "120 minutes", "action_items": 15, "decisions": 8}',
            'slack', '#leadership',
            '{"channel_id": "C4567890123", "message_count": 89, "thread_count": 25}',
            ARRAY['budget', 'planning', 'q4', 'leadership']
        );

        -- Insert demo notifications
        INSERT INTO notifications (user_id, organization_id, type, title, message, data, read_at)
        VALUES
        (
            test_user_id, test_org_id, 'summary_created',
            'New Summary Generated',
            'Your Slack conversation from #general has been summarized',
            '{"summary_id": "summary-1", "channel": "#general", "participants": 4}',
            NULL
        ),
        (
            test_user_id, test_org_id, 'export_completed',
            'PDF Export Ready',
            'Your summary export to PDF has been completed and is ready for download',
            '{"export_id": "export-1", "format": "pdf", "file_size": "1.2MB"}',
            NOW() - INTERVAL '2 hours'
        ),
        (
            test_user_id, test_org_id, 'slack_connected',
            'Slack Integration Active',
            'Your Slack workspace has been successfully connected',
            '{"team_name": "Ayan''s Team", "channels": 12}',
            NOW() - INTERVAL '1 day'
        ),
        (
            test_user_id, test_org_id, 'usage_limit',
            'Monthly Usage Update',
            'You''ve used 75% of your monthly AI summary quota',
            '{"used": 75, "limit": 100, "plan": "pro"}',
            NULL
        ),
        (
            test_user_id, test_org_id, 'feature_update',
            'New Feature: Bulk Export',
            'You can now export multiple summaries at once using our new bulk export feature',
            '{"feature": "bulk_export", "version": "2.1.0"}',
            NOW() - INTERVAL '3 days'
        );

        -- Insert demo file uploads
        INSERT INTO file_uploads (user_id, organization_id, filename, file_path, file_size, file_type, upload_status, processing_result)
        VALUES
        (
            test_user_id, test_org_id,
            'meeting-transcript-2024-01-15.pdf',
            '/uploads/meeting-transcript-2024-01-15.pdf',
            2457600, 'application/pdf', 'completed',
            '{"pages": 15, "word_count": 3500, "summary_generated": true}'
        ),
        (
            test_user_id, test_org_id,
            'customer-feedback-report.docx',
            '/uploads/customer-feedback-report.docx',
            1843200, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'completed',
            '{"pages": 8, "word_count": 2100, "summary_generated": true}'
        );

        -- Insert demo exports
        INSERT INTO exports (user_id, organization_id, summary_id, export_type, export_data, status, file_url)
        SELECT
            test_user_id, test_org_id, s.id, 'pdf',
            '{"format": "pdf", "template": "standard", "include_metadata": true}',
            'completed',
            '/exports/summary-' || s.id || '.pdf'
        FROM summaries s
        WHERE s.user_id = test_user_id
        LIMIT 3;

        RAISE NOTICE 'Successfully created demo data for test user: %', test_user_id;
    ELSE
        RAISE NOTICE 'Test user mohammadayan5442@gmail.com not found in auth.users';
    END IF;
END $$;
