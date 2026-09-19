# M07 → M08 Handoff

M07 shipped **Authentication + Workspace**. M08 is the **Contacts loop**. Do not restart auth. Do not start M08 in the M07 PR.

## Ready for M08

- Session states: `booting`, `unknown`, `unauthenticated`, `authenticating`, `authenticated`, `expired`
- Real login: email + password against `POST /api/v1/auth/token` then `GET /api/v1/me`
- SecureStore holds the Sanctum token only
- Workspace from `/me` only; switching deferred
- `can()` from `/me` permissions (deny unknown)
- Expo Router guards + authenticated tab shell (HOME / CRM / INBOX / ACTIVITIES / MORE)
- MORE: account + session + honest logout
- Centralized 401; 403 ≠ logout
- Contacts API already in the catalog: `GET/POST /contacts`, `GET/PUT /contacts/{id}`

## Do not do in M08

- Re-implement login, token storage, or workspace switching
- Invent `/api/v2` or GraphQL
- Duplicate `ContactIdentity` rules on the client
- Store tokens in AsyncStorage
- Implement Home / Deals list / Activity complete / Thread show (G01–G04)
- Redesign the tab IA

## Backend handoffs (still not client work)

1. `GET /api/v1/home` — G01 Home tab
2. `GET /api/v1/deals` — G02 CRM deals list
3. `POST /api/v1/activities/{id}/complete` — G03 Activities done state
4. `GET /api/v1/threads/{id}` — G04 Inbox detail

Contacts show/list/create/update are **READY** on current `/api/v1`. Companies show is **not** in v1.

## Platform QA in M08

Verify contact list/show after a restored SecureStore session on both iOS and Android. That is QA, not a second app.

## Stop

Do not start M08 until this PR is reviewed. Do not merge M07 from the agent.
