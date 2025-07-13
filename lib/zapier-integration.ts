// Zapier/Make integration for Slack Summary Scribe
export const ZAPIER_CONFIG = {
  apiVersion: '1.0.0',
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL,
  webhookSecret: process.env.ZAPIER_WEBHOOK_SECRET,
  supportedTriggers: [
    'summary_created',
    'summary_completed',
    'file_uploaded',
    'slack_connected',
    'user_signed_up',
    'subscription_created'
  ],
  supportedActions: [
    'create_summary',
    'export_summary',
    'send_notification',
    'update_user'
  ]
};

// Zapier trigger interfaces
export interface ZapierTrigger {
  id: string;
  name: string;
  description: string;
  type: 'instant' | 'polling';
  inputFields: ZapierField[];
  outputFields: ZapierField[];
  sampleData: Record<string, any>;
}

export interface ZapierAction {
  id: string;
  name: string;
  description: string;
  inputFields: ZapierField[];
  outputFields: ZapierField[];
  sampleData: Record<string, any>;
}

export interface ZapierField {
  key: string;
  label: string;
  type: 'string' | 'integer' | 'number' | 'boolean' | 'datetime' | 'file' | 'text';
  required: boolean;
  helpText?: string;
  placeholder?: string;
  choices?: Array<{ value: string; label: string }>;
  dynamic?: string;
}

// Zapier webhook payload interface
export interface ZapierWebhookPayload {
  trigger: string;
  timestamp: string;
  data: Record<string, any>;
  user: {
    id: string;
    email: string;
    name: string;
    plan: string;
  };
  metadata?: Record<string, any>;
}

// Define Zapier triggers
export const ZAPIER_TRIGGERS: ZapierTrigger[] = [
  {
    id: 'summary_created',
    name: 'New Summary Created',
    description: 'Triggers when a new AI summary is created',
    type: 'instant',
    inputFields: [
      {
        key: 'source_type',
        label: 'Source Type',
        type: 'string',
        required: false,
        helpText: 'Filter by source type (slack, file_upload, manual)',
        choices: [
          { value: 'slack', label: 'Slack' },
          { value: 'file_upload', label: 'File Upload' },
          { value: 'manual', label: 'Manual' }
        ]
      }
    ],
    outputFields: [
      { key: 'id', label: 'Summary ID', type: 'string', required: true },
      { key: 'title', label: 'Title', type: 'string', required: true },
      { key: 'summary', label: 'Summary Text', type: 'text', required: true },
      { key: 'source_type', label: 'Source Type', type: 'string', required: true },
      { key: 'word_count', label: 'Word Count', type: 'integer', required: true },
      { key: 'created_at', label: 'Created At', type: 'datetime', required: true },
      { key: 'user_id', label: 'User ID', type: 'string', required: true },
      { key: 'user_email', label: 'User Email', type: 'string', required: true }
    ],
    sampleData: {
      id: 'summary_123',
      title: 'Team Meeting Summary',
      summary: 'The team discussed Q4 goals and decided to focus on product improvements.',
      source_type: 'slack',
      word_count: 150,
      created_at: '2024-01-15T10:30:00Z',
      user_id: 'user_456',
      user_email: 'john@example.com'
    }
  },
  {
    id: 'file_uploaded',
    name: 'File Uploaded',
    description: 'Triggers when a file is uploaded for summarization',
    type: 'instant',
    inputFields: [
      {
        key: 'file_type',
        label: 'File Type',
        type: 'string',
        required: false,
        helpText: 'Filter by file type (pdf, docx, txt)',
        choices: [
          { value: 'pdf', label: 'PDF' },
          { value: 'docx', label: 'Word Document' },
          { value: 'txt', label: 'Text File' }
        ]
      }
    ],
    outputFields: [
      { key: 'id', label: 'Upload ID', type: 'string', required: true },
      { key: 'filename', label: 'File Name', type: 'string', required: true },
      { key: 'file_type', label: 'File Type', type: 'string', required: true },
      { key: 'file_size', label: 'File Size (bytes)', type: 'integer', required: true },
      { key: 'uploaded_at', label: 'Uploaded At', type: 'datetime', required: true },
      { key: 'user_id', label: 'User ID', type: 'string', required: true },
      { key: 'user_email', label: 'User Email', type: 'string', required: true }
    ],
    sampleData: {
      id: 'upload_789',
      filename: 'meeting_notes.pdf',
      file_type: 'pdf',
      file_size: 1024000,
      uploaded_at: '2024-01-15T09:15:00Z',
      user_id: 'user_456',
      user_email: 'john@example.com'
    }
  },
  {
    id: 'user_signed_up',
    name: 'New User Signup',
    description: 'Triggers when a new user signs up',
    type: 'instant',
    inputFields: [],
    outputFields: [
      { key: 'id', label: 'User ID', type: 'string', required: true },
      { key: 'email', label: 'Email', type: 'string', required: true },
      { key: 'name', label: 'Name', type: 'string', required: true },
      { key: 'plan', label: 'Plan', type: 'string', required: true },
      { key: 'signed_up_at', label: 'Signed Up At', type: 'datetime', required: true },
      { key: 'referral_source', label: 'Referral Source', type: 'string', required: false }
    ],
    sampleData: {
      id: 'user_456',
      email: 'john@example.com',
      name: 'John Doe',
      plan: 'free',
      signed_up_at: '2024-01-15T08:00:00Z',
      referral_source: 'google'
    }
  }
];

// Define Zapier actions
export const ZAPIER_ACTIONS: ZapierAction[] = [
  {
    id: 'create_summary',
    name: 'Create Summary',
    description: 'Create a new AI summary from text content',
    inputFields: [
      { key: 'title', label: 'Title', type: 'string', required: true, helpText: 'Title for the summary' },
      { key: 'content', label: 'Content', type: 'text', required: true, helpText: 'Text content to summarize' },
      { key: 'source_type', label: 'Source Type', type: 'string', required: false, helpText: 'Type of content source' }
    ],
    outputFields: [
      { key: 'id', label: 'Summary ID', type: 'string', required: true },
      { key: 'title', label: 'Title', type: 'string', required: true },
      { key: 'summary', label: 'Summary Text', type: 'text', required: true },
      { key: 'word_count', label: 'Word Count', type: 'integer', required: true },
      { key: 'created_at', label: 'Created At', type: 'datetime', required: true }
    ],
    sampleData: {
      id: 'summary_123',
      title: 'API Created Summary',
      summary: 'This is an AI-generated summary of the provided content.',
      word_count: 120,
      created_at: '2024-01-15T10:30:00Z'
    }
  },
  {
    id: 'export_summary',
    name: 'Export Summary',
    description: 'Export a summary to various formats',
    inputFields: [
      { key: 'summary_id', label: 'Summary ID', type: 'string', required: true, helpText: 'ID of the summary to export' },
      { 
        key: 'format', 
        label: 'Export Format', 
        type: 'string', 
        required: true,
        choices: [
          { value: 'pdf', label: 'PDF' },
          { value: 'docx', label: 'Word Document' },
          { value: 'txt', label: 'Text File' },
          { value: 'notion', label: 'Notion Page' }
        ]
      },
      { key: 'include_metadata', label: 'Include Metadata', type: 'boolean', required: false, helpText: 'Include creation date, word count, etc.' }
    ],
    outputFields: [
      { key: 'export_id', label: 'Export ID', type: 'string', required: true },
      { key: 'download_url', label: 'Download URL', type: 'string', required: true },
      { key: 'format', label: 'Format', type: 'string', required: true },
      { key: 'file_size', label: 'File Size (bytes)', type: 'integer', required: true },
      { key: 'exported_at', label: 'Exported At', type: 'datetime', required: true }
    ],
    sampleData: {
      export_id: 'export_789',
      download_url: 'https://app.slacksummaryscribe.com/exports/export_789.pdf',
      format: 'pdf',
      file_size: 512000,
      exported_at: '2024-01-15T11:00:00Z'
    }
  }
];

// Send webhook to Zapier
export async function sendZapierWebhook(
  webhookUrl: string,
  payload: ZapierWebhookPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Zapier-Webhook-Secret': ZAPIER_CONFIG.webhookSecret || ''
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log('Zapier webhook sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Error sending Zapier webhook:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Trigger Zapier webhook for summary creation
export async function triggerSummaryCreated(
  summaryData: {
    id: string;
    title: string;
    summary: string;
    sourceType: string;
    wordCount: number;
    userId: string;
    userEmail: string;
  },
  webhookUrls: string[]
): Promise<void> {
  const payload: ZapierWebhookPayload = {
    trigger: 'summary_created',
    timestamp: new Date().toISOString(),
    data: {
      id: summaryData.id,
      title: summaryData.title,
      summary: summaryData.summary,
      source_type: summaryData.sourceType,
      word_count: summaryData.wordCount,
      created_at: new Date().toISOString(),
      user_id: summaryData.userId,
      user_email: summaryData.userEmail
    },
    user: {
      id: summaryData.userId,
      email: summaryData.userEmail,
      name: 'User Name', // In real implementation, fetch from database
      plan: 'pro' // In real implementation, fetch from database
    }
  };

  // Send to all registered webhook URLs
  await Promise.allSettled(
    webhookUrls.map(url => sendZapierWebhook(url, payload))
  );
}

// Trigger Zapier webhook for file upload
export async function triggerFileUploaded(
  fileData: {
    id: string;
    filename: string;
    fileType: string;
    fileSize: number;
    userId: string;
    userEmail: string;
  },
  webhookUrls: string[]
): Promise<void> {
  const payload: ZapierWebhookPayload = {
    trigger: 'file_uploaded',
    timestamp: new Date().toISOString(),
    data: {
      id: fileData.id,
      filename: fileData.filename,
      file_type: fileData.fileType,
      file_size: fileData.fileSize,
      uploaded_at: new Date().toISOString(),
      user_id: fileData.userId,
      user_email: fileData.userEmail
    },
    user: {
      id: fileData.userId,
      email: fileData.userEmail,
      name: 'User Name',
      plan: 'pro'
    }
  };

  await Promise.allSettled(
    webhookUrls.map(url => sendZapierWebhook(url, payload))
  );
}

// Handle Zapier action: Create Summary
export async function handleCreateSummaryAction(
  input: {
    title: string;
    content: string;
    source_type?: string;
  },
  userId: string
): Promise<{
  success: boolean;
  data?: {
    id: string;
    title: string;
    summary: string;
    word_count: number;
    created_at: string;
  };
  error?: string;
}> {
  try {
    // In real implementation, call your AI summarization service
    const summaryId = `summary-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const summary = `AI-generated summary of: ${input.content.substring(0, 100)}...`;
    const wordCount = summary.split(' ').length;

    const result = {
      id: summaryId,
      title: input.title,
      summary,
      word_count: wordCount,
      created_at: new Date().toISOString()
    };

    console.log('Summary created via Zapier action:', summaryId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error creating summary via Zapier:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Handle Zapier action: Export Summary
export async function handleExportSummaryAction(
  input: {
    summary_id: string;
    format: 'pdf' | 'docx' | 'txt' | 'notion';
    include_metadata?: boolean;
  },
  userId: string
): Promise<{
  success: boolean;
  data?: {
    export_id: string;
    download_url: string;
    format: string;
    file_size: number;
    exported_at: string;
  };
  error?: string;
}> {
  try {
    // In real implementation, call your export service
    const exportId = `export-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const downloadUrl = `${ZAPIER_CONFIG.baseUrl}/exports/${exportId}.${input.format}`;
    const fileSize = Math.floor(Math.random() * 1000000) + 100000; // Mock file size

    const result = {
      export_id: exportId,
      download_url: downloadUrl,
      format: input.format,
      file_size: fileSize,
      exported_at: new Date().toISOString()
    };

    console.log('Summary exported via Zapier action:', exportId);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error exporting summary via Zapier:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Get Zapier app definition
export function getZapierAppDefinition() {
  return {
    version: ZAPIER_CONFIG.apiVersion,
    platformVersion: '15.0.0',
    authentication: {
      type: 'custom',
      fields: [
        {
          key: 'api_key',
          label: 'API Key',
          required: true,
          type: 'string',
          helpText: 'Get your API key from your Slack Summary Scribe dashboard'
        }
      ],
      test: {
        url: `${ZAPIER_CONFIG.baseUrl}/api/zapier/auth/test`,
        method: 'GET',
        headers: {
          'Authorization': 'Bearer {{bundle.authData.api_key}}'
        }
      }
    },
    triggers: ZAPIER_TRIGGERS.reduce((acc, trigger) => {
      acc[trigger.id] = {
        key: trigger.id,
        noun: trigger.name,
        display: {
          label: trigger.name,
          description: trigger.description
        },
        operation: {
          type: trigger.type,
          inputFields: trigger.inputFields,
          outputFields: trigger.outputFields,
          sample: trigger.sampleData,
          ...(trigger.type === 'instant' ? {
            performSubscribe: {
              url: `${ZAPIER_CONFIG.baseUrl}/api/zapier/hooks`,
              method: 'POST',
              body: {
                trigger: trigger.id,
                target_url: '{{bundle.targetUrl}}'
              }
            },
            performUnsubscribe: {
              url: `${ZAPIER_CONFIG.baseUrl}/api/zapier/hooks/{{bundle.subscribeData.id}}`,
              method: 'DELETE'
            }
          } : {
            perform: {
              url: `${ZAPIER_CONFIG.baseUrl}/api/zapier/triggers/${trigger.id}`,
              method: 'GET'
            }
          })
        }
      };
      return acc;
    }, {} as Record<string, any>),
    creates: ZAPIER_ACTIONS.reduce((acc, action) => {
      acc[action.id] = {
        key: action.id,
        noun: action.name,
        display: {
          label: action.name,
          description: action.description
        },
        operation: {
          inputFields: action.inputFields,
          outputFields: action.outputFields,
          sample: action.sampleData,
          perform: {
            url: `${ZAPIER_CONFIG.baseUrl}/api/zapier/actions/${action.id}`,
            method: 'POST',
            body: '{{bundle.inputData}}'
          }
        }
      };
      return acc;
    }, {} as Record<string, any>)
  };
}

// Convenience functions
export const zapierIntegration = {
  // Webhook triggers
  triggerSummaryCreated: (summaryData: any, webhookUrls: string[]) =>
    triggerSummaryCreated(summaryData, webhookUrls),
  triggerFileUploaded: (fileData: any, webhookUrls: string[]) =>
    triggerFileUploaded(fileData, webhookUrls),
  
  // Action handlers
  createSummary: (input: any, userId: string) => handleCreateSummaryAction(input, userId),
  exportSummary: (input: any, userId: string) => handleExportSummaryAction(input, userId),
  
  // App definition
  getAppDefinition: () => getZapierAppDefinition(),
  
  // Webhook utilities
  sendWebhook: (url: string, payload: ZapierWebhookPayload) => sendZapierWebhook(url, payload)
};
