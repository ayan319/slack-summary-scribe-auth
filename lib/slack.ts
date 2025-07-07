import { supabase } from './supabase';

// Slack API configuration
const SLACK_CLIENT_ID = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!;
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET!;
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET!;

export interface SlackOAuthResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id?: string;
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
  incoming_webhook?: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
  };
  bot?: {
    bot_user_id: string;
    bot_access_token: string;
  };
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
  pending_connected_team_ids: string[];
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

export interface SlackMessage {
  type: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  reply_count?: number;
  replies?: Array<{
    user: string;
    ts: string;
  }>;
  subscribed?: boolean;
  last_read?: string;
  unread_count?: number;
  parent_user_id?: string;
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
 * Generate Slack OAuth URL
 */
export function getSlackOAuthUrl(organizationId: string): string {
  const scopes = [
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
  ].join(',');

  const params = new URLSearchParams({
    client_id: SLACK_CLIENT_ID,
    scope: scopes,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/slack/callback`,
    state: organizationId,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token
 */
export async function exchangeSlackOAuthCode(code: string): Promise<SlackOAuthResponse> {
  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SLACK_CLIENT_ID,
      client_secret: SLACK_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/slack/callback`,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Failed to exchange OAuth code');
  }

  return data;
}

/**
 * Get Slack channels
 */
export async function getSlackChannels(accessToken: string): Promise<SlackChannel[]> {
  const response = await fetch('https://slack.com/api/conversations.list', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch channels');
  }

  return data.channels || [];
}

/**
 * Get channel messages
 */
export async function getChannelMessages(
  accessToken: string,
  channelId: string,
  limit: number = 100,
  oldest?: string
): Promise<SlackMessage[]> {
  const params = new URLSearchParams({
    channel: channelId,
    limit: limit.toString(),
  });

  if (oldest) {
    params.append('oldest', oldest);
  }

  const response = await fetch(`https://slack.com/api/conversations.history?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch messages');
  }

  return data.messages || [];
}

/**
 * Get Slack users
 */
export async function getSlackUsers(accessToken: string): Promise<SlackUser[]> {
  const response = await fetch('https://slack.com/api/users.list', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(data.error || 'Failed to fetch users');
  }

  return data.members || [];
}

/**
 * Store Slack integration in database
 */
export async function storeSlackIntegration(
  userId: string,
  organizationId: string,
  oauthData: SlackOAuthResponse
): Promise<void> {
  const { error } = await supabase
    .from('slack_integrations')
    .upsert({
      user_id: userId,
      organization_id: organizationId,
      slack_team_id: oauthData.team.id,
      slack_team_name: oauthData.team.name,
      access_token: oauthData.authed_user.access_token,
      bot_token: oauthData.bot?.bot_access_token || null,
      scope: oauthData.authed_user.scope,
      connected: true,
    }, {
      onConflict: 'organization_id,slack_team_id'
    });

  if (error) {
    throw new Error(`Failed to store Slack integration: ${error.message}`);
  }
}

/**
 * Get Slack integration for organization
 */
export async function getSlackIntegration(organizationId: string) {
  const { data, error } = await supabase
    .from('slack_integrations')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('connected', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to get Slack integration: ${error.message}`);
  }

  return data;
}

/**
 * Generate channel summary using AI
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
  try {
    // Get messages from the channel
    const oldest = timeRange?.start ? Math.floor(timeRange.start.getTime() / 1000).toString() : undefined;
    const messages = await getChannelMessages(accessToken, channelId, 100, oldest);

    if (messages.length === 0) {
      throw new Error('No messages found in the specified time range.');
    }

    // Get user information for message authors
    const users = await getSlackUsers(accessToken);
    const userMap = new Map(users.map(user => [user.id, user]));

    // Format messages for AI processing
    const formattedMessages = messages
      .filter(msg => msg.type === 'message' && !(msg as any).subtype && msg.text)
      .reverse() // Show chronological order
      .map(msg => {
        const user = userMap.get(msg.user);
        const timestamp = new Date(parseFloat(msg.ts) * 1000).toLocaleString();
        const userName = user?.real_name || user?.name || 'Unknown User';
        return `[${timestamp}] ${userName}: ${msg.text}`;
      })
      .join('\n');

    if (!formattedMessages.trim()) {
      throw new Error('No valid messages found for summarization.');
    }

    // Generate AI summary using DeepSeek
    const summary = await generateDeepSeekSummary(formattedMessages, channelName);

    // Store summary in database
    const { error } = await supabase
      .from('summaries')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        title: `${channelName} Summary - ${new Date().toLocaleDateString()}`,
        content: summary,
        channel_name: channelName,
        channel_id: channelId,
        message_count: messages.length,
        slack_team_id: slackTeamId,
      });

    if (error) {
      console.error('Error storing summary:', error);
      // Don't throw here, just log the error
    }

    return { summary, messageCount: messages.length };
  } catch (error) {
    console.error('Error generating channel summary:', error);
    throw error;
  }
}

/**
 * Generate AI summary using OpenRouter (DeepSeek R1 with GPT-4o-mini fallback)
 */
export async function generateDeepSeekSummary(messages: string, channelName: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  // Import OpenAI client here to avoid circular dependencies
  const { default: OpenAI } = await import('openai');

  const openRouterClient = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Slack Summarizer SaaS"
    }
  });

  const systemPrompt = `You are an AI assistant that creates concise, actionable summaries of Slack conversations.

Your task is to analyze the conversation and provide:
1. **Key Topics**: Main subjects discussed
2. **Important Decisions**: Any decisions made or agreed upon
3. **Action Items**: Tasks assigned or next steps mentioned
4. **Key Participants**: Most active contributors
5. **Summary**: Brief overview of the conversation

Format your response with clear sections using markdown. Be concise but comprehensive.`;

  const userPrompt = `Please summarize the following Slack conversation from the #${channelName} channel:\n\n${messages}`;

  try {
    // Try DeepSeek R1 first
    const completion = await openRouterClient.chat.completions.create({
      model: "deepseek/deepseek-r1:free",
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from DeepSeek R1');
    }

    return content;

  } catch (error) {
    console.error('DeepSeek R1 failed, trying GPT-4o-mini fallback:', error);

    // Fallback to GPT-4o-mini
    try {
      const fallbackCompletion = await openRouterClient.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.3,
      });

      const fallbackContent = fallbackCompletion.choices[0]?.message?.content;

      if (!fallbackContent) {
        throw new Error('No response from GPT-4o-mini fallback');
      }

      return fallbackContent;

    } catch (fallbackError) {
      console.error('Both DeepSeek R1 and GPT-4o-mini failed:', fallbackError);
      throw new Error(`AI summarization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
