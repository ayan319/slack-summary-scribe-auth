import { WebClient } from '@slack/web-api';
import { InstallProvider } from '@slack/oauth';

// Slack OAuth configuration
export const slackConfig = {
  clientId: process.env.SLACK_CLIENT_ID!,
  clientSecret: process.env.SLACK_CLIENT_SECRET!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  redirectUri: process.env.SLACK_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/auth/slack/callback`,
  scopes: [
    'channels:read',
    'channels:history',
    'groups:read',
    'groups:history',
    'im:read',
    'im:history',
    'mpim:read',
    'mpim:history',
    'users:read',
    'team:read',
    'chat:write',
    'files:read'
  ],
  userScopes: [
    'channels:read',
    'groups:read',
    'im:read',
    'mpim:read'
  ]
};

// Initialize Slack OAuth installer
export const installer = new InstallProvider({
  clientId: slackConfig.clientId,
  clientSecret: slackConfig.clientSecret,
  stateSecret: process.env.SLACK_STATE_SECRET || 'default-state-secret',
  installationStore: {
    storeInstallation: async (installation) => {
      // Store installation in your database
      console.log('Storing installation:', installation);
      // TODO: Implement database storage
      return;
    },
    fetchInstallation: async (installQuery) => {
      // Fetch installation from your database
      console.log('Fetching installation:', installQuery);
      // TODO: Implement database fetch
      throw new Error('Installation not found');
    },
    deleteInstallation: async (installQuery) => {
      // Delete installation from your database
      console.log('Deleting installation:', installQuery);
      // TODO: Implement database deletion
      return;
    },
  },
});

// Create Slack Web API client
export function createSlackClient(token: string): WebClient {
  return new WebClient(token);
}

// Generate Slack OAuth URL
export function generateSlackOAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: slackConfig.clientId,
    scope: slackConfig.scopes.join(','),
    user_scope: slackConfig.userScopes.join(','),
    redirect_uri: slackConfig.redirectUri,
    state: state || 'default-state'
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

// Exchange code for tokens
export async function exchangeCodeForTokens(code: string, state?: string) {
  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: slackConfig.clientId,
        client_secret: slackConfig.clientSecret,
        code,
        redirect_uri: slackConfig.redirectUri,
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error || 'Failed to exchange code for tokens');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      teamId: data.team?.id,
      teamName: data.team?.name,
      userId: data.authed_user?.id,
      userToken: data.authed_user?.access_token,
      scope: data.scope,
      botUserId: data.bot_user_id,
      appId: data.app_id,
      tokenType: data.token_type,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

// Verify Slack token
export async function verifySlackToken(token: string) {
  try {
    const client = createSlackClient(token);
    const response = await client.auth.test();
    
    if (!response.ok) {
      throw new Error('Invalid Slack token');
    }

    return {
      userId: response.user_id,
      teamId: response.team_id,
      teamName: response.team,
      url: response.url,
      user: response.user,
      isBot: response.is_enterprise_install,
    };
  } catch (error) {
    console.error('Error verifying Slack token:', error);
    throw error;
  }
}

// Get workspace info
export async function getWorkspaceInfo(token: string) {
  try {
    const client = createSlackClient(token);
    const [authTest, teamInfo] = await Promise.all([
      client.auth.test(),
      client.team.info()
    ]);

    return {
      teamId: authTest.team_id,
      teamName: authTest.team,
      teamDomain: teamInfo.team?.domain,
      teamIcon: teamInfo.team?.icon?.image_132,
      url: authTest.url,
      userId: authTest.user_id,
      userName: authTest.user,
    };
  } catch (error) {
    console.error('Error getting workspace info:', error);
    throw error;
  }
}

// Get user channels
export async function getUserChannels(token: string) {
  try {
    const client = createSlackClient(token);
    const response = await client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 100
    });

    if (!response.ok) {
      throw new Error('Failed to fetch channels');
    }

    return response.channels?.map(channel => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private,
      isMember: channel.is_member,
      memberCount: channel.num_members,
      purpose: channel.purpose?.value,
      topic: channel.topic?.value,
    })) || [];
  } catch (error) {
    console.error('Error getting user channels:', error);
    throw error;
  }
}

// Refresh Slack token
export async function refreshSlackToken(refreshToken: string) {
  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: slackConfig.clientId,
        client_secret: slackConfig.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error || 'Failed to refresh token');
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  } catch (error) {
    console.error('Error refreshing Slack token:', error);
    throw error;
  }
}
