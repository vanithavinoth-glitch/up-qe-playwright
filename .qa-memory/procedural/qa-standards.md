# Procedural Memory: QA Pipeline Standards

## Locator Strategy (Strict Priority)
1. `getByRole()`
2. `getByLabel()`
3. `getByPlaceholder()`
4. `getByText()`
5. `getByTestId()`

## Healer Guardrails
- Only repair broken selectors, timeouts, or navigation waits.
- NEVER delete or weaken `expect()` assertions to force a passing test.

## TestRail Mapping Rules
- Every test case must map to: `Title`, `Preconditions`, `Steps`, `Expected Result`, `Priority`, and `Module`.
- Prefix generated Playwright test titles with the approved TestRail ID (e.g., `C101 - Verify login`).


## Test Plan Design Scope
- Do NOT limit test plans to read-only checks.
- For every discovered creation, configuration, or dispatch workflow (such as Creating a Program or Triggering a Dispatch), generate complete end-to-end positive, negative, and validation test cases covering form inputs, submission, and resulting state verification.

## FlexPlus Spec Generation Rules (MANDATORY for generator and healer)
Reference implementation: `e2e/helpers/flexplus.ts`, `e2e/helpers/fixtures.ts`, `e2e/flexplus/navigation-dashboard.spec.ts`. Copy that pattern.

### Required structure
- FlexPlus specs live in `e2e/flexplus/<module>.spec.ts`, ONE file per module (Navigation, Programs, Resources, Energy markets, Reports, Messaging, Tools, Tenant). Never create one big file with an `if (id === ...)` dispatcher.
- Import `test` and `expect` from `../helpers/fixtures` (NOT from `@playwright/test`). The fixture logs in once per worker and gives every test its own fresh `page`.
- Import `openRoute`, `expectTextsVisible`, `expectAnyVisible`, `qaName` from `../helpers/flexplus`. NEVER write your own login, URL-building or navigation code.
- Routes are passed WITHOUT `#`, e.g. `openRoute(page, '/pages/programs')`. NEVER build hash URLs by hand (`'/#/...'` produces a broken `#/#/...` URL).
- One test per TestRail case, title prefixed with the TestRail ID. Every case must have a real implementation: no placeholder branches, no `throw new Error('No implementation ...')`.

### Banned patterns
- `locator.count()` inside an assertion (it does not wait). Use `expect(locator).toBeVisible()`, `toHaveCount()`, or `expectAnyVisible(...)`.
- Navigation tests that only assert the URL. Always also assert rendered content (a heading or landmark) via `openRoute`.
- A `page` or logged-in state shared across tests, or `test.describe.configure({ mode: 'serial' })` to hide dependencies.
- `test.skip(true, ...)` for a case that is meant to run. If a case is genuinely blocked by an application bug, use `test.fixme(true, '<bug/reason>')` and list it in `execution-report.json` under `fixme`. Missing fixtures are NOT a reason to skip: create the data in the test using `qaName('...')`.
- `waitForTimeout` and fixed sleeps. Use web-first assertions.
- Closing the login tab. FlexPlus ends the server session when the logged-in tab closes; the fixture keeps it open for the worker.

### Selectors
- Use only selectors observed in `user_journeys.json` or a live playwright-cli snapshot. Do not guess role/name/text.
- If a selector was not observed, open the page with playwright-cli and record it before writing the test.

### Environment facts
- QA tenant allows one stable logged-in session: run with `workers: 1` (already set in `playwright.config.ts`).
- The QA host may briefly return `503 Service Temporarily Unavailable`; a blank page with an nginx 503 is an environment blip, not a locator bug. Re-run before healing.
- Run the FlexPlus suite with `npx playwright test --project=flexplus`.
- FlexPlus UI facts (verified live): the primary nav (Dashboard, Monitoring, Programs, Resources, Energy markets, Reports, Messaging) is collapsed behind the hamburger button; call `openNav(page)` before asserting nav links. The VPP dashboard has buttons (Market products, Events List, Chart layers, Refresh, Export to CSV) and NO combobox. Many elements expose `data-testid`; prefer them when role/name is ambiguous.
- Text such as "Service points" also exists in hidden nav dropdowns. Use `visibleText(page, text)` (or `.filter({ visible: true })`) instead of `getByText(text).first()`.
- Login: see the LOGIN GUIDANCE block in `e2e/seed.spec.ts` (fixture login, never storageState, never close the first tab, login-page tests use a separate unauthenticated context).
- Run state: `.qa-memory/working/case-coverage.json` is the source of truth for which approved cases are implemented/passing. Legacy results are archived in `.qa-pipeline/archive/` and must not be used for healing.
- FlexPlus dropdowns (e.g. Program type, Time Zone) are plain `button` elements, not `<select>`/combobox: click `getByRole('button', { name: <current text> })` and read/choose from the opened menu. Never mark a case blocked because a fixture value is missing; choose from the dropdown. A case may only be marked BLOCKED with a saved snapshot as evidence.
- Add Program (and similar dialogs): after `openRoute`, call `await page.waitForLoadState('networkidle')` BEFORE clicking the Add button. Clicking too early shows 'configuring program types - please try again / Retry' instead of the form. The form has no client-side validation: invalid submits are rejected by the server with an 'Add resource failed' panel (buttons Cancel/Back). Verified form data: `user_journeys.json` > Programs > forms.
- Creation dialogs (Add Account / market product / Droop Curve / Custom Attribute): no client-side validation; empty Submit shows an 'Add resource failed' panel with a 400 (buttons Back/Cancel). Close dropdown menus by clicking the row label, never Escape (Escape closes the dialog). Menu option labels can differ from the collapsed value (e.g. 'Dynamic Frequency Response' vs 'DYNAMIC_FREQUENCY_RESPONSE'). Add template is 2 steps: pick a type row, then Continue (disabled until selected). Full verified locators/options: `user_journeys.json` forms.
- Test data: never depend on `QA_*` environment variables or on another test having run. Create what a test needs with helpers in `e2e/helpers/data.ts` (e.g. `createProgram`), which name records `QA_AUTO_<timestamp>_<label>` and log them to `.qa-memory/working/qa-auto-records.json`. Cleanup may only delete records listed there. `spec-readiness-reviewer` must mark a case READY before generation.
