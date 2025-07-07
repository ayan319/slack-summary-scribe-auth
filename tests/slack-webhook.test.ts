import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/slack/events';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        data: { id: 'mock-id' },
        error: null,
      })),
    })),
  })),
}));

// Mock fetch for DeepSeek API
global.fetch = jest.fn();

const originalEnv = process.env;

describe('/api/slack/events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should handle URL verification challenge', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'url_verification',
        challenge: 'test-challenge-123',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.challenge).toBe('test-challenge-123');
  });

  it('should process message events with AI analysis', async () => {
    process.env.DEEPSEEK_API_KEY = 'mock-api-key';
    
    // Mock successful DeepSeek API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              summary: 'Test AI summary',
              skills: ['JavaScript', 'React'],
              redFlags: ['Performance issue'],
              actions: ['Review code', 'Optimize performance'],
            }),
          },
        }],
      }),
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'event_callback',
        event: {
          type: 'message',
          user: 'U123456',
          text: 'We need to optimize our React components for better performance',
          channel: 'C789012',
          ts: '1640995200.123456',
          team: 'T345678',
        },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message_id).toBe('U123456_C789012_1640995200.123456');
    expect(data.summary.summary).toBe('Test AI summary');
    expect(data.summary.skills).toEqual(['JavaScript', 'React']);
    expect(data.summary.redFlags).toEqual(['Performance issue']);
    expect(data.summary.actions).toEqual(['Review code', 'Optimize performance']);
  });

  it('should use mock data when DeepSeek API key is not configured', async () => {
    process.env.DEEPSEEK_API_KEY = 'your_deepseek_api_key_here';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'event_callback',
        event: {
          type: 'message',
          user: 'U123456',
          text: 'Test message without API key',
          channel: 'C789012',
          ts: '1640995200.123456',
          team: 'T345678',
        },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.summary.summary).toContain('Mock AI analysis');
    expect(data.summary.skills).toContain('Communication');
    expect(data.summary.redFlags).toContain('Mock analysis - API key not configured');
    expect(data.summary.actions).toContain('Configure DeepSeek API key');
  });

  it('should handle DeepSeek API errors gracefully', async () => {
    process.env.DEEPSEEK_API_KEY = 'mock-api-key';
    
    // Mock API error
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'event_callback',
        event: {
          type: 'message',
          user: 'U123456',
          text: 'Test message with API error',
          channel: 'C789012',
          ts: '1640995200.123456',
          team: 'T345678',
        },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.summary.summary).toContain('Error occurred during AI analysis');
    expect(data.summary.skills).toContain('Analysis failed');
    expect(data.summary.redFlags).toContain('AI processing error');
  });

  it('should handle network errors during API call', async () => {
    process.env.DEEPSEEK_API_KEY = 'mock-api-key';
    
    // Mock network error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'event_callback',
        event: {
          type: 'message',
          user: 'U123456',
          text: 'Test message with network error',
          channel: 'C789012',
          ts: '1640995200.123456',
          team: 'T345678',
        },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.summary.summary).toContain('Error occurred during AI analysis');
  });

  it('should ignore bot messages', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'event_callback',
        event: {
          type: 'message',
          user: 'U123456',
          text: '<@U987654> this is a bot mention',
          channel: 'C789012',
          ts: '1640995200.123456',
          team: 'T345678',
        },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    // Should not process messages starting with mentions
  });

  it('should ignore non-message events', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'event_callback',
        event: {
          type: 'user_typing',
          user: 'U123456',
          channel: 'C789012',
        },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
  });

  it('should return 405 for non-POST methods', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Method not allowed');
  });

  it('should handle malformed JSON in DeepSeek response', async () => {
    process.env.DEEPSEEK_API_KEY = 'mock-api-key';
    
    // Mock malformed JSON response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: 'Invalid JSON response',
          },
        }],
      }),
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'event_callback',
        event: {
          type: 'message',
          user: 'U123456',
          text: 'Test message with malformed response',
          channel: 'C789012',
          ts: '1640995200.123456',
          team: 'T345678',
        },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.summary.summary).toContain('Error occurred during AI analysis');
  });

  it('should generate unique message IDs', async () => {
    process.env.DEEPSEEK_API_KEY = 'your_deepseek_api_key_here';

    const { req: req1, res: res1 } = createMocks({
      method: 'POST',
      body: {
        type: 'event_callback',
        event: {
          type: 'message',
          user: 'U123456',
          text: 'First message',
          channel: 'C789012',
          ts: '1640995200.123456',
          team: 'T345678',
        },
      },
    });

    const { req: req2, res: res2 } = createMocks({
      method: 'POST',
      body: {
        type: 'event_callback',
        event: {
          type: 'message',
          user: 'U654321',
          text: 'Second message',
          channel: 'C210987',
          ts: '1640995300.654321',
          team: 'T345678',
        },
      },
    });

    await handler(req1, res1);
    await handler(req2, res2);

    const data1 = JSON.parse(res1._getData());
    const data2 = JSON.parse(res2._getData());

    expect(data1.message_id).toBe('U123456_C789012_1640995200.123456');
    expect(data2.message_id).toBe('U654321_C210987_1640995300.654321');
    expect(data1.message_id).not.toBe(data2.message_id);
  });

  it('should handle empty message text', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        type: 'event_callback',
        event: {
          type: 'message',
          user: 'U123456',
          text: '',
          channel: 'C789012',
          ts: '1640995200.123456',
          team: 'T345678',
        },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    // Should not process empty messages
  });
});
