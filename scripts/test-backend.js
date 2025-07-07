#!/usr/bin/env node

/**
 * Backend API Testing Script
 * Tests the complete AI summarization flow
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const testTranscript = `
Interviewer: Hi John, thanks for joining us today. Can you tell me about your experience with React?

John: Absolutely! I've been working with React for about 3 years now. I started with class components and have transitioned to hooks. I'm particularly experienced with useState, useEffect, and custom hooks. I've also worked extensively with React Router and state management libraries like Redux and Zustand.

Interviewer: That's great. Can you walk me through how you would optimize a React application for performance?

John: Sure! There are several strategies I use. First, I implement React.memo for components that don't need frequent re-renders. I also use useMemo and useCallback to memoize expensive calculations and functions. For larger applications, I implement code splitting with React.lazy and Suspense. I also pay attention to bundle size and use tools like webpack-bundle-analyzer to identify optimization opportunities.

Interviewer: Excellent. What about testing? How do you approach testing React components?

John: I primarily use Jest and React Testing Library. I focus on testing user interactions rather than implementation details. I write unit tests for individual components, integration tests for component interactions, and end-to-end tests with Playwright for critical user flows. I aim for around 80% test coverage on business logic.

Interviewer: One concern I have is that you mentioned you're still learning TypeScript. How do you plan to address this?

John: That's a fair point. While I have basic TypeScript knowledge, I recognize it's crucial for larger applications. I've been taking online courses and plan to contribute to open-source TypeScript projects to gain more hands-on experience. I'm confident I can become proficient within 2-3 months.

Interviewer: Great! Do you have any questions for us?

John: Yes, I'd love to know more about the team structure and what a typical sprint looks like. Also, what are the biggest technical challenges the team is currently facing?

Interviewer: Thanks John. We'll be in touch within the next week with our decision.
`;

async function testAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`\n🔄 Testing ${method} ${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Success (${response.status}):`, JSON.stringify(data, null, 2));
      return data;
    } else {
      console.log(`❌ Error (${response.status}):`, JSON.stringify(data, null, 2));
      return null;
    }
  } catch (error) {
    console.log(`💥 Request failed:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Backend API Tests\n');
  console.log('=' * 50);

  // Test 1: Create a new summary
  console.log('\n📝 TEST 1: Create AI Summary');
  const summaryData = {
    transcriptText: testTranscript,
    userId: 'test-user-123',
    teamId: 'test-team-456',
    tags: ['interview', 'react', 'frontend'],
    context: {
      source: 'manual',
      participants: ['Interviewer', 'John'],
      duration: 30
    },
    metadata: {
      testRun: true,
      timestamp: new Date().toISOString()
    }
  };

  const createResult = await testAPI('/api/summarize', 'POST', summaryData);
  let summaryId = null;

  if (createResult && createResult.success) {
    summaryId = createResult.data.id;
    console.log(`📋 Created summary with ID: ${summaryId}`);
  }

  // Test 2: Fetch all summaries
  console.log('\n📚 TEST 2: Fetch All Summaries');
  await testAPI('/api/summaries?limit=10');

  // Test 3: Fetch summaries with filters
  console.log('\n🔍 TEST 3: Fetch Summaries with Filters');
  await testAPI('/api/summaries?userId=test-user-123&source=manual&includeStats=true');

  // Test 4: Search summaries
  console.log('\n🔎 TEST 4: Search Summaries');
  await testAPI('/api/summaries?search=React&limit=5');

  // Test 5: Fetch specific summary (if created)
  if (summaryId) {
    console.log('\n📄 TEST 5: Fetch Specific Summary');
    await testAPI(`/api/summaries/${summaryId}`);

    // Test 6: Update summary
    console.log('\n✏️ TEST 6: Update Summary');
    const updateData = {
      tags: ['interview', 'react', 'frontend', 'updated'],
      metadata: {
        testRun: true,
        updated: true,
        timestamp: new Date().toISOString()
      }
    };
    await testAPI(`/api/summaries/${summaryId}`, 'PUT', updateData);

    // Test 7: Delete summary
    console.log('\n🗑️ TEST 7: Delete Summary');
    await testAPI(`/api/summaries/${summaryId}`, 'DELETE');
  }

  // Test 8: Test error handling
  console.log('\n❌ TEST 8: Error Handling Tests');
  
  // Invalid summary creation
  await testAPI('/api/summarize', 'POST', {
    transcriptText: '',
    userId: 'test-user'
  });

  // Invalid summary fetch
  await testAPI('/api/summaries/invalid-id');

  // Test 9: Test Slack webhook (simulation)
  console.log('\n💬 TEST 9: Slack Webhook Simulation');
  const slackEvent = {
    type: 'event_callback',
    team_id: 'T123456',
    event: {
      type: 'message',
      user: 'U123456',
      text: 'Can someone summarize our standup meeting? We discussed React performance optimization and testing strategies.',
      ts: '1234567890.123',
      channel: 'C123456'
    }
  };
  await testAPI('/api/slack/webhook', 'POST', slackEvent);

  // Test 10: Pagination test
  console.log('\n📄 TEST 10: Pagination Test');
  await testAPI('/api/summaries?limit=2&offset=0');

  console.log('\n🎉 Backend API Tests Completed!');
  console.log('=' * 50);
}

// Run the tests
runTests().catch(console.error);
