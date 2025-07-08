import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { generateDeepSeekSummary } from '@/lib/slack';
import { SentryTracker } from '@/lib/sentry.client';

export async function POST(request: NextRequest) {
  try {
    SentryTracker.addAPIBreadcrumb('POST', '/api/summarize', undefined, {
      userAgent: request.headers.get('user-agent'),
    });

    const body = await request.json();
    const { transcriptText, userId, teamId, context } = body;

    // Validate required fields
    if (!transcriptText || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: transcriptText, userId' },
        { status: 400 }
      );
    }

    // Add summarization breadcrumb
    SentryTracker.addSummarizationBreadcrumb('manual', 'started', undefined, {
      userId,
      teamId,
      textLength: transcriptText.length,
    });

    // Generate summary using AI
    const startTime = Date.now();

    try {
      const summaryText = await generateDeepSeekSummary(transcriptText, context?.source || 'manual');
      const processingTime = Date.now() - startTime;

      SentryTracker.addSummarizationBreadcrumb('manual', 'completed', processingTime, {
        userId,
        textLength: transcriptText.length,
      });

    // Save to database
    const supabase = createSupabaseClient();
    const { data: summary, error: dbError } = await supabase
      .from('summaries')
      .insert({
        user_id: userId,
        team_id: teamId,
        title: `Summary - ${new Date().toLocaleDateString()}`,
        summary_text: summaryText,
        summary: {
          text: summaryText,
          skills: [],
          redFlags: [],
          actions: [],
          sentiment: 'neutral',
          urgency: 'medium',
          participants: [],
          speakerCount: 0,
        },
        skills_detected: [],
        red_flags: [],
        actions: [],
        tags: [],
        source: context?.source || 'manual',
        raw_transcript: transcriptText,
        processing_time_ms: processingTime,
        ai_model: 'deepseek-r1',
        confidence_score: 0.8,
      })
      .select()
      .single();

    if (dbError) {
      SentryTracker.addDatabaseBreadcrumb('insert', 'summaries', false, {
        error: dbError.message,
        userId,
      });

      return NextResponse.json(
        { error: 'Failed to save summary', details: dbError.message },
        { status: 500 }
      );
    }

      SentryTracker.addDatabaseBreadcrumb('insert', 'summaries', true, {
        summaryId: summary.id,
        userId,
      });

      return NextResponse.json({
        success: true,
        data: summary,
      });

    } catch (aiError) {
      SentryTracker.addSummarizationBreadcrumb('manual', 'failed', undefined, {
        error: aiError instanceof Error ? aiError.message : 'Unknown error',
        userId,
      });

      return NextResponse.json(
        { error: 'Failed to generate summary', details: aiError instanceof Error ? aiError.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Summarize API error:', error);
    
    SentryTracker.captureException(error as Error, {
      component: 'summarize-api',
      action: 'POST',
      extra: {
        url: request.url,
        method: 'POST',
      },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
