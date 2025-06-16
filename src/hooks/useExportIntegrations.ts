
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { SummaryData } from '@/types/summary';

export interface ExportOptions {
  slackChannel?: string;
  notionDatabaseId?: string;
  crmType?: 'salesforce' | 'hubspot' | 'pipedrive';
}

export function useExportIntegrations() {
  const [isExporting, setIsExporting] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const exportToSlack = async (summary: SummaryData, transcript: string, options?: ExportOptions) => {
    setIsExporting(prev => ({ ...prev, slack: true }));
    
    try {
      const response = await fetch('/functions/v1/export-to-slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          transcript,
          channel: options?.slackChannel || 'general',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export to Slack');
      }

      toast({
        title: "Export Successful",
        description: "Summary exported to Slack successfully!",
      });
    } catch (error) {
      console.error('Slack export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export to Slack. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(prev => ({ ...prev, slack: false }));
    }
  };

  const exportToNotion = async (summary: SummaryData, transcript: string, options?: ExportOptions) => {
    setIsExporting(prev => ({ ...prev, notion: true }));
    
    try {
      const response = await fetch('/functions/v1/export-to-notion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          transcript,
          databaseId: options?.notionDatabaseId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export to Notion');
      }

      toast({
        title: "Export Successful",
        description: "Summary exported to Notion successfully!",
      });
    } catch (error) {
      console.error('Notion export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export to Notion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(prev => ({ ...prev, notion: false }));
    }
  };

  const exportToCRM = async (summary: SummaryData, transcript: string, options?: ExportOptions) => {
    setIsExporting(prev => ({ ...prev, crm: true }));
    
    try {
      const response = await fetch('/functions/v1/export-to-crm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          transcript,
          crmType: options?.crmType || 'salesforce',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export to CRM');
      }

      toast({
        title: "Export Successful",
        description: "Summary exported to CRM successfully!",
      });
    } catch (error) {
      console.error('CRM export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export to CRM. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(prev => ({ ...prev, crm: false }));
    }
  };

  return {
    exportToSlack,
    exportToNotion,
    exportToCRM,
    isExporting,
  };
}
