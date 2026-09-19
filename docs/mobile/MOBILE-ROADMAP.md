# Mobile Roadmap

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript  
**Do not restart M00–M05.** Research from those phases stands.  
**SUPERSEDED:** Dual-native M06 implementation and the iOS-vs-Android lane split for *implementation*.

## Recorded history

| Phase | Outcome |
|---|---|
| M00–M05 | Research complete (#233 planning, #234 native review, Mobbin, API gaps, security) |
| M06 | Native Swift + Kotlin foundation attempt — **superseded**. PR #235 remains historical |
| **M06R** | Expo foundation (current). One client codebase |
| **M07** | Auth + Workspace product UX (next; not started) |

## Forward phases (single client)

Future work is **one TypeScript implementation**. Keep platform-specific QA where behavior differs (notifications permission UI, Keychain persistence after reinstall, share sheet, biometric chrome).

| Phase | Goal | Notes |
|---|---|---|
| M07 | Auth + Workspace UX | Replace foundation seam; still `/api/v1/auth/token` + `/me` |
| M08 | Contacts loop | READY endpoints |
| M09 | Inbox thread show | **Blocked on G04** |
| M10 | Activities complete | **Blocked on G03** |
| M11 | Home feed | **Blocked on G01** |
| M12 | Deals list | **Blocked on G02**; show/move already exist |
| M13 | Quotes show/send | READY |
| M14 | Hardening | Offline, a11y, E2E |
| M15 | Beta | TestFlight / Play internal via EAS |

Original #233 M1–M9 numbering is historical planning. Do not reopen M00–M05 as work.

## Stop

M07 has not started. Do not implement product login chrome, workspace switcher UX, or CRM screens on this foundation PR.
