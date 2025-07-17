#!/usr/bin/env node

/**
 * Test RSC Endpoints Script
 * 
 * This script tests various API endpoints to identify any RSC payload
 * fetch errors or SSL issues in local development.
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const ENDPOINTS = [
  '/api',
  '/api/health',
  '/api/healthcheck',
  '/api/dashboard',
  '/api/analytics',
  '/api/notifications'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${endpoint}`;
    const protocol = url.startsWith('https:') ? https : http;
    
    console.log(`🔍 Testing: ${url}`);
    
    const startTime = Date.now();
    
    const req = protocol.get(url, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            endpoint,
            status: res.statusCode,
            duration,
            success: res.statusCode < 400,
            contentType: res.headers['content-type'],
            cacheControl: res.headers['cache-control'],
            data: jsonData,
            error: null
          });
        } catch (parseError) {
          resolve({
            endpoint,
            status: res.statusCode,
            duration,
            success: false,
            contentType: res.headers['content-type'],
            cacheControl: res.headers['cache-control'],
            data: data.substring(0, 200) + (data.length > 200 ? '...' : ''),
            error: 'JSON parse error: ' + parseError.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        endpoint,
        status: 0,
        duration,
        success: false,
        contentType: null,
        cacheControl: null,
        data: null,
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      const duration = Date.now() - startTime;
      resolve({
        endpoint,
        status: 0,
        duration,
        success: false,
        contentType: null,
        cacheControl: null,
        data: null,
        error: 'Request timeout'
      });
    });
  });
}

async function testAllEndpoints() {
  console.log('🧪 Testing API Endpoints for RSC Payload Issues...\n');
  console.log(`Base URL: ${BASE_URL}\n`);
  
  const results = [];
  
  for (const endpoint of ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${endpoint} - ${result.status} (${result.duration}ms)`);
      if (result.cacheControl) {
        console.log(`   Cache-Control: ${result.cacheControl}`);
      }
    } else {
      console.log(`❌ ${endpoint} - ${result.status || 'FAILED'} (${result.duration}ms)`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    }
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Summary:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  if (failed > 0) {
    console.log('\n🔍 Failed Endpoints:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.endpoint}: ${result.error || `HTTP ${result.status}`}`);
    });
  }
  
  // Check for common issues
  console.log('\n🔍 Common Issues Check:');
  
  const sslErrors = results.filter(r => r.error && r.error.includes('SSL'));
  if (sslErrors.length > 0) {
    console.log('⚠️  SSL errors detected - ensure using HTTP for localhost');
  } else {
    console.log('✅ No SSL errors detected');
  }
  
  const timeouts = results.filter(r => r.error && r.error.includes('timeout'));
  if (timeouts.length > 0) {
    console.log('⚠️  Timeout errors detected - server may be slow or unresponsive');
  } else {
    console.log('✅ No timeout errors detected');
  }
  
  const fetchErrors = results.filter(r => r.error && r.error.includes('fetch'));
  if (fetchErrors.length > 0) {
    console.log('⚠️  Fetch errors detected - potential RSC payload issues');
  } else {
    console.log('✅ No fetch errors detected');
  }
  
  const cacheIssues = results.filter(r => r.success && r.cacheControl && r.cacheControl.includes('max-age'));
  if (cacheIssues.length > 0) {
    console.log('⚠️  Caching detected on some endpoints - may cause stale data issues');
  } else {
    console.log('✅ No problematic caching detected');
  }
  
  return results;
}

// Run the test
testAllEndpoints().then((results) => {
  const allSuccessful = results.every(r => r.success);
  console.log(`\n${allSuccessful ? '✅' : '❌'} API endpoint testing completed`);
  process.exit(allSuccessful ? 0 : 1);
}).catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
