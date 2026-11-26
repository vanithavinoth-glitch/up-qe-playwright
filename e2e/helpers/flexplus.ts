import { expect, type Locator, type Page } from '@playwright/test';
import 'dotenv/config';

/**
 * Shared FlexPlus helpers. Generated specs MUST import these instead of
 * writing their own navigation / login code (see .qa-memory/procedural/qa-standards.md).
 *
 * FlexPlus is a hash-routed SPA: https://<host>/flex-plus/#/pages/<route>
 * Routes are passed WITHOUT a leading '#', e.g. '/pages/sched/vpp'.
 */

export const QA_HOST = 'qa-test-flexkiosk.ks.autogridsystems.net';

/** A page heading/landmark that proves each route really rendered (not just that the URL changed). */
export const LANDMARKS: Record<string, string> = {
  '/pages/sched/vpp': 'Market VPP Products',
  '/pages/programs': 'Add program',
  '/pages/monitoring': 'Service points', // heading text is one combined node: "Monitoring Program Service points Devices"
};

export function appUrl(): string {
  const raw = process.env.APP_URL;
  if (!raw) throw new Error('APP_URL is required (set it in .env).');
  const url = new URL(raw);
  if (url.hostname !== QA_HOST) {
    throw new Error(`APP_URL must target the FlexPlus QA host ${QA_HOST}, got ${url.hostname}.`);
  }
  return raw;
}

/** Build a hash-route URL. Accepts '/pages/x', '#/pages/x' or '/#/pages/x'. */
export function routeUrl(route: string): string {
  const clean = route.replace(/^\/?#?/, '').replace(/^\/?/, '/');
  const url = new URL(appUrl());
  url.hash = clean; // URL adds the single leading '#'
  return url.toString();
}

/** Text locator that ignores hidden duplicates (e.g. collapsed nav dropdown items with the same label). */
export function visibleText(page: Page, text: string): Locator {
  return page.getByText(text).filter({ visible: true }).first();
}

/** Navigate to a route and wait until the app has actually rendered it. */
export async function openRoute(page: Page, route: string, landmark?: string): Promise<void> {
  const clean = route.replace(/^\/?#?/, '').replace(/^\/?/, '/');
  await page.goto(routeUrl(clean));
  await expect(page).toHaveURL(new RegExp(`#${clean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
  await expect(page.getByRole('textbox', { name: 'Username' })).toHaveCount(0); // not bounced to login
  const text = landmark ?? LANDMARKS[clean];
  if (text) await expect(visibleText(page, text)).toBeVisible();
}

/** Log in through the UI. Used only by auth.setup.ts and the login tests. */
export async function login(page: Page): Promise<void> {
  const { APP_USERNAME, APP_PASSWORD } = process.env;
  if (!APP_USERNAME || !APP_PASSWORD) throw new Error('APP_USERNAME and APP_PASSWORD must be set in .env.');
  await page.goto(appUrl());
  await page.getByRole('textbox', { name: 'Username' }).fill(APP_USERNAME);
  await page.getByRole('textbox', { name: 'Password' }).fill(APP_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/#\/pages\/sched\/vpp/);
}

/** The primary navigation is collapsed behind the hamburger button; open it so the module links are visible. */
export async function openNav(page: Page): Promise<void> {
  const dashboard = page.getByRole('link', { name: 'Dashboard', exact: true });
  if (!(await dashboard.isVisible())) await page.getByRole('navigation').getByRole('button').first().click();
  await expect(dashboard).toBeVisible();
}

/** Retrying visibility check for a list of visible texts (no count()-based assertions). */
export async function expectTextsVisible(page: Page, texts: string[]): Promise<void> {
  for (const text of texts) {
    await expect(visibleText(page, text), `"${text}" should be visible`).toBeVisible();
  }
}

/** Retrying check that at least one of the locators becomes visible (e.g. chart OR "No data"). */
export async function expectAnyVisible(...locators: Locator[]): Promise<void> {
  await expect
    .poll(async () => {
      for (const l of locators) if (await l.first().isVisible().catch(() => false)) return true;
      return false;
    })
    .toBe(true);
}

/** Unique, identifiable name for records created in QA. */
export function qaName(label: string): string {
  return `QA_AUTO_${Date.now()}_${label}`;
}
