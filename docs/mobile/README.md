# EvoCRM Mobile

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript + Expo Router  
**SUPERSEDED:** Swift + SwiftUI / Kotlin + Jetpack Compose dual-client  
**Workspace:** [`mobile/`](../../mobile/) — one codebase for iOS and Android  
**Backend:** Laravel `/api/v1` is workspace, permission, and domain truth

## Status

| Phase | State |
|---|---|
| M00–M05 | Research complete (PRs #233, #234) |
| M06 native Swift/Kotlin | Superseded. PR #235 stays open as historical reference — do not merge, do not add Expo to it |
| **M06R** | Expo foundation — merged PR #237 (`a9b3095`) |
| **M07** | Auth + Workspace UX — this program |
| M08 | Contacts loop — not started |

See [M07-STATUS.md](./M07-STATUS.md), [M07-M08-HANDOFF.md](./M07-M08-HANDOFF.md), [M06R-STATUS.md](./M06R-STATUS.md).

## What is preserved from earlier PRs

Useful research from #233 / #234 remains in force even though the dual-native stack decision is not:

- `/api/v1` contract and P0 gap matrix
- Security: Sanctum bearer, workspace ability, no provider secrets on device
- Workspace isolation and server-side permissions
- Parity of product behavior (now one client, platform QA where OS behavior differs)
- Mobbin iOS references (`research/`)
- V1 scope and navigation IA (HOME / CRM / INBOX / ACTIVITIES / MORE)

Swift/Kotlin implementation notes on PR #235 are **reference only**.

## Document index

| File | Role |
|---|---|
| [MOBILE-TECHNICAL-ARCHITECTURE.md](./MOBILE-TECHNICAL-ARCHITECTURE.md) | Current Expo architecture |
| [MOBILE-SECURITY.md](./MOBILE-SECURITY.md) | Tokens, storage, secrets |
| [MOBILE-CI-CD.md](./MOBILE-CI-CD.md) | Linux CI + future EAS |
| [MOBILE-ROADMAP.md](./MOBILE-ROADMAP.md) | Phases after the Expo reset |
| [MOBILE-PARALLELIZATION.md](./MOBILE-PARALLELIZATION.md) | One client, no iOS/Android implementation fork |
| [MOBILE-API-GAP-MATRIX.md](./MOBILE-API-GAP-MATRIX.md) | Backend handoffs (do not invent in RN) |
| [MOBILE-V1-SCOPE.md](./MOBILE-V1-SCOPE.md) | MUST / SHOULD / LATER |
| [MOBILE-NAVIGATION.md](./MOBILE-NAVIGATION.md) | Tab IA |
| [MOBILE-DESIGN-SYSTEM.md](./MOBILE-DESIGN-SYSTEM.md) | Mobile tokens |
| [M07-AUTH-WORKSPACE-AUDIT.md](./M07-AUTH-WORKSPACE-AUDIT.md) | Live `/api/v1` auth contract |
| [M07-AUTH-STATE-MACHINE.md](./M07-AUTH-STATE-MACHINE.md) | Client session states |
| [M07-WORKSPACE-CONTRACT.md](./M07-WORKSPACE-CONTRACT.md) | Isolation + switch deferred |
| [M07-SECURITY-REPORT.md](./M07-SECURITY-REPORT.md) | Token / secrets scan |
| [M07-TEST-REPORT.md](./M07-TEST-REPORT.md) | Executed gates |
| [M07-M08-HANDOFF.md](./M07-M08-HANDOFF.md) | Contacts next |
| [M07-STATUS.md](./M07-STATUS.md) | M07 scoreboard |

## Product law

Mobile is a thin native client over the same Laravel product. It does not duplicate qualify/move/reply/send rules, does not scrape Inertia, and does not embed Desk iframes.
