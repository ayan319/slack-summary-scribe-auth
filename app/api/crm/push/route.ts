import { NextRequest, NextResponse } from 'next/server';
import { pushSummaryToCRM, getUserCRMConnections, shouldAutoPushToCRM } from '@/lib/crm-integrations';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SentryTracker } from '@/lib/sentry.client';

/**
 * POST /api/crm/push
 * Push a summary to CRM systems
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      summary_id, 
      crm_types, 
      organization_id 
    } = await request.json();

    if (!summary_id) {
      return NextResponse.json(
        { error: 'Summary ID is required' },
        { status: 400 }
      );
    }

    if (!crm_types || !Array.isArray(crm_types) || crm_types.length === 0) {
      return NextResponse.json(
        { error: 'At least one CRM type is required' },
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
    let orgId: string = organization_id || '';
    if (!orgId) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!userOrg?.organization_id) {
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

    // Push to each requested CRM
    const results = [];
    for (const crmType of crm_types) {
      if (!['hubspot', 'salesforce', 'notion'].includes(crmType)) {
        results.push({
          crm_type: crmType,
          success: false,
          error: 'Unsupported CRM type'
        });
        continue;
      }

      try {
        const pushResult = await pushSummaryToCRM(
          summary_id,
          user.id,
          orgId,
          crmType
        );

        results.push({
          crm_type: crmType,
          success: pushResult.success,
          crm_record_id: pushResult.crm_record_id,
          error: pushResult.error
        });
      } catch (error) {
        results.push({
          crm_type: crmType,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Pushed to ${successCount}/${totalCount} CRM systems`,
      results,
      summary_id
    });

  } catch (error) {
    console.error('CRM push API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crm/push
 * Get CRM push history and status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const summaryId = searchParams.get('summary_id');
    const limit = parseInt(searchParams.get('limit') || '20');

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
    let orgId: string = organizationId || '';
    if (!orgId) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!userOrg?.organization_id) {
        return NextResponse.json(
          { error: 'No organization found for user' },
          { status: 400 }
        );
      }

      orgId = userOrg.organization_id;
    }

    // Get CRM connections
    const connections = await getUserCRMConnections(user.id, orgId);

    // Get auto-push setting
    const autoPushEnabled = await shouldAutoPushToCRM(user.id, orgId);

    // Build query for push history
    let query = supabase
      .from('summary_crm_pushes')
      .select(`
        *,
        summaries!inner(title, created_at),
        crm_integrations!inner(crm_type)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (summaryId) {
      query = query.eq('summary_id', summaryId);
    }

    const { data: pushHistory, error: historyError } = await query;

    if (historyError) {
      console.error('Error getting CRM push history:', historyError);
    }

    // Get statistics
    const { data: stats } = await supabase
      .from('summary_crm_pushes')
      .select('status, crm_type')
      .eq('user_id', user.id);

    const statistics = {
      total_pushes: stats?.length || 0,
      successful_pushes: stats?.filter(s => s.status === 'success').length || 0,
      failed_pushes: stats?.filter(s => s.status === 'failed').length || 0,
      pending_pushes: stats?.filter(s => s.status === 'pending').length || 0,
      by_crm_type: stats?.reduce((acc: any, stat: any) => {
        acc[stat.crm_type] = (acc[stat.crm_type] || 0) + 1;
        return acc;
      }, {}) || {}
    };

    return NextResponse.json({
      success: true,
      data: {
        connections: connections.map(conn => ({
          crm_type: conn.crm_type,
          is_active: conn.is_active,
          last_sync_at: conn.last_sync_at,
          created_at: conn.created_at
        })),
        settings: {
          auto_push_enabled: autoPushEnabled
        },
        statistics,
        recent_pushes: pushHistory || []
      }
    });

  } catch (error) {
    console.error('Get CRM push status API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/crm/push
 * Update CRM auto-push settings
 */
export async function PUT(request: NextRequest) {
  try {
    const { 
      auto_push_enabled,
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
    let orgId: string = organization_id || '';
    if (!orgId) {
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!userOrg?.organization_id) {
        return NextResponse.json(
          { error: 'No organization found for user' },
          { status: 400 }
        );
      }

      orgId = userOrg.organization_id;
    }

    // Update user settings
    const updateData: any = {
      user_id: user.id,
      organization_id: orgId,
      updated_at: new Date().toISOString()
    };

    if (typeof auto_push_enabled === 'boolean') {
      updateData.auto_push_to_crm = auto_push_enabled;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      console.error('Error updating CRM settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'CRM auto-push settings updated successfully',
      data: {
        auto_push_enabled: data.auto_push_to_crm
      }
    });

  } catch (error) {
    console.error('Update CRM settings API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
