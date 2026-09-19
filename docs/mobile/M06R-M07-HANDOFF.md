# M06R → M07 Handoff

M06R froze the **Expo foundation**. M07 is Auth + Workspace **product UX**. Do not restart stack selection. Do not start M07 in the foundation PR.

## Ready for M07

- Workspace: `mobile/`
- Session states: `unknown`, `unauthenticated`, `authenticating`, `authenticated`, `expired`
- `AuthService.login` / `logout` / `restore` against `POST/DELETE /api/v1/auth/token` and `GET /api/v1/me`
- Secure token storage abstraction
- Tab IA already mounted (placeholders)
- Design tokens locked (`#F7F7F5`, `#FFFFFF`, `#161616`, `#666666`, `#E3E3DF`, `#E8530E`)
- Expo Router protected routes (`Stack.Protected`)

Replace `app/(auth)/index.tsx` foundation chrome. Keep the service and storage boundaries.

## Do not do in M07

- Invent `/api/v2`, GraphQL, or mobile-only business rules
- Implement Contacts / Leads / Deals / Inbox / Activities / Quotes / Home product screens
- Clone P23 web activation
- Store tokens in AsyncStorage
- Call Inertia or Desk iframe URLs
- Fake `/me` permissions
- Start a second iOS or Android codebase

## Backend handoffs (still not client work)

1. `GET /api/v1/home` — Home tab
2. `GET /api/v1/deals` — CRM deals list
3. `POST /api/v1/activities/{id}/complete` — Activities done state
4. `GET /api/v1/threads/{id}` — Inbox detail

Until those land, keep placeholders honest.

## Platform QA in M07

One implementation. Verify sign-in, secure restore, and logout wipe on **both** iOS and Android because Keychain / Keystore behavior differs. That is QA, not a second app.
