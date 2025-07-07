import { test, expect } from '@playwright/test';

test.describe('Modern Summaries Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/modern-summaries');
  });

  test('loads and displays the page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/AI Summary Analytics/);
    
    // Check main heading
    await expect(page.getByRole('heading', { name: /AI Summary Analytics/ })).toBeVisible();
    
    // Check stats cards
    await expect(page.getByText('Total Summaries')).toBeVisible();
    await expect(page.getByText('Average Rating')).toBeVisible();
    await expect(page.getByText('Skills Identified')).toBeVisible();
    await expect(page.getByText('Action Items')).toBeVisible();
  });

  test('displays summary cards', async ({ page }) => {
    // Wait for content to load
    await page.waitForSelector('[data-testid="summary-card"]', { timeout: 10000 });
    
    // Check that summary cards are visible
    const summaryCards = page.locator('[data-testid="summary-card"]');
    await expect(summaryCards.first()).toBeVisible();
    
    // Check card content
    await expect(page.getByText('AI Summary Analysis')).toBeVisible();
    await expect(page.getByText('Skills Detected')).toBeVisible();
  });

  test('search functionality works', async ({ page }) => {
    // Wait for search input
    const searchInput = page.getByPlaceholder('Search summaries...');
    await expect(searchInput).toBeVisible();
    
    // Type in search
    await searchInput.fill('React');
    
    // Check that results are filtered
    await expect(page.getByText('Showing')).toBeVisible();
  });

  test('view mode toggle works', async ({ page }) => {
    // Find view toggle buttons
    const gridButton = page.getByRole('button', { name: /grid/i });
    const listButton = page.getByRole('button', { name: /list/i });
    
    await expect(gridButton).toBeVisible();
    await expect(listButton).toBeVisible();
    
    // Click list view
    await listButton.click();
    
    // Verify layout change (this would depend on your implementation)
    // You might check for specific CSS classes or layout changes
  });

  test('theme toggle works', async ({ page }) => {
    // Find theme toggle
    const themeToggle = page.getByRole('button', { name: /toggle theme/i });
    await expect(themeToggle).toBeVisible();
    
    // Click theme toggle
    await themeToggle.click();
    
    // Check dropdown appears
    await expect(page.getByText('Light')).toBeVisible();
    await expect(page.getByText('Dark')).toBeVisible();
    await expect(page.getByText('System')).toBeVisible();
    
    // Click light theme
    await page.getByText('Light').click();
    
    // Verify theme change (check for light theme class on html/body)
    const html = page.locator('html');
    await expect(html).not.toHaveClass(/dark/);
  });

  test('filters work correctly', async ({ page }) => {
    // Open filters
    const filtersButton = page.getByRole('button', { name: /filters/i });
    await filtersButton.click();
    
    // Check filter panel opens
    await expect(page.getByText('Filter Summaries')).toBeVisible();
    
    // Test date range filter
    const dateSelect = page.getByRole('combobox').first();
    await dateSelect.click();
    await page.getByText('This week').click();
    
    // Close filters and check results
    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByText('Date: week')).toBeVisible();
  });

  test('export dialog opens and works', async ({ page }) => {
    // Find and click export button
    const exportButton = page.getByRole('button', { name: /export/i }).first();
    await exportButton.click();
    
    // Check dialog opens
    await expect(page.getByText('Export Summary')).toBeVisible();
    
    // Check tabs are present
    await expect(page.getByRole('tab', { name: /PDF Export/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Notion/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /CRM/i })).toBeVisible();
    
    // Test PDF tab
    await page.getByRole('tab', { name: /PDF Export/i }).click();
    await expect(page.getByText('Export Format')).toBeVisible();
    
    // Test Notion tab
    await page.getByRole('tab', { name: /Notion/i }).click();
    await expect(page.getByText('Page Title')).toBeVisible();
    
    // Close dialog
    await page.getByRole('button', { name: /close/i }).click();
  });

  test('rating system works', async ({ page }) => {
    // Find star rating
    const starButtons = page.getByRole('button', { name: /Rate \d star/ });
    await expect(starButtons.first()).toBeVisible();
    
    // Click 4th star
    await starButtons.nth(3).click();
    
    // Check for success toast
    await expect(page.getByText('Rating saved')).toBeVisible();
  });

  test('copy functionality works', async ({ page }) => {
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-write']);
    
    // Find and click copy button
    const copyButton = page.getByRole('button', { name: /copy/i }).first();
    await copyButton.click();
    
    // Check for success toast
    await expect(page.getByText('Copied to clipboard')).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that mobile layout is applied
    await expect(page.getByRole('heading', { name: /AI Summary Analytics/ })).toBeVisible();
    
    // Check that cards stack vertically (this would depend on your CSS)
    const summaryCards = page.locator('[data-testid="summary-card"]');
    if (await summaryCards.count() > 0) {
      await expect(summaryCards.first()).toBeVisible();
    }
  });

  test('keyboard navigation works', async ({ page }) => {
    // Focus on search input
    await page.getByPlaceholder('Search summaries...').focus();
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('loading states are shown', async ({ page }) => {
    // Intercept API calls to simulate loading
    await page.route('**/api/summaries', async route => {
      // Delay response to see loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    // Reload page to trigger loading
    await page.reload();
    
    // Check for skeleton loaders
    const skeletons = page.locator('.animate-pulse');
    await expect(skeletons.first()).toBeVisible();
  });
});
