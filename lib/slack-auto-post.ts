import { createSupabaseServerClient } from './supabase-server';

// Types for Slack auto-posting
export interface SlackPostResult {
  success: boolean;
  message_ts?: string;
  error?: string;
  retry_count?: number;
}

export interface SlackPostOptions {
  channel_id: string;
  channel_preference: 'same_channel' | 'dm_user';
  user_id: string;
  summary_id: string;
}

/**
 * Auto-post summary to Slack channel or DM
 */
export async function autoPostSummaryToSlack(
  summaryId: string,
  userId: string,
  organizationId: string
): Promise<SlackPostResult> {
  try {
    // Check if user has auto-post enabled
    const settings = await getUserSettings(userId, organizationId);
    if (!settings?.auto_post_to_slack) {
      return {
        success: false,
        error: 'Auto-post to Slack is disabled for this user'
      };
    }

    // Get summary details
    const summary = await getSummaryDetails(summaryId, userId);
    if (!summary) {
      return {
        success: false,
        error: 'Summary not found or access denied'
      };
    }

    // Get Slack integration
    const slackIntegration = await getSlackIntegration(userId, organizationId);
    if (!slackIntegration) {
      return {
        success: false,
        error: 'No active Slack integration found'
      };
    }

    // Determine target channel
    const targetChannel = settings.slack_post_channel_preference === 'dm_user'
      ? await getSlackUserDM(slackIntegration.access_token, slackIntegration.authed_user_id)
      : summary.slack_channel || '#general';

    // Format summary for Slack
    const slackMessage = formatSummaryForSlack(summary);

    // Post to Slack
    const postResult = await postMessageToSlack(
      slackIntegration.access_token,
      targetChannel,
      slackMessage
    );

    // Log the post attempt
    await logSlackPost(summaryId, userId, targetChannel, postResult);

    return postResult;

  } catch (error) {
    console.error('Auto-post to Slack error:', error);
    
    // Log failed attempt
    await logSlackPost(summaryId, userId, '', {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get user settings for auto-posting
 */
async function getUserSettings(userId: string, organizationId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error getting user settings:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    return null;
  }
}

/**
 * Get summary details
 */
async function getSummaryDetails(summaryId: string, userId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', summaryId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting summary details:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSummaryDetails:', error);
    return null;
  }
}

/**
 * Get Slack integration for user/organization
 */
async function getSlackIntegration(userId: string, organizationId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from('slack_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error getting Slack integration:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getSlackIntegration:', error);
    return null;
  }
}

/**
 * Get Slack user DM channel
 */
async function getSlackUserDM(accessToken: string, userId: string): Promise<string> {
  try {
    const response = await fetch('https://slack.com/api/conversations.open', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        users: userId
      })
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data.channel.id;
  } catch (error) {
    console.error('Error getting Slack DM channel:', error);
    throw error;
  }
}

/**
 * Format summary for Slack posting
 */
function formatSummaryForSlack(summary: any) {
  const title = summary.title || 'Summary';
  const content = summary.content || '';
  
  // Truncate content if too long for Slack
  const maxLength = 3000;
  const truncatedContent = content.length > maxLength 
    ? content.substring(0, maxLength) + '...\n\n_[Content truncated - view full summary in dashboard]_'
    : content;

  return {
    text: `📋 *${title}*`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `📋 ${title}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: truncatedContent
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Generated by Slack Summary Scribe • ${new Date().toLocaleString()}`
          }
        ]
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Full Summary'
            },
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/summaries/${summary.id}`,
            action_id: 'view_summary'
          }
        ]
      }
    ]
  };
}

/**
 * Post message to Slack
 */
async function postMessageToSlack(
  accessToken: string,
  channel: string,
  message: any
): Promise<SlackPostResult> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        text: message.text,
        blocks: message.blocks,
        unfurl_links: false,
        unfurl_media: false
      })
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return {
      success: true,
      message_ts: data.ts
    };

  } catch (error) {
    console.error('Error posting to Slack:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log Slack post attempt
 */
async function logSlackPost(
  summaryId: string,
  userId: string,
  channelId: string,
  result: SlackPostResult
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase
      .from('summary_posts')
      .insert({
        user_id: userId,
        summary_id: summaryId,
        slack_channel_id: channelId,
        slack_message_ts: result.message_ts,
        status: result.success ? 'posted' : 'failed',
        error_log: result.error,
        retry_count: result.retry_count || 0,
        posted_at: result.success ? new Date().toISOString() : null
      });

    if (error) {
      console.error('Error logging Slack post:', error);
    }
  } catch (error) {
    console.error('Error in logSlackPost:', error);
  }
}

/**
 * Retry failed Slack posts
 */
export async function retryFailedSlackPosts(maxRetries: number = 3): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();

    // Get failed posts that haven't exceeded max retries
    const { data: failedPosts, error } = await supabase
      .from('summary_posts')
      .select(`
        *,
        summaries!inner(*)
      `)
      .eq('status', 'failed')
      .lt('retry_count', maxRetries)
      .order('created_at', { ascending: true })
      .limit(10);

    if (error || !failedPosts?.length) {
      return;
    }

    for (const post of failedPosts) {
      try {
        // Get user's organization
        const { data: userOrg } = await supabase
          .from('user_organizations')
          .select('organization_id')
          .eq('user_id', post.user_id)
          .limit(1)
          .single();

        if (!userOrg) continue;

        // Retry the post
        const retryResult = await autoPostSummaryToSlack(
          post.summary_id,
          post.user_id,
          userOrg.organization_id
        );

        // Update the post record
        await supabase
          .from('summary_posts')
          .update({
            status: retryResult.success ? 'posted' : 'failed',
            slack_message_ts: retryResult.message_ts,
            error_log: retryResult.error,
            retry_count: post.retry_count + 1,
            posted_at: retryResult.success ? new Date().toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);

      } catch (retryError) {
        console.error(`Error retrying Slack post ${post.id}:`, retryError);
      }
    }

  } catch (error) {
    console.error('Error in retryFailedSlackPosts:', error);
  }
}
