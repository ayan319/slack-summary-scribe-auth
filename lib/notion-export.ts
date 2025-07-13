import { Client } from '@notionhq/client';

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

// Notion export configuration
export const NOTION_CONFIG = {
  defaultDatabaseId: process.env.NOTION_DATABASE_ID,
  defaultPageId: process.env.NOTION_PAGE_ID,
};

// Summary data interface for Notion export
export interface NotionSummaryData {
  title: string;
  content: string;
  summary: string;
  tags?: string[];
  source: 'slack' | 'file_upload' | 'manual';
  createdAt: Date;
  userId: string;
  organizationId?: string;
  metadata?: {
    wordCount?: number;
    processingTime?: number;
    aiModel?: string;
    confidence?: number;
  };
}

// Notion page properties interface
export interface NotionPageProperties {
  title: string;
  summary: string;
  source: string;
  tags: string[];
  createdDate: string;
  wordCount?: number;
  userId: string;
  organizationId?: string;
}

// Export summary to Notion page
export async function exportSummaryToNotionPage(
  summaryData: NotionSummaryData,
  options?: {
    parentPageId?: string;
    templateId?: string;
    includeMetadata?: boolean;
  }
): Promise<{ success: boolean; pageId?: string; url?: string; error?: string }> {
  try {
    if (!process.env.NOTION_TOKEN) {
      return {
        success: false,
        error: 'Notion integration not configured. Please add NOTION_TOKEN to environment variables.'
      };
    }

    const parentPageId = options?.parentPageId || NOTION_CONFIG.defaultPageId;
    
    if (!parentPageId) {
      return {
        success: false,
        error: 'No parent page specified. Please provide a parent page ID or configure NOTION_PAGE_ID.'
      };
    }

    // Create the page content blocks
    const children = [
      // Title block
      {
        object: 'block' as const,
        type: 'heading_1' as const,
        heading_1: {
          rich_text: [
            {
              type: 'text' as const,
              text: {
                content: summaryData.title
              }
            }
          ]
        }
      },
      
      // Summary section
      {
        object: 'block' as const,
        type: 'heading_2' as const,
        heading_2: {
          rich_text: [
            {
              type: 'text' as const,
              text: {
                content: '📄 Summary'
              }
            }
          ]
        }
      },
      
      {
        object: 'block' as const,
        type: 'paragraph' as const,
        paragraph: {
          rich_text: [
            {
              type: 'text' as const,
              text: {
                content: summaryData.summary
              }
            }
          ]
        }
      },
      
      // Original content section
      {
        object: 'block' as const,
        type: 'heading_2' as const,
        heading_2: {
          rich_text: [
            {
              type: 'text' as const,
              text: {
                content: '📝 Original Content'
              }
            }
          ]
        }
      },
      
      {
        object: 'block' as const,
        type: 'toggle' as const,
        toggle: {
          rich_text: [
            {
              type: 'text' as const,
              text: {
                content: 'Click to expand original content'
              }
            }
          ],
          children: [
            {
              object: 'block' as const,
              type: 'paragraph' as const,
              paragraph: {
                rich_text: [
                  {
                    type: 'text' as const,
                    text: {
                      content: summaryData.content.substring(0, 2000) // Notion has limits
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    ];

    // Add metadata section if requested
    if (options?.includeMetadata && summaryData.metadata) {
      children.push(
        {
          object: 'block' as const,
          type: 'heading_2' as const,
          heading_2: {
            rich_text: [
              {
                type: 'text' as const,
                text: {
                  content: '📊 Metadata'
                }
              }
            ]
          }
        },
        {
          object: 'block' as const,
          type: 'paragraph' as const,
          paragraph: {
            rich_text: [
              {
                type: 'text' as const,
                text: {
                  content: `• Source: ${summaryData.source}`
                }
              }
            ]
          }
        }
      );

      if (summaryData.metadata.wordCount) {
        children.push({
          object: 'block' as const,
          type: 'paragraph' as const,
          paragraph: {
            rich_text: [
              {
                type: 'text' as const,
                text: {
                  content: `• Word Count: ${summaryData.metadata.wordCount}`
                }
              }
            ]
          }
        });
      }

      if (summaryData.metadata.aiModel) {
        children.push({
          object: 'block' as const,
          type: 'paragraph' as const,
          paragraph: {
            rich_text: [
              {
                type: 'text' as const,
                text: {
                  content: `• AI Model: ${summaryData.metadata.aiModel}`
                }
              }
            ]
          }
        });
      }

      if (summaryData.metadata.processingTime) {
        children.push({
          object: 'block' as const,
          type: 'paragraph' as const,
          paragraph: {
            rich_text: [
              {
                type: 'text' as const,
                text: {
                  content: `• Processing Time: ${summaryData.metadata.processingTime}ms`
                }
              }
            ]
          }
        });
      }
    }

    // Create the page
    const response = await notion.pages.create({
      parent: {
        page_id: parentPageId
      },
      properties: {
        title: {
          title: [
            {
              text: {
                content: summaryData.title
              }
            }
          ]
        }
      },
      children
    });

    console.log('Notion page created successfully:', response.id);

    return {
      success: true,
      pageId: response.id,
      url: `https://notion.so/${response.id.replace(/-/g, '')}`
    };

  } catch (error) {
    console.error('Error exporting to Notion:', error);
    
    let errorMessage = 'Failed to export to Notion';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

// Export summary to Notion database
export async function exportSummaryToNotionDatabase(
  summaryData: NotionSummaryData,
  databaseId?: string
): Promise<{ success: boolean; pageId?: string; url?: string; error?: string }> {
  try {
    if (!process.env.NOTION_TOKEN) {
      return {
        success: false,
        error: 'Notion integration not configured. Please add NOTION_TOKEN to environment variables.'
      };
    }

    const targetDatabaseId = databaseId || NOTION_CONFIG.defaultDatabaseId;
    
    if (!targetDatabaseId) {
      return {
        success: false,
        error: 'No database specified. Please provide a database ID or configure NOTION_DATABASE_ID.'
      };
    }

    // Create database entry
    const response = await notion.pages.create({
      parent: {
        database_id: targetDatabaseId
      },
      properties: {
        'Title': {
          title: [
            {
              text: {
                content: summaryData.title
              }
            }
          ]
        },
        'Summary': {
          rich_text: [
            {
              text: {
                content: summaryData.summary.substring(0, 2000) // Notion property limits
              }
            }
          ]
        },
        'Source': {
          select: {
            name: summaryData.source
          }
        },
        'Created': {
          date: {
            start: summaryData.createdAt.toISOString()
          }
        },
        'Tags': {
          multi_select: (summaryData.tags || []).map(tag => ({ name: tag }))
        },
        'Word Count': {
          number: summaryData.metadata?.wordCount || 0
        },
        'User ID': {
          rich_text: [
            {
              text: {
                content: summaryData.userId
              }
            }
          ]
        }
      }
    });

    console.log('Notion database entry created successfully:', response.id);

    return {
      success: true,
      pageId: response.id,
      url: `https://notion.so/${response.id.replace(/-/g, '')}`
    };

  } catch (error) {
    console.error('Error exporting to Notion database:', error);
    
    let errorMessage = 'Failed to export to Notion database';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

// Get Notion workspace info
export async function getNotionWorkspaceInfo(): Promise<{
  success: boolean;
  workspace?: any;
  error?: string;
}> {
  try {
    if (!process.env.NOTION_TOKEN) {
      return {
        success: false,
        error: 'Notion integration not configured'
      };
    }

    const response = await notion.users.me({});
    
    return {
      success: true,
      workspace: response
    };

  } catch (error) {
    console.error('Error getting Notion workspace info:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// List accessible databases
export async function listNotionDatabases(): Promise<{
  success: boolean;
  databases?: any[];
  error?: string;
}> {
  try {
    if (!process.env.NOTION_TOKEN) {
      return {
        success: false,
        error: 'Notion integration not configured'
      };
    }

    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'database'
      }
    });
    
    return {
      success: true,
      databases: response.results
    };

  } catch (error) {
    console.error('Error listing Notion databases:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Validate Notion connection
export async function validateNotionConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!process.env.NOTION_TOKEN) {
      return {
        success: false,
        error: 'NOTION_TOKEN not configured'
      };
    }

    await notion.users.me({});
    
    return { success: true };

  } catch (error) {
    console.error('Error validating Notion connection:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}
