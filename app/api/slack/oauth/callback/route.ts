import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SentryTracker } from '@/lib/sentry.client';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Missing required parameter: code' },
        { status: 400 }
      );
    }

    // Parse state parameter if present
    let stateData = {};
    if (state) {
      try {
        stateData = JSON.parse(atob(state));
      } catch (e) {
        console.warn('Invalid state parameter:', e);
      }
    }

    SentryTracker.addAPIBreadcrumb('POST', '/api/slack/oauth/callback', userId, {
      state: stateData
    });

    // Exchange code for access token
    const slackClientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
    const slackClientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin')}/slack/connect`;

    if (!slackClientId || !slackClientSecret) {
      console.error('Missing Slack credentials');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: slackClientId,
        client_secret: slackClientSecret,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Slack token exchange failed:', await tokenResponse.text());
      return NextResponse.json(
        { error: 'Failed to exchange code for token' },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.ok) {
      console.error('Slack API error:', tokenData.error);
      return NextResponse.json(
        { error: `Slack API error: ${tokenData.error}` },
        { status: 500 }
      );
    }

    // Extract relevant data
    const {
      access_token,
      team,
      authed_user,
      scope,
      bot_user_id,
    } = tokenData;

    // Store the integration in the database
    const { data: integration, error: integrationError } = await supabase
      .from('slack_integrations')
      .upsert({
        user_id: userId,
        team_id: team.id,
        team_name: team.name,
        access_token,
        scope,
        bot_user_id,
        authed_user_id: authed_user.id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (integrationError) {
      console.error('Failed to store Slack integration:', integrationError);
      return NextResponse.json(
        { error: 'Failed to store integration data' },
        { status: 500 }
      );
    }

    // Create a notification for the user
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'slack_connected',
        title: '🎉 Slack Connected Successfully',
        message: `Your Slack workspace "${team.name}" has been connected. You can now generate summaries from your Slack conversations.`,
        data: {
          team_id: team.id,
          team_name: team.name,
        },
      });

    // Auto-complete onboarding step if applicable
    try {
      await supabase.rpc('complete_onboarding_step', {
        p_user_id: userId,
        p_step_name: 'connect_slack',
        p_step_data: { 
          team_id: team.id,
          team_name: team.name,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.warn('Failed to complete onboarding step:', error);
      // Non-critical error, continue
    }

    console.log('✅ Slack integration successful:', {
      userId,
      teamId: team.id,
      teamName: team.name
    });

    return NextResponse.json({
      success: true,
      data: {
        team_id: team.id,
        team_name: team.name,
        integration_id: integration.id
      }
    });

  } catch (error) {
    console.error('Slack OAuth callback error:', error);
    SentryTracker.captureException(error as Error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
