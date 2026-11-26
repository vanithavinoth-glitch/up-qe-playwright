# Entity Memory: FlexPlus Event Creation & Dispatch Dependency Chain

## Critical Domain Rule (Strict Execution Order)
An Event CANNOT be created or dispatched in isolation. Every end-to-end Event & Dispatch workflow requires the following 6-stage parent-to-child entity hierarchy to exist first:

1. **Stage 1 — Create Program**
   - **Route:** `/flex-plus/#/pages/programs/list`
   - **Action:** Click Create/Add Program, fill required fields using `QA_AUTO_<Timestamp>_Program`, and save.
   - **Output:** Active Program record available for enrollment.

2. **Stage 2 — Create or Enroll Account in Program**
   - **Route:** `/flex-plus/#/pages/resources/accounts` (or Program Subscriptions)
   - **Action:** Create a new Account (`QA_AUTO_<Timestamp>_Account`) or attach an existing test Account to the Program created in Stage 1.

3. **Stage 3 — Create or Link Service Point to Account**
   - **Route:** Account Details -> Service Points tab/section
   - **Action:** Create a Service Point (`QA_AUTO_<Timestamp>_SP`) linked directly to the Account from Stage 2.

4. **Stage 4 — Create or Link Device to Service Point**
   - **Route:** Service Point Details -> Devices tab/section
   - **Action:** Create or provision a Device (`QA_AUTO_<Timestamp>_Device`) attached to the Service Point from Stage 3.

5. **Stage 5 — Create Event**
   - **Route:** Events / Dispatch module
   - **Action:** Create a new Event targeting the Program from Stage 1 (which now has an enrolled Account -> Service Point -> Device hierarchy).

6. **Stage 6 — Trigger & Verify Dispatch**
   - **Route:** VPP / Event Dispatch screen (`/flex-plus/#/pages/sched/vpp` or Event Dispatch action)
   - **Action:** Trigger Dispatch for the created Event and verify dispatch status/job execution updates.

## Test Design & Playwright Generation Mandate
- Do NOT generate isolated, read-only page tests when asked to test Event Creation or Dispatch.
- Generate **chained end-to-end workflows** (or `test.describe.serial` blocks) that pass the dynamically generated `QA_AUTO_<Timestamp>_*` entity names from Stage 1 through Stage 6 so the test is 100% self-contained and repeatable.

## Status
- Routes for Stages 2-6 are hints, not verified. `@ui-explorer` must confirm the real routes, button labels and selectors during the run, and `@memory-librarian` should update this file with them afterwards.
