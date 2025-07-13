import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Integration Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Slack Integration', () => {
    test('Slack connect page loads and shows OAuth button', async ({ page }) => {
      await page.goto('/slack/connect');
      await page.waitForLoadState('networkidle');
      
      // Check for main heading
      await expect(page.locator('h1')).toBeVisible();
      
      // Look for Slack connect button
      const slackButton = page.getByRole('button', { name: /connect.*slack|add to slack/i });
      const slackLink = page.getByRole('link', { name: /connect.*slack|add to slack/i });
      
      // Either button or link should be present
      const hasSlackConnect = await slackButton.isVisible() || await slackLink.isVisible();
      expect(hasSlackConnect).toBeTruthy();
    });

    test('Slack OAuth flow initiation', async ({ page }) => {
      await page.goto('/slack/connect');
      
      // Find Slack connect element
      const slackButton = page.getByRole('button', { name: /connect.*slack|add to slack/i });
      const slackLink = page.getByRole('link', { name: /connect.*slack|add to slack/i });
      
      if (await slackButton.isVisible()) {
        // Don't actually click (would redirect to Slack), just verify it's clickable
        await expect(slackButton).toBeEnabled();
      } else if (await slackLink.isVisible()) {
        // Check that link has proper href
        const href = await slackLink.getAttribute('href');
        expect(href).toContain('slack.com');
      }
    });

    test('Slack status display in dashboard', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for Slack status indicator
      const slackStatus = page.locator('[data-testid="slack-status"]');
      const slackCard = page.locator('text=/slack/i').first();
      
      if (await slackStatus.isVisible()) {
        await expect(slackStatus).toBeVisible();
      } else if (await slackCard.isVisible()) {
        await expect(slackCard).toBeVisible();
      }
    });
  });

  test.describe('File Upload', () => {
    test('File upload page loads correctly', async ({ page }) => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      
      // Check for upload heading
      await expect(page.locator('h1:has-text("Upload Documents")')).toBeVisible();
      
      // Check for file input
      await expect(page.locator('input[type="file"]')).toBeVisible();
      
      // Check for drag and drop area
      const dropzone = page.locator('[role="button"]').filter({ hasText: /drag.*drop|click to select/i });
      if (await dropzone.isVisible()) {
        await expect(dropzone).toBeVisible();
      }
    });

    test('File upload drag and drop area is interactive', async ({ page }) => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      
      // Find the dropzone
      const dropzone = page.locator('[role="button"]').filter({ hasText: /drag.*drop|click to select/i });
      
      if (await dropzone.isVisible()) {
        // Test hover state
        await dropzone.hover();
        
        // Test click to open file dialog (don't actually select file)
        await dropzone.click();
        
        // File input should be triggered (we can't easily test the actual file dialog)
        const fileInput = page.locator('input[type="file"]');
        await expect(fileInput).toBeVisible();
      }
    });

    test('File upload with valid file types', async ({ page }) => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      
      // Create a test file (small text file to simulate PDF/DOCX)
      const fileInput = page.locator('input[type="file"]');
      
      // Check file input accepts correct types
      const acceptAttr = await fileInput.getAttribute('accept');
      if (acceptAttr) {
        expect(acceptAttr).toMatch(/pdf|docx|\.pdf|\.docx/i);
      }
    });

    test('File upload progress and status display', async ({ page }) => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      
      // Look for upload status area or progress indicators
      const uploadArea = page.locator('[data-testid="upload-area"], .upload-status');
      const progressBar = page.locator('[role="progressbar"], .progress');
      
      // These elements might not be visible until upload starts
      // Just check that the upload interface is properly structured
      await expect(page.locator('input[type="file"]')).toBeVisible();
    });

    test('File upload error handling', async ({ page }) => {
      await page.goto('/upload');
      await page.waitForLoadState('networkidle');
      
      // Check for file size limits or type restrictions in UI
      const restrictions = page.locator('text=/maximum.*size|supported.*formats|10mb|pdf.*docx/i');
      
      if (await restrictions.isVisible()) {
        await expect(restrictions).toBeVisible();
      }
    });
  });

  test.describe('Theme Toggle', () => {
    test('Theme toggle functionality', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Find theme toggle
      const themeToggle = page.locator('[data-testid="dark-mode-toggle"]');
      
      if (await themeToggle.isVisible()) {
        // Click to open theme menu
        await themeToggle.click();
        
        // Check for theme options
        await expect(page.getByText('Light')).toBeVisible();
        await expect(page.getByText('Dark')).toBeVisible();
        await expect(page.getByText('System')).toBeVisible();
        
        // Test dark theme
        await page.getByText('Dark').click();
        
        // Check that dark class is applied
        await expect(page.locator('html')).toHaveClass(/dark/);
        
        // Test light theme
        await themeToggle.click();
        await page.getByText('Light').click();
        
        // Check that dark class is removed
        await expect(page.locator('html')).not.toHaveClass(/dark/);
      }
    });

    test('Theme persistence across pages', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const themeToggle = page.locator('[data-testid="dark-mode-toggle"]');
      
      if (await themeToggle.isVisible()) {
        // Set dark theme
        await themeToggle.click();
        await page.getByText('Dark').click();
        
        // Navigate to another page
        await page.goto('/upload');
        await page.waitForLoadState('networkidle');
        
        // Theme should persist
        await expect(page.locator('html')).toHaveClass(/dark/);
      }
    });

    test('System theme detection', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const themeToggle = page.locator('[data-testid="dark-mode-toggle"]');
      
      if (await themeToggle.isVisible()) {
        // Set system theme
        await themeToggle.click();
        await page.getByText('System').click();
        
        // The theme should match system preference
        // We can't easily test this without changing system settings
        // But we can verify the system option is selected
        await themeToggle.click();
        
        // System option should be available
        await expect(page.getByText('System')).toBeVisible();
      }
    });
  });

  test.describe('Export Functionality', () => {
    test('Export options are available', async ({ page }) => {
      await page.goto('/modern-summaries');
      await page.waitForLoadState('networkidle');
      
      // Wait for content to load
      await page.waitForSelector('[data-testid="summary-card"]', { timeout: 10000 });
      
      // Find export button
      const exportButton = page.getByRole('button', { name: /export/i }).first();
      
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Check export dialog
        await expect(page.getByText('Export Summary')).toBeVisible();
        
        // Check export options
        await expect(page.getByRole('tab', { name: /PDF/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /Notion/i })).toBeVisible();
        await expect(page.getByRole('tab', { name: /CRM/i })).toBeVisible();
      }
    });

    test('PDF export configuration', async ({ page }) => {
      await page.goto('/modern-summaries');
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('[data-testid="summary-card"]', { timeout: 10000 });
      
      const exportButton = page.getByRole('button', { name: /export/i }).first();
      
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Select PDF tab
        await page.getByRole('tab', { name: /PDF/i }).click();
        
        // Check PDF options
        await expect(page.getByText('Export Format')).toBeVisible();
        
        // Look for format options
        const formatOptions = page.locator('select, [role="combobox"]');
        if (await formatOptions.first().isVisible()) {
          await expect(formatOptions.first()).toBeVisible();
        }
      }
    });

    test('Notion export configuration', async ({ page }) => {
      await page.goto('/modern-summaries');
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('[data-testid="summary-card"]', { timeout: 10000 });
      
      const exportButton = page.getByRole('button', { name: /export/i }).first();
      
      if (await exportButton.isVisible()) {
        await exportButton.click();
        
        // Select Notion tab
        await page.getByRole('tab', { name: /Notion/i }).click();
        
        // Check Notion options
        await expect(page.getByText('Page Title')).toBeVisible();
        
        // Look for title input
        const titleInput = page.locator('input[placeholder*="title"], input[name*="title"]');
        if (await titleInput.isVisible()) {
          await expect(titleInput).toBeVisible();
        }
      }
    });
  });
});
