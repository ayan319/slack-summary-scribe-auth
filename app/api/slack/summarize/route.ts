import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { getSlackIntegration, generateChannelSummary, getSlackChannels } from '@/lib/slack';

// Rate limiting for AI summarization
const summaryAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_SUMMARIES_PER_HOUR = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = summaryAttempts.get(identifier);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    const resetTime = now + RATE_LIMIT_WINDOW;
    summaryAttempts.set(identifier, { count: 1, resetTime });
    return { allowed: true, remaining: MAX_SUMMARIES_PER_HOUR - 1, resetTime };
  }

  if (record.count >= MAX_SUMMARIES_PER_HOUR) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: MAX_SUMMARIES_PER_HOUR - record.count, resetTime: record.resetTime };
}

export async function POST(request: NextRequest) {
  const response = NextResponse.next();
  
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient(request, response);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { organization_id, channel_id, channel_name, time_range } = body;

    if (!organization_id || !channel_id || !channel_name) {
      return NextResponse.json(
        { error: 'Missing required fields: organization_id, channel_id, channel_name' },
        { status: 400 }
      );
    }

    // Verify user belongs to the organization
    const { data: membership, error: membershipError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organization_id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    // Rate limiting
    const rateLimitKey = `summary:${user.id}:${organization_id}`;
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      const resetTimeMinutes = Math.ceil((rateLimit.resetTime - Date.now()) / (60 * 1000));
      return NextResponse.json(
        { 
          error: `Rate limit exceeded. Try again in ${resetTimeMinutes} minutes.`,
          rateLimit: {
            remaining: 0,
            resetTime: rateLimit.resetTime
          }
        },
        { status: 429 }
      );
    }

    // Get Slack integration for the organization
    const slackIntegration = await getSlackIntegration(organization_id);
    
    if (!slackIntegration) {
      return NextResponse.json(
        { error: 'Slack not connected for this organization' },
        { status: 400 }
      );
    }

    // Validate channel access
    const channels = await getSlackChannels(slackIntegration.access_token as string);
    const targetChannel = channels.find(ch => ch.id === channel_id);
    
    if (!targetChannel) {
      return NextResponse.json(
        { error: 'Channel not found or not accessible' },
        { status: 404 }
      );
    }

    // Parse time range if provided
    let timeRangeObj;
    if (time_range) {
      timeRangeObj = {
        start: new Date(time_range.start),
        end: new Date(time_range.end),
      };
    }

    // Generate summary
    const { summary, messageCount } = await generateChannelSummary(
      slackIntegration.access_token as string,
      channel_id,
      channel_name,
      user.id,
      organization_id,
      slackIntegration.slack_team_id as string,
      timeRangeObj
    );

    return NextResponse.json({
      success: true,
      summary,
      messageCount,
      channelName: channel_name,
      teamName: slackIntegration.slack_team_name,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime
      }
    });

  } catch (error) {
    console.error('Slack summarize error:', error);
    
    // Return appropriate error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Get available channels for summarization
export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient(request, response);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get organization ID from query params
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user belongs to the organization
    const { data: membership, error: membershipError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    // Get Slack integration for the organization
    const slackIntegration = await getSlackIntegration(organizationId);
    
    if (!slackIntegration) {
      return NextResponse.json(
        { error: 'Slack not connected for this organization' },
        { status: 400 }
      );
    }

    // Get available channels
    const channels = await getSlackChannels(slackIntegration.access_token as string);
    
    // Filter to only show channels the user can access
    const accessibleChannels = channels.filter(channel => 
      channel.is_member && !channel.is_archived
    );

    return NextResponse.json({
      success: true,
      channels: accessibleChannels.map(channel => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
        topic: channel.topic?.value || '',
        purpose: channel.purpose?.value || '',
        num_members: channel.num_members,
      })),
      teamName: slackIntegration.slack_team_name,
    });

  } catch (error) {
    console.error('Get channels error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}
