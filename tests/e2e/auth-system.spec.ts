import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'testpassword123';
const INVALID_PASSWORD = 'wrongpassword';

test.describe('Authentication System - Login & Redirect', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto(BASE_URL);
  });

  test('Normal Login Flow', async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`);
    
    // Verify login page loads
    await expect(page.locator('h1')).toContainText('Welcome back');
    
    // Fill in credentials
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // Click sign in button
    const signInButton = page.locator('button[type="submit"]');
    await expect(signInButton).toBeVisible();
    await signInButton.click();
    
    // Verify loading state appears briefly
    await expect(signInButton).toContainText('Signing in...');
    
    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    
    // Verify dashboard loads with authenticated user
    await expect(page.locator('h1')).toContainText('Dashboard');
    await expect(page.url()).toBe(`${BASE_URL}/dashboard`);
  });

  test('Redirect URL Preservation', async ({ page }) => {
    // Try to visit dashboard while logged out
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should be redirected to login with redirect parameter
    await page.waitForURL(/\/login\?redirect=%2Fdashboard/, { timeout: 5000 });
    
    // Verify we're on login page with redirect parameter
    expect(page.url()).toContain('/login?redirect=%2Fdashboard');
    
    // Fill in credentials and login
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Should redirect back to dashboard after login
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    await expect(page.url()).toBe(`${BASE_URL}/dashboard`);
  });

  test('Already Authenticated User Redirect', async ({ page }) => {
    // First, log in
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    // Now try to visit login page while authenticated
    await page.goto(`${BASE_URL}/login`);
    
    // Should automatically redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 });
    await expect(page.url()).toBe(`${BASE_URL}/dashboard`);
  });

  test('Invalid Credentials Handling', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', INVALID_PASSWORD);
    
    // Click sign in
    const signInButton = page.locator('button[type="submit"]');
    await signInButton.click();
    
    // Verify loading state appears
    await expect(signInButton).toContainText('Signing in...');
    
    // Wait for error message to appear (toast notification)
    await expect(page.locator('[data-sonner-toast]')).toBeVisible({ timeout: 5000 });
    
    // Verify error message content
    const errorToast = page.locator('[data-sonner-toast]');
    await expect(errorToast).toContainText('Invalid email or password');
    
    // Verify loading state resets
    await expect(signInButton).toContainText('Sign In');
    await expect(signInButton).not.toBeDisabled();
    
    // Verify user can retry
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await signInButton.click();
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
  });

  test('Public Route Access', async ({ page }) => {
    // Test landing page
    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('h1')).toBeVisible();
    expect(page.url()).toBe(`${BASE_URL}/`);
    
    // Test pricing page
    await page.goto(`${BASE_URL}/pricing`);
    await expect(page.locator('h1')).toContainText('Pricing');
    expect(page.url()).toBe(`${BASE_URL}/pricing`);
    
    // Test support page
    await page.goto(`${BASE_URL}/support`);
    await expect(page.locator('h1')).toBeVisible();
    expect(page.url()).toBe(`${BASE_URL}/support`);
  });

  test('Session Persistence Across Refresh', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/dashboard`);
    
    // Refresh the page
    await page.reload();
    
    // Should still be on dashboard
    await expect(page.url()).toBe(`${BASE_URL}/dashboard`);
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('Loading States and UI Feedback', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    // Fill in credentials
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // Click sign in and immediately check loading state
    const signInButton = page.locator('button[type="submit"]');
    await signInButton.click();
    
    // Verify loading state appears
    await expect(signInButton).toContainText('Signing in...');
    await expect(signInButton).toBeDisabled();
    
    // Wait for success and redirect
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });
    
    // Verify success toast appears
    await expect(page.locator('[data-sonner-toast]')).toContainText('Successfully signed in!');
  });
});
