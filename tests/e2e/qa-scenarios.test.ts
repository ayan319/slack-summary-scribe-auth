import { test, expect } from '@playwright/test';

/**
 * Comprehensive End-to-End QA Test Suite
 * 20+ scenarios covering edge cases, failures, and user flows
 */

// Test data for various scenarios
const TEST_DATA = {
  validTranscript: `
    John: Hey team, let's discuss the Q4 roadmap.
    Sarah: I think we should focus on the mobile app improvements.
    Mike: Agreed. We also need to address the performance issues.
    John: Great points. Let's prioritize mobile and performance.
  `,
  longTranscript: 'A'.repeat(50000), // 50KB transcript
  emptyTranscript: '',
  malformedTranscript: '<<<INVALID JSON>>>',
  slackMissingData: {
    channel: null,
    user: undefined,
    timestamp: '',
  },
  invalidSlackWebhook: {
    token: 'invalid_token',
    challenge: 'test_challenge',
  },
};

test.describe('QA Scenarios - Core Functionality', () => {
  
  test('Scenario 1: Valid transcript summarization', async ({ page }) => {
    await page.goto('/dashboard');
    await page.fill('[data-testid="transcript-input"]', TEST_DATA.validTranscript);
    await page.click('[data-testid="summarize-button"]');
    
    await expect(page.locator('[data-testid="summary-result"]')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-testid="skills-detected"]')).toContainText('roadmap');
  });

  test('Scenario 2: Empty transcript handling', async ({ page }) => {
    await page.goto('/dashboard');
    await page.fill('[data-testid="transcript-input"]', TEST_DATA.emptyTranscript);
    await page.click('[data-testid="summarize-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Transcript cannot be empty');
  });

  test('Scenario 3: Long transcript processing', async ({ page }) => {
    await page.goto('/dashboard');
    await page.fill('[data-testid="transcript-input"]', TEST_DATA.longTranscript);
    await page.click('[data-testid="summarize-button"]');
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Should complete or show appropriate error for oversized content
    await page.waitForSelector('[data-testid="summary-result"], [data-testid="error-message"]', { timeout: 60000 });
  });

  test('Scenario 4: Malformed transcript data', async ({ page }) => {
    await page.goto('/dashboard');
    await page.fill('[data-testid="transcript-input"]', TEST_DATA.malformedTranscript);
    await page.click('[data-testid="summarize-button"]');
    
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

});

test.describe('QA Scenarios - Slack Integration', () => {

  test('Scenario 5: Valid Slack webhook', async ({ request }) => {
    const response = await request.post('/api/slack/webhook', {
      data: {
        token: process.env.SLACK_VERIFICATION_TOKEN,
        challenge: 'test_challenge',
        type: 'url_verification',
      },
    });
    
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toBe('test_challenge');
  });

  test('Scenario 6: Invalid Slack token', async ({ request }) => {
    const response = await request.post('/api/slack/webhook', {
      data: TEST_DATA.invalidSlackWebhook,
    });
    
    expect(response.status()).toBe(401);
  });

  test('Scenario 7: Slack missing channel data', async ({ request }) => {
    const response = await request.post('/api/slack/webhook', {
      data: {
        token: process.env.SLACK_VERIFICATION_TOKEN,
        event: {
          type: 'message',
          text: 'Test message',
          user: 'U123456',
          // Missing channel, ts, etc.
        },
      },
    });
    
    // Should handle gracefully with fallbacks
    expect(response.status()).toBe(200);
  });

  test('Scenario 8: Slack missing user data', async ({ request }) => {
    const response = await request.post('/api/slack/webhook', {
      data: {
        token: process.env.SLACK_VERIFICATION_TOKEN,
        event: {
          type: 'message',
          text: 'Test message',
          channel: 'C123456',
          ts: '1234567890.123456',
          // Missing user
        },
      },
    });
    
    expect(response.status()).toBe(200);
  });

});

test.describe('QA Scenarios - Export Functionality', () => {

  test('Scenario 9: Successful Notion export', async ({ page, request }) => {
    // First create a summary
    await page.goto('/dashboard');
    await page.fill('[data-testid="transcript-input"]', TEST_DATA.validTranscript);
    await page.click('[data-testid="summarize-button"]');
    await page.waitForSelector('[data-testid="summary-result"]');
    
    // Then export to Notion
    await page.click('[data-testid="notion-export-button"]');
    await page.fill('[data-testid="notion-title-input"]', 'Test Export');
    await page.click('[data-testid="export-confirm-button"]');
    
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible({ timeout: 30000 });
  });

  test('Scenario 10: Failed Notion export', async ({ page }) => {
    // Mock failed export by using invalid credentials
    await page.route('/api/export/notion', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, error: 'Notion API error' }),
      });
    });

    await page.goto('/dashboard');
    await page.fill('[data-testid="transcript-input"]', TEST_DATA.validTranscript);
    await page.click('[data-testid="summarize-button"]');
    await page.waitForSelector('[data-testid="summary-result"]');
    
    await page.click('[data-testid="notion-export-button"]');
    await page.fill('[data-testid="notion-title-input"]', 'Test Export');
    await page.click('[data-testid="export-confirm-button"]');
    
    await expect(page.locator('[data-testid="export-error"]')).toBeVisible();
  });

  test('Scenario 11: Export retry mechanism', async ({ page }) => {
    let attemptCount = 0;
    
    await page.route('/api/export/notion', route => {
      attemptCount++;
      if (attemptCount < 3) {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ success: false, error: 'Temporary error' }),
        });
      } else {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, data: { notionPageId: 'test-id' } }),
        });
      }
    });

    await page.goto('/dashboard');
    await page.fill('[data-testid="transcript-input"]', TEST_DATA.validTranscript);
    await page.click('[data-testid="summarize-button"]');
    await page.waitForSelector('[data-testid="summary-result"]');
    
    await page.click('[data-testid="notion-export-button"]');
    await page.fill('[data-testid="notion-title-input"]', 'Test Export');
    await page.click('[data-testid="export-confirm-button"]');
    
    // Should eventually succeed after retries
    await expect(page.locator('[data-testid="export-success"]')).toBeVisible({ timeout: 60000 });
  });

});

test.describe('QA Scenarios - Billing & Usage', () => {

  test('Scenario 12: Usage limit enforcement', async ({ page }) => {
    // Mock user at usage limit
    await page.route('/api/usage', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: { used: 3, limit: 3, plan: 'free' },
        }),
      });
    });

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="usage-limit-alert"]')).toBeVisible();
    
    await page.fill('[data-testid="transcript-input"]', TEST_DATA.validTranscript);
    await page.click('[data-testid="summarize-button"]');
    
    await expect(page.locator('[data-testid="upgrade-prompt"]')).toBeVisible();
  });

  test('Scenario 13: Stripe checkout flow', async ({ page }) => {
    await page.goto('/upgrade');
    await page.click('[data-testid="pro-plan-button"]');
    
    // Should redirect to Stripe (we'll mock this)
    await page.route('/api/stripe/create-checkout-session', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: { url: 'https://checkout.stripe.com/test-session' },
        }),
      });
    });
    
    await expect(page).toHaveURL(/stripe\.com/);
  });

  test('Scenario 14: Failed billing retry', async ({ page }) => {
    await page.route('/api/stripe/create-checkout-session', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ success: false, error: 'Payment processing error' }),
      });
    });

    await page.goto('/upgrade');
    await page.click('[data-testid="pro-plan-button"]');
    
    await expect(page.locator('[data-testid="billing-error"]')).toBeVisible();
    
    // Should allow retry
    await page.click('[data-testid="retry-payment-button"]');
  });

});

test.describe('QA Scenarios - User Experience', () => {

  test('Scenario 15: Onboarding flow completion', async ({ page }) => {
    // Mock new user
    await page.addInitScript(() => {
      localStorage.setItem('is-new-user', 'true');
    });

    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="onboarding-dialog"]')).toBeVisible();
    
    // Complete onboarding steps
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="onboarding-next-button"]');
    }
    
    await expect(page.locator('[data-testid="onboarding-dialog"]')).not.toBeVisible();
  });

  test('Scenario 16: Error boundary activation', async ({ page }) => {
    // Force a React error
    await page.route('/api/summaries', route => {
      route.fulfill({
        status: 200,
        body: 'invalid json response',
      });
    });

    await page.goto('/history');
    await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
    
    // Should allow recovery
    await page.click('[data-testid="retry-button"]');
  });

  test('Scenario 17: Offline functionality', async ({ page, context }) => {
    await page.goto('/dashboard');
    
    // Simulate offline
    await context.setOffline(true);
    
    await page.fill('[data-testid="transcript-input"]', TEST_DATA.validTranscript);
    await page.click('[data-testid="summarize-button"]');
    
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
  });

  test('Scenario 18: Mobile responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible();
  });

});

test.describe('QA Scenarios - Performance & Edge Cases', () => {

  test('Scenario 19: Concurrent user sessions', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Both users create summaries simultaneously
    await Promise.all([
      page1.goto('/dashboard'),
      page2.goto('/dashboard'),
    ]);
    
    await Promise.all([
      page1.fill('[data-testid="transcript-input"]', 'User 1 transcript'),
      page2.fill('[data-testid="transcript-input"]', 'User 2 transcript'),
    ]);
    
    await Promise.all([
      page1.click('[data-testid="summarize-button"]'),
      page2.click('[data-testid="summarize-button"]'),
    ]);
    
    // Both should complete successfully
    await Promise.all([
      expect(page1.locator('[data-testid="summary-result"]')).toBeVisible({ timeout: 30000 }),
      expect(page2.locator('[data-testid="summary-result"]')).toBeVisible({ timeout: 30000 }),
    ]);
    
    await context1.close();
    await context2.close();
  });

  test('Scenario 20: Database connection failure', async ({ page }) => {
    await page.route('/api/summaries', route => {
      route.fulfill({
        status: 503,
        body: JSON.stringify({ success: false, error: 'Database unavailable' }),
      });
    });

    await page.goto('/history');
    await expect(page.locator('[data-testid="database-error"]')).toBeVisible();
    
    // Should show retry option
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('Scenario 21: Memory leak detection', async ({ page }) => {
    // Navigate through multiple pages rapidly
    const pages = ['/dashboard', '/history', '/settings', '/upgrade', '/team'];
    
    for (let i = 0; i < 10; i++) {
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Check for memory leaks (basic check)
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
  });

  test('Scenario 22: API rate limiting', async ({ page }) => {
    // Rapid API calls to trigger rate limiting
    await page.goto('/dashboard');
    
    for (let i = 0; i < 20; i++) {
      await page.fill('[data-testid="transcript-input"]', `Test ${i}`);
      page.click('[data-testid="summarize-button"]'); // Don't await
    }
    
    // Should show rate limit message
    await expect(page.locator('[data-testid="rate-limit-message"]')).toBeVisible({ timeout: 10000 });
  });

  test('Scenario 23: Large team data handling', async ({ page }) => {
    // Mock large team with 1000+ members
    await page.route('/api/teams', route => {
      const largeTeam = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));
      
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true, data: largeTeam }),
      });
    });

    await page.goto('/team');
    await expect(page.locator('[data-testid="team-members-list"]')).toBeVisible();
    
    // Should handle large datasets with pagination or virtualization
    await expect(page.locator('[data-testid="pagination"]')).toBeVisible();
  });

});

test.describe('QA Scenarios - Security & Data Integrity', () => {

  test('Scenario 24: XSS prevention', async ({ page }) => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    await page.goto('/dashboard');
    await page.fill('[data-testid="transcript-input"]', xssPayload);
    await page.click('[data-testid="summarize-button"]');
    
    // Should not execute script
    page.on('dialog', dialog => {
      throw new Error('XSS vulnerability detected');
    });
    
    await page.waitForTimeout(2000); // Wait to see if alert fires
  });

  test('Scenario 25: Data persistence verification', async ({ page }) => {
    await page.goto('/dashboard');
    await page.fill('[data-testid="transcript-input"]', TEST_DATA.validTranscript);
    await page.click('[data-testid="summarize-button"]');
    await page.waitForSelector('[data-testid="summary-result"]');
    
    // Navigate away and back
    await page.goto('/settings');
    await page.goto('/history');
    
    // Summary should be in history
    await expect(page.locator('[data-testid="summary-item"]').first()).toBeVisible();
  });

});

// Additional utility functions for QA testing
export const QATestUtils = {
  async waitForApiResponse(page: any, apiPath: string, timeout = 30000) {
    return page.waitForResponse(
      (response: any) => response.url().includes(apiPath) && response.status() === 200,
      { timeout }
    );
  },

  async mockApiError(page: any, apiPath: string, errorCode = 500, errorMessage = 'Server Error') {
    await page.route(`**/${apiPath}`, route => {
      route.fulfill({
        status: errorCode,
        body: JSON.stringify({ success: false, error: errorMessage }),
      });
    });
  },

  async simulateSlowNetwork(page: any, delay = 2000) {
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), delay);
    });
  },

  async checkAccessibility(page: any) {
    // Basic accessibility checks
    const missingAltTags = await page.locator('img:not([alt])').count();
    const missingLabels = await page.locator('input:not([aria-label]):not([aria-labelledby])').count();

    expect(missingAltTags).toBe(0);
    expect(missingLabels).toBe(0);
  },

  async measurePageLoadTime(page: any, url: string) {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`Page load time for ${url}: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

    return loadTime;
  },
};
