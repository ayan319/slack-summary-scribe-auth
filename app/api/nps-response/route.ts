import { NextRequest, NextResponse } from 'next/server';
import AutomatedFeedback from '../../../lib/automated-feedback';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('survey');
    const scoreStr = searchParams.get('score');
    const feedback = searchParams.get('feedback');

    if (!surveyId || !scoreStr) {
      return NextResponse.json(
        { error: 'Missing survey ID or score' },
        { status: 400 }
      );
    }

    const score = parseInt(scoreStr);
    if (isNaN(score) || score < 0 || score > 10) {
      return NextResponse.json(
        { error: 'Invalid score. Must be between 0 and 10' },
        { status: 400 }
      );
    }

    // Process NPS response
    const result = await AutomatedFeedback.processNPSResponse(surveyId, score, feedback || undefined);

    // Return thank you page
    const thankYouHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank you for your feedback!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            text-align: center;
          }
          .container {
            background: #f8fafc;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .emoji {
            font-size: 48px;
            margin-bottom: 20px;
          }
          h1 {
            color: #2563eb;
            margin-bottom: 20px;
          }
          .score {
            font-size: 24px;
            font-weight: bold;
            color: ${score >= 9 ? '#10b981' : score >= 7 ? '#f59e0b' : '#ef4444'};
            margin: 20px 0;
          }
          .message {
            font-size: 18px;
            margin-bottom: 30px;
          }
          .cta {
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
          }
          .feedback-form {
            margin-top: 30px;
            text-align: left;
          }
          textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-family: inherit;
            resize: vertical;
            min-height: 100px;
          }
          button {
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="emoji">${score >= 9 ? '🎉' : score >= 7 ? '👍' : '🤝'}</div>
          <h1>Thank you for your feedback!</h1>
          <div class="score">Your score: ${score}/10</div>
          <div class="message">
            ${score >= 9 
              ? 'We\'re thrilled you love Slack Summary Scribe! Your support means everything to us.'
              : score >= 7 
              ? 'Thanks for the feedback! We\'re always working to improve your experience.'
              : 'We appreciate your honesty and want to make this better for you.'
            }
          </div>
          
          ${!feedback ? `
            <div class="feedback-form">
              <h3>Want to tell us more? (Optional)</h3>
              <form action="/api/nps-feedback" method="POST">
                <input type="hidden" name="survey_id" value="${surveyId}">
                <textarea name="feedback" placeholder="What could we do better? Any specific suggestions?"></textarea>
                <br>
                <button type="submit">Send Additional Feedback</button>
              </form>
            </div>
          ` : ''}
          
          <div style="margin-top: 40px;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="cta">
              Back to Dashboard
            </a>
          </div>
          
          <div style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            ${score >= 9 
              ? 'Consider <a href="/referral">inviting your team</a> to get premium features!'
              : score >= 7 
              ? 'Check out our <a href="/features">latest features</a> that might interest you.'
              : 'Our <a href="/support">support team</a> is here to help if you need anything.'
            }
          </div>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(thankYouHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error processing NPS response:', error);
    
    const errorHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Oops! Something went wrong</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 40px 20px;
            text-align: center;
          }
          .container {
            background: #fef2f2;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          h1 {
            color: #dc2626;
            margin-bottom: 20px;
          }
          .cta {
            background: #2563eb;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="font-size: 48px; margin-bottom: 20px;">😅</div>
          <h1>Oops! Something went wrong</h1>
          <p>We're sorry, but there was an issue processing your feedback. Our team has been notified.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" class="cta">
            Back to Dashboard
          </a>
        </div>
      </body>
      </html>
    `;

    return new NextResponse(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }
}

export async function POST(request: NextRequest) {
  // Handle additional feedback submission
  try {
    const formData = await request.formData();
    const surveyId = formData.get('survey_id') as string;
    const feedback = formData.get('feedback') as string;

    if (!surveyId || !feedback) {
      return NextResponse.json(
        { error: 'Missing survey ID or feedback' },
        { status: 400 }
      );
    }

    // Update the survey with additional feedback
    // This would be implemented in the AutomatedFeedback class
    
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?feedback=submitted`);
  } catch (error) {
    console.error('Error submitting additional feedback:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}
