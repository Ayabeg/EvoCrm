# Mobile Roadmap

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript  
**Do not restart M00–M05.** Research from those phases stands.  
**SUPERSEDED:** Dual-native M06 implementation and the iOS-vs-Android lane split for *implementation*.

## Recorded history

| Phase | Outcome |
|---|---|
| M00–M05 | Research complete (#233 planning, #234 native review, Mobbin, API gaps, security) |
| M06 | Native Swift + Kotlin foundation attempt — **superseded**. PR #235 remains historical |
| **M06R** | Expo foundation. Merged PR #237 |
| **M07** | Auth + Workspace product UX |
| **M08** | Contacts loop — **merged** PR #249 (`d2809ab7e81cc923a8d1ad13de420f7591faa80c`) — **FROZEN** |

## Forward phases (single client)

Future work is **one TypeScript implementation**. Keep platform-specific QA where behavior differs (notifications permission UI, Keychain persistence after reinstall, share sheet, biometric chrome).

| Phase | Goal | Notes |
|---|---|---|
| M07 | Auth + Workspace UX | Done |
| M08 | Contacts loop | **Done / frozen** |
| M09 | Next CRM slice | Prefer **Companies list/show** (READY endpoints). Historical “Inbox thread show” remains **blocked on G04** |
| M10 | Activities complete | **Blocked on G03** |
| M11 | Home feed | **Blocked on G01** |
| M12 | Deals list | **Blocked on G02**; show/move already exist |
| M13 | Quotes show/send | READY |
| M14 | Hardening | Offline, a11y, E2E |
| M15 | Beta | TestFlight / Play internal via EAS |

Original #233 M1–M9 numbering is historical planning. Do not reopen M00–M05 as work.

## Stop

M08 is frozen. Do not reopen Contacts except for proven regressions. Start M09 only against READY `/api/v1` endpoints.
