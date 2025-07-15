import { NextRequest, NextResponse } from 'next/server';
import { createLaunchTrackerItem } from '@/lib/notion';
import type { LaunchTrackerItem } from '@/lib/notion';

// Slack command handler for /add-idea and /bug-report
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract Slack command data
    const command = formData.get('command') as string;
    const text = formData.get('text') as string;
    const userId = formData.get('user_id') as string;
    const userName = formData.get('user_name') as string;
    const channelId = formData.get('channel_id') as string;
    const teamId = formData.get('team_id') as string;
    
    // Validate required fields
    if (!command || !text) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Please provide a description for your submission.',
      });
    }
    
    let notionItem: LaunchTrackerItem;
    let responseMessage: string;
    
    switch (command) {
      case '/add-idea':
        notionItem = {
          title: `Idea: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
          status: 'New',
          category: 'Feedback & Ideas',
          priority: 'Medium',
          description: `${text}\n\nSubmitted by: @${userName} (${userId})\nChannel: ${channelId}\nTeam: ${teamId}`,
        };
        responseMessage = '💡 Your idea has been added to our Product Hunt launch tracker! Thank you for the feedback.';
        break;
        
      case '/bug-report':
        notionItem = {
          title: `Bug: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
          status: 'New',
          category: 'Bug Reports',
          priority: 'High',
          description: `${text}\n\nReported by: @${userName} (${userId})\nChannel: ${channelId}\nTeam: ${teamId}`,
        };
        responseMessage = '🐞 Your bug report has been logged in our launch tracker! Our team will investigate this issue.';
        break;
        
      default:
        return NextResponse.json({
          response_type: 'ephemeral',
          text: 'Unknown command. Use /add-idea or /bug-report.',
        });
    }
    
    // Create item in Notion
    try {
      const createdItem = await createLaunchTrackerItem(notionItem);
      
      // Return success response to Slack
      return NextResponse.json({
        response_type: 'ephemeral',
        text: responseMessage,
        attachments: [
          {
            color: command === '/bug-report' ? 'danger' : 'good',
            fields: [
              {
                title: 'Submission Details',
                value: `*Type:* ${command === '/add-idea' ? 'Feature Idea' : 'Bug Report'}\n*Status:* Logged in Launch Tracker\n*Priority:* ${notionItem.priority}`,
                short: false,
              },
            ],
            footer: 'Slack Summary Scribe Launch Tracker',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      });
      
    } catch (notionError) {
      console.error('Error creating Notion item:', notionError);
      
      // Return error response to Slack
      return NextResponse.json({
        response_type: 'ephemeral',
        text: '❌ Sorry, there was an error logging your submission. Please try again or contact support.',
      });
    }
    
  } catch (error) {
    console.error('Error processing Slack command:', error);
    
    return NextResponse.json({
      response_type: 'ephemeral',
      text: '❌ An unexpected error occurred. Please try again.',
    }, { status: 500 });
  }
}

// Handle GET requests (for Slack URL verification)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({
    message: 'Slack Summary Scribe - Launch Tracker Commands',
    commands: [
      '/add-idea - Submit a feature idea',
      '/bug-report - Report a bug',
    ],
  });
}
