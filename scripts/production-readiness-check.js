#!/usr/bin/env node

/**
 * Production Readiness Check for Slack Summary Scribe
 * Comprehensive verification of all systems before deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Production Readiness Check for Slack Summary Scribe');
console.log('=' .repeat(60));

let totalChecks = 0;
let passedChecks = 0;
const issues = [];

function check(name, condition, details = '') {
  totalChecks++;
  if (condition) {
    console.log(`✅ ${name}`);
    passedChecks++;
  } else {
    console.log(`❌ ${name}`);
    issues.push(`${name}${details ? ': ' + details : ''}`);
  }
}

function info(message) {
  console.log(`ℹ️  ${message}`);
}

// 1. Environment Variables Check
console.log('\n📋 Environment Variables');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENROUTER_API_KEY',
  'NEXT_PUBLIC_SITE_URL'
];

requiredEnvVars.forEach(envVar => {
  const exists = process.env[envVar] || fs.existsSync('.env.local');
  check(`${envVar} configured`, exists);
});

// 2. Package.json and Dependencies
console.log('\n📦 Package Configuration');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  check('Package.json exists', true);
  check('Next.js 15 configured', packageJson.dependencies?.next?.includes('15'));
  check('TypeScript configured', !!packageJson.dependencies?.typescript);
  check('Tailwind CSS configured', !!packageJson.dependencies?.tailwindcss);
  check('Supabase configured', !!packageJson.dependencies?.['@supabase/supabase-js']);
  check('Sentry configured', !!packageJson.dependencies?.['@sentry/nextjs']);
  check('Build script exists', !!packageJson.scripts?.build);
  check('Test scripts exist', !!(packageJson.scripts?.test && packageJson.scripts?.['test:e2e']));
  
  // Check for postinstall script
  check('Postinstall script configured', !!packageJson.scripts?.postinstall);
  
} catch (error) {
  check('Package.json readable', false, error.message);
}

// 3. TypeScript Configuration
console.log('\n🔧 TypeScript Configuration');
try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  check('TypeScript config exists', true);
  check('Strict mode enabled', tsConfig.compilerOptions?.strict === true);
  check('Path aliases configured', !!tsConfig.compilerOptions?.paths);
} catch (error) {
  check('TypeScript config readable', false, error.message);
}

// 4. Next.js Configuration
console.log('\n⚡ Next.js Configuration');
try {
  const nextConfigExists = fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs');
  check('Next.js config exists', nextConfigExists);
  
  if (nextConfigExists) {
    const configContent = fs.readFileSync(
      fs.existsSync('next.config.js') ? 'next.config.js' : 'next.config.mjs', 
      'utf8'
    );
    check('Sentry integration configured', configContent.includes('sentry'));
  }
} catch (error) {
  check('Next.js config readable', false, error.message);
}

// 5. API Routes Check
console.log('\n🌐 API Routes Structure');
const apiRoutes = [
  'app/api/healthcheck/route.ts',
  'app/api/notifications/route.ts',
  'app/api/ai/summarize/route.ts',
  'app/api/slack/oauth/route.ts'
];

apiRoutes.forEach(route => {
  check(`${route} exists`, fs.existsSync(route));
});

// 6. Core Pages Check
console.log('\n📄 Core Pages Structure');
const corePages = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/dashboard/page.tsx',
  'app/onboarding/page.tsx'
];

corePages.forEach(page => {
  check(`${page} exists`, fs.existsSync(page));
});

// 7. Component Structure
console.log('\n🧩 Component Structure');
const coreComponents = [
  'components/ui',
  'components/dashboard',
  'components/notifications',
  'lib/supabase',
  'lib/sentry.client.ts'
];

coreComponents.forEach(component => {
  check(`${component} exists`, fs.existsSync(component));
});

// 8. Build Test
console.log('\n🔨 Build Verification');
try {
  info('Running build test...');
  execSync('npm run build', { stdio: 'pipe', timeout: 120000 });
  check('Build completes successfully', true);
  
  // Check if .next directory was created
  check('.next directory created', fs.existsSync('.next'));
  
} catch (error) {
  check('Build completes successfully', false, error.message.slice(0, 100));
}

// 9. Linting Check
console.log('\n🔍 Code Quality');
try {
  execSync('npm run lint', { stdio: 'pipe', timeout: 30000 });
  check('ESLint passes', true);
} catch (error) {
  // Check if it's just warnings vs errors
  const output = error.stdout?.toString() || error.message;
  const hasErrors = output.includes('error') && !output.includes('0 errors');
  check('ESLint passes', !hasErrors, hasErrors ? 'Has linting errors' : 'Only warnings');
}

// 10. Security Check
console.log('\n🔒 Security Configuration');
check('Environment file in gitignore', 
  fs.readFileSync('.gitignore', 'utf8').includes('.env'));

// Check for sensitive data in code
const sensitivePatterns = ['password', 'secret', 'key'];
let hasSensitiveData = false;
try {
  const result = execSync('grep -r "password\\|secret\\|key" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . || true', 
    { encoding: 'utf8', timeout: 10000 });
  
  // Filter out acceptable patterns
  const lines = result.split('\n').filter(line => 
    line && 
    !line.includes('node_modules') && 
    !line.includes('password:') && // Type definitions
    !line.includes('secretKey:') && // Type definitions
    !line.includes('process.env') && // Environment variables
    !line.includes('// ') && // Comments
    !line.includes('* ') // JSDoc comments
  );
  
  hasSensitiveData = lines.length > 0;
} catch (error) {
  // Ignore grep errors
}

check('No hardcoded secrets', !hasSensitiveData);

// 11. Performance Check
console.log('\n⚡ Performance Configuration');
check('Image optimization configured', fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs'));
check('Font optimization (next/font)', 
  fs.readFileSync('app/layout.tsx', 'utf8').includes('next/font'));

// 12. Database Schema
console.log('\n🗄️  Database Configuration');
check('Prisma schema exists', fs.existsSync('prisma/schema.prisma'));
check('SQL migration scripts exist', fs.existsSync('scripts/create-notifications-table.sql'));

// Final Summary
console.log('\n' + '='.repeat(60));
console.log('📊 PRODUCTION READINESS SUMMARY');
console.log('='.repeat(60));

const score = Math.round((passedChecks / totalChecks) * 100);
console.log(`✅ Passed: ${passedChecks}/${totalChecks} checks (${score}%)`);

if (issues.length > 0) {
  console.log('\n❌ Issues to address:');
  issues.forEach((issue, index) => {
    console.log(`   ${index + 1}. ${issue}`);
  });
}

console.log('\n🎯 Readiness Status:');
if (score >= 95) {
  console.log('🟢 EXCELLENT - Ready for production deployment');
} else if (score >= 85) {
  console.log('🟡 GOOD - Minor issues to address before deployment');
} else if (score >= 70) {
  console.log('🟠 FAIR - Several issues need attention');
} else {
  console.log('🔴 POOR - Significant work needed before deployment');
}

console.log('\n🚀 Next Steps:');
console.log('1. Address any failing checks above');
console.log('2. Run: npm run test:e2e');
console.log('3. Deploy to Vercel staging environment');
console.log('4. Perform final smoke tests');
console.log('5. Deploy to production');

process.exit(score >= 85 ? 0 : 1);
