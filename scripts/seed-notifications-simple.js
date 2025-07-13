#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedDemoNotifications() {
  console.log('🌱 Seeding demo notifications...');
  
  try {
    // First, check if notifications table exists
    const { data: tables, error: tableError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log('📋 Creating notifications table...');
      
      // Create the table using raw SQL
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          type TEXT NOT NULL DEFAULT 'info',
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          data JSONB DEFAULT '{}',
          read_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
      `;
      
      const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });
      if (createError) {
        console.log('⚠️ Table creation warning (may already exist):', createError.message);
      }
    }
    
    // Get a test user ID
    const testUserId = 'add47a1f-192a-4c74-8a98-602ae98f3ffb'; // From the previous output
    
    console.log('👤 Using test user ID:', testUserId);
    
    // Clear existing notifications for this user
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', testUserId);
    
    // Create demo notifications
    const demoNotifications = [
      {
        user_id: testUserId,
        type: 'welcome',
        title: '🎉 Welcome to Slack Summary Scribe!',
        message: 'Your AI-powered summarization tool is ready. Start by connecting your Slack workspace.',
        data: { action: 'connect_slack', priority: 'high' }
      },
      {
        user_id: testUserId,
        type: 'feature',
        title: '🤖 Try Premium AI Models',
        message: 'Upgrade to Pro for access to GPT-4o and Claude 3.5 Sonnet for superior summary quality.',
        data: { action: 'upgrade_plan', priority: 'medium' }
      },
      {
        user_id: testUserId,
        type: 'tip',
        title: '📊 Explore Your Dashboard',
        message: 'Check out your analytics, manage integrations, and customize your AI preferences.',
        data: { action: 'explore_dashboard', priority: 'low' }
      },
      {
        user_id: testUserId,
        type: 'system',
        title: '🔧 System Update',
        message: 'New features added: CRM integrations, enhanced analytics, and mobile optimization.',
        data: { action: 'view_changelog', priority: 'medium' }
      },
      {
        user_id: testUserId,
        type: 'upload_complete',
        title: '📄 File Upload Complete',
        message: 'Your document "meeting-notes.pdf" has been processed and summarized.',
        data: { fileName: 'meeting-notes.pdf', summaryId: 'demo-123', priority: 'high' },
        read_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago, marked as read
      }
    ];
    
    const { data: createdNotifications, error } = await supabase
      .from('notifications')
      .insert(demoNotifications)
      .select();
    
    if (error) {
      console.error('❌ Error seeding notifications:', error);
      return false;
    }
    
    console.log(`✅ Created ${createdNotifications.length} demo notifications`);
    
    // Verify the data
    const { data: allNotifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId);
    
    console.log(`📊 Total notifications for user: ${allNotifications?.length || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error seeding demo notifications:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting notifications seed process...\n');
  
  const seeded = await seedDemoNotifications();
  if (!seeded) {
    console.error('❌ Failed to seed demo data');
    process.exit(1);
  }
  
  console.log('\n✅ Notifications seeded successfully!');
  console.log('🔄 Please restart your development server');
}

main().catch(console.error);
