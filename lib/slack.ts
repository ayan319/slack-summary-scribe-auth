// Slack integration removed - demo mode

export interface SlackOAuthResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise?: {
    id: string;
    name: string;
  };
  authed_user: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
}

export interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  reply_broadcast?: boolean;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_channel: boolean;
  is_group: boolean;
  is_im: boolean;
  is_mpim: boolean;
  is_private: boolean;
  created: number;
  is_archived: boolean;
  is_general: boolean;
  unlinked: number;
  name_normalized: string;
  is_shared: boolean;
  is_ext_shared: boolean;
  is_org_shared: boolean;
  pending_shared: string[];
  is_pending_ext_shared: boolean;
  is_member: boolean;
  is_open: boolean;
  topic: {
    value: string;
    creator: string;
    last_set: number;
  };
  purpose: {
    value: string;
    creator: string;
    last_set: number;
  };
  previous_names: string[];
  num_members?: number;
}

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: {
    title: string;
    phone: string;
    skype: string;
    real_name: string;
    real_name_normalized: string;
    display_name: string;
    display_name_normalized: string;
    fields: any;
    status_text: string;
    status_emoji: string;
    status_expiration: number;
    avatar_hash: string;
    image_original?: string;
    is_custom_image?: boolean;
    email?: string;
    first_name: string;
    last_name: string;
    image_24: string;
    image_32: string;
    image_48: string;
    image_72: string;
    image_192: string;
    image_512: string;
    image_1024?: string;
    status_text_canonical: string;
    team: string;
  };
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  is_app_user: boolean;
  updated: number;
  is_email_confirmed: boolean;
  who_can_share_contact_card: string;
}

/**
 * Get Slack OAuth URL (demo mode)
 */
export function getSlackOAuthUrl(
  clientId: string,
  redirectUri: string,
  state?: string,
  scopes: string[] = ['channels:read', 'chat:write', 'users:read']
): string {
  console.log('🔗 Getting Slack OAuth URL (demo mode):', { clientId, redirectUri, state, scopes });
  
  // Return a demo URL that won't actually work but shows the structure
  return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state || 'demo-state'}`;
}

/**
 * Exchange OAuth code for access token (demo mode)
 */
export async function exchangeSlackOAuthCode(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<SlackOAuthResponse> {
  console.log('🔄 Exchanging Slack OAuth code (demo mode):', { clientId, code, redirectUri });
  
  // Return demo OAuth response
  return {
    ok: true,
    access_token: 'xoxb-demo-access-token',
    token_type: 'bot',
    scope: 'channels:read,chat:write,users:read',
    bot_user_id: 'U0DEMO123',
    app_id: 'A0DEMO456',
    team: {
      id: 'T0DEMO789',
      name: 'Demo Team'
    },
    authed_user: {
      id: 'U0DEMOUSER',
      scope: 'channels:read,chat:write,users:read',
      access_token: 'xoxp-demo-user-token',
      token_type: 'user'
    }
  };
}

/**
 * Store Slack integration (demo mode)
 */
export async function storeSlackIntegration(
  userId: string,
  organizationId: string,
  oauthData: SlackOAuthResponse
): Promise<void> {
  console.log('💾 Storing Slack integration (demo mode):', {
    userId,
    organizationId,
    teamId: oauthData.team.id,
    teamName: oauthData.team.name
  });
}

/**
 * Get Slack integration for user
 */
export async function getSlackIntegration(userId: string, organizationId?: string) {
  try {
    const { createServerClient } = await import('@supabase/ssr');
    const { cookies } = await import('next/headers');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          async get(name: string) {
            const cookieStore = await cookies();
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const query = supabase
      .from('slack_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true);

    if (organizationId) {
      query.eq('organization_id', organizationId);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching Slack integration:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSlackIntegration:', error);
    return null;
  }
}

/**
 * Send message to Slack (demo mode)
 */
export async function sendSlackMessage(
  accessToken: string,
  message: SlackMessage
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  console.log('📤 Sending Slack message (demo mode):', { message });
  
  return {
    ok: true,
    ts: `${Date.now()}.000100`
  };
}

/**
 * Get Slack channels (demo mode)
 */
export async function getSlackChannels(accessToken: string): Promise<SlackChannel[]> {
  console.log('📋 Getting Slack channels (demo mode)');
  
  return [
    {
      id: 'C0DEMO123',
      name: 'general',
      is_channel: true,
      is_group: false,
      is_im: false,
      is_mpim: false,
      is_private: false,
      created: Date.now() / 1000,
      is_archived: false,
      is_general: true,
      unlinked: 0,
      name_normalized: 'general',
      is_shared: false,
      is_ext_shared: false,
      is_org_shared: false,
      pending_shared: [],
      is_pending_ext_shared: false,
      is_member: true,
      is_open: true,
      topic: {
        value: 'Company-wide announcements and work-based matters',
        creator: 'U0DEMOUSER',
        last_set: Date.now() / 1000
      },
      purpose: {
        value: 'This channel is for team-wide communication and announcements.',
        creator: 'U0DEMOUSER',
        last_set: Date.now() / 1000
      },
      previous_names: [],
      num_members: 5
    }
  ];
}

/**
 * Get Slack users (demo mode)
 */
export async function getSlackUsers(accessToken: string): Promise<SlackUser[]> {
  console.log('👥 Getting Slack users (demo mode)');
  
  return [
    {
      id: 'U0DEMOUSER',
      team_id: 'T0DEMO789',
      name: 'demo.user',
      deleted: false,
      color: '9f69e7',
      real_name: 'Demo User',
      tz: 'America/New_York',
      tz_label: 'Eastern Standard Time',
      tz_offset: -18000,
      profile: {
        title: 'Software Engineer',
        phone: '',
        skype: '',
        real_name: 'Demo User',
        real_name_normalized: 'Demo User',
        display_name: 'Demo',
        display_name_normalized: 'Demo',
        fields: {},
        status_text: '',
        status_emoji: '',
        status_expiration: 0,
        avatar_hash: 'g123456789',
        email: 'demo@example.com',
        first_name: 'Demo',
        last_name: 'User',
        image_24: 'https://secure.gravatar.com/avatar/demo?s=24',
        image_32: 'https://secure.gravatar.com/avatar/demo?s=32',
        image_48: 'https://secure.gravatar.com/avatar/demo?s=48',
        image_72: 'https://secure.gravatar.com/avatar/demo?s=72',
        image_192: 'https://secure.gravatar.com/avatar/demo?s=192',
        image_512: 'https://secure.gravatar.com/avatar/demo?s=512',
        status_text_canonical: '',
        team: 'T0DEMO789'
      },
      is_admin: true,
      is_owner: true,
      is_primary_owner: true,
      is_restricted: false,
      is_ultra_restricted: false,
      is_bot: false,
      is_app_user: false,
      updated: Date.now() / 1000,
      is_email_confirmed: true,
      who_can_share_contact_card: 'EVERYONE'
    }
  ];
}

/**
 * Test Slack connection (demo mode)
 */
export async function testSlackConnection(accessToken: string): Promise<{ ok: boolean; error?: string }> {
  console.log('🧪 Testing Slack connection (demo mode)');

  return { ok: true };
}

/**
 * Disconnect Slack integration (demo mode)
 */
export async function disconnectSlackIntegration(userId: string, organizationId?: string): Promise<void> {
  console.log('🔌 Disconnecting Slack integration (demo mode):', { userId, organizationId });
}

/**
 * Generate channel summary (demo mode)
 */
export async function generateChannelSummary(
  accessToken: string,
  channelId: string,
  channelName: string,
  userId: string,
  organizationId: string,
  slackTeamId: string,
  timeRange?: { start: Date; end: Date }
): Promise<{ summary: string; messageCount: number }> {
  console.log('📊 Generating channel summary (demo mode):', { channelId, channelName, timeRange });

  return {
    summary: `Demo summary for #${channelName} channel. This is a sample summary showing recent activity and key discussions. The team discussed project updates, shared important announcements, and collaborated on various tasks.`,
    messageCount: 42
  };
}

/**
 * Generate DeepSeek summary (demo mode)
 */
export async function generateDeepSeekSummary(messages: string, channelName: string): Promise<string> {
  console.log('🤖 Generating DeepSeek summary (demo mode):', { messagesLength: messages.length, channelName });

  return `# Demo AI Summary for #${channelName}

## Key Topics
- Project updates and milestones
- Team collaboration improvements
- Resource allocation discussions

## Important Decisions
- Approved new feature development
- Scheduled weekly team meetings
- Updated project timeline

## Action Items
- [ ] Complete feature specifications by Friday
- [ ] Schedule client review meeting
- [ ] Update project documentation

## Key Participants
- demo.user (most active)
- john.doe
- jane.smith

## Summary
This conversation focused on project coordination and team alignment. The team made significant progress on planning and established clear next steps for upcoming deliverables.`;
}

/**
 * Get channel messages (demo mode)
 */
export async function getChannelMessages(
  accessToken: string,
  channelId: string,
  limit: number = 100,
  oldest?: string
): Promise<any[]> {
  console.log('💬 Getting channel messages (demo mode):', { channelId, limit, oldest });

  return [
    {
      type: 'message',
      user: 'U0DEMOUSER',
      text: 'Hey team, how is the project coming along?',
      ts: (Date.now() / 1000 - 3600).toString()
    },
    {
      type: 'message',
      user: 'U0DEMO123',
      text: 'Making good progress! Should have the first draft ready by tomorrow.',
      ts: (Date.now() / 1000 - 3000).toString()
    },
    {
      type: 'message',
      user: 'U0DEMOUSER',
      text: 'Excellent! Let me know if you need any help.',
      ts: (Date.now() / 1000 - 1800).toString()
    }
  ];
}
