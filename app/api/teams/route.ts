import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    let userId = null;
    
    if (sessionError || !session) {
      console.log('No session found, returning demo teams data for testing');
      // For testing purposes, return demo teams when no session
      userId = 'demo-user';
    } else {
      userId = session.user.id;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const includeInactive = searchParams.get('include_inactive') === 'true';

    // Demo mode - return mock teams data
    if (userId) {
      const mockTeams = generateMockTeams(limit, offset, search, includeInactive);
      return NextResponse.json({
        success: true,
        data: mockTeams.teams,
        pagination: mockTeams.pagination,
        total: mockTeams.total
      });
    }

    // In production, this would fetch real teams from the database
    const teams = await fetchUserTeams(supabase, userId, limit, offset, search, includeInactive);

    return NextResponse.json({
      success: true,
      data: teams.teams,
      pagination: teams.pagination,
      total: teams.total
    });

  } catch (error) {
    console.error('Teams API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    
    const { name, description, slack_team_id, settings } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    // Create new team
    const newTeam = {
      id: `team-${Date.now()}`,
      name,
      description: description || '',
      slack_team_id: slack_team_id || null,
      owner_id: userId,
      settings: settings || {
        auto_summarize: true,
        summary_frequency: 'daily',
        ai_model: 'deepseek-r1',
        notification_preferences: {
          email: true,
          slack: true,
          in_app: true
        }
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      member_count: 1,
      plan: 'free'
    };

    return NextResponse.json({
      success: true,
      data: newTeam
    });

  } catch (error) {
    console.error('Create team API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateMockTeams(limit: number, offset: number, search: string, includeInactive: boolean) {
  // Generate a large dataset for testing
  const totalTeams = 1000;
  const teams = [];

  for (let i = 0; i < totalTeams; i++) {
    const teamNumber = i + 1;
    const team = {
      id: `team-${teamNumber}`,
      name: `Team ${teamNumber}`,
      description: `Description for Team ${teamNumber}`,
      slack_team_id: `T${String(teamNumber).padStart(8, '0')}`,
      owner_id: `user-${Math.floor(Math.random() * 100) + 1}`,
      settings: {
        auto_summarize: Math.random() > 0.3,
        summary_frequency: ['daily', 'weekly', 'manual'][Math.floor(Math.random() * 3)],
        ai_model: ['deepseek-r1', 'gpt-4o', 'claude-3-5-sonnet'][Math.floor(Math.random() * 3)],
        notification_preferences: {
          email: Math.random() > 0.2,
          slack: Math.random() > 0.1,
          in_app: Math.random() > 0.1
        }
      },
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: includeInactive ? Math.random() > 0.1 : true,
      member_count: Math.floor(Math.random() * 50) + 1,
      plan: ['free', 'pro', 'enterprise'][Math.floor(Math.random() * 3)],
      last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      summary_count: Math.floor(Math.random() * 200),
      ai_usage_this_month: Math.floor(Math.random() * 1000),
    };

    teams.push(team);
  }

  // Filter by search if provided
  let filteredTeams = teams;
  if (search) {
    filteredTeams = teams.filter(team => 
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      team.description.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Filter by active status
  if (!includeInactive) {
    filteredTeams = filteredTeams.filter(team => team.is_active);
  }

  // Apply pagination
  const paginatedTeams = filteredTeams.slice(offset, offset + limit);

  return {
    teams: paginatedTeams,
    total: filteredTeams.length,
    pagination: {
      limit,
      offset,
      has_more: offset + limit < filteredTeams.length,
      next_offset: offset + limit < filteredTeams.length ? offset + limit : null,
      total_pages: Math.ceil(filteredTeams.length / limit),
      current_page: Math.floor(offset / limit) + 1
    }
  };
}

async function fetchUserTeams(supabase: any, userId: string, limit: number, offset: number, search: string, includeInactive: boolean) {
  // This would implement real teams fetching from the database
  // For now, return the mock data
  return generateMockTeams(limit, offset, search, includeInactive);
}
