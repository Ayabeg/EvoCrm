# M07 → M08 Handoff

M07 shipped **Authentication + Workspace**. M08 is the **Contacts loop** and is implemented on `feat/m08-contacts` (see `docs/mobile/M08-STATUS.md`). Do not restart auth.

## Ready for M08 (consumed)

- Session states: `booting`, `unknown`, `unauthenticated`, `authenticating`, `authenticated`, `expired`
- Real login: email + password against `POST /api/v1/auth/token` then `GET /api/v1/me`
- SecureStore holds the Sanctum token only
- Workspace from `/me` only; switching deferred
- `can()` from `/me` permissions (deny unknown)
- Expo Router guards + authenticated tab shell
- MORE: account + session + honest logout
- Centralized 401; 403 ≠ logout
- Contacts API in the catalog: `GET/POST /contacts`, `GET/PUT /contacts/{id}`

## M08 delivered

- CRM tab list + search + pagination
- Contact show / create / update
- `crm.edit` gates write actions

## Still do not do

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

Companies show is **not** in v1.
