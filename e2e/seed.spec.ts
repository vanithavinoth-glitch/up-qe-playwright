import { test, expect } from './helpers/fixtures';
import { openRoute } from './helpers/flexplus';

// Seed for FlexPlus planner / generator agents.
// The page fixture is already signed in (APP_URL, APP_USERNAME, APP_PASSWORD from .env;
// see helpers/fixtures.ts). The seed lands on the VPP dashboard; agents explore from here.
// Generated specs: import { test, expect } from '../helpers/fixtures' and use ../helpers/flexplus.
// For sign-in / logged-out scenarios, open a fresh context instead:
//   const ctx = await browser.newContext(); const page = await ctx.newPage(); await page.goto(appUrl());
test.describe('FlexPlus seed', () => {
  test('seed', async ({ page }) => {
    await openRoute(page, '/pages/sched/vpp');
    await expect(page.getByText('Market VPP Products', { exact: true }).first()).toBeVisible();
  });
});
