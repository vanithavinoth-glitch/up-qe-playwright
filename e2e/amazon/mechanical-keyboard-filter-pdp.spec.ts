import { expect, test, type Page } from '@playwright/test';

test.describe('Amazon India Mechanical Keyboard Search', () => {
  test('C9078252 - Search mechanical keyboard with 4 Stars & Up filter and verify first product details', async ({ page }) => {
    await page.goto('https://www.amazon.in/');
    await failIfBlocked(page);

    const searchbox = page.getByRole('searchbox', { name: 'Search Amazon.in' });
    await expect(searchbox).toBeVisible();
    await searchbox.fill('mechanical keyboard');
    await searchbox.press('Enter');

    await expect(page).toHaveURL(/\/s\?.*k=mechanical(?:\+|%20)keyboard/);
    const firstResults = page.locator('[data-component-type="s-search-result"]').first();
    await expect(firstResults).toBeVisible();

    const ratingFilter = page.locator('#reviewsRefinements').getByRole('link', { name: '4 Stars & Up' });
    await expect(ratingFilter).toBeVisible();
    await ratingFilter.click();
    await expect(page).toHaveURL(/rh=.*p_72%3A1318476031/);
    await expect(page).toHaveTitle(/Mechanical Keyboard - 4 Stars & Up/i);
    await failIfBlocked(page);

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
