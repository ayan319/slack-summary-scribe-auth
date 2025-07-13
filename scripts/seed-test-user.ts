#!/usr/bin/env tsx

/**
 * Seed Test User Script
 * 
 * This script creates a test user in Supabase for development and testing.
 * Run with: npx tsx scripts/seed-test-user.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
  name: 'Test User'
}

async function seedTestUser() {
  console.log('🌱 Seeding test user...')

  try {
    // Check if user already exists by trying to sign them in
    console.log('🔍 Checking if test user already exists...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password
    })

    if (signInData.user && !signInError) {
      console.log('✅ Test user already exists and can sign in:', TEST_USER.email)
      console.log('   User ID:', signInData.user.id)
      await supabase.auth.signOut() // Clean up the session
      return signInData.user
    }

    // Create new user using the regular signup flow
    console.log('👤 Creating new test user...')
    const { data: newUser, error: createError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        data: {
          name: TEST_USER.name
        }
      }
    })

    if (createError) {
      throw createError
    }

    if (!newUser.user) {
      throw new Error('Failed to create user')
    }

    console.log('✅ Test user created successfully!')
    console.log('   Email:', TEST_USER.email)
    console.log('   Password:', TEST_USER.password)
    console.log('   User ID:', newUser.user.id)

    // If email confirmation is required, we'll need to handle that
    if (!newUser.session) {
      console.log('📧 Email confirmation may be required')
      console.log('   Check your Supabase settings to disable email confirmation for development')
    }

    // Create user record in users table
    console.log('📝 Creating user record in users table...')
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: newUser.user.id,
        email: TEST_USER.email,
        name: TEST_USER.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (insertError) {
      console.warn('⚠️ Could not create user record:', insertError.message)
    } else {
      console.log('✅ User record created in users table')
    }

    // Clean up any session
    await supabase.auth.signOut()

    return newUser.user

  } catch (error) {
    console.error('❌ Error seeding test user:', error)
    process.exit(1)
  }
}

async function main() {
  console.log('🚀 Starting test user seed script...')
  console.log('📍 Supabase URL:', supabaseUrl)
  
  await seedTestUser()
  
  console.log('\n🎉 Test user seed completed!')
  console.log('\n📋 Test Credentials:')
  console.log('   Email:', TEST_USER.email)
  console.log('   Password:', TEST_USER.password)
  console.log('\n💡 You can now use these credentials to test login functionality.')
}

if (require.main === module) {
  main().catch(console.error)
}

export { seedTestUser, TEST_USER }
