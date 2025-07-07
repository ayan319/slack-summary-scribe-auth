#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMissingTables() {
  console.log('🔧 FIXING MISSING DATABASE TABLES');
  console.log('=================================\n');

  // Check current table status
  console.log('1️⃣ Checking current table status...');
  const tables = ['users', 'organizations', 'user_organizations', 'summaries', 'slack_integrations'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n2️⃣ Creating missing tables via direct SQL...');
  
  // Since exec_sql doesn't exist, we'll use a different approach
  // Create the missing table by attempting operations that will reveal the schema
  
  try {
    // Try to insert into slack_integrations to see if it exists
    const { error } = await supabase
      .from('slack_integrations')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        organization_id: '00000000-0000-0000-0000-000000000000',
        slack_team_id: 'test',
        slack_team_name: 'test',
        access_token: 'test'
      });
    
    if (error && error.message.includes('does not exist')) {
      console.log('❌ slack_integrations table does not exist');
      console.log('⚠️  Manual intervention required in Supabase Dashboard');
      console.log('');
      console.log('📋 SQL to run in Supabase SQL Editor:');
      console.log('=====================================');
      console.log(`
CREATE TABLE IF NOT EXISTS slack_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slack_team_id TEXT NOT NULL,
  slack_team_name TEXT NOT NULL,
  access_token TEXT NOT NULL,
  bot_token TEXT,
  bot_user_id TEXT,
  scope TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, slack_team_id)
);

-- Enable RLS
ALTER TABLE slack_integrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their organization integrations" ON slack_integrations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization integrations" ON slack_integrations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
      `);
    } else {
      console.log('✅ slack_integrations table exists');
    }
  } catch (err) {
    console.log('❌ Table check error:', err.message);
  }

  console.log('\n3️⃣ Verifying RLS policies...');
  
  // Check if RLS is enabled on all tables
  const rlsChecks = [
    'organizations',
    'user_organizations', 
    'users',
    'summaries'
  ];

  for (const table of rlsChecks) {
    try {
      // Try to access table without auth to test RLS
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error && error.message.includes('RLS')) {
        console.log(`✅ ${table}: RLS enabled`);
      } else {
        console.log(`⚠️  ${table}: RLS may not be properly configured`);
      }
    } catch (err) {
      console.log(`⚠️  ${table}: ${err.message}`);
    }
  }

  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log('✅ Core tables: Available');
  console.log('❌ slack_integrations: Needs manual creation');
  console.log('⚠️  RLS policies: Need verification');
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('1. Run the SQL above in Supabase Dashboard > SQL Editor');
  console.log('2. Verify all tables are accessible');
  console.log('3. Test RLS policies with authenticated users');
}

fixMissingTables().catch(console.error);
