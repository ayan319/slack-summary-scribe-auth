import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { SentryTracker } from '@/lib/sentry.client';

export async function POST(request: NextRequest) {
  try {
    SentryTracker.addAPIBreadcrumb('POST', '/api/auth/logout', undefined, {
      userAgent: request.headers.get('user-agent'),
    });

    const supabase = createSupabaseClient();
    
    // Get current user before logout
    const { data: { user } } = await supabase.auth.getUser();
    
    SentryTracker.addAuthBreadcrumb('logout', 'started', true, { userId: user?.id });

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      SentryTracker.addAuthBreadcrumb('logout', 'failed', false, {
        error: error.message,
        userId: user?.id,
      });

      return NextResponse.json(
        { error: 'Failed to logout', details: error.message },
        { status: 500 }
      );
    }

    SentryTracker.addAuthBreadcrumb('logout', 'completed', true, { userId: user?.id });

    // Clear user context from Sentry
    SentryTracker.setUserContext(undefined);

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (error) {
    console.error('Logout API error:', error);
    
    SentryTracker.captureException(error as Error, {
      component: 'logout-api',
      action: 'POST',
      extra: {
        url: request.url,
        method: 'POST',
      },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to logout.' },
    { status: 405 }
  );
}
