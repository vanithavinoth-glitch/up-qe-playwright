# FlexPlus Phase 1 Test Plan - Draft for Review

## Application Overview

REVIEW ONLY. Source scope: modified_user_journey.json, e2e/seed.spec.ts, and .qa-memory/procedural/qa-standards.md. The journey records historical QA observations, not live verification in this planning session; the planner setup failed and no application workflow was executed. All scenarios below are newly drafted, unapproved, and have local DRAFT identifiers only, not TestRail IDs; do not infer, transfer, overwrite, or reuse any prior FlexPlus approval. Existing approvals are outside the authorized sources and were not inspected or changed. Every scenario starts from a fresh independent test page, with the authenticated fixture unless stated otherwise; required data must be provisioned independently, not by another case. Historical example rows and counts are not stable fixtures. Proposed expected outcomes marked UNVERIFIED require product-owner confirmation and, where needed, fresh non-destructive observation before implementation; do not report them as observed facts. Mutation cases are proposals only and require explicit review, authorization, isolated QA data and approved cleanup/side-effect safeguards before execution. Never delete or modify historical records, dispatch, send messages, export, run optimizers, or change tenant configuration without specific authorization. Use QA_AUTO_<timestamp>_<label> for authorized new records and log ownership; cleanup is permitted only for logged QA_AUTO records and separately authorized. Auth uses APP_URL, APP_USERNAME and APP_PASSWORD in the QA environment; never record credentials, close the shared login tab, clear its cookies, replay storageState, or log out the shared session. For isolated login tests use a separate unauthenticated context. Planning stops at review; no upload, generation, test execution or healing is authorized. Evidence caveats: historical program creation and empty program/account/product/curve submissions are specifically documented, but the journey's general exploration_limits incorrectly says no submissions or creation occurred; later aggregate claims that template/attribute empty submissions occurred conflict with their form-specific records, which say they were not exercised. Favor the specific records and resolve with the owner. If unavailable data, unknown selectors, insufficient authority, 503s, or unclear expected behavior prevent a case, mark BLOCKED with evidence instead of guessing. Success requires each expected result to hold; unexpected errors or mismatches are failures, except explicit prerequisites/blockers. Future implementation must use e2e/flexplus/<module>.spec.ts, authenticated fixtures and helpers, observed selectors, retrying assertions, rendered landmarks, no fixed sleeps, one worker, and approved TestRail IDs only after separate approval.

## Test Scenarios

### 1. Authentication and dashboard

**Seed:** `e2e/seed.spec.ts`

#### 1.1. DRAFT-P1-01 - Successful sign-in reaches dashboard

**File:** `e2e/flexplus/navigation.spec.ts`

**Steps:**
  1. Preconditions: fresh isolated unauthenticated context; authorized QA credentials configured. Navigate to APP_URL at the login route; enter configured username and password without logging their values, then choose Log in.
    - expect: OBSERVED historically: the login form has Username, Password and Log in; valid credentials reached the VPP dashboard.
    - expect: Success: the dashboard renders Market VPP Products and the dashboard route. Failure: no rendered dashboard or an unexpected error. Blocked: missing credentials or tenant unavailable.

#### 1.2. DRAFT-P1-02 - Login missing and invalid credentials

**File:** `e2e/flexplus/navigation.spec.ts`

**Steps:**
  1. Preconditions: fresh isolated unauthenticated context; authorization for invalid login attempts and an approved non-locking invalid credential. Submit blank fields, then separately reload in another fresh context and submit the invalid credential with a short timeout.
    - expect: UNVERIFIED: confirm field validation, authentication error wording and account lockout policy before executing or asserting. A hanging invalid request is a documented tenant risk; classify it as blocked pending investigation rather than inventing an error.
    - expect: Failure: unauthorized access is granted. Do not retry repeatedly or affect the shared session.

#### 1.3. DRAFT-P1-03 - Dashboard views and grouping

**File:** `e2e/flexplus/navigation.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page. Open /pages/sched/vpp and verify the Market VPP Products landmark; switch from Flexibility to Graphs and back.
    - expect: OBSERVED historically: Graphs shows a chart with Availability_Up/Availability_Down legend and kW axis; the explored date had No data to display. Flexibility returns the Programs table. Do not assume the empty state when data exists.
  2. Open the Market products dashboard-view menu and select Programs; inspect Flex capacity and Chart layers menus.
    - expect: OBSERVED historically: grouping options are Market products and Programs; Programs selection changes the selector and table to Market products; Flex capacity offers All (+/-), Down DR (+), Up DR (-). Chart layers was empty for the explored product/day.
    - expect: Failure: the observed controls or grouping change fail to render; populated series and selection effects remain UNVERIFIED.

#### 1.4. DRAFT-P1-04 - Dashboard events dialog and empty state

**File:** `e2e/flexplus/navigation.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page and an independently known date with no events. Open /pages/sched/vpp, select that date, open Events List, inspect and close the Events dialog.
    - expect: OBSERVED historically: dialog columns are Event ID, Program, Time, Duration, Status and Market Product; an empty date showed No events found for the date; an x closes the dialog.
    - expect: Success: dialog matches the confirmed fixture state and closes; block if a suitable empty date is unavailable. Event rows on populated dates are UNVERIFIED.

#### 1.5. DRAFT-P1-05 - Dashboard date navigation and data-dependent graph

**File:** `e2e/flexplus/navigation.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page; independently supplied product and date with known telemetry. Navigate to the dashboard, choose the product and date, open Graphs and Chart layers.
    - expect: OBSERVED historically: date navigator, granularity, duration and chart-layer controls exist; Today was disabled on the current day and the explored product/date had no data.
    - expect: UNVERIFIED: precise populated chart, layer toggling, date boundary and granularity behavior; confirm expected values and controls before asserting. Block when data is missing. Do not click Export or disabled Refresh.

### 2. Monitoring, reports and operational tools

**Seed:** `e2e/seed.spec.ts`

#### 2.1. DRAFT-P1-06 - Monitoring views and empty telemetry

**File:** `e2e/flexplus/monitoring.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page and a known program/date with no telemetry. Open Monitoring; inspect Program, Service points and Devices views after loading finishes.
    - expect: OBSERVED historically: Program shows two named graph panels with processed progress and may show No data; Service Points and Devices show searchable paginated tables, and device rows include type.
    - expect: Success: appropriate landmarks render for each selected view and empty telemetry matches the known fixture. Failure: wrong view or unexpected persistent error; block if fixture unavailable.

#### 2.2. DRAFT-P1-07 - Monitoring search and pagination

**File:** `e2e/flexplus/monitoring.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page and independently provisioned identifiable service point and device, plus a no-match term. In each list enter the known name, then a no-match term; if multiple pages exist inspect pagination.
    - expect: OBSERVED historically: Search textboxes and paginated service-point rows exist; devices list has Search and device types.
    - expect: UNVERIFIED: filtering, empty-result messaging and pagination semantics must be confirmed before execution assertions. Block if required fixture or pagination is absent.

#### 2.3. DRAFT-P1-08 - Events report

**File:** `e2e/flexplus/reports.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page with a known event, if available. Open /pages/reports/events and inspect the Event ID filter and table; enter a known ID and a no-match value only after expected filter semantics are confirmed.
    - expect: OBSERVED historically: paginated report columns include Program, Event ID, Day, Time, Event Reason, Market product, Status and Actions.
    - expect: UNVERIFIED: filter behavior, no-match state, and Actions purpose. Do not click Actions as a dispatch or edit command; block filtering assertions until confirmed.

#### 2.4. DRAFT-P1-09 - Job Status views without running an optimizer

**File:** `e2e/flexplus/tools.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page. Open /pages/monitoring/jobstatus; inspect Planning optimizer, Dispatch optimizer and Baseline views without triggering any command.
    - expect: OBSERVED historically: the three views exist; Dispatch optimizer remained Loading Data and exposed no run/dispatch control during inspection.
    - expect: UNVERIFIED: completed data and available actions. Record persistent loading as a blocker; do not infer or invoke optimizer actions.

### 3. Programs and DLC inspection

**Seed:** `e2e/seed.spec.ts`

#### 3.1. DRAFT-P1-10 - Program list and DLC subscriptions

**File:** `e2e/flexplus/programs.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page and a currently available enabled DLC program with subscriptions. Open /pages/programs/list, use the observed Program name field to find a suitable DLC program, and open it.
    - expect: OBSERVED historically: searching dlc and pressing Enter returned two named programs; DLC-Therm-Storage was enabled with four subscriptions. These values are historical, not guaranteed fixtures. The general list search locator and semantics are separately noted as unverified.
  2. Open Subscriptions and toggle Primary and Secondary; inspect Subscription Rules without editing.
    - expect: OBSERVED historically: the selected program showed Accounts, Service Points and Devices with date ranges, and rule text about secondary device subscriptions; account-level contracts were checked, service-point-level unchecked. Do not hardcode historical counts for arbitrary fixtures.
    - expect: Success: observed views render consistently with the selected fixture. Block if the known DLC fixture or filter control is unavailable.

#### 3.2. DRAFT-P1-11 - Past event details and notification settings

**File:** `e2e/flexplus/programs.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page and the historical DLC program/event still accessible, or another independently identified read-only fixture with known state. Open Program Details > Events, select a past event, then inspect its dispatch feedback and Utility User Notifications.
    - expect: OBSERVED historically: event 1NVXJ0 was Draft with PROGRAM dispatch type and two targeted resources; event 2GW50U showed No dispatch feedback found. Notification settings listed Name, Email and Subscribe to notifications.
    - expect: Success: displayed fields match the chosen fixture. Do not change notification settings or dispatch. Block if historical fixture is absent; the count does not prove which resources were dispatched.

#### 3.3. DRAFT-P1-12 - Program creation positive

**File:** `e2e/flexplus/programs.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page; explicit authorization to create a QA program and ownership logging. Open /pages/programs, wait for networkidle, choose Add program. Enter matching unique QA_AUTO identifiers/name, DR - Time of Use, default America/Vancouver and synthetic description/overview; submit once.
    - expect: OBSERVED historically for this data pattern: server returned 201, Operation successful, and count increased by one. Success: successful result and the uniquely named program is independently visible; record the created ID. Failure: error, missing record or duplicate creation.
    - expect: No cleanup unless separately authorized and limited to the logged owned record.

#### 3.4. DRAFT-P1-13 - Program empty and duplicate validation

**File:** `e2e/flexplus/programs.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page and authorization for validation requests. Open a settled Add Program dialog and submit all fields empty; inspect error, Back and Cancel.
    - expect: OBSERVED historically: no client-side rejection; server returned 404 for missing program type with Add resource failed; no record was created. Success: matching rejection without a record; block if write attempts are unauthorized.
  2. Independently, after authorization, create a unique owned QA_AUTO program in this same case, reopen the form and submit the same identifier and name with the same type.
    - expect: OBSERVED historically: duplicate returned 422 mentioning existing name and UID, with count unchanged. Success: rejection and no second record; no reliance on another case. Cleanup requires separate authorization.

#### 3.5. DRAFT-P1-14 - Program field boundaries and cancel

**File:** `e2e/flexplus/programs.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page. Open the settled Add Program dialog, inspect Identifier, Name, Program type, Time Zone, description, overview and checkboxes; change synthetic values and cancel.
    - expect: OBSERVED historically: type defaults to (Select a program type), time zone to America/Vancouver, three documented checkboxes are unchecked; Cancel is available. Success: dialog closes without creating a record.
  2. With explicit authorization, plan independent missing-name, missing-identifier, overlength and invalid-character submissions only after product owner supplies input rules and safe boundaries.
    - expect: UNVERIFIED: requiredness and limits for Identifier, Name and text fields, and results of individual invalid submissions. Block these variants until confirmed; do not invent validation messages.

### 4. Accounts and resources

**Seed:** `e2e/seed.spec.ts`

#### 4.1. DRAFT-P1-15 - Resource lists and groups

**File:** `e2e/flexplus/resources.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page. Open Resources > Accounts and Resources > Groups; inspect the list landmarks, search fields, columns, pagination and Add controls without opening row action menus.
    - expect: OBSERVED historically: resource views include Accounts, Service points, Devices, Resource Hierarchy, Groups and Rate Plans; Groups has Name, ID, Auto-generated and Actions columns; Accounts has Account ID search and pagination.
    - expect: UNVERIFIED: sort, search and pagination behavior; do not assert results without confirmed fixture and behavior.

#### 4.2. DRAFT-P1-16 - Create account with synthetic data

**File:** `e2e/flexplus/resources.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page; explicitly authorized account creation; approved synthetic contact details, account type and required field rules. Open /pages/resources/accounts, wait for networkidle, choose Add account, enter a unique QA_AUTO Identifier and approved values, and submit.
    - expect: OBSERVED historically: the form includes Identifier, Account Name, account type, address, rate class, contact fields and custom attributes. Valid submit was not exercised.
    - expect: UNVERIFIED: exact success response, required fields and resulting list state; confirm acceptance criteria before execution. Success requires a single independently visible owned account; log its identifier and never delete without separate authorization.

#### 4.3. DRAFT-P1-17 - Empty account and field validation

**File:** `e2e/flexplus/resources.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page and authorization for validation requests. Open the settled Add account dialog; submit it empty and inspect the error and Back/Cancel options.
    - expect: OBSERVED historically: server returned 400 with id field(s) is/are required, Add resource failed, and no record was created. Success: equivalent rejection and no account; failure: unexpected creation or missing rejection.
  2. Plan separate invalid email, phone, postal code, duplicate ID and text-length cases only with owner-approved constraints and safe synthetic input.
    - expect: UNVERIFIED: these validation rules and response messages. Block until specified; no assumption that client-side validation exists.

### 5. Energy markets

**Seed:** `e2e/seed.spec.ts`

#### 5.1. DRAFT-P1-18 - Market product creation and empty-name validation

**File:** `e2e/flexplus/energy-markets.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page; authorization for QA product creation and a safe existing droop curve. Open /pages/energymarkets, wait for networkidle, choose Add product and inspect Name, Market, Product type, Commitment type and Droop Curve.
    - expect: OBSERVED historically: default Market JEPX, Product type DYNAMIC_FREQUENCY_RESPONSE and Commitment type DROOP_CURVE_COMMITMENT; menu labels can differ from collapsed values.
  2. With authorized validation requests, submit empty; independently reopen, enter a unique QA_AUTO name and approved market/product/commitment/curve values, then submit.
    - expect: OBSERVED historically: empty submit returned 400 and name field(s) is/are required; nothing was created.
    - expect: UNVERIFIED: valid creation response, persistence and duplicate behavior. Define acceptance criteria before executing; success requires one uniquely identifiable product and owned-record logging. Do not delete it without separate authorization.

#### 5.2. DRAFT-P1-19 - Droop curve creation and numeric validation

**File:** `e2e/flexplus/energy-markets.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page; authorization for creation and validated frequency ordering/ranges. Open /pages/energymarkets/droop_curves, wait for networkidle, choose Add Droop Curve and inspect Name and the five frequency fields and preview.
    - expect: OBSERVED historically: preview/points show NaN until frequencies are entered; empty submit returned 400 for missing name and created nothing.
  2. If authorized, submit empty, then separately submit a unique QA_AUTO name and owner-approved valid nominal, low start/stop and high start/stop frequencies. Plan invalid numeric, reversed order, missing field and boundary variants independently.
    - expect: UNVERIFIED: valid creation, numeric limits, ordering rules, field requirements, duplicate behavior and preview accuracy. Confirm expected responses and safe values before execution; success requires persisted correct values and ownership logging.

### 6. Messaging and tenant configuration

**Seed:** `e2e/seed.spec.ts`

#### 6.1. DRAFT-P1-20 - Template selection and editor inspection

**File:** `e2e/flexplus/messaging.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page. Open /pages/messages/templates, wait for networkidle and choose Add template. Inspect Continue before selecting a type, then select ad_hoc_notification and continue to the editor.
    - expect: OBSERVED historically: Continue is disabled until a type is selected; type table has Email, Voice and SMS enabled columns; editor has channel radios, Enable, language and variable pickers. Email defaults selected, Enable checked, language Armenian.
    - expect: Close or cancel without saving. Fail if selection gating or observed controls do not render.

#### 6.2. DRAFT-P1-21 - Message template positive and validation scenarios

**File:** `e2e/flexplus/messaging.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page; explicit authorization, safe QA-only recipient configuration, approved channel/type, template content and side-effect controls. Select an observed type, fill a unique QA_AUTO template name, approved channel/language and synthetic subject/body, and submit once.
    - expect: UNVERIFIED: saving, required inputs, supported editor locators, persistence, duplicate behavior and whether saving triggers messages. Confirm these before execution; success requires one saved owned template with intended fields and no message delivery. Never send messages.
  2. Plan independent empty editor, missing name/body, invalid values and duplicate-name submissions after owners specify rules and confirm requests are safe.
    - expect: UNVERIFIED: step-2 empty submit and error messages; the aggregate observation conflicts with the specific form record. Block until resolved, and do not assume rejection or safety.

#### 6.3. DRAFT-P1-22 - Tenant custom attribute inspection

**File:** `e2e/flexplus/tenant.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page. Open /pages/tenant, navigate to Custom attributes, wait for networkidle, choose Add attribute, inspect Name, Key and applicability controls, and cancel without entering values.
    - expect: OBSERVED historically: Applies to Accounts checked; Applies to Service Points and Devices unchecked. Success: the dialog closes without tenant configuration changes.

#### 6.4. DRAFT-P1-23 - Tenant custom attribute creation and validation proposals

**File:** `e2e/flexplus/tenant.spec.ts`

**Steps:**
  1. Preconditions: fresh authenticated page; explicit tenant-configuration authorization, isolated tenant, ownership and approved cleanup plan. After review only, enter unique QA_AUTO Name and Key, choose approved applicability and submit; independently verify resulting configuration.
    - expect: UNVERIFIED: valid submit, persistence, key rules, required fields and impact. Confirm acceptance criteria and side effects before any execution; no tenant writes authorized by this plan.
  2. Propose independent empty, duplicate-key, invalid-key and applicability-boundary submissions only after owner supplies expected rules and authorizes safe validation requests.
    - expect: UNVERIFIED: no form-specific submission was observed; general aggregate claims of empty rejection conflict with the specific note. Block until the conflict is resolved.

### 7. Dispatch and cross-system gaps

**Seed:** `e2e/seed.spec.ts`

#### 7.1. DRAFT-P1-24 - Proposed program and group dispatch targeting

**File:** `e2e/flexplus/programs.spec.ts`

**Steps:**
  1. Preconditions: fresh isolated test state; explicit dispatch authorization, identified supported creation/dispatch workflow, safe dedicated test resources, group membership, controlled schedule, and approved API evidence. Define separate program-wide and group-scoped events; submit and dispatch only after review and authorization.
    - expect: UNVERIFIED: no UI event creation or dispatch path was found; no group-scoped or more-than-one-day-ahead event was observed. Block rather than inventing controls or executing dispatch.
    - expect: Success criterion to confirm with owners: each eligible primary-level resource is targeted exactly once and none outside scope is targeted; compare authoritative per-resource API evidence with the independently established membership snapshot.

#### 7.2. DRAFT-P1-25 - Proposed dispatch feedback and notification absence

**File:** `e2e/flexplus/programs.spec.ts`

**Steps:**
  1. Preconditions: fresh isolated authorized fixture, explicitly approved dispatch and safe notification controls; authoritative API, logs and database access approved. Configure an event without notification configuration and collect dispatch outcomes per resource and notification logs.
    - expect: UNVERIFIED: a blank template, '-' notification time, target count or No dispatch feedback found alone cannot establish no messages were sent or per-resource dispatch outcomes.
    - expect: Block pending approved workflow, expected outcomes and evidence access; never send or dispatch as part of planning.
