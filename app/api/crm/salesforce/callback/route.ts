import { NextRequest, NextResponse } from 'next/server';
import { storeCRMToken } from '@/lib/crm-integrations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Salesforce OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_error=missing_code_or_state`
      );
    }

    // Parse state to get user and organization info
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { userId, organizationId } = stateData;

    if (!userId || !organizationId) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_error=invalid_state`
      );
    }

    // Exchange code for access token
    const baseUrl = process.env.SALESFORCE_SANDBOX_URL || 'https://login.salesforce.com';
    const tokenResponse = await fetch(`${baseUrl}/services/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.SALESFORCE_CLIENT_ID!,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/crm/salesforce/callback`,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Salesforce token exchange failed:', errorText);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_error=token_exchange_failed`
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, instance_url } = tokenData;

    // Store encrypted token in database
    await storeCRMToken(
      userId,
      organizationId,
      'salesforce',
      access_token,
      refresh_token,
      undefined, // Salesforce tokens don't expire
      instance_url
    );

    console.log('✅ Salesforce integration connected successfully:', {
      userId,
      organizationId,
      instanceUrl: instance_url
    });

    // Redirect back to settings with success message
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_success=salesforce_connected`
    );

  } catch (error) {
    console.error('Salesforce OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/settings?crm_error=callback_failed`
    );
  }
}
