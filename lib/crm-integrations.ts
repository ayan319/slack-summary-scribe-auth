import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

export interface CRMToken {
  id: string;
  user_id: string;
  organization_id: string;
  crm_type: 'hubspot' | 'salesforce' | 'pipedrive';
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  instance_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CRMExport {
  id: string;
  user_id: string;
  summary_id: string;
  crm_type: 'hubspot' | 'salesforce' | 'pipedrive';
  crm_record_id: string;
  crm_record_url?: string;
  export_type: 'contact' | 'note' | 'activity' | 'deal';
  export_status: 'pending' | 'success' | 'failed';
  error_message?: string;
  created_at: string;
}

// Encryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-32-characters-long!!';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.slice(0, 32)), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// CRM Token Management
export async function storeCRMToken(
  userId: string,
  organizationId: string,
  crmType: 'hubspot' | 'salesforce' | 'pipedrive',
  accessToken: string,
  refreshToken?: string,
  expiresAt?: Date,
  instanceUrl?: string
): Promise<CRMToken> {
  const encryptedAccessToken = encrypt(accessToken);
  const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null;

  const { data, error } = await (supabaseAdmin as any)
    .from('crm_tokens')
    .upsert({
      user_id: userId,
      organization_id: organizationId,
      crm_type: crmType,
      access_token: encryptedAccessToken,
      refresh_token: encryptedRefreshToken,
      token_expires_at: expiresAt?.toISOString(),
      instance_url: instanceUrl,
      is_active: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,organization_id,crm_type'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store CRM token: ${error.message}`);
  }

  return data;
}

export async function getCRMToken(
  userId: string,
  organizationId: string,
  crmType: 'hubspot' | 'salesforce' | 'pipedrive'
): Promise<CRMToken | null> {
  const { data, error } = await (supabaseAdmin as any)
    .from('crm_tokens')
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
}

export async function getUserCRMConnections(userId: string, organizationId: string): Promise<CRMToken[]> {
  const { data, error } = await (supabaseAdmin as any)
    .from('crm_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to get CRM connections: ${error.message}`);
  }

  // Decrypt tokens for each connection
  return (data || []).map((token: any) => ({
    ...token,
    access_token: decrypt(token.access_token),
    refresh_token: token.refresh_token ? decrypt(token.refresh_token) : undefined
  }));
}

export async function revokeCRMToken(
  userId: string,
  organizationId: string,
  crmType: 'hubspot' | 'salesforce' | 'pipedrive'
): Promise<void> {
  const { error } = await (supabaseAdmin as any)
    .from('crm_tokens')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('crm_type', crmType);

  if (error) {
    throw new Error(`Failed to revoke CRM token: ${error.message}`);
  }
}

// OAuth URL Generation
export function getHubSpotOAuthURL(state: string): string {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/crm/hubspot/callback`;
  const scopes = 'crm.objects.contacts.read crm.objects.contacts.write crm.objects.companies.read crm.objects.deals.read';

  return `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;
}

export function getSalesforceOAuthURL(state: string): string {
  const clientId = process.env.SALESFORCE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/crm/salesforce/callback`;
  const baseUrl = process.env.SALESFORCE_SANDBOX_URL || 'https://login.salesforce.com';

  return `${baseUrl}/services/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
}

export function getPipedriveOAuthURL(state: string): string {
  const clientId = process.env.PIPEDRIVE_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/crm/pipedrive/callback`;

  return `https://oauth.pipedrive.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
}

// CRM Export Functions
export async function exportToHubSpot(
  accessToken: string,
  summary: any,
  exportType: 'contact' | 'note' | 'activity' = 'note'
): Promise<{ success: boolean; recordId?: string; recordUrl?: string; error?: string }> {
  try {
    if (exportType === 'note') {
      // Create a note/engagement in HubSpot
      const response = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
        recordId: data.id,
        recordUrl: `https://app.hubspot.com/contacts/notes/${data.id}`
      };
    }

    return { success: false, error: 'Unsupported export type' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function exportToSalesforce(
  accessToken: string,
  instanceUrl: string,
  summary: any,
  exportType: 'contact' | 'note' | 'activity' = 'note'
): Promise<{ success: boolean; recordId?: string; recordUrl?: string; error?: string }> {
  try {
    if (exportType === 'note') {
      // Create a Note in Salesforce
      const response = await fetch(`${instanceUrl}/services/data/v57.0/sobjects/Note`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
        recordId: data.id,
        recordUrl: `${instanceUrl}/lightning/r/Note/${data.id}/view`
      };
    }

    return { success: false, error: 'Unsupported export type' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function exportToPipedrive(
  accessToken: string,
  summary: any,
  exportType: 'contact' | 'note' | 'activity' = 'note'
): Promise<{ success: boolean; recordId?: string; recordUrl?: string; error?: string }> {
  try {
    if (exportType === 'note') {
      // Create a Note in Pipedrive
      const response = await fetch('https://api.pipedrive.com/v1/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: summary.content,
          add_time: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error: `Pipedrive API error: ${error}` };
      }

      const data = await response.json();
      return {
        success: true,
        recordId: data.data.id.toString(),
        recordUrl: `https://app.pipedrive.com/notes/list`
      };
    }

    return { success: false, error: 'Unsupported export type' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Track CRM Export
export async function trackCRMExport(
  userId: string,
  summaryId: string,
  crmType: 'hubspot' | 'salesforce' | 'pipedrive',
  exportType: 'contact' | 'note' | 'activity',
  result: { success: boolean; recordId?: string; recordUrl?: string; error?: string }
): Promise<CRMExport> {
  const { data, error } = await (supabaseAdmin as any)
    .from('crm_exports')
    .insert({
      user_id: userId,
      summary_id: summaryId,
      crm_type: crmType,
      crm_record_id: result.recordId || '',
      crm_record_url: result.recordUrl,
      export_type: exportType,
      export_status: result.success ? 'success' : 'failed',
      error_message: result.error,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to track CRM export: ${error.message}`);
  }

  return data;
}
