#!/usr/bin/env node

/**
 * Local Development Auth Debug Script
 * Helps diagnose infinite loading and SSL issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 LOCAL AUTH DEBUG - SSL & INFINITE LOADING DIAGNOSIS');
console.log('=======================================================\n');

let issuesFound = [];

// Test 1: Check environment configuration
console.log('1️⃣ Checking environment configuration...');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SITE_URL',
    'NEXTAUTH_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !envContent.includes(varName));
  
  if (missingVars.length > 0) {
    issuesFound.push(`Missing environment variables: ${missingVars.join(', ')}`);
    console.log('❌ Missing required environment variables:', missingVars);
  } else {
    console.log('✅ All required environment variables present');
  }
  
  // Check for HTTP localhost configuration
  const hasHttpLocalhost = envContent.includes('NEXT_PUBLIC_SITE_URL=http://localhost:') &&
                           envContent.includes('NEXTAUTH_URL=http://localhost:');
  
  if (!hasHttpLocalhost) {
    issuesFound.push('Environment not configured for HTTP localhost');
    console.log('❌ Environment not configured for HTTP localhost');
  } else {
    console.log('✅ Environment configured for HTTP localhost');
  }
  
} catch (error) {
  issuesFound.push('.env.local file not found or readable');
  console.log('❌ .env.local file not found or readable');
}

// Test 2: Check Supabase client configuration
console.log('\n2️⃣ Checking Supabase client configuration...');
try {
  const supabaseContent = fs.readFileSync('lib/supabase.ts', 'utf8');
  
  const hasEnhancedConfig = supabaseContent.includes('cookieOptions') &&
                           supabaseContent.includes('secure: process.env.NODE_ENV === \'production\'');
  
  if (hasEnhancedConfig) {
    console.log('✅ Supabase client has enhanced cookie configuration');
  } else {
    issuesFound.push('Supabase client missing enhanced cookie configuration');
    console.log('❌ Supabase client missing enhanced cookie configuration');
  }
  
} catch (error) {
  issuesFound.push('lib/supabase.ts file not found or readable');
  console.log('❌ lib/supabase.ts file not found or readable');
}

// Test 3: Check user context timeout protection
console.log('\n3️⃣ Checking user context timeout protection...');
try {
  const userContextContent = fs.readFileSync('lib/user-context.tsx', 'utf8');
  
  const hasTimeoutProtection = userContextContent.includes('15000') &&
                              userContextContent.includes('fallbackTimeout');
  
  if (hasTimeoutProtection) {
    console.log('✅ User context has timeout protection');
  } else {
    issuesFound.push('User context missing timeout protection');
    console.log('❌ User context missing timeout protection');
  }
  
  const hasDebugLogging = userContextContent.includes('Session debug:') &&
                         userContextContent.includes('Auth cookies:');
  
  if (hasDebugLogging) {
    console.log('✅ User context has debug logging');
  } else {
    issuesFound.push('User context missing debug logging');
    console.log('❌ User context missing debug logging');
  }
  
} catch (error) {
  issuesFound.push('lib/user-context.tsx file not found or readable');
  console.log('❌ lib/user-context.tsx file not found or readable');
}

// Test 4: Check AuthGuard timeout protection
console.log('\n4️⃣ Checking AuthGuard timeout protection...');
try {
  const authGuardContent = fs.readFileSync('components/AuthGuard.tsx', 'utf8');
  
  const hasTimeoutProtection = authGuardContent.includes('10000') &&
                              authGuardContent.includes('Timeout reached');
  
  if (hasTimeoutProtection) {
    console.log('✅ AuthGuard has timeout protection');
  } else {
    issuesFound.push('AuthGuard missing timeout protection');
    console.log('❌ AuthGuard missing timeout protection');
  }
  
} catch (error) {
  issuesFound.push('components/AuthGuard.tsx file not found or readable');
  console.log('❌ components/AuthGuard.tsx file not found or readable');
}

// Test 5: Check for SessionDebug component
console.log('\n5️⃣ Checking for SessionDebug component...');
try {
  const sessionDebugExists = fs.existsSync('components/SessionDebug.tsx');
  
  if (sessionDebugExists) {
    console.log('✅ SessionDebug component exists');
  } else {
    issuesFound.push('SessionDebug component missing');
    console.log('❌ SessionDebug component missing');
  }
  
} catch (error) {
  issuesFound.push('Error checking SessionDebug component');
  console.log('❌ Error checking SessionDebug component');
}

// Test 6: Check middleware configuration
console.log('\n6️⃣ Checking middleware configuration...');
try {
  const middlewareContent = fs.readFileSync('middleware.ts', 'utf8');
  
  const hasProperRoutes = middlewareContent.includes('PUBLIC_ROUTES') &&
                         middlewareContent.includes('PROTECTED_ROUTES') &&
                         middlewareContent.includes('/dashboard');
  
  if (hasProperRoutes) {
    console.log('✅ Middleware has proper route configuration');
  } else {
    issuesFound.push('Middleware missing proper route configuration');
    console.log('❌ Middleware missing proper route configuration');
  }
  
} catch (error) {
  issuesFound.push('middleware.ts file not found or readable');
  console.log('❌ middleware.ts file not found or readable');
}

// Final Results
console.log('\n=======================================================');
console.log('🔍 LOCAL AUTH DEBUG RESULTS');
console.log('=======================================================');

if (issuesFound.length === 0) {
  console.log('🎉 ALL CHECKS PASSED - LOCAL AUTH SHOULD WORK!');
  console.log('');
  console.log('✅ Environment configured for HTTP localhost');
  console.log('✅ Supabase client has enhanced configuration');
  console.log('✅ User context has timeout protection');
  console.log('✅ AuthGuard has timeout protection');
  console.log('✅ SessionDebug component available');
  console.log('✅ Middleware properly configured');
  console.log('');
  console.log('🚀 READY TO TEST:');
  console.log('   1. npm run dev');
  console.log('   2. Open http://localhost:3001');
  console.log('   3. Try signup/login flow');
  console.log('   4. Check SessionDebug in bottom-right corner');
  console.log('   5. Monitor browser console for debug logs');
} else {
  console.log('❌ ISSUES FOUND - NEEDS ATTENTION');
  console.log('');
  console.log('🔧 ISSUES TO FIX:');
  issuesFound.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
  console.log('');
  console.log('📖 TROUBLESHOOTING STEPS:');
  console.log('   1. Fix the issues listed above');
  console.log('   2. Restart the development server');
  console.log('   3. Clear browser cache and cookies');
  console.log('   4. Test in incognito mode');
  console.log('   5. Check browser console for errors');
}

console.log('\n🏁 Debug analysis complete!');

process.exit(issuesFound.length === 0 ? 0 : 1);
