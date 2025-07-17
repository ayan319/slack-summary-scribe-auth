#!/usr/bin/env node

/**
 * Local Development Test Script
 * Tests local development environment for SSL and infinite loading issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 LOCAL DEVELOPMENT TEST - SSL & INFINITE LOADING FIX');
console.log('======================================================\n');

let allTestsPassed = true;

// Test 1: Check .env.local configuration
console.log('1️⃣ Testing .env.local configuration...');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  // Check for HTTP localhost URLs
  const hasHttpLocalhost = envContent.includes('NEXT_PUBLIC_SITE_URL=http://localhost:3000') &&
                           envContent.includes('NEXTAUTH_URL=http://localhost:3000') &&
                           envContent.includes('NODE_ENV=development');
  
  if (hasHttpLocalhost) {
    console.log('✅ Environment configured for local HTTP development');
  } else {
    console.log('❌ Environment not configured for local development');
    console.log('   Expected: HTTP localhost URLs and NODE_ENV=development');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('❌ .env.local file not found or readable');
  allTestsPassed = false;
}

// Test 2: Check user-context.tsx timeout
console.log('\n2️⃣ Testing user-context.tsx timeout configuration...');
try {
  const userContextContent = fs.readFileSync('lib/user-context.tsx', 'utf8');
  
  const hasTimeout = userContextContent.includes('15000') && 
                     userContextContent.includes('User fetch timeout after 15 seconds');
  
  if (hasTimeout) {
    console.log('✅ 15-second timeout configured in user-context.tsx');
  } else {
    console.log('❌ 15-second timeout not found in user-context.tsx');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('❌ user-context.tsx file not found or readable');
  allTestsPassed = false;
}

// Test 3: Check auth.ts for relative paths
console.log('\n3️⃣ Testing auth.ts for proper redirect configuration...');
try {
  const authContent = fs.readFileSync('lib/auth.ts', 'utf8');
  
  const hasProperRedirects = authContent.includes('window.location.origin') &&
                             !authContent.includes('https://localhost') &&
                             !authContent.includes('http://localhost:3000/dashboard');
  
  if (hasProperRedirects) {
    console.log('✅ Auth redirects use dynamic origin (no hardcoded URLs)');
  } else {
    console.log('❌ Auth redirects may have hardcoded URLs');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('❌ auth.ts file not found or readable');
  allTestsPassed = false;
}

// Test 4: Check AuthGuard for relative paths
console.log('\n4️⃣ Testing AuthGuard for relative path usage...');
try {
  const authGuardContent = fs.readFileSync('components/AuthGuard.tsx', 'utf8');
  
  const hasRelativePaths = authGuardContent.includes("redirectTo = '/login'") &&
                           authGuardContent.includes("'/dashboard'") &&
                           !authGuardContent.includes('http://') &&
                           !authGuardContent.includes('https://');
  
  if (hasRelativePaths) {
    console.log('✅ AuthGuard uses relative paths for redirects');
  } else {
    console.log('❌ AuthGuard may have absolute URLs in redirects');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('❌ AuthGuard.tsx file not found or readable');
  allTestsPassed = false;
}

// Test 5: Check middleware configuration
console.log('\n5️⃣ Testing middleware configuration...');
try {
  const middlewareContent = fs.readFileSync('middleware.ts', 'utf8');
  
  const hasProperConfig = middlewareContent.includes('PUBLIC_ROUTES') &&
                          middlewareContent.includes('PROTECTED_ROUTES') &&
                          middlewareContent.includes('/dashboard');
  
  if (hasProperConfig) {
    console.log('✅ Middleware properly configured for route protection');
  } else {
    console.log('❌ Middleware configuration may be incomplete');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('❌ middleware.ts file not found or readable');
  allTestsPassed = false;
}

// Test 6: Check for common infinite loading patterns
console.log('\n6️⃣ Testing for infinite loading prevention...');
try {
  const dashboardContent = fs.readFileSync('app/dashboard/page.tsx', 'utf8');
  
  const hasAuthGuard = dashboardContent.includes('<AuthGuard>') &&
                       dashboardContent.includes('</AuthGuard>');
  
  if (hasAuthGuard) {
    console.log('✅ Dashboard properly wrapped with AuthGuard');
  } else {
    console.log('❌ Dashboard missing AuthGuard wrapper');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('❌ dashboard/page.tsx file not found or readable');
  allTestsPassed = false;
}

// Test 7: Check package.json for dev script
console.log('\n7️⃣ Testing package.json dev script...');
try {
  const packageContent = fs.readFileSync('package.json', 'utf8');
  const packageJson = JSON.parse(packageContent);
  
  const hasDevScript = packageJson.scripts && packageJson.scripts.dev;
  
  if (hasDevScript) {
    console.log('✅ Dev script found in package.json');
    console.log(`   Command: ${packageJson.scripts.dev}`);
  } else {
    console.log('❌ Dev script not found in package.json');
    allTestsPassed = false;
  }
} catch (error) {
  console.log('❌ package.json file not found or readable');
  allTestsPassed = false;
}

// Final Results
console.log('\n======================================================');
console.log('🔧 LOCAL DEVELOPMENT TEST RESULTS');
console.log('======================================================');

if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED - LOCAL DEVELOPMENT READY!');
  console.log('');
  console.log('✅ Environment configured for HTTP localhost');
  console.log('✅ 15-second timeout prevents infinite loading');
  console.log('✅ Auth system uses relative paths');
  console.log('✅ Middleware properly configured');
  console.log('✅ Dashboard protected with AuthGuard');
  console.log('');
  console.log('🚀 READY TO START LOCAL DEVELOPMENT:');
  console.log('   npm run dev');
  console.log('   Open: http://localhost:3000');
  console.log('');
  console.log('🔍 TEST FLOW:');
  console.log('   1. Visit http://localhost:3000');
  console.log('   2. Click "Sign Up" or "Login"');
  console.log('   3. Complete signup/login process');
  console.log('   4. Should redirect to dashboard without infinite loading');
  console.log('   5. Check browser console for no SSL/fetch errors');
} else {
  console.log('❌ SOME TESTS FAILED - NEEDS ATTENTION');
  console.log('');
  console.log('🔧 FIXES NEEDED:');
  console.log('   - Update .env.local with HTTP localhost URLs');
  console.log('   - Ensure 15-second timeout in user-context.tsx');
  console.log('   - Use relative paths in auth components');
  console.log('   - Verify middleware configuration');
  console.log('');
  console.log('📖 TROUBLESHOOTING:');
  console.log('   - Check console for specific error messages');
  console.log('   - Verify Supabase configuration');
  console.log('   - Test auth flow step by step');
}

console.log('\n🏁 Local development test complete!');

process.exit(allTestsPassed ? 0 : 1);
