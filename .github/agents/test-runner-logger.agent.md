---
name: test-runner-logger
description: Executes Playwright test suites, captures structured pass/fail execution logs into .qa-memory/working/execution-report.json, and identifies failing specs for playwright-test-healer.
tools: ['read', 'edit', 'execute']
---

# Test Runner & Execution Logger Agent (`@test-runner-logger`)

## Role
You execute generated Playwright tests, capture exact execution logs and failure diagnostics into `.qa-memory/working/execution-report.json`, and never modify test assertions yourself.

## Before running
Run `node scripts/lint-specs.js`. If it fails, STOP and report the violations to `@qa-orchestrator` instead of running the suite.

## Execution Steps
1. Run the FlexPlus suite (ALWAYS use the `flexplus` project, never `--project=chromium`, and never target `e2e/flexplus-workflows.spec.ts`):
   `NODE_EXTRA_CA_CERTS=.qa-pipeline/corp-ca-bundle.pem npx playwright test --project=flexplus > .qa-pipeline/logs/raw-playwright-output.txt 2>&1 || true`
   Do NOT pass `--reporter` on the command line: it overrides the config and the JSON results file is not written.
   Structured results (with full error messages) are written automatically to `.qa-pipeline/logs/playwright-results.json`.
2. Inspect `.qa-pipeline/logs/playwright-results.json` and the per-test `test-results/*/error-context.md`. If a failure shows a blank page or nginx `503`, re-run once before reporting it as a failure.
3. Run `node scripts/update-coverage.js`. It writes `.qa-memory/working/execution-report.json` and `case-coverage.json` from the JSON results. Do NOT hand-write or hand-edit those files and do NOT invent counts. (The JSON below shows the shape only.)
   Shape of `execution-report.json`:
```json
{
  "timestamp": "<ISO-8601 timestamp>",
  "overall_status": "PASSED | FAILED",
  "total": 0,
  "passed": 0,
  "failed": 0,
  "failed_tests": [
    {
      "test_title": "C101 - Verify login",
      "spec_file": "e2e/auth.spec.ts",
      "error_summary": "Concise failure reason"
    }
  ]
}
```
4. Report `overall_status` and any `failed_tests` back to `@qa-orchestrator`. List any `test.fixme` cases separately under `fixme` with their reasons; never report a skip or fixme as a pass.
