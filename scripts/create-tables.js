const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTables() {
  console.log('🚀 Creating database tables...');
  
  try {
    // Create users table
    console.log('📝 Creating users table...');
    const createUsersSQL = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: usersError } = await supabase.rpc('exec_sql', { 
      sql: createUsersSQL 
    });
    
    if (usersError) {
      console.log('⚠️ Users table creation error (might already exist):', usersError.message);
    } else {
      console.log('✅ Users table created');
    }
    
    // Create summaries table
    console.log('📝 Creating summaries table...');
    const createSummariesSQL = `
      CREATE TABLE IF NOT EXISTS summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        channel_name VARCHAR(255) NOT NULL,
        message_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: summariesError } = await supabase.rpc('exec_sql', { 
      sql: createSummariesSQL 
    });
    
    if (summariesError) {
      console.log('⚠️ Summaries table creation error (might already exist):', summariesError.message);
    } else {
      console.log('✅ Summaries table created');
    }
    
    // Create workspaces table
    console.log('📝 Creating workspaces table...');
    const createWorkspacesSQL = `
      CREATE TABLE IF NOT EXISTS workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slack_team_id VARCHAR(255) NOT NULL,
        connected BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    const { error: workspacesError } = await supabase.rpc('exec_sql', { 
      sql: createWorkspacesSQL 
    });
    
    if (workspacesError) {
      console.log('⚠️ Workspaces table creation error (might already exist):', workspacesError.message);
    } else {
      console.log('✅ Workspaces table created');
    }
    
    // Test the tables
    console.log('🧪 Testing tables...');
    
    const { data: usersTest, error: usersTestError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersTestError) {
      console.log('❌ Users table test failed:', usersTestError.message);
    } else {
      console.log('✅ Users table is working');
    }
    
    const { data: summariesTest, error: summariesTestError } = await supabase
      .from('summaries')
      .select('count')
      .limit(1);
    
    if (summariesTestError) {
      console.log('❌ Summaries table test failed:', summariesTestError.message);
    } else {
      console.log('✅ Summaries table is working');
    }
    
    const { data: workspacesTest, error: workspacesTestError } = await supabase
      .from('workspaces')
      .select('count')
      .limit(1);
    
    if (workspacesTestError) {
      console.log('❌ Workspaces table test failed:', workspacesTestError.message);
    } else {
      console.log('✅ Workspaces table is working');
    }
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Table creation failed:', error);
  }
}

createTables();
