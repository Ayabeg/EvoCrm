# EvoCRM Mobile (Expo)

One TypeScript codebase for iOS and Android.

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript + Expo Router  
**SUPERSEDED:** Swift + SwiftUI / Kotlin + Jetpack Compose dual-client (PR #235 — historical, do not merge)

This workspace is the **M06R foundation only**. There are no CRM feature screens. M07 (Auth + Workspace UX) has not started.

## Layout

```
mobile/
  app/           Expo Router (tabs + deep-link record seams)
  components/    Shared chrome
  features/      Empty — product modules start after M07
  lib/           API, auth, storage, workspace, permissions, seams
  services/      Wired runtime clients
  state/         Auth provider
  types/         /api/v1 contracts
  theme/         Mobile tokens
  config/        development | staging | production
  testing/       Fixtures only — no production API
```

## Commands

| Command | Purpose |
|---|---|
| `npm install` | Install |
| `npm start` | Expo dev server (no local Xcode required) |
| `npm run web` | Boot the app in a browser for foundation checks |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Jest (`jest-expo`) |
| `npm run config:check` | `expo config --type public` |
| `npm run doctor` | `expo-doctor` |
| `npm run export:android` | Android-compatible Metro export (not an EAS binary) |

Use a **development build** (`expo-dev-client` + EAS profile `development`) when a native module is not available in Expo Go. Do not prebuild unless a module requires it.

## Environments

Copy `.env.example` to `.env` locally. Only `EXPO_PUBLIC_*` API base URLs are allowed. Never ship Laravel or provider credentials.

## Backend

The client talks to existing Laravel `/api/v1` only. Workspace, permissions, and domain rules stay on the server. See `docs/api-v1.md` and `docs/mobile/`.
