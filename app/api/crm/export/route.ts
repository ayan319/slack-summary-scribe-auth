import { NextRequest, NextResponse } from 'next/server';
import {
  pushSummaryToCRM
} from '@/lib/crm-integrations';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SentryTracker } from '@/lib/sentry.client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      summary_id,
      crm_types,
      organization_id
    } = body;

    if (!summary_id || !crm_types || !Array.isArray(crm_types)) {
      return NextResponse.json(
        { error: 'Summary ID and CRM types array are required' },
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
      message: `Exported to ${successCount}/${totalCount} CRM systems`,
      results,
      summary_id
    });

  } catch (error) {
    console.error('CRM export API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
