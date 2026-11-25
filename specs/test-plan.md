# Test Plan — Amazon India Public Search

- **Source requirement:** `extracted_requirements.json` → `REQ-AMZ-04` ("Search for Portable SSD and Add to Cart")
- **Module:** Product Search
- **Priority:** High
- **Target URL:** https://amazon.in
- **Seed file:** `e2e/seed.spec.ts`
- **Target spec file:** `e2e/amazon/portable-ssd-1tb-pdp.spec.ts`
- **Playwright project:** `chromium`
- **Scope:** Exactly ONE test case (below). No additional cases are in scope.

---

## Suite: Amazon India Public Search

### Test Case 1: Search 'portable ssd 1tb', open first non-sponsored product, verify title and price, add to cart and verify confirmation

**Requirement traceability:** REQ-AMZ-04

**Preconditions / Starting State:**
- Clean (fresh) browser session: no cookies, no stored state, no logged-in Amazon account.
- No items in cart (fresh context implies cart count is 0 / absent).
- Desktop viewport (default Playwright chromium project settings).

**Blocking condition (applies to every step):**
If at any point a CAPTCHA, robot-check, or consent interstitial is presented, the test MUST fail
immediately with a BLOCKED status/annotation. These interstitials must NEVER be bypassed,
solved, or clicked through.

**Steps and Expected Results:**

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Navigate to `https://amazon.in`. | Amazon.in home page loads. The search box is visible: `getByRole('searchbox', { name: 'Search Amazon.in' })`. No CAPTCHA/robot-check/consent interstitial (otherwise BLOCKED). |
| 2 | Click the search box, type `portable ssd 1tb`, and submit by pressing `Enter`. | Search results page loads. URL matches `/\/s\?.*k=portable(\+|%20)ssd(\+|%20)1tb/i` (case-insensitive). At least one result card is present: `[data-component-type="s-search-result"]`. |
| 3 | Locate the first non-sponsored result: `page.locator('[data-component-type="s-search-result"]').filter({ hasNotText: 'Sponsored' }).first()`, then click its product link `a:has(h2)`. Note: the link may open a popup (`target=_blank`) — handle via popup promise and continue on the new page if one opens. | Product detail page (PDP) opens (in same tab or popup). PDP URL matches `/\/dp\//`. |
| 4 | On the PDP, verify the product title. | `#productTitle` is visible and its text content is non-empty. |
| 5 | On the PDP, verify the product price. | `#corePriceDisplay_desktop_feature_div .a-price-whole` is visible and contains digits; the `₹` symbol is present in the price block. Do NOT use `.a-offscreen` for price assertions. |
| 6 | Click the Add to Cart button: `getByRole('button', { name: 'Add to cart', exact: true })`. | Button is visible/enabled and the click succeeds without error. |
| 7 | Verify the cart-added confirmation. | One of: an "Added to cart" confirmation message / cart side-sheet appears, OR the cart count indicator increments to `1`. ⚠️ See "Open Items" — the exact confirmation selector is UNVERIFIED. |

**Success Criteria:**
- Steps 1–7 all pass: results URL matches the expected pattern, PDP URL matches `/\/dp\//`,
  `#productTitle` is visible and non-empty, price whole-value digits with `₹` are visible,
  Add to Cart click completes, and a cart-added confirmation is observed (message/side-sheet
  or cart count = 1).

**Failure Conditions:**
- Search box not found, or results URL does not match the expected pattern.
- No non-sponsored result card found, or PDP does not load / URL does not match `/\/dp\//`.
- `#productTitle` missing/empty, or price block missing digits / `₹` symbol.
- 'Add to cart' button not found/not clickable, or no cart-added confirmation observed.
- Any CAPTCHA / robot-check / consent interstitial encountered → fail as **BLOCKED** (never bypass).

**Open Items / Notes for Spec Generation:**
- ⚠️ **UNVERIFIED selector:** The exact selector for the add-to-cart confirmation
  ("Added to cart" message, cart side-sheet, or cart count badge) has NOT been verified
  against the live site. It MUST be verified live before generating the final assertions
  in `e2e/amazon/portable-ssd-1tb-pdp.spec.ts`.
- Handle the possible popup (`target=_blank`) from the search-result product link; all PDP
  and cart assertions must run against the correct (possibly new) page object.
- Price assertions must use `#corePriceDisplay_desktop_feature_div .a-price-whole`
  (digits) plus the `₹` symbol — never `.a-offscreen`.
