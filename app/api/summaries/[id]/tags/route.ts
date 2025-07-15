import { NextRequest, NextResponse } from 'next/server';
import { extractSummaryTags, getSummaryTags } from '@/lib/ai-tagging';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { SentryTracker } from '@/lib/sentry.client';

/**
 * GET /api/summaries/[id]/tags
 * Get tags for a specific summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: summaryId } = await params;

    if (!summaryId) {
      return NextResponse.json(
        { error: 'Summary ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user owns the summary
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .select('id, user_id')
      .eq('id', summaryId)
      .eq('user_id', user.id)
      .single();

    if (summaryError || !summary) {
      return NextResponse.json(
        { error: 'Summary not found or access denied' },
        { status: 404 }
      );
    }

    // Get existing tags
    const tags = await getSummaryTags(summaryId);

    return NextResponse.json({
      success: true,
      data: {
        summary_id: summaryId,
        tags: tags || null,
        has_tags: !!tags
      }
    });

  } catch (error) {
    console.error('Get summary tags API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/summaries/[id]/tags
 * Generate tags for a specific summary
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: summaryId } = await params;

    if (!summaryId) {
      return NextResponse.json(
        { error: 'Summary ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the summary with content
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .select('id, user_id, content, title')
      .eq('id', summaryId)
      .eq('user_id', user.id)
      .single();

    if (summaryError || !summary) {
      return NextResponse.json(
        { error: 'Summary not found or access denied' },
        { status: 404 }
      );
    }

    // Check if summary has content
    if (!summary.content || summary.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Summary has no content to analyze' },
        { status: 400 }
      );
    }

    // Extract tags using AI
    const taggingResult = await extractSummaryTags(
      summary.content,
      summaryId,
      user.id
    );

    if (!taggingResult.success) {
      return NextResponse.json(
        { 
          error: taggingResult.error || 'Failed to extract tags',
          details: 'AI tagging service unavailable'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        summary_id: summaryId,
        tags: taggingResult.tags,
        processing_time_ms: taggingResult.processing_time_ms,
        message: 'Tags extracted successfully'
      }
    });

  } catch (error) {
    console.error('Generate summary tags API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/summaries/[id]/tags
 * Delete tags for a specific summary
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: summaryId } = await params;

    if (!summaryId) {
      return NextResponse.json(
        { error: 'Summary ID is required' },
        { status: 400 }
      );
    }

    // Get current user
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify user owns the summary
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .select('id, user_id')
      .eq('id', summaryId)
      .eq('user_id', user.id)
      .single();

    if (summaryError || !summary) {
      return NextResponse.json(
        { error: 'Summary not found or access denied' },
        { status: 404 }
      );
    }

    // Delete tags
    const { error: deleteError } = await supabase
      .from('summary_tags')
      .delete()
      .eq('summary_id', summaryId);

    if (deleteError) {
      console.error('Error deleting summary tags:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete tags' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tags deleted successfully'
    });

  } catch (error) {
    console.error('Delete summary tags API error:', error);
    SentryTracker.captureException(error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
