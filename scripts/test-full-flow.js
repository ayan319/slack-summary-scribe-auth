#!/usr/bin/env node

/**
 * Complete Flow Test Script
 * Tests the entire Slack → AI → Supabase → UI flow
 */

const BASE_URL = 'http://localhost:3000';

async function testCompleteFlow() {
  console.log('🚀 Starting Complete Slack-to-AI-to-UI Flow Test\n');
  console.log('=' * 60);

  try {
    // Test the development endpoint
    console.log('🧪 Running comprehensive flow test...');
    
    const response = await fetch(`${BASE_URL}/api/dev/test-full-flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('✅ Complete flow test PASSED!');
      console.log('\n📊 Test Results Summary:');
      console.log('  • Slack Webhook: ✅');
      console.log('  • AI Summary Creation: ✅');
      console.log('  • Database Storage: ✅');
      console.log('  • Summary Retrieval: ✅');
      console.log('  • Search Functionality: ✅');
      console.log('  • Export API: ✅');
      console.log('  • Update Operations: ✅');
      console.log('  • Statistics: ✅');
      console.log('  • Cleanup: ✅');
      
      console.log('\n🎯 Flow Validation:');
      console.log(`  • Summary ID: ${result.results.summaryCreation.id}`);
      console.log(`  • AI Confidence: ${result.results.summaryCreation.confidence}`);
      console.log(`  • Search Results: ${result.results.searchResults} found`);
      
    } else {
      console.log('❌ Complete flow test FAILED!');
      console.log('Error:', result.error || 'Unknown error');
    }

    console.log('\n' + '=' * 60);
    console.log('🎉 Flow test completed at:', new Date().toISOString());

  } catch (error) {
    console.error('💥 Flow test crashed:', error.message);
    process.exit(1);
  }
}

// Additional individual component tests
async function testIndividualComponents() {
  console.log('\n🔧 Running Individual Component Tests...\n');

  const tests = [
    {
      name: 'Slack Webhook Processing',
      endpoint: '/api/slack/webhook',
      method: 'POST',
      data: {
        type: 'event_callback',
        team_id: 'T123456',
        event: {
          type: 'message',
          user: 'U123456',
          text: 'Please summarize our discussion about the new feature.',
          ts: Date.now().toString(),
          channel: 'C123456'
        }
      }
    },
    {
      name: 'Direct Summary Creation',
      endpoint: '/api/summarize',
      method: 'POST',
      data: {
        transcriptText: 'Test meeting: We discussed project timeline and resource allocation.',
        userId: 'test-user',
        teamId: 'test-team',
        tags: ['test', 'meeting']
      }
    },
    {
      name: 'Summary Listing',
      endpoint: '/api/summaries?limit=5',
      method: 'GET'
    },
    {
      name: 'Summary Search',
      endpoint: '/api/summaries?search=meeting&limit=3',
      method: 'GET'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      
      const options = {
        method: test.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (test.data) {
        options.body = JSON.stringify(test.data);
      }

      const response = await fetch(`${BASE_URL}${test.endpoint}`, options);
      const result = await response.json();

      if (response.ok) {
        console.log(`   ✅ ${test.name} - PASSED`);
      } else {
        console.log(`   ❌ ${test.name} - FAILED: ${result.error}`);
      }
    } catch (error) {
      console.log(`   💥 ${test.name} - ERROR: ${error.message}`);
    }
  }
}

// Performance test
async function testPerformance() {
  console.log('\n⚡ Running Performance Tests...\n');

  const startTime = Date.now();
  
  try {
    // Test summary creation performance
    const summaryStart = Date.now();
    const response = await fetch(`${BASE_URL}/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcriptText: 'Performance test: Quick meeting about system optimization.',
        userId: 'perf-test-user',
        tags: ['performance', 'test']
      })
    });
    
    const summaryTime = Date.now() - summaryStart;
    const result = await response.json();

    if (response.ok) {
      console.log(`✅ Summary Creation: ${summaryTime}ms`);
      console.log(`   • AI Processing: ${result.data.processingTimeMs}ms`);
      console.log(`   • Total Request: ${summaryTime}ms`);
      
      // Test retrieval performance
      const retrievalStart = Date.now();
      const fetchResponse = await fetch(`${BASE_URL}/api/summaries/${result.data.id}`);
      const retrievalTime = Date.now() - retrievalStart;
      
      if (fetchResponse.ok) {
        console.log(`✅ Summary Retrieval: ${retrievalTime}ms`);
      }

      // Cleanup
      await fetch(`${BASE_URL}/api/summaries/${result.data.id}`, { method: 'DELETE' });
      
    } else {
      console.log('❌ Performance test failed:', result.error);
    }

  } catch (error) {
    console.log('💥 Performance test error:', error.message);
  }

  const totalTime = Date.now() - startTime;
  console.log(`\n⏱️ Total Performance Test Time: ${totalTime}ms`);
}

// Main execution
async function main() {
  console.log('🎯 Slack-to-AI-to-UI Complete Flow Validation\n');
  
  // Check if server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/summaries?limit=1`);
    if (!healthCheck.ok) {
      throw new Error('Server not responding');
    }
  } catch (error) {
    console.error('❌ Server not running at', BASE_URL);
    console.error('Please start the development server with: npm run dev');
    process.exit(1);
  }

  // Run all tests
  await testCompleteFlow();
  await testIndividualComponents();
  await testPerformance();

  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('  1. Review test results above');
  console.log('  2. Check browser at http://localhost:3000/modern-summaries');
  console.log('  3. Verify data in Supabase dashboard');
  console.log('  4. Test UI interactions manually');
}

// Run the tests
main().catch(console.error);
