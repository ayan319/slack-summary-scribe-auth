import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SummaryCard } from '@/components/SummaryCard';
import { ApiSummary } from '@/api/summaries';

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'PPP') {
      return 'January 1st, 2024';
    }
    return '2024-01-01';
  }),
}));

describe('SummaryCard Component', () => {
  const mockSummary: ApiSummary = {
    id: 'test-id-1',
    summary: { text: 'Test summary content' },
    summary_text: 'This is a test summary that should be truncated if too long',
    timestamp: '2024-01-01T10:00:00Z',
    created_at: '2024-01-01T10:00:00Z',
    title: 'Test Summary',
    transcript: 'Test transcript content',
    user_id: 'user-123',
    skills_detected: ['JavaScript', 'React', 'TypeScript'],
    red_flags: ['Security Issue', 'Performance Problem'],
    actions: ['Review Code', 'Update Documentation', 'Schedule Meeting'],
    userRating: 4,
    tags: ['frontend', 'urgent'],
  };

  const mockOnExportPDF = jest.fn();
  const mockOnExportNotion = jest.fn();
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders summary card with basic information', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
      />
    );

    // Check if truncated title is displayed
    expect(screen.getByText(/This is a test summary that should be truncated/)).toBeInTheDocument();
    
    // Check if creation date is displayed
    expect(screen.getByText('Created: January 1st, 2024')).toBeInTheDocument();
  });

  it('displays skills detected section', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
      />
    );

    // Check skills section
    expect(screen.getByText('Skills Detected')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
  });

  it('displays red flags section', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
      />
    );

    // Check red flags section
    expect(screen.getByText('Red Flags')).toBeInTheDocument();
    expect(screen.getByText('Security Issue')).toBeInTheDocument();
    expect(screen.getByText('Performance Problem')).toBeInTheDocument();
  });

  it('displays actions section', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
      />
    );

    // Check actions section
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Review Code')).toBeInTheDocument();
    expect(screen.getByText('Update Documentation')).toBeInTheDocument();
    expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
  });

  it('calls onExportPDF when PDF export button is clicked', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
      />
    );

    // Find and click the PDF export button (Download icon)
    const pdfButton = screen.getByRole('button');
    fireEvent.click(pdfButton);

    expect(mockOnExportPDF).toHaveBeenCalledTimes(1);
  });

  it('shows Notion export button when onExportNotion is provided', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
        onExportNotion={mockOnExportNotion}
      />
    );

    // Should have two buttons now (Notion + PDF)
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('calls onExportNotion when Notion export button is clicked', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
        onExportNotion={mockOnExportNotion}
      />
    );

    // Find buttons and click the first one (Notion - Database icon)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);

    expect(mockOnExportNotion).toHaveBeenCalledTimes(1);
  });

  it('shows checkbox in selection mode', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
        isSelectionMode={true}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    // Check if checkbox is present
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('shows checked checkbox when selected', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
        isSelectionMode={true}
        isSelected={true}
        onSelect={mockOnSelect}
      />
    );

    // Check if checkbox is checked
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onSelect when checkbox is clicked', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
        isSelectionMode={true}
        isSelected={false}
        onSelect={mockOnSelect}
      />
    );

    // Click the checkbox
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
  });

  it('handles empty arrays gracefully', () => {
    const emptySummary: ApiSummary = {
      ...mockSummary,
      skills_detected: [],
      red_flags: [],
      actions: [],
    };

    render(
      <SummaryCard
        summary={emptySummary}
        onExportPDF={mockOnExportPDF}
      />
    );

    // Sections should still be present even with empty arrays
    expect(screen.getByText('Skills Detected')).toBeInTheDocument();
    expect(screen.getByText('Red Flags')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('truncates long summary text correctly', () => {
    const longSummary: ApiSummary = {
      ...mockSummary,
      summary_text: 'This is a very long summary text that should definitely be truncated because it exceeds the 50 character limit that is set in the component',
    };

    render(
      <SummaryCard
        summary={longSummary}
        onExportPDF={mockOnExportPDF}
      />
    );

    // Should show truncated text with ellipsis
    expect(screen.getByText(/This is a very long summary text that should defin.../)).toBeInTheDocument();
  });

  it('does not show checkbox when not in selection mode', () => {
    render(
      <SummaryCard
        summary={mockSummary}
        onExportPDF={mockOnExportPDF}
        isSelectionMode={false}
      />
    );

    // Checkbox should not be present
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
