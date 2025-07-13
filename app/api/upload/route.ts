import { NextRequest, NextResponse } from 'next/server';
import { parseFile, generateStoragePath, getFileExtension } from '@/lib/file-parser';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { trackFileUpload, trackSummaryGeneration, trackNotificationSent } from '@/lib/analytics';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain' // Temporary for testing
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get the current user session (auth-free mode for testing)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    let userId = null;
    if (sessionError || !session) {
      // For testing purposes, use a demo user ID
      console.log('No session found, using demo user for file upload testing');
      userId = '00000000-0000-0000-0000-000000000001';
    } else {
      userId = session.user.id;
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    let organizationId = formData.get('organizationId') as string;

    // For testing purposes, use a demo organization ID if none provided
    if (!organizationId) {
      organizationId = '00000000-0000-0000-0000-000000000001';
    }

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 20MB' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only PDF and DOCX files are supported' },
        { status: 400 }
      );
    }

    // Convert file to buffer for parsing
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate storage path
    const storagePath = generateStoragePath(userId, file.name);

    // Create file upload record in Supabase
    const { data: fileUpload, error: uploadError } = await supabase
      .from('file_uploads')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        file_path: storagePath,
        upload_status: 'completed'
      })
      .select()
      .single();

    if (uploadError || !fileUpload) {
      console.error('Failed to create file upload record:', uploadError);
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
      return NextResponse.json(
        { success: false, error: 'Failed to save file record', details: uploadError?.message || 'Unknown database error' },
        { status: 500 }
      );
    }

    // Track file upload analytics
    await trackFileUpload(userId, file.name, file.size, file.type, organizationId);

    // Start background processing
    processFileInBackground(fileUpload.id, buffer, file.type, userId);

    return NextResponse.json({
      success: true,
      data: {
        id: fileUpload.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadStatus: 'completed',
        processingStatus: 'processing'
      }
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Real background processing function with AI summarization
async function processFileInBackground(fileUploadId: string, buffer: Buffer, mimeType: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  try {
    // Step 1: Parse file content
    const parseResult = await parseFile(buffer, mimeType);

    if ('error' in parseResult) {
      // Update file upload status to error
      await supabase
        .from('file_uploads')
        .update({
          processing_status: 'error',
          error_message: parseResult.error,
          updated_at: new Date().toISOString()
        })
        .eq('id', fileUploadId);

      console.error('File parsing failed:', parseResult.error);
      return;
    }

    const extractedText = parseResult.text;
    const metadata = parseResult.metadata;

    // Step 2: Generate AI summary using DeepSeek
    const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: extractedText,
        userId: userId
      })
    });

    if (!summaryResponse.ok) {
      throw new Error('Failed to generate summary');
    }

    const summaryData = await summaryResponse.json();

    if (!summaryData.success) {
      throw new Error(summaryData.error || 'Summary generation failed');
    }

    // Step 3: Save summary to database
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .insert({
        user_id: userId,
        file_id: fileUploadId,
        title: `Summary of ${extractedText.substring(0, 50)}...`,
        content: summaryData.summary,
        original_text: extractedText,
        word_count: metadata.wordCount,
        language: 'en', // Default to English for now
        tags: summaryData.tags || [],
        summary_type: 'file_upload',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (summaryError || !summary) {
      throw new Error('Failed to save summary');
    }

    // Step 4: Update file upload status to completed
    await supabase
      .from('file_uploads')
      .update({
        processing_status: 'completed',
        summary_id: summary.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileUploadId);

    // Step 5: Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'summary_completed',
        title: 'Summary Generated',
        message: `Your document summary is ready!`,
        data: {
          fileId: fileUploadId,
          summaryId: summary.id
        },
        read: false,
        created_at: new Date().toISOString()
      });

    // Step 6: Track analytics
    await trackSummaryGeneration(userId, summary.id, 'file_upload', metadata.wordCount);
    await trackNotificationSent(userId, 'summary_completed', 'in_app');

    console.log('File processing completed successfully:', fileUploadId);

  } catch (error) {
    console.error('Background processing error:', error);

    // Update file upload status to error
    await supabase
      .from('file_uploads')
      .update({
        processing_status: 'error',
        error_message: error instanceof Error ? error.message : 'Processing failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', fileUploadId);
  }
}



