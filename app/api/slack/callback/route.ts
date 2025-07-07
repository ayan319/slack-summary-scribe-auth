import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { exchangeSlackOAuthCode, storeSlackIntegration } from '@/lib/slack';

export async function GET(request: NextRequest) {
  const response = NextResponse.next();
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is the organization ID
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      const errorUrl = new URL('/dashboard', request.url);
      errorUrl.searchParams.set('slack_error', error);
      return NextResponse.redirect(errorUrl);
    }

    // Validate required parameters
    if (!code || !state) {
      const errorUrl = new URL('/dashboard', request.url);
      errorUrl.searchParams.set('slack_error', 'missing_parameters');
      return NextResponse.redirect(errorUrl);
    }

    // Get authenticated user
    const supabase = createRouteHandlerClient(request, response);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const errorUrl = new URL('/login', request.url);
      return NextResponse.redirect(errorUrl);
    }

    const organizationId = state;

    // Verify user belongs to the organization
    const { data: membership, error: membershipError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (membershipError || !membership) {
      const errorUrl = new URL('/dashboard', request.url);
      errorUrl.searchParams.set('slack_error', 'access_denied');
      return NextResponse.redirect(errorUrl);
    }

    // Check if user has admin or owner role
    if (!['admin', 'owner'].includes(membership.role)) {
      const errorUrl = new URL('/dashboard', request.url);
      errorUrl.searchParams.set('slack_error', 'insufficient_permissions');
      return NextResponse.redirect(errorUrl);
    }

    // Exchange code for access token
    const oauthData = await exchangeSlackOAuthCode(code);

    // Store Slack integration
    await storeSlackIntegration(user.id, organizationId, oauthData);

    // Redirect to dashboard with success message
    const successUrl = new URL('/dashboard', request.url);
    successUrl.searchParams.set('slack_success', 'true');
    successUrl.searchParams.set('team_name', oauthData.team.name);
    
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error('Slack callback error:', error);
    
    // Redirect to dashboard with error
    const errorUrl = new URL('/dashboard', request.url);
    errorUrl.searchParams.set('slack_error', 'connection_failed');
    return NextResponse.redirect(errorUrl);
  }
}
