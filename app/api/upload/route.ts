import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import { parseFile, generateStoragePath, getFileExtension } from '@/lib/file-parser';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const organizationId = formData.get('organizationId') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only PDF and DOCX files are supported' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Generate storage path
    const storagePath = generateStoragePath(user.id, file.name);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('file-uploads')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin!.storage
      .from('file-uploads')
      .getPublicUrl(storagePath);

    // Create file upload record
    const { data: fileUpload, error: dbError } = await supabaseAdmin!
      .from('file_uploads')
      .insert({
        user_id: user.id,
        organization_id: organizationId || null,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_url: urlData.publicUrl,
        storage_path: storagePath,
        upload_status: 'completed',
        processing_status: 'pending'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      
      // Clean up uploaded file
      await supabaseAdmin!.storage
        .from('file-uploads')
        .remove([storagePath]);
      
      return NextResponse.json(
        { success: false, error: 'Failed to save file record' },
        { status: 500 }
      );
    }

    // Start background processing
    processFileInBackground(fileUpload.id, buffer, file.type);

    return NextResponse.json({
      success: true,
      data: {
        id: fileUpload.id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadStatus: 'completed',
        processingStatus: 'pending'
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

// Background processing function
async function processFileInBackground(fileUploadId: string, buffer: Buffer, mimeType: string) {
  try {
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available for background processing');
      return;
    }

    // Update status to processing
    await supabaseAdmin
      .from('file_uploads')
      .update({ processing_status: 'extracting' })
      .eq('id', fileUploadId);

    // Parse file content
    const parseResult = await parseFile(buffer, mimeType);
    
    if ('error' in parseResult) {
      await supabaseAdmin
        .from('file_uploads')
        .update({ 
          processing_status: 'failed',
          error_message: parseResult.error
        })
        .eq('id', fileUploadId);
      return;
    }

    // Update with extracted text
    await supabaseAdmin
      .from('file_uploads')
      .update({ 
        processing_status: 'summarizing',
        extracted_text: parseResult.text
      })
      .eq('id', fileUploadId);

    // Generate summary using DeepSeek
    const summaryResult = await generateSummary(parseResult.text);
    
    if (!summaryResult.success) {
      await supabaseAdmin
        .from('file_uploads')
        .update({ 
          processing_status: 'failed',
          error_message: summaryResult.error
        })
        .eq('id', fileUploadId);
      return;
    }

    // Get file upload details
    const { data: fileUpload } = await supabaseAdmin
      .from('file_uploads')
      .select('*')
      .eq('id', fileUploadId)
      .single();

    if (!fileUpload) return;

    // Create summary record
    const { data: summary, error: summaryError } = await supabaseAdmin
      .from('summaries')
      .insert({
        user_id: fileUpload.user_id,
        organization_id: fileUpload.organization_id,
        file_upload_id: fileUploadId,
        source_type: 'file_upload',
        file_name: fileUpload.file_name,
        file_url: fileUpload.file_url,
        title: `Summary of ${fileUpload.file_name}`,
        content: summaryResult.summary,
        metadata: {
          wordCount: parseResult.metadata.wordCount,
          characterCount: parseResult.metadata.characterCount,
          pages: parseResult.metadata.pages
        }
      })
      .select()
      .single();

    if (summaryError) {
      console.error('Summary creation error:', summaryError);
      await supabaseAdmin
        .from('file_uploads')
        .update({ 
          processing_status: 'failed',
          error_message: 'Failed to create summary'
        })
        .eq('id', fileUploadId);
      return;
    }

    // Update file upload status
    await supabaseAdmin
      .from('file_uploads')
      .update({ processing_status: 'completed' })
      .eq('id', fileUploadId);

    // Create notification
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: fileUpload.user_id,
        organization_id: fileUpload.organization_id,
        type: 'summary_ready',
        title: 'Summary Ready',
        message: `Your summary for "${fileUpload.file_name}" is ready!`,
        data: {
          fileUploadId,
          summaryId: summary.id,
          fileName: fileUpload.file_name
        }
      });

  } catch (error) {
    console.error('Background processing error:', error);
    if (supabaseAdmin) {
      await supabaseAdmin
      .from('file_uploads')
      .update({ 
        processing_status: 'failed',
        error_message: 'Processing failed'
      })
      .eq('id', fileUploadId);
    }
  }
}

// Generate summary using OpenRouter (DeepSeek R1 with GPT-4o-mini fallback)
async function generateSummary(text: string): Promise<{ success: boolean; summary?: string; error?: string }> {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      return { success: false, error: 'OpenRouter API key not configured' };
    }

    // Import OpenAI client
    const { default: OpenAI } = await import('openai');

    const openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Slack Summarizer SaaS"
      }
    });

    const systemPrompt = 'You are an expert document summarizer. Create a comprehensive, well-structured summary of the provided document. Include key points, main themes, and important details. Format the summary with clear sections and bullet points where appropriate.';
    const userPrompt = `Please summarize this document:\n\n${text}`;

    try {
      // Try DeepSeek R1 first
      const completion = await openRouterClient.chat.completions.create({
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      });

      const summary = completion.choices?.[0]?.message?.content;

      if (!summary) {
        throw new Error('No summary generated from DeepSeek R1');
      }

      return { success: true, summary };

    } catch (primaryError) {
      console.error('DeepSeek R1 failed, trying GPT-4o-mini fallback:', primaryError);

      // Fallback to GPT-4o-mini
      try {
        const fallbackCompletion = await openRouterClient.chat.completions.create({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3
        });

        const fallbackSummary = fallbackCompletion.choices?.[0]?.message?.content;

        if (!fallbackSummary) {
          throw new Error('No summary generated from GPT-4o-mini fallback');
        }

        return { success: true, summary: fallbackSummary };

      } catch (fallbackError) {
        console.error('Both DeepSeek R1 and GPT-4o-mini failed:', fallbackError);
        return { success: false, error: 'All AI models failed to generate summary' };
      }
    }

  } catch (error) {
    console.error('Summary generation error:', error);
    return { success: false, error: 'Summary generation failed' };
  }
}
