# M07 Test report

Executed 2026-09-19 on `feat/mobile-m07-auth-workspace`. Production API was **not** called. Fixtures live in `mobile/testing/fixtures/`.

## Commands

| Command | Result | Notes |
|---|---|---|
| `npm ci` | PASS | Peer-dep warnings only (Expo template) |
| `npm run typecheck` | PASS | |
| `npm run lint` | PASS | |
| `npm test` | PASS | **73** tests, 21 suites |
| `npx expo config --type public` | PASS | sdkVersion 57.0.0, version 0.7.0 |
| `npx expo-doctor` | PASS | 21/21 |
| Expo web boot | **WEB BOOT VERIFIED** | `http://127.0.0.1:8081` — product login, validation, network stay-on-login |
| EAS Android | **NOT EXECUTED AUTH REQUIRED** | `eas` CLI not installed / not logged in |
| EAS iOS | **NOT EXECUTED AUTH REQUIRED** | No Mac; EAS not logged in |

Do not write PASS for unexecuted native/EAS gates.

## Coverage executed

- Auth state machine (`booting` / `unknown` / `unauthenticated` / `authenticating` / `authenticated` / `expired`)
- Login: 422 credentials, 403 unverified, 429, timeout, token + `/me` fail, TypeError → unreachable
- SecureStore token only; prefs never hold the bearer
- Workspace isolation + logout wipe + server reassignment evicts old `ws:{id}:*`
- `can()` deny unknown
- 401 centralized; 403/404/422/429/500/timeout/offline distinctions
- Logout revoke failure still local (`remoteRevoked: false`)
- Router guards + deep-link auth (no Deal UI when unauthenticated)
- Login / boot / More chrome render tests
- Secrets scan: AsyncStorage + token, console token/password

## Web runtime

Hard-refreshed Expo web after the network-mapping fix:

- Product sign-in (not M06R foundation chrome)
- Empty submit → required-field errors
- Submit with no Laravel listener → **Could not reach the server.**
- Did not enter the authenticated shell

## Honesty

Android/iOS device runtimes and EAS APK/AAB/IPA were **not** executed. Same constraint as M06R.
