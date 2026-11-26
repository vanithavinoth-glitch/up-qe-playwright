# Feature: User Authentication

## User Story
As a registered user, I want to log into the portal with my email and password so I can access my dashboard.

## Acceptance Criteria
1. Entering a valid email and password redirects to `/dashboard` and displays a "Welcome" banner.
2. Leaving the email or password field blank keeps the "Sign In" button disabled or shows "Required field".
3. Entering an invalid password displays "Invalid email or password" without revealing which field failed.
