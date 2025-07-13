-- Create notifications table for Slack Summary Scribe
-- Run this in Supabase SQL Editor

-- Drop existing table if it exists
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (true); -- Allow all for testing

CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (true); -- Allow all for testing

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (true); -- Allow all for testing

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (true); -- Allow all for testing

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO service_role;

-- Insert demo notifications
INSERT INTO notifications (user_id, type, title, message, data) VALUES
  ('add47a1f-192a-4c74-8a98-602ae98f3ffb', 'welcome', '🎉 Welcome to Slack Summary Scribe!', 'Your AI-powered summarization tool is ready. Start by connecting your Slack workspace.', '{"action": "connect_slack", "priority": "high"}'),
  ('add47a1f-192a-4c74-8a98-602ae98f3ffb', 'feature', '🤖 Try Premium AI Models', 'Upgrade to Pro for access to GPT-4o and Claude 3.5 Sonnet for superior summary quality.', '{"action": "upgrade_plan", "priority": "medium"}'),
  ('add47a1f-192a-4c74-8a98-602ae98f3ffb', 'tip', '📊 Explore Your Dashboard', 'Check out your analytics, manage integrations, and customize your AI preferences.', '{"action": "explore_dashboard", "priority": "low"}'),
  ('add47a1f-192a-4c74-8a98-602ae98f3ffb', 'system', '🔧 System Update', 'New features added: CRM integrations, enhanced analytics, and mobile optimization.', '{"action": "view_changelog", "priority": "medium"}'),
  ('add47a1f-192a-4c74-8a98-602ae98f3ffb', 'upload_complete', '📄 File Upload Complete', 'Your document "meeting-notes.pdf" has been processed and summarized.', '{"fileName": "meeting-notes.pdf", "summaryId": "demo-123", "priority": "high"}', NOW() - INTERVAL '2 hours');

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'In-app notifications for users with read_at timestamp';
COMMENT ON COLUMN notifications.read_at IS 'Timestamp when notification was read (null = unread)';

-- Verify the data
SELECT COUNT(*) as notification_count FROM notifications;
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5;
