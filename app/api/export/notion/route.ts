import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';

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

    const { summaryId } = await request.json();

    if (!summaryId) {
      return NextResponse.json(
        { success: false, error: 'Summary ID is required' },
        { status: 400 }
      );
    }

    // Get summary data
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    const { data: summary, error: summaryError } = await supabaseAdmin
      .from('summaries')
      .select(`
        *,
        file_uploads (
          file_name,
          file_size,
          file_type,
          created_at
        )
      `)
      .eq('id', summaryId)
      .eq('user_id', user.id)
      .single();

    if (summaryError || !summary) {
      return NextResponse.json(
        { success: false, error: 'Summary not found' },
        { status: 404 }
      );
    }

    // Convert summary to Notion-compatible markdown format
    const notionContent = generateNotionMarkdown(summary);

    // Create a downloadable markdown file
    const buffer = Buffer.from(notionContent, 'utf-8');

    // Log export activity
    try {
      if (supabaseAdmin) {
        await supabaseAdmin
        .from('exports')
        .insert({
          user_id: user.id,
          organization_id: summary.organization_id,
          summary_id: summaryId,
          export_type: 'notion',
          export_status: 'completed'
        });
      }
    } catch (logError) {
      console.error('Failed to log export:', logError);
    }

    // Create notification
    try {
      if (supabaseAdmin) {
        await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: user.id,
          organization_id: summary.organization_id,
          type: 'export_complete',
          title: 'Export Complete',
          message: `Your Notion export for "${summary.title}" is ready!`,
          data: {
            summaryId,
            exportType: 'notion',
            fileName: `${summary.title || 'summary'}.md`
          }
        });
      }
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    // Return markdown file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${summary.title || 'summary'}.md"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Notion export error:', error);
    
    // Log failed export
    try {
      const { summaryId } = await request.json();
      if (summaryId && supabaseAdmin) {
        await supabaseAdmin
          .from('exports')
          .insert({
            user_id: (await createRouteHandlerClient(request, NextResponse.next()).auth.getUser()).data.user?.id,
            summary_id: summaryId,
            export_type: 'notion',
            export_status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          });
      }
    } catch (logError) {
      console.error('Failed to log failed export:', logError);
    }

    return NextResponse.json(
      { success: false, error: 'Export failed' },
      { status: 500 }
    );
  }
}

function generateNotionMarkdown(summary: any): string {
  const title = summary.title || 'Untitled Summary';
  const content = summary.content || 'No content available';
  const createdAt = new Date(summary.created_at).toLocaleString();
  const sourceType = summary.source_type || 'Unknown';
  const fileName = summary.file_name || 'N/A';

  let markdown = `# ${title}\n\n`;

  // Add metadata section
  markdown += `## Document Information\n\n`;
  markdown += `- **Created:** ${createdAt}\n`;
  markdown += `- **Source Type:** ${sourceType}\n`;
  markdown += `- **File Name:** ${fileName}\n`;

  if (summary.file_uploads) {
    const fileInfo = summary.file_uploads;
    markdown += `- **File Size:** ${(fileInfo.file_size / 1024 / 1024).toFixed(2)} MB\n`;
    markdown += `- **File Type:** ${fileInfo.file_type}\n`;
    markdown += `- **Upload Date:** ${new Date(fileInfo.created_at).toLocaleString()}\n`;
  }

  markdown += `\n---\n\n`;

  // Add summary content
  markdown += `## Summary\n\n`;
  
  // Process content to ensure proper markdown formatting
  const processedContent = content
    .split('\n')
    .map((line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // Convert bullet points
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        return `- ${trimmed.substring(1).trim()}`;
      }
      
      // Convert numbered lists
      if (/^\d+\./.test(trimmed)) {
        return trimmed;
      }
      
      // Convert headers (if they exist)
      if (trimmed.startsWith('#')) {
        return `### ${trimmed.substring(1).trim()}`;
      }
      
      return trimmed;
    })
    .join('\n');

  markdown += processedContent;

  // Add metadata section if available
  if (summary.metadata) {
    markdown += `\n\n---\n\n## Technical Metadata\n\n`;
    
    const metadata = summary.metadata as any;
    Object.entries(metadata).forEach(([key, value]) => {
      markdown += `- **${key.charAt(0).toUpperCase() + key.slice(1)}:** ${String(value)}\n`;
    });
  }

  // Add footer
  markdown += `\n\n---\n\n`;
  markdown += `*Generated by Slack Summary Scribe on ${new Date().toLocaleString()}*\n`;
  markdown += `*Import this file into Notion by copying and pasting the content or using Notion's import feature.*\n`;

  return markdown;
}
