// spec: specs/flexplus-login-plan.md
// seed: e2e/seed.spec.ts

import { test, expect } from '../helpers/fixtures';
import { appUrl, openRoute, LANDMARKS } from '../helpers/flexplus';

const VPP_ROUTE = '/pages/sched/vpp';
const VPP_URL_PATTERN = /#\/pages\/sched\/vpp/;

test.describe('FlexPlus Login', () => {
  test('C9080545 - Valid sign-in reaches the VPP dashboard', async ({ page }) => {
    // 1. Use the standard `page` fixture (already authenticated by the worker fixture).
    // 2. Call openRoute(page, '/pages/sched/vpp') — asserts the URL matches #/pages/sched/vpp,
    //    no bounce back to login (Username textbox count 0), and the LANDMARKS landmark.
    await openRoute(page, VPP_ROUTE);

    // 3. The dashboard landmark text "Market VPP Products" (exact, via LANDMARKS) is visible.
    await expect(
      page.getByText(LANDMARKS[VPP_ROUTE], { exact: true }).filter({ visible: true }).first(),
    ).toBeVisible();
  });

  test('C9080546 - Wrong password stays on sign-in page', async ({ browser }) => {
    // Fresh, unauthenticated browser context — do NOT use the authenticated `page` fixture.
    const context = await browser.newContext();
    try {
      const page = await context.newPage();

      // 1. Navigate to appUrl(); the sign-in page renders with Username, Password and Log in.
      await page.goto(appUrl());
      await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();

      // 2. Fill Username with process.env.APP_USERNAME (from .env — never hardcoded).
      const username = process.env.APP_USERNAME;
      if (!username) throw new Error('APP_USERNAME must be set in .env.');
      await page.getByRole('textbox', { name: 'Username' }).fill(username);

      // 3. Fill Password with a deliberately wrong, runtime-derived value (never a stored
      //    secret). Do NOT call login() here — it submits the .env password and asserts success.
      const wrongPassword = `${process.env.APP_PASSWORD ?? 'not-the-real-password'}-wrong`;
      await page.getByRole('textbox', { name: 'Password' }).fill(wrongPassword);

      // 4. Click the Log in button.
      await page.getByRole('button', { name: 'Log in' }).click();

      // Authentication is denied: URL does NOT reach #/pages/sched/vpp.
      await expect(page).not.toHaveURL(VPP_URL_PATTERN);

      // The user remains on the sign-in page — the Username textbox is still visible.
      await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();

      // No authenticated view is exposed: "Market VPP Products" is NOT visible.
      await expect(
        page.getByText(LANDMARKS[VPP_ROUTE], { exact: true }).first(),
      ).not.toBeVisible();
    } finally {
      await context.close();
    }
  });

  test('C9080547 - Empty credentials stay on sign-in page', async ({ browser }) => {
    // Fresh, unauthenticated browser context — do NOT use the authenticated `page` fixture.
    const context = await browser.newContext();
    try {
      const page = await context.newPage();

      // 1. Navigate to appUrl(); the sign-in page renders with Username, Password and Log in.
      await page.goto(appUrl());
      await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();

      // 2. Leave Username and Password empty.
      await expect(page.getByRole('textbox', { name: 'Username' })).toHaveValue('');
      await expect(page.getByRole('textbox', { name: 'Password' })).toHaveValue('');

      // 3. Click the Log in button. If it is disabled with empty fields, the disabled
      //    state itself satisfies the expected result (behavior unknown per REQ-003).
      const logInButton = page.getByRole('button', { name: 'Log in' });
      await expect(logInButton).toBeVisible();
      if (await logInButton.isEnabled()) {
        await logInButton.click();
      }

      // Access is denied: URL does NOT reach #/pages/sched/vpp.
      await expect(page).not.toHaveURL(VPP_URL_PATTERN);

      // The user remains on the sign-in page — the Username textbox is still visible.
      await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();

      // "Market VPP Products" is NOT visible (no assertion on specific error wording).
      await expect(
        page.getByText(LANDMARKS[VPP_ROUTE], { exact: true }).first(),
      ).not.toBeVisible();
    } finally {
      await context.close();
    }
  });
});
