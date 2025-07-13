import { NextRequest, NextResponse } from 'next/server';
import { exchangeSlackOAuthCode, storeSlackIntegration } from '@/lib/slack';

export async function GET(request: NextRequest) {
  try {
    // Demo mode - no authentication required
    console.log('🔗 Slack Callback: Demo mode active');

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

    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=authentication_required`
      );
    }

    const organizationId = state;

    // Check if user has access to organization
    const { hasPermission } = await import('@/lib/auth');
    const hasAccess = await hasPermission(user.id, organizationId, 'member');

    if (!hasAccess) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?error=access_denied`
      );
    }

    // Exchange code for access token
    const oauthData = await exchangeSlackOAuthCode(
      process.env.SLACK_CLIENT_ID!,
      process.env.SLACK_CLIENT_SECRET!,
      code,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/slack/callback`
    );

    // Store Slack integration (demo mode)
    const userId = user?.id || 'demo-user-123';
    await storeSlackIntegration(userId, organizationId, oauthData);

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
