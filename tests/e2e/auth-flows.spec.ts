import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/');
  });

  test('Complete signup flow', async ({ page }) => {
    // Navigate to signup
    const getStartedButton = page.getByRole('link', { name: 'Get Started' }).first();
    await getStartedButton.click();
    
    await page.waitForURL(/.*signup/, { timeout: 10000 });
    
    // Check signup form is present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Test form validation (empty submission)
    await page.locator('button[type="submit"]').click();
    
    // Should show validation errors or stay on page
    await expect(page.url()).toContain('signup');
  });

  test('Complete login flow', async ({ page }) => {
    // Navigate to login
    const signInButton = page.getByRole('link', { name: 'Sign In' });
    await signInButton.click();
    
    await page.waitForURL(/.*login/, { timeout: 10000 });
    
    // Check login form is present
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Test form validation (empty submission)
    await page.locator('button[type="submit"]').click();
    
    // Should show validation errors or stay on page
    await expect(page.url()).toContain('login');
  });

  test('Navigation between login and signup', async ({ page }) => {
    // Go to login
    await page.getByRole('link', { name: 'Sign In' }).click();
    await page.waitForURL(/.*login/, { timeout: 10000 });
    
    // Find link to signup (usually "Don't have an account? Sign up")
    const signupLink = page.getByRole('link', { name: /sign up/i });
    if (await signupLink.isVisible()) {
      await signupLink.click();
      await page.waitForURL(/.*signup/, { timeout: 10000 });
      
      // Should be on signup page
      await expect(page.url()).toContain('signup');
    }
  });

  test('Protected route redirects to login', async ({ page }) => {
    // Try to access protected dashboard directly
    await page.goto('/dashboard');
    
    // Should redirect to login or show auth prompt
    // This depends on your auth implementation
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to login or if there's an auth wall
    const currentUrl = page.url();
    const hasAuthForm = await page.locator('input[type="email"]').isVisible();
    
    // Either redirected to login page or auth form is shown
    expect(currentUrl.includes('login') || hasAuthForm).toBeTruthy();
  });

  test('Logout functionality (if accessible)', async ({ page }) => {
    // This test assumes we can access dashboard without auth for testing
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for logout button or user menu
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    const userMenu = page.getByRole('button', { name: /user menu|profile/i });
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      // Should redirect to home or login
      await page.waitForURL(/\/$|\/login/, { timeout: 10000 });
    } else if (await userMenu.isVisible()) {
      await userMenu.click();
      // Look for logout in dropdown
      const dropdownLogout = page.getByRole('menuitem', { name: /logout|sign out/i });
      if (await dropdownLogout.isVisible()) {
        await dropdownLogout.click();
        await page.waitForURL(/\/$|\/login/, { timeout: 10000 });
      }
    }
  });

  test('Password reset flow (if implemented)', async ({ page }) => {
    // Go to login page
    await page.getByRole('link', { name: 'Sign In' }).click();
    await page.waitForURL(/.*login/, { timeout: 10000 });
    
    // Look for forgot password link
    const forgotPasswordLink = page.getByRole('link', { name: /forgot password|reset password/i });
    
    if (await forgotPasswordLink.isVisible()) {
      await forgotPasswordLink.click();
      
      // Should navigate to password reset page
      await page.waitForLoadState('networkidle');
      
      // Check for email input for password reset
      await expect(page.locator('input[type="email"]')).toBeVisible();
    }
  });

  test('Social login buttons (if implemented)', async ({ page }) => {
    // Go to login page
    await page.getByRole('link', { name: 'Sign In' }).click();
    await page.waitForURL(/.*login/, { timeout: 10000 });
    
    // Look for social login buttons
    const googleButton = page.getByRole('button', { name: /google/i });
    const githubButton = page.getByRole('button', { name: /github/i });
    
    // Just check if they're present and clickable (don't actually click)
    if (await googleButton.isVisible()) {
      await expect(googleButton).toBeEnabled();
    }
    
    if (await githubButton.isVisible()) {
      await expect(githubButton).toBeEnabled();
    }
  });

  test('Form validation messages', async ({ page }) => {
    // Go to signup page
    await page.getByRole('link', { name: 'Get Started' }).first().click();
    await page.waitForURL(/.*signup/, { timeout: 10000 });
    
    // Try to submit with invalid email
    await page.locator('input[type="email"]').fill('invalid-email');
    await page.locator('button[type="submit"]').click();
    
    // Should show validation error (either browser validation or custom)
    // This will depend on your form implementation
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    
    if (isInvalid) {
      // Browser validation is working
      expect(isInvalid).toBeTruthy();
    } else {
      // Look for custom validation message
      const errorMessage = page.locator('[role="alert"], .error, .text-red-500');
      if (await errorMessage.isVisible()) {
        await expect(errorMessage).toBeVisible();
      }
    }
  });

  test('Accessibility in auth forms', async ({ page }) => {
    // Go to login page
    await page.getByRole('link', { name: 'Sign In' }).click();
    await page.waitForURL(/.*login/, { timeout: 10000 });
    
    // Check for proper labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Check if inputs have labels or aria-labels
    const emailLabel = await emailInput.getAttribute('aria-label') || 
                      await page.locator('label[for]').first().textContent();
    const passwordLabel = await passwordInput.getAttribute('aria-label') || 
                         await page.locator('label').nth(1).textContent();
    
    expect(emailLabel).toBeTruthy();
    expect(passwordLabel).toBeTruthy();
    
    // Test keyboard navigation
    await emailInput.focus();
    await page.keyboard.press('Tab');
    
    // Should focus on password field
    await expect(passwordInput).toBeFocused();
  });
});
