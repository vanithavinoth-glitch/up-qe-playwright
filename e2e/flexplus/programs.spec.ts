import { expect, test } from '../helpers/fixtures';
import { createProgram, fillProgram, openAddProgram } from '../helpers/data';
import { openRoute } from '../helpers/flexplus';

// Programs module. Verified facts: user_journeys.json > Programs > forms[0].
// TC-016 (search) and the persistence check of TC-018 are intentionally NOT here yet:
// the search box behavior has not been verified against the live app.

test.describe('FlexPlus Programs', () => {
  test('C9075736 - Browse the Programs list', async ({ page }) => {
    await openRoute(page, '/pages/programs');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Showing \d+ of [\d,]+ programs/).first()).toBeVisible();
    for (const name of ['Program', 'ID', 'Type', 'Status', 'Alerts', 'Subscriptions', 'Market products', 'Actions']) {
      await expect(page.getByRole('columnheader', { name, exact: true })).toBeVisible();
    }
    await expect(page.getByText(/Per page/)).toBeVisible();
    await expect(page.getByRole('row')).not.toHaveCount(1); // header + at least one program row
  });

  test('C9075738 - Review the Add Program form without saving', async ({ page }) => {
    await openRoute(page, '/pages/programs');
    await page.waitForLoadState('networkidle');
    const before = await page.getByText(/Showing \d+ of [\d,]+ programs/).first().innerText();
    const dlg = await openAddProgram(page);
    for (const label of ['Identifier', 'Name', 'Program type', 'Time Zone', 'Description', 'Program overview']) {
      await expect(dlg.getByText(label).first()).toBeVisible();
    }
    for (const name of ['Display on engage', 'Device Model Filtering Enabled', 'Auto Assign Contacts at SP/Device']) {
      await expect(dlg.getByRole('checkbox', { name })).toBeVisible();
    }
    await expect(dlg.getByRole('button', { name: '(Select a program type)' })).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'America/Vancouver' })).toBeVisible();
    await dlg.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(before)).toBeVisible(); // nothing was created
  });

  test('C9075739 - Create and persist a QA Program', async ({ page }) => {
    const identifier = await createProgram(page, 'Program');
    expect(identifier).toMatch(/^QA_AUTO_\d+_Program$/);
    // Persistence check (search/open the record) is added once search behavior is verified.
  });

  test('C9075740 - Reject missing Program fields and a duplicate Program identifier', async ({ page }) => {
    // Missing fields: no client-side validation; the server rejects an empty submit.
    let dlg = await openAddProgram(page);
    await dlg.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Add resource failed')).toBeVisible();
    await expect(page.getByText(/Could not find template with type equal to/)).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Duplicate: create a program in this test's own setup, then try the same identifier again.
    const identifier = await createProgram(page, 'DupProgram');
    dlg = await openAddProgram(page);
    await fillProgram(page, dlg, { identifier });
    await dlg.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Add resource failed')).toBeVisible();
    await expect(page.getByText(/already exists/)).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(identifier).toMatch(/^QA_AUTO_/);
  });
});
