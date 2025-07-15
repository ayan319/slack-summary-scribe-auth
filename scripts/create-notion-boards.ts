#!/usr/bin/env node

/**
 * Create Notion Launch Tracker & v1.1 Roadmap Boards
 * Automatically sets up databases for Product Hunt launch tracking and roadmap planning
 */

import { notion, LAUNCH_TRACKER_SCHEMA, ROADMAP_V1_1_SCHEMA } from '../lib/notion';
import { createLaunchTrackerItem, createRoadmapItem } from '../lib/notion';
import type { LaunchTrackerItem, RoadmapItem } from '../lib/notion';

console.log('🚀 Creating Notion Launch Tracker & v1.1 Roadmap Boards...\n');

// First, we need to create a parent page to hold our databases
async function createParentPage() {
  try {
    console.log('📄 Creating parent page for databases...');
    
    const parentPage = await notion.pages.create({
      parent: {
        type: 'page_id',
        page_id: process.env.NOTION_DATABASE_ID || '', // Use existing workspace
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: 'Slack Summary Scribe - Launch Management',
              },
            },
          ],
        },
      },
      children: [
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'Slack Summary Scribe - Launch Management',
                },
              },
            ],
          },
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: 'This page contains the launch tracking and roadmap databases for Slack Summary Scribe.',
                },
              },
            ],
          },
        },
      ],
    });

    console.log(`✅ Parent page created: ${parentPage.id}`);
    return parentPage.id;
  } catch (error) {
    console.error('❌ Error creating parent page:', error);
    throw error;
  }
}

// Create Launch Tracker Database
async function createLaunchTrackerDatabase(parentPageId: string) {
  try {
    console.log('📊 Creating Launch Tracker database...');
    
    const schema = { ...LAUNCH_TRACKER_SCHEMA };
    schema.parent.page_id = parentPageId;
    
    const database = await notion.databases.create(schema as any);
    
    console.log(`✅ Launch Tracker database created: ${database.id}`);
    console.log(`🔗 URL: https://notion.so/${database.id.replace(/-/g, '')}`);
    
    return database.id;
  } catch (error) {
    console.error('❌ Error creating Launch Tracker database:', error);
    throw error;
  }
}

// Create v1.1 Roadmap Database
async function createRoadmapDatabase(parentPageId: string) {
  try {
    console.log('🗺️  Creating v1.1 Roadmap database...');
    
    const schema = { ...ROADMAP_V1_1_SCHEMA };
    schema.parent.page_id = parentPageId;
    
    const database = await notion.databases.create(schema as any);
    
    console.log(`✅ v1.1 Roadmap database created: ${database.id}`);
    console.log(`🔗 URL: https://notion.so/${database.id.replace(/-/g, '')}`);
    
    return database.id;
  } catch (error) {
    console.error('❌ Error creating v1.1 Roadmap database:', error);
    throw error;
  }
}

// Populate Launch Tracker with initial items
async function populateLaunchTracker(databaseId: string) {
  console.log('📝 Populating Launch Tracker with initial items...');
  
  // Update the database ID in our notion config
  process.env.NOTION_LAUNCH_TRACKER_DB_ID = databaseId;
  
  const initialItems: LaunchTrackerItem[] = [
    {
      title: 'Product Hunt Launch Day Preparation',
      status: 'New',
      category: 'Product Hunt Metrics',
      priority: 'High',
      description: 'Prepare for Product Hunt launch day - screenshots, copy, team coordination',
    },
    {
      title: 'Monitor Product Hunt Upvotes',
      status: 'New',
      category: 'Product Hunt Metrics',
      priority: 'High',
      description: 'Track upvotes throughout launch day and engage with community',
      metrics: { upvotes: 0, comments: 0 },
    },
    {
      title: 'Landing Page Traffic Analysis',
      status: 'New',
      category: 'Signup Funnel',
      priority: 'Medium',
      description: 'Monitor traffic from Product Hunt to landing page conversion',
      metrics: { signups: 0, conversions: 0 },
    },
    {
      title: 'Slack OAuth Connection Rate',
      status: 'New',
      category: 'Signup Funnel',
      priority: 'High',
      description: 'Track how many users complete Slack OAuth after signup',
    },
    {
      title: 'First Summary Generation Success',
      status: 'New',
      category: 'Signup Funnel',
      priority: 'High',
      description: 'Monitor users who successfully generate their first summary',
    },
    {
      title: 'Payment Conversion Tracking',
      status: 'New',
      category: 'Signup Funnel',
      priority: 'Medium',
      description: 'Track free to paid conversion rates during launch',
    },
  ];

  for (const item of initialItems) {
    try {
      await createLaunchTrackerItem(item);
      console.log(`✅ Created: ${item.title}`);
    } catch (error) {
      console.error(`❌ Failed to create: ${item.title}`, error);
    }
  }
}

// Populate v1.1 Roadmap with planned features
async function populateRoadmap(databaseId: string) {
  console.log('🗺️  Populating v1.1 Roadmap with planned features...');
  
  // Update the database ID in our notion config
  process.env.NOTION_ROADMAP_V1_1_DB_ID = databaseId;
  
  const roadmapItems: RoadmapItem[] = [
    {
      featureName: 'Scheduled Slack Digests',
      priority: 'P0',
      expectedImpact: 'Retention',
      status: 'Planned',
      description: 'Daily/weekly summary auto-posts to keep teams engaged with regular insights',
      estimatedEffort: '3-4 weeks',
    },
    {
      featureName: 'AI Coaching Insights',
      priority: 'P1',
      expectedImpact: 'Engagement',
      status: 'Planned',
      description: 'Personalized insights based on conversation patterns to improve team communication',
      estimatedEffort: '1-2 months',
    },
    {
      featureName: 'Team Management Features',
      priority: 'P0',
      expectedImpact: 'Acquisition',
      status: 'Planned',
      description: 'Invite/manage team members with role-based permissions and workspace management',
      estimatedEffort: '3-4 weeks',
    },
    {
      featureName: 'Additional Export Formats',
      priority: 'P1',
      expectedImpact: 'Engagement',
      status: 'Planned',
      description: 'Google Docs, Trello cards, and other popular format exports for better workflow integration',
      estimatedEffort: '1-2 weeks',
    },
    {
      featureName: 'NPS Collection & Retention Triggers',
      priority: 'P1',
      expectedImpact: 'Retention',
      status: 'Planned',
      description: 'Automated follow-up surveys and retention campaigns based on usage patterns',
      estimatedEffort: '3-4 weeks',
    },
    {
      featureName: 'Advanced Analytics Dashboard',
      priority: 'P2',
      expectedImpact: 'Engagement',
      status: 'Planned',
      description: 'Detailed team communication analytics and insights for managers',
      estimatedEffort: '1-2 months',
    },
    {
      featureName: 'Mobile App (iOS/Android)',
      priority: 'P2',
      expectedImpact: 'Acquisition',
      status: 'Planned',
      description: 'Native mobile apps for on-the-go summary access and notifications',
      estimatedEffort: '3+ months',
    },
    {
      featureName: 'API & Webhooks',
      priority: 'P1',
      expectedImpact: 'Acquisition',
      status: 'Planned',
      description: 'Public API and webhooks for custom integrations and enterprise customers',
      estimatedEffort: '1-2 months',
    },
  ];

  for (const item of roadmapItems) {
    try {
      await createRoadmapItem(item);
      console.log(`✅ Created: ${item.featureName}`);
    } catch (error) {
      console.error(`❌ Failed to create: ${item.featureName}`, error);
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting Notion board creation process...\n');
    
    // Validate environment variables
    if (!process.env.NOTION_API_TOKEN) {
      throw new Error('NOTION_API_TOKEN environment variable is required');
    }
    
    if (!process.env.NOTION_DATABASE_ID) {
      throw new Error('NOTION_DATABASE_ID environment variable is required');
    }
    
    // Create parent page
    const parentPageId = await createParentPage();
    
    // Create databases
    const launchTrackerDbId = await createLaunchTrackerDatabase(parentPageId);
    const roadmapDbId = await createRoadmapDatabase(parentPageId);
    
    // Populate databases with initial data
    await populateLaunchTracker(launchTrackerDbId);
    await populateRoadmap(roadmapDbId);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 NOTION BOARDS CREATED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`📊 Launch Tracker Database ID: ${launchTrackerDbId}`);
    console.log(`🗺️  v1.1 Roadmap Database ID: ${roadmapDbId}`);
    console.log(`📄 Parent Page ID: ${parentPageId}`);
    
    console.log('\n🔧 Environment Variables to Add:');
    console.log(`NOTION_LAUNCH_TRACKER_DB_ID=${launchTrackerDbId}`);
    console.log(`NOTION_ROADMAP_V1_1_DB_ID=${roadmapDbId}`);
    console.log(`NOTION_PARENT_PAGE_ID=${parentPageId}`);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Add the environment variables to your .env.local file');
    console.log('2. Run the test script to validate integration');
    console.log('3. Deploy to Vercel with updated environment variables');
    
    return {
      success: true,
      launchTrackerDbId,
      roadmapDbId,
      parentPageId,
    };
    
  } catch (error) {
    console.error('\n❌ Error creating Notion boards:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Execute if run directly
if (require.main === module) {
  main()
    .then((result) => {
      process.exit(result.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default main;
