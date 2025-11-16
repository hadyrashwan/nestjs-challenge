import { test, expect } from '@playwright/test';

test.describe('Index Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the index page with correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Record Management System');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Record Management System');
    await page.screenshot({
      path: 'frontend-e2e/screenshot/1-main.png',
      fullPage: true,
    }); // for presentation purposes
  });

  test('should have a link to add new record', async ({ page }) => {
    const newRecordLink = page.locator('a:has-text("Add New Record")');
    await expect(newRecordLink).toBeVisible();
    await expect(newRecordLink).toHaveAttribute('href', '/new-record.html');
  });

  test('should have a link to API documentation', async ({ page }) => {
    const docsLink = page.locator('a:has-text("API Documentation")');
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute('href', '/swagger');
  });

  test('should navigate  API documentation', async ({ page }) => {
    const docsLink = page.locator('a:has-text("API Documentation")');
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute('href', '/swagger');
    await docsLink.click();
    await expect(page).toHaveURL(/.*swagger/);
    await page.screenshot({
      path: 'frontend-e2e/screenshot/2-swagger.png',
      fullPage: true,
    }); // for presentation purposes
  });

  test('should navigate to new record page when clicking the link', async ({
    page,
  }) => {
    const newRecordLink = page.locator('a:has-text("Add New Record")');
    await newRecordLink.click();

    await expect(page).toHaveURL(/.*new-record\.html/);
  });
});
