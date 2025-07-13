import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const timestamp = request.headers.get('x-slack-request-timestamp');
    const signature = request.headers.get('x-slack-signature');

    // Verify Slack signature (in production)
    if (process.env.NODE_ENV === 'production' && process.env.SLACK_SIGNING_SECRET) {
      if (!timestamp || !signature) {
        return NextResponse.json(
          { error: 'Missing Slack signature headers' },
          { status: 401 }
        );
      }

      const time = Math.floor(new Date().getTime() / 1000);
      if (Math.abs(time - parseInt(timestamp)) > 300) {
        return NextResponse.json(
          { error: 'Request timestamp too old' },
          { status: 401 }
        );
      }

      const sigBasestring = 'v0:' + timestamp + ':' + body;
      const mySignature = 'v0=' + crypto
        .createHmac('sha256', process.env.SLACK_SIGNING_SECRET)
        .update(sigBasestring, 'utf8')
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(mySignature), Buffer.from(signature))) {
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    const data = JSON.parse(body);

    // Handle URL verification challenge
    if (data.type === 'url_verification') {
      return new NextResponse(data.challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Handle event callbacks
    if (data.type === 'event_callback') {
      const event = data.event;

      // Handle different event types
      switch (event.type) {
        case 'message':
          await handleMessageEvent(event, data);
          break;
        case 'app_mention':
          await handleMentionEvent(event, data);
          break;
        default:
          console.log('Unhandled event type:', event.type);
      }

      return NextResponse.json({ ok: true });
    }

    // Handle interactive components (buttons, modals, etc.)
    if (data.type === 'interactive_callback') {
      await handleInteractiveCallback(data);
      return NextResponse.json({ ok: true });
    }

    // Handle slash commands
    if (data.command) {
      const response = await handleSlashCommand(data);
      return NextResponse.json(response);
    }

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Slack webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleMessageEvent(event: any, data: any) {
  try {
    // Skip bot messages and messages without text
    if (event.bot_id || !event.text || event.subtype) {
      return;
    }

    // Check if this is a thread or channel we should summarize
    const shouldSummarize = await shouldSummarizeChannel(event.channel, data.team_id);
    
    if (shouldSummarize) {
      // Queue message for summarization
      await queueMessageForSummarization({
        channel: event.channel,
        user: event.user,
        text: event.text,
        timestamp: event.ts,
        team_id: data.team_id
      });
    }

  } catch (error) {
    console.error('Error handling message event:', error);
  }
}

async function handleMentionEvent(event: any, data: any) {
  try {
    // Handle @bot mentions - trigger immediate summarization
    if (event.text.includes('summarize')) {
      await triggerChannelSummarization(event.channel, data.team_id);
    }
  } catch (error) {
    console.error('Error handling mention event:', error);
  }
}

async function handleInteractiveCallback(data: any) {
  try {
    const payload = data.payload ? JSON.parse(data.payload) : data;
    
    switch (payload.type) {
      case 'button':
        await handleButtonClick(payload);
        break;
      case 'view_submission':
        await handleModalSubmission(payload);
        break;
      default:
        console.log('Unhandled interactive callback type:', payload.type);
    }
  } catch (error) {
    console.error('Error handling interactive callback:', error);
  }
}

async function handleSlashCommand(data: any) {
  try {
    const { command, text, channel_id, user_id, team_id } = data;

    switch (command) {
      case '/summarize':
        return await handleSummarizeCommand(text, channel_id, user_id, team_id);
      case '/summary-settings':
        return await handleSettingsCommand(channel_id, user_id, team_id);
      default:
        return {
          response_type: 'ephemeral',
          text: `Unknown command: ${command}`
        };
    }
  } catch (error) {
    console.error('Error handling slash command:', error);
    return {
      response_type: 'ephemeral',
      text: 'Sorry, there was an error processing your command.'
    };
  }
}

async function shouldSummarizeChannel(channelId: string, teamId: string): Promise<boolean> {
  // In production, check database for channel settings
  // For now, return true for demo purposes
  return true;
}

async function queueMessageForSummarization(messageData: any) {
  // In production, add to queue for batch processing
  console.log('Queuing message for summarization:', messageData);
}

async function triggerChannelSummarization(channelId: string, teamId: string) {
  // In production, trigger immediate summarization
  console.log('Triggering channel summarization:', { channelId, teamId });
}

async function handleButtonClick(payload: any) {
  // Handle button interactions
  console.log('Button clicked:', payload);
}

async function handleModalSubmission(payload: any) {
  // Handle modal form submissions
  console.log('Modal submitted:', payload);
}

async function handleSummarizeCommand(text: string, channelId: string, userId: string, teamId: string) {
  return {
    response_type: 'in_channel',
    text: '🤖 Generating summary...',
    attachments: [
      {
        color: 'good',
        text: 'I\'ll analyze the recent messages in this channel and provide a summary shortly.',
        footer: 'Slack Summary Scribe',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };
}

async function handleSettingsCommand(channelId: string, userId: string, teamId: string) {
  return {
    response_type: 'ephemeral',
    text: '⚙️ Summary Settings',
    attachments: [
      {
        color: '#36a64f',
        text: 'Configure your summarization preferences:',
        actions: [
          {
            name: 'frequency',
            text: 'Set Frequency',
            type: 'button',
            value: 'frequency'
          },
          {
            name: 'ai_model',
            text: 'Choose AI Model',
            type: 'button',
            value: 'ai_model'
          }
        ]
      }
    ]
  };
}
