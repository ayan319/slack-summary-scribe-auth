// HubSpot CRM Integration
export const HUBSPOT_CONFIG = {
  apiUrl: 'https://api.hubapi.com',
  scopes: [
    'contacts',
    'companies',
    'deals',
    'tickets',
    'timeline',
    'crm.objects.contacts.read',
    'crm.objects.contacts.write',
    'crm.objects.companies.read',
    'crm.objects.companies.write',
    'crm.objects.deals.read',
    'crm.objects.deals.write'
  ],
  redirectUri: process.env.HUBSPOT_REDIRECT_URI || 'http://localhost:3000/api/auth/hubspot/callback'
};

// HubSpot data interfaces
export interface HubSpotContact {
  id: string;
  properties: {
    email: string;
    firstname?: string;
    lastname?: string;
    company?: string;
    phone?: string;
    jobtitle?: string;
    lifecyclestage?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

export interface HubSpotCompany {
  id: string;
  properties: {
    name: string;
    domain?: string;
    industry?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    website?: string;
    numberofemployees?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount?: string;
    dealstage?: string;
    pipeline?: string;
    closedate?: string;
    createdate?: string;
    lastmodifieddate?: string;
  };
}

export interface HubSpotNote {
  engagement: {
    type: 'NOTE';
    timestamp: number;
  };
  associations: {
    contactIds?: number[];
    companyIds?: number[];
    dealIds?: number[];
  };
  metadata: {
    body: string;
    subject?: string;
  };
}

// Generate HubSpot OAuth URL
export function generateHubSpotAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: process.env.HUBSPOT_CLIENT_ID!,
    redirect_uri: HUBSPOT_CONFIG.redirectUri,
    scope: HUBSPOT_CONFIG.scopes.join(' '),
    response_type: 'code',
    state: state || 'hubspot-integration'
  });

  return `https://app.hubspot.com/oauth/authorize?${params.toString()}`;
}

// Exchange authorization code for tokens
export async function exchangeHubSpotCode(code: string): Promise<{
  success: boolean;
  tokens?: any;
  error?: string;
}> {
  try {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        redirect_uri: HUBSPOT_CONFIG.redirectUri,
        code
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
    }

    const tokens = await response.json();
    
    return {
      success: true,
      tokens
    };
  } catch (error) {
    console.error('Error exchanging HubSpot code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token exchange failed'
    };
  }
}

// Make authenticated HubSpot API request
async function makeHubSpotRequest(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<any> {
  const url = `${HUBSPOT_CONFIG.apiUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`HubSpot API error: ${response.status} ${errorData}`);
  }

  return response.json();
}

// Get HubSpot contacts
export async function getHubSpotContacts(
  accessToken: string,
  options?: {
    limit?: number;
    after?: string;
    properties?: string[];
  }
): Promise<{
  success: boolean;
  contacts?: HubSpotContact[];
  paging?: any;
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.after) params.append('after', options.after);
    if (options?.properties) {
      options.properties.forEach(prop => params.append('properties', prop));
    }

    const endpoint = `/crm/v3/objects/contacts?${params.toString()}`;
    const data = await makeHubSpotRequest(endpoint, accessToken);

    return {
      success: true,
      contacts: data.results,
      paging: data.paging
    };
  } catch (error) {
    console.error('Error fetching HubSpot contacts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch contacts'
    };
  }
}

// Create HubSpot contact
export async function createHubSpotContact(
  accessToken: string,
  contactData: Partial<HubSpotContact['properties']>
): Promise<{
  success: boolean;
  contact?: HubSpotContact;
  error?: string;
}> {
  try {
    const endpoint = '/crm/v3/objects/contacts';
    const data = await makeHubSpotRequest(endpoint, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        properties: contactData
      })
    });

    return {
      success: true,
      contact: data
    };
  } catch (error) {
    console.error('Error creating HubSpot contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create contact'
    };
  }
}

// Add note to HubSpot contact
export async function addNoteToHubSpotContact(
  accessToken: string,
  contactId: string,
  noteData: {
    subject?: string;
    body: string;
  }
): Promise<{
  success: boolean;
  note?: any;
  error?: string;
}> {
  try {
    const endpoint = '/engagements/v1/engagements';
    const data = await makeHubSpotRequest(endpoint, accessToken, {
      method: 'POST',
      body: JSON.stringify({
        engagement: {
          type: 'NOTE',
          timestamp: Date.now()
        },
        associations: {
          contactIds: [parseInt(contactId)]
        },
        metadata: {
          body: noteData.body,
          subject: noteData.subject || 'AI Summary Note'
        }
      })
    });

    return {
      success: true,
      note: data
    };
  } catch (error) {
    console.error('Error adding note to HubSpot contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add note'
    };
  }
}

// Get HubSpot companies
export async function getHubSpotCompanies(
  accessToken: string,
  options?: {
    limit?: number;
    after?: string;
    properties?: string[];
  }
): Promise<{
  success: boolean;
  companies?: HubSpotCompany[];
  paging?: any;
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.after) params.append('after', options.after);
    if (options?.properties) {
      options.properties.forEach(prop => params.append('properties', prop));
    }

    const endpoint = `/crm/v3/objects/companies?${params.toString()}`;
    const data = await makeHubSpotRequest(endpoint, accessToken);

    return {
      success: true,
      companies: data.results,
      paging: data.paging
    };
  } catch (error) {
    console.error('Error fetching HubSpot companies:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch companies'
    };
  }
}

// Get HubSpot deals
export async function getHubSpotDeals(
  accessToken: string,
  options?: {
    limit?: number;
    after?: string;
    properties?: string[];
  }
): Promise<{
  success: boolean;
  deals?: HubSpotDeal[];
  paging?: any;
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.after) params.append('after', options.after);
    if (options?.properties) {
      options.properties.forEach(prop => params.append('properties', prop));
    }

    const endpoint = `/crm/v3/objects/deals?${params.toString()}`;
    const data = await makeHubSpotRequest(endpoint, accessToken);

    return {
      success: true,
      deals: data.results,
      paging: data.paging
    };
  } catch (error) {
    console.error('Error fetching HubSpot deals:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch deals'
    };
  }
}

// Validate HubSpot connection
export async function validateHubSpotConnection(accessToken: string): Promise<{
  success: boolean;
  accountInfo?: any;
  error?: string;
}> {
  try {
    const endpoint = '/account-info/v3/details';
    const accountInfo = await makeHubSpotRequest(endpoint, accessToken);
    
    return {
      success: true,
      accountInfo
    };
  } catch (error) {
    console.error('Error validating HubSpot connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}

// Refresh HubSpot access token
export async function refreshHubSpotToken(refreshToken: string): Promise<{
  success: boolean;
  tokens?: any;
  error?: string;
}> {
  try {
    const response = await fetch('https://api.hubapi.com/oauth/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.HUBSPOT_CLIENT_ID!,
        client_secret: process.env.HUBSPOT_CLIENT_SECRET!,
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token refresh failed: ${response.status} ${errorData}`);
    }

    const tokens = await response.json();
    
    return {
      success: true,
      tokens
    };
  } catch (error) {
    console.error('Error refreshing HubSpot token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed'
    };
  }
}

// Convenience functions
export const hubspotIntegration = {
  // Generate auth URL
  getAuthUrl: (state?: string) => generateHubSpotAuthUrl(state),
  
  // Exchange code for tokens
  exchangeCode: (code: string) => exchangeHubSpotCode(code),
  
  // Get CRM data
  getContacts: (accessToken: string, options?: any) => getHubSpotContacts(accessToken, options),
  getCompanies: (accessToken: string, options?: any) => getHubSpotCompanies(accessToken, options),
  getDeals: (accessToken: string, options?: any) => getHubSpotDeals(accessToken, options),
  
  // Create/update data
  createContact: (accessToken: string, contactData: any) => createHubSpotContact(accessToken, contactData),
  addNote: (accessToken: string, contactId: string, noteData: any) => addNoteToHubSpotContact(accessToken, contactId, noteData),
  
  // Validate connection
  validateConnection: (accessToken: string) => validateHubSpotConnection(accessToken),
  
  // Refresh token
  refreshToken: (refreshToken: string) => refreshHubSpotToken(refreshToken)
};
