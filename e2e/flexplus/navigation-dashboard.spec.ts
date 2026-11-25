import { expect, test } from '../helpers/fixtures';
import { appUrl, expectAnyVisible, expectTextsVisible, openNav, openRoute } from '../helpers/flexplus';

// Reference pattern for generated FlexPlus specs:
//  - logged-in session comes from the worker-scoped fixture (helpers/fixtures.ts) -> every test gets its own fresh page
//  - navigation via openRoute() which verifies rendered content
//  - only retrying assertions (expect(locator)..., expect.poll)

test.describe('FlexPlus navigation and VPP dashboard', () => {
  test('C9075722 - Navigate to FlexPlus sign-in page', async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await ctx.newPage();
    await page.goto(appUrl());
    await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
    await ctx.close();
  });

  test('C9075723 - Sign in with the configured QA account', async ({ page }) => {
    await openRoute(page, '/pages/sched/vpp');
    await expect(page.getByText('Market VPP Products', { exact: true }).first()).toBeVisible();
  });

  test('C9075725 - Verify primary module navigation', async ({ page }) => {
    await openRoute(page, '/pages/sched/vpp');
    await openNav(page);
    for (const name of ['Dashboard', 'Monitoring', 'Programs', 'Resources', 'Energy markets', 'Reports', 'Messaging']) {
      await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
    }
  });

  test('C9075726 - Open every primary module and visible submenu', async ({ page }) => {
    const routes = [
      '/pages/sched/vpp', '/pages/monitoring', '/pages/programs',
      '/pages/resources/accounts', '/pages/energymarkets',
      '/pages/reports/events', '/pages/messages/dashboard',
    ];
    for (const route of routes) {
      await openRoute(page, route);
    }
  });

  test('C9075728 - Review the Market VPP Products dashboard', async ({ page }) => {
    await openRoute(page, '/pages/sched/vpp');
    await expect(page.getByText('Market VPP Products', { exact: true }).first()).toBeVisible();
  });

  test('C9075729 - Verify VPP dashboard selectors and controls', async ({ page }) => {
    await openRoute(page, '/pages/sched/vpp');
    for (const name of ['Market products', 'Events List', 'Chart layers']) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /Refresh/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export to CSV/ })).toBeVisible();
  });

  test('C9075730 - Verify VPP graph data and empty states', async ({ page }) => {
    await openRoute(page, '/pages/sched/vpp');
    await expectAnyVisible(
      page.locator('svg, canvas, [role="img"]'),
      page.getByText(/No data/i),
    );
  });

  test('C9075732 - Inspect Program Service Points and Devices monitoring views', async ({ page }) => {
    await openRoute(page, '/pages/monitoring');
    await expectTextsVisible(page, ['Program', 'Service points', 'Devices']);
  });

  test('C9075733 - Verify Monitoring Program context and graph states', async ({ page }) => {
    await openRoute(page, '/pages/monitoring');
    await expectTextsVisible(page, ['Program']);
  });
});
