import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

test.describe('New Record Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/new-record.html');
  });

  test('should load the new record page with correct title', async ({
    page,
  }) => {
    await expect(page).toHaveTitle('Add New Record');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Add New Record');
  });

  test('should have all required form fields', async ({ page }) => {
    // Check for required fields
    await expect(page.locator('#artist')).toBeVisible();
    await expect(page.locator('#album')).toBeVisible();
    await expect(page.locator('#price')).toBeVisible();
    await expect(page.locator('#qty')).toBeVisible();
    await expect(page.locator('#format')).toBeVisible();
    await expect(page.locator('#category')).toBeVisible();

    // Check submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have all format options', async ({ page }) => {
    const formatSelect = page.locator('#format');

    // Check that all format options are present
    await expect(formatSelect.locator('option[value="Vinyl"]')).toHaveText(
      'Vinyl',
    );
    await expect(formatSelect.locator('option[value="CD"]')).toHaveText('CD');
    await expect(formatSelect.locator('option[value="Cassette"]')).toHaveText(
      'Cassette',
    );
    await expect(formatSelect.locator('option[value="Digital"]')).toHaveText(
      'Digital',
    );
  });

  test('should have all category options', async ({ page }) => {
    const categorySelect = page.locator('#category');

    // Check that all category options are present
    await expect(categorySelect.locator('option[value="Rock"]')).toHaveText(
      'Rock',
    );
    await expect(categorySelect.locator('option[value="Jazz"]')).toHaveText(
      'Jazz',
    );
    await expect(categorySelect.locator('option[value="Hip-Hop"]')).toHaveText(
      'Hip-Hop',
    );
    await expect(
      categorySelect.locator('option[value="Classical"]'),
    ).toHaveText('Classical');
    await expect(categorySelect.locator('option[value="Pop"]')).toHaveText(
      'Pop',
    );
    await expect(
      categorySelect.locator('option[value="Alternative"]'),
    ).toHaveText('Alternative');
    await expect(categorySelect.locator('option[value="Indie"]')).toHaveText(
      'Indie',
    );
  });

  test('should successfully submit form with valid data', async ({ page }) => {
    // Fill in the form with valid data
    await page.fill('#artist', 'Test Artist');
    await page.fill('#album', `Test Album ${randomUUID()}`);
    await page.fill('#price', '19.99');
    await page.fill('#qty', '5');
    await page.selectOption('#format', 'Vinyl');
    await page.selectOption('#category', 'Rock');
    await page.fill('#mbid', 'f3bfa859-556e-45a6-aae1-904db518d6af'); // Optional field

    await page.screenshot({
      path: 'frontend-e2e/screenshot/3-before-submit-success.png',
      fullPage: true,
    }); // for presentation purposes

    // Intercept the API call
    const apiRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && request.url().includes('/records'),
    );
    const apiResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/records') && response.status() === 201,
    );

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Wait for the API request to complete
    const request = await apiRequest;
    const response = await apiResponse;

    // Verify the request was made correctly
    expect(request.method()).toBe('POST');
    expect(response.status()).toBe(201);

    // Verify the success message appears
    await expect(page.locator('.message.success')).toBeVisible();
    await expect(page.locator('.message.success')).toContainText(
      'Record added successfully!',
    );
    await page.screenshot({
      path: 'frontend-e2e/screenshot/4-after-submit-success.png',
      fullPage: true,
    }); // for presentation purposes
  });

  test('should show error message when API call fails', async ({ page }) => {
    // Fill in the form with data that would cause an error (invalid price)
    await page.fill('#artist', 'Test Artist');
    await page.fill('#album', 'Test Album');
    await page.fill('#price', '-10'); // Invalid price
    await page.fill('#qty', '5');
    await page.selectOption('#format', 'Vinyl');
    await page.selectOption('#category', 'Rock');

    await page.screenshot({
      path: 'frontend-e2e/screenshot/5-before-submit-fail.png',
      fullPage: true,
    }); // for presentation purposes

    // Intercept the API call
    const apiResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/records') && response.status() === 400,
    );

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Wait for the API response
    const response = await apiResponse;
    expect(response.status()).toBe(400);

    // Verify the error message appears
    await expect(page.locator('.message.error')).toBeVisible();

    await page.screenshot({
      path: 'frontend-e2e/screenshot/6-after-submit-fail.png',
      fullPage: true,
    }); // for presentation purposes
  });

  test('should reset form after successful submission', async ({ page }) => {
    // Fill in the form with valid data
    const testArtist = `Test Artist ${randomUUID()}`;
    await page.fill('#artist', testArtist);
    await page.fill('#album', `Test Album ${randomUUID()}`);
    await page.fill('#price', '19.99');
    await page.fill('#qty', '5');
    await page.selectOption('#format', 'CD');
    await page.selectOption('#category', 'Jazz');

    // Intercept the API call
    const apiResponse = page.waitForResponse(
      (response) =>
        response.url().includes('/records') && response.status() === 201,
    );

    // Submit the form
    await page.locator('button[type="submit"]').click();

    // Wait for success
    await apiResponse;

    // Wait for success message to appear
    await expect(page.locator('.message.success')).toBeVisible();

    // Wait briefly and then check that form is cleared
    await page.waitForTimeout(100);
    await expect(page.locator('#artist')).toHaveValue('');
    await expect(page.locator('#album')).toHaveValue('');
    await expect(page.locator('#price')).toHaveValue('');
    await expect(page.locator('#qty')).toHaveValue('');
  });
});
