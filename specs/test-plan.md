# Amazon India Public Search

## Application Overview

# Amazon India Public Search — Functional Test Plan

## Title
Search for wireless mouse and verify search results appear

## Preconditions / Prerequisites
- Fresh browser session; no signed-in account.
- Public access to https://www.amazon.in/ is available.
- Stop and mark BLOCKED if CAPTCHA, robot verification, consent, outage, or region blocking appears. Do not solve or bypass it.
- Amazon layouts may be dynamic; promotional and sponsored cards are allowed. Require a matching search URL and at least one relevant wireless-mouse result.

## Numbered Steps
1. Navigate to https://www.amazon.in/.
2. Locate the searchbox named Search Amazon.in (#twotabsearchtextbox).
3. Enter wireless mouse and submit with Enter or the search-submit control. Do not sign in or interact beyond search.
4. Observe the resulting URL and search-result content only.

## Expected Result
The URL is an Amazon search URL containing k=wireless+mouse, the searchbox retains wireless mouse, and at least one relevant wireless-mouse result appears. The live run observed https://www.amazon.in/s?k=wireless+mouse&ref=nb_sb_noss with Logitech, Zebronics, and HP listings.

## Success/Failure Criteria
- Success: public homepage accessible, query submitted, and at least one relevant wireless-mouse result visible.
- Failure: query not submitted, URL/searchbox unchanged, no relevant result renders, or blank/error page appears.
- Blocked: CAPTCHA, robot verification, consent, outage, or region restriction prevents the public search; record the blocker and do not bypass it.

## Test Scenarios

### 1. Public homepage search

**Seed:** `https://www.amazon.in/`

#### 1.1. Search for wireless mouse and verify search results appear

**File:** `specs/test-plan.md`

**Steps:**
  1. Use a fresh browser session and navigate to https://www.amazon.in/.
    - expect: Public homepage loads with accessible searchbox Search Amazon.in (#twotabsearchtextbox).
  2. Enter wireless mouse and press Enter; do not sign in or interact beyond this search.
    - expect: The browser reaches /s with k=wireless+mouse and the searchbox retains wireless mouse.
  3. Observe the search-results page.
    - expect: At least one relevant wireless-mouse product result is visible. Live observations included Logitech, Zebronics, and HP.
  4. Apply success, failure, or blocked criteria.
    - expect: Success if relevant results appear; Failure for unchanged URL, no relevant results, or error; Blocked for CAPTCHA, robot check, consent, outage, or region restriction.
