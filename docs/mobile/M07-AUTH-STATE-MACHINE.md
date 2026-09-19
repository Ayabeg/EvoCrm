# M07 Auth state machine

Machine names are lowercase. The mission labels map as:

| Mission | Client `AuthStatus` |
|---|---|
| BOOTING | `booting` |
| UNKNOWN | `unknown` (treated as booting; no login flash) |
| UNAUTHENTICATED | `unauthenticated` |
| AUTHENTICATING | `authenticating` |
| AUTHENTICATED | `authenticated` |
| SESSION_EXPIRED | `expired` |

Initial in-memory status is **`booting`**. The root navigator renders `BootScreen` while `booting` or `unknown`. It does not mount login or tabs.

## Transitions

```
booting ──restore_missing──────────────► unauthenticated
booting ──restore_valid────────────────► authenticated
booting ──restore_offline_cached───────► authenticated   (token kept; last /me snapshot)
booting ──restore_offline_uncached─────► booting         (token kept; Retry)
booting ──expired (401)────────────────► expired

unauthenticated ──login_start──────────► authenticating
authenticating ──login_success─────────► authenticated
authenticating ──login_failure─────────► unauthenticated
authenticating ──/me 401───────────────► expired

authenticated ──401 on any authed call─► expired
authenticated ──logout─────────────────► unauthenticated
authenticated ──403/404/422────────────► authenticated   (error shown; session kept)

expired ──login_start──────────────────► authenticating
expired ──logout / abandon─────────────► unauthenticated
```

Reducer: `reduceAuthStatus` in `mobile/lib/auth/session.ts`.

## Login sequence

1. Client validates email + password locally (required + email shape). No other fields.
2. Status → `authenticating`.
3. `POST /api/v1/auth/token` with `{ email, password, device_name }`.
4. Failure (422/403/429/5xx/timeout/offline) → throw mapped `ApiError`, status `unauthenticated`, **no token stored**.
5. Success → write **only** the bearer token to SecureStore.
6. `GET /api/v1/me`.
7. `/me` 200 → persist `ws:{id}:identity` + `auth.last_workspace_id`, status `authenticated`, enter shell.
8. `/me` 401 → wipe token, status `expired`, **do not enter shell**.
9. `/me` anything else → **do not enter shell**. Token is kept unless 401. Offline/5xx after a fresh token is not an invalid session.

Token OK + `/me` fail = no authenticated shell.

## Restore sequence

Intentional bootstrap. No login flash.

1. Status starts `booting`.
2. Read SecureStore token.
3. Missing token → `unauthenticated` (login).
4. Token present → `GET /me`.
5. `/me` 200 → authenticated from **server truth**.
6. `/me` 401 → wipe, `expired`.
7. Transient (`offline`, `timeout`, `server`, `parse_failure`, `rate_limited`):
   - Last identity snapshot exists → `authenticated` with that snapshot. Credentials stay. Shell may show last-known workspace.
   - No snapshot → stay `booting` with Retry / “Use a different account”. Token is **not** discarded.
8. `403` / `404` / `422` on `/me` → keep token, do not enter shell, status `unauthenticated` plus error. This is **not** logout.

## Logout sequence

1. `DELETE /api/v1/auth/token`.
2. `remoteRevoked = result.ok` (204 only).
3. Always wipe: SecureStore token, `auth.last_workspace_id`, every `ws:{id}:*` pref.
4. Status `unauthenticated`.
5. If revoke failed, UI must not claim the server revoked the token.

## Centralized 401

`ApiClient` invokes `onUnauthorized` when an **authenticated** call returns 401. `AuthService.expireFromUnauthorized()` wipes and sets `expired`. `POST /auth/token` does not notify (unauthenticated route). 403 never expires the session.

## Offline ≠ invalid session

A network failure must not destroy a stored token. The boot screen says so when restore is stuck offline without a snapshot.
