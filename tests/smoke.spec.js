const { test, expect } = require('@playwright/test');

test('loads the app shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Tuole/);
  await expect(page.locator('#appMain')).toBeAttached();
});
