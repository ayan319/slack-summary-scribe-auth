import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
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

    const { subscription } = await request.json();

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Push subscription is required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    // Store push subscription in user profile
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        push_subscription: subscription,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Failed to store push subscription:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to store push subscription' },
        { status: 500 }
      );
    }

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

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    // Remove push subscription from user profile
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        push_subscription: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to remove push subscription:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to remove push subscription' },
        { status: 500 }
      );
    }

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
