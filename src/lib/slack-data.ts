import { WebClient } from '@slack/web-api';
import { createSlackClient } from './slack-oauth';

export interface SlackMessage {
  ts: string;
  user: string;
  text: string;
  type: string;
  subtype?: string;
  thread_ts?: string;
  reply_count?: number;
  replies?: SlackMessage[];
  reactions?: Array<{
    name: string;
    count: number;
    users: string[];
  }>;
  files?: Array<{
    id: string;
    name: string;
    mimetype: string;
    url_private: string;
  }>;
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
  num_members: number;
  purpose?: {
    value: string;
    creator: string;
    last_set: number;
  };
  topic?: {
    value: string;
    creator: string;
    last_set: number;
  };
  created: number;
  creator: string;
}

export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  display_name: string;
  email?: string;
  is_bot: boolean;
  profile: {
    image_24: string;
    image_32: string;
    image_48: string;
    image_72: string;
    image_192: string;
    image_512: string;
  };
}

// Fetch channels from Slack workspace
export async function fetchSlackChannels(token: string): Promise<SlackChannel[]> {
  try {
    const client = createSlackClient(token);
    const response = await client.conversations.list({
      types: 'public_channel,private_channel',
      exclude_archived: true,
      limit: 200
    });

    if (!response.ok || !response.channels) {
      throw new Error('Failed to fetch channels');
    }

    return response.channels.map(channel => ({
      id: channel.id!,
      name: channel.name!,
      is_private: channel.is_private || false,
      is_member: channel.is_member || false,
      num_members: channel.num_members || 0,
      purpose: channel.purpose ? {
        value: channel.purpose.value || '',
        creator: channel.purpose.creator || '',
        last_set: channel.purpose.last_set || 0
      } : undefined,
      topic: channel.topic ? {
        value: channel.topic.value || '',
        creator: channel.topic.creator || '',
        last_set: channel.topic.last_set || 0
      } : undefined,
      created: channel.created || 0,
      creator: channel.creator || '',
    }));
  } catch (error) {
    console.error('Error fetching Slack channels:', error);
    throw error;
  }
}

// Fetch messages from a specific channel
export async function fetchChannelMessages(
  token: string, 
  channelId: string, 
  options: {
    oldest?: string;
    latest?: string;
    limit?: number;
    inclusive?: boolean;
  } = {}
): Promise<SlackMessage[]> {
  try {
    const client = createSlackClient(token);
    const { oldest, latest, limit = 100, inclusive = true } = options;

    const response = await client.conversations.history({
      channel: channelId,
      oldest,
      latest,
      limit,
      inclusive
    });

    if (!response.ok || !response.messages) {
      throw new Error('Failed to fetch messages');
    }

    return response.messages.map(msg => ({
      ts: msg.ts!,
      user: msg.user || msg.bot_id || 'unknown',
      text: msg.text || '',
      type: msg.type!,
      subtype: msg.subtype,
      thread_ts: msg.thread_ts,
      reply_count: msg.reply_count,
      reactions: msg.reactions?.map(reaction => ({
        name: reaction.name!,
        count: reaction.count!,
        users: reaction.users || []
      })),
      files: msg.files?.map(file => ({
        id: file.id!,
        name: file.name!,
        mimetype: file.mimetype!,
        url_private: file.url_private!
      }))
    }));
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    throw error;
  }
}

// Fetch thread replies
export async function fetchThreadReplies(
  token: string, 
  channelId: string, 
  threadTs: string
): Promise<SlackMessage[]> {
  try {
    const client = createSlackClient(token);
    const response = await client.conversations.replies({
      channel: channelId,
      ts: threadTs
    });

    if (!response.ok || !response.messages) {
      throw new Error('Failed to fetch thread replies');
    }

    return response.messages.slice(1).map(msg => ({ // Skip the parent message
      ts: msg.ts!,
      user: msg.user || msg.bot_id || 'unknown',
      text: msg.text || '',
      type: msg.type!,
      subtype: (msg as any).subtype,
      thread_ts: msg.thread_ts,
      reactions: msg.reactions?.map(reaction => ({
        name: reaction.name!,
        count: reaction.count!,
        users: reaction.users || []
      }))
    }));
  } catch (error) {
    console.error('Error fetching thread replies:', error);
    throw error;
  }
}

// Fetch user information
export async function fetchSlackUsers(token: string, userIds: string[]): Promise<SlackUser[]> {
  try {
    const client = createSlackClient(token);
    const users: SlackUser[] = [];

    // Fetch users in batches to avoid rate limits
    for (const userId of userIds) {
      try {
        const response = await client.users.info({ user: userId });
        if (response.ok && response.user) {
          const user = response.user;
          users.push({
            id: user.id!,
            name: user.name!,
            real_name: user.real_name || user.name!,
            display_name: user.profile?.display_name || user.real_name || user.name!,
            email: user.profile?.email,
            is_bot: user.is_bot || false,
            profile: {
              image_24: user.profile?.image_24 || '',
              image_32: user.profile?.image_32 || '',
              image_48: user.profile?.image_48 || '',
              image_72: user.profile?.image_72 || '',
              image_192: user.profile?.image_192 || '',
              image_512: user.profile?.image_512 || '',
            }
          });
        }
      } catch (userError) {
        console.warn(`Failed to fetch user ${userId}:`, userError);
      }
    }

    return users;
  } catch (error) {
    console.error('Error fetching Slack users:', error);
    throw error;
  }
}

// Get recent activity from multiple channels
export async function fetchRecentActivity(
  token: string, 
  channelIds: string[], 
  hoursBack: number = 24
): Promise<{
  channelId: string;
  channelName: string;
  messages: SlackMessage[];
  messageCount: number;
}[]> {
  try {
    const oldest = Math.floor((Date.now() - (hoursBack * 60 * 60 * 1000)) / 1000).toString();
    const channels = await fetchSlackChannels(token);
    const channelMap = new Map(channels.map(c => [c.id, c.name]));
    
    const activity = [];

    for (const channelId of channelIds) {
      try {
        const messages = await fetchChannelMessages(token, channelId, {
          oldest,
          limit: 50
        });

        // Filter out bot messages and system messages for cleaner summaries
        const relevantMessages = messages.filter(msg => 
          !msg.subtype || 
          !['bot_message', 'channel_join', 'channel_leave'].includes(msg.subtype)
        );

        if (relevantMessages.length > 0) {
          activity.push({
            channelId,
            channelName: channelMap.get(channelId) || channelId,
            messages: relevantMessages,
            messageCount: relevantMessages.length
          });
        }
      } catch (channelError) {
        console.warn(`Failed to fetch activity for channel ${channelId}:`, channelError);
      }
    }

    return activity.sort((a, b) => b.messageCount - a.messageCount);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
}

// Format messages for AI summarization
export function formatMessagesForSummary(
  messages: SlackMessage[], 
  users: SlackUser[], 
  channelName: string
): string {
  const userMap = new Map(users.map(u => [u.id, u.display_name || u.real_name || u.name]));
  
  const formattedMessages = messages.map(msg => {
    const userName = userMap.get(msg.user) || msg.user;
    const timestamp = new Date(parseFloat(msg.ts) * 1000).toLocaleString();
    
    let text = msg.text;
    
    // Clean up Slack formatting
    text = text.replace(/<@([A-Z0-9]+)>/g, (match, userId) => {
      const mentionedUser = userMap.get(userId) || userId;
      return `@${mentionedUser}`;
    });
    
    // Clean up channel mentions
    text = text.replace(/<#([A-Z0-9]+)\|([^>]+)>/g, '#$2');
    
    // Clean up links
    text = text.replace(/<([^|>]+)\|([^>]+)>/g, '$2 ($1)');
    text = text.replace(/<([^>]+)>/g, '$1');
    
    return `[${timestamp}] ${userName}: ${text}`;
  });

  return `# Slack Channel: #${channelName}\n\n${formattedMessages.join('\n\n')}`;
}
