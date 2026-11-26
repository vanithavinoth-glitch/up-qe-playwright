#!/usr/bin/env node
/**
 * Preflight: fail fast before generating or running specs.
 * Usage: node scripts/preflight.js [--offline]    (exit 1 on any failure)
 * Checks env, required files, journeys validator, spec lint and (unless --offline) QA host reachability.
 */
const fs = require('fs');
const https = require('https');
const { spawnSync } = require('child_process');
try { require('dotenv').config({ quiet: true }); } catch (_) {}
const offline = process.argv.includes('--offline');
const fails = [];
const ok = (m) => console.log('  ok   ' + m);
const bad = (m) => { fails.push(m); console.error('  FAIL ' + m); };

for (const v of ['APP_URL', 'APP_USERNAME', 'APP_PASSWORD']) (process.env[v] ? ok : bad)(`env ${v}` + (process.env[v] ? '' : ' is missing in .env'));
if (process.env.APP_URL && new URL(process.env.APP_URL).hostname !== 'qa-test-flexkiosk.ks.autogridsystems.net') bad('APP_URL is not the confirmed QA host');
for (const f of ['e2e/helpers/flexplus.ts', 'e2e/helpers/fixtures.ts', 'e2e/helpers/data.ts', 'e2e/seed.spec.ts', 'user_journeys.json', '.qa-memory/working/approved-testrail-cases.json', '.qa-memory/procedural/qa-standards.md']) {
  (fs.existsSync(f) ? ok : bad)(`file ${f}` + (fs.existsSync(f) ? '' : ' is missing'));
}
for (const [name, cmd] of [['journeys validator', ['scripts/validate-journeys.js']], ['spec lint', ['scripts/lint-specs.js']]]) {
  const r = spawnSync('node', cmd, { encoding: 'utf8' });
  (r.status === 0 ? ok : bad)(`${name}` + (r.status === 0 ? '' : '\n' + (r.stderr || r.stdout).split('\n').slice(0, 8).join('\n')));
}
const finish = () => { if (fails.length) { console.error(`preflight FAILED (${fails.length})`); process.exit(1); } console.log('preflight OK'); };
if (offline || !process.env.APP_URL) { finish(); } else {
  const u = new URL(process.env.APP_URL);
  const req = https.get({ host: u.host, path: u.pathname, timeout: 15000 }, (res) => {
    (res.statusCode < 500 ? ok : bad)(`QA host reachable (HTTP ${res.statusCode})`); res.resume(); finish();
  });
  req.on('timeout', () => { req.destroy(); bad('QA host timed out (environment blip? retry before blaming specs)'); finish(); });
  req.on('error', (e) => { bad(`QA host unreachable: ${e.code || e.message} (environment blip? retry before blaming specs)`); finish(); });
}
