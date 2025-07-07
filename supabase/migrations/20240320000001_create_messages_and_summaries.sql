-- Create messages table
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    workspace_id TEXT NOT NULL,
    channel TEXT NOT NULL,
    message_text TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create summaries table
CREATE TABLE summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES messages(id) NOT NULL,
    summary_text TEXT NOT NULL,
    skills_detected TEXT[] DEFAULT '{}',
    red_flags TEXT[] DEFAULT '{}',
    actions TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policies for summaries
CREATE POLICY "Users can view their own summaries"
    ON summaries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = summaries.message_id
            AND messages.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own summaries"
    ON summaries FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM messages
            WHERE messages.id = summaries.message_id
            AND messages.user_id = auth.uid()
        )
    );

-- Create indexes for better query performance
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_workspace_id ON messages(workspace_id);
CREATE INDEX idx_summaries_message_id ON summaries(message_id); 