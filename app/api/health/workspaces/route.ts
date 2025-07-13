import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Check workspace health
    const { data: healthData, error: healthError } = await supabase
      .rpc('check_workspace_health');

    if (healthError) {
      console.error('Health check error:', healthError);
      return NextResponse.json(
        { 
          error: 'Health check failed',
          details: healthError.message 
        },
        { status: 500 }
      );
    }

    const health = healthData[0];

    // Check if trigger exists
    const { data: triggerData, error: triggerError } = await supabase
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .eq('trigger_name', 'on_auth_user_created');

    const triggerActive = !triggerError && triggerData && triggerData.length > 0;

    // Calculate health score
    const totalUsers = parseInt(health.total_users);
    const usersWithOrgs = parseInt(health.users_with_orgs);
    const healthScore = totalUsers > 0 ? (usersWithOrgs / totalUsers) * 100 : 100;

    // Determine status
    let status = 'healthy';
    const issues = [];

    if (health.users_without_orgs > 0) {
      status = 'warning';
      issues.push(`${health.users_without_orgs} users without workspaces`);
    }

    if (!triggerActive) {
      status = 'critical';
      issues.push('Auto-creation trigger is not active');
    }

    if (health.orphaned_orgs > 0) {
      issues.push(`${health.orphaned_orgs} orphaned organizations`);
    }

    const response = {
      status,
      healthScore: Math.round(healthScore),
      timestamp: new Date().toISOString(),
      metrics: {
        totalUsers: parseInt(health.total_users),
        usersWithOrgs: parseInt(health.users_with_orgs),
        usersWithoutOrgs: parseInt(health.users_without_orgs),
        orphanedOrgs: parseInt(health.orphaned_orgs)
      },
      trigger: {
        active: triggerActive,
        name: 'on_auth_user_created'
      },
      issues,
      recommendations: [] as string[]
    };

    // Add recommendations based on issues
    if (health.users_without_orgs > 0) {
      response.recommendations.push('Run audit_and_fix_users_without_orgs() function');
    }

    if (!triggerActive) {
      response.recommendations.push('Recreate the on_auth_user_created trigger');
    }

    if (health.orphaned_orgs > 0) {
      response.recommendations.push('Review and clean up orphaned organizations');
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Workspace health check failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action !== 'fix_users') {
      return NextResponse.json(
        { error: 'Invalid action. Use "fix_users"' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    // Run the audit and fix function
    const { data: fixData, error: fixError } = await supabase
      .rpc('audit_and_fix_users_without_orgs');

    if (fixError) {
      console.error('Fix users error:', fixError);
      return NextResponse.json(
        { 
          error: 'Fix operation failed',
          details: fixError.message 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixData?.length || 0} users`,
      fixedUsers: fixData || []
    });

  } catch (error) {
    console.error('Fix users operation failed:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
