-- Enhanced Row Level Security (RLS) for summaries table
-- This migration adds comprehensive security policies

-- First, ensure RLS is enabled
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with enhanced security
DROP POLICY IF EXISTS "Service role can manage all summaries" ON public.summaries;
DROP POLICY IF EXISTS "Users can view their own summaries" ON public.summaries;
DROP POLICY IF EXISTS "Users can insert their own summaries" ON public.summaries;
DROP POLICY IF EXISTS "Users can update their own summaries" ON public.summaries;
DROP POLICY IF EXISTS "Team members can view team summaries" ON public.summaries;

-- Create enhanced RLS policies

-- 1. Service role policy (for API operations)
CREATE POLICY "service_role_full_access" ON public.summaries
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Authenticated users can view their own summaries
CREATE POLICY "users_view_own_summaries" ON public.summaries
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid()::text = user_id OR
    auth.jwt() ->> 'user_id' = user_id
  );

-- 3. Authenticated users can insert their own summaries
CREATE POLICY "users_insert_own_summaries" ON public.summaries
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid()::text = user_id OR
    auth.jwt() ->> 'user_id' = user_id
  );

-- 4. Users can update their own summaries (limited fields)
CREATE POLICY "users_update_own_summaries" ON public.summaries
  FOR UPDATE 
  TO authenticated
  USING (
    auth.uid()::text = user_id OR
    auth.jwt() ->> 'user_id' = user_id
  )
  WITH CHECK (
    auth.uid()::text = user_id OR
    auth.jwt() ->> 'user_id' = user_id
  );

-- 5. Users can delete their own summaries
CREATE POLICY "users_delete_own_summaries" ON public.summaries
  FOR DELETE 
  TO authenticated
  USING (
    auth.uid()::text = user_id OR
    auth.jwt() ->> 'user_id' = user_id
  );

-- 6. Team-based access for Slack workspaces
CREATE POLICY "team_members_view_team_summaries" ON public.summaries
  FOR SELECT 
  TO authenticated
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.slack_tokens 
      WHERE slack_tokens.team_id = summaries.team_id 
      AND (
        slack_tokens.user_id = auth.uid()::text OR
        slack_tokens.user_id = auth.jwt() ->> 'user_id'
      )
    )
  );

-- 7. Team admins can manage team summaries
CREATE POLICY "team_admins_manage_team_summaries" ON public.summaries
  FOR ALL 
  TO authenticated
  USING (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.slack_tokens 
      WHERE slack_tokens.team_id = summaries.team_id 
      AND (
        slack_tokens.user_id = auth.uid()::text OR
        slack_tokens.user_id = auth.jwt() ->> 'user_id'
      )
      AND slack_tokens.scope LIKE '%admin%'
    )
  )
  WITH CHECK (
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.slack_tokens 
      WHERE slack_tokens.team_id = summaries.team_id 
      AND (
        slack_tokens.user_id = auth.uid()::text OR
        slack_tokens.user_id = auth.jwt() ->> 'user_id'
      )
      AND slack_tokens.scope LIKE '%admin%'
    )
  );

-- 8. Public read access for summaries marked as public (optional)
CREATE POLICY "public_read_public_summaries" ON public.summaries
  FOR SELECT 
  TO anon, authenticated
  USING (
    metadata ->> 'public' = 'true' AND
    metadata ->> 'visibility' = 'public'
  );

-- Create security functions for additional validation

-- Function to check if user has team access
CREATE OR REPLACE FUNCTION public.user_has_team_access(target_team_id text, target_user_id text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.slack_tokens 
    WHERE team_id = target_team_id 
    AND user_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access summary
CREATE OR REPLACE FUNCTION public.user_can_access_summary(summary_id uuid, requesting_user_id text)
RETURNS boolean AS $$
DECLARE
  summary_record public.summaries%ROWTYPE;
BEGIN
  SELECT * INTO summary_record FROM public.summaries WHERE id = summary_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if user owns the summary
  IF summary_record.user_id = requesting_user_id THEN
    RETURN true;
  END IF;
  
  -- Check if user has team access
  IF summary_record.team_id IS NOT NULL THEN
    RETURN public.user_has_team_access(summary_record.team_id, requesting_user_id);
  END IF;
  
  -- Check if summary is public
  IF summary_record.metadata ->> 'public' = 'true' AND 
     summary_record.metadata ->> 'visibility' = 'public' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.summary_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  summary_id UUID REFERENCES public.summaries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'export'
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.summary_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "service_role_audit_access" ON public.summary_audit_log
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "users_view_own_audit_logs" ON public.summary_audit_log
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid()::text = user_id OR
    auth.jwt() ->> 'user_id' = user_id
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_summaries_user_id_team_id ON public.summaries(user_id, team_id);
CREATE INDEX IF NOT EXISTS idx_summaries_team_id_created_at ON public.summaries(team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_summaries_metadata_public ON public.summaries USING GIN((metadata ->> 'public')) WHERE metadata ->> 'public' = 'true';
CREATE INDEX IF NOT EXISTS idx_audit_log_summary_id ON public.summary_audit_log(summary_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON public.summary_audit_log(user_id, action);

-- Create function to log summary access
CREATE OR REPLACE FUNCTION public.log_summary_access(
  p_summary_id uuid,
  p_user_id text,
  p_action text,
  p_details jsonb DEFAULT '{}',
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.summary_audit_log (
    summary_id,
    user_id,
    action,
    details,
    ip_address,
    user_agent
  ) VALUES (
    p_summary_id,
    p_user_id,
    p_action,
    p_details,
    p_ip_address,
    p_user_agent
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT SELECT ON public.summaries TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.summaries TO authenticated;
GRANT SELECT ON public.summary_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_team_access TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_can_access_summary TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_summary_access TO authenticated, service_role;

-- Create view for summary statistics (respects RLS)
CREATE OR REPLACE VIEW public.summary_stats AS
SELECT 
  user_id,
  team_id,
  COUNT(*) as total_summaries,
  AVG(confidence_score) as avg_confidence,
  COUNT(DISTINCT source) as sources_used,
  COUNT(DISTINCT ai_model) as models_used,
  MAX(created_at) as last_summary_date,
  MIN(created_at) as first_summary_date
FROM public.summaries
GROUP BY user_id, team_id;

-- Enable RLS on the view
ALTER VIEW public.summary_stats SET (security_barrier = true);

-- Grant access to the view
GRANT SELECT ON public.summary_stats TO authenticated, anon;
