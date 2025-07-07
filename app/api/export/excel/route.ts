import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient, supabaseAdmin } from '@/lib/supabase';
import ExcelJS from 'exceljs';

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

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Slack Summary Scribe';
    workbook.lastModifiedBy = user.email || 'User';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create main summary worksheet
    const summarySheet = workbook.addWorksheet('Summary');
    
    // Set column widths
    summarySheet.columns = [
      { header: 'Field', key: 'field', width: 20 },
      { header: 'Value', key: 'value', width: 80 }
    ];

    // Add header styling
    summarySheet.getRow(1).font = { bold: true, size: 12 };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' }
    };

    // Add summary data
    const summaryData = [
      { field: 'Title', value: summary.title || 'Untitled Summary' },
      { field: 'Created Date', value: new Date(summary.created_at).toLocaleString() },
      { field: 'Source Type', value: summary.source_type || 'Unknown' },
      { field: 'File Name', value: summary.file_name || 'N/A' },
      { field: 'Organization', value: summary.organization_id || 'Personal' },
      { field: '', value: '' }, // Empty row
      { field: 'Summary Content', value: '' }
    ];

    summaryData.forEach((row, index) => {
      const rowNum = index + 2;
      summarySheet.addRow(row);
      
      // Make field names bold
      summarySheet.getCell(`A${rowNum}`).font = { bold: true };
      
      // Add border to all cells
      ['A', 'B'].forEach(col => {
        summarySheet.getCell(`${col}${rowNum}`).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Add summary content in a merged cell
    const contentStartRow = summaryData.length + 2;
    summarySheet.mergeCells(`A${contentStartRow}:B${contentStartRow + 20}`);
    const contentCell = summarySheet.getCell(`A${contentStartRow}`);
    contentCell.value = summary.content || 'No content available';
    contentCell.alignment = { 
      vertical: 'top', 
      horizontal: 'left',
      wrapText: true 
    };
    contentCell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Create metadata worksheet if available
    if (summary.metadata) {
      const metadataSheet = workbook.addWorksheet('Metadata');
      
      metadataSheet.columns = [
        { header: 'Property', key: 'property', width: 25 },
        { header: 'Value', key: 'value', width: 30 }
      ];

      // Add header styling
      metadataSheet.getRow(1).font = { bold: true, size: 12 };
      metadataSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      };

      // Add metadata
      const metadata = summary.metadata as any;
      Object.entries(metadata).forEach(([key, value]) => {
        metadataSheet.addRow({
          property: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value)
        });
      });

      // Add file information if available
      if (summary.file_uploads) {
        const fileInfo = summary.file_uploads;
        metadataSheet.addRow({ property: '', value: '' }); // Empty row
        metadataSheet.addRow({ property: 'File Information', value: '' });
        metadataSheet.addRow({ property: 'File Name', value: fileInfo.file_name });
        metadataSheet.addRow({ property: 'File Size', value: `${(fileInfo.file_size / 1024 / 1024).toFixed(2)} MB` });
        metadataSheet.addRow({ property: 'File Type', value: fileInfo.file_type });
        metadataSheet.addRow({ property: 'Upload Date', value: new Date(fileInfo.created_at).toLocaleString() });
      }

      // Style metadata sheet
      metadataSheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          row.getCell(1).font = { bold: true };
        }
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });
    }

    // Generate Excel buffer
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    // Log export activity
    try {
      await supabaseAdmin
        .from('exports')
        .insert({
          user_id: user.id,
          organization_id: summary.organization_id,
          summary_id: summaryId,
          export_type: 'excel',
          export_status: 'completed'
        });
    } catch (logError) {
      console.error('Failed to log export:', logError);
      // Don't fail the export if logging fails
    }

    // Create notification
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: user.id,
          organization_id: summary.organization_id,
          type: 'export_complete',
          title: 'Export Complete',
          message: `Your Excel export for "${summary.title}" is ready!`,
          data: {
            summaryId,
            exportType: 'excel',
            fileName: `${summary.title || 'summary'}.xlsx`
          }
        });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
      // Don't fail the export if notification fails
    }

    // Return Excel file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${summary.title || 'summary'}.xlsx"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Excel export error:', error);
    
    // Log failed export
    try {
      const { summaryId } = await request.json();
      if (summaryId && supabaseAdmin) {
        await supabaseAdmin
          .from('exports')
          .insert({
            user_id: (await createRouteHandlerClient(request, NextResponse.next()).auth.getUser()).data.user?.id,
            summary_id: summaryId,
            export_type: 'excel',
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
