import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/export/pdf';

describe('/api/export/pdf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle POST request successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-123',
        format: 'detailed',
        includeTranscript: true,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.filename).toContain('summary-test-summary-123');
    expect(data.downloadUrl).toContain('/api/download/pdf/');
    expect(data.content).toContain('Technical Interview - Senior Developer');
    expect(data.metadata.summaryId).toBe('test-summary-123');
    expect(data.metadata.format).toBe('detailed');
    expect(data.metadata.includeTranscript).toBe(true);
  });

  it('should handle summary format option', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-456',
        format: 'summary',
        includeTranscript: false,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.metadata.format).toBe('summary');
    expect(data.metadata.includeTranscript).toBe(false);
  });

  it('should return 400 for missing summaryId', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        format: 'detailed',
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
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-789',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.metadata.format).toBe('detailed'); // default
    expect(data.metadata.includeTranscript).toBe(false); // default
  });

  it('should include skills, red flags, and actions in detailed format', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-detailed',
        format: 'detailed',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.content).toContain('Skills Detected');
    expect(data.content).toContain('Red Flags');
    expect(data.content).toContain('Action Items');
    expect(data.content).toContain('Python');
    expect(data.content).toContain('AWS');
    expect(data.content).toContain('Limited frontend experience');
    expect(data.content).toContain('Schedule frontend assessment');
  });

  it('should include transcript when requested', async () => {
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
    expect(data.content).toContain('Original Transcript');
    expect(data.content).toContain('Interviewer: Can you tell me about your experience');
  });

  it('should not include transcript when not requested', async () => {
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
    expect(data.content).not.toContain('Original Transcript');
  });

  it('should generate unique filenames', async () => {
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

    expect(data1.filename).not.toBe(data2.filename);
    expect(data1.filename).toContain('test-summary-unique1');
    expect(data2.filename).toContain('test-summary-unique2');
  });

  it('should calculate file size metadata', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-size',
        format: 'detailed',
        includeTranscript: true,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.metadata.fileSize).toMatch(/\d+KB/);
    expect(parseInt(data.metadata.fileSize)).toBeGreaterThan(0);
  });
});
