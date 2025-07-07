import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { AISummarizer } from '@/src/lib/ai-summarizer';
import { SentryTracker } from '@/src/lib/sentry-utils';

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
    const summaryRequest = {
      transcriptText,
      userId,
      teamId,
      context: context || {
        source: 'manual',
        timestamp: new Date().toISOString(),
      },
    };

    const result = await AISummarizer.generateSummary(summaryRequest);

    if (result.error) {
      SentryTracker.addSummarizationBreadcrumb('manual', 'failed', undefined, {
        error: result.error,
        userId,
      });

      return NextResponse.json(
        { error: 'Failed to generate summary', details: result.error },
        { status: 500 }
      );
    }

    // Save to database
    const supabase = createSupabaseClient();
    const { data: summary, error: dbError } = await supabase
      .from('summaries')
      .insert({
        user_id: userId,
        team_id: teamId,
        title: result.data?.title || 'Untitled Summary',
        summary_text: result.data?.summary || '',
        summary: {
          text: result.data?.summary || '',
          skills: result.data?.skills || [],
          redFlags: result.data?.redFlags || [],
          actions: result.data?.actionItems || [],
          sentiment: result.data?.sentiment,
          urgency: result.data?.urgency,
          participants: result.data?.participants || [],
          speakerCount: result.data?.participants?.length || 0,
        },
        skills_detected: result.data?.skills || [],
        red_flags: result.data?.redFlags || [],
        actions: result.data?.actionItems || [],
        tags: [],
        source: context?.source || 'manual',
        raw_transcript: transcriptText,
        processing_time_ms: result.data?.processingTimeMs || 0,
        ai_model: 'deepseek-chat',
        confidence_score: result.data?.confidence || 0.8,
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

    SentryTracker.addSummarizationBreadcrumb('manual', 'completed', result.data?.processingTimeMs, {
      summaryId: summary.id,
      userId,
    });

    SentryTracker.addDatabaseBreadcrumb('insert', 'summaries', true, {
      summaryId: summary.id,
      userId,
    });

    return NextResponse.json({
      success: true,
      data: summary,
    });

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
