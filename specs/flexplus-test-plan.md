# FlexPlus Test Plan

## Scope and review boundary

This plan is based on the visible application flows recorded in [`user_journeys.json`](../user_journeys.json) after signing in through `APP_URL` from `.env`. The existing `specs/test-plan.md` is for a different application and is intentionally unchanged.

The plan covers navigation and read-only views as well as end-to-end creation, form validation, submission, persistence checks, and a controlled VPP dispatch. The exploratory session inspected creation forms but did not submit them or run a dispatch. State-changing automation in this plan is authorized only on the confirmed non-production QA tenant, using newly created `QA_AUTO_<timestamp>_` records and explicitly designated QA-only dispatch resources. Never reuse, edit, or delete existing records as test data.

## Preconditions

- The configured `APP_URL` is reachable and the test account can sign in.
- Use only `https://qa-test-flexkiosk.ks.autogridsystems.net` and QA-only data. Prefix every created entity and display name with `QA_AUTO_<timestamp>_`.
- Do not record credentials, tokens, or real account/device identifiers in test artifacts.
- Supply valid QA lookup values using environment variables or approved QA fixtures; never invent production identifiers or use real contact details.
- Stop if the app navigates outside the confirmed QA tenant, a target is not clearly QA-only, or an action would affect a pre-existing/non-test resource.
- Message-template tests save configuration only; they must not send email, SMS, or voice messages.
- Dispatch tests may submit only against the designated QA-only program, market product, event, and time window. Verify the submitted command and resulting job/event status; do not broaden dispatch scope or trigger optimizer actions against other resources.
- Store credentials and fixture values in environment configuration, not in specs, reports, screenshots, or TestRail case text.

## Test scenarios

### 1. Sign in and reach the application

1. Navigate to `APP_URL`.
   - Expected: The FlexPlus sign-in page is displayed with Username, Password, and Log in controls.
2. Sign in with the configured QA account.
   - Expected: Authentication succeeds and the VPP dashboard loads.
3. Attempt invalid or missing credentials in a later isolated test.
   - Expected: Access is denied with an actionable validation or authentication error; no authenticated view is exposed.

### 2. Navigate the primary modules

1. Open the main navigation.
   - Expected: Dashboard, Monitoring, Programs, Resources, Energy markets, Reports, and Messaging are available.
2. Open each module and use its visible submenu where applicable.
   - Expected: The URL and page heading correspond to the selected module, and the page renders without remaining indefinitely in a loading state.
3. Inspect the account and Tools menus.
   - Expected: Settings and the listed operational tools are discoverable; do not invoke Log Out during this navigation test.

### 3. Review the VPP dashboard

1. Open `/#/pages/sched/vpp`.
   - Expected: Market VPP Products, Flexibility/Graphs views, and program rows are displayed.
2. Review market product and program selectors, date navigation, granularity, Events List, Chart layers, and Flex capacity controls.
   - Expected: Each control is available and its displayed selection/state is clear.
3. Review graph panels.
   - Expected: Available data is plotted with a legend; an empty series presents an explicit empty/no-data state rather than a misleading chart.
4. Verify Refresh and Export to CSV affordances without initiating export.
   - Expected: Refresh is available after loading completes; no download or data mutation is triggered by inspection.

### 4. Review Monitoring views

1. Open `/#/pages/monitoring` and inspect Program, Service points, and Devices.
   - Expected: Each view is selectable and displays its corresponding content.
2. In Program view, inspect market product/program selectors, date context, and graph panels.
   - Expected: The selected context is reflected in the graphs and empty data is clearly identified.
3. In Service points and Devices, use a known QA search term.
   - Expected: Results are filtered to matching records; clearing the query restores the list.
4. Open the Resources and Advanced subroutes.
   - Expected: The corresponding view loads and remains within the app.

### 5. Search and browse Programs

1. Open `/#/pages/programs` and inspect the program count, list, page-size selector, pagination, and row actions.
   - Expected: The list count and visible rows are consistent; sorting or pagination updates the visible results.
2. Search by a known QA program name.
   - Expected: Matching programs are shown and a no-match query has a clear empty state.
3. Review the Add program form without saving.
   - Observed fields: Identifier, Name, Program type, Time Zone, Description, Program overview, Display on engage, Device Model Filtering Enabled, and Auto Assign Contacts at SP/Device.
   - Expected: The form opens and can be dismissed without creating a program.
4. Create and submit a program with an identifier `QA_AUTO_<timestamp>_Program`, a valid QA program type and time zone, and synthetic description/overview values.
   - Expected: Required-field validation prevents incomplete submission; a successful submission creates exactly one record, and reopening it shows the submitted test values.
5. Submit a duplicate test identifier and verify that the application rejects it without creating a second program.
   - Expected: A clear uniqueness error is shown and the original QA program remains unchanged.

### 6. Review Program Subscriptions

1. Open `/#/pages/programs/subscriptions`.
   - Expected: An account selector and Accounts, Service Points, and Devices subscription groups are displayed.
2. Select an approved QA account and inspect its subscription records and Primary/Secondary labels.
   - Expected: The displayed subscriptions belong to the selected account and their status/period is readable.
3. Inspect add/remove affordances without applying changes.
   - Expected: Subscription changes require a deliberate save/confirmation and are not applied by opening the view.

### 7. Search and browse Resources

1. Open each Resources view: Accounts, Service points, Devices, Resource Hierarchy, Groups, and Rate Plans.
   - Expected: The selected resource type and its list/details are displayed.
2. Search Accounts by a known QA Account ID; search other list views using their available search controls.
   - Expected: Matching results, empty results, and clearing the search behave consistently.
3. Review sorting, pagination, record details, and row action menus.
   - Expected: Read-only detail views are accessible; destructive or save actions are not executed.
4. Review the Add account form.
   - Observed fields: Identifier, Account Name, Parent Account ID, Street, City, State, Zip, Country, Rate Class, contact name/email/phone, and configured custom attributes.
   - Expected: The form opens with the observed fields and required-field indicators.
5. Create and submit an account using identifier `QA_AUTO_<timestamp>_Account`, a configured QA parent account, and synthetic address/contact data.
   - Expected: The application accepts the valid QA parent and required fields; exactly one account appears in the list and its details match the synthetic values.
6. Submit an account with a missing required field and with an invalid parent reference in separate attempts.
   - Expected: Each attempt shows actionable validation and creates no account.

### 8. Browse Energy Markets

1. Open `/#/pages/energymarkets` and review Market products.
   - Expected: The list includes Name, ID, Market, Product type, Commitment type, and Programs.
2. Review filtering, sorting, pagination, and product details where available.
   - Expected: List interactions update the displayed rows consistently.
3. Open Droop Curves.
   - Expected: The Droop Curves view loads with its list/details; its table includes frequency and low/nominal/high threshold columns.
4. Review Add product and Add Droop Curve forms.
   - Observed market-product fields: Name, Market, Product type, Commitment type, and Droop Curve.
   - Observed Droop Curve fields: Name, Nominal (Hz), Low Start (Hz), Low Stop (Hz), High Start (Hz), and High Stop (Hz), with a chart preview.
   - Expected: The forms expose the observed fields. Use an existing valid QA Droop Curve; this plan does not create or alter Droop Curves.
5. Create and submit a market product named `QA_AUTO_<timestamp>_MarketProduct` using valid QA Market, Product type, Commitment type, and an existing QA Droop Curve.
   - Expected: Exactly one product is created and its list/detail values and curve association match the submitted test data.
6. Submit a market product with a required field omitted and with an invalid/missing curve association in separate attempts.
   - Expected: Each invalid submission is rejected with actionable validation and creates no product.

### 9. Filter and browse Events reports

1. Open `/#/pages/reports/events`.
   - Expected: The Events report displays Program, Event ID, Day, Time, Event Reason, Market product, Status, and Actions.
2. Search for a known QA Event ID, then clear the filter.
   - Expected: Matching events are shown, an unmatched ID shows a clear empty state, and clearing restores results.
3. Review sortable columns, pagination, and row actions without invoking an action.
   - Expected: List navigation is stable and read-only inspection does not alter event state.

### 10. Review Messaging

1. Open `/#/pages/messages/dashboard`.
   - Expected: The message list and its available navigation/filters render.
2. Review Templates and Types.
   - Expected: Message template/type configuration is viewable; Email, SMS, and Voice options are identifiable. Types shows channel-enabled states.
3. Open Add template and inspect the type-selection step.
   - Observed: 30 types are listed with Email Enabled, Voice Enabled, and SMS Enabled columns; Continue is disabled before a selection.
   - Expected: A supported QA type/channel can be selected and the customization step opens.
4. Create and submit an Email template named `QA_AUTO_<timestamp>_MessageTemplate` using synthetic content and QA-only recipient/configuration values where required.
   - Expected: Exactly one template is saved and appears in the template list with the selected type/channel and submitted content; no message is sent.
5. Attempt to continue/save with a required field missing and with an unsupported type/channel combination in separate attempts.
   - Expected: The application provides actionable validation and saves no invalid template; no message is sent.

### 11. Review operational tools

1. Open Job Status and inspect Planning optimizer, Dispatch optimizer, and Baseline views.
   - Observed: Selecting Dispatch optimizer left the view displaying Loading Data and did not reveal a run/dispatch control.
   - Expected: Each status view eventually reports available data or a clear empty/loading/error state. A persistent spinner is recorded as a possible loading defect, not as permission to invoke an operational command.
2. Check availability of Alerts Dashboard, OEM Cockpit, Error Console, Flex Configurator, Advanced Monitoring, and SCADA HMI.
   - Expected: Each authorized in-app destination opens successfully; do not trigger commands, configuration changes, or operational actions.
3. Treat Help Center and Support Helpdesk as external/unknown destinations until their host and authorization are reviewed.
4. Open the dashboard Events List and inspect its rows and statuses.
   - Observed: Columns are Event ID, Program, Time, Duration, Status, and Market Product; the inspected row was PAST and no dispatch action was exposed.
   - Expected: Events can be reviewed without changing status or initiating dispatch.
5. Run a controlled dispatch from the supported QA dispatch workflow using only the dedicated `QA_AUTO_<timestamp>_` program/product and its explicitly configured QA event/time window.
   - Expected: The application presents the dispatch target and requested parameters before submission; after submission, the run is traceable in Job Status/Events with the matching QA identifiers and a terminal status. Verify the resulting QA telemetry/status against the configured expected values.
   - Guard: The observed Dispatch optimizer view remained at Loading Data and exposed no run control. If no supported UI dispatch command or designated QA event is available, mark this case BLOCKED with the visible state; do not guess an endpoint or trigger a command through a different interface.
6. Submit a dispatch with a missing required parameter or a non-dispatchable QA event in separate attempts.
   - Expected: The application rejects each request before execution, reports a clear validation/status message, and creates no dispatch job.

### 12. Review Tenant Settings

1. Open Settings from the account menu.
   - Expected: Tenant settings and configuration sections load.
2. Review the Custom attributes list and Add attribute entry point.
   - Expected: Existing attributes and their type/applies-to values are visible; no new attribute is saved.

## Exploratory findings and follow-up

- A graph in Monitoring displayed an explicit “No data” state while another showed chart data. Confirm whether the empty graph is expected for its selected context.
- Monitoring displayed Nov 19, 2026 during exploration on Nov 20, 2026. Confirm the intended application timezone/date behavior.
- Browser console output included an invalid Content Security Policy source warning and a parser-blocking third-party Tableau script warning; confirm whether these are known and whether either affects a user workflow.
- Deep form validation, permissions/roles, row actions, downloads, and state-changing workflows remain unverified until the cases below are executed.
- Creation dialogs were inspected for Program, Account, Market Product, Droop Curve, and Message Template; the prior exploratory session did not submit them.
- Dispatch optimizer remained at Loading Data and no run control was visible; the Events List showed a past event only. No dispatch was issued during exploration. The dispatch test below is gated on locating the supported UI command and a designated QA-only event.
- Account creation includes contact and address fields, so future test data should be synthetic and must not use real personal information.

## End-to-end execution data

- Generate one unique run suffix and use it in every created identifier/name: `QA_AUTO_<timestamp>_`.
- Required QA configuration: `APP_URL`, login credentials, a valid QA parent account ID, valid Program type/time zone, valid Market/Product/Commitment values, an existing QA Droop Curve, and supported template type/channel values.
- Dispatch additionally requires a designated QA-only program, market product, dispatchable event, start/end time, and expected status/telemetry values. Resolve those from the QA fixture or application before submission; never substitute a production or existing non-test target.
- Assert each submitted record through the application's list/detail view after save. Negative/validation attempts must assert both the visible validation message and absence of a newly created record/job.
- Do not clean up records by deleting them; preserve QA-prefixed records for auditability unless a separate cleanup workflow is explicitly approved.
