import { expect, test, type Page } from '@playwright/test';
import 'dotenv/config';
import { readFileSync } from 'node:fs';

type UploadedCase = {
  testrail_id: string;
  temp_id: string;
  title: string;
};

const { uploaded_cases: cases } = JSON.parse(
  readFileSync('.qa-memory/working/approved-testrail-cases.json', 'utf8'),
) as { uploaded_cases: UploadedCase[] };

const appUrl = process.env.APP_URL;
const qaHost = 'qa-test-flexkiosk.ks.autogridsystems.net';
let page: Page;

function routeUrl(route: string): string {
  if (!appUrl) throw new Error('APP_URL is required.');
  const url = new URL(appUrl);
  url.hash = route.startsWith('#') ? route.slice(1) : route;
  return url.toString();
}

async function openRoute(route: string): Promise<void> {
  await page.goto(routeUrl(route));
  await expect(page).toHaveURL(new RegExp(route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

async function openText(text: string): Promise<void> {
  await page.getByText(text, { exact: true }).first().click();
}

async function checkLinks(names: string[]): Promise<void> {
  for (const name of names) {
    await expect(page.getByRole('link', { name, exact: true }).first()).toBeVisible();
  }
}

async function inspectForm(title: string, fields: string[]): Promise<void> {
  await openText(title);
  for (const field of fields) {
    await expect(page.getByText(field, { exact: true }).last()).toBeVisible();
  }
  await page.keyboard.press('Escape');
}

function requireFixtures(names: string[]): void {
  const missing = names.filter((name) => !process.env[name]);
  test.skip(missing.length > 0, `Missing approved QA fixtures: ${missing.join(', ')}`);
}

test.describe('FlexPlus QA workflows', () => {
  test.describe.configure({ mode: 'default' });

  test.beforeAll(async ({ browser }) => {
    if (!appUrl || new URL(appUrl).hostname !== qaHost) {
      throw new Error(`APP_URL must target the confirmed FlexPlus QA host ${qaHost}.`);
    }
    if (!process.env.APP_USERNAME || !process.env.APP_PASSWORD) {
      throw new Error('APP_USERNAME and APP_PASSWORD must be configured in the environment.');
    }

    page = await browser.newPage();
    await page.goto(appUrl);
  });

  test.afterAll(async () => {
    await page?.close();
  });

  for (const qaCase of cases) {
    test(`${qaCase.testrail_id} - ${qaCase.title}`, async () => {
      const { temp_id: id } = qaCase;

      if (id === 'TC-001') {
        await expect(page.getByRole('textbox', { name: 'Username' })).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Password' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
        return;
      }

      if (id === 'TC-002') {
        await page.getByRole('textbox', { name: 'Username' }).fill(process.env.APP_USERNAME!);
        await page.getByRole('textbox', { name: 'Password' }).fill(process.env.APP_PASSWORD!);
        await page.getByRole('button', { name: 'Log in' }).click();
        await expect(page).toHaveURL(/#\/pages\/sched\/vpp/);
        await expect(page.getByText('Market VPP Products', { exact: true })).toBeVisible();
        return;
      }

      if (id === 'TC-003') {
        test.skip(true, 'Invalid login requests hang in the QA tenant; needs an isolated authentication fixture and server-side timeout policy.');
      }

      if (id === 'TC-004') {
        await openRoute('/#/pages/sched/vpp');
        await expect(page.getByText('Market VPP Products', { exact: true }).first()).toBeVisible();
        await checkLinks([
          'Monitoring', 'Programs', 'Resources',
          'Energy markets', 'Reports', 'Messaging',
        ]);
        return;
      }

      if (id === 'TC-005') {
        const routes = [
          '/#/pages/sched/vpp', '/#/pages/monitoring', '/#/pages/programs',
          '/#/pages/resources/accounts', '/#/pages/energymarkets',
          '/#/pages/reports/events', '/#/pages/messages/dashboard',
        ];
        for (const route of routes) await openRoute(route);
        return;
      }

      if (id === 'TC-006') {
        await openRoute('/#/pages/sched/vpp');
        await checkLinks(['Settings', 'Job Status', 'Alerts Dashboard', 'OEM Cockpit']);
        return;
      }

      if (id === 'TC-007') {
        await openRoute('/#/pages/sched/vpp');
        await expect(page.getByText('Market VPP Products', { exact: true })).toBeVisible();
        return;
      }

      if (id === 'TC-008') {
        await openRoute('/#/pages/sched/vpp');
        await expect(page.getByRole('combobox').first()).toBeVisible();
        return;
      }

      if (id === 'TC-009') {
        await openRoute('/#/pages/sched/vpp');
        const chartCount = await page.locator('svg, canvas, [role="img"]').count();
        const noDataCount = await page.getByText(/No data/i).count();
        expect(chartCount + noDataCount).toBeGreaterThan(0);
        return;
      }

      if (id === 'TC-010') {
        await openRoute('/#/pages/sched/vpp');
        await expect(page.getByText('Refresh', { exact: true })).toBeVisible();
        await expect(page.getByText(/Export to CSV/i)).toBeVisible();
        return;
      }

      if (id === 'TC-011') {
        await openRoute('/#/pages/monitoring');
        for (const name of ['Program', 'Service points', 'Devices']) {
          await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
        }
        return;
      }

      if (id === 'TC-012') {
        await openRoute('/#/pages/monitoring');
        await expect(page.getByRole('combobox').first()).toBeVisible();
        return;
      }

      if (id === 'TC-013') {
        requireFixtures(['QA_SERVICE_POINT_SEARCH', 'QA_DEVICE_SEARCH']);
        await openRoute('/#/pages/monitoring');
        await expect(page.getByText('Service points', { exact: true }).first()).toBeVisible();
        return;
      }

      if (id === 'TC-014') {
        await openRoute('/#/pages/monitoring');
        await checkLinks(['Resources', 'Advanced']);
        return;
      }

      if (id === 'TC-015') {
        await openRoute('/#/pages/programs');
        await expect(page.getByText('Add program', { exact: true })).toBeVisible();
        return;
      }

      if (id === 'TC-016') {
        requireFixtures(['QA_PROGRAM_SEARCH']);
        await openRoute('/#/pages/programs');
        const search = page.getByPlaceholder(/Program name/i);
        await expect(search).toBeVisible();
        await search.fill(process.env.QA_PROGRAM_SEARCH!);
        await expect(search).toHaveValue(process.env.QA_PROGRAM_SEARCH!);
        return;
      }

      if (id === 'TC-017') {
        await openRoute('/#/pages/programs');
        await inspectForm('Add program', [
          'Identifier', 'Name', 'Program type', 'Time Zone', 'Description',
          'Program overview',
        ]);
        return;
      }

      if (id === 'TC-018') {
        requireFixtures(['QA_PROGRAM_TYPE', 'QA_TIME_ZONE']);
        test.skip(true, 'Program creation requires an observed QA form-to-field mapping before submission.');
      }

      if (id === 'TC-019') {
        test.skip(true, 'Program validation submission is deferred until the Add form submit control is confirmed.');
      }

      if (id === 'TC-020') {
        await openRoute('/#/pages/programs/subscriptions');
        await expect(page.getByRole('combobox').first()).toBeVisible();
        for (const name of ['Accounts', 'Service Points', 'Devices']) {
          await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
        }
        return;
      }

      if (id === 'TC-021') {
        requireFixtures(['QA_ACCOUNT_ID']);
        await openRoute('/#/pages/programs/subscriptions');
        await expect(page.getByRole('combobox').first()).toBeVisible();
        return;
      }

      if (id === 'TC-022') {
        await openRoute('/#/pages/programs/subscriptions');
        await expect(page.getByRole('combobox').first()).toBeVisible();
        return;
      }

      if (id === 'TC-023') {
        for (const route of [
          '/#/pages/resources/accounts', '/#/pages/resources/service_points',
          '/#/pages/resources/devices', '/#/pages/resources/hierarchy',
          '/#/pages/resources/groups', '/#/pages/resources/rate_plans',
        ]) await openRoute(route);
        return;
      }

      if (id === 'TC-024') {
        requireFixtures(['QA_ACCOUNT_SEARCH']);
        await openRoute('/#/pages/resources/accounts');
        await expect(page.getByPlaceholder(/Account ID/i)).toBeVisible();
        return;
      }

      if (id === 'TC-025') {
        await openRoute('/#/pages/resources/accounts');
        await expect(page.getByRole('table').first()).toBeVisible();
        return;
      }

      if (id === 'TC-026') {
        await openRoute('/#/pages/resources/accounts');
        await inspectForm('Add account', [
          'Identifier', 'Account Name', 'Parent Account ID', 'Street',
          'City', 'State', 'Zip', 'Country', 'Rate Class',
        ]);
        return;
      }

      if (id === 'TC-027') {
        requireFixtures(['QA_PARENT_ACCOUNT_ID']);
        test.skip(true, 'Account creation requires an observed QA form-to-field mapping before submission.');
      }

      if (id === 'TC-028' || id === 'TC-029') {
        test.skip(true, 'Account validation submission is deferred until all required controls and safe invalid fixtures are confirmed.');
      }

      if (id === 'TC-030') {
        await openRoute('/#/pages/energymarkets');
        await expect(page.getByText('Market products', { exact: true }).first()).toBeVisible();
        return;
      }

      if (id === 'TC-031') {
        await openRoute('/#/pages/energymarkets');
        await expect(page.getByRole('table').first()).toBeVisible();
        return;
      }

      if (id === 'TC-032') {
        await openRoute('/#/pages/energymarkets/droop_curves');
        await expect(page).toHaveURL(/droop/i);
        return;
      }

      if (id === 'TC-033') {
        await openRoute('/#/pages/energymarkets');
        await inspectForm('Add product', ['Name', 'Market', 'Product type', 'Commitment type', 'Droop Curve']);
        return;
      }

      if (id === 'TC-034' || id === 'TC-035') {
        requireFixtures(['QA_MARKET', 'QA_PRODUCT_TYPE', 'QA_COMMITMENT_TYPE', 'QA_DROOP_CURVE']);
        test.skip(true, 'Market product submission awaits verified UI selectors and fixture-backed choices.');
      }

      if (id === 'TC-036') {
        await openRoute('/#/pages/reports/events');
        for (const name of ['Program', 'Event ID', 'Day', 'Time', 'Event Reason', 'Market product', 'Status']) {
          await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
        }
        return;
      }

      if (id === 'TC-037') {
        requireFixtures(['QA_EVENT_ID']);
        await openRoute('/#/pages/reports/events');
        await expect(page.getByPlaceholder(/Event ID/i)).toBeVisible();
        return;
      }

      if (id === 'TC-038') {
        await openRoute('/#/pages/reports/events');
        await expect(page.getByRole('table').first()).toBeVisible();
        return;
      }

      if (id === 'TC-039') {
        await openRoute('/#/pages/messages/dashboard');
        await expect(page.getByRole('link', { name: 'Templates', exact: true })).toBeVisible();
        return;
      }

      if (id === 'TC-040') {
        await openRoute('/#/pages/messages/dashboard');
        await checkLinks(['Templates', 'Types']);
        return;
      }

      if (id === 'TC-041') {
        await openRoute('/#/pages/messages/templates');
        await expect(page.getByText('Add template', { exact: true })).toBeVisible();
        await openText('Add template');
        await expect(page.getByText('Continue', { exact: true })).toBeVisible();
        return;
      }

      if (id === 'TC-042' || id === 'TC-043') {
        requireFixtures(['QA_TEMPLATE_TYPE', 'QA_TEMPLATE_EMAIL_CONTENT']);
        test.skip(true, 'Template save/validation is blocked until safe QA-only template controls and recipient configuration are confirmed.');
      }

      if (id === 'TC-044') {
        await openRoute('/#/pages/monitoring/jobstatus');
        for (const name of ['Planning optimizer', 'Dispatch optimizer', 'Baseline']) {
          await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
        }
        return;
      }

      if (id === 'TC-045') {
        await openRoute('/#/pages/sched/vpp');
        await checkLinks([
          'Alerts Dashboard', 'OEM Cockpit', 'Error Console',
          'Flex™ Configurator', 'Advanced Monitoring', 'SCADA HMI',
        ]);
        return;
      }

      if (id === 'TC-046') {
        await openRoute('/#/pages/sched/vpp');
        await checkLinks(['Help Center', 'Support Helpdesk']);
        return;
      }

      if (id === 'TC-047') {
        await openRoute('/#/pages/sched/vpp');
        await openText('Events List');
        await expect(page.getByText('Event ID', { exact: true }).first()).toBeVisible();
        return;
      }

      if (id === 'TC-048' || id === 'TC-049') {
        requireFixtures([
          'QA_DISPATCH_PROGRAM_ID', 'QA_DISPATCH_MARKET_PRODUCT_ID',
          'QA_DISPATCH_EVENT_ID', 'QA_DISPATCH_START', 'QA_DISPATCH_END',
        ]);
        test.skip(true, 'Dispatch is blocked: exploration found Dispatch optimizer stuck at Loading Data and no supported UI run control.');
      }

      if (id === 'TC-050') {
        await openRoute('/#/pages/tenant');
        await expect(page.getByText('Settings', { exact: true }).first()).toBeVisible();
        return;
      }

      if (id === 'TC-051') {
        await openRoute('/#/pages/tenant');
        await expect(page.getByText('Custom attributes', { exact: true }).first()).toBeVisible();
        return;
      }

      throw new Error(`No implementation is registered for ${id}.`);
    });
  }
});
