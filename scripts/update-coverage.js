#!/usr/bin/env node
/**
 * Rebuilds .qa-memory/working/case-coverage.json and execution-report.json from
 * .qa-pipeline/logs/playwright-results.json (the config's JSON reporter) + approved-testrail-cases.json.
 * Usage: node scripts/update-coverage.js
 */
const fs = require('fs');
const W = '.qa-memory/working/';
const cases = JSON.parse(fs.readFileSync(W + 'approved-testrail-cases.json', 'utf8')).uploaded_cases;
const res = JSON.parse(fs.readFileSync('.qa-pipeline/logs/playwright-results.json', 'utf8'));
const status = {};
const projectNames = new Set();
(function walk(suites) {
  for (const s of suites || []) {
    for (const sp of s.specs || []) {
      const m = /^(C\d+)/.exec(sp.title);
      if (!m) continue;
      const t = (sp.tests || [])[0] || {};
      if (t.projectName) projectNames.add(t.projectName);
      const st = t.status === 'skipped' ? 'SKIPPED' : sp.ok ? 'PASSED' : 'FAILED';
      status[m[1]] = { status: st, spec_file: 'e2e/' + sp.file, error: st === 'FAILED' ? ((t.results || []).map((r) => r.error && r.error.message).find(Boolean) || '').split('\n')[0].slice(0, 300) : null };
    }
    walk(s.suites);
  }
})(res.suites);
const cov = cases.map((c) => {
  const s = status[c.testrail_id];
  return { testrail_id: c.testrail_id, temp_id: c.temp_id, module: c.module, title: c.title, status: s ? s.status : 'NOT_IMPLEMENTED', spec_file: s ? s.spec_file : null, error: s ? s.error : null };
});
const n = (k) => cov.filter((x) => x.status === k).length;
const summary = { total: cov.length, passed: n('PASSED'), failed: n('FAILED'), skipped: n('SKIPPED'), not_implemented: n('NOT_IMPLEMENTED') };
const prev = fs.existsSync(W + 'case-coverage.json') ? JSON.parse(fs.readFileSync(W + 'case-coverage.json', 'utf8')) : {};
fs.writeFileSync(W + 'case-coverage.json', JSON.stringify({ ...prev, generated_at: new Date().toISOString(), summary, cases: cov }, null, 2));
const overall = summary.passed === summary.total ? 'PASSED' : summary.failed ? 'FAILED' : 'PARTIAL_COVERAGE';
const suite = projectNames.size === 1 ? [...projectNames][0] : projectNames.size ? 'mixed' : 'unknown';
fs.writeFileSync(W + 'execution-report.json', JSON.stringify({
  timestamp: new Date().toISOString(), suite, overall_status: overall, ...summary,
  failed_tests: cov.filter((x) => x.status === 'FAILED').map((x) => ({ test_title: `${x.testrail_id} - ${x.title}`, spec_file: x.spec_file, error_summary: x.error })),
  coverage: W + 'case-coverage.json',
}, null, 2));
console.log(JSON.stringify(summary), 'overall:', overall);
