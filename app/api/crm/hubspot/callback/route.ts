import { NextRequest, NextResponse } from 'next/server';
import { exchangeCRMOAuthCode, storeCRMIntegration } from '@/lib/crm-integrations';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SentryTracker } from '@/lib/sentry.client';

/**
 * GET /api/crm/hubspot/callback
 * Handle HubSpot OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('HubSpot OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_error=oauth_denied`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_error=missing_params`
      );
    }

    // Parse state to get user and organization info
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch (parseError) {
      console.error('Error parsing state:', parseError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_error=invalid_state`
      );
    }

    const { userId, organizationId } = stateData;

    if (!userId || !organizationId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_error=invalid_state`
      );
    }

    // Verify user session
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || user.id !== userId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=authentication_required`
      );
    }

    // Exchange code for access token
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/crm/hubspot/callback`;
    const tokenData = await exchangeCRMOAuthCode('hubspot', code, redirectUri);

    if (!tokenData.access_token) {
      throw new Error('No access token received from HubSpot');
    }

    // Store the integration
    const integration = await storeCRMIntegration(
      userId,
      organizationId,
      'hubspot',
      tokenData
    );

    console.log('✅ HubSpot integration stored successfully:', {
      integrationId: integration.id,
      userId,
      organizationId
    });

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_success=hubspot_connected`
    );

  } catch (error) {
    console.error('HubSpot callback error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_error=connection_failed`
    );
  }
}
