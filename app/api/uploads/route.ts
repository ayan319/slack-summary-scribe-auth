import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID required' },
        { status: 400 }
      );
    }

    console.log('📋 Fetching uploads:', {
      userId: user.id,
      organizationId
    });

    // Demo uploads data
    const demoUploads = [
      {
        id: 'demo-upload-1',
        user_id: 'demo-user-123',
        organization_id: organizationId,
        file_name: 'quarterly-report.pdf',
        file_size: 2048000,
        file_type: 'application/pdf',
        file_url: 'https://demo-storage.example.com/quarterly-report.pdf',
        upload_status: 'completed',
        processing_status: 'completed',
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 86400000).toISOString(),
        summaries: [
          {
            id: 'demo-summary-1',
            title: 'Summary of quarterly-report.pdf',
            content: 'This quarterly report shows strong performance across all metrics...',
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]
      },
      {
        id: 'demo-upload-2',
        user_id: 'demo-user-123',
        organization_id: organizationId,
        file_name: 'meeting-notes.docx',
        file_size: 512000,
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_url: 'https://demo-storage.example.com/meeting-notes.docx',
        upload_status: 'completed',
        processing_status: 'completed',
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 172800000).toISOString(),
        summaries: [
          {
            id: 'demo-summary-2',
            title: 'Summary of meeting-notes.docx',
            content: 'Key decisions from the team meeting include...',
            created_at: new Date(Date.now() - 172800000).toISOString()
          }
        ]
      }
    ];

    // Filter by organization if provided (demo mode)
    let filteredUploads = demoUploads;
    if (organizationId && organizationId !== 'demo-org-123') {
      filteredUploads = []; // No uploads for other organizations in demo
    }

    console.log('✅ Uploads fetched (demo mode):', filteredUploads.length);

    // Transform data for frontend
    const transformedUploads = filteredUploads.map((upload: any) => ({
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
