import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Demo mode - no authentication required
    console.log('📊 Upload Status: Demo mode active');

    const resolvedParams = await params;
    const uploadId = resolvedParams.id;

    // Demo user
    const demoUser = { id: 'demo-user-123', email: 'demo@example.com' };

    console.log('📁 Checking upload status (demo mode):', {
      uploadId,
      userId: demoUser.id
    });

    // Demo file upload status
    const demoFileUpload = {
      id: uploadId,
      file_name: 'demo-document.pdf',
      file_size: 1024000,
      upload_status: 'completed',
      processing_status: 'completed',
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ File upload status retrieved (demo mode):', demoFileUpload);

    return NextResponse.json({
      success: true,
      data: {
        id: demoFileUpload.id,
        fileName: demoFileUpload.file_name,
        fileSize: demoFileUpload.file_size,
        uploadStatus: demoFileUpload.upload_status,
        processingStatus: demoFileUpload.processing_status,
        errorMessage: demoFileUpload.error_message,
        createdAt: demoFileUpload.created_at,
        updatedAt: demoFileUpload.updated_at
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
