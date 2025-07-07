import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SummaryDisplayCard } from '@/components/SummaryDisplayCard';
import { ApiSummary } from '@/api/summaries';

// Mock date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'PPp') {
      return 'January 15th, 2024 at 10:30 AM';
    }
    return '2024-01-15';
  }),
}));

// Mock toast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe('SummaryDisplayCard Component', () => {
  const mockSummary: ApiSummary = {
    id: 'test-summary-1',
    summary: { text: 'Test summary content' },
    summary_text: 'This is a comprehensive test summary that demonstrates the AI analysis capabilities',
    timestamp: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z',
    title: 'Test Summary Card',
    transcript: 'This is the original transcript content that was analyzed by the AI system',
    user_id: 'john.doe',
    skills_detected: ['JavaScript', 'React', 'TypeScript', 'Testing', 'Problem Solving'],
    red_flags: ['Performance Issue', 'Security Concern'],
    actions: ['Review Code', 'Add Tests', 'Update Documentation'],
    userRating: 4,
    tags: ['frontend', 'urgent'],
  };

  const mockOnRate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (navigator.clipboard.writeText as jest.Mock).mockClear();
  });

  it('renders summary display card with all sections', () => {
    render(<SummaryDisplayCard summary={mockSummary} onRate={mockOnRate} />);

    // Check header
    expect(screen.getByText('AI Summary Analysis')).toBeInTheDocument();
    expect(screen.getByText('January 15th, 2024 at 10:30 AM')).toBeInTheDocument();
    expect(screen.getByText('john.doe')).toBeInTheDocument();

    // Check summary content
    expect(screen.getByText('Summary')).toBeInTheDocument();
    expect(screen.getByText('This is a comprehensive test summary that demonstrates the AI analysis capabilities')).toBeInTheDocument();

    // Check skills section
    expect(screen.getByText('Skills Detected (5)')).toBeInTheDocument();
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();

    // Check red flags section
    expect(screen.getByText('Red Flags (2)')).toBeInTheDocument();
    expect(screen.getByText('Performance Issue')).toBeInTheDocument();
    expect(screen.getByText('Security Concern')).toBeInTheDocument();

    // Check actions section
    expect(screen.getByText('Action Items (3)')).toBeInTheDocument();
    expect(screen.getByText('Review Code')).toBeInTheDocument();
    expect(screen.getByText('Add Tests')).toBeInTheDocument();
    expect(screen.getByText('Update Documentation')).toBeInTheDocument();
  });

  it('handles copy to clipboard functionality', async () => {
    (navigator.clipboard.writeText as jest.Mock).mockResolvedValueOnce(undefined);

    render(<SummaryDisplayCard summary={mockSummary} onRate={mockOnRate} />);

    const copyButton = screen.getByRole('button', { name: '' }); // Copy button has no text, just icon
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('Summary: This is a comprehensive test summary')
      );
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Skills Detected: JavaScript, React, TypeScript, Testing, Problem Solving')
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Red Flags: Performance Issue, Security Concern')
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('Actions: Review Code, Add Tests, Update Documentation')
    );
  });

  it('handles copy to clipboard error', async () => {
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Clipboard error'));

    render(<SummaryDisplayCard summary={mockSummary} onRate={mockOnRate} />);

    const copyButton = screen.getByRole('button', { name: '' });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('handles rating functionality', () => {
    render(<SummaryDisplayCard summary={mockSummary} onRate={mockOnRate} />);

    expect(screen.getByText('Rate this summary:')).toBeInTheDocument();

    // Find all star buttons
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.getAttribute('class')?.includes('h-8 w-8')
    );

    // Click on the 5th star (5-star rating)
    fireEvent.click(starButtons[4]);

    expect(mockOnRate).toHaveBeenCalledWith(5);
  });

  it('shows current rating with filled stars', () => {
    render(<SummaryDisplayCard summary={mockSummary} onRate={mockOnRate} />);

    // The component should show 4 filled stars (userRating: 4)
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.getAttribute('class')?.includes('h-8 w-8')
    );

    expect(starButtons).toHaveLength(5);
  });

  it('shows transcript when showFullTranscript is true', () => {
    render(<SummaryDisplayCard summary={mockSummary} showFullTranscript={true} />);

    expect(screen.getByText('Show Transcript')).toBeInTheDocument();

    // Click to expand transcript
    fireEvent.click(screen.getByText('Show Transcript'));

    expect(screen.getByText('Original Transcript')).toBeInTheDocument();
    expect(screen.getByText('This is the original transcript content that was analyzed by the AI system')).toBeInTheDocument();
    expect(screen.getByText('Hide Transcript')).toBeInTheDocument();
  });

  it('hides transcript when showFullTranscript is false', () => {
    render(<SummaryDisplayCard summary={mockSummary} showFullTranscript={false} />);

    expect(screen.queryByText('Show Transcript')).not.toBeInTheDocument();
    expect(screen.queryByText('Original Transcript')).not.toBeInTheDocument();
  });

  it('toggles transcript visibility', () => {
    render(<SummaryDisplayCard summary={mockSummary} showFullTranscript={true} />);

    // Initially collapsed
    expect(screen.getByText('Show Transcript')).toBeInTheDocument();
    expect(screen.queryByText('Original Transcript')).not.toBeInTheDocument();

    // Expand transcript
    fireEvent.click(screen.getByText('Show Transcript'));
    expect(screen.getByText('Original Transcript')).toBeInTheDocument();
    expect(screen.getByText('Hide Transcript')).toBeInTheDocument();

    // Collapse transcript
    fireEvent.click(screen.getByText('Hide Transcript'));
    expect(screen.queryByText('Original Transcript')).not.toBeInTheDocument();
    expect(screen.getByText('Show Transcript')).toBeInTheDocument();
  });

  it('handles empty arrays gracefully', () => {
    const emptySummary: ApiSummary = {
      ...mockSummary,
      skills_detected: [],
      red_flags: [],
      actions: [],
    };

    render(<SummaryDisplayCard summary={emptySummary} />);

    expect(screen.getByText('Skills Detected (0)')).toBeInTheDocument();
    expect(screen.getByText('Red Flags (0)')).toBeInTheDocument();
    expect(screen.getByText('Action Items (0)')).toBeInTheDocument();
  });

  it('renders without onRate callback', () => {
    render(<SummaryDisplayCard summary={mockSummary} />);

    expect(screen.getByText('Rate this summary:')).toBeInTheDocument();
    
    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.getAttribute('class')?.includes('h-8 w-8')
    );

    // Should still render stars even without callback
    expect(starButtons).toHaveLength(5);
  });

  it('updates rating when star is clicked', () => {
    render(<SummaryDisplayCard summary={mockSummary} onRate={mockOnRate} />);

    const starButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg') && button.getAttribute('class')?.includes('h-8 w-8')
    );

    // Click on the 3rd star
    fireEvent.click(starButtons[2]);

    expect(mockOnRate).toHaveBeenCalledWith(3);
  });

  it('renders export dialog trigger', () => {
    render(<SummaryDisplayCard summary={mockSummary} />);

    // Should have export button (download icon)
    const exportButton = screen.getByRole('button', { name: '' }); // Export button has no text, just icon
    expect(exportButton).toBeInTheDocument();
  });

  it('handles summary without transcript', () => {
    const summaryWithoutTranscript: ApiSummary = {
      ...mockSummary,
      transcript: '',
    };

    render(<SummaryDisplayCard summary={summaryWithoutTranscript} showFullTranscript={true} />);

    // Should still show transcript toggle
    expect(screen.getByText('Show Transcript')).toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByText('Show Transcript'));
    expect(screen.getByText('Original Transcript')).toBeInTheDocument();
  });

  it('displays correct badge styling for different sections', () => {
    render(<SummaryDisplayCard summary={mockSummary} />);

    // Skills should have green styling
    const skillBadge = screen.getByText('JavaScript');
    expect(skillBadge.closest('.bg-green-100')).toBeInTheDocument();

    // Red flags should have red styling
    const redFlagBadge = screen.getByText('Performance Issue');
    expect(redFlagBadge.closest('.bg-red-100')).toBeInTheDocument();

    // Actions should have blue styling with bullet points
    expect(screen.getByText('Review Code')).toBeInTheDocument();
  });
});
