import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    // For testing purposes, if no session, return empty notifications
    let userId;
    if (sessionError || !session) {
      console.log('🧪 No session found, returning empty notifications for testing');
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: 'No session - returning empty notifications for testing'
      });
    } else {
      userId = session.user.id;
    }
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter for unread only if requested
    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      // Return empty array instead of error for better UX
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No notifications found or database error',
        error: error.message
      });
    }

    // If no notifications exist, create demo notifications for new users
    if (!notifications || notifications.length === 0) {
      const demoNotifications = [
        {
          user_id: userId,
          type: 'welcome',
          title: '🎉 Welcome to Slack Summary Scribe!',
          message: 'Your AI-powered summarization tool is ready. Start by connecting your Slack workspace.',
          data: { action: 'connect_slack', priority: 'high' }
        },
        {
          user_id: userId,
          type: 'feature',
          title: '🤖 Try Premium AI Models',
          message: 'Upgrade to Pro for access to GPT-4o and Claude 3.5 Sonnet for superior summary quality.',
          data: { action: 'upgrade_plan', priority: 'medium' }
        },
        {
          user_id: userId,
          type: 'tip',
          title: '📊 Explore Your Dashboard',
          message: 'Check out your analytics, manage integrations, and customize your AI preferences.',
          data: { action: 'explore_dashboard', priority: 'low' }
        }
      ];

      // Insert demo notifications
      const { data: createdNotifications } = await supabase
        .from('notifications')
        .insert(demoNotifications)
        .select();

      return NextResponse.json({
        success: true,
        data: createdNotifications || [],
        total: createdNotifications?.length || 0
      });
    }

    return NextResponse.json({
      success: true,
      data: notifications || [],
      total: notifications?.length || 0
    });

  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    
    const { type, title, message, data: notificationData, organization_id } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      );
    }

    // Create new notification
    const { data: notification, error: createError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        organization_id,
        type,
        title,
        message,
        data: notificationData
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating notification:', createError);
      return NextResponse.json(
        { error: 'Failed to create notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification
    });

  } catch (error) {
    console.error('Create notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .is('read_at', null);

      if (updateError) {
        console.error('Error marking all notifications as read:', updateError);
        return NextResponse.json(
          { error: 'Failed to mark all notifications as read' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } else if (notificationId) {
      // Mark specific notification as read
      const { data: notification, error: updateError } = await supabase
        .from('notifications')
        .update({
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating notification:', updateError);
        return NextResponse.json(
          { error: 'Failed to update notification' },
          { status: 500 }
        );
      }

      if (!notification) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: notification
      });
    } else {
      return NextResponse.json(
        { error: 'Missing notification ID or markAllAsRead flag' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Update notification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
