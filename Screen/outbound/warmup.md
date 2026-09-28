# Outbound mailbox warmup

## 1. Screen Identity

Screen ID: `SCR-OUT-015`
Product area: Outbound / Settings
Route: `/outbound/warmup`
Route name: `outbound.warmup.index`
Frontend file: `resources/js/pages/outbound/warmup.tsx`
Primary component: `WarmupIndex`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Warmup"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET would be open **except** Simple Mode. Mutations `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Settings subtab **Warmup**. Also `SimpleMode::FULL_NAV` item `outbound-warmup` (full mode rail only). Command palette does not feature-flag this href separately (users reach via Settings subtab). [CONFIRMED-CODE]
Entry points: Settings subtabs (always rendered); sequence Settings link; full-mode nav item.
Exit points: room tabs.
Runtime HTTP (owner, simple_mode=true): **`403` Forbidden**. `EnforceSimpleMode` → `SimpleMode::blocks()` true for path prefix `/outbound/warmup`. No Inertia component. [CONFIRMED-UI] `Screen/_evidence/runtime-index.json`
Full-mode screen documented below from `WarmupController` + `warmup.tsx` as [CONFIRMED-CODE]. Tests: `SimpleModeGuardTest` GET forbidden; `SimpleModeNavTest` href not in simple nav.

Evidence: runtime-index.json (403); `app/Support/SimpleMode.php`; `app/Http/Middleware/EnforceSimpleMode.php`; `app/Http/Controllers/Outbound/WarmupController.php`; `resources/js/pages/outbound/warmup.tsx`; `app/Services/Outbound/WarmupPlanner.php`.

## 2. Purpose

Ramp each sendable mailbox’s daily cap on a conservative Africa/Algiers plan (8→12→18→25→35→45, hold at ceiling default 40). Optional peer pings only between this workspace’s own mailboxes. No third-party warmup network.

## 3. Current UX Summary

[CONFIRMED-CODE] KPI strip (warming / active / sent today / ramp days), ramp legend, per-mailbox panels (caps, fail rate, EvoViz sent-vs-cap chart, start/stop, ceiling, peer-pings checkbox), system-role table with opt-in.

[CONFIRMED-UI] Owner in simple_mode never sees this page; HTTP 403. Laravel default 403 (no dedicated Inertia 403 page under `resources/js/pages`). Settings subtab still shown — click fails.

## 4. Screen Anatomy

[CONFIRMED-CODE]

1. Settings chrome; Warmup subtab active when path matches.
2. Title “Mailbox warmup” + ramp description interpolating `ramp.join(' → ')` and `defaultCeiling`.
3. `CrmKpiStrip` 4 tiles.
4. HairlinePanel “The ramp” day chips.
5. Empty HairlinePanel if no sendable mailboxes.
6. Per sendable mailbox HairlinePanel: badges, 5 stats, optional `EvoVizChart`, Start/Stop, ceiling + peer pings form.
7. System mailboxes HairlineTable if any (abuse@, dmarc@, postmaster@, noreply@).

## 5. Data Displayed

[CONFIRMED-CODE] `WarmupController::index`

- `mailboxes`: sendable rows via `WarmupPlanner::sendable` — id, names, address, effective_status, is_system, warming, day, cap, sent_today, remaining, ceiling, peers, fail_rate (14d), next_cap, chart payload or null.
- `systemMailboxes`: system-role addresses with enabled + opted_in.
- `ramp`: `WarmupPlanner::RAMP` = `[8, 12, 18, 25, 35, 45]`.
- `defaultCeiling`: 40.
- `summary`: warming count, active count, sent_today sum, cap_today sum of daily_limit.

Chart: `evoviz.line` last 14 Algiers days Sent vs Daily cap; hidden if no sends and not warming.

## 6. Primary Actions

[CONFIRMED-CODE]

- **Start warmup / Stop warmup** POST `/outbound/warmup/{mailbox}/toggle`.
- **Save** PUT `/outbound/warmup/{mailbox}` ceiling + peers.

## 7. Secondary Actions

[CONFIRMED-CODE]

- **Include in warmup / Remove from warmup** POST `/outbound/warmup/{mailbox}/include` (system addresses only; 404 if not system).

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT. Sendable vs system split is structural. [CONFIRMED-CODE]

## 10. Sorting

Mailboxes `orderByDesc is_default` then `id`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

All sendable boxes. Charts query sent_at 14 days per box. [CONFIRMED-CODE]

## 14. Forms

PUT: `warmup_ceiling` 1–10000; `warmup_peers` boolean. Hidden `warmup_peers=0` plus checkbox `1`. [CONFIRMED-CODE]
If warming and ceiling < today’s cap, daily_limit clamped. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT.

## 16. States

[CONFIRMED-CODE]

- Empty sendable: enable mailbox first; system roles hidden unless opted in.
- warming badge + Day N.
- system role · opted in.
- peer pings on.
- Chart vs no chart.
- Stop vs Start button variant.
- Toggle 422 if mailbox not enabled (“Enable the mailbox under Outbound → Mailboxes first.”).

[CONFIRMED-UI] simple_mode: 403, no states rendered.

## 17. Empty State

[CONFIRMED-CODE] Copy to enable a mailbox; system roles stay hidden unless opted in.

## 18. Error Handling

[CONFIRMED-CODE] workspace 404; toggle abort_if not enabled 422; include abort_unless system 404.
[CONFIRMED-UI] simple_mode 403 entire prefix including POST `/outbound/warmup/...`.

## 19. Feedback

No toasts. [CONFIRMED-CODE]

## 20. Navigation Behavior

[CONFIRMED-CODE] `back()` after mutations. Breadcrumbs Warmup.
[CONFIRMED-UI] From Settings subtab in simple_mode, navigation 403s.
Full mode: `FULL_NAV` exposes Warmup as its own rail item (not under Outbound). [CONFIRMED-CODE]

## 21. Entity Relationships

Mailbox warmup fields (`warmup_day`, `warmup_started_at`, `warmup_ceiling`, `warmup_peers`, `warmup_opted_in`, `daily_limit`, `status`). OutboundMessage for charts and fail_rate. Scheduler `outbound:warmup` advances plan (controller/planner comments). [CONFIRMED-CODE]

## 22. Business Rules

[CONFIRMED-CODE]

- Start: planner.start (day 1 of ramp). Stop: planner.stop (active at full ceiling).
- Disabled boxes cannot start (422).
- System local-parts abuse/dmarc/postmaster/noreply excluded unless `warmup_opted_in`.
- Caps never exceed ceiling; default ceiling 40 so day 6 (45) already holds (UI copy).
- Peer pings: workspace-internal only, max 3 per sender per day (`MAX_PEER_PINGS_PER_SENDER`), quiet hours still apply.
- Timezone Africa/Algiers for plan days.
- Simple mode **blocks the feature** (`features.warmup = false`).

## 23. Backend Dependencies

`WarmupController@index|toggle|update|include`, `WarmupPlanner`, `Mailbox`, `OutboundMessage`, `EnforceSimpleMode`, `SimpleMode::blocks`.

## 24. Frontend Dependencies

`CrmKpiStrip`, Hairline*, Outbound*, Badge, Button, Input, Label, `EvoVizChart`, Form, router.

## 25. Responsive Behavior

[CONFIRMED-CODE] KPI 4-col pattern; stats `sm:grid-cols-2 lg:grid-cols-5`; HairlineTable for system boxes. NOT VERIFIED viewport. 403 page responsive: NOT VERIFIED.

## 26. Accessibility Observations

[CONFIRMED-CODE] unless 403.

CONFIRMED: KPI aria-label; ramp arrows `aria-hidden`; labels on ceiling.
LIKELY ISSUE: peer checkbox not tied with Label component; charts need EvoViz a11y (unknown).
REQUIRES MANUAL TEST: 403 page AT; full-mode charts.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-012 | HIGH | Warmup is a Settings subtab even when SimpleMode 403s it. Sequence Settings also links here. | Click → 403 dead end for seed owner. | `room-shell.tsx` SETTINGS_SUB; sequence show; runtime 403 [CONFIRMED-BOTH] |
| UX-OUT-140 | MEDIUM | Full-mode rail lists Warmup as a top-level item, duplicate of Outbound → Settings. | Two entry points, inconsistent IA. | `SimpleMode::FULL_NAV` [CONFIRMED-CODE] |
| UX-OUT-141 | LOW | Toggle 422 has no dedicated UI (generic error). | Operator may not see “enable mailbox first”. | `abort_if(!enabled, 422, ...)` [CONFIRMED-CODE] |
| UX-OUT-142 | OBSERVATION | Chart math is derived cap, not logged — documented in controller; easy to misread. | Analysts may treat cap line as historical fact. | `WarmupController::chart` comments [CONFIRMED-CODE] |

## 28. Consistency Comparison

Only outbound settings page with KPI strip + EvoViz. HairlinePanels match mailboxes. Unique 403 vs siblings that work in simple_mode.

## 29. Functional Preservation Contract

Must keep: ramp constants and Algiers day advance; sendable vs system opt-in; start/stop semantics; ceiling clamp; peer-pings workspace-only honesty; sent vs cap chart rules; 422 if disabled; Simple Mode block (or hide nav if product changes — current product **blocks**).

## 30. Design Input Contract

- Purpose: raise mailbox reputation via daily caps, not a rented warmup network.
- Primary goal: start warmup on enabled boxes and watch remaining vs cap.
- Required information: plan day, today’s cap/sent/remaining, fail rate, tomorrow’s cap, 14-day chart, ceiling, peer flag, system opt-in.
- Required states: empty, warming, active, system excluded, simple-mode forbidden.
- Must not remove: no third-party network claim; quiet hours still apply.

## 31. Open Questions / Unknowns

- Full-mode GET 200 never crawled on this DB (`simple_mode: true`). Visuals [UNVERIFIED] in UI.
- Exact 403 HTML vs Inertia error modal. [UNKNOWN]
- Whether `features.warmup` is used to hide the subtab (it is **not** — subtabs are hardcoded). [CONFIRMED-CODE]
- Scheduler `outbound:warmup` registration. [UNVERIFIED]
