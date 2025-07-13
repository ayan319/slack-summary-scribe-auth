import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { trackExport, trackNotificationSent } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get the current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { summaryId } = await request.json();

    if (!summaryId) {
      return NextResponse.json(
        { success: false, error: 'Summary ID is required' },
        { status: 400 }
      );
    }

    // Verify user owns the summary
    const { data: summaryData, error: summaryError } = await supabase
      .from('summaries')
      .select('*')
      .eq('id', summaryId)
      .eq('user_id', userId)
      .single();

    if (summaryError || !summaryData) {
      return NextResponse.json(
        { error: 'Summary not found or access denied' },
        { status: 404 }
      );
    }

    const summary = summaryData;

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = 'Slack Summary Scribe';
    workbook.lastModifiedBy = 'Demo User';
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
    const summaryFields = [
      { field: 'Title', value: summary.title || 'Untitled Summary' },
      { field: 'Created Date', value: new Date(summary.created_at).toLocaleString() },
      { field: 'Source Type', value: 'Demo' },
      { field: 'File Name', value: 'demo-export.xlsx' },
      { field: 'Organization', value: 'Demo Organization' },
      { field: '', value: '' }, // Empty row
      { field: 'Summary Content', value: '' }
    ];

    summaryFields.forEach((row, index) => {
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
    contentCell.value = summary.summary_text || 'No content available';
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

    // Create metadata worksheet (demo data)
    const demoMetadata = {
      processing_time: '1.25 seconds',
      ai_model: 'deepseek-chat',
      confidence_score: '92%',
      word_count: 450,
      language: 'English'
    };

    if (demoMetadata) {
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
      Object.entries(demoMetadata).forEach(([key, value]) => {
        metadataSheet.addRow({
          property: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value)
        });
      });

      // Add file information if available
      if (summary.file_uploads && summary.file_uploads.length > 0) {
        const fileInfo = summary.file_uploads[0];
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
    await supabase
      .from('exports')
      .insert({
        user_id: userId,
        file_id: summary.file_id,
        summary_id: summaryId,
        export_type: 'excel',
        file_name: `${summary.title || 'summary'}.xlsx`,
        created_at: new Date().toISOString()
      });

    // Create notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'export_completed',
        title: 'Excel Export Ready',
        message: `Your Excel export "${summary.title || 'summary'}.xlsx" is ready for download.`,
        data: {
          summaryId: summaryId,
          exportType: 'excel'
        },
        read: false,
        created_at: new Date().toISOString()
      });

    // Track analytics
    await trackExport(userId, 'excel', summaryId);
    await trackNotificationSent(userId, 'export_completed', 'in_app');

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

    return NextResponse.json(
      { success: false, error: 'Export failed' },
      { status: 500 }
    );
  }
}
