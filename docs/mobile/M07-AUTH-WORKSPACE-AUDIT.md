# M07 Auth + Workspace — backend audit

Audited against **current main** `a9b3095fa449d4ee0ce5a64880d8c6476d761f31` (PR #237 / M06R merge).  
**Current code wins.** This file records the Laravel `/api/v1` contract the mobile client implements. It does not invent fields, endpoints, or workspace switching.

## Sources read

- `routes/api.php`
- `app/Http/Controllers/Api/V1/AuthTokenController.php`
- `app/Http/Controllers/Api/V1/MeController.php`
- `app/Http/Controllers/Api/V1/Support/ApiPayload.php`
- `app/Http/Controllers/Api/V1/Concerns/AuthorizesApiWorkspace.php`
- `app/Http/Middleware/EnsureApiWorkspaceToken.php`
- `app/Http/Middleware/EnforceProductPermissions.php`
- `bootstrap/app.php` (`api-workspace` alias)
- `app/Models/User.php` (`workspaceAbility()`, `canPermission()`)
- `config/permissions.php`
- `tests/Feature/Api/V1/SanctumTokenTest.php`
- `docs/api-v1.md` (checked after code; code is authoritative)

## Base

All routes live under `/api/v1`. Clients send:

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer {plain-text-token}
```

There is **no** `/api/v2`, GraphQL, or mobile-only identity API.

## Issue token — `POST /api/v1/auth/token`

| | |
|---|---|
| Controller | `AuthTokenController::store` |
| Auth | None (public) |
| Throttle | `throttle:10,1` (10 requests / minute) |
| Name | `api.v1.auth.token` |

### Request body (required fields only)

```json
{
  "email": "owner@clinic.dz",
  "password": "secret",
  "device_name": "EvoCRM iOS"
}
```

Validation (`422` when missing/invalid):

- `email` — required, email
- `password` — required, string
- `device_name` — required, string, max 120

The mobile client sends `device_name` automatically (`EvoCRM iOS` / `EvoCRM Android` / `EvoCRM Web`). It is **not** a login form field.

### Credential check

`User` is loaded by email. Password is `Hash::check` against the Fortify user. There is no second identity store.

**Incorrect email or password does not return 401.** It throws `ValidationException` → **HTTP 422**:

```json
{
  "message": "The provided credentials are incorrect.",
  "errors": {
    "email": ["The provided credentials are incorrect."]
  }
}
```

### Other failures before a token is issued

| Condition | Status | Body |
|---|---|---|
| Unverified email (`!$user->hasVerifiedEmail()`) | **403** | `{ "message": "Email is not verified." }` |
| User has no `workspace_id` | **403** | `{ "message": "User is not assigned to a workspace." }` |

No Google / Apple / Microsoft / magic-link / biometric login exists on `/api/v1`. Web OAuth (`/auth/google`, `/auth/meta`) is **not** the mobile contract.

### Success `200`

```json
{
  "data": {
    "token": "1|plainText…",
    "token_type": "Bearer",
    "user": { "id": 1, "name": "Lina", "email": "owner@clinic.dz", "role": "owner" },
    "workspace": { "id": 1, "name": "Evotechly", "slug": "evotechly-ab12c", "timezone": "Africa/Algiers" }
  }
}
```

`workspace` is `null` in the TypeScript type only if the user has no workspace. In practice the controller aborts 403 before issue when `workspace_id` is missing, so a successful token includes a workspace.

Token ability: **`workspace:{id}`** from `User::workspaceAbility()` → `'workspace:'.(int) $this->workspace_id`.

`role` is `WorkspaceRole` value: `owner` | `admin` | `member` (or null if unset).

## Revoke token — `DELETE /api/v1/auth/token`

| | |
|---|---|
| Controller | `AuthTokenController::destroy` |
| Middleware | `auth:sanctum`, `api-workspace`, `EnforceProductPermissions` |
| Permission | None (`api.v1.auth.revoke` is exempt) |
| Name | `api.v1.auth.revoke` |

Deletes **only the current** Sanctum `PersonalAccessToken`. Returns **204 No Content**.

Unauthenticated revoke → **401**. Missing workspace / wrong ability → **403** from `EnsureApiWorkspaceToken` (see below). The client still wipes local state if revoke fails.

## Current identity — `GET /api/v1/me`

| | |
|---|---|
| Controller | `MeController::show` |
| Middleware | `auth:sanctum`, `api-workspace`, `EnforceProductPermissions` |
| Permission | None (`api.v1.me.show` is exempt) |
| Name | `api.v1.me.show` |

### Success `200`

```json
{
  "data": {
    "user": { "id": 1, "name": "Lina", "email": "owner@clinic.dz", "role": "owner" },
    "workspace": { "id": 1, "name": "Evotechly", "slug": "evotechly-ab12c", "timezone": "Africa/Algiers" },
    "permissions": ["crm.view", "crm.edit", "desk.manage"]
  }
}
```

`permissions` is the list of keys from `config/permissions.capabilities` for which `$user->canPermission($permission)` is true. Owners get every capability. Admins/members follow defaults plus the user's `permissions` array / `*`.

`ApiPayload::user` / `ApiPayload::workspace` fields (exact):

| User | Workspace |
|---|---|
| `id` number | `id` number |
| `name` string | `name` string |
| `email` string | `slug` string |
| `role` string \| null | `timezone` string |

There are no extra `/me` fields (no teams list, no switcher, no refresh token, no expires_at).

## Workspace middleware — `EnsureApiWorkspaceToken`

Alias: `api-workspace` (`bootstrap/app.php`).

For every authenticated `/api/v1` route except `POST /auth/token`:

1. Abort **403** `"User is not assigned to a workspace."` if `!$user->workspace_id`
2. Abort **403** `"Token is not valid for this workspace."` if `!$user->tokenCan($user->workspaceAbility())`

The token is bound to the user's **current** `workspace_id`. There is no header, query, or body to select another workspace.

`AuthorizesApiWorkspace::ensureInWorkspace` returns **404** when a record's `workspace_id` does not match (same as web). Wrong-workspace is not 403.

## Product permissions — `EnforceProductPermissions`

`GET /me`, `DELETE /auth/token`, and `POST /devices` require no product permission.

Safe (GET) CRM/desk reads: no extra permission in v1 (web `crm.view` is not required on these API GETs).

Writes: `crm.edit` (contacts/leads/deals/activities/quotes) or `desk.manage` (thread reply). Missing permission → **403**.

**403 is authorization, not logout.**

## Status map the client must honour

| HTTP | Laravel meaning | Mobile meaning |
|---|---|---|
| 401 | Unauthenticated / revoked token | SESSION_EXPIRED. Wipe credentials. |
| 403 | Unverified, no workspace, bad ability, or missing product permission | Do **not** logout. Do not enter the shell if `/me` failed. |
| 404 | Record not in this workspace | Record missing. Keep session. |
| 422 | Validation, including bad login password | Field errors. Keep session (login never stored a token). |
| 429 | Throttle (token issue is 10/min) | Transient. Keep credentials. |
| 5xx | Server | Transient. Keep credentials. |

Network / timeout / offline are **not** invalid session.

## Workspace switching

**No endpoint exists.** There is no `POST /api/v1/workspaces/switch`, no workspace list on `/me`, and no ability other than `workspace:{currentId}`.

**WORKSPACE SWITCHING DEFERRED.** If `/me` later returns a different `workspace.id` than the last snapshot (server reassigned the user), the client evicts `ws:{oldId}:*` caches. That is not a user-initiated switcher.

## Not in this contract

- Refresh tokens
- Token expiry timestamp in the JSON body
- Biometric / SSO / magic link for `/api/v1`
- GraphQL
- `/api/v2`
- Client-side CRM business rules
