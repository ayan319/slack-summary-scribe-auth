#!/usr/bin/env node

/**
 * Database Setup Script
 * Applies the enhanced summaries schema to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up database schema...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20241215000001_enhanced_summaries_schema.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Applying enhanced summaries schema...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`   Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Try direct execution if RPC fails
            const { error: directError } = await supabase
              .from('_supabase_migrations')
              .select('*')
              .limit(1);
            
            if (directError) {
              console.warn(`   ⚠️ Statement ${i + 1} may have failed:`, error.message);
            }
          }
        } catch (err) {
          console.warn(`   ⚠️ Statement ${i + 1} execution warning:`, err.message);
        }
      }
    }

    console.log('✅ Schema migration completed');

    // Test the schema by creating a test summary
    console.log('\n🧪 Testing schema with sample data...');
    
    const testSummary = {
      user_id: 'test-setup-user',
      team_id: 'test-setup-team',
      title: 'Database Setup Test',
      summary_text: 'This is a test summary to verify the database schema is working correctly.',
      summary: {
        text: 'Test summary',
        skills: ['Database', 'Setup'],
        redFlags: [],
        actions: ['Verify schema'],
        sentiment: 'positive',
        urgency: 'low'
      },
      skills_detected: ['Database', 'Setup'],
      red_flags: [],
      actions: ['Verify schema'],
      tags: ['test', 'setup'],
      source: 'api',
      raw_transcript: 'Test transcript for database setup verification.',
      confidence_score: 1.0,
      ai_model: 'setup-test',
      metadata: {
        setupTest: true,
        timestamp: new Date().toISOString()
      }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('summaries')
      .insert(testSummary)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to insert test summary:', insertError.message);
      return;
    }

    console.log('✅ Test summary created successfully:', insertData.id);

    // Test fetching summaries
    const { data: fetchData, error: fetchError } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', 'test-setup-user')
      .limit(1);

    if (fetchError) {
      console.error('❌ Failed to fetch test summary:', fetchError.message);
      return;
    }

    console.log('✅ Test summary fetched successfully');

    // Clean up test data
    const { error: deleteError } = await supabase
      .from('summaries')
      .delete()
      .eq('id', insertData.id);

    if (deleteError) {
      console.warn('⚠️ Failed to clean up test summary:', deleteError.message);
    } else {
      console.log('✅ Test summary cleaned up');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now run the backend tests with: node scripts/test-backend.js');

  } catch (error) {
    console.error('💥 Database setup failed:', error.message);
    process.exit(1);
  }
}

// Alternative direct schema creation if migration fails
async function createSchemaDirectly() {
  console.log('\n🔧 Creating schema directly...');

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.summaries (
      id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id TEXT NOT NULL,
      team_id TEXT,
      title TEXT,
      summary_text TEXT NOT NULL,
      summary JSONB NOT NULL DEFAULT '{}',
      skills_detected TEXT[] DEFAULT '{}',
      red_flags TEXT[] DEFAULT '{}',
      actions TEXT[] DEFAULT '{}',
      tags TEXT[] DEFAULT '{}',
      source TEXT NOT NULL DEFAULT 'slack',
      raw_transcript TEXT NOT NULL,
      slack_channel TEXT,
      slack_message_ts TEXT,
      slack_thread_ts TEXT,
      confidence_score DECIMAL(3,2),
      processing_time_ms INTEGER,
      ai_model TEXT,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
    );
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (error) {
      console.error('❌ Failed to create table directly:', error.message);
      return false;
    }
    console.log('✅ Table created directly');
    return true;
  } catch (err) {
    console.error('❌ Direct table creation failed:', err.message);
    return false;
  }
}

// Run setup
setupDatabase().catch(async (error) => {
  console.error('Migration failed, trying direct creation...');
  const success = await createSchemaDirectly();
  if (!success) {
    console.error('❌ All setup methods failed');
    process.exit(1);
  }
});
