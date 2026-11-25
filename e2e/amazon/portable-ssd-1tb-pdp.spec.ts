// spec: user_journeys.json (UJ-AMZ-004)
// seed: e2e/seed.spec.ts

import { expect, test, type Page } from '@playwright/test';

test.describe('Amazon India Public Search', () => {
  test("C9078561 - Search 'portable ssd 1tb', open first non-sponsored product, verify title and price, add to cart and verify confirmation", async ({ page }) => {
    // 1. Navigate to Amazon India home and verify the search box is visible
    await page.goto('https://www.amazon.in/');
    await failIfBlocked(page);

    const searchbox = page.getByRole('searchbox', { name: 'Search Amazon.in' });
    await expect(searchbox).toBeVisible();

    // 2. Search for 'portable ssd 1tb' and verify results page loads
    await searchbox.fill('portable ssd 1tb');
    await searchbox.press('Enter');

    await expect(page).toHaveURL(/\/s\?.*k=portable(\+|%20)ssd(\+|%20)1tb/i);
    await expect(page.locator('[data-component-type="s-search-result"]').first()).toBeVisible();
    await failIfBlocked(page);

    // 3. Open the first non-sponsored product (link opens in a new tab)
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
      await pdp.waitForLoadState();
    } else {
      await productLink.click();
    }

    await expect(pdp).toHaveURL(/\/dp\//);
    await failIfBlocked(pdp);

    // 4. Verify the product title is visible and non-empty
    // NOTE: must be span#productTitle — bare #productTitle is a strict-mode
    // violation (a hidden input shares the id with the span).
    const title = pdp.locator('span#productTitle');
    await expect(title).toBeVisible();
    await expect(title).toContainText(/\S/);

    // 5. Verify the price (whole part contains digits, symbol is ₹)
    const priceWhole = pdp.locator('#corePriceDisplay_desktop_feature_div .a-price-whole').first();
    await expect(priceWhole).toBeVisible();
    await expect(priceWhole).toContainText(/\d/);
    await expect(pdp.locator('#corePriceDisplay_desktop_feature_div .a-price-symbol').first()).toHaveText('₹');

    // 6. Add the product to the cart
    // exact: true is REQUIRED — non-exact also matches a hidden shortcuts-menu button.
    const addToCart = pdp.getByRole('button', { name: 'Add to cart', exact: true });
    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeEnabled();
    await addToCart.click();

    // 7. Verify the add-to-cart confirmation on the smart-wagon cart page
    await expect(pdp).toHaveURL(/\/cart\/smart-wagon/);
    await expect(pdp.getByRole('heading', { name: 'Added to cart' })).toBeVisible();
    await expect(pdp.locator('#nav-cart-count')).toHaveText('1');
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
