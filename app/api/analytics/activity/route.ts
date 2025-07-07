import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase';
import { getDailyActivityData } from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const response = NextResponse.next();
    const supabase = createRouteHandlerClient(request, response);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const organizationId = searchParams.get('organizationId');

    // Get daily activity data
    const activityData = await getDailyActivityData(days, organizationId || undefined);

    return NextResponse.json({
      success: true,
      data: activityData
    });

  } catch (error) {
    console.error('Analytics activity API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
