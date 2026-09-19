# Mobile Technical Architecture

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript + Expo Router  
**SUPERSEDED:** Swift + SwiftUI / Kotlin + Jetpack Compose (PR #235 historical)  
**Verified against official Expo docs (SDK 57, 2026):**  
https://docs.expo.dev/versions/latest/ · https://docs.expo.dev/router/introduction/ · https://docs.expo.dev/versions/latest/sdk/securestore/

## Stack (M06R)

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Expo SDK **57** / React Native **0.86** | Current supported pairing from Expo docs |
| Language | TypeScript **~6.0** (template pin) | `strict` |
| Routing | Expo Router **57** | File-based; typed routes experiment on |
| Builds | Expo Go for JS; **development builds** when native modules require them | `expo-dev-client` installed; no repo prebuild |
| Cloud builds | `mobile/eas.json` prepared | No App Store credentials in this phase |
| Tokens | `expo-secure-store` | Never AsyncStorage |
| Non-sensitive prefs | AsyncStorage | Guard rejects token-like keys |

Do not eject or commit `ios/` / `android/` unless a future module cannot ship as a config plugin.

## System context

```
┌──────────────────────┐   HTTPS JSON    ┌──────────────────────────────┐
│ EvoCRM (Expo)        │◄───────────────►│ Laravel EvoCrm               │
│ iOS + Android        │  Bearer Sanctum │ /api/v1/*                    │
│ one TypeScript tree  │  workspace:{id} │ auth:sanctum                 │
└──────────────────────┘                 │ api-workspace                │
                                         │ EnforceProductPermissions    │
                                         │ → same Services as Inertia   │
                                         └──────────────────────────────┘
```

Web Inertia remains the system of record for admin surfaces. Mobile never talks to Evolution / Meta / SMTP.

## Client layers

```
mobile/
  app/            Expo Router screens (placeholders + deep-link seams)
  components/
  features/       CRM modules start at M08; auth lives in lib/ + app/(auth)
  lib/api         catalog, client, error mapping
  lib/auth        session state machine
  lib/storage     SECURE vs NON-SENSITIVE
  lib/workspace   ws:{workspaceId}: isolation
  lib/permissions parse /me only
  lib/deeplink
  lib/push        device register seam
  services/       wired ApiClient + AuthService
  state/          AuthProvider
  theme/          tokens
  config/         development | staging | production
```

## API client rules

1. Base URL must end with `/api/v1`
2. Headers: `Accept: application/json`, `Authorization: Bearer {token}` when required
3. Map 401 / 403 / 404 / 422 / 429 / 5xx / timeout / offline / parse failure
4. Unknown or P0-blocked paths throw — no silent mocks
5. Never call Inertia routes or Desk iframe URLs

## Auth sequence (M07)

1. Boot screen while `booting` / `unknown`
2. `POST /api/v1/auth/token` (`email`, `password`, `device_name`)
3. Store plaintext token in SecureStore **only**
4. `GET /api/v1/me` → user, workspace, permissions (required to enter the shell)
5. `DELETE /api/v1/auth/token` on logout + wipe secure + workspace caches

States: `booting` | `unknown` | `unauthenticated` | `authenticating` | `authenticated` | `expired`

Workspace switching is **deferred** — no backend contract. See `M07-AUTH-STATE-MACHINE.md`.

## Shared truth with backend

| Concern | Source of truth |
|---|---|
| Qualify / convert | `LeadConverter::convert` |
| Stage move | `Deal::moveTo` |
| Contact identity | `ContactIdentity::createUnique` |
| Activity write | `ActivityRecorder::record` |
| Inbox reply | `DeskComposer::reply` |
| Quote send | `QuoteMailer::send` |
| Permissions | `/me` array + server policies |
| Workspace | `EnsureApiWorkspaceToken` + Eloquent scope |

## Navigation

Expo Router tabs: HOME · CRM · INBOX · ACTIVITIES · MORE  
Nested prep routes: `/contact/[id]`, `/company/[id]`, `/lead/[id]`, `/deal/[id]`, `/activity/[id]`, `/thread/[id]`, `/quote/[id]`  
Scheme: `evocrm://`

## Why Expo again

PR #233 selected Expo. M05/M06 explored dual-native. M06R restores one client so future phases do not duplicate iOS and Android implementation. Platform-specific QA remains where OS behavior differs (Keychain persistence, notification permission chrome, share sheet).
