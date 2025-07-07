import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/summarize';
import { AISummarizer } from '../../src/lib/ai-summarizer';
import { SummaryDatabase } from '../../src/lib/database';

// Mock the dependencies
jest.mock('@/lib/ai-summarizer');
jest.mock('@/lib/database');

const mockAISummarizer = AISummarizer as jest.Mocked<typeof AISummarizer>;
const mockSummaryDatabase = SummaryDatabase as jest.Mocked<typeof SummaryDatabase>;

describe('/api/summarize', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  });

  it('should return 400 for missing transcriptText', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        userId: 'test-user'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'transcriptText is required and must be a string'
    });
  });

  it('should return 400 for missing userId', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        transcriptText: 'Test transcript'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'userId is required and must be a string'
    });
  });

  it('should return 400 for empty transcriptText', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        transcriptText: '   ',
        userId: 'test-user'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'transcriptText cannot be empty'
    });
  });

  it('should return 400 for transcriptText that is too long', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        transcriptText: 'a'.repeat(50001),
        userId: 'test-user'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'transcriptText too long (max 50,000 characters)'
    });
  });

  it('should successfully create a summary', async () => {
    const mockAIResult = {
      title: 'Test Summary',
      summary: 'This is a test summary',
      bullets: ['Point 1', 'Point 2'],
      actionItems: ['Action 1'],
      speakerBreakdown: [],
      skills: ['JavaScript'],
      redFlags: [],
      sentiment: 'positive' as const,
      urgency: 'medium' as const,
      confidence: 0.9,
      processingTimeMs: 1000,
      model: 'gpt-4o-mini'
    };

    const mockDBResult = {
      id: 'test-id',
      user_id: 'test-user',
      team_id: null,
      title: 'Test Summary',
      summary_text: 'This is a test summary',
      summary: {},
      skills_detected: ['JavaScript'],
      red_flags: [],
      actions: ['Action 1'],
      tags: [],
      source: 'api',
      raw_transcript: 'Test transcript',
      slack_channel: null,
      slack_message_ts: null,
      confidence_score: 0.9,
      ai_model: 'gpt-4o-mini',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    mockAISummarizer.generateSummary.mockResolvedValue({
      data: mockAIResult,
      error: null
    });

    mockSummaryDatabase.createSummary.mockResolvedValue({
      data: mockDBResult,
      error: null
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        transcriptText: 'Test transcript',
        userId: 'test-user',
        tags: ['test']
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(true);
    expect(responseData.data.id).toBe('test-id');
    expect(responseData.data.title).toBe('Test Summary');
  });

  it('should handle AI summarization errors', async () => {
    mockAISummarizer.generateSummary.mockResolvedValue({
      data: null,
      error: 'AI service unavailable'
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        transcriptText: 'Test transcript',
        userId: 'test-user'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'AI service unavailable'
    });
  });

  it('should handle database storage errors', async () => {
    const mockAIResult = {
      title: 'Test Summary',
      summary: 'This is a test summary',
      bullets: ['Point 1'],
      actionItems: [],
      speakerBreakdown: [],
      skills: [],
      redFlags: [],
      sentiment: 'neutral' as const,
      urgency: 'low' as const,
      confidence: 0.8,
      processingTimeMs: 500,
      model: 'mock'
    };

    mockAISummarizer.generateSummary.mockResolvedValue({
      data: mockAIResult,
      error: null
    });

    mockSummaryDatabase.createSummary.mockResolvedValue({
      data: null,
      error: 'Database connection failed'
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        transcriptText: 'Test transcript',
        userId: 'test-user'
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Database connection failed'
    });
  });

  it('should handle context and metadata properly', async () => {
    const mockAIResult = {
      title: 'Slack Summary',
      summary: 'Slack conversation summary',
      bullets: [],
      actionItems: [],
      speakerBreakdown: [],
      skills: [],
      redFlags: [],
      sentiment: 'neutral' as const,
      urgency: 'low' as const,
      confidence: 0.7,
      processingTimeMs: 800,
      model: 'gpt-4o-mini'
    };

    const mockDBResult = {
      id: 'slack-summary-id',
      user_id: 'slack-user',
      team_id: 'team-123',
      title: 'Slack Summary',
      summary_text: 'Slack conversation summary',
      summary: {},
      skills_detected: [],
      red_flags: [],
      actions: [],
      tags: ['slack'],
      source: 'slack',
      raw_transcript: 'Slack transcript',
      slack_channel: 'C123456',
      slack_message_ts: '1234567890.123',
      confidence_score: 0.7,
      ai_model: 'gpt-4o-mini',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    mockAISummarizer.generateSummary.mockResolvedValue({
      data: mockAIResult,
      error: null
    });

    mockSummaryDatabase.createSummary.mockResolvedValue({
      data: mockDBResult,
      error: null
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        transcriptText: 'Slack transcript',
        userId: 'slack-user',
        teamId: 'team-123',
        tags: ['slack'],
        context: {
          source: 'slack',
          channel: 'C123456',
          slackMessageTs: '1234567890.123',
          participants: ['user1', 'user2']
        },
        metadata: {
          customField: 'value'
        }
      },
      headers: {
        'user-agent': 'test-agent',
        'x-forwarded-for': '127.0.0.1'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(mockSummaryDatabase.createSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'slack-user',
        team_id: 'team-123',
        source: 'slack',
        slack_channel: 'C123456',
        slack_message_ts: '1234567890.123',
        metadata: expect.objectContaining({
          customField: 'value',
          originalRequest: expect.objectContaining({
            userAgent: 'test-agent',
            ip: '127.0.0.1'
          })
        })
      })
    );
  });
});
