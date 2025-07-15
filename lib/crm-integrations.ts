import { createSupabaseServerClient } from './supabase-server';
import crypto from 'crypto';

// Types for CRM integrations
export type CRMType = 'hubspot' | 'salesforce' | 'notion';

export interface CRMIntegration {
  id: string;
  user_id: string;
  organization_id: string;
  crm_type: CRMType;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  crm_user_id?: string;
  crm_account_id?: string;
  settings: any;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CRMPushResult {
  success: boolean;
  crm_record_id?: string;
  error?: string;
  retry_count?: number;
}

export interface CRMPushLog {
  id: string;
  user_id: string;
  summary_id: string;
  crm_integration_id: string;
  crm_type: CRMType;
  crm_record_id?: string;
  status: 'pending' | 'success' | 'failed';
  error_log?: string;
  retry_count: number;
  pushed_at?: string;
  created_at: string;
  updated_at: string;
}

// Encryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!';

function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32));
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(ENCRYPTION_KEY.slice(0, 32));

  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Get OAuth URL for CRM integration
 */
export function getCRMOAuthUrl(crmType: CRMType, state: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const redirectUri = `${baseUrl}/api/crm/${crmType}/callback`;

  switch (crmType) {
    case 'hubspot':
      const hubspotScopes = 'contacts crm.objects.contacts.read crm.objects.contacts.write';
      return `https://app.hubspot.com/oauth/authorize?` +
        `client_id=${process.env.HUBSPOT_CLIENT_ID}&` +
        `scope=${encodeURIComponent(hubspotScopes)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;

    case 'salesforce':
      const salesforceScopes = 'api refresh_token';
      const salesforceUrl = process.env.SALESFORCE_SANDBOX_URL || 'https://login.salesforce.com';
      return `${salesforceUrl}/services/oauth2/authorize?` +
        `response_type=code&` +
        `client_id=${process.env.SALESFORCE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(salesforceScopes)}&` +
        `state=${state}`;

    case 'notion':
      return `https://api.notion.com/v1/oauth/authorize?` +
        `client_id=${process.env.NOTION_CLIENT_ID}&` +
        `response_type=code&` +
        `owner=user&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}`;

    default:
      throw new Error(`Unsupported CRM type: ${crmType}`);
  }
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeCRMOAuthCode(
  crmType: CRMType,
  code: string,
  redirectUri: string
): Promise<any> {
  switch (crmType) {
    case 'hubspot':
      return exchangeHubSpotCode(code, redirectUri);
    case 'salesforce':
      return exchangeSalesforceCode(code, redirectUri);
    case 'notion':
      return exchangeNotionCode(code, redirectUri);
    default:
      throw new Error(`Unsupported CRM type: ${crmType}`);
  }
}

// CRM Integration Management
export async function storeCRMIntegration(
  userId: string,
  organizationId: string,
  crmType: CRMType,
  tokenData: any
): Promise<CRMIntegration> {
  const supabase = await createSupabaseServerClient();

  // Encrypt sensitive tokens
  const encryptedAccessToken = encrypt(tokenData.access_token);
  const encryptedRefreshToken = tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null;

  const integrationData = {
    user_id: userId,
    organization_id: organizationId,
    crm_type: crmType,
    access_token: encryptedAccessToken,
    refresh_token: encryptedRefreshToken,
    token_expires_at: tokenData.expires_in
      ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      : null,
    crm_user_id: tokenData.user_id || tokenData.sub,
    crm_account_id: tokenData.hub_id || tokenData.instance_url,
    settings: {},
    is_active: true,
    last_sync_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('crm_integrations')
    .upsert(integrationData)
    .select()
    .single();

  if (error) {
    console.error('Error storing CRM integration:', error);
    throw new Error('Failed to store CRM integration');
  }

  return data;
}

/**
 * Exchange HubSpot OAuth code
 */
async function exchangeHubSpotCode(code: string, redirectUri: string) {
  const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.HUBSPOT_CLIENT_ID!,
      client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code
    })
  });

  if (!response.ok) {
    throw new Error(`HubSpot OAuth error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Exchange Salesforce OAuth code
 */
async function exchangeSalesforceCode(code: string, redirectUri: string) {
  const salesforceUrl = process.env.SALESFORCE_SANDBOX_URL || 'https://login.salesforce.com';

  const response = await fetch(`${salesforceUrl}/services/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SALESFORCE_CLIENT_ID!,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      code
    })
  });

  if (!response.ok) {
    throw new Error(`Salesforce OAuth error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Exchange Notion OAuth code
 */
async function exchangeNotionCode(code: string, redirectUri: string) {
  const auth = Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64');

  const response = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    throw new Error(`Notion OAuth error: ${response.statusText}`);
  }

  return response.json();
}

export async function getCRMIntegration(
  userId: string,
  organizationId: string,
  crmType: CRMType
): Promise<CRMIntegration | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('crm_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('crm_type', crmType)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    // Decrypt tokens
    data.access_token = decrypt(data.access_token);
    if (data.refresh_token) {
      data.refresh_token = decrypt(data.refresh_token);
    }

    return data;
  } catch (error) {
    console.error('Error getting CRM integration:', error);
    return null;
  }
}

/**
 * Push summary to CRM
 */
export async function pushSummaryToCRM(
  summaryId: string,
  userId: string,
  organizationId: string,
  crmType: CRMType
): Promise<CRMPushResult> {
  try {
    // Get CRM integration
    const integration = await getCRMIntegration(userId, organizationId, crmType);
    if (!integration) {
      return {
        success: false,
        error: `No active ${crmType} integration found`
      };
    }

    // Get summary details
    const summary = await getSummaryForCRM(summaryId, userId);
    if (!summary) {
      return {
        success: false,
        error: 'Summary not found or access denied'
      };
    }

    // Push to specific CRM
    let pushResult: CRMPushResult;
    switch (crmType) {
      case 'hubspot':
        pushResult = await pushToHubSpot(integration, summary);
        break;
      case 'salesforce':
        pushResult = await pushToSalesforce(integration, summary);
        break;
      case 'notion':
        pushResult = await pushToNotion(integration, summary);
        break;
      default:
        throw new Error(`Unsupported CRM type: ${crmType}`);
    }

    // Log the push attempt
    await logCRMPush(summaryId, userId, integration.id, crmType, pushResult);

    return pushResult;

  } catch (error) {
    console.error(`Error pushing to ${crmType}:`, error);

    const result = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    // Log failed attempt
    const integration = await getCRMIntegration(userId, organizationId, crmType);
    if (integration) {
      await logCRMPush(summaryId, userId, integration.id, crmType, result);
    }

    return result;
  }
}

/**
 * Get summary details for CRM push
 */
async function getSummaryForCRM(summaryId: string, userId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', summaryId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting summary for CRM:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSummaryForCRM:', error);
    return null;
  }
}

/**
 * Push to HubSpot
 */
async function pushToHubSpot(integration: CRMIntegration, summary: any): Promise<CRMPushResult> {
  try {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          hs_note_body: summary.content,
          hs_timestamp: new Date().toISOString(),
          hs_note_source: 'Slack Summary Scribe',
          hs_note_source_id: summary.id
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `HubSpot API error: ${error}` };
    }

    const data = await response.json();
    return {
      success: true,
      crm_record_id: data.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Push to Salesforce
 */
async function pushToSalesforce(integration: CRMIntegration, summary: any): Promise<CRMPushResult> {
  try {
    const instanceUrl = integration.crm_account_id;
    const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Note`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Title: summary.title || 'Slack Summary',
        Body: summary.content,
        IsPrivate: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Salesforce API error: ${error}` };
    }

    const data = await response.json();
    return {
      success: true,
      crm_record_id: data.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Push to Notion
 */
async function pushToNotion(integration: CRMIntegration, summary: any): Promise<CRMPushResult> {
  try {
    // For Notion, we'll create a page in the user's workspace
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.access_token}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: {
          type: 'page_id',
          page_id: integration.settings?.default_page_id || integration.crm_account_id
        },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: summary.title || 'Slack Summary'
                }
              }
            ]
          }
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: summary.content
                  }
                }
              ]
            }
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error: `Notion API error: ${error}` };
    }

    const data = await response.json();
    return {
      success: true,
      crm_record_id: data.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log CRM push attempt
 */
async function logCRMPush(
  summaryId: string,
  userId: string,
  crmIntegrationId: string,
  crmType: CRMType,
  result: CRMPushResult
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('summary_crm_pushes')
      .insert({
        user_id: userId,
        summary_id: summaryId,
        crm_integration_id: crmIntegrationId,
        crm_type: crmType,
        crm_record_id: result.crm_record_id,
        status: result.success ? 'success' : 'failed',
        error_log: result.error,
        retry_count: result.retry_count || 0,
        pushed_at: result.success ? new Date().toISOString() : null
      });

    if (error) {
      console.error('Error logging CRM push:', error);
    }
  } catch (error) {
    console.error('Error in logCRMPush:', error);
  }
}

/**
 * Get user CRM connections
 */
export async function getUserCRMConnections(userId: string, organizationId: string): Promise<CRMIntegration[]> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('crm_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to get CRM connections: ${error.message}`);
    }

    // Decrypt tokens for each connection
    return (data || []).map((integration: any) => ({
      ...integration,
      access_token: decrypt(integration.access_token),
      refresh_token: integration.refresh_token ? decrypt(integration.refresh_token) : undefined
    }));
  } catch (error) {
    console.error('Error getting user CRM connections:', error);
    return [];
  }
}

export async function revokeCRMIntegration(
  userId: string,
  organizationId: string,
  crmType: CRMType
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('crm_integrations')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('crm_type', crmType);

    if (error) {
      throw new Error(`Failed to revoke CRM integration: ${error.message}`);
    }
  } catch (error) {
    console.error('Error revoking CRM integration:', error);
    throw error;
  }
}

/**
 * Check if user has auto-push to CRM enabled
 */
export async function shouldAutoPushToCRM(userId: string, organizationId: string): Promise<boolean> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('user_settings')
      .select('auto_push_to_crm')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking auto-push setting:', error);
      return false;
    }

    return data?.auto_push_to_crm || false;
  } catch (error) {
    console.error('Error in shouldAutoPushToCRM:', error);
    return false;
  }
}
