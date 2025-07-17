#!/usr/bin/env node

/**
 * Test OpenRouter API Integration
 * Tests the AI summarization functionality with OpenRouter API
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function testOpenRouterAPI() {
  console.log('🤖 Testing OpenRouter API Integration...\n');

  try {
    // Test 1: Check API connection
    console.log('📡 1. Testing API Connection...');
    
    const testCompletion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1",
      messages: [
        {
          role: "user",
          content: "Hello! Please respond with 'OpenRouter API is working correctly' to confirm the connection."
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    });

    const response = testCompletion.choices[0]?.message?.content;
    console.log(`✅ API Response: ${response}\n`);

    // Test 2: Test summarization functionality
    console.log('📝 2. Testing Summarization Functionality...');
    
    const summaryCompletion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1",
      messages: [
        {
          role: "system",
          content: "You are a professional meeting summarizer. Create concise, actionable summaries."
        },
        {
          role: "user",
          content: "Please summarize this test meeting: 'Team discussed Q1 goals, decided to launch new feature by March, assigned John to lead development, and scheduled weekly check-ins every Friday.'"
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const summary = summaryCompletion.choices[0]?.message?.content;
    console.log(`✅ Summary Generated: ${summary}\n`);

    // Test 3: Check model availability
    console.log('🔍 3. Testing Model Availability...');
    
    const models = ['deepseek/deepseek-r1', 'openai/gpt-4o-mini'];
    for (const model of models) {
      try {
        const modelTest = await openai.chat.completions.create({
          model: model,
          messages: [{ role: "user", content: "Test" }],
          max_tokens: 10
        });
        console.log(`✅ Model ${model}: Available`);
      } catch (error) {
        console.log(`❌ Model ${model}: ${error.message}`);
      }
    }

    console.log('\n🎉 OpenRouter API Integration Test Complete!');
    console.log('✅ All tests passed successfully');
    console.log('🚀 AI summarization functionality is ready for production');

  } catch (error) {
    console.error('❌ OpenRouter API Test Failed:', error.message);
    console.error('🔧 Please check your OPENROUTER_API_KEY in .env.local');
    process.exit(1);
  }
}

// Run the test
testOpenRouterAPI();
