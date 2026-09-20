# EvoCRM Mobile (Expo)

One TypeScript codebase for iOS and Android.

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript + Expo Router  
**SUPERSEDED:** Swift + SwiftUI / Kotlin + Jetpack Compose dual-client (PR #235 — historical, do not merge)

This workspace is the Expo client (**M06R** foundation + **M07** Auth + Workspace + **M08** Contacts). Contacts list/search/create/show/update are live against `/api/v1/contacts`. Later CRM modules still start in `features/`.

## Layout

```
mobile/
  app/           Expo Router (tabs + deep-link record seams)
  components/    Shared chrome
  features/      Product modules (contacts = M08)
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

## M08 Contacts

**Status:** IMPLEMENTED / PR OPEN ([#249](https://github.com/Mohamedbeghanem/EvoCrm/pull/249)) — not shipped.

- CRM tab → contact list + search + pagination (race-safe + page locks)
- `/contact/new` create (requires `crm.edit`; denial if missing)
- `/contact/[id]` show (safe mailto / tel — no WhatsApp in M08)
- `/contact/[id]/edit` update (requires `crm.edit`)
- Uses catalog endpoints only: `contactsIndex` / `contactsStore` / `contactsShow` / `contactsUpdate`
- Docs: `docs/mobile/M08-*.md` + `docs/mobile/research/M08-CONTACTS-MOBBIN.md`
