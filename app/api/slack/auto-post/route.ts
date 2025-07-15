import { NextRequest, NextResponse } from 'next/server';
import { autoPostSummaryToSlack, retryFailedSlackPosts } from '@/lib/slack-auto-post';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SentryTracker } from '@/lib/sentry.client';

/**
 * POST /api/slack/auto-post
 * Manually trigger auto-post for a specific summary
 */
export async function POST(request: NextRequest) {
  try {
    const { summary_id, organization_id } = await request.json();

    if (!summary_id) {
      return NextResponse.json(
        { error: 'Summary ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization if not provided
    let orgId = organization_id;
    if (!orgId) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!userOrg) {
        return NextResponse.json(
          { error: 'No organization found for user' },
          { status: 400 }
        );
      }

      orgId = userOrg.organization_id;
    }

    // Verify user has access to the summary
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .select('id, user_id')
      .eq('id', summary_id)
      .eq('user_id', user.id)
      .single();

    if (summaryError || !summary) {
      return NextResponse.json(
        { error: 'Summary not found or access denied' },
        { status: 404 }
      );
    }

    // Attempt to post to Slack
    const postResult = await autoPostSummaryToSlack(
      summary_id,
      user.id,
      orgId
    );

    if (postResult.success) {
      return NextResponse.json({
        success: true,
        message: 'Summary posted to Slack successfully',
        data: {
          message_ts: postResult.message_ts,
          summary_id
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: postResult.error || 'Failed to post to Slack',
        details: 'Check your Slack integration and settings'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Slack auto-post API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/slack/auto-post
 * Get auto-post status and history for user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization if not provided
    let orgId = organizationId;
    if (!orgId) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!userOrg) {
        return NextResponse.json(
          { error: 'No organization found for user' },
          { status: 400 }
        );
      }

      orgId = userOrg.organization_id;
    }

    // Get user settings
    const { data: settings } = await supabase
      .from('user_settings')
      .select('auto_post_to_slack, slack_post_channel_preference')
      .eq('user_id', user.id)
      .eq('organization_id', orgId)
      .single();

    // Get recent post history
    const { data: postHistory, error: historyError } = await supabase
      .from('summary_posts')
      .select(`
        *,
        summaries!inner(title, created_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (historyError) {
      console.error('Error getting post history:', historyError);
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('summary_posts')
      .select('status')
      .eq('user_id', user.id);

    const statistics = {
      total_posts: stats?.length || 0,
      successful_posts: stats?.filter(s => s.status === 'posted').length || 0,
      failed_posts: stats?.filter(s => s.status === 'failed').length || 0,
      pending_posts: stats?.filter(s => s.status === 'pending').length || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        settings: {
          auto_post_enabled: settings?.auto_post_to_slack || false,
          channel_preference: settings?.slack_post_channel_preference || 'same_channel'
        },
        statistics,
        recent_posts: postHistory || []
      }
    });

  } catch (error) {
    console.error('Get Slack auto-post status API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/slack/auto-post
 * Update auto-post settings
 */
export async function PUT(request: NextRequest) {
  try {
    const { 
      auto_post_enabled, 
      channel_preference,
      organization_id 
    } = await request.json();

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization if not provided
    let orgId = organization_id;
    if (!orgId) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!userOrg) {
        return NextResponse.json(
          { error: 'No organization found for user' },
          { status: 400 }
        );
      }

      orgId = userOrg.organization_id;
    }

    // Validate channel preference
    if (channel_preference && !['same_channel', 'dm_user'].includes(channel_preference)) {
      return NextResponse.json(
        { error: 'Invalid channel preference. Must be "same_channel" or "dm_user"' },
        { status: 400 }
      );
    }

    // Update or create user settings
    const updateData: any = {
      user_id: user.id,
      organization_id: orgId,
      updated_at: new Date().toISOString()
    };

    if (typeof auto_post_enabled === 'boolean') {
      updateData.auto_post_to_slack = auto_post_enabled;
    }

    if (channel_preference) {
      updateData.slack_post_channel_preference = channel_preference;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      console.error('Error updating user settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Auto-post settings updated successfully',
      data: {
        auto_post_enabled: data.auto_post_to_slack,
        channel_preference: data.slack_post_channel_preference
      }
    });

  } catch (error) {
    console.error('Update Slack auto-post settings API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/slack/auto-post
 * Retry failed posts
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get current user (admin check could be added here)
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Retry failed posts
    await retryFailedSlackPosts();

    return NextResponse.json({
      success: true,
      message: 'Failed posts retry initiated'
    });

  } catch (error) {
    console.error('Retry failed Slack posts API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
