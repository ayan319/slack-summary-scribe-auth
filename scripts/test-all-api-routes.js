#!/usr/bin/env node

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3001';

function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'API-Test-Script',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            rawBody: body
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            rawBody: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testAPIRoutes() {
  console.log('🧪 TESTING ALL API ROUTES');
  console.log('=========================\n');

  const routes = [
    // Core API routes
    { path: '/api/healthcheck', name: 'Health Check', expectedStatus: 200 },
    { path: '/api/notifications', name: 'Notifications', expectedStatus: 200 },
    { path: '/api/summaries', name: 'Summaries (No Auth)', expectedStatus: 401 },
    { path: '/api/dashboard', name: 'Dashboard', expectedStatus: 200 },
    { path: '/api/analytics', name: 'Analytics', expectedStatus: 200 },
    
    // Slack routes
    { path: '/api/slack/webhook', name: 'Slack Webhook', method: 'POST', expectedStatus: [200, 400, 401] },
    { path: '/api/slack/oauth', name: 'Slack OAuth', expectedStatus: [200, 302] },
    
    // Export routes
    { path: '/api/export/notion', name: 'Notion Export', method: 'POST', expectedStatus: [200, 401] },
    { path: '/api/export/pdf', name: 'PDF Export', method: 'POST', expectedStatus: [200, 401] },
    
    // Auth routes
    { path: '/api/auth/callback', name: 'Auth Callback', expectedStatus: [200, 302, 400] },
    
    // User routes
    { path: '/api/user/profile', name: 'User Profile', expectedStatus: [200, 401] },
    { path: '/api/user/settings', name: 'User Settings', expectedStatus: [200, 401] }
  ];

  const results = [];

  for (const route of routes) {
    try {
      console.log(`Testing ${route.name}...`);
      
      const response = await makeRequest(
        route.path, 
        route.method || 'GET',
        route.data || null
      );

      const expectedStatuses = Array.isArray(route.expectedStatus) 
        ? route.expectedStatus 
        : [route.expectedStatus];

      const isExpectedStatus = expectedStatuses.includes(response.status);
      const status = isExpectedStatus ? '✅' : '❌';
      
      console.log(`   ${status} ${route.name}: ${response.status} ${getStatusText(response.status)}`);
      
      if (response.body && typeof response.body === 'object') {
        if (response.body.data && Array.isArray(response.body.data)) {
          console.log(`      → Data: ${response.body.data.length} items`);
        } else if (response.body.message) {
          console.log(`      → Message: ${response.body.message}`);
        } else if (response.body.error) {
          console.log(`      → Error: ${response.body.error}`);
        }
      }

      results.push({
        ...route,
        status: response.status,
        success: isExpectedStatus,
        response: response.body
      });

    } catch (error) {
      console.log(`   ❌ ${route.name}: Connection failed - ${error.message}`);
      results.push({
        ...route,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n📊 API ROUTES SUMMARY');
  console.log('=====================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Successful: ${successful}/${total} routes`);
  console.log(`❌ Failed: ${total - successful}/${total} routes`);

  // Detailed results
  console.log('\n📋 DETAILED RESULTS');
  console.log('===================');
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.status}`);
    
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  // Recommendations
  console.log('\n🎯 RECOMMENDATIONS');
  console.log('==================');
  
  const criticalRoutes = results.filter(r => 
    ['Health Check', 'Notifications', 'Dashboard'].includes(r.name)
  );
  
  const criticalSuccess = criticalRoutes.filter(r => r.success).length;
  
  if (criticalSuccess === criticalRoutes.length) {
    console.log('✅ All critical API routes are working');
    console.log('   → Dashboard should load with data');
    console.log('   → Core functionality is operational');
  } else {
    console.log('❌ Some critical API routes are failing');
    console.log('   → Check server logs for errors');
    console.log('   → Verify database connections');
  }

  const authProtectedFailing = results.filter(r => 
    r.status === 401 && !['Summaries (No Auth)'].includes(r.name)
  );
  
  if (authProtectedFailing.length > 0) {
    console.log('\n⚠️  Auth-protected routes returning 401:');
    authProtectedFailing.forEach(r => {
      console.log(`   - ${r.name}`);
    });
    console.log('   → This is expected behavior for unauthenticated requests');
  }

  return {
    total,
    successful,
    failed: total - successful,
    criticalSuccess: criticalSuccess === criticalRoutes.length,
    results
  };
}

function getStatusText(status) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    302: 'Redirect',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error'
  };
  return statusTexts[status] || 'Unknown';
}

if (require.main === module) {
  testAPIRoutes()
    .then(result => {
      console.log(`\n🎯 Final Result: ${result.successful}/${result.total} routes working`);
      
      if (result.criticalSuccess) {
        console.log('✅ Critical API routes are functional - ready for dashboard testing');
        process.exit(0);
      } else {
        console.log('❌ Critical API routes need attention');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ API testing failed:', error);
      process.exit(1);
    });
}

module.exports = { testAPIRoutes };
