# M07 Security report

Threat model: stolen device, token in backups, token in logs, workspace leak, privilege confusion, MITM (HTTPS only; pinning later).

## Token storage

| Location | Allowed |
|---|---|
| `expo-secure-store` / Keychain / Keystore (`auth.sanctum_token`) | Yes — bearer only |
| In-memory web adapter | Yes — web is not a production credential target |
| AsyncStorage / prefs | **No tokens** |
| Zustand / React state as persistence | **No tokens** (session object in memory only) |
| Logs, analytics, deep-link URLs | **No tokens** |

`lib/storage/prefs.ts` refuses keys matching `token`, `password`, `secret`, `sanctum`, `authorization`.

Session identity (`user` / `workspace` / `permissions`) is **not** stored in SecureStore. It lives in `ws:{id}:identity` as a non-secret last-known snapshot for offline restore.

## Secrets scan (source)

Automated checks in `mobile/__tests__/secrets.test.ts`:

- No `APP_KEY=`, `META_APP_SECRET=`, `SANCTUM_TOKEN=`, `SMTP_PASSWORD=`, `EVOLUTION_API_KEY=`, or private keys in the Expo tree
- No `AsyncStorage.setItem` / `mergeItem` in the same file as Sanctum/Bearer writes
- No `console.log/info/debug/warn` of token, password, or Authorization

### Legitimate hits (not secrets)

| Hit | Why it is allowed |
|---|---|
| `SECURE_TOKEN_KEY = 'auth.sanctum_token'` | Logical key name |
| Fixture `1\|fixture-token-not-a-secret` | Unit-test fixture, not a production credential |
| `Authorization: Bearer ${token}` in `ApiClient` | Request construction; value is not logged |
| `device_name` | Public device label required by the API |
| Docs quoting `1\|plainText…` | Documentation ellipsis, not a live token |
| `password` field on the login form | User input; never persisted |

## 401 / 403

- 401 on any authenticated route → wipe + `expired`
- 403 → keep session (product permission or workspace/unverified on login)
- Client `can()` is UX only

## Logout

`DELETE /api/v1/auth/token` is best-effort. Local wipe always runs. UI must not claim remote revoke unless the client received 204.

## Deep links

`evocrm://deal/{id}` and other record URLs require `authenticated`. Booting and unauthenticated sessions do not mount record screens (`Stack.Protected`).

## Backend

No Laravel or web changes in M07. No domain rules cloned onto the device.
