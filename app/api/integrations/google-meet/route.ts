import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { 
  generateGoogleMeetAuthUrl,
  exchangeGoogleMeetCode,
  getGoogleMeetEvents,
  summarizeGoogleMeet,
  validateGoogleMeetIntegration,
  refreshGoogleMeetToken,
  getMeetingRecording
} from '@/lib/google-meet-integration';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userEmail = session.user.email!;
    const userName = session.user.user_metadata?.name || session.user.email!;

    // Parse request body
    const body = await request.json();
    const { action, data } = body;

    console.log('Processing Google Meet integration request:', { action, userId });

    switch (action) {
      case 'exchange_code':
        if (!data?.code) {
          return NextResponse.json(
            { success: false, error: 'Authorization code is required' },
            { status: 400 }
          );
        }

        const tokenResult = await exchangeGoogleMeetCode(data.code);
        
        if (tokenResult.success) {
          // Store tokens in database (you would implement this)
          // For now, we'll just return them
          console.log('Google Meet tokens received for user:', userId);
          
          // Track the connection
          await fetch('/api/webhooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'google_meet_connected',
              data: {
                userId,
                userName,
                email: userEmail
              }
            })
          });
        }

        return NextResponse.json(tokenResult);

      case 'get_meetings':
        if (!data?.accessToken) {
          return NextResponse.json(
            { success: false, error: 'Access token is required' },
            { status: 400 }
          );
        }

        const meetingsResult = await getGoogleMeetEvents(data.accessToken, {
          timeMin: data.timeMin ? new Date(data.timeMin) : undefined,
          timeMax: data.timeMax ? new Date(data.timeMax) : undefined,
          maxResults: data.maxResults || 50
        });

        return NextResponse.json(meetingsResult);

      case 'summarize_meeting':
        if (!data?.meetingData) {
          return NextResponse.json(
            { success: false, error: 'Meeting data is required' },
            { status: 400 }
          );
        }

        const summaryResult = await summarizeGoogleMeet(
          data.meetingData,
          data.transcript
        );
        
        if (summaryResult.success) {
          // Track the summarization
          await fetch('/api/webhooks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'summary_completed',
              data: {
                title: `Google Meet: ${data.meetingData.title}`,
                wordCount: summaryResult.summary?.summary.length || 0,
                processingTime: 0 // Would be calculated in real implementation
              }
            })
          });
        }

        return NextResponse.json(summaryResult);

      case 'get_recording':
        if (!data?.accessToken || !data?.meetingId) {
          return NextResponse.json(
            { success: false, error: 'Access token and meeting ID are required' },
            { status: 400 }
          );
        }

        const recordingResult = await getMeetingRecording(
          data.accessToken,
          data.meetingId
        );

        return NextResponse.json(recordingResult);

      case 'validate_connection':
        if (!data?.accessToken) {
          return NextResponse.json(
            { success: false, error: 'Access token is required' },
            { status: 400 }
          );
        }

        const validationResult = await validateGoogleMeetIntegration(data.accessToken);
        return NextResponse.json(validationResult);

      case 'refresh_token':
        if (!data?.refreshToken) {
          return NextResponse.json(
            { success: false, error: 'Refresh token is required' },
            { status: 400 }
          );
        }

        const refreshResult = await refreshGoogleMeetToken(data.refreshToken);
        return NextResponse.json(refreshResult);

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in Google Meet integration:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'auth_url':
        const state = searchParams.get('state') || `google-meet-${userId}`;
        const authUrl = generateGoogleMeetAuthUrl(state);
        
        return NextResponse.json({
          success: true,
          authUrl
        });

      case 'status':
        // In a real implementation, you would check stored tokens
        return NextResponse.json({
          success: true,
          connected: false, // Would check actual connection status
          message: 'Google Meet integration status'
        });

      default:
        return NextResponse.json({
          success: true,
          message: 'Google Meet integration API is active',
          availableActions: [
            'exchange_code',
            'get_meetings',
            'summarize_meeting',
            'get_recording',
            'validate_connection',
            'refresh_token'
          ]
        });
    }

  } catch (error) {
    console.error('Error in Google Meet integration GET:', error);
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
