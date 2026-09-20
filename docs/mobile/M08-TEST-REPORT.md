# M08 Contacts — test report

**BASE SHA:** `99ed61ea715675ccd54ea6edadc4bfb6526d5397`  
**PR:** https://github.com/Mohamedbeghanem/EvoCrm/pull/249  
**Date:** 2026-09-20

## Gates (post-hardening, local Linux box)

| Gate | Result |
|---|---|
| `npm ci` | pass (prior assemble) |
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass** (fixed `react-hooks/set-state-in-effect` on contacts screens) |
| `npm test` | **pass** — 4 suites / 17 tests |
| `npx expo config --type public` | **pass** (sdk 57, version 0.7.0) |
| `npm run doctor` / `expo-doctor` | **pass** — 21/21 checks |

## Unit coverage added

| Suite | Focus |
|---|---|
| `contacts-list-helpers.test.ts` | merge dedupe, stale generation/query, next-page guards, initials |
| `contacts-linking.test.ts` | mailto/tel builders + openExternalUrl failure swallow |
| `contacts-errors.test.ts` | 401/403/404/offline/5xx copy; no SQL internals |
| `contacts-subtitle.test.ts` | subtitle join / empty label |

## Not claimed

- Detox / Maestro / device E2E
- Android emulator or iOS Simulator manual pass
- Live API integration against a real workspace in this run

## Hardenings validated by tests + review

- Duplicate-id merge on append
- Stale search response discard keys
- Pagination pending-page / endReached lock helpers
- mailto/tel null for empty/malformed
- Permission denial UI for write routes (render-path, not sync effect setState)
