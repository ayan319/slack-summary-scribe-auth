import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Demo mode - no authentication required
    console.log('🔔 Notifications Subscribe: Demo mode active');

    const { subscription } = await request.json();

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Push subscription is required' },
        { status: 400 }
      );
    }

    // Demo mode - simulate storing push subscription
    console.log('📱 Push subscription stored (demo mode):', {
      endpoint: subscription.endpoint?.substring(0, 50) + '...',
      keys: subscription.keys ? 'present' : 'missing'
    });

    return NextResponse.json({
      success: true,
      message: 'Push subscription stored successfully'
    });

  } catch (error) {
    console.error('Push subscription API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Demo mode - no authentication required
    console.log('🔔 Notifications Unsubscribe: Demo mode active');

    // Demo mode - simulate removing push subscription
    console.log('📱 Push subscription removed (demo mode)');

    return NextResponse.json({
      success: true,
      message: 'Push subscription removed successfully'
    });

  } catch (error) {
    console.error('Push subscription DELETE API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
