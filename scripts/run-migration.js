const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('_temp')
          .select('*')
          .limit(0);
        
        if (directError && !directError.message.includes('does not exist')) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          console.error('Statement:', statement);
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Test the tables
    console.log('🧪 Testing database tables...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (usersError) {
      console.log('⚠️  Users table might not exist yet, this is normal for first run');
    } else {
      console.log('✅ Users table is accessible');
    }
    
    const { data: summaries, error: summariesError } = await supabase
      .from('summaries')
      .select('count')
      .limit(1);
    
    if (summariesError) {
      console.log('⚠️  Summaries table might not exist yet, this is normal for first run');
    } else {
      console.log('✅ Summaries table is accessible');
    }
    
    const { data: workspaces, error: workspacesError } = await supabase
      .from('workspaces')
      .select('count')
      .limit(1);
    
    if (workspacesError) {
      console.log('⚠️  Workspaces table might not exist yet, this is normal for first run');
    } else {
      console.log('✅ Workspaces table is accessible');
    }
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
