import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/export/notion';

// Mock environment variables
const originalEnv = process.env;

describe('/api/export/notion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should handle POST request successfully with configured token', async () => {
    process.env.NOTION_TOKEN = 'mock-notion-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-123',
        databaseId: 'test-database-456',
        pageTitle: 'Custom Page Title',
        includeTranscript: true,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message).toBe('Successfully exported to Notion');
    expect(data.notionPageId).toMatch(/^page-\d+$/);
    expect(data.notionPageUrl).toContain('notion.so/mock-page-');
    expect(data.metadata.summaryId).toBe('test-summary-123');
    expect(data.metadata.databaseId).toBe('test-database-456');
    expect(data.metadata.pageTitle).toBe('Custom Page Title');
    expect(data.metadata.includeTranscript).toBe(true);
  });

  it('should return 400 when Notion token is not configured', async () => {
    process.env.NOTION_TOKEN = 'your_notion_token_here';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-123',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Notion integration not configured');
    expect(data.message).toBe('Please configure your Notion integration token in settings');
    expect(data.configRequired).toBe(true);
  });

  it('should return 400 for missing summaryId', async () => {
    process.env.NOTION_TOKEN = 'mock-notion-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        databaseId: 'test-database',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Summary ID is required');
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

  it('should handle default values for optional parameters', async () => {
    process.env.NOTION_TOKEN = 'mock-notion-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-defaults',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.metadata.databaseId).toBe('default-database');
    expect(data.metadata.pageTitle).toBe('Technical Interview - Senior Developer');
    expect(data.metadata.includeTranscript).toBe(false);
  });

  it('should include transcript in page structure when requested', async () => {
    process.env.NOTION_TOKEN = 'mock-notion-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-transcript',
        includeTranscript: true,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.metadata.includeTranscript).toBe(true);
  });

  it('should not include transcript when not requested', async () => {
    process.env.NOTION_TOKEN = 'mock-notion-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-no-transcript',
        includeTranscript: false,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.metadata.includeTranscript).toBe(false);
  });

  it('should include metadata about exported content', async () => {
    process.env.NOTION_TOKEN = 'mock-notion-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-metadata',
        pageTitle: 'Test Page',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.metadata.skillsCount).toBe(5);
    expect(data.metadata.redFlagsCount).toBe(2);
    expect(data.metadata.actionsCount).toBe(3);
    expect(data.exportedAt).toBeDefined();
    expect(new Date(data.exportedAt)).toBeInstanceOf(Date);
  });

  it('should handle custom page titles', async () => {
    process.env.NOTION_TOKEN = 'mock-notion-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-custom-title',
        pageTitle: 'My Custom Interview Summary',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.metadata.pageTitle).toBe('My Custom Interview Summary');
  });

  it('should handle custom database IDs', async () => {
    process.env.NOTION_TOKEN = 'mock-notion-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-custom-db',
        databaseId: 'custom-database-123',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.metadata.databaseId).toBe('custom-database-123');
  });

  it('should generate unique page IDs for different requests', async () => {
    process.env.NOTION_TOKEN = 'mock-notion-token';

    const { req: req1, res: res1 } = createMocks({
      method: 'POST',
      body: { summaryId: 'test-summary-unique1' },
    });

    const { req: req2, res: res2 } = createMocks({
      method: 'POST',
      body: { summaryId: 'test-summary-unique2' },
    });

    await handler(req1, res1);
    await handler(req2, res2);

    const data1 = JSON.parse(res1._getData());
    const data2 = JSON.parse(res2._getData());

    expect(data1.notionPageId).not.toBe(data2.notionPageId);
    expect(data1.notionPageUrl).not.toBe(data2.notionPageUrl);
  });

  it('should handle missing NOTION_TOKEN environment variable', async () => {
    delete process.env.NOTION_TOKEN;

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-no-token',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Notion integration not configured');
    expect(data.configRequired).toBe(true);
  });
});
