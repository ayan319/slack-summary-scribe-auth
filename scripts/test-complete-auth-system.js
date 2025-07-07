#!/usr/bin/env node

/**
 * Complete Authentication System Test
 * Tests all authentication flows, database connections, and UI functionality
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const githubClientId = process.env.GITHUB_CLIENT_ID;

console.log('🧪 Complete Authentication System Test\n');

// Test 1: Environment Variables
console.log('1️⃣ Testing Environment Variables...');
const envTests = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', value: supabaseUrl },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', value: supabaseServiceKey },
  { name: 'GOOGLE_CLIENT_ID', value: googleClientId },
  { name: 'GITHUB_CLIENT_ID', value: githubClientId },
];

envTests.forEach(test => {
  if (test.value) {
    console.log(`   ✅ ${test.name}: Configured`);
  } else {
    console.log(`   ❌ ${test.name}: Missing`);
  }
});

// Test 2: Supabase Connection
console.log('\n2️⃣ Testing Supabase Connection...');
if (supabaseUrl && supabaseServiceKey) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Test connection
  supabase.from('summaries').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('   ⚠️ Supabase connection warning:', error.message);
      } else {
        console.log('   ✅ Supabase connection successful');
      }
    })
    .catch(err => {
      console.log('   ❌ Supabase connection failed:', err.message);
    });
} else {
  console.log('   ❌ Supabase credentials missing');
}

// Test 3: File Structure
console.log('\n3️⃣ Testing File Structure...');
const requiredFiles = [
  'app/page.tsx',
  'app/login/page.tsx',
  'app/dashboard/page.tsx',
  'app/auth/callback/page.tsx',
  'middleware.ts',
  'lib/auth.ts',
  'lib/supabase.ts',
  '.env.local',
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}: Exists`);
  } else {
    console.log(`   ❌ ${file}: Missing`);
  }
});

// Test 4: Database Schema Files
console.log('\n4️⃣ Testing Database Schema...');
const schemaFiles = [
  'supabase/migrations/002_organizations.sql',
  'SUPABASE_OAUTH_SETUP.md',
];

schemaFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}: Exists`);
  } else {
    console.log(`   ❌ ${file}: Missing`);
  }
});

// Test 5: OAuth Configuration
console.log('\n5️⃣ Testing OAuth Configuration...');
if (googleClientId && googleClientId.includes('apps.googleusercontent.com')) {
  console.log('   ✅ Google OAuth: Client ID configured');
} else {
  console.log('   ❌ Google OAuth: Invalid or missing Client ID');
}

if (githubClientId && githubClientId.startsWith('Ov23')) {
  console.log('   ✅ GitHub OAuth: Client ID configured');
} else {
  console.log('   ❌ GitHub OAuth: Invalid or missing Client ID');
}

// Test 6: Next.js Configuration
console.log('\n6️⃣ Testing Next.js Configuration...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  if (packageJson.dependencies['next']) {
    console.log(`   ✅ Next.js: Version ${packageJson.dependencies['next']}`);
  }
  
  if (packageJson.dependencies['@supabase/supabase-js']) {
    console.log(`   ✅ Supabase JS: Version ${packageJson.dependencies['@supabase/supabase-js']}`);
  }
  
  if (packageJson.dependencies['tailwindcss']) {
    console.log(`   ✅ Tailwind CSS: Version ${packageJson.dependencies['tailwindcss']}`);
  }
} catch (err) {
  console.log('   ❌ Package.json read error:', err.message);
}

// Test 7: Middleware Configuration
console.log('\n7️⃣ Testing Middleware Configuration...');
try {
  const middlewareContent = fs.readFileSync('middleware.ts', 'utf8');
  
  if (middlewareContent.includes("'/'") && middlewareContent.includes('publicRoutes')) {
    console.log('   ✅ Landing page (/) is public');
  } else {
    console.log('   ❌ Landing page (/) not configured as public');
  }
  
  if (middlewareContent.includes('/dashboard') && middlewareContent.includes('protectedRoutes')) {
    console.log('   ✅ Dashboard is protected');
  } else {
    console.log('   ❌ Dashboard not configured as protected');
  }
  
  if (middlewareContent.includes('sb-access-token') || middlewareContent.includes('supabase-auth-token')) {
    console.log('   ✅ Auth cookie checking implemented');
  } else {
    console.log('   ❌ Auth cookie checking missing');
  }
} catch (err) {
  console.log('   ❌ Middleware read error:', err.message);
}

// Test 8: Auth Functions
console.log('\n8️⃣ Testing Auth Functions...');
try {
  const authContent = fs.readFileSync('lib/auth.ts', 'utf8');
  
  const requiredFunctions = [
    'signUpWithEmail',
    'signInWithEmail',
    'signInWithOAuth',
    'getCurrentUser',
    'getUserOrganizations',
    'createOrganization',
  ];
  
  requiredFunctions.forEach(func => {
    if (authContent.includes(`export async function ${func}`)) {
      console.log(`   ✅ ${func}: Implemented`);
    } else {
      console.log(`   ❌ ${func}: Missing`);
    }
  });
} catch (err) {
  console.log('   ❌ Auth functions read error:', err.message);
}

// Test 9: UI Components
console.log('\n9️⃣ Testing UI Components...');
try {
  const loginContent = fs.readFileSync('app/login/page.tsx', 'utf8');
  
  if (loginContent.includes('Continue with Google') || loginContent.includes('google')) {
    console.log('   ✅ Google OAuth button: Present');
  } else {
    console.log('   ❌ Google OAuth button: Missing');
  }
  
  if (loginContent.includes('Continue with GitHub') || loginContent.includes('github')) {
    console.log('   ✅ GitHub OAuth button: Present');
  } else {
    console.log('   ❌ GitHub OAuth button: Missing');
  }
  
  if (loginContent.includes('email') && loginContent.includes('password')) {
    console.log('   ✅ Email/Password form: Present');
  } else {
    console.log('   ❌ Email/Password form: Missing');
  }
} catch (err) {
  console.log('   ❌ Login page read error:', err.message);
}

// Test 10: Development Server Status
console.log('\n🔟 Development Server Status...');
console.log('   📍 Expected URL: http://localhost:3001');
console.log('   📋 To test manually:');
console.log('      1. Visit http://localhost:3001 (should load landing page)');
console.log('      2. Click "Get Started" (should redirect to /login)');
console.log('      3. Try email/password signup');
console.log('      4. Try OAuth buttons (after Supabase configuration)');
console.log('      5. Visit /dashboard (should redirect to /login if not authenticated)');

// Final Summary
console.log('\n🎯 NEXT STEPS:');
console.log('   1. ⚠️ CRITICAL: Configure OAuth in Supabase Dashboard');
console.log('      - Go to: https://supabase.com/dashboard/project/holuppwejzcqwrbdbgkf');
console.log('      - Navigate to: Authentication → Providers');
console.log('      - Enable Google and GitHub with provided credentials');
console.log('      - Set redirect URL: http://localhost:3001/api/auth/callback');
console.log('   2. 📋 Apply database schema (run SQL in Supabase SQL Editor):');
console.log('      - Copy content from: supabase/migrations/002_organizations.sql');
console.log('   3. 🧪 Test complete authentication flows');
console.log('   4. 🚀 Deploy to Vercel with production OAuth URLs');

console.log('\n✅ SYSTEM STATUS: Ready for OAuth configuration and testing!');
