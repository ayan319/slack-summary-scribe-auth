#!/usr/bin/env node

/**
 * Final Production Validation Script
 * Comprehensive validation of all systems before production launch
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

class ProductionValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  async runCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'pipe',
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      process.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      process.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0
        });
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async validateEnvironment() {
    log(colors.cyan, '\n🔍 Validating Environment Configuration...');
    
    const test = {
      name: 'Environment Configuration',
      passed: false,
      warnings: [],
      errors: []
    };

    try {
      // Check required environment variables
      const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENROUTER_API_KEY',
        'NEXTAUTH_SECRET'
      ];

      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        test.errors.push(`Missing environment variables: ${missingVars.join(', ')}`);
      } else {
        log(colors.green, '✅ All required environment variables present');
      }

      // Check environment file exists
      if (fs.existsSync('.env.local')) {
        log(colors.green, '✅ .env.local file exists');
      } else {
        test.warnings.push('.env.local file not found');
      }

      test.passed = test.errors.length === 0;
    } catch (error) {
      test.errors.push(`Environment validation error: ${error.message}`);
    }

    this.results.tests.push(test);
    if (test.passed) this.results.passed++;
    else this.results.failed++;
    this.results.warnings += test.warnings.length;

    return test.passed;
  }

  async validateLinting() {
    log(colors.cyan, '\n🔍 Running ESLint Validation...');
    
    const test = {
      name: 'ESLint Validation',
      passed: false,
      warnings: [],
      errors: []
    };

    try {
      const result = await this.runCommand('npm', ['run', 'lint']);
      
      if (result.success) {
        log(colors.green, '✅ ESLint validation passed');
        test.passed = true;
      } else {
        // Check if there are only warnings (exit code 0) vs errors
        const output = result.stdout + result.stderr;
        const errorCount = (output.match(/error/gi) || []).length;
        const warningCount = (output.match(/warning/gi) || []).length;
        
        if (errorCount === 0 && warningCount > 0) {
          log(colors.yellow, `⚠️ ESLint passed with ${warningCount} warnings`);
          test.passed = true;
          test.warnings.push(`${warningCount} ESLint warnings`);
        } else {
          log(colors.red, `❌ ESLint failed with ${errorCount} errors`);
          test.errors.push(`${errorCount} ESLint errors`);
        }
      }
    } catch (error) {
      test.errors.push(`ESLint validation error: ${error.message}`);
    }

    this.results.tests.push(test);
    if (test.passed) this.results.passed++;
    else this.results.failed++;
    this.results.warnings += test.warnings.length;

    return test.passed;
  }

  async validateBuild() {
    log(colors.cyan, '\n🔍 Running Build Validation...');
    
    const test = {
      name: 'Build Validation',
      passed: false,
      warnings: [],
      errors: []
    };

    try {
      log(colors.blue, '   Building application...');
      const result = await this.runCommand('npm', ['run', 'build']);
      
      if (result.success) {
        log(colors.green, '✅ Build completed successfully');
        test.passed = true;
        
        // Check if .next directory was created
        if (fs.existsSync('.next')) {
          log(colors.green, '✅ Build artifacts created');
        } else {
          test.warnings.push('Build artifacts not found');
        }
      } else {
        log(colors.red, '❌ Build failed');
        test.errors.push('Build compilation failed');
        
        // Log build errors for debugging
        if (result.stderr) {
          console.log('\nBuild errors:');
          console.log(result.stderr);
        }
      }
    } catch (error) {
      test.errors.push(`Build validation error: ${error.message}`);
    }

    this.results.tests.push(test);
    if (test.passed) this.results.passed++;
    else this.results.failed++;
    this.results.warnings += test.warnings.length;

    return test.passed;
  }

  async validateTypeScript() {
    log(colors.cyan, '\n🔍 Running TypeScript Validation...');
    
    const test = {
      name: 'TypeScript Validation',
      passed: false,
      warnings: [],
      errors: []
    };

    try {
      const result = await this.runCommand('npx', ['tsc', '--noEmit']);
      
      if (result.success) {
        log(colors.green, '✅ TypeScript validation passed');
        test.passed = true;
      } else {
        log(colors.red, '❌ TypeScript validation failed');
        test.errors.push('TypeScript compilation errors');
        
        // Log TypeScript errors for debugging
        if (result.stdout) {
          console.log('\nTypeScript errors:');
          console.log(result.stdout);
        }
      }
    } catch (error) {
      test.errors.push(`TypeScript validation error: ${error.message}`);
    }

    this.results.tests.push(test);
    if (test.passed) this.results.passed++;
    else this.results.failed++;
    this.results.warnings += test.warnings.length;

    return test.passed;
  }

  async validateDependencies() {
    log(colors.cyan, '\n🔍 Validating Dependencies...');
    
    const test = {
      name: 'Dependencies Validation',
      passed: false,
      warnings: [],
      errors: []
    };

    try {
      // Check if package.json exists
      if (!fs.existsSync('package.json')) {
        test.errors.push('package.json not found');
        this.results.tests.push(test);
        this.results.failed++;
        return false;
      }

      // Check if node_modules exists
      if (!fs.existsSync('node_modules')) {
        test.warnings.push('node_modules not found - run npm install');
      }

      // Check for security vulnerabilities
      try {
        const auditResult = await this.runCommand('npm', ['audit', '--audit-level', 'high']);
        if (auditResult.success) {
          log(colors.green, '✅ No high-severity vulnerabilities found');
        } else {
          test.warnings.push('Security vulnerabilities detected');
        }
      } catch (error) {
        test.warnings.push('Could not run security audit');
      }

      test.passed = test.errors.length === 0;
      log(colors.green, '✅ Dependencies validation completed');
    } catch (error) {
      test.errors.push(`Dependencies validation error: ${error.message}`);
    }

    this.results.tests.push(test);
    if (test.passed) this.results.passed++;
    else this.results.failed++;
    this.results.warnings += test.warnings.length;

    return test.passed;
  }

  async validateFileStructure() {
    log(colors.cyan, '\n🔍 Validating File Structure...');
    
    const test = {
      name: 'File Structure Validation',
      passed: false,
      warnings: [],
      errors: []
    };

    try {
      const requiredFiles = [
        'package.json',
        'next.config.mjs',
        'tailwind.config.ts',
        'tsconfig.json',
        'app/layout.tsx',
        'app/page.tsx',
        'app/login/page.tsx',
        'app/dashboard/page.tsx'
      ];

      const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
      
      if (missingFiles.length > 0) {
        test.errors.push(`Missing required files: ${missingFiles.join(', ')}`);
      } else {
        log(colors.green, '✅ All required files present');
      }

      // Check for critical directories
      const requiredDirs = ['app', 'components', 'lib'];
      const missingDirs = requiredDirs.filter(dir => !fs.existsSync(dir));
      
      if (missingDirs.length > 0) {
        test.errors.push(`Missing required directories: ${missingDirs.join(', ')}`);
      } else {
        log(colors.green, '✅ All required directories present');
      }

      test.passed = test.errors.length === 0;
    } catch (error) {
      test.errors.push(`File structure validation error: ${error.message}`);
    }

    this.results.tests.push(test);
    if (test.passed) this.results.passed++;
    else this.results.failed++;
    this.results.warnings += test.warnings.length;

    return test.passed;
  }

  generateReport() {
    log(colors.blue + colors.bold, '\n📊 Final Production Validation Report\n');
    
    const totalTests = this.results.tests.length;
    const passedTests = this.results.passed;
    const failedTests = this.results.failed;
    const warningCount = this.results.warnings;
    const successRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    log(colors.blue, `📋 Summary:`);
    log(colors.blue, `   Total Tests: ${totalTests}`);
    log(colors.green, `   Passed: ${passedTests}`);
    log(colors.red, `   Failed: ${failedTests}`);
    log(colors.yellow, `   Warnings: ${warningCount}`);
    log(colors.blue, `   Success Rate: ${successRate}%`);
    
    // Detailed results
    log(colors.blue, '\n📊 Detailed Results:');
    this.results.tests.forEach((test, index) => {
      const status = test.passed ? '✅' : '❌';
      const color = test.passed ? colors.green : colors.red;
      log(color, `   ${index + 1}. ${status} ${test.name}`);
      
      if (test.errors && test.errors.length > 0) {
        test.errors.forEach(error => {
          log(colors.red, `      ❌ ${error}`);
        });
      }
      
      if (test.warnings && test.warnings.length > 0) {
        test.warnings.forEach(warning => {
          log(colors.yellow, `      ⚠️  ${warning}`);
        });
      }
    });
    
    // Overall status
    if (failedTests === 0) {
      log(colors.green + colors.bold, '\n🎉 ALL VALIDATION TESTS PASSED!');
      log(colors.green, '   Your application is ready for production deployment!');
      
      if (warningCount > 0) {
        log(colors.yellow, `   Note: ${warningCount} warnings detected - review before deployment`);
      }
    } else {
      log(colors.red + colors.bold, '\n❌ VALIDATION FAILED!');
      log(colors.red, '   Please fix the issues above before deploying to production.');
    }
    
    // Next steps
    log(colors.blue, '\n🎯 Next Steps:');
    if (failedTests === 0) {
      log(colors.blue, '   1. Deploy to Vercel staging environment');
      log(colors.blue, '   2. Run end-to-end tests on staging');
      log(colors.blue, '   3. Validate all user flows work correctly');
      log(colors.blue, '   4. Deploy to production');
    } else {
      log(colors.blue, '   1. Fix the failed validation issues');
      log(colors.blue, '   2. Re-run this validation script');
      log(colors.blue, '   3. Proceed with deployment once all tests pass');
    }
    
    console.log('');
    
    return failedTests === 0;
  }

  async runAllValidations() {
    try {
      log(colors.blue + colors.bold, '🚀 Starting Final Production Validation\n');
      
      await this.validateEnvironment();
      await this.validateFileStructure();
      await this.validateDependencies();
      await this.validateTypeScript();
      await this.validateLinting();
      await this.validateBuild();
      
      const allPassed = this.generateReport();
      
      return allPassed;
    } catch (error) {
      log(colors.red, `\n❌ Validation suite failed: ${error.message}`);
      return false;
    }
  }
}

// Main execution
async function main() {
  const validator = new ProductionValidator();
  const success = await validator.runAllValidations();
  
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = ProductionValidator;
