-- =====================================================
-- ADVANCED FEATURES MIGRATION
-- Smart Tagging, Slack Auto-Post, CRM Integration, Stripe Fallback
-- =====================================================

-- 1. Summary Tags Table (Smart Tagging Feature)
CREATE TABLE IF NOT EXISTS summary_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  tags JSONB NOT NULL DEFAULT '{}',
  skills TEXT[] DEFAULT '{}',
  technologies TEXT[] DEFAULT '{}',
  roles TEXT[] DEFAULT '{}',
  action_items TEXT[] DEFAULT '{}',
  decisions TEXT[] DEFAULT '{}',
  sentiments TEXT[] DEFAULT '{}',
  emotions TEXT[] DEFAULT '{}',
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  ai_model TEXT DEFAULT 'gpt-4o-mini',
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Summary Posts Table (Slack Auto-Post Feature)
CREATE TABLE IF NOT EXISTS summary_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  slack_channel_id TEXT NOT NULL,
  slack_message_ts TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed')),
  error_log TEXT,
  retry_count INTEGER DEFAULT 0,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRM Integrations Table
CREATE TABLE IF NOT EXISTS crm_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  crm_type TEXT NOT NULL CHECK (crm_type IN ('hubspot', 'salesforce', 'notion')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  crm_user_id TEXT,
  crm_account_id TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id, crm_type)
);

-- 4. CRM Push Logs Table
CREATE TABLE IF NOT EXISTS summary_crm_pushes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  crm_integration_id UUID NOT NULL REFERENCES crm_integrations(id) ON DELETE CASCADE,
  crm_type TEXT NOT NULL,
  crm_record_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_log TEXT,
  retry_count INTEGER DEFAULT 0,
  pushed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Settings Table (Enhanced for new features)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  auto_post_to_slack BOOLEAN DEFAULT FALSE,
  auto_push_to_crm BOOLEAN DEFAULT FALSE,
  preferred_ai_model TEXT DEFAULT 'deepseek-r1' CHECK (preferred_ai_model IN ('deepseek-r1', 'gpt-4o-mini')),
  enable_smart_tagging BOOLEAN DEFAULT TRUE,
  slack_post_channel_preference TEXT DEFAULT 'same_channel' CHECK (slack_post_channel_preference IN ('same_channel', 'dm_user')),
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- 6. Payment Methods Table (Stripe Fallback)
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('cashfree', 'stripe')),
  provider_customer_id TEXT NOT NULL,
  provider_payment_method_id TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  card_last_four TEXT,
  card_brand TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  billing_address JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ai_model TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('summarization', 'tagging', 'analysis')),
  tokens_used INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0.0000,
  processing_time_ms INTEGER,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_summary_tags_summary_id ON summary_tags(summary_id);
CREATE INDEX IF NOT EXISTS idx_summary_posts_user_id ON summary_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_summary_posts_status ON summary_posts(status);
CREATE INDEX IF NOT EXISTS idx_crm_integrations_user_org ON crm_integrations(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_pushes_summary_id ON summary_crm_pushes(summary_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_org ON user_settings(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_org ON ai_usage_tracking(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_tracking(created_at);

-- Enable RLS on all new tables
ALTER TABLE summary_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE summary_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE summary_crm_pushes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Summary Tags Policies
CREATE POLICY "Users can view their own summary tags" ON summary_tags
  FOR SELECT USING (
    summary_id IN (
      SELECT id FROM summaries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own summary tags" ON summary_tags
  FOR INSERT WITH CHECK (
    summary_id IN (
      SELECT id FROM summaries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all summary tags" ON summary_tags
  FOR ALL USING (auth.role() = 'service_role');

-- Summary Posts Policies
CREATE POLICY "Users can view their own summary posts" ON summary_posts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own summary posts" ON summary_posts
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own summary posts" ON summary_posts
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all summary posts" ON summary_posts
  FOR ALL USING (auth.role() = 'service_role');

-- CRM Integrations Policies
CREATE POLICY "Users can view their own CRM integrations" ON crm_integrations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own CRM integrations" ON crm_integrations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all CRM integrations" ON crm_integrations
  FOR ALL USING (auth.role() = 'service_role');

-- CRM Push Logs Policies
CREATE POLICY "Users can view their own CRM pushes" ON summary_crm_pushes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own CRM pushes" ON summary_crm_pushes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can manage all CRM pushes" ON summary_crm_pushes
  FOR ALL USING (auth.role() = 'service_role');

-- User Settings Policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all user settings" ON user_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Payment Methods Policies
CREATE POLICY "Users can view their own payment methods" ON payment_methods
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own payment methods" ON payment_methods
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all payment methods" ON payment_methods
  FOR ALL USING (auth.role() = 'service_role');

-- AI Usage Tracking Policies
CREATE POLICY "Users can view their own AI usage" ON ai_usage_tracking
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all AI usage" ON ai_usage_tracking
  FOR ALL USING (auth.role() = 'service_role');
