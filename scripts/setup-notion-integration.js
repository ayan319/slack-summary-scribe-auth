#!/usr/bin/env node

/**
 * Notion Integration Setup Guide
 * Provides step-by-step instructions for setting up Notion integration
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Notion Integration Setup Guide\n');

function validateNotionSetup() {
  console.log('📋 Checking Notion Integration Requirements...\n');
  
  const checks = [
    {
      name: 'Notion API Token',
      check: () => !!process.env.NOTION_API_TOKEN,
      value: process.env.NOTION_API_TOKEN,
      instruction: 'Create a Notion integration at https://www.notion.so/my-integrations'
    },
    {
      name: 'Notion Database ID',
      check: () => !!process.env.NOTION_DATABASE_ID,
      value: process.env.NOTION_DATABASE_ID,
      instruction: 'Create a Notion page and get its ID from the URL'
    },
    {
      name: 'Launch Tracker DB ID',
      check: () => !!process.env.NOTION_LAUNCH_TRACKER_DB_ID,
      value: process.env.NOTION_LAUNCH_TRACKER_DB_ID,
      instruction: 'Will be set after running create-notion-boards script'
    },
    {
      name: 'Roadmap DB ID',
      check: () => !!process.env.NOTION_ROADMAP_V1_1_DB_ID,
      value: process.env.NOTION_ROADMAP_V1_1_DB_ID,
      instruction: 'Will be set after running create-notion-boards script'
    }
  ];
  
  let allValid = true;
  
  checks.forEach(({ name, check, value, instruction }) => {
    const isValid = check();
    const status = isValid ? '✅' : '❌';
    console.log(`${status} ${name}: ${isValid ? 'Configured' : 'Missing'}`);
    
    if (!isValid) {
      console.log(`   📝 ${instruction}`);
      allValid = false;
    } else if (value && value.length > 20) {
      console.log(`   🔑 Value: ${value.substring(0, 20)}...`);
    }
  });
  
  return allValid;
}

function printSetupInstructions() {
  console.log('\n' + '='.repeat(60));
  console.log('📚 NOTION INTEGRATION SETUP INSTRUCTIONS');
  console.log('='.repeat(60));
  
  console.log('\n🔧 Step 1: Create Notion Integration');
  console.log('1. Go to https://www.notion.so/my-integrations');
  console.log('2. Click "New integration"');
  console.log('3. Name it "Slack Summary Scribe"');
  console.log('4. Select your workspace');
  console.log('5. Copy the "Internal Integration Token"');
  console.log('6. Add to .env.local as NOTION_API_TOKEN=your_token_here');
  
  console.log('\n📄 Step 2: Create Notion Workspace Page');
  console.log('1. Create a new page in Notion');
  console.log('2. Name it "Slack Summary Scribe Workspace"');
  console.log('3. Copy the page ID from the URL');
  console.log('4. Add to .env.local as NOTION_DATABASE_ID=your_page_id');
  
  console.log('\n🔗 Step 3: Share Page with Integration');
  console.log('1. Open your workspace page in Notion');
  console.log('2. Click "Share" in the top right');
  console.log('3. Click "Invite" and search for your integration');
  console.log('4. Select your integration and click "Invite"');
  
  console.log('\n🚀 Step 4: Run Board Creation Script');
  console.log('1. Ensure all environment variables are set');
  console.log('2. Run: node scripts/create-notion-boards.js');
  console.log('3. Copy the generated database IDs to .env.local');
  
  console.log('\n🧪 Step 5: Test Integration');
  console.log('1. Run: node scripts/test-notion-sync.js');
  console.log('2. Verify boards are created and populated');
  console.log('3. Test Slack commands /add-idea and /bug-report');
}

function generateMockData() {
  console.log('\n🎭 Generating Mock Notion Data for Development...\n');
  
  // Create mock database IDs for development
  const mockLaunchTrackerId = 'mock-launch-tracker-' + Date.now();
  const mockRoadmapId = 'mock-roadmap-' + Date.now();
  const mockParentPageId = 'mock-parent-' + Date.now();
  
  console.log('📊 Mock Launch Tracker Database:');
  console.log(`   ID: ${mockLaunchTrackerId}`);
  console.log('   Items: Product Hunt Metrics, Signup Funnel, Bug Reports');
  
  console.log('\n🗺️  Mock v1.1 Roadmap Database:');
  console.log(`   ID: ${mockRoadmapId}`);
  console.log('   Features: Scheduled Digests, AI Coaching, Team Management');
  
  console.log('\n🔧 Add these to .env.local for development:');
  console.log(`NOTION_LAUNCH_TRACKER_DB_ID=${mockLaunchTrackerId}`);
  console.log(`NOTION_ROADMAP_V1_1_DB_ID=${mockRoadmapId}`);
  console.log(`NOTION_PARENT_PAGE_ID=${mockParentPageId}`);
  
  return {
    launchTrackerId: mockLaunchTrackerId,
    roadmapId: mockRoadmapId,
    parentPageId: mockParentPageId
  };
}

function testNotionConnection() {
  console.log('\n🔍 Testing Notion Connection...\n');
  
  if (!process.env.NOTION_API_TOKEN) {
    console.log('❌ Cannot test connection: NOTION_API_TOKEN not set');
    return false;
  }
  
  const { Client } = require('@notionhq/client');
  
  const notion = new Client({
    auth: process.env.NOTION_API_TOKEN,
  });
  
  // Test connection by listing users (basic API call)
  return notion.users.list()
    .then(() => {
      console.log('✅ Notion API connection successful');
      return true;
    })
    .catch((error) => {
      console.log('❌ Notion API connection failed:', error.message);
      return false;
    });
}

async function main() {
  console.log('🚀 Starting Notion Integration Setup\n');
  
  // Validate current setup
  const isValid = validateNotionSetup();
  
  if (!isValid) {
    console.log('\n⚠️  Notion integration not fully configured');
    printSetupInstructions();
    
    // Generate mock data for development
    const mockData = generateMockData();
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Follow the setup instructions above');
    console.log('2. Use mock data for development if needed');
    console.log('3. Run this script again to validate setup');
    
    return { success: false, mockData };
  }
  
  // Test connection if token is available
  const connectionTest = await testNotionConnection();
  
  if (connectionTest) {
    console.log('\n🎉 Notion integration is ready!');
    console.log('✅ All environment variables configured');
    console.log('✅ API connection successful');
    console.log('\n🚀 Ready to create Notion boards');
    
    return { success: true };
  } else {
    console.log('\n⚠️  Notion integration configured but connection failed');
    console.log('🔍 Please check your API token and permissions');
    
    return { success: false };
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then((result) => {
      console.log('\n🏁 Notion setup validation complete!');
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = main;
