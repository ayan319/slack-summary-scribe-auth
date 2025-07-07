import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { getSlackOAuthUrl } from '@/lib/slack';

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

    // Check if user has admin or owner role
    if (!['admin', 'owner'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Admin or owner role required to connect Slack' },
        { status: 403 }
      );
    }

    // Generate Slack OAuth URL
    const oauthUrl = getSlackOAuthUrl(organizationId);

    return NextResponse.json({
      success: true,
      oauth_url: oauthUrl,
    });

  } catch (error) {
    console.error('Slack auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
