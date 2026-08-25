# Changelog

## Wave 6 seller trust (2026-08-25)

### Added
- Workspace audit trail for login, import, merge, quote send/accept, and permission changes (`/settings/audit`)
- Custom and calculated attributes as contact/deal/company list columns
- Contact association filters: deal stage and has-open-deal
- Record playbooks authored in Settings and shown on contact and deal records

---

## Segment membership history (2026-08-25)

### Added
- Enter/exit stints on `contact_segment_memberships` (`exited_at` instead of delete)
- Workspace-scoped history on `/crm/segments/{id}` and a History link on the segments index
- Re-entry inserts a new current row; merge keeps history on the survivor

---

## HubSpot comparison redo (2026-08-25)

Re-audited EvoSales against HubSpot Sales/Service Hub 2026 on `d139f6e`. Composite **~81 → ~85**. See [`docs/hubspot-parity-comparison.md`](docs/hubspot-parity-comparison.md) and the capability matrix [`docs/hubspot-side-by-side.md`](docs/hubspot-side-by-side.md). Omega (≥95) is still not met.

---

## HubSpot gap Waves 3–5 (2026-08-25)

### Added
- Lead → deal conversion with pipeline/stage/owner/amount, create-or-link, and a unique `deals.lead_id`
- Gmail and Google Calendar timeline sync with incremental cursors, start/pause, and scheduled commands
- Deal health factors, next action, and a computed board forecast band (including a Low data state)
- Deal-page line item editing (product or ad hoc) and authorized deal-split editing
- Quote PDF preview/email, immutable sent snapshots, and public token acceptance at `/q/{token}`
- Outbound bounce webhook with hard-bounce suppression
- `segment.exited` workflow trigger
- Scheduled report CRUD and real HTML delivery (no duplicate window)
- Pipeline selection on the deals list, create drawer, views, and export

---

## EvoCells merged to main (2026-08-25)

**Merge commit:** `9a17fd0` — [PR #50](https://github.com/Mohamedbeghanem/EvoSales/pull/50) only.

PRs #45–#49 were stacked branches whose commits are included in #50; GitHub marked them merged when #50 landed — not separate merges on `main`.

**Scorecard (honest audit):** see [`docs/evocells-roadmap.md`](docs/evocells-roadmap.md) — composite **~81** on M1–M11 (Omega ≥95 not yet met).

---

## EvoCell 6 — Omni & permissions

### Added
- Deal splits (`deal_splits`, `PUT /crm/deals/{deal}/splits`)
- Granular permissions (`users.permissions`, `User::canPermission()`)
- SMS reply stub in `DeskComposer` (Twilio-ready)
- Meta Custom Audience sync (`MetaAudienceSyncService`, segment sync route)
- Dashboard sharing (`visibility`: private / team / workspace)
- Team-scoped deals (`deals.team_id`, `deals.team_only` permission)
- `SegmentMatcher` + `segment.entered` workflow trigger
- Plan-gap migration: A/B stats, segment memberships, dashboard visibility

### HubSpot comparison
HubSpot enterprise adds SMS inbox, deal splits, and Custom Audience sync. EvoSales ships splits, permission grants, audience push from segments, and SMS groundwork while keeping the outbound moat.

---

## EvoCell 5 — Analytics depth

### Added
- Calculated custom properties (`type=calculated`, formula expressions)
- Saved reports + `/crm/report-builder` + `ReportBuilder`
- Scheduled reports + `reports:deliver`
- Cross-object reply rate by wilaya; deal CSV export

### HubSpot comparison
HubSpot custom reports support SQL and arbitrary joins. EvoSales ships formula fields, saved filter reports with grouping, one cross-object report, and scheduled email delivery — monitoring depth without ad hoc SQL.

---

## EvoCell 4 — AI layer

### Added
- RAG-lite Ask Evo (keyword-ranked activities in prompt)
- Pipeline forecast band on deals hub + kanban
- Contact engagement score, proactive summary, draft email action

### HubSpot comparison
HubSpot Breeze uses vector RAG over CRM + email. EvoSales ships keyword retrieval, heuristics, and forecast bands — practical for small teams without vector infrastructure.

---

## EvoCell 3 — Sequences depth

### Added
- Step types: email, call, meeting + `meeting_url`
- A/B subjects with winner after 20 sends (`resolveAbSubject`)
- Reply branches (`on_reply_step`) and auto-pause on IMAP reply
- Step funnel analytics on sequence show page

### HubSpot comparison
HubSpot Sequences include A/B, call steps, and meeting links. EvoSales extends the owned-email moat (warmup, quiet hours, suppression) with variants, activity steps, and reply branching.

---

## EvoCell 2 — Automation spine

### Added
- Workflow delays (`delay_minutes`, `workflow_executions`, `workflow:run`)
- Triggers: contact/deal lifecycle, `enrollment.finished`, `segment.entered`, `enrollment.replied`
- Actions: task, sequence, webhook, `set_property`, `assign_owner`, `create_deal`, `send_email`, `notify_user`
- Segment behavior filters: `enrolled_in_sequence`, `email_replied`, `email_opened`
- Automation UI exposes all triggers, actions, delays, and segment pickers

### HubSpot comparison
HubSpot Operations Hub adds visual canvas and 100+ actions. EvoSales ships a scheduled queue, eight actions, quiet-hour-aware delays, and form-based rules — the automation spine without drag-drop.

---

## EvoCell 1 — Team CRM

### Added
- Shared saved views: `visibility` (`private` | `team` | `workspace`), `is_workspace_default`
- Filter builder wired to URL + saved views; operators through `in`, `before`, `after`, comparisons, custom attrs
- Pipeline stage CRUD, reorder, probability, safe delete
- Server-persisted record layouts (`GET/PUT /crm/record-layouts/{entity}`) + workspace default API

### HubSpot comparison
HubSpot list views support team sharing and calculated columns. EvoSales closes team CRM gaps (shared views, filters, pipeline admin, server layouts) without enterprise ACL granularity.

---

## EvoCell 0 — Gaps #1–#10 baseline (`0304154`)

Pre-EvoCells production layer documented in earlier gap PRs (#36–#44). Superseded by EvoCells 1–6 where noted.

| Gap | Shipped (baseline) | Superseded by EvoCell |
|-----|-------------------|------------------------|
| #1 Saved views + filters | Column chooser, AND/OR groups, saved filters | Cell 1: sharing + extended operators |
| #2 Pipelines + forecast | Multi-pipeline list/board, forecast bar | Cell 1: stage CRUD |
| #3 Record layout | Card customize panel (localStorage) | Cell 1: **server persistence** |
| #4 Workflows | Observer-dispatched rules, if/else | Cell 2: delays + expanded triggers/actions |
| #5 Custom properties | Admin CRUD, jsonb values | Cell 5: calculated formulas |
| #6 Sequences + cron | Steps, enrollments, `outbound:run` | Cell 3: A/B, call/meeting, reply branches |
| #7 Dashboards | EvoViz rooms + saved boards | Cell 6: dashboard sharing |
| #8 Inbox | Desk embed + native fallback | Cell 6: SMS stub |
| #9 Segments | Live preview API | Cell 2/5: FilterBuilder + behavior filters |
| #10 AI | Deal health heuristic, Ask Evo stub | Cell 4: RAG-lite + forecast band |

### HubSpot comparison (baseline)
Gaps #1–#10 delivered ~68% composite parity — enough for a single-digit Algerian sales team without HubSpot enterprise tiers. EvoCells 1–6 raised that to **~81%** on core dimensions (see scorecard).
