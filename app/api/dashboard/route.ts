import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, createRouteHandlerClient } from '@/lib/supabase';
import { fallbackStore } from '@/lib/fallback-store';

export async function GET(request: NextRequest) {
  try {
    // Check authentication using Supabase
    const response = NextResponse.next();
    const supabase = createRouteHandlerClient(request, response);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user's workspaces from Supabase (with fallback)
    let workspaces = null;
    let usingFallback = false;

    try {
      if (!supabaseAdmin) {
        throw new Error('Supabase admin client not available');
      }

      const { data, error: workspacesError } = await supabaseAdmin
        .from('organizations')
        .select(`
          *,
          user_organizations!inner(role)
        `)
        .eq('user_organizations.user_id', user.id)
        .order('created_at', { ascending: false });

      if (workspacesError) {
        throw workspacesError;
      }
      workspaces = data;
    } catch (error) {
      console.log('⚠️ Supabase workspaces table not available, using fallback store');
      usingFallback = true;
      workspaces = fallbackStore.workspaces.findByUserId(user.id);
    }

    // Fetch user's recent summaries from Supabase (with fallback)
    let summaries = null;

    if (usingFallback) {
      summaries = fallbackStore.summaries.findByUserId(user.id, 5);
    } else {
      try {
        if (!supabaseAdmin) {
          throw new Error('Supabase admin client not available');
        }

        const { data, error: summariesError } = await supabaseAdmin
          .from('summaries')
          .select('id, title, channel_name, message_count, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (summariesError) {
          throw summariesError;
        }
        summaries = data;
      } catch (error) {
        console.log('⚠️ Supabase summaries table not available, using fallback store');
        summaries = fallbackStore.summaries.findByUserId(user.id, 5);
      }
    }

    // Get total summaries count (with fallback)
    let totalSummaries = 0;
    let summariesThisMonth = 0;

    if (usingFallback) {
      totalSummaries = fallbackStore.summaries.countByUserId(user.id);
      summariesThisMonth = fallbackStore.summaries.countByUserIdThisMonth(user.id);
    } else {
      try {
        if (!supabaseAdmin) {
          throw new Error('Supabase admin client not available');
        }

        const { count, error: countError } = await supabaseAdmin
          .from('summaries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        if (countError) {
          throw countError;
        }
        totalSummaries = count || 0;

        // Calculate summaries this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: monthCount, error: monthCountError } = await supabaseAdmin
          .from('summaries')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth.toISOString());

        if (monthCountError) {
          throw monthCountError;
        }
        summariesThisMonth = monthCount || 0;
      } catch (error) {
        console.log('⚠️ Supabase summaries count not available, using fallback store');
        totalSummaries = fallbackStore.summaries.countByUserId(user.id);
        summariesThisMonth = fallbackStore.summaries.countByUserIdThisMonth(user.id);
      }
    }

    // Build dashboard data with real data from Supabase
    const dashboardData = {
      user: {
        id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User',
        email: user.email || '',
      },
      subscription: {
        plan: 'FREE',
        status: 'ACTIVE',
      },
      stats: {
        totalSummaries,
        workspacesConnected: workspaces?.filter((w: { connected: boolean }) => w.connected).length || 0,
        summariesThisMonth,
      },
      slackWorkspaces: workspaces?.map((workspace: { id: string; name: string; connected: boolean }) => ({
        id: workspace.id,
        name: workspace.name,
        connected: workspace.connected,
      })) || [],
      recentSummaries: summaries?.map((summary: {
        id: string;
        title: string;
        channel_name: string;
        created_at: string;
        message_count: number
      }) => ({
        id: summary.id,
        title: summary.title,
        channelName: summary.channel_name,
        createdAt: summary.created_at,
        messageCount: summary.message_count,
      })) || [],
    };

    // Log successful dashboard access
    console.log(`Dashboard accessed by user: ${user.email} (ID: ${user.id})`);

    return NextResponse.json({
      success: true,
      data: dashboardData,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email
      }
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
