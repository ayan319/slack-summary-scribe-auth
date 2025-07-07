-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create summaries table
CREATE TABLE IF NOT EXISTS summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slack_team_id VARCHAR(255) NOT NULL,
    connected BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON summaries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slack_team_id ON workspaces(slack_team_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for summaries table
CREATE POLICY "Users can view their own summaries" ON summaries
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own summaries" ON summaries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own summaries" ON summaries
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own summaries" ON summaries
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- RLS Policies for workspaces table
CREATE POLICY "Users can view their own workspaces" ON workspaces
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own workspaces" ON workspaces
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own workspaces" ON workspaces
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own workspaces" ON workspaces
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Insert some sample data for testing (optional)
-- This will be removed in production
INSERT INTO users (id, name, email, password_hash) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Demo User', 'demo@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qK')
ON CONFLICT (email) DO NOTHING;

INSERT INTO workspaces (user_id, name, slack_team_id) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Demo Workspace', 'T1234567890'),
    ('550e8400-e29b-41d4-a716-446655440000', 'Project Alpha', 'T0987654321')
ON CONFLICT DO NOTHING;

INSERT INTO summaries (user_id, title, content, channel_name, message_count) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Daily Standup - Sprint Planning', 'Team discussed upcoming sprint goals, identified blockers, and assigned tasks for the week. Key decisions made around API architecture and database optimization.', 'general', 15),
    ('550e8400-e29b-41d4-a716-446655440000', 'Technical Architecture Review', 'Reviewed microservices architecture, discussed scalability concerns, and planned database optimization. Team agreed on using Redis for caching.', 'engineering', 23),
    ('550e8400-e29b-41d4-a716-446655440000', 'Product Roadmap Discussion', 'Product team aligned on Q2 roadmap priorities. Focus on user experience improvements and new AI features. Marketing integration planned for next month.', 'product', 31)
ON CONFLICT DO NOTHING;
