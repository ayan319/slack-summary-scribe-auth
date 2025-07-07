/**
 * Export Services for Summary Data
 * Handles integration with external services like Notion, CRM systems, etc.
 */

export interface ExportOptions {
  summaryId: string;
  type: 'notion' | 'crm' | 'pdf' | 'markdown' | 'json';
  options?: {
    // Notion specific
    pageTitle?: string;
    databaseId?: string;
    parentPageId?: string;
    
    // CRM specific
    contactId?: string;
    dealId?: string;
    accountId?: string;
    
    // PDF specific
    template?: string;
    includeTranscript?: boolean;
    
    // General
    includeMetadata?: boolean;
    customFields?: Record<string, any>;
  };
}

export interface ExportResult {
  success: boolean;
  exportId?: string;
  url?: string;
  message: string;
  metadata?: Record<string, any>;
}

export class ExportService {
  /**
   * Export summary to Notion
   */
  static async exportToNotion(summaryData: any, options: ExportOptions['options'] = {}): Promise<ExportResult> {
    try {
      const notionApiKey = process.env.NOTION_API_KEY;
      
      if (!notionApiKey) {
        return {
          success: false,
          message: 'Notion API key not configured'
        };
      }

      // Prepare Notion page content
      const pageContent = this.formatForNotion(summaryData, options);
      
      // In a real implementation, you would use the Notion API
      // For now, we'll simulate the export
      const mockNotionResponse = {
        id: `notion_page_${Date.now()}`,
        url: `https://notion.so/mock-page-${summaryData.id}`,
        created_time: new Date().toISOString()
      };

      console.log('Notion export simulation:', {
        summaryId: summaryData.id,
        pageTitle: options.pageTitle || summaryData.title,
        databaseId: options.databaseId,
        contentLength: pageContent.length
      });

      return {
        success: true,
        exportId: mockNotionResponse.id,
        url: mockNotionResponse.url,
        message: 'Successfully exported to Notion',
        metadata: {
          notionPageId: mockNotionResponse.id,
          exportedAt: new Date().toISOString(),
          pageTitle: options.pageTitle || summaryData.title
        }
      };

    } catch (error) {
      console.error('Notion export error:', error);
      return {
        success: false,
        message: `Notion export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Export summary to CRM system
   */
  static async exportToCRM(summaryData: any, options: ExportOptions['options'] = {}): Promise<ExportResult> {
    try {
      const crmApiKey = process.env.CRM_API_KEY;
      const crmApiUrl = process.env.CRM_API_URL;
      
      if (!crmApiKey || !crmApiUrl) {
        return {
          success: false,
          message: 'CRM API configuration missing'
        };
      }

      // Prepare CRM data
      const crmData = this.formatForCRM(summaryData, options);
      
      // Simulate CRM API call
      const mockCrmResponse = {
        id: `crm_record_${Date.now()}`,
        recordType: 'activity',
        contactId: options.contactId,
        dealId: options.dealId
      };

      console.log('CRM export simulation:', {
        summaryId: summaryData.id,
        contactId: options.contactId,
        dealId: options.dealId,
        recordType: 'meeting_summary'
      });

      return {
        success: true,
        exportId: mockCrmResponse.id,
        message: 'Successfully exported to CRM',
        metadata: {
          crmRecordId: mockCrmResponse.id,
          recordType: mockCrmResponse.recordType,
          exportedAt: new Date().toISOString(),
          contactId: options.contactId,
          dealId: options.dealId
        }
      };

    } catch (error) {
      console.error('CRM export error:', error);
      return {
        success: false,
        message: `CRM export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Export summary as PDF
   */
  static async exportToPDF(summaryData: any, options: ExportOptions['options'] = {}): Promise<ExportResult> {
    try {
      // In a real implementation, you would use a PDF generation library
      // like puppeteer, jsPDF, or a service like PDFShift
      
      const pdfContent = this.formatForPDF(summaryData, options);
      const mockPdfUrl = `https://storage.example.com/pdfs/summary_${summaryData.id}_${Date.now()}.pdf`;

      console.log('PDF export simulation:', {
        summaryId: summaryData.id,
        template: options.template || 'default',
        includeTranscript: options.includeTranscript || false,
        contentLength: pdfContent.length
      });

      return {
        success: true,
        exportId: `pdf_${Date.now()}`,
        url: mockPdfUrl,
        message: 'Successfully generated PDF',
        metadata: {
          pdfUrl: mockPdfUrl,
          template: options.template || 'default',
          includeTranscript: options.includeTranscript || false,
          exportedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('PDF export error:', error);
      return {
        success: false,
        message: `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Export summary as Markdown
   */
  static async exportToMarkdown(summaryData: any, options: ExportOptions['options'] = {}): Promise<ExportResult> {
    try {
      const markdownContent = this.formatForMarkdown(summaryData, options);
      
      return {
        success: true,
        exportId: `markdown_${Date.now()}`,
        message: 'Successfully generated Markdown',
        metadata: {
          content: markdownContent,
          exportedAt: new Date().toISOString(),
          includeMetadata: options.includeMetadata || false
        }
      };

    } catch (error) {
      console.error('Markdown export error:', error);
      return {
        success: false,
        message: `Markdown export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Format summary data for Notion
   */
  private static formatForNotion(summaryData: any, options: ExportOptions['options'] = {}): string {
    const title = options.pageTitle || summaryData.title || 'AI Summary';
    
    return `# ${title}

**Created:** ${new Date(summaryData.created_at).toLocaleDateString()}
**AI Model:** ${summaryData.ai_model || 'Unknown'}
**Confidence:** ${summaryData.confidence_score ? (summaryData.confidence_score * 100).toFixed(1) + '%' : 'N/A'}

## Summary
${summaryData.summary_text}

## Key Skills Detected
${summaryData.skills_detected?.map((skill: string) => `• ${skill}`).join('\n') || 'None detected'}

## Action Items
${summaryData.actions?.map((action: string) => `- [ ] ${action}`).join('\n') || 'No action items'}

## Red Flags
${summaryData.red_flags?.map((flag: string) => `⚠️ ${flag}`).join('\n') || 'None identified'}

${options.includeMetadata ? `
## Metadata
- **Source:** ${summaryData.source}
- **Team ID:** ${summaryData.team_id || 'N/A'}
- **Channel:** ${summaryData.slack_channel || 'N/A'}
- **Processing Time:** ${summaryData.processing_time_ms || 'N/A'}ms
` : ''}`;
  }

  /**
   * Format summary data for CRM
   */
  private static formatForCRM(summaryData: any, options: ExportOptions['options'] = {}): any {
    return {
      subject: summaryData.title || 'AI Meeting Summary',
      description: summaryData.summary_text,
      activity_type: 'meeting',
      status: 'completed',
      skills_mentioned: summaryData.skills_detected || [],
      action_items: summaryData.actions || [],
      concerns: summaryData.red_flags || [],
      confidence_score: summaryData.confidence_score,
      ai_generated: true,
      source: summaryData.source,
      created_date: summaryData.created_at,
      custom_fields: options.customFields || {}
    };
  }

  /**
   * Format summary data for PDF
   */
  private static formatForPDF(summaryData: any, options: ExportOptions['options'] = {}): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${summaryData.title || 'AI Summary'}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
    .section { margin-bottom: 25px; }
    .skills, .actions, .flags { list-style-type: none; padding: 0; }
    .skills li, .actions li, .flags li { margin: 5px 0; padding: 5px; background: #f5f5f5; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${summaryData.title || 'AI Summary'}</h1>
    <p>Generated on ${new Date(summaryData.created_at).toLocaleDateString()}</p>
  </div>
  
  <div class="section">
    <h2>Summary</h2>
    <p>${summaryData.summary_text}</p>
  </div>
  
  <div class="section">
    <h2>Skills Detected</h2>
    <ul class="skills">
      ${summaryData.skills_detected?.map((skill: string) => `<li>${skill}</li>`).join('') || '<li>None detected</li>'}
    </ul>
  </div>
  
  <div class="section">
    <h2>Action Items</h2>
    <ul class="actions">
      ${summaryData.actions?.map((action: string) => `<li>${action}</li>`).join('') || '<li>No action items</li>'}
    </ul>
  </div>
  
  ${options.includeTranscript ? `
  <div class="section">
    <h2>Original Transcript</h2>
    <pre>${summaryData.raw_transcript}</pre>
  </div>
  ` : ''}
</body>
</html>`;
  }

  /**
   * Format summary data for Markdown
   */
  private static formatForMarkdown(summaryData: any, options: ExportOptions['options'] = {}): string {
    return `# ${summaryData.title || 'AI Summary'}

**Date:** ${new Date(summaryData.created_at).toLocaleDateString()}  
**AI Model:** ${summaryData.ai_model || 'Unknown'}  
**Confidence:** ${summaryData.confidence_score ? (summaryData.confidence_score * 100).toFixed(1) + '%' : 'N/A'}

## Summary

${summaryData.summary_text}

## Skills Detected

${summaryData.skills_detected?.map((skill: string) => `- ${skill}`).join('\n') || '- None detected'}

## Action Items

${summaryData.actions?.map((action: string) => `- [ ] ${action}`).join('\n') || '- No action items'}

## Red Flags

${summaryData.red_flags?.map((flag: string) => `- ⚠️ ${flag}`).join('\n') || '- None identified'}

${options.includeMetadata ? `
---

## Metadata

- **Source:** ${summaryData.source}
- **Team ID:** ${summaryData.team_id || 'N/A'}
- **User ID:** ${summaryData.user_id}
- **Channel:** ${summaryData.slack_channel || 'N/A'}
- **Processing Time:** ${summaryData.processing_time_ms || 'N/A'}ms
- **Tags:** ${summaryData.tags?.join(', ') || 'None'}
` : ''}`;
  }
}
