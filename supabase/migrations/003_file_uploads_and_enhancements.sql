-- Migration: File Uploads and Enhanced Features
-- Created: 2025-01-27

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create file_uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    upload_status TEXT NOT NULL DEFAULT 'uploading' CHECK (upload_status IN ('uploading', 'processing', 'completed', 'failed')),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'extracting', 'summarizing', 'completed', 'failed')),
    extracted_text TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update summaries table to link with file uploads
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS file_upload_id UUID REFERENCES file_uploads(id) ON DELETE SET NULL;
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'slack' CHECK (source_type IN ('slack', 'file_upload', 'manual'));
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE summaries ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Create exports table for tracking
CREATE TABLE IF NOT EXISTS exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    summary_id UUID REFERENCES summaries(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'excel', 'notion')),
    export_status TEXT NOT NULL DEFAULT 'processing' CHECK (export_status IN ('processing', 'completed', 'failed')),
    file_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table for usage tracking
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('upload_complete', 'summary_ready', 'export_complete', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create support_tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_organization_id ON file_uploads(organization_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(upload_status, processing_status);
CREATE INDEX IF NOT EXISTS idx_summaries_file_upload_id ON summaries(file_upload_id);
CREATE INDEX IF NOT EXISTS idx_summaries_source_type ON summaries(source_type);
CREATE INDEX IF NOT EXISTS idx_exports_user_id ON exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_summary_id ON exports(summary_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_file_uploads_updated_at BEFORE UPDATE ON file_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exports_updated_at BEFORE UPDATE ON exports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- File uploads policies
CREATE POLICY "Users can view their own file uploads" ON file_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own file uploads" ON file_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own file uploads" ON file_uploads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own file uploads" ON file_uploads FOR DELETE USING (auth.uid() = user_id);

-- Organization members can view file uploads in their organization
CREATE POLICY "Organization members can view file uploads" ON file_uploads FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM user_organizations 
        WHERE user_organizations.user_id = auth.uid() 
        AND user_organizations.organization_id = file_uploads.organization_id
    )
);

-- Exports policies
CREATE POLICY "Users can view their own exports" ON exports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exports" ON exports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exports" ON exports FOR UPDATE USING (auth.uid() = user_id);

-- Analytics policies (users can only insert, admins can view all)
CREATE POLICY "Users can insert analytics" ON analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own analytics" ON analytics FOR SELECT USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Support tickets policies
CREATE POLICY "Users can view their own support tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert support tickets" ON support_tickets FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own support tickets" ON support_tickets FOR UPDATE USING (auth.uid() = user_id);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('file-uploads', 'file-uploads', false) ON CONFLICT DO NOTHING;

-- Storage policies for file uploads
CREATE POLICY "Users can upload files" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'file-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files" ON storage.objects FOR SELECT USING (
    bucket_id = 'file-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files" ON storage.objects FOR UPDATE USING (
    bucket_id = 'file-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files" ON storage.objects FOR DELETE USING (
    bucket_id = 'file-uploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Add comments for documentation
COMMENT ON TABLE file_uploads IS 'Stores uploaded files (PDF/DOCX) for summarization';
COMMENT ON TABLE exports IS 'Tracks export operations (PDF/Excel/Notion)';
COMMENT ON TABLE analytics IS 'Stores user analytics and usage metrics';
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON TABLE support_tickets IS 'Customer support tickets and inquiries';
