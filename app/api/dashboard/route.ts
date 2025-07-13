import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  console.log('📊 Dashboard API called');

  try {
    // Require authentication
    const user = await getAuthenticatedUser(request);

    console.log('📊 Dashboard auth check:', {
      authenticated: !!user,
      userId: user?.id,
      email: user?.email
    });

    if (!user) {
      console.log('📊 Dashboard: No authenticated user, returning 401');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
    }

    // Fetch user's summaries count
    const { count: summariesCount } = await supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Fetch recent summaries
    const { data: recentSummaries } = await supabase
      .from('summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch Slack integrations
    const { data: slackIntegrations } = await supabase
      .from('slack_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true);

    // Fetch unread notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .is('read_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate stats
    const stats = {
      totalSummaries: summariesCount || 0,
      workspacesConnected: slackIntegrations?.length || 0,
      summariesThisMonth: recentSummaries?.filter(s =>
        new Date(s.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0
    };

    // Demo data for better UX when no real data exists
    const demoSummaries = [
      {
        id: 'demo-summary-1',
        title: 'Team Standup Summary',
        channelName: '#general',
        messageCount: 15,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-summary-2',
        title: 'Product Planning Meeting',
        channelName: '#product',
        messageCount: 28,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'demo-summary-3',
        title: 'Engineering Discussion',
        channelName: '#engineering',
        messageCount: 42,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const demoSlackWorkspaces = [
      {
        id: 'demo-workspace-1',
        name: 'Acme Corp',
        connected: true,
        team_id: 'T1234567890',
      },
    ];

    const demoNotifications = [
      {
        id: 'demo-notif-1',
        title: 'New Summary Generated',
        message: 'Your Team Standup Summary is ready to review',
        type: 'summary_complete',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        read_at: null,
      },
    ];

    const dashboardData = {
      user: user ? {
        id: user.id,
        name: userData?.name || user.email?.split('@')[0],
        email: user.email,
        avatar_url: userData?.avatar_url
      } : null,
      subscription: {
        plan: 'FREE', // TODO: Add subscription logic
        status: 'ACTIVE'
      },
      stats: stats,
      slackWorkspaces: (slackIntegrations && slackIntegrations.length > 0)
        ? slackIntegrations.map(integration => ({
            id: integration.id,
            name: integration.slack_team_name,
            connected: integration.active,
            team_id: integration.slack_team_id
          }))
        : [],
      recentSummaries: (recentSummaries && recentSummaries.length > 0)
        ? recentSummaries.map(summary => ({
            id: summary.id,
            title: summary.title,
            channelName: summary.source_data?.channel_name || 'Unknown Channel',
            createdAt: summary.created_at,
            messageCount: summary.source_data?.message_count || 0
          }))
        : [],
      notifications: (notifications && notifications.length > 0)
        ? notifications
        : []
    };


    return NextResponse.json({
      success: true,
      data: dashboardData,
      user: dashboardData.user
    });

  } catch (error) {
    console.error('Dashboard API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error. Please try again later.'
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use GET to fetch dashboard data.' 
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use GET to fetch dashboard data.' 
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { 
      error: 'Method not allowed. Use GET to fetch dashboard data.' 
    },
    { status: 405 }
  );
}
