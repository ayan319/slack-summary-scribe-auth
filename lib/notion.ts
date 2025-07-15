import { Client } from '@notionhq/client';

// Initialize Notion client
export const notion = new Client({
  auth: process.env.NOTION_API_TOKEN,
});

// Database IDs (will be set after creation)
export const NOTION_DATABASES = {
  LAUNCH_TRACKER: process.env.NOTION_LAUNCH_TRACKER_DB_ID || '',
  ROADMAP_V1_1: process.env.NOTION_ROADMAP_V1_1_DB_ID || '',
};

// Types for Notion database properties
export interface LaunchTrackerItem {
  title: string;
  status: 'New' | 'In Progress' | 'Done';
  category: 'Product Hunt Metrics' | 'Signup Funnel' | 'Bug Reports' | 'Resolved Issues' | 'Feedback & Ideas';
  priority: 'Low' | 'Medium' | 'High';
  description?: string;
  metrics?: {
    upvotes?: number;
    comments?: number;
    signups?: number;
    conversions?: number;
  };
}

export interface RoadmapItem {
  featureName: string;
  priority: 'P0' | 'P1' | 'P2';
  expectedImpact: 'Retention' | 'Acquisition' | 'Engagement';
  status: 'Planned' | 'In Development' | 'Completed';
  description?: string;
  estimatedEffort?: string;
}

// Notion database creation schemas
export const LAUNCH_TRACKER_SCHEMA = {
  title: [
    {
      type: 'text',
      text: {
        content: 'Slack Summary Scribe - Launch Tracker',
      },
    },
  ],
  parent: {
    type: 'page_id',
    page_id: '', // Will be set dynamically
  },
  properties: {
    'Title': {
      title: {},
    },
    'Status': {
      select: {
        options: [
          { name: 'New', color: 'blue' },
          { name: 'In Progress', color: 'yellow' },
          { name: 'Done', color: 'green' },
        ],
      },
    },
    'Category': {
      select: {
        options: [
          { name: 'Product Hunt Metrics', color: 'purple' },
          { name: 'Signup Funnel', color: 'orange' },
          { name: 'Bug Reports', color: 'red' },
          { name: 'Resolved Issues', color: 'green' },
          { name: 'Feedback & Ideas', color: 'blue' },
        ],
      },
    },
    'Priority': {
      select: {
        options: [
          { name: 'Low', color: 'gray' },
          { name: 'Medium', color: 'yellow' },
          { name: 'High', color: 'red' },
        ],
      },
    },
    'Description': {
      rich_text: {},
    },
    'Upvotes': {
      number: {},
    },
    'Comments': {
      number: {},
    },
    'Signups': {
      number: {},
    },
    'Conversions': {
      number: {},
    },
    'Created': {
      created_time: {},
    },
    'Last Updated': {
      last_edited_time: {},
    },
  },
};

export const ROADMAP_V1_1_SCHEMA = {
  title: [
    {
      type: 'text',
      text: {
        content: 'Slack Summary Scribe v1.1 Roadmap',
      },
    },
  ],
  parent: {
    type: 'page_id',
    page_id: '', // Will be set dynamically
  },
  properties: {
    'Feature Name': {
      title: {},
    },
    'Priority': {
      select: {
        options: [
          { name: 'P0', color: 'red' },
          { name: 'P1', color: 'orange' },
          { name: 'P2', color: 'yellow' },
        ],
      },
    },
    'Expected Impact': {
      select: {
        options: [
          { name: 'Retention', color: 'green' },
          { name: 'Acquisition', color: 'blue' },
          { name: 'Engagement', color: 'purple' },
        ],
      },
    },
    'Status': {
      select: {
        options: [
          { name: 'Planned', color: 'gray' },
          { name: 'In Development', color: 'yellow' },
          { name: 'Completed', color: 'green' },
        ],
      },
    },
    'Description': {
      rich_text: {},
    },
    'Estimated Effort': {
      select: {
        options: [
          { name: '1-2 weeks', color: 'green' },
          { name: '3-4 weeks', color: 'yellow' },
          { name: '1-2 months', color: 'orange' },
          { name: '3+ months', color: 'red' },
        ],
      },
    },
    'Created': {
      created_time: {},
    },
    'Last Updated': {
      last_edited_time: {},
    },
  },
};

// Helper functions for Notion operations
export async function createLaunchTrackerItem(item: LaunchTrackerItem) {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: NOTION_DATABASES.LAUNCH_TRACKER,
      },
      properties: {
        'Title': {
          title: [
            {
              text: {
                content: item.title,
              },
            },
          ],
        },
        'Status': {
          select: {
            name: item.status,
          },
        },
        'Category': {
          select: {
            name: item.category,
          },
        },
        'Priority': {
          select: {
            name: item.priority,
          },
        },
        'Description': {
          rich_text: [
            {
              text: {
                content: item.description || '',
              },
            },
          ],
        },
        ...(item.metrics?.upvotes && {
          'Upvotes': {
            number: item.metrics.upvotes,
          },
        }),
        ...(item.metrics?.comments && {
          'Comments': {
            number: item.metrics.comments,
          },
        }),
        ...(item.metrics?.signups && {
          'Signups': {
            number: item.metrics.signups,
          },
        }),
        ...(item.metrics?.conversions && {
          'Conversions': {
            number: item.metrics.conversions,
          },
        }),
      },
    });

    return response;
  } catch (error) {
    console.error('Error creating launch tracker item:', error);
    throw error;
  }
}

export async function createRoadmapItem(item: RoadmapItem) {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: NOTION_DATABASES.ROADMAP_V1_1,
      },
      properties: {
        'Feature Name': {
          title: [
            {
              text: {
                content: item.featureName,
              },
            },
          ],
        },
        'Priority': {
          select: {
            name: item.priority,
          },
        },
        'Expected Impact': {
          select: {
            name: item.expectedImpact,
          },
        },
        'Status': {
          select: {
            name: item.status,
          },
        },
        'Description': {
          rich_text: [
            {
              text: {
                content: item.description || '',
              },
            },
          ],
        },
        ...(item.estimatedEffort && {
          'Estimated Effort': {
            select: {
              name: item.estimatedEffort,
            },
          },
        }),
      },
    });

    return response;
  } catch (error) {
    console.error('Error creating roadmap item:', error);
    throw error;
  }
}

export async function updateLaunchTrackerMetrics(pageId: string, metrics: LaunchTrackerItem['metrics']) {
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      properties: {
        ...(metrics?.upvotes && {
          'Upvotes': {
            number: metrics.upvotes,
          },
        }),
        ...(metrics?.comments && {
          'Comments': {
            number: metrics.comments,
          },
        }),
        ...(metrics?.signups && {
          'Signups': {
            number: metrics.signups,
          },
        }),
        ...(metrics?.conversions && {
          'Conversions': {
            number: metrics.conversions,
          },
        }),
      },
    });

    return response;
  } catch (error) {
    console.error('Error updating launch tracker metrics:', error);
    throw error;
  }
}
