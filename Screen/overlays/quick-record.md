# Quick record (row peek)

## 1. Screen Identity

Screen ID: `OVR-SHELL-006`
Product area: Shell overlays / CRM peek
Route: Overlay. Hydration `GET /crm/records/{type}/{id}/peek` named `crm.records.peek` (`type` in contact|company|lead|deal|quote).
Route name: `crm.records.peek`
Frontend file: `resources/js/ds/workspace/QuickRecordDrawer.tsx` + `resources/js/ds/workspace/quick-record/context.tsx`
Primary component: `QuickRecordDrawer` inside `QuickRecordProvider` (`AppLayout`)
Layout: Right `Drawer` `data-ds="quick-record-drawer"`, width `lg:480px` / `sm:min(92vw,520px)` / mobile full
Authentication: Peek JSON requires the authenticated CRM group
Permissions: Payload includes `permissions.can_view/can_update` and `capabilities` per section. 403 → forbidden error (no retry / no open-full if forbidden).
Parent navigation: Command search hits with `recordRef`; `RecordLink mode="drawer"` on dashboard recent/work and activity work queue
Entry points: `openRecord({type,id})`. Dev harness `SCR-DEV-001`. **Production lists still open full records** (harness comment; `list-view-table` has no drawer mode).
Exit points: Close, Open full (`router.visit` fullRecordHref), association replace (stack), Back
Runtime HTTP (owner, simple_mode=true): Peek not in runtime-index. Harness GET `/crm/quick-record-drawer/harness` 200 with `samples`. `[CONFIRMED-BOTH]` for mount; `[UNVERIFIED]` peek JSON for id 1
Evidence: `QuickRecordDrawer.tsx`, `context.tsx`, `hydrate.ts`, `QuickRecordController.php`, `routes/web.php`, `RecordLink.tsx`, dashboard-recent/work, activity-work-queue, harness page.

## 2. Purpose

P09/P10 peek: inspect a CRM record (overview, activity, notes, tasks, associations) without leaving the current list/home, then optionally jump to the full hub.

## 3. Current UX Summary

Opening sets status `loading` (skeleton). Success shows identity (initials avatar, title, subtitle, status pill, owner), section pills if more than overview, then the active section. Notes/tasks are explicitly read-only with helper copy. Associations are buttons that `replace` (push history). Footer-ish action chips exclude `open_full` (that lives in the header). Pin is a no-op (`// Reserved. P09 does not persist a pinned peek.`).

Escape: if Command OS is open, peek does **not** close (`handleQuickRecordEscapeKeyDown`).

## 4. Screen Anatomy

Sticky header: Back (if `history.length`), identity, Open full, Close (`data-drawer-close`, autofocused on open). Section nav `aria-pressed`. Body: skeleton / error / ready sections. Overlay 18% black.

## 5. Data Displayed

Types: contact, company, lead, deal, quote.

Descriptor (adapted client-side from peek payload): title, subtitle, initials, status tone, owner, `fullRecordHref`, `keyProperties`, associations, activity/notes/tasks items, actions (`email|call|open_full`), capabilities, permissions, optional deal `attention` signals.

Peek payload: `record` bag, associations, activity, notes, tasks, capabilities, permissions, attention.

## 6. Primary Actions

Open full. Close. Switch section. Open association (stack). Retry on retryable errors.

## 7. Secondary Actions

Header Open full disabled until href exists. Action links (`email`, `call`) if `capabilities.actions`. Back through history. Pin API exists, does nothing.

## 8. Search

NOT PRESENT inside the drawer. Command OS search is the finder.

## 9. Filters

Section pills only.

## 10. Sorting

Server order for activity/notes/tasks.

## 11. Selection

One record current; history stack for back. No multi-peek.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

One GET per open/replace. AbortController on change. Request ids drop stale hydrations (`reduceQuickRecord`). No pagination of activity.

## 14. Forms

Read-only. Create/complete happens on the full record (copy says so).

## 15. Overlays

This drawer. Can be opened while Command OS was the invoker (OS closes first). Ask Evo identity can switch to `qrd` while peek is open (full mode).

## 16. States

`idle` (closed), `loading`, `ready`, `error` (`not_found` | `forbidden` | `network` | `malformed`). History empty vs stacked.

## 17. Empty State

Per section: “No activity on this record”, “No notes”, “No tasks”, “No associations”. Overview still shows property rows (empty values use `EMPTY_VALUE`).

## 18. Error Handling

| code | message | retry | open full |
| --- | --- | --- | --- |
| not_found | missing or no longer visible | yes | yes (href) |
| forbidden | no permission | no | no |
| network | could not be loaded | yes | yes |
| malformed | reference not valid | no | no |

404/403 from fetch mapped in `errorFromResponse`. Parse failure treated as error.

## 19. Feedback

Skeleton; error buttons; status pills; attention list `data-crm="deal-attention"`. Close restores `state.opener` focus.

## 20. Navigation Behavior

Open full closes then `router.visit`. Lists generally do **not** use peek (`mode` default `'full'` on `RecordLink`). Command search with `recordRef` does.

## 21. Entity Relationships

Associations are other of the five types; clicking stacks. Deal attention may reference related signals. Email/call actions href to full-record flows `[UNVERIFIED]` exact hrefs.

## 22. Business Rules

- Only five types.
- Numeric id ≥ 1.
- Section visibility from capabilities; fallback overview.
- Notes/tasks read-only in peek.
- Pin not persisted.
- Command OS open blocks Escape-close.

## 23. Backend Dependencies

`QuickRecordController@peek`, `App\Support\QuickRecordPeek`. Auth + permissions middleware.

## 24. Frontend Dependencies

Drawer DS, adapters (`record-adapters/*`), `command-os` escape helper, `t()`, attention tones, motion/overflow classes.

## 25. Responsive Behavior

`[CONFIRMED-CODE]` widths in §1. Section nav `overflow-x-auto`. `NOT VERIFIED` on a phone.

## 26. Accessibility Observations

**CONFIRMED:** DrawerTitle/Description, close/open-full labels, section `aria-pressed`, association buttons, focus to close on open, restore opener on close, attention heading.

**LIKELY ISSUE:** section nav `aria-label` is the record title (odd); property values truncate with title tooltip only; action `<a>` not buttons; English mixed with `t()`.

**REQUIRES MANUAL TEST:** keyboard through sections, SR on skeleton, stacking with command.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| QRD-001 | HIGH | List rows do not open peek | Peek is easy to miss | RecordLink default full; lists |
| QRD-002 | MEDIUM | Pin advertised in API, no UI | Dead capability | `pin` no-op |
| QRD-003 | MEDIUM | Read-only notes/tasks with no deep-link per item | Extra Open full | copy + ActivityList |
| QRD-004 | LOW | Malformed/forbidden cannot retry | Correct but abrupt | error buttons |
| QRD-005 | OBSERVATION | Harness is the only dedicated opener | See SCR-DEV-001 | local-only route |

## 28. Consistency Comparison

Full record hubs (`record-hub`) are editable, multi-card, Ask Evo panel. Peek is a subset. Create drawers are write; peek is read. Public quote is not a peek.

## 29. Functional Preservation Contract

- Keep provider at AppLayout.
- Keep peek URL shape and five types.
- Keep sections, attention, association stack, open full, retry rules, escape vs command OS, opener focus restore.
- Keep production lists on full href unless product changes P10 list integration.
- Keep pin as non-persisting unless explicitly built.

## 30. Design Input Contract

Purpose: peek a record.
Primary goal: identify the record and decide to open full.
Primary actions: open full, close, switch section, open association.
Required information: title, status, owner, key properties, attention, activity/notes/tasks/associations as permitted.
Required components: right drawer, identity header, section pills, property list, error/skeleton.
Required states: loading, ready, four error codes, history.
Must not remove: permission-based sections, forbidden handling, five types.

## 31. Open Questions / Unknowns

- `[UNVERIFIED]` peek payload for contact 1 on this seed.
- `[UNKNOWN]` whether command search always includes `recordRef` for all five types.
- When will list rows switch to `mode="drawer"`?
