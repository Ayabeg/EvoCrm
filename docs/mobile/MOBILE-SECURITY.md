# Mobile Security

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript  
**SUPERSEDED native storage mapping:** iOS Keychain / Android Keystore via Swift/Kotlin wrappers (PR #235). Current equivalent is **expo-secure-store** (Keychain / Android Keystore under the hood).  
Sources: https://docs.expo.dev/versions/latest/sdk/securestore/ · `docs/api-v1.md`

## Threat model

| Threat | Mitigation |
|---|---|
| Stolen device | Remote token revoke; SecureStore; biometric unlock is a later local gate only |
| Token theft from backups | `expo-secure-store` + Android Auto Backup exclusion plugin |
| API over-exposure | `/api/v1` catalog only |
| Cross-workspace access | Server `workspace:{id}` ability; client `ws:{id}:` cache keys; logout clears workspace caches |
| Privilege escalation | Server `EnforceProductPermissions` + G4 policies. Client parses `/me` only |
| MITM | HTTPS only. Pinning is post-V1 |
| Malicious deep link | Auth guard; no tokens in URLs |

## Token model

1. `POST /api/v1/auth/token` with verified email + password + `device_name`
2. Token ability is `workspace:{id}` (Laravel)
3. `DELETE /api/v1/auth/token` revokes the current token (`204`)
4. Client stores the bearer token in **SecureStore only**

## Storage policy

| Data | Store |
|---|---|
| Sanctum token | Secure (`auth.sanctum_token`) |
| Session meta (user/workspace/permissions) | Secure |
| `ws:{workspaceId}:*` caches | Non-sensitive prefs, evictable; never tokens |
| Push device token | Sent to `POST /api/v1/devices`; do not persist in AsyncStorage |
| Logs | No tokens, no message bodies |

`lib/storage/prefs.ts` refuses keys that look like tokens/passwords/secrets.

Web is not a production credential target. The web SecureStore adapter is in-memory so Expo web can boot the foundation without using AsyncStorage for tokens.

## Secrets that must NEVER ship in Expo env or bundles

- Laravel `APP_KEY`
- Meta / Evolution / SMTP / mailbox credentials
- Bounce / webhook keys
- OAuth client secrets
- Any provider token

`EXPO_PUBLIC_*` values are inlined into the JS bundle. Only public API base URLs are allowed.

## Permissions

The client does **not** implement a second permission engine. `parsePermissions` is a list parse. UI may hide actions missing from `/me`; the server still enforces.

## Push

`POST /api/v1/devices` registers APNs/FCM tokens. v1 does not send notifications. Unregister-on-logout is backend gap G13.
