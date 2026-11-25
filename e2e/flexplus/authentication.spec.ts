import { expect, test } from '../helpers/fixtures';
import { login } from '../helpers/flexplus';

test('C9078082 - Sign in and reach the VPP dashboard', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await login(page);
    await expect(page.getByText('Market VPP Products', { exact: true }).first()).toBeVisible();
  } finally {
    await context.close();
  }
});