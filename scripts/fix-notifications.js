#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixNotificationsSchema() {
  console.log('🔧 Fixing notifications table schema...');
  
  try {
    // Read and execute the migration
    const migrationPath = path.join(__dirname, '../supabase/migrations/999_fix_notifications_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error && !error.message.includes('already exists')) {
          console.warn('⚠️ SQL Warning:', error.message);
        }
      }
    }
    
    console.log('✅ Notifications schema fixed');
    return true;
  } catch (error) {
    console.error('❌ Error fixing schema:', error.message);
    return false;
  }
}

async function seedDemoNotifications() {
  console.log('🌱 Seeding demo notifications...');
  
  try {
    // Get a test user ID (create one if needed)
    const { data: users } = await supabase.auth.admin.listUsers();
    let testUserId;
    
    if (users && users.users.length > 0) {
      testUserId = users.users[0].id;
    } else {
      // Create a test user
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'testpassword123',
        email_confirm: true
      });
      
      if (error) {
        console.error('❌ Error creating test user:', error.message);
        return false;
      }
      
      testUserId = newUser.user.id;
    }
    
    console.log('👤 Using test user ID:', testUserId);
    
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
      console.error('❌ Error seeding notifications:', error.message);
      return false;
    }
    
    console.log(`✅ Created ${createdNotifications.length} demo notifications`);
    return true;
  } catch (error) {
    console.error('❌ Error seeding demo notifications:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting notifications fix and seed process...\n');
  
  const schemaFixed = await fixNotificationsSchema();
  if (!schemaFixed) {
    console.error('❌ Failed to fix schema, aborting');
    process.exit(1);
  }
  
  const seeded = await seedDemoNotifications();
  if (!seeded) {
    console.error('❌ Failed to seed demo data');
    process.exit(1);
  }
  
  console.log('\n✅ Notifications system fixed and seeded successfully!');
  console.log('🔄 Please restart your development server');
}

main().catch(console.error);
