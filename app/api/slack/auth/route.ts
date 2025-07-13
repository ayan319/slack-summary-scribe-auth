import { NextRequest, NextResponse } from 'next/server';
import { getSlackOAuthUrl } from '@/lib/slack';

export async function GET(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();

    if (!user) {
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
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Check if user has access to organization
    const { hasPermission } = await import('@/lib/auth');
    const hasAccess = await hasPermission(user.id, organizationId, 'member');

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      );
    }

    // Generate Slack OAuth URL
    const oauthUrl = getSlackOAuthUrl(
      process.env.SLACK_CLIENT_ID!,
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/slack/callback`,
      organizationId
    );

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
