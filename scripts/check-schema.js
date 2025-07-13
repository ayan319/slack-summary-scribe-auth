#!/usr/bin/env node

/**
 * Check current database schema
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  console.log('🔍 Checking current database schema...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Check what tables exist
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          ORDER BY table_name;
        `
      });
    
    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError);
    } else {
      console.log('📋 Tables in database:', tables);
    }
    
    // Check users table structure
    const { data: usersCols, error: usersError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (usersError) {
      console.error('❌ Error checking users table:', usersError);
    } else {
      console.log('👤 Users table columns:', usersCols);
    }
    
    // Check summaries table structure
    const { data: summariesCols, error: summariesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'summaries' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (summariesError) {
      console.error('❌ Error checking summaries table:', summariesError);
    } else {
      console.log('📝 Summaries table columns:', summariesCols);
    }
    
    // Check notifications table structure
    const { data: notificationsCols, error: notificationsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'notifications' AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });
    
    if (notificationsError) {
      console.error('❌ Error checking notifications table:', notificationsError);
    } else {
      console.log('🔔 Notifications table columns:', notificationsCols);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkSchema().catch(console.error);
