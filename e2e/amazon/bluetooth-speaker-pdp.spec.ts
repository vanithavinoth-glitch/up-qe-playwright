import { expect, test, type Page } from '@playwright/test';

test.describe('Amazon India Public Search', () => {
  test('C9078552 - Search Bluetooth speaker, open first product and verify title, price and Add to Cart', async ({ page }) => {
    await page.goto('https://www.amazon.in/');
    await failIfBlocked(page);

    const searchbox = page.getByRole('searchbox', { name: 'Search Amazon.in' });
    await expect(searchbox).toBeVisible();
    await searchbox.fill('Bluetooth speaker');
    await searchbox.press('Enter');

    await expect(page).toHaveURL(/\/s\?.*k=bluetooth(?:\+|%20)speaker/i);
    const firstOrganic = page
      .locator('[data-component-type="s-search-result"]')
      .filter({ hasNotText: 'Sponsored' })
      .first();
    await expect(firstOrganic).toBeVisible();

    const productLink = firstOrganic.locator('a:has(h2)').first();
    await expect(productLink).toBeVisible();
    let pdp: Page = page;
    if ((await productLink.getAttribute('target')) === '_blank') {
      const popupPromise = page.waitForEvent('popup');
      await productLink.click();
      pdp = await popupPromise;
    } else {
      await productLink.click();
    }

    await expect(pdp).toHaveURL(/\/dp\//);
    await failIfBlocked(pdp);

    const title = pdp.locator('#productTitle');
    await expect(title).toBeVisible();
    await expect(title).toContainText(/\S/);

    const priceWhole = pdp.locator('#corePriceDisplay_desktop_feature_div .a-price-whole').first();
    await expect(priceWhole).toBeVisible();
    await expect(priceWhole).toContainText(/\d/);
    await expect(pdp.locator('#corePriceDisplay_desktop_feature_div .a-price-symbol').first()).toHaveText('₹');

    await expect(pdp.getByRole('button', { name: 'Add to cart', exact: true })).toBeVisible();
  });
});

async function failIfBlocked(page: Page): Promise<void> {
  const accessBarrier = page.getByText(
    /robot check|captcha|type the characters you see|enter the characters you see|verify you are human|access denied|consent required/i,
  );
  if (await accessBarrier.isVisible().catch(() => false)) {
    throw new Error('BLOCKED: Amazon presented a verification or access barrier; no bypass was attempted.');
  }
}
