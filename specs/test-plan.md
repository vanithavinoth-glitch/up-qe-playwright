# Amazon India Public Product Search — Functional Test Plan

## Application Overview
Public, unauthenticated amazon.in retail site. Scope: ONE read-only scenario — search for "noise cancelling headphones", open the first organic product result, and verify the product detail page (PDP) shows the product title, a price, and the Add to Cart button. No login, no cart mutation, no purchase.

Source of UI facts: `user_journeys.json` journey `UJ-AMZ-002` (live-explored 2026-11-24, RUN-20261124-183600; evidence: `.qa-pipeline/evidence/RUN-20261124-183600-pdp-centercol.yml`).

## Preconditions / Prerequisites
- Fresh browser session; no signed-in account; public access to https://www.amazon.in/.
- BLOCKED (do not bypass): CAPTCHA / robot check / "type the characters" / consent or region interstitial, outage, or blank page. Check body text after each navigation.
- Amazon result order is dynamic: assert generic PDP element visibility, never a specific product name or price value.

## Test Scenarios

### 1. Product search and detail verification

**Seed:** `e2e/seed.spec.ts`

#### 1.1. Search noise cancelling headphones, open first product and verify title, price and Add to Cart

**File:** `e2e/amazon/noise-cancelling-headphones-pdp.spec.ts`

**Steps:**
  1. Navigate to https://www.amazon.in/ in a fresh session.
     - expect: Searchbox visible — `getByRole('searchbox', { name: 'Search Amazon.in' })`; no robot-check text present.
  2. Fill the searchbox with `noise cancelling headphones` and press Enter.
     - expect: URL matches `/\/s\?k=noise\+cancelling\+headphones/`; at least one result card `[data-component-type="s-search-result"]` is visible.
  3. In the first organic (non-"Sponsored") result card, click the product title link (anchor containing the card `h2`). The link may have `target=_blank`; handle the popup page or strip the target before clicking.
     - expect: A product detail page opens (URL contains `/dp/`).
  4. Verify product title visibility.
     - expect: `locator('#productTitle')` is visible with non-empty text (it is the span inside the single page heading).
  5. Verify price visibility.
     - expect: `locator('#corePriceDisplay_desktop_feature_div .a-price-whole').first()` is visible and its text matches `/\d/`; the sibling `.a-price-symbol` shows `₹`. (Do NOT assert `.a-offscreen` — observed empty on this page.)
  6. Verify Add to Cart button visibility. DO NOT click it.
     - expect: `getByRole('button', { name: 'Add to cart', exact: true })` is visible (unique match: `input#add-to-cart-button`). `exact: true` is required — non-exact also matches the hidden shortcuts-menu button "Add to cart, shift, option, K".

## Success/Failure Criteria
- Success: all six expectations above pass.
- Failure: searchbox missing, no results, PDP missing title/price/Add to Cart.
- Blocked: anti-bot/consent interstitial — fail with a clear BLOCKED message; never solve a CAPTCHA.
