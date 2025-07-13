#!/usr/bin/env node

/**
 * Seed demo data for E2E testing
 * Creates comprehensive demo data for test user: mohammadayan5442@gmail.com
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding...');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  const testUserEmail = 'mohammadayan5442@gmail.com';
  
  try {
    // Check if test user exists in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      process.exit(1);
    }
    
    const testUser = authUsers.users.find(user => user.email === testUserEmail);
    
    if (!testUser) {
      console.error(`❌ Test user ${testUserEmail} not found in auth.users`);
      console.log('Please ensure the user is registered first.');
      process.exit(1);
    }
    
    const testUserId = testUser.id;
    console.log(`✅ Found test user: ${testUser.email} (${testUserId})`);
    
    // Clean existing data for fresh start
    console.log('🧹 Cleaning existing demo data...');
    
    await supabase.from('exports').delete().eq('user_id', testUserId);
    await supabase.from('file_uploads').delete().eq('user_id', testUserId);
    await supabase.from('notifications').delete().eq('user_id', testUserId);
    await supabase.from('summaries').delete().eq('user_id', testUserId);
    await supabase.from('slack_integrations').delete().eq('user_id', testUserId);
    
    // Get user organizations to clean
    const { data: userOrgs } = await supabase
      .from('user_organizations')
      .select('organization_id')
      .eq('user_id', testUserId);
    
    if (userOrgs && userOrgs.length > 0) {
      const orgIds = userOrgs.map(uo => uo.organization_id);
      await supabase.from('user_organizations').delete().eq('user_id', testUserId);
      await supabase.from('organizations').delete().in('id', orgIds);
    }
    
    console.log('✅ Cleaned existing data');
    
    // Create user profile
    console.log('👤 Creating user profile...');
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        name: 'Ayan',
        email: testUserEmail,
        password_hash: '$2a$12$dummy.hash.for.testing.purposes.only'
      });
    
    if (userError) {
      console.error('❌ Error creating user profile:', userError);
      process.exit(1);
    }
    
    console.log('✅ User profile created');
    
    // Create organization
    console.log('🏢 Creating organization...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Ayan\'s Test Workspace'
      })
      .select()
      .single();
    
    if (orgError) {
      console.error('❌ Error creating organization:', orgError);
      process.exit(1);
    }
    
    const testOrgId = orgData.id;
    console.log(`✅ Organization created: ${orgData.name} (${testOrgId})`);
    
    // Add user to organization
    const { error: userOrgError } = await supabase
      .from('user_organizations')
      .insert({
        user_id: testUserId,
        organization_id: testOrgId,
        role: 'owner'
      });
    
    if (userOrgError) {
      console.error('❌ Error adding user to organization:', userOrgError);
      process.exit(1);
    }
    
    console.log('✅ User added to organization as owner');
    
    // Try to create Slack integration (may not exist in current schema)
    console.log('💬 Attempting to create Slack integration...');
    try {
      const { error: slackError } = await supabase
        .from('slack_integrations')
        .insert({
          user_id: testUserId,
          organization_id: testOrgId,
          slack_team_id: 'T1234567890',
          slack_team_name: 'Ayan\'s Test Team',
          access_token: 'xoxp-test-token-12345'
        });

      if (slackError) {
        console.warn('⚠️ Slack integration creation failed (table may not exist):', slackError.message);
      } else {
        console.log('✅ Slack integration created');
      }
    } catch (err) {
      console.warn('⚠️ Slack integration table may not exist, skipping...');
    }
    
    console.log('📝 Creating demo summaries...');

    // Create demo summaries (using basic schema - title, content, user_id)
    const summariesData = [
      {
        user_id: testUserId,
        title: 'Weekly Team Standup - Sprint Planning',
        content: 'Team discussed upcoming sprint goals and task assignments. Key decisions made on architecture changes and timeline adjustments. Sarah will lead the frontend redesign, Mike will handle backend optimizations, and Lisa will focus on testing automation. Action items: 1) Finalize API specifications by Friday, 2) Set up new testing environment, 3) Review security protocols.',
        channel_name: 'general'
      },
      {
        user_id: testUserId,
        title: 'Product Launch Discussion - Q1 2024',
        content: 'Comprehensive review of the upcoming product launch. Marketing strategy finalized, launch date confirmed for March 15th. Need to coordinate with sales team and prepare customer support documentation. Budget approved for additional marketing spend. Press release draft completed.',
        channel_name: 'product'
      },
      {
        user_id: testUserId,
        title: 'Technical Architecture Review - Microservices Migration',
        content: 'Deep dive into system architecture improvements. Discussed microservices migration timeline, database optimization strategies, and security enhancements. Decided to implement Redis caching and upgrade to PostgreSQL 15. Performance benchmarks show 40% improvement potential.',
        channel_name: 'engineering'
      }
    ];

    const { data: summaries, error: summariesError } = await supabase
      .from('summaries')
      .insert(summariesData)
      .select();

    if (summariesError) {
      console.error('❌ Error creating summaries:', summariesError);
      process.exit(1);
    }

    console.log(`✅ Created ${summaries.length} demo summaries`);

    // Try to create demo notifications (may not exist in current schema)
    console.log('🔔 Attempting to create demo notifications...');

    try {
      const notificationsData = [
        {
          user_id: testUserId,
          type: 'summary_created',
          title: 'New Summary Generated',
          message: 'Your Slack conversation from #general has been summarized'
        },
        {
          user_id: testUserId,
          type: 'export_completed',
          title: 'PDF Export Ready',
          message: 'Your summary export to PDF has been completed and is ready for download'
        },
        {
          user_id: testUserId,
          type: 'slack_connected',
          title: 'Slack Integration Active',
          message: 'Your Slack workspace has been successfully connected'
        }
      ];

      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .insert(notificationsData)
        .select();

      if (notificationsError) {
        console.warn('⚠️ Notifications creation failed (table may not exist):', notificationsError.message);
      } else {
        console.log(`✅ Created ${notifications.length} demo notifications`);
      }
    } catch (err) {
      console.warn('⚠️ Notifications table may not exist, skipping...');
    }

    // Skip file uploads for now as table may not exist
    console.log('📁 Skipping file uploads (table may not exist in current schema)');

    console.log('\n🎉 Demo data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - User: Ayan (${testUserEmail})`);
    console.log(`   - Organization: Ayan's Test Workspace`);
    console.log(`   - Summaries: ${summaries.length}`);
    console.log(`   - Basic demo data created for E2E testing`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  seedDemoData().catch(console.error);
}

module.exports = { seedDemoData };
