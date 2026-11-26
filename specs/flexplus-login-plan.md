# FlexPlus Sign-In Flow — Test Plan

**Target spec file:** `e2e/flexplus/login.spec.ts`
**Seed file:** `e2e/seed.spec.ts`
**Sources:** `extracted_requirements.json` (REQ-001..003), `e2e/helpers/flexplus.ts`,
`e2e/helpers/fixtures.ts`, `e2e/flexplus/authentication.spec.ts`, `e2e/seed.spec.ts` (login guidance comment).

## Conventions (apply to all cases)

- Import `{ test, expect }` from `../helpers/fixtures` and helpers from `../helpers/flexplus`.
- **Credentials are never hardcoded.** They come from `.env` (`APP_URL`, `APP_USERNAME`,
  `APP_PASSWORD`) via `appUrl()` / `login()` in `e2e/helpers/flexplus.ts`. Do not record them
  in specs, reports, or screenshots.
- Environment: `APP_URL` must target the QA host `qa-test-flexkiosk.ks.autogridsystems.net`
  (enforced by `appUrl()`); QA-only data.
- FlexPlus is a hash-routed SPA; the post-login route is `#/pages/sched/vpp`.
- Sign-in page controls (from `login()`): textbox **Username**, textbox **Password**, button **Log in**.
- Starting state: fresh run, no prior session, `.env` configured.

---

## TC-1 — Valid sign-in reaches the VPP dashboard (REQ-001)

**Context:** Uses the worker fixture's logged-in `page` (the `authContext` worker fixture in
`e2e/helpers/fixtures.ts` logs in once per worker via `login()`; each test gets a new tab in
that authenticated context — same pattern as `e2e/seed.spec.ts`).

**Steps:**
1. Use the standard `page` fixture (already authenticated by the worker fixture).
2. Call `openRoute(page, '/pages/sched/vpp')`.

**Expected results:**
1. URL matches `#/pages/sched/vpp` (asserted inside `openRoute`).
2. No bounce back to login: the **Username** textbox has count 0 (asserted inside `openRoute`).
3. The dashboard landmark text **"Market VPP Products"** (exact) is visible.

**Pass:** all three assertions hold. **Fail:** login bounce, wrong hash route, or landmark not visible.

---

## TC-2 — Wrong password stays on sign-in page (REQ-002)

**Context:** Fresh, unauthenticated browser context (per the seed-file guidance:
`const ctx = await browser.newContext(); const page = await ctx.newPage();`). Do NOT use the
authenticated `page` fixture. Close the context in `finally` (pattern from
`e2e/flexplus/authentication.spec.ts`).

**Steps:**
1. Create a new browser context and page.
2. Navigate to `appUrl()`.
3. Fill **Username** with `process.env.APP_USERNAME` (from `.env`).
4. Fill **Password** with a deliberately wrong value (e.g. the real password with a suffix —
   derived at runtime, never a stored secret). Note: the `login()` helper only submits the
   `.env` password and asserts success, so this case fills/clicks the same locators directly
   with the bad password instead of calling `login()` end-to-end.
5. Click the **Log in** button.

**Expected results:**
1. The sign-in page renders with **Username**, **Password**, and **Log in** controls.
2. Authentication is denied: URL does NOT reach `#/pages/sched/vpp`.
3. The user remains on the sign-in page — the **Username** textbox is still visible.
4. No authenticated view is exposed: "Market VPP Products" is NOT visible.
   (Exact error-message wording is unknown per REQ-002; assert only on staying on sign-in.)

**Pass:** remains on sign-in page, no VPP route/landmark. **Fail:** dashboard route or landmark appears.

---

## TC-3 — Empty credentials stay on sign-in page (REQ-003)

**Context:** Fresh, unauthenticated browser context (same pattern as TC-2); close it in `finally`.

**Steps:**
1. Create a new browser context and page.
2. Navigate to `appUrl()`.
3. Leave **Username** and **Password** empty.
4. Click the **Log in** button (if it is disabled with empty fields — behavior unknown per
   REQ-003 — the disabled state itself satisfies the expected result).

**Expected results:**
1. The sign-in page renders with **Username**, **Password**, and **Log in** controls.
2. Access is denied: URL does NOT reach `#/pages/sched/vpp`.
3. The user remains on the sign-in page — the **Username** textbox is still visible.
4. "Market VPP Products" is NOT visible. (Exact required-field message text: unknown; do not
   assert on specific wording.)

**Pass:** remains on sign-in page with no authenticated view. **Fail:** any navigation to
`#/pages/sched/vpp` or visible dashboard landmark.
