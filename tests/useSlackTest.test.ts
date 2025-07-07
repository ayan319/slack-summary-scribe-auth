import { renderHook, act } from '@testing-library/react';
import { useSlackTest } from '@/hooks/useSlackTest';

// Mock fetch globally
global.fetch = jest.fn();

describe('useSlackTest Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => useSlackTest());

    expect(result.current.summary).toBeNull();
    expect(result.current.messageId).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.triggerSlackTestEvent).toBe('function');
    expect(typeof result.current.fetchSummary).toBe('function');
  });

  describe('triggerSlackTestEvent', () => {
    it('successfully triggers slack test event', async () => {
      const mockResponse = {
        summary: { text: 'Test summary' },
        message_id: 'msg-123',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useSlackTest());

      await act(async () => {
        await result.current.triggerSlackTestEvent();
      });

      expect(fetch).toHaveBeenCalledWith('/api/test-slack-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      expect(result.current.summary).toEqual(mockResponse.summary);
      expect(result.current.messageId).toBe(mockResponse.message_id);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles API error response', async () => {
      const mockErrorResponse = {
        error: 'Slack API connection failed',
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => mockErrorResponse,
      });

      const { result } = renderHook(() => useSlackTest());

      await act(async () => {
        await result.current.triggerSlackTestEvent();
      });

      expect(result.current.summary).toBeNull();
      expect(result.current.messageId).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Slack API connection failed');
    });

    it('handles network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useSlackTest());

      await act(async () => {
        await result.current.triggerSlackTestEvent();
      });

      expect(result.current.summary).toBeNull();
      expect(result.current.messageId).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Network error');
    });

    it('sets loading state correctly during request', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (fetch as jest.Mock).mockReturnValueOnce(promise);

      const { result } = renderHook(() => useSlackTest());

      // Start the request
      act(() => {
        result.current.triggerSlackTestEvent();
      });

      // Should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ summary: {}, message_id: 'test' }),
        });
        await promise;
      });

      // Should no longer be loading
      expect(result.current.loading).toBe(false);
    });
  });

  describe('fetchSummary', () => {
    it('successfully fetches summary by message ID', async () => {
      const mockSummary = {
        summary: { text: 'Fetched summary', skills: ['React'] },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      });

      const { result } = renderHook(() => useSlackTest());

      await act(async () => {
        await result.current.fetchSummary('msg-123');
      });

      expect(fetch).toHaveBeenCalledWith('/api/summaries/by-message-id/msg-123');
      expect(result.current.summary).toEqual(mockSummary.summary);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('handles fetch summary error', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Summary not found' }),
      });

      const { result } = renderHook(() => useSlackTest());

      await act(async () => {
        await result.current.fetchSummary('invalid-id');
      });

      expect(result.current.summary).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Summary not found');
    });

    it('handles fetch summary network error', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection timeout'));

      const { result } = renderHook(() => useSlackTest());

      await act(async () => {
        await result.current.fetchSummary('msg-123');
      });

      expect(result.current.summary).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Connection timeout');
    });

    it('clears previous error when making new request', async () => {
      const { result } = renderHook(() => useSlackTest());

      // First request fails
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('First error'));
      await act(async () => {
        await result.current.triggerSlackTestEvent();
      });
      expect(result.current.error).toBe('First error');

      // Second request succeeds
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ summary: {}, message_id: 'test' }),
      });
      await act(async () => {
        await result.current.triggerSlackTestEvent();
      });
      expect(result.current.error).toBeNull();
    });
  });
});
