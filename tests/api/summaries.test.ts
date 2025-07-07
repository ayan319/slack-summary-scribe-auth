import { createMocks } from 'node-mocks-http';
import handler from '../../pages/api/summaries/index';
import { SummaryDatabase } from '../../src/lib/database';

// Mock the database
jest.mock('@/src/lib/database');

const mockSummaryDatabase = SummaryDatabase as jest.Mocked<typeof SummaryDatabase>;

describe('/api/summaries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 405 for non-GET requests', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Use /api/summarize endpoint to create new summaries'
    });
  });

  it('should fetch summaries successfully', async () => {
    const mockSummaries = [
      {
        id: 'summary-1',
        user_id: 'user-1',
        team_id: 'team-1',
        title: 'Test Summary 1',
        summary_text: 'Summary text 1',
        summary: {},
        skills_detected: ['JavaScript'],
        red_flags: [],
        actions: ['Action 1'],
        tags: ['test'],
        source: 'api',
        raw_transcript: 'Transcript 1',
        slack_channel: null,
        slack_message_ts: null,
        confidence_score: 0.9,
        ai_model: 'gpt-4o-mini',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'summary-2',
        user_id: 'user-1',
        team_id: 'team-1',
        title: 'Test Summary 2',
        summary_text: 'Summary text 2',
        summary: {},
        skills_detected: ['Python'],
        red_flags: ['Red flag 1'],
        actions: [],
        tags: ['test'],
        source: 'slack',
        raw_transcript: 'Transcript 2',
        slack_channel: 'C123456',
        slack_message_ts: '1234567890.123',
        confidence_score: 0.8,
        ai_model: 'gpt-4o-mini',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }
    ];

    mockSummaryDatabase.getSummaries.mockResolvedValue({
      data: mockSummaries,
      error: null,
      count: 2
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        userId: 'user-1',
        limit: '10'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.success).toBe(true);
    expect(responseData.data.summaries).toHaveLength(2);
    expect(responseData.data.pagination.total).toBe(2);
    expect(responseData.data.pagination.limit).toBe(10);
    expect(responseData.data.pagination.offset).toBe(0);
    expect(responseData.data.pagination.hasMore).toBe(false);
  });

  it('should handle query parameters correctly', async () => {
    mockSummaryDatabase.getSummaries.mockResolvedValue({
      data: [],
      error: null,
      count: 0
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        userId: 'user-1',
        teamId: 'team-1',
        source: 'slack',
        search: 'test query',
        tags: ['tag1', 'tag2'],
        dateFrom: '2024-01-01T00:00:00Z',
        dateTo: '2024-01-31T23:59:59Z',
        limit: '25',
        offset: '50'
      }
    });

    await handler(req, res);

    expect(mockSummaryDatabase.getSummaries).toHaveBeenCalledWith({
      userId: 'user-1',
      teamId: 'team-1',
      source: 'slack',
      search: 'test query',
      tags: ['tag1', 'tag2'],
      dateFrom: '2024-01-01T00:00:00Z',
      dateTo: '2024-01-31T23:59:59Z',
      limit: 25,
      offset: 50
    });
  });

  it('should validate date formats', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        dateFrom: 'invalid-date'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Invalid dateFrom format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
    });
  });

  it('should limit maximum items per request', async () => {
    mockSummaryDatabase.getSummaries.mockResolvedValue({
      data: [],
      error: null,
      count: 0
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        limit: '200' // Should be capped at 100
      }
    });

    await handler(req, res);

    expect(mockSummaryDatabase.getSummaries).toHaveBeenCalledWith({
      limit: 100, // Should be capped
      offset: 0
    });
  });

  it('should include stats when requested', async () => {
    const mockStats = {
      total: 10,
      bySource: { slack: 6, api: 4 },
      avgConfidence: 0.85,
      topSkills: { JavaScript: 5, Python: 3 },
      recentActivity: 3
    };

    mockSummaryDatabase.getSummaries.mockResolvedValue({
      data: [],
      error: null,
      count: 0
    });

    mockSummaryDatabase.getSummaryStats.mockResolvedValue({
      data: mockStats,
      error: null
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        includeStats: 'true',
        userId: 'user-1'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.data.stats).toEqual(mockStats);
    expect(mockSummaryDatabase.getSummaryStats).toHaveBeenCalledWith('user-1', undefined);
  });

  it('should handle database errors', async () => {
    mockSummaryDatabase.getSummaries.mockResolvedValue({
      data: null,
      error: 'Database connection failed'
    });

    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData())).toEqual({
      success: false,
      error: 'Database connection failed'
    });
  });

  it('should handle stats fetch errors gracefully', async () => {
    mockSummaryDatabase.getSummaries.mockResolvedValue({
      data: [],
      error: null,
      count: 0
    });

    mockSummaryDatabase.getSummaryStats.mockResolvedValue({
      data: null,
      error: 'Stats unavailable'
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        includeStats: 'true'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.data.stats).toBeUndefined();
  });

  it('should handle pagination correctly', async () => {
    mockSummaryDatabase.getSummaries.mockResolvedValue({
      data: new Array(50).fill(null).map((_, i) => ({
        id: `summary-${i}`,
        user_id: 'user-1',
        team_id: null,
        title: `Summary ${i}`,
        summary_text: `Text ${i}`,
        summary: {},
        skills_detected: [],
        red_flags: [],
        actions: [],
        tags: [],
        source: 'api',
        raw_transcript: `Transcript ${i}`,
        slack_channel: null,
        slack_message_ts: null,
        confidence_score: 0.8,
        ai_model: 'mock',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      })),
      error: null,
      count: 150 // Total count is 150
    });

    const { req, res } = createMocks({
      method: 'GET',
      query: {
        limit: '50',
        offset: '0'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData.data.pagination.total).toBe(150);
    expect(responseData.data.pagination.limit).toBe(50);
    expect(responseData.data.pagination.offset).toBe(0);
    expect(responseData.data.pagination.hasMore).toBe(true); // 150 > 0 + 50
  });
});
