import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Test endpoint that bypasses authentication for testing notifications
export async function GET(request: NextRequest) {
  try {
    // Use service role client to bypass RLS for testing
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Use a hardcoded test user ID
    const testUserId = 'add47a1f-192a-4c74-8a98-602ae98f3ffb';

    console.log('🧪 Testing notifications for user:', testUserId);

    // Try to fetch notifications directly
    console.log('📋 Fetching notifications from database...');

    // Fetch all notifications for the user
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No notifications found or database error',
        error: error.message
      });
    }

    console.log(`📊 Found ${notifications?.length || 0} notifications for user`);

    return NextResponse.json({
      success: true,
      data: notifications || [],
      count: notifications?.length || 0,
      testMode: true,
      userId: testUserId
    });

  } catch (error) {
    console.error('Test notifications API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        testMode: true
      },
      { status: 500 }
    );
  }
}
