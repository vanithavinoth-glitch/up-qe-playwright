# Amazon India Public Search

## Application Overview

Public, unauthenticated amazon.in. Exactly one read-only journey (test case TC-AMZ-003): search for "Bluetooth speaker", open the first organic (non-Sponsored) result, and verify the product title, price, and Add to Cart button. The button is only checked for visibility and is never clicked. UI facts are verified from .qa-memory entity memory of two previously passing runs on the same flows.

**Test case ID:** TC-AMZ-003 | **Module:** Amazon Public Search | **Priority:** High

**Preconditions:**
- Public access to https://www.amazon.in; unauthenticated (no login).
- Chromium desktop project.
- If a CAPTCHA, robot-check, or consent barrier appears, the test must fail with a BLOCKED error; do not bypass it.
- Product order and price are dynamic; assert visible non-empty title and numeric price, never fixed values.

**Run command:** `npx playwright test --project=chromium e2e/amazon/bluetooth-speaker-pdp.spec.ts`

## Test Scenarios

### 1. Amazon India Public Search

**Seed:** `e2e/amazon/noise-cancelling-headphones-pdp.spec.ts`

#### 1.1. TC-AMZ-003 — Search Bluetooth speaker, open first product and verify title, price and Add to Cart (Module: Amazon Public Search; Priority: High)

**File:** `e2e/amazon/bluetooth-speaker-pdp.spec.ts`

**Steps:**
  1. Navigate to https://www.amazon.in.
    - expect: Searchbox getByRole('searchbox', { name: 'Search Amazon.in' }) (#twotabsearchtextbox) is visible.
    - expect: No CAPTCHA/robot-check/consent barrier is shown; if one appears, fail with a BLOCKED error and do not bypass.
  2. Type 'Bluetooth speaker' into the searchbox and press Enter.
    - expect: Results URL matches /s?k=bluetooth+speaker.
    - expect: At least one [data-component-type="s-search-result"] card is visible.
  3. In the results, skip any card containing 'Sponsored'; open the first organic card's title link (a:has(h2)).
    - expect: Product detail page opens; the link may use target=_blank, so handle the popup page.
    - expect: PDP URL matches /dp/.
  4. Verify product title, price, and Add to Cart visibility on the PDP. Never click Add to Cart.
    - expect: #productTitle is visible and non-empty (dynamic content; never assert fixed text).
    - expect: #corePriceDisplay_desktop_feature_div .a-price-whole is visible and contains digits; its .a-price-symbol shows ₹. Never assert .a-offscreen (empty on PDP).
    - expect: getByRole('button', { name: 'Add to cart', exact: true }) is visible (exact required; non-exact matches a hidden shortcuts button).
