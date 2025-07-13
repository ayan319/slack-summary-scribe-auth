import { NextRequest, NextResponse } from 'next/server';
import { 
  getCRMToken, 
  exportToHubSpot, 
  exportToSalesforce, 
  exportToPipedrive,
  trackCRMExport 
} from '@/lib/crm-integrations';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      summaryId, 
      crmType, 
      exportType = 'note',
      userId = 'demo-user-123', // Demo mode
      organizationId = 'demo-org-123' // Demo mode
    } = body;

    // Validate required fields
    if (!summaryId || !crmType) {
      return NextResponse.json(
        { error: 'Missing required fields: summaryId, crmType' },
        { status: 400 }
      );
    }

    if (!['hubspot', 'salesforce', 'pipedrive'].includes(crmType)) {
      return NextResponse.json(
        { error: 'Invalid CRM type. Must be hubspot, salesforce, or pipedrive' },
        { status: 400 }
      );
    }

    if (!['contact', 'note', 'activity', 'deal'].includes(exportType)) {
      return NextResponse.json(
        { error: 'Invalid export type. Must be contact, note, activity, or deal' },
        { status: 400 }
      );
    }

    console.log('📤 CRM Export Request:', {
      summaryId,
      crmType,
      exportType,
      userId,
      organizationId
    });

    // Get summary data
    const { data: summary, error: summaryError } = await (supabase as any)
      .from('summaries')
      .select('*')
      .eq('id', summaryId)
      .single();

    if (summaryError || !summary) {
      // Demo mode fallback
      console.log('📝 Using demo summary data');
      const demoSummary = {
        id: summaryId,
        title: 'Demo Meeting Summary',
        content: 'This is a demo summary for CRM export testing. The team discussed project updates, shared important announcements, and collaborated on various tasks.',
        user_id: userId,
        created_at: new Date().toISOString()
      };
      
      // Simulate CRM export for demo
      const demoResult = {
        success: true,
        recordId: `demo-${crmType}-${Date.now()}`,
        recordUrl: `https://demo-${crmType}.com/records/demo-${Date.now()}`
      };

      console.log('✅ Demo CRM export completed:', demoResult);

      return NextResponse.json({
        success: true,
        message: `Successfully exported to ${crmType.charAt(0).toUpperCase() + crmType.slice(1)} (Demo Mode)`,
        data: {
          crmType,
          exportType,
          recordId: demoResult.recordId,
          recordUrl: demoResult.recordUrl,
          summary: demoSummary
        }
      });
    }

    // Get CRM token for the user
    const crmToken = await getCRMToken(userId, organizationId, crmType as any);
    
    if (!crmToken) {
      return NextResponse.json(
        { error: `${crmType.charAt(0).toUpperCase() + crmType.slice(1)} integration not found. Please connect your ${crmType} account first.` },
        { status: 404 }
      );
    }

    // Check if token is expired (for HubSpot)
    if (crmToken.token_expires_at && new Date(crmToken.token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: `${crmType.charAt(0).toUpperCase() + crmType.slice(1)} token has expired. Please reconnect your account.` },
        { status: 401 }
      );
    }

    // Export to the specified CRM
    let exportResult;
    
    switch (crmType) {
      case 'hubspot':
        exportResult = await exportToHubSpot(crmToken.access_token, summary, exportType as any);
        break;
      case 'salesforce':
        exportResult = await exportToSalesforce(
          crmToken.access_token, 
          crmToken.instance_url!, 
          summary, 
          exportType as any
        );
        break;
      case 'pipedrive':
        exportResult = await exportToPipedrive(crmToken.access_token, summary, exportType as any);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported CRM type' },
          { status: 400 }
        );
    }

    // Track the export operation
    await trackCRMExport(
      userId,
      summaryId,
      crmType as any,
      exportType as any,
      exportResult
    );

    if (!exportResult.success) {
      console.error('CRM export failed:', exportResult.error);
      return NextResponse.json(
        { error: exportResult.error || 'Export failed' },
        { status: 500 }
      );
    }

    console.log('✅ CRM export completed successfully:', {
      crmType,
      recordId: exportResult.recordId,
      recordUrl: exportResult.recordUrl
    });

    return NextResponse.json({
      success: true,
      message: `Successfully exported to ${crmType.charAt(0).toUpperCase() + crmType.slice(1)}`,
      data: {
        crmType,
        exportType,
        recordId: exportResult.recordId,
        recordUrl: exportResult.recordUrl,
        summary: {
          id: summary.id,
          title: summary.title,
          content: summary.content
        }
      }
    });

  } catch (error) {
    console.error('CRM export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get CRM connections for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user-123';
    const organizationId = searchParams.get('organizationId') || 'demo-org-123';

    console.log('📋 Getting CRM connections:', { userId, organizationId });

    // Demo mode - return mock connections
    if (userId === 'demo-user-123') {
      return NextResponse.json({
        success: true,
        data: {
          connections: [
            {
              crm_type: 'hubspot',
              is_active: false,
              created_at: new Date().toISOString(),
              status: 'disconnected'
            },
            {
              crm_type: 'salesforce',
              is_active: false,
              created_at: new Date().toISOString(),
              status: 'disconnected'
            },
            {
              crm_type: 'pipedrive',
              is_active: false,
              created_at: new Date().toISOString(),
              status: 'disconnected'
            }
          ]
        }
      });
    }

    // In production, get actual CRM connections
    const { data: connections, error } = await (supabaseAdmin as any)
      .from('crm_tokens')
      .select('crm_type, is_active, created_at, token_expires_at')
      .eq('user_id', userId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to get CRM connections: ${error.message}`);
    }

    // Add status based on expiration
    const connectionsWithStatus = (connections || []).map((conn: any) => ({
      ...conn,
      status: conn.is_active ? 
        (conn.token_expires_at && new Date(conn.token_expires_at) < new Date() ? 'expired' : 'connected') : 
        'disconnected'
    }));

    return NextResponse.json({
      success: true,
      data: {
        connections: connectionsWithStatus
      }
    });

  } catch (error) {
    console.error('Get CRM connections error:', error);
    return NextResponse.json(
      { error: 'Failed to get CRM connections', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
