import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { SentryTracker } from '@/lib/sentry.client';

export async function GET(request: NextRequest) {
  try {
    SentryTracker.addAPIBreadcrumb('GET', '/api/summaries', undefined, {
      userAgent: request.headers.get('user-agent'),
    });

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const teamId = searchParams.get('teamId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const source = searchParams.get('source');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    let query = supabase
      .from('summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Add filters
    if (teamId) {
      query = query.eq('team_id', teamId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,summary_text.ilike.%${search}%`);
    }

    if (source) {
      query = query.eq('source', source);
    }

    const { data: summaries, error: dbError } = await query;

    if (dbError) {
      SentryTracker.addDatabaseBreadcrumb('select', 'summaries', false, {
        error: dbError.message,
        userId,
      });

      return NextResponse.json(
        { error: 'Failed to fetch summaries', details: dbError.message },
        { status: 500 }
      );
    }

    SentryTracker.addDatabaseBreadcrumb('select', 'summaries', true, {
      count: summaries?.length || 0,
      userId,
    });

    // Transform data to match expected format
    const transformedSummaries = summaries?.map((summary: any) => ({
      ...summary,
      summary: {
        text: summary.summary_text,
        skills: summary.skills_detected || [],
        redFlags: summary.red_flags || [],
        actions: summary.actions || [],
        sentiment: summary.summary?.sentiment,
        urgency: summary.summary?.urgency,
        participants: summary.summary?.participants || [],
        speakerCount: summary.summary?.speakerCount || 0,
      },
    })) || [];

    return NextResponse.json({
      success: true,
      data: transformedSummaries,
      pagination: {
        limit,
        offset,
        total: transformedSummaries.length,
      },
    });

  } catch (error) {
    console.error('Summaries API error:', error);
    
    SentryTracker.captureException(error as Error, {
      component: 'summaries-api',
      action: 'GET',
      extra: {
        url: request.url,
        method: 'GET',
      },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    SentryTracker.addAPIBreadcrumb('POST', '/api/summaries', undefined, {
      userAgent: request.headers.get('user-agent'),
    });

    const body = await request.json();
    const { 
      userId, 
      teamId, 
      title, 
      summaryText, 
      summary, 
      skillsDetected, 
      redFlags, 
      actions, 
      tags, 
      source, 
      rawTranscript,
      processingTimeMs,
      aiModel,
      confidenceScore 
    } = body;

    // Validate required fields
    if (!userId || !title || !summaryText) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, summaryText' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const { data: newSummary, error: dbError } = await supabase
      .from('summaries')
      .insert({
        user_id: userId,
        team_id: teamId,
        title,
        summary_text: summaryText,
        summary: summary || {
          text: summaryText,
          skills: skillsDetected || [],
          redFlags: redFlags || [],
          actions: actions || [],
        },
        skills_detected: skillsDetected || [],
        red_flags: redFlags || [],
        actions: actions || [],
        tags: tags || [],
        source: source || 'manual',
        raw_transcript: rawTranscript || '',
        processing_time_ms: processingTimeMs || 0,
        ai_model: aiModel || 'deepseek-chat',
        confidence_score: confidenceScore || 0.8,
      })
      .select()
      .single();

    if (dbError) {
      SentryTracker.addDatabaseBreadcrumb('insert', 'summaries', false, {
        error: dbError.message,
        userId,
      });

      return NextResponse.json(
        { error: 'Failed to create summary', details: dbError.message },
        { status: 500 }
      );
    }

    SentryTracker.addDatabaseBreadcrumb('insert', 'summaries', true, {
      summaryId: newSummary.id,
      userId,
    });

    return NextResponse.json({
      success: true,
      data: newSummary,
    });

  } catch (error) {
    console.error('Create summary API error:', error);
    
    SentryTracker.captureException(error as Error, {
      component: 'summaries-api',
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const summaryId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!summaryId || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters: id, userId' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const { error: dbError } = await supabase
      .from('summaries')
      .delete()
      .eq('id', summaryId)
      .eq('user_id', userId);

    if (dbError) {
      SentryTracker.addDatabaseBreadcrumb('delete', 'summaries', false, {
        error: dbError.message,
        summaryId,
        userId,
      });

      return NextResponse.json(
        { error: 'Failed to delete summary', details: dbError.message },
        { status: 500 }
      );
    }

    SentryTracker.addDatabaseBreadcrumb('delete', 'summaries', true, {
      summaryId,
      userId,
    });

    return NextResponse.json({
      success: true,
      message: 'Summary deleted successfully',
    });

  } catch (error) {
    console.error('Delete summary API error:', error);
    
    SentryTracker.captureException(error as Error, {
      component: 'summaries-api',
      action: 'DELETE',
      extra: {
        url: request.url,
        method: 'DELETE',
      },
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
