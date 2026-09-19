# M07 Test report

Executed on the M07 branch after implementation. Production API is **not** called. Fixtures live in `mobile/testing/fixtures/`.

## Commands

| Command | Result | Notes |
|---|---|---|
| `npm ci` | PENDING this revision | Recorded after CI / local run |
| `npm run typecheck` | PENDING | |
| `npm run lint` | PENDING | |
| `npm test` | PENDING | Count recorded after run |
| `npx expo config --type public` | PENDING | |
| `npx expo-doctor` | PENDING | |
| Expo web boot | PENDING | WEB BOOT VERIFIED only after a successful runtime |
| EAS Android | **NOT EXECUTED AUTH REQUIRED** | `eas-cli` not logged in (same as M06R) |
| EAS iOS | **NOT EXECUTED AUTH REQUIRED** | No Mac; EAS not logged in |

Do not write PASS for unexecuted gates.

## Coverage intended

- Auth state machine (`booting` / `unknown` / `unauthenticated` / `authenticating` / `authenticated` / `expired`)
- Login: 422 credentials, 403 unverified, 429, timeout, token + `/me` fail
- SecureStore token only; prefs never hold the bearer
- Workspace isolation + logout wipe + server reassignment evicts old `ws:{id}:*`
- `can()` deny unknown
- 401 centralized; 403/404/422/429/500/timeout/offline distinctions
- Logout revoke failure still local
- Router guards + deep-link auth (no Deal UI when unauthenticated)
- Secrets scan: AsyncStorage + token, console token/password

## Honesty

Android/iOS EAS binaries were **not** executed in M06R and are **not** executed in M07 unless an authenticated EAS run is performed later.
