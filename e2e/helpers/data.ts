import { expect, type Locator, type Page } from '@playwright/test';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { openRoute, qaName } from './flexplus';

/**
 * Test-data helpers. Tests must create the records they need (named QA_AUTO_<timestamp>_<label>)
 * instead of relying on pre-set QA_* environment variables or on another test having run first.
 * Every created record is logged to .qa-memory/working/qa-auto-records.json for later cleanup.
 * Cleanup must only ever touch records listed there.
 */
const RECORDS = '.qa-memory/working/qa-auto-records.json';

export function recordCreated(kind: string, identifier: string): void {
  mkdirSync('.qa-memory/working', { recursive: true });
  const list: unknown[] = existsSync(RECORDS) ? JSON.parse(readFileSync(RECORDS, 'utf8')) : [];
  list.push({ kind, identifier, created_at: new Date().toISOString() });
  writeFileSync(RECORDS, JSON.stringify(list, null, 2));
}

export function dialog(page: Page): Locator {
  return page.locator('[role=dialog]').filter({ visible: true }).first();
}

/** Open the Add Program dialog. Waits for the page to settle first: opening it too early shows a transient error panel. */
export async function openAddProgram(page: Page): Promise<Locator> {
  await openRoute(page, '/pages/programs', 'Add program');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Add program/i }).click();
  const dlg = dialog(page);
  await expect(dlg.getByRole('button', { name: 'Submit' })).toBeVisible({ timeout: 20_000 });
  return dlg;
}

export interface ProgramInput {
  identifier: string;
  type?: string; // exact option text from the Program type menu
}

/** Fill the Add Program form (does not submit). */
export async function fillProgram(page: Page, dlg: Locator, input: ProgramInput): Promise<void> {
  await dlg.getByRole('textbox', { name: /Identifier/ }).fill(input.identifier);
  await dlg.getByRole('textbox', { name: 'Name' }).fill(input.identifier);
  await dlg.getByRole('button', { name: '(Select a program type)' }).click();
  await page.getByText(input.type ?? 'DR - Time of Use', { exact: true }).filter({ visible: true }).first().click();
  await dlg.getByRole('textbox', { name: 'Description' }).fill('QA_AUTO synthetic description');
  await dlg.getByRole('textbox', { name: 'Program overview' }).fill('QA_AUTO synthetic overview');
}

/** Create a QA_AUTO program through the UI and return its identifier. */
export async function createProgram(page: Page, label = 'Program'): Promise<string> {
  const identifier = qaName(label);
  const dlg = await openAddProgram(page);
  await fillProgram(page, dlg, { identifier });
  await dlg.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Operation successful')).toBeVisible({ timeout: 20_000 });
  recordCreated('program', identifier);
  await page.getByRole('button', { name: 'OK' }).click();
  return identifier;
}
