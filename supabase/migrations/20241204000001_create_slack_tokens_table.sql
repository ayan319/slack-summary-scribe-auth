
-- Create slack_tokens table to store OAuth tokens
CREATE TABLE IF NOT EXISTS slack_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  bot_user_id TEXT,
  app_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'bot',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE slack_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role full access
CREATE POLICY "Service role can manage slack tokens" ON slack_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Create policy for authenticated users to view their own tokens
CREATE POLICY "Users can view their own slack tokens" ON slack_tokens
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');
