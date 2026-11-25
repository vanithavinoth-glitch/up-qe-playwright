import { test as base, expect, type BrowserContext } from '@playwright/test';
import { login } from './flexplus';

/**
 * FlexPlus test fixtures.
 *
 * Why not storageState / closing the login page? FlexPlus ends the server session
 * (`connect.sid` is dropped) when the logged-in tab is closed, and it rejects a
 * replayed saved session, so a fresh page then boots to a blank screen (503-like).
 * So we log in ONCE per worker and keep that "anchor" tab open for the whole worker;
 * every test gets its own NEW tab in the same context, so one failing test cannot
 * break the rest.
 *
 * Generated specs MUST `import { test, expect } from '../helpers/fixtures'`.
 */
export const test = base.extend<object, { authContext: BrowserContext }>({
  authContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      const anchor = await context.newPage();
      await login(anchor); // anchor stays open until the worker ends
      await use(context);
      await context.close(); // closes the anchor too
    },
    { scope: 'worker' },
  ],
  page: async ({ authContext }, use) => {
    const page = await authContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect };
