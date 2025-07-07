import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const uploadId = resolvedParams.id;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    // Get file upload status
    const { data: fileUpload, error } = await supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('id', uploadId)
      .eq('user_id', user.id)
      .single();

    if (error || !fileUpload) {
      return NextResponse.json(
        { success: false, error: 'File upload not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: fileUpload.id,
        fileName: fileUpload.file_name,
        fileSize: fileUpload.file_size,
        uploadStatus: fileUpload.upload_status,
        processingStatus: fileUpload.processing_status,
        errorMessage: fileUpload.error_message,
        createdAt: fileUpload.created_at,
        updatedAt: fileUpload.updated_at
      }
    });

  } catch (error) {
    console.error('Upload status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
