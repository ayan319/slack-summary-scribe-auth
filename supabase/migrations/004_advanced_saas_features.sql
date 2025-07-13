-- =====================================================
-- ADVANCED SAAS FEATURES MIGRATION
-- =====================================================
-- This migration adds support for:
-- 1. Multi-tier AI models with plan-based routing
-- 2. CRM integrations (HubSpot, Salesforce)
-- 3. Advanced onboarding system
-- 4. AI summary scoring pipeline
-- 5. Enhanced user experience features

-- =====================================================
-- 1. CRM INTEGRATIONS
-- =====================================================

-- Create CRM tokens table for encrypted storage
CREATE TABLE IF NOT EXISTS crm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  crm_type TEXT NOT NULL CHECK (crm_type IN ('hubspot', 'salesforce', 'pipedrive')),
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT, -- Encrypted
  token_expires_at TIMESTAMP WITH TIME ZONE,
  instance_url TEXT, -- For Salesforce
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id, crm_type)
);

-- Create CRM exports table to track export operations
CREATE TABLE IF NOT EXISTS crm_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  summary_id UUID NOT NULL REFERENCES summaries(id) ON DELETE CASCADE,
  crm_type TEXT NOT NULL CHECK (crm_type IN ('hubspot', 'salesforce', 'pipedrive')),
  crm_record_id TEXT NOT NULL,
  crm_record_url TEXT,
  export_type TEXT NOT NULL CHECK (export_type IN ('contact', 'note', 'activity', 'deal')),
  export_status TEXT NOT NULL DEFAULT 'pending' CHECK (export_status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. ONBOARDING SYSTEM
-- =====================================================

-- Create onboarding steps table
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL CHECK (step_name IN (
    'welcome', 'connect_slack', 'upload_first_file', 'generate_first_summary', 
    'explore_dashboard', 'setup_notifications', 'connect_crm', 'complete'
  )),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  step_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, step_name)
);

-- Create onboarding progress view
CREATE OR REPLACE VIEW onboarding_progress AS
SELECT 
  user_id,
  COUNT(*) as total_steps,
  COUNT(CASE WHEN is_completed THEN 1 END) as completed_steps,
  ROUND((COUNT(CASE WHEN is_completed THEN 1 END) * 100.0 / COUNT(*)), 2) as completion_percentage,
  CASE 
    WHEN COUNT(CASE WHEN is_completed THEN 1 END) = COUNT(*) THEN 'complete'
    WHEN COUNT(CASE WHEN is_completed THEN 1 END) = 0 THEN 'not_started'
    ELSE 'in_progress'
  END as status
FROM onboarding_steps
GROUP BY user_id;

-- =====================================================
-- 3. AI SUMMARY SCORING & QUALITY METRICS
-- =====================================================

-- Add quality scoring columns to summaries table
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS ai_model TEXT DEFAULT 'deepseek-r1';
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2) CHECK (quality_score >= 0 AND quality_score <= 1);
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS coherence_score DECIMAL(3,2) CHECK (coherence_score >= 0 AND coherence_score <= 1);
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS coverage_score DECIMAL(3,2) CHECK (coverage_score >= 0 AND coverage_score <= 1);
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS style_score DECIMAL(3,2) CHECK (style_score >= 0 AND style_score <= 1);
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS length_score DECIMAL(3,2) CHECK (length_score >= 0 AND length_score <= 1);
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS token_count INTEGER;
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS cost_usd DECIMAL(8,4);

-- Create AI model comparisons table
CREATE TABLE IF NOT EXISTS ai_model_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  deepseek_summary TEXT,
  gpt4_summary TEXT,
  claude_summary TEXT,
  deepseek_score DECIMAL(3,2),
  gpt4_score DECIMAL(3,2),
  claude_score DECIMAL(3,2),
  user_preferred_model TEXT CHECK (user_preferred_model IN ('deepseek', 'gpt4', 'claude')),
  comparison_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ENHANCED USER PREFERENCES & SETTINGS
-- =====================================================

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_ai_model TEXT DEFAULT 'deepseek-r1' CHECK (preferred_ai_model IN ('deepseek-r1', 'gpt-4o', 'claude-3-5-sonnet')),
  auto_export_crm BOOLEAN DEFAULT false,
  default_crm_type TEXT CHECK (default_crm_type IN ('hubspot', 'salesforce', 'pipedrive')),
  notification_preferences JSONB DEFAULT '{"email": true, "in_app": true, "slack": false}',
  summary_preferences JSONB DEFAULT '{"include_sentiment": true, "include_action_items": true, "max_length": 500}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- 5. USAGE ANALYTICS & INSIGHTS
-- =====================================================

-- Create AI usage analytics table
CREATE TABLE IF NOT EXISTS ai_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ai_model TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('summarize', 'analyze', 'compare')),
  input_tokens INTEGER,
  output_tokens INTEGER,
  processing_time_ms INTEGER,
  cost_usd DECIMAL(8,4),
  quality_score DECIMAL(3,2),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly usage summary view
CREATE OR REPLACE VIEW monthly_ai_usage AS
SELECT 
  user_id,
  organization_id,
  ai_model,
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_operations,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(cost_usd) as total_cost_usd,
  AVG(quality_score) as avg_quality_score,
  AVG(processing_time_ms) as avg_processing_time_ms
FROM ai_usage_analytics
WHERE success = true
GROUP BY user_id, organization_id, ai_model, DATE_TRUNC('month', created_at);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE crm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_analytics ENABLE ROW LEVEL SECURITY;

-- CRM tokens policies
CREATE POLICY "Users can view their own CRM tokens" ON crm_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own CRM tokens" ON crm_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own CRM tokens" ON crm_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own CRM tokens" ON crm_tokens FOR DELETE USING (auth.uid() = user_id);

-- CRM exports policies
CREATE POLICY "Users can view their own CRM exports" ON crm_exports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own CRM exports" ON crm_exports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Onboarding steps policies
CREATE POLICY "Users can view their own onboarding steps" ON onboarding_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own onboarding steps" ON onboarding_steps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own onboarding steps" ON onboarding_steps FOR UPDATE USING (auth.uid() = user_id);

-- AI model comparisons policies
CREATE POLICY "Users can view their own AI comparisons" ON ai_model_comparisons FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI comparisons" ON ai_model_comparisons FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- AI usage analytics policies
CREATE POLICY "Users can view their own AI usage" ON ai_usage_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI usage" ON ai_usage_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE
-- =====================================================

-- CRM tokens indexes
CREATE INDEX IF NOT EXISTS idx_crm_tokens_user_id ON crm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_tokens_org_id ON crm_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_tokens_type ON crm_tokens(crm_type);
CREATE INDEX IF NOT EXISTS idx_crm_tokens_active ON crm_tokens(is_active);

-- CRM exports indexes
CREATE INDEX IF NOT EXISTS idx_crm_exports_user_id ON crm_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_exports_summary_id ON crm_exports(summary_id);
CREATE INDEX IF NOT EXISTS idx_crm_exports_status ON crm_exports(export_status);
CREATE INDEX IF NOT EXISTS idx_crm_exports_created_at ON crm_exports(created_at);

-- Onboarding steps indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON onboarding_steps(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_step_name ON onboarding_steps(step_name);
CREATE INDEX IF NOT EXISTS idx_onboarding_completed ON onboarding_steps(is_completed);

-- AI usage analytics indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_org_id ON ai_usage_analytics(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_model ON ai_usage_analytics(ai_model);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_month ON ai_usage_analytics(DATE_TRUNC('month', created_at));

-- =====================================================
-- 8. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to initialize onboarding steps for new users
CREATE OR REPLACE FUNCTION initialize_onboarding_steps()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO onboarding_steps (user_id, step_name) VALUES
    (NEW.id, 'welcome'),
    (NEW.id, 'connect_slack'),
    (NEW.id, 'upload_first_file'),
    (NEW.id, 'generate_first_summary'),
    (NEW.id, 'explore_dashboard'),
    (NEW.id, 'setup_notifications'),
    (NEW.id, 'connect_crm'),
    (NEW.id, 'complete');

  INSERT INTO user_preferences (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize onboarding for new users
CREATE TRIGGER trigger_initialize_onboarding
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_onboarding_steps();

-- Function to update onboarding step completion
CREATE OR REPLACE FUNCTION complete_onboarding_step(
  p_user_id UUID,
  p_step_name TEXT,
  p_step_data JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE onboarding_steps
  SET
    is_completed = true,
    completed_at = NOW(),
    step_data = p_step_data,
    updated_at = NOW()
  WHERE user_id = p_user_id AND step_name = p_step_name;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate AI summary quality score
CREATE OR REPLACE FUNCTION calculate_quality_score(
  p_coherence DECIMAL,
  p_coverage DECIMAL,
  p_style DECIMAL,
  p_length DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  -- Weighted average: coherence 40%, coverage 30%, style 20%, length 10%
  RETURN ROUND(
    (p_coherence * 0.4 + p_coverage * 0.3 + p_style * 0.2 + p_length * 0.1)::DECIMAL,
    2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE crm_tokens IS 'Stores encrypted CRM access tokens for integrations';
COMMENT ON TABLE crm_exports IS 'Tracks CRM export operations and their status';
COMMENT ON TABLE onboarding_steps IS 'Manages user onboarding progress and completion';
COMMENT ON TABLE ai_model_comparisons IS 'Stores AI model comparison results for user preference learning';
COMMENT ON TABLE user_preferences IS 'User-specific preferences for AI models and features';
COMMENT ON TABLE ai_usage_analytics IS 'Tracks AI usage for billing and analytics purposes';
