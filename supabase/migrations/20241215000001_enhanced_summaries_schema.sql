-- Enhanced summaries table schema with proper structure
-- Drop existing table if it exists to recreate with proper schema
DROP TABLE IF EXISTS public.summaries CASCADE;

-- Create enhanced summaries table
CREATE TABLE public.summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL, -- Slack user ID or authenticated user ID
  team_id TEXT, -- Slack team/workspace ID
  title TEXT,
  summary_text TEXT NOT NULL,
  summary JSONB NOT NULL DEFAULT '{}', -- Structured summary data
  skills_detected TEXT[] DEFAULT '{}',
  red_flags TEXT[] DEFAULT '{}',
  actions TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'slack', -- 'slack', 'manual', 'api'
  raw_transcript TEXT NOT NULL,
  slack_channel TEXT, -- Slack channel ID
  slack_message_ts TEXT, -- Slack message timestamp
  slack_thread_ts TEXT, -- Slack thread timestamp if applicable
  confidence_score DECIMAL(3,2), -- AI confidence score 0.00-1.00
  processing_time_ms INTEGER, -- Time taken to process
  ai_model TEXT, -- Model used for summarization
  metadata JSONB DEFAULT '{}', -- Additional metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_summaries_user_id ON public.summaries(user_id);
CREATE INDEX idx_summaries_team_id ON public.summaries(team_id);
CREATE INDEX idx_summaries_created_at ON public.summaries(created_at DESC);
CREATE INDEX idx_summaries_source ON public.summaries(source);
CREATE INDEX idx_summaries_slack_channel ON public.summaries(slack_channel);
CREATE INDEX idx_summaries_tags ON public.summaries USING GIN(tags);
CREATE INDEX idx_summaries_skills ON public.summaries USING GIN(skills_detected);
CREATE INDEX idx_summaries_summary_search ON public.summaries USING GIN(to_tsvector('english', summary_text));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_summaries_updated_at 
    BEFORE UPDATE ON public.summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.summaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for service role (API access)
CREATE POLICY "Service role can manage all summaries" ON public.summaries
  FOR ALL USING (auth.role() = 'service_role');

-- Policy for authenticated users (if implementing user auth)
CREATE POLICY "Users can view their own summaries" ON public.summaries
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own summaries" ON public.summaries
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own summaries" ON public.summaries
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Policy for team-based access (Slack teams)
CREATE POLICY "Team members can view team summaries" ON public.summaries
  FOR SELECT USING (
    team_id IS NOT NULL AND 
    EXISTS (
      SELECT 1 FROM public.slack_tokens 
      WHERE slack_tokens.team_id = summaries.team_id 
      AND slack_tokens.user_id = auth.uid()::text
    )
  );

-- Create function to search summaries with full-text search
CREATE OR REPLACE FUNCTION search_summaries(
  search_query TEXT,
  user_filter TEXT DEFAULT NULL,
  team_filter TEXT DEFAULT NULL,
  source_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  summary_text TEXT,
  skills_detected TEXT[],
  red_flags TEXT[],
  actions TEXT[],
  tags TEXT[],
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.summary_text,
    s.skills_detected,
    s.red_flags,
    s.actions,
    s.tags,
    s.source,
    s.created_at,
    ts_rank(to_tsvector('english', s.summary_text), plainto_tsquery('english', search_query)) as rank
  FROM public.summaries s
  WHERE 
    (search_query IS NULL OR to_tsvector('english', s.summary_text) @@ plainto_tsquery('english', search_query))
    AND (user_filter IS NULL OR s.user_id = user_filter)
    AND (team_filter IS NULL OR s.team_id = team_filter)
    AND (source_filter IS NULL OR s.source = source_filter)
  ORDER BY 
    CASE WHEN search_query IS NOT NULL THEN ts_rank(to_tsvector('english', s.summary_text), plainto_tsquery('english', search_query)) END DESC,
    s.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_summaries TO authenticated;
GRANT EXECUTE ON FUNCTION search_summaries TO service_role;
