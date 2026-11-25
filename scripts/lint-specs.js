#!/usr/bin/env node
/**
 * Lints generated FlexPlus specs against .qa-memory/procedural/qa-standards.md.
 * Usage: node scripts/lint-specs.js [dir]   (default e2e/flexplus)  exit 1 on violations.
 */
const fs = require('fs');
const path = require('path');
const dir = process.argv[2] || 'e2e/flexplus';
const RULES = [
  [/from\s+['"]@playwright\/test['"]/, "import { test, expect } from '../helpers/fixtures' instead of '@playwright/test'"],
  [/expect\(.*\.count\(\)/, 'count() inside expect does not auto-wait: use toBeVisible/toHaveCount/expectAnyVisible'],
  [/await\s+[\w.]*locator\([^)]*\)\.count\(\)\s*;?[\s\S]{0,80}expect\(/, 'count() snapshot followed by expect: use a retrying assertion'],
  [/waitForTimeout\s*\(/, 'no fixed sleeps: use web-first assertions'],
  [/test\.skip\s*\(\s*true/, "test.skip(true, ...) is banned: implement the case or use test.fixme with a reason"],
  [/if\s*\(\s*id\s*===/, 'no per-case if (id === ...) dispatcher: one test() per case'],
  [/['"`]\/#\/pages/, "hand-built hash routes are banned: use openRoute(page, '/pages/...')"],
  [/storageState(?!\s*:\s*\{\s*cookies:\s*\[\])/, 'storageState does not work on this tenant: use the fixtures login (an EMPTY state for an unauthenticated context is allowed)'],
  [/\.goto\(\s*(process\.env\.APP_URL|appUrl)/, 'do not navigate to APP_URL directly in tests: use openRoute (login-page tests may use appUrl() in a fresh context)', (f, src) => !/fresh|newContext/.test(src)],
  [/APP_PASSWORD\s*[:=]\s*['"][^'"]+['"]/, 'hardcoded password'],
];
const files = [];
(function walk(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p) : /\.spec\.ts$/.test(e.name) && files.push(p);
  }
})(dir);
let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  src.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // ignore comments
    for (const [re, msg, applies] of RULES) {
      if (re.test(line) && (!applies || applies(f, src))) { bad++; console.error(`${f}:${i + 1}: ${msg}`); }
    }
  });
  if (!/from\s+['"]\.\.\/helpers\/fixtures['"]/.test(src)) { bad++; console.error(`${f}:1: must import { test, expect } from '../helpers/fixtures'`); }
  const titles = [...src.matchAll(/\btest(?:\.fixme)?\(\s*[`'"](.+?)[`'"]/g)].map((m) => m[1]);
  titles.filter((t) => !/^C\d+ - /.test(t)).forEach((t) => { bad++; console.error(`${f}: test title must start with its TestRail ID ("C123 - ..."): "${t}"`); });
}
if (!files.length) { console.error(`no specs found in ${dir}`); process.exit(1); }
if (bad) { console.error(`lint FAILED: ${bad} violation(s) in ${files.length} file(s)`); process.exit(1); }
console.log(`lint OK (${files.length} spec file(s))`);
