#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingData() {
  console.log('🔍 CHECKING EXISTING DATABASE DATA');
  console.log('==================================\n');

  try {
    // Check users
    console.log('👤 USERS:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else {
      console.log(`   Found ${users.length} users:`);
      users.forEach(user => {
        console.log(`   - ${user.name} (${user.email})`);
      });
    }

    // Check organizations
    console.log('\n🏢 ORGANIZATIONS:');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*');
    
    if (orgsError) {
      console.log('❌ Error fetching organizations:', orgsError.message);
    } else {
      console.log(`   Found ${orgs.length} organizations:`);
      orgs.forEach(org => {
        console.log(`   - ${org.name} (${org.plan || 'free'})`);
      });
    }

    // Check summaries
    console.log('\n📝 SUMMARIES:');
    const { data: summaries, error: summariesError } = await supabase
      .from('summaries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (summariesError) {
      console.log('❌ Error fetching summaries:', summariesError.message);
    } else {
      console.log(`   Found ${summaries.length} summaries:`);
      summaries.forEach(summary => {
        const title = summary.title || 'Untitled';
        const date = new Date(summary.created_at).toLocaleDateString();
        console.log(`   - ${title} (${date})`);
      });
    }

    // Check notifications
    console.log('\n🔔 NOTIFICATIONS:');
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (notificationsError) {
      console.log('❌ Error fetching notifications:', notificationsError.message);
    } else {
      console.log(`   Found ${notifications.length} notifications`);
      if (notifications.length > 0) {
        notifications.slice(0, 3).forEach(notif => {
          const date = new Date(notif.created_at).toLocaleDateString();
          console.log(`   - ${notif.content} (${date})`);
        });
      }
    }

    // Check slack integrations
    console.log('\n💬 SLACK INTEGRATIONS:');
    const { data: slackIntegrations, error: slackError } = await supabase
      .from('slack_integrations')
      .select('*');
    
    if (slackError) {
      console.log('❌ Error fetching slack integrations:', slackError.message);
    } else {
      console.log(`   Found ${slackIntegrations.length} slack integrations`);
      if (slackIntegrations.length > 0) {
        slackIntegrations.forEach(integration => {
          console.log(`   - Team: ${integration.team_name || integration.team_id}`);
        });
      }
    }

    // Check auth users
    console.log('\n🔐 AUTH USERS:');
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
      if (authError) {
        console.log('❌ Error fetching auth users:', authError.message);
      } else {
        console.log(`   Found ${authData.users.length} auth users:`);
        authData.users.forEach(user => {
          console.log(`   - ${user.email} (${user.created_at.split('T')[0]})`);
        });
      }
    } catch (err) {
      console.log('❌ Auth users check failed:', err.message);
    }

    console.log('\n📊 DATA SUMMARY');
    console.log('===============');
    console.log(`Users: ${users?.length || 0}`);
    console.log(`Organizations: ${orgs?.length || 0}`);
    console.log(`Summaries: ${summaries?.length || 0}`);
    console.log(`Notifications: ${notifications?.length || 0}`);
    console.log(`Slack Integrations: ${slackIntegrations?.length || 0}`);

    // Determine if we need more data
    const hasMinimalData = (users?.length || 0) >= 1 && 
                          (orgs?.length || 0) >= 1 && 
                          (summaries?.length || 0) >= 3;

    console.log('\n🎯 RECOMMENDATIONS');
    console.log('==================');
    
    if (hasMinimalData) {
      console.log('✅ Database has sufficient data for dashboard testing');
      console.log('   → Dashboard should display existing summaries');
      console.log('   → Users can create new summaries');
      console.log('   → All features should be functional');
    } else {
      console.log('⚠️  Database needs more data for proper testing');
      console.log('   → Run: node scripts/seed-live-data.js');
      console.log('   → Add more realistic summaries and notifications');
    }

    return {
      users: users?.length || 0,
      organizations: orgs?.length || 0,
      summaries: summaries?.length || 0,
      notifications: notifications?.length || 0,
      slackIntegrations: slackIntegrations?.length || 0,
      hasMinimalData
    };

  } catch (error) {
    console.error('❌ Error checking data:', error);
    return null;
  }
}

if (require.main === module) {
  checkExistingData()
    .then(result => {
      if (result && result.hasMinimalData) {
        console.log('\n✅ Data check passed - ready for dashboard testing');
        process.exit(0);
      } else {
        console.log('\n⚠️  Data check indicates more seeding needed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Data check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkExistingData };
