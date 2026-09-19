# Mobile Parallelization

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript  
**SUPERSEDED:** Parallel iOS *and* Android implementation lanes (PR #234 `MOBILE-PARALLEL-LANES`, PR #235 dual trees).

## After M06R

There is **one** client. Do not staff “iOS implementer / Android implementer” for the same feature.

| Track | Work |
|---|---|
| A — Backend | P0 gaps G01–G04, then V1.1 list endpoints. Pest `Api/V1` |
| B — Expo client | M07+ screens against READY endpoints only |
| C — Design | Mobbin → mobile frames using locked tokens |
| D — Platform QA | iOS and Android *verification* where OS behavior differs |

## Must stay serial

1. Backend endpoint + `docs/api-v1.md` + Pest before a screen claims it
2. Thread detail after G04
3. Home production after G01
4. Activity done-state after G03
5. Deals list after G02 (board via `/leads/board` may ship earlier)
6. Push *send* after a server pipeline exists
7. M07 after M06R foundation is accepted (this PR is not merge-on-green automatically)

## Safe parallel after M07

- Contacts (READY) ∥ Quotes show/send (READY) ∥ Lead board/qualify (READY)
- Design token polish
- EAS preview profiles (still no store credentials)

## Staffing suggestion

- 1 backend (API gaps)
- 1–2 Expo (single codebase)
- Platform QA on both OS at feature complete — not a second implementation
