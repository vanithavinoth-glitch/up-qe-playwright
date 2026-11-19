import { expect, test } from '@playwright/test';

test.describe('Amazon India Public Search', () => {
  test('C9075705 - Search for wireless mouse and verify relevant search results', async ({ page }) => {
    await page.goto('https://www.amazon.in/');

    const accessBarrier = page.getByText(
      /robot check|captcha|type the characters you see|enter the characters you see|verify you are human|access denied|consent required/i,
    );
    if (await accessBarrier.isVisible().catch(() => false)) {
      throw new Error('BLOCKED: Amazon presented a verification or access barrier; no bypass was attempted.');
    }

    const searchbox = page.getByRole('searchbox', { name: 'Search Amazon.in' });
    await expect(searchbox).toBeVisible();
    await searchbox.fill('wireless mouse');
    await searchbox.press('Enter');

    await expect(page).toHaveURL(/\/s\?.*k=wireless(?:\+|%20)mouse/);
    await expect(searchbox).toHaveValue('wireless mouse');

    const results = page.locator('[data-component-type="s-search-result"]')
      .filter({ hasText: /wireless mouse/i });
    await expect(results.first()).toBeVisible();
  });
});
