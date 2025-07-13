import { google } from 'googleapis';

// Google Meet integration configuration
export const GOOGLE_MEET_CONFIG = {
  scopes: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/meetings.space.readonly'
  ],
  redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
};

// Meeting data interface
export interface GoogleMeetingData {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees: Array<{
    email: string;
    name?: string;
    responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction';
  }>;
  meetingUrl?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  organizer: {
    email: string;
    name?: string;
  };
}

// Meeting summary interface
export interface MeetingSummary {
  meetingId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  actionItems: Array<{
    task: string;
    assignee?: string;
    dueDate?: Date;
  }>;
  decisions: string[];
  attendees: string[];
  duration: number; // in minutes
  transcript?: string;
  confidence: number;
  generatedAt: Date;
}

// Initialize Google OAuth2 client
export function createGoogleAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_MEET_CONFIG.redirectUri
  );
}

// Generate OAuth URL for Google Meet access
export function generateGoogleMeetAuthUrl(state?: string): string {
  const oauth2Client = createGoogleAuthClient();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_MEET_CONFIG.scopes,
    state: state || 'google-meet-integration'
  });
}

// Exchange authorization code for tokens
export async function exchangeGoogleMeetCode(code: string): Promise<{
  success: boolean;
  tokens?: any;
  error?: string;
}> {
  try {
    const oauth2Client = createGoogleAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    
    return {
      success: true,
      tokens
    };
  } catch (error) {
    console.error('Error exchanging Google Meet code:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token exchange failed'
    };
  }
}

// Get user's Google Calendar events with Meet links
export async function getGoogleMeetEvents(
  accessToken: string,
  options?: {
    timeMin?: Date;
    timeMax?: Date;
    maxResults?: number;
  }
): Promise<{
  success: boolean;
  events?: GoogleMeetingData[];
  error?: string;
}> {
  try {
    const oauth2Client = createGoogleAuthClient();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const timeMin = options?.timeMin || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const timeMax = options?.timeMax || new Date();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: options?.maxResults || 50,
      singleEvents: true,
      orderBy: 'startTime',
      q: 'meet.google.com' // Filter for Google Meet events
    });

    const events: GoogleMeetingData[] = (response.data.items || [])
      .filter(event => event.hangoutLink || (event.conferenceData?.entryPoints?.some(ep => ep.entryPointType === 'video')))
      .map(event => ({
        id: event.id!,
        title: event.summary || 'Untitled Meeting',
        description: event.description || undefined,
        startTime: new Date(event.start?.dateTime || event.start?.date || ''),
        endTime: new Date(event.end?.dateTime || event.end?.date || ''),
        attendees: (event.attendees || []).map(attendee => ({
          email: attendee.email!,
          name: attendee.displayName || undefined,
          responseStatus: attendee.responseStatus as 'accepted' | 'declined' | 'tentative' | 'needsAction' | undefined
        })),
        meetingUrl: event.hangoutLink || event.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri || undefined,
        organizer: {
          email: event.organizer?.email || '',
          name: event.organizer?.displayName || undefined
        }
      }));

    return {
      success: true,
      events
    };

  } catch (error) {
    console.error('Error fetching Google Meet events:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch events'
    };
  }
}

// Get meeting recording from Google Drive
export async function getMeetingRecording(
  accessToken: string,
  meetingId: string
): Promise<{
  success: boolean;
  recordingUrl?: string;
  transcriptUrl?: string;
  error?: string;
}> {
  try {
    const oauth2Client = createGoogleAuthClient();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    
    // Search for meeting recordings in Google Drive
    const response = await drive.files.list({
      q: `name contains "${meetingId}" and (mimeType contains "video" or mimeType contains "text")`,
      fields: 'files(id,name,mimeType,webViewLink,webContentLink)'
    });

    const files = response.data.files || [];
    
    const recording = files.find(file => 
      file.mimeType?.includes('video') || file.name?.includes('recording')
    );
    
    const transcript = files.find(file => 
      file.mimeType?.includes('text') || file.name?.includes('transcript')
    );

    return {
      success: true,
      recordingUrl: recording?.webViewLink || undefined,
      transcriptUrl: transcript?.webViewLink || undefined
    };

  } catch (error) {
    console.error('Error fetching meeting recording:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recording'
    };
  }
}

// Summarize Google Meet using AI
export async function summarizeGoogleMeet(
  meetingData: GoogleMeetingData,
  transcript?: string
): Promise<{
  success: boolean;
  summary?: MeetingSummary;
  error?: string;
}> {
  try {
    // If no transcript provided, create summary from meeting metadata
    const contentToSummarize = transcript || `
      Meeting: ${meetingData.title}
      Description: ${meetingData.description || 'No description provided'}
      Duration: ${Math.round((meetingData.endTime.getTime() - meetingData.startTime.getTime()) / (1000 * 60))} minutes
      Attendees: ${meetingData.attendees.map(a => a.name || a.email).join(', ')}
      Organizer: ${meetingData.organizer.name || meetingData.organizer.email}
    `;

    // Call AI summarization service (using existing AI service)
    const aiResponse = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: contentToSummarize,
        type: 'meeting',
        options: {
          extractActionItems: true,
          extractDecisions: true,
          extractKeyPoints: true
        }
      })
    });

    if (!aiResponse.ok) {
      throw new Error('AI summarization failed');
    }

    const aiResult = await aiResponse.json();
    
    const summary: MeetingSummary = {
      meetingId: meetingData.id,
      title: meetingData.title,
      summary: aiResult.summary || 'No summary available',
      keyPoints: aiResult.keyPoints || [],
      actionItems: aiResult.actionItems || [],
      decisions: aiResult.decisions || [],
      attendees: meetingData.attendees.map(a => a.name || a.email),
      duration: Math.round((meetingData.endTime.getTime() - meetingData.startTime.getTime()) / (1000 * 60)),
      transcript,
      confidence: aiResult.confidence || 0.8,
      generatedAt: new Date()
    };

    return {
      success: true,
      summary
    };

  } catch (error) {
    console.error('Error summarizing Google Meet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Summarization failed'
    };
  }
}

// Validate Google Meet integration
export async function validateGoogleMeetIntegration(accessToken: string): Promise<{
  success: boolean;
  userInfo?: any;
  error?: string;
}> {
  try {
    const oauth2Client = createGoogleAuthClient();
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    return {
      success: true,
      userInfo: userInfo.data
    };

  } catch (error) {
    console.error('Error validating Google Meet integration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Validation failed'
    };
  }
}

// Refresh Google access token
export async function refreshGoogleMeetToken(refreshToken: string): Promise<{
  success: boolean;
  tokens?: any;
  error?: string;
}> {
  try {
    const oauth2Client = createGoogleAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    return {
      success: true,
      tokens: credentials
    };

  } catch (error) {
    console.error('Error refreshing Google Meet token:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Token refresh failed'
    };
  }
}

// Convenience functions
export const googleMeetIntegration = {
  // Generate auth URL
  getAuthUrl: (state?: string) => generateGoogleMeetAuthUrl(state),
  
  // Exchange code for tokens
  exchangeCode: (code: string) => exchangeGoogleMeetCode(code),
  
  // Get recent meetings
  getRecentMeetings: (accessToken: string, days = 7) => 
    getGoogleMeetEvents(accessToken, {
      timeMin: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      timeMax: new Date()
    }),
  
  // Summarize meeting
  summarizeMeeting: (meetingData: GoogleMeetingData, transcript?: string) =>
    summarizeGoogleMeet(meetingData, transcript),
  
  // Validate connection
  validateConnection: (accessToken: string) => validateGoogleMeetIntegration(accessToken),
  
  // Refresh token
  refreshToken: (refreshToken: string) => refreshGoogleMeetToken(refreshToken)
};
