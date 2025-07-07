import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const response = NextResponse.next();
    const supabase = createRouteHandlerClient(request, response);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    // Build query
    let query = supabaseAdmin
      .from('file_uploads')
      .select(`
        *,
        summaries (
          id,
          title,
          content,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Filter by organization if provided
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }

    const { data: uploads, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch uploads' },
        { status: 500 }
      );
    }

    // Transform data for frontend
    const transformedUploads = uploads.map((upload: any) => ({
      id: upload.id,
      fileName: upload.file_name,
      fileSize: upload.file_size,
      fileType: upload.file_type,
      fileUrl: upload.file_url,
      uploadStatus: upload.upload_status,
      processingStatus: upload.processing_status,
      errorMessage: upload.error_message,
      createdAt: upload.created_at,
      summary: upload.summaries && upload.summaries.length > 0 ? {
        id: upload.summaries[0].id,
        title: upload.summaries[0].title,
        content: upload.summaries[0].content,
        createdAt: upload.summaries[0].created_at
      } : null
    }));

    return NextResponse.json({
      success: true,
      data: transformedUploads
    });

  } catch (error) {
    console.error('Uploads API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
