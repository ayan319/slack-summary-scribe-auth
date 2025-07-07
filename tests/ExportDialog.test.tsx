import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExportDialog } from '@/components/ExportDialog';
import { ApiSummary } from '@/api/summaries';

// Mock fetch globally
global.fetch = jest.fn();

// Mock toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('ExportDialog Component', () => {
  const mockSummary: ApiSummary = {
    id: 'test-summary-1',
    summary: { text: 'Test summary content' },
    summary_text: 'This is a test summary for export functionality',
    timestamp: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z',
    title: 'Test Export Summary',
    transcript: 'Test transcript content for export',
    user_id: 'test-user',
    skills_detected: ['JavaScript', 'React', 'Testing'],
    red_flags: ['Performance Issue'],
    actions: ['Review Code', 'Add Tests'],
    userRating: 4,
    tags: ['export', 'test'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders export dialog with summary preview', () => {
    render(<ExportDialog summary={mockSummary} />);

    // Click trigger to open dialog
    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByText('Export Summary')).toBeInTheDocument();
    expect(screen.getByText('This is a test summary for export functionality')).toBeInTheDocument();
    expect(screen.getByText('3 skills')).toBeInTheDocument();
    expect(screen.getByText('1 red flags')).toBeInTheDocument();
    expect(screen.getByText('2 actions')).toBeInTheDocument();
  });

  it('shows all export tabs', () => {
    render(<ExportDialog summary={mockSummary} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    expect(screen.getByRole('tab', { name: 'PDF' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Notion' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'CRM' })).toBeInTheDocument();
  });

  it('handles PDF export successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        filename: 'test-export.pdf',
        metadata: { fileSize: '25KB' },
      }),
    });

    render(<ExportDialog summary={mockSummary} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    // Click PDF export button
    const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryId: 'test-summary-1',
          format: 'detailed',
          includeTranscript: false,
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText('PDF Generated Successfully')).toBeInTheDocument();
      expect(screen.getByText(/test-export.pdf \(25KB\)/)).toBeInTheDocument();
    });
  });

  it('handles PDF export with custom options', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        filename: 'test-export-summary.pdf',
        metadata: { fileSize: '15KB' },
      }),
    });

    render(<ExportDialog summary={mockSummary} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    // Change format to summary only
    const formatSelect = screen.getByRole('combobox');
    fireEvent.click(formatSelect);
    fireEvent.click(screen.getByText('Summary Only'));

    // Enable transcript
    const transcriptCheckbox = screen.getByRole('checkbox', { name: /include original transcript/i });
    fireEvent.click(transcriptCheckbox);

    // Click PDF export button
    const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryId: 'test-summary-1',
          format: 'summary',
          includeTranscript: true,
        }),
      });
    });
  });

  it('handles PDF export error', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'PDF generation failed',
      }),
    });

    render(<ExportDialog summary={mockSummary} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(screen.getByText('PDF generation failed')).toBeInTheDocument();
    });
  });

  it('handles Notion export successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        notionPageUrl: 'https://notion.so/test-page-123',
      }),
    });

    render(<ExportDialog summary={mockSummary} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    // Switch to Notion tab
    fireEvent.click(screen.getByRole('tab', { name: 'Notion' }));

    // Fill in custom page title
    const titleInput = screen.getByDisplayValue('Test Export Summary');
    fireEvent.change(titleInput, { target: { value: 'Custom Notion Page' } });

    // Click Notion export button
    const notionButton = screen.getByRole('button', { name: /create notion page/i });
    fireEvent.click(notionButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/export/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryId: 'test-summary-1',
          databaseId: '',
          pageTitle: 'Custom Notion Page',
          includeTranscript: true,
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Notion Page Created')).toBeInTheDocument();
      expect(screen.getByText('View in Notion')).toBeInTheDocument();
    });
  });

  it('handles CRM export successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        crmType: 'salesforce',
        activityId: 'sf_123456',
        activityUrl: 'https://salesforce.com/activity/sf_123456',
      }),
    });

    render(<ExportDialog summary={mockSummary} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    // Switch to CRM tab
    fireEvent.click(screen.getByRole('tab', { name: 'CRM' }));

    // Select CRM type
    const crmSelect = screen.getAllByRole('combobox')[0];
    fireEvent.click(crmSelect);
    fireEvent.click(screen.getByText('Salesforce'));

    // Fill in contact ID
    const contactInput = screen.getByPlaceholderText('Enter contact ID');
    fireEvent.change(contactInput, { target: { value: 'contact-123' } });

    // Click CRM export button
    const crmButton = screen.getByRole('button', { name: /create crm activity/i });
    fireEvent.click(crmButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/export/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summaryId: 'test-summary-1',
          crmType: 'salesforce',
          contactId: 'contact-123',
          dealId: '',
          activityType: 'note',
          createActivity: true,
        }),
      });
    });

    await waitFor(() => {
      expect(screen.getByText('CRM Activity Created')).toBeInTheDocument();
      expect(screen.getByText('Activity ID: sf_123456')).toBeInTheDocument();
      expect(screen.getByText('View in CRM')).toBeInTheDocument();
    });
  });

  it('shows loading states during export', async () => {
    // Mock a delayed response
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, filename: 'test.pdf' }),
      }), 100))
    );

    render(<ExportDialog summary={mockSummary} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
    fireEvent.click(pdfButton);

    // Should show loading state
    expect(screen.getByText('Generating PDF...')).toBeInTheDocument();
    expect(pdfButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('PDF Generated')).toBeInTheDocument();
    });
  });

  it('uses custom trigger when provided', () => {
    const customTrigger = <button>Custom Export Button</button>;
    
    render(<ExportDialog summary={mockSummary} trigger={customTrigger} />);

    expect(screen.getByText('Custom Export Button')).toBeInTheDocument();
    expect(screen.queryByText('Export')).not.toBeInTheDocument();
  });

  it('handles network errors gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<ExportDialog summary={mockSummary} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('resets error states when switching between tabs', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'PDF error' }),
    });

    render(<ExportDialog summary={mockSummary} />);

    fireEvent.click(screen.getByRole('button', { name: /export/i }));

    // Trigger PDF error
    const pdfButton = screen.getByRole('button', { name: /generate pdf/i });
    fireEvent.click(pdfButton);

    await waitFor(() => {
      expect(screen.getByText('PDF error')).toBeInTheDocument();
    });

    // Switch to Notion tab - error should not persist
    fireEvent.click(screen.getByRole('tab', { name: 'Notion' }));
    expect(screen.queryByText('PDF error')).not.toBeInTheDocument();
  });
});
