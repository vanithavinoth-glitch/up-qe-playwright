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
