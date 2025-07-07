import { createMocks } from 'node-mocks-http';
import handler from '../pages/api/export/crm';

// Mock environment variables
const originalEnv = process.env;

describe('/api/export/crm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should handle Salesforce export successfully', async () => {
    process.env.SALESFORCE_TOKEN = 'mock-salesforce-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-123',
        crmType: 'salesforce',
        contactId: 'contact-456',
        dealId: 'deal-789',
        activityType: 'call',
        createActivity: true,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message).toBe('Successfully exported to Salesforce');
    expect(data.crmType).toBe('salesforce');
    expect(data.activityId).toMatch(/^sf_\d+$/);
    expect(data.activityUrl).toContain('lightning.force.com');
    expect(data.metadata.summaryId).toBe('test-summary-123');
    expect(data.metadata.contactId).toBe('contact-456');
    expect(data.metadata.dealId).toBe('deal-789');
    expect(data.metadata.activityType).toBe('call');
  });

  it('should handle HubSpot export successfully', async () => {
    process.env.HUBSPOT_TOKEN = 'mock-hubspot-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-456',
        crmType: 'hubspot',
        activityType: 'meeting',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message).toBe('Successfully exported to HubSpot');
    expect(data.crmType).toBe('hubspot');
    expect(data.activityId).toMatch(/^hs_\d+$/);
  });

  it('should handle Pipedrive export successfully', async () => {
    process.env.PIPEDRIVE_TOKEN = 'mock-pipedrive-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-789',
        crmType: 'pipedrive',
        activityType: 'email',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message).toBe('Successfully exported to Pipedrive');
    expect(data.crmType).toBe('pipedrive');
    expect(typeof data.activityId).toBe('number');
  });

  it('should handle custom CRM export successfully', async () => {
    process.env.CUSTOM_TOKEN = 'mock-custom-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-custom',
        crmType: 'custom',
        activityType: 'note',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message).toBe('Successfully exported to Custom CRM');
    expect(data.crmType).toBe('custom');
    expect(data.activityId).toMatch(/^custom_\d+$/);
    expect(data.activityUrl).toContain('custom-crm.com');
  });

  it('should return 400 for missing summaryId', async () => {
    process.env.SALESFORCE_TOKEN = 'mock-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        crmType: 'salesforce',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Summary ID is required');
  });

  it('should return 400 for invalid CRM type', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary',
        crmType: 'invalid-crm',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Invalid CRM type');
    expect(data.supportedTypes).toEqual(['salesforce', 'hubspot', 'pipedrive', 'custom']);
  });

  it('should return 400 when CRM token is not configured', async () => {
    process.env.SALESFORCE_TOKEN = 'your_salesforce_token_here';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary',
        crmType: 'salesforce',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Salesforce integration not configured');
    expect(data.message).toBe('Please configure your Salesforce API credentials in settings');
    expect(data.configRequired).toBe(true);
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

  it('should handle createActivity=false', async () => {
    process.env.SALESFORCE_TOKEN = 'mock-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary',
        crmType: 'salesforce',
        createActivity: false,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.message).toBe('Summary data prepared for CRM export');
    expect(data.data).toBeDefined();
    expect(data.data.subject).toContain('AI Summary:');
    expect(data.data.description).toContain('Skills Detected:');
    expect(data.crmType).toBe('salesforce');
  });

  it('should use default activity type when not specified', async () => {
    process.env.SALESFORCE_TOKEN = 'mock-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary',
        crmType: 'salesforce',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.metadata.activityType).toBe('note'); // default
  });

  it('should include metadata about exported content', async () => {
    process.env.SALESFORCE_TOKEN = 'mock-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-metadata',
        crmType: 'salesforce',
        contactId: 'contact-123',
        dealId: 'deal-456',
        activityType: 'meeting',
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

  it('should handle optional contact and deal IDs', async () => {
    process.env.HUBSPOT_TOKEN = 'mock-token';

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        summaryId: 'test-summary-optional',
        crmType: 'hubspot',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.metadata.contactId).toBeUndefined();
    expect(data.metadata.dealId).toBeUndefined();
  });

  it('should handle all activity types', async () => {
    process.env.SALESFORCE_TOKEN = 'mock-token';

    const activityTypes = ['call', 'meeting', 'email', 'note'];

    for (const activityType of activityTypes) {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          summaryId: `test-summary-${activityType}`,
          crmType: 'salesforce',
          activityType,
        },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.metadata.activityType).toBe(activityType);
    }
  });
});
