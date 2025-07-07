import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { workspaceLogger } from '@/lib/workspace-logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'logs';
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createRouteHandlerClient({ cookies });

    switch (action) {
      case 'logs':
        if (userId) {
          const userLogs = workspaceLogger.getUserLogs(userId);
          return NextResponse.json({
            user_id: userId,
            logs: userLogs,
            count: userLogs.length
          });
        } else {
          const recentLogs = workspaceLogger.getRecentLogs(limit);
          return NextResponse.json({
            logs: recentLogs,
            count: recentLogs.length
          });
        }

      case 'errors':
        const errorLogs = workspaceLogger.getErrorLogs();
        return NextResponse.json({
          error_logs: errorLogs,
          count: errorLogs.length
        });

      case 'user_status':
        if (!userId) {
          return NextResponse.json(
            { error: 'user_id parameter required for user_status' },
            { status: 400 }
          );
        }

        const status = await workspaceLogger.checkUserWorkspaceStatus(userId);
        
        // Also get current database state
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        const { data: orgData, error: orgError } = await supabase
          .from('user_organizations')
          .select(`
            role,
            created_at,
            organizations(id, name, created_at)
          `)
          .eq('user_id', userId);

        return NextResponse.json({
          user_id: userId,
          log_status: status,
          database_state: {
            user_profile: userData || null,
            user_profile_error: userError?.message || null,
            organizations: orgData || [],
            organizations_error: orgError?.message || null
          }
        });

      case 'trigger_status':
        // Check if trigger exists and is active
        const { data: triggerData, error: triggerError } = await supabase
          .from('information_schema.triggers')
          .select('*')
          .eq('trigger_name', 'on_auth_user_created');

        const { data: functionData, error: functionError } = await supabase
          .from('information_schema.routines')
          .select('*')
          .eq('routine_name', 'handle_new_user_signup')
          .eq('routine_schema', 'public');

        return NextResponse.json({
          trigger: {
            exists: !triggerError && triggerData && triggerData.length > 0,
            data: triggerData || null,
            error: triggerError?.message || null
          },
          function: {
            exists: !functionError && functionData && functionData.length > 0,
            data: functionData || null,
            error: functionError?.message || null
          }
        });

      case 'health_detailed':
        // Get detailed health information
        const { data: healthData, error: healthError } = await supabase
          .rpc('check_workspace_health');

        if (healthError) {
          return NextResponse.json(
            { error: 'Health check failed', details: healthError.message },
            { status: 500 }
          );
        }

        // Get users without organizations
        const { data: usersWithoutOrgs, error: usersError } = await supabase
          .from('auth.users')
          .select(`
            id,
            email,
            created_at,
            user_organizations(id)
          `)
          .is('user_organizations.id', null)
          .is('deleted_at', null)
          .limit(10);

        // Get recent signups
        const { data: recentSignups, error: recentError } = await supabase
          .from('auth.users')
          .select(`
            id,
            email,
            created_at,
            user_organizations(
              role,
              organizations(name)
            )
          `)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(10);

        return NextResponse.json({
          health: healthData[0],
          users_without_orgs: usersWithoutOrgs || [],
          recent_signups: recentSignups || [],
          errors: {
            users_error: usersError?.message || null,
            recent_error: recentError?.message || null
          }
        });

      case 'export':
        const exportData = workspaceLogger.exportLogs();
        return new NextResponse(exportData, {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="workspace-logs-${new Date().toISOString().split('T')[0]}.json"`
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: logs, errors, user_status, trigger_status, health_detailed, export' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Debug API error:', error);
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
    const { action, user_id } = await request.json();

    const supabase = createRouteHandlerClient({ cookies });

    switch (action) {
      case 'clear_logs':
        workspaceLogger.clearLogs();
        return NextResponse.json({ success: true, message: 'Logs cleared' });

      case 'test_user_creation':
        if (!user_id) {
          return NextResponse.json(
            { error: 'user_id required for test_user_creation' },
            { status: 400 }
          );
        }

        // Check if user exists and has workspace
        const { data: existingOrg } = await supabase
          .from('user_organizations')
          .select('id')
          .eq('user_id', user_id)
          .limit(1);

        if (existingOrg && existingOrg.length > 0) {
          return NextResponse.json({
            success: false,
            message: 'User already has workspace',
            workspace_exists: true
          });
        }

        // Manually trigger workspace creation
        const { data: fixData, error: fixError } = await supabase
          .rpc('audit_and_fix_users_without_orgs');

        if (fixError) {
          return NextResponse.json(
            { error: 'Manual fix failed', details: fixError.message },
            { status: 500 }
          );
        }

        const userFix = fixData?.find((fix: any) => fix.user_id === user_id);
        
        return NextResponse.json({
          success: true,
          message: userFix ? 'Workspace created manually' : 'No action needed',
          fix_result: userFix || null
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: clear_logs, test_user_creation' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Debug API POST error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
