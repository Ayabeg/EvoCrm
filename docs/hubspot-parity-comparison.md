# HubSpot Parity Comparison — EvoSales vs HubSpot (2025/2026)

**Audit date:** 2026-08-24  
**Codebase:** `main` @ `3c271d8` ([production](https://crm.evotechly.com))  
**Previous audit:** `9a17fd0` via [PR #51](https://github.com/Mohamedbeghanem/EvoSales/pull/51) — composite **~81/100**  
**Methodology:** Evidence from routes, controllers/services, UI components, and Pest feature tests — not aspirational backend-only claims.

**Post-audit implementations (2026-08-25):** Waves 3–5 closed the documented seller-workflow, revenue-loop, and operations gaps: lead→deal conversion, Gmail/Calendar sync, deal health/forecast, line items and splits on the deal page, quote PDF/email/public acceptance, outbound bounce webhooks, `segment.exited` workflows, scheduled report delivery, and deals-list pipeline selection. Composite scores below remain the 2026-08-24 snapshot.

---

## Executive summary

| Area | HubSpot (Sales/Service/Marketing) | EvoSales | Score | Evidence |
|------|-----------------------------------|----------|-------|----------|
| **CRM core** | Contacts, companies, deals, tickets, custom objects, commerce | Contacts, companies, deals, leads, quotes, line items, deal splits, associations | **94** | 163 auth routes; full CRUD + `CrmHub` associations; DZD amounts; `DealLineItemTest`, `CrmAssociationsTest` |
| **Lists & views** | Saved views, advanced filters, calculated columns, bulk actions | Saved filters (private/team/workspace), sort, export, basic column toggles | **85** | `SavedFilterController`, `CrmFilter`, `ListViewConfig`; **gap:** new chrome `index` pages lack `FilterBuilder` / persisted `ColumnChooser` |
| **Pipelines & forecast** | Multi-pipeline, drag board, AI forecast, revenue analytics | Stage CRUD/reorder, kanban board, weighted forecast bar, stage pills | **87** | `PipelineManager`, `DealBoardForecast`, `settings/pipelines`, `DealBoardTest` |
| **Record UX** | Configurable layouts, timeline, playbooks, side panels | 3-column record chrome, activities, associations; server `record_layouts` API | **84** | `record-chrome.tsx`, `RecordLayoutController`; **gap:** new `show` pages omit Ask Evo, custom props, layout editor |
| **Segments** | Active lists, enter/exit events, ads sync | `SegmentMatcher`, enter/exit triggers, Meta audience sync | **84** | `SegmentMatcher`, `segment.exited` workflows (`SegmentExitWorkflowTest`), Meta audience sync |
| **Workflows** | Visual canvas, branches, delays, 100+ actions | 6 triggers, 8 actions, delays queue, if/else, form UI | **78** | `WorkflowRunner` (543 LOC), `CrmWorkflowsTest` (21 cases); no canvas |
| **Sequences (Sales Hub)** | Sequences, tasks, A/B, reporting | Email + WA sequences, A/B subjects, call/meeting steps, reply pause, warmup | **92** ⭐ | `SequenceController`, `SequenceEnrollment`, `OutboundWarmupTest`; moat: owned mail stack |
| **Desk / Inbox** | Unified inbox, live chat, SMS, SLA, bots | EvoDesk embed, native WA/email threads, channel cards | **76** | `InboxController`, `DeskComposer`; SMS stub (`Twilio SMS dispatch pending`) |
| **Marketing** | Campaigns, ads, attribution, forms, SEO | Meta Ads center, lead webhooks, outbound campaigns, segment → audience | **88** ⭐ | `AdsCenterController`, `MetaAudienceSyncService`; no HubSpot-style marketing hub |
| **Reporting** | Custom report builder, dashboards, attribution | Category reports + EvoViz, saved reports, scheduled email delivery | **78** | `ReportController`, `ScheduledReportRenderer`, `ScheduledReportDeliveryTest` |
| **Settings / admin** | Teams, RBAC matrix, SSO, audit log | Owner/admin/member, granular `permissions` JSON, people invites | **70** | `PeopleController`, `can-manage-settings`; no permission matrix UI |
| **Integrations / OAuth** | 1,000+ app marketplace | Google OAuth, Meta OAuth, Gmail/Calendar connectors, Evolution WA | **93** ⭐ | `ConnectorController`, `AppsController`, `DeskConnectorsTest` |
| **Visual chrome** | Consistent HubSpot shell across all objects | HubSpot-style sidebar, list/record chrome, home command center, create drawer | **79** | Commits `6b1f65c`–`3c271d8`; **gap:** dual UI (chrome `index/show` vs legacy `hub`) |
| **AI layer** | Breeze copilot, predictive scoring, content gen | Ask Evo (keyword RAG + optional LLM), engagement score, forecast band | **60** | `RecordInsight` (608 LOC), `RecordInsightTest`; **gap:** AI props not rendered on new record pages |
| **Regional DZ moat** | Generic i18n | Wilaya, DZD, Africa/Algiers TZ, AR/FR prompts | **95** ⭐ | `config/evosales.php`, wilaya cross-object report |

⭐ = EvoSales **moat** (ahead or uniquely strong for Algeria / owned stack)

---

## Composite score

| Metric | Previous (`9a17fd0`) | Current (`3c271d8`) | Δ |
|--------|----------------------|---------------------|---|
| **M1–M11 average** | **~81** | **~81** | 0 |
| **Visual chrome (M14, tracked separately)** | ~62 (pre-chrome) | **~79** | **+17** |
| **Omega gate (≥95 on M1–M11)** | Not met | **Not met** | — |

### Scoring methodology

1. Each dimension M1–M11 scored 0–100 against **HubSpot Sales Hub + Service Hub** parity (Marketing Hub scored under Marketing row, not double-counted).
2. Score requires **route renders + user-accessible UI + service depth**; backend-only features score ≤70 unless tested.
3. Moat dimensions (M7 Sequences, M12 Integrations, M13 Regional) may exceed 100 in narrative but are **excluded from M1–M11 composite** average.
4. M14 Visual chrome tracked separately — improves perceived parity but does not inflate functional composite until feature-unified.

**Current M1–M11 breakdown:** 94 + 85 + 87 + 84 + 84 + 78 + 92 + 76 + 78 + 60 + 70 = **888 → ~81**

---

## What improved since last audit (`9a17fd0` → `3c271d8`)

| Change | Commits | Impact |
|--------|---------|--------|
| **HubSpot visual chrome** | `6b1f65c`, `4f0a31a` | Sidebar nav with pins/More, `list-chrome` (header tabs, toolbar, footer), `record-chrome` (actions, associations rail), `create-drawer`, stage pills on deals list |
| **Home command center** | `6b1f65c` | `/dashboard` — Today tiles, department shortcuts, EvoViz charts (`HomeCommandCenterTest`, 9 cases) |
| **Dedicated list + record pages** | `6b1f65c` | Contacts/deals use `crm/*/index` + `crm/*/show` instead of split-panel hub only |
| **Production 500 fixes** | `3c271d8` | Missing `ListViewConfig` import; sort type mismatch on saved views — CRM lists stable again |
| **Desk in chrome** | `6b1f65c` | `/inbox` renders inside CRM shell with embed probe + native fallback |

---

## What regressed or split (chrome migration)

The chrome port introduced a **dual UI architecture** that lowers functional parity on primary routes:

| Feature | Legacy (`hub.tsx` + `ListToolbar`) | New chrome (`index` / `show`) | Status |
|---------|-----------------------------------|------------------------------|--------|
| `FilterBuilder` (AND/OR groups) | ✅ | ❌ | Backend works; UI not wired on index |
| Persisted `ColumnChooser` via `ListViewConfig` | ✅ | ❌ (local React state) | Columns not saved to views |
| `SavedViewTabs` create/save | ✅ | Partial (read tabs in header) | Save flow missing on index |
| Ask Evo panel | ✅ on hub | ❌ on show | Controller passes props; UI ignores |
| Custom properties editor | ✅ on hub | ❌ on show | `RecordProperties` not on show pages |
| Record layout editor | ✅ on hub | ❌ on show | API exists; no admin UI on show |
| Company record | hub split-panel | hub only on **show** | List chrome ✅, record inconsistent |

**Test drift:** `CrmSavedViewTest` still asserts `crm/contacts/hub` / `crm/deals/hub` components — controllers now render `index`. Tests need realignment.

---

## Area deep-dives

### CRM core (94)

| Check | Status | Evidence |
|-------|--------|----------|
| Routes render | ✅ | `/crm/contacts`, `/crm/companies`, `/crm/deals`, `/crm/leads`, `/leads` |
| Controller depth | ✅ | `ContactController`, `DealController`, `CompanyController`, `LeadController`, `QuoteController`, `DealSplitController` |
| Associations | ✅ | `CrmHub::contactAssociations`, timeline, catch-up |
| Custom properties | ✅ backend | `CustomAttributeController`, `CustomAttributes` service, `CustomAttributeTest` (6) |
| Commerce | ✅ | Deal line items, quotes, DZD formatting |
| Tests | ✅ | 15+ CRM feature files |
| Gaps | | No tickets/custom objects; company show still on hub layout |

### Lists & views (85)

| Check | Status | Evidence |
|-------|--------|----------|
| Saved views | ✅ | `SavedFilter` with visibility + workspace default (`EvoCell1TeamCrmTest`, 8 cases) |
| Filters | Partial | `CrmFilter` — 15+ operators, filter groups in service; simple filters on chrome index |
| Column chooser | Partial | Full chooser in `list-toolbar.tsx`; chrome index uses checkboxes only |
| Export | ✅ | `/crm/contacts/export`, `/crm/deals/export` (`ContactExportTest`) |
| Bulk actions | ❌ | Row checkboxes present; no bulk API |
| Gaps | | Calculated columns; FilterBuilder on primary routes; fix test drift |

### Pipelines & forecast (87)

| Check | Status | Evidence |
|-------|--------|----------|
| Pipeline admin | ✅ | `settings/pipelines` — CRUD stages, reorder (`PipelineSettingsTest`) |
| Kanban board | ✅ | `/crm/deals/board` — drag move, forecast bar (`DealBoardTest`, 5) |
| Stage pills | ✅ | `stage-pills.tsx` on deals index (`DealStagePillsTest`) |
| AI forecast | Partial | `DealBoardForecast` + band in `RecordInsight`; no 15% backtest |
| Gaps | | Multi-pipeline switcher on list; revenue intelligence |

### Record UX (84)

| Check | Status | Evidence |
|-------|--------|----------|
| Record chrome | ✅ | `record-chrome.tsx` — back link, action row, activity tabs, association cards |
| Layout API | ✅ | `RecordLayoutController` — per-user + workspace default (`CrmRecordWorkspaceTest`) |
| Layout admin UI | ❌ | Editor component exists; not on chrome show pages |
| Timeline | ✅ | Activities, complete task |
| Gaps | | Wire Ask Evo + custom props on show; unify company record; playbooks |

### Segments (84)

| Check | Status | Evidence |
|-------|--------|----------|
| List UI | ✅ | `/crm/segments` |
| Matcher | ✅ | `SegmentMatcher::syncContact` — enter + workflow trigger |
| Meta sync | ✅ | `POST /crm/segments/{id}/sync-meta` |
| Exit events | ✅ | `segment.exited` workflow trigger (`SegmentExitWorkflowTest`) |
| Gaps | | Behavior filters UI on segment index; active list analytics |

### Workflows / automation (78)

| Check | Status | Evidence |
|-------|--------|----------|
| Triggers (6) | ✅ | contact/deal created, stage changed, enrollment finished/replied, segment entered |
| Actions (8) | ✅ | task, sequence, webhook, set property, assign owner, create deal, email, notify |
| Delays | ✅ | `delay_minutes` + queue (`EvoCell2AutomationSpineTest`) |
| If/else | ✅ | condition_field + else_action in form UI |
| Canvas | ❌ | Form-based list only (`crm/workflows/index.tsx`) |
| Tests | ✅ | `CrmWorkflowsTest` — 21 cases |

### Sequences — moat (92)

| Check | Status | Evidence |
|-------|--------|----------|
| Steps | ✅ | Email, WA, call, meeting (`EvoCell3SequencesDepthTest`) |
| A/B subjects | ✅ | Per-step variant tracking |
| Reply pause | ✅ | Enrollment auto-pause on reply |
| Warmup | ✅ | `WarmupPlanner`, `/outbound/warmup` (11 tests) |
| Owned SMTP/IMAP | ✅ | `MailboxSync`, `SmtpMailboxMailerTest` |
| Gaps | | EvoViz step funnel; SMS channel in sequences |

### Desk / Inbox (76)

| Check | Status | Evidence |
|-------|--------|----------|
| Unified inbox route | ✅ | `/inbox` |
| EvoDesk embed | ✅ | iframe + `DeskEmbedProbe` framing check |
| Native fallback | ✅ | Thread list + reply when embed blocked |
| WhatsApp | ✅ | Evolution Cloud + Meta scopes |
| Email desk | ✅ | Thread model + composer |
| SMS | ❌ | `DeskComposer` — "Twilio SMS dispatch pending" |
| Live chat widget | ❌ | Not implemented |
| Tests | ✅ | `DeskEmptyStateTest`, `DeskHandoffTest`, `DeskConnectorsTest` |

### Marketing (88 moat)

| Check | Status | Evidence |
|-------|--------|----------|
| Meta Ads | ✅ | `/ads`, campaign show, sync (`AdsHubTest`) |
| Lead ingestion | ✅ | `MetaLeadWebhookController`, `LeadFormIngestor` |
| Outbound campaigns | ✅ | `/outbound/campaigns` — schedule, send |
| Attribution | Partial | Ads funnel service; no multi-touch |
| Gaps | | No HubSpot-style forms, landing pages, SEO tools |

### Reporting (78)

| Check | Status | Evidence |
|-------|--------|----------|
| Category reports | ✅ | Pipeline, leads, outbound, desk, ads rooms with EvoViz |
| Report builder | ✅ | Entity + metric + group_by; cross-object wilaya |
| Dashboards | ✅ | CRUD widgets, owner filter (`CrmReportDashboardsTest`, 8) |
| Scheduled delivery | ❌ | Stub only |
| Gaps | | Arbitrary dimension picker; funnel viz in reports |

### Settings / admin (70)

| Check | Status | Evidence |
|-------|--------|----------|
| People & invites | ✅ | `/settings/people` — invite, role, resend |
| Roles | ✅ | owner / admin / member |
| Granular permissions | Partial | `users.permissions` JSON; no settings UI |
| Pipelines | ✅ | Admin-only CRUD |
| Custom attributes | ✅ | `/settings/attributes` with fill rates |
| Connectors | ✅ | Google, desk catalog |
| Gaps | | Teams, RBAC matrix, SSO, audit log |

### Visual chrome (79)

| Surface | Parity | Evidence |
|---------|--------|----------|
| Sidebar | 85% | `app-sidebar.tsx` — primary nav, pinned items, categorized More drawer |
| List chrome | 82% | `list-chrome.tsx` — header view tabs, toolbar, empty state, footer + export |
| Record chrome | 78% | `record-chrome.tsx` — 3-column grid, activity tabs, association rail |
| Home | 80% | `home.tsx` — star, owner/date filters, department tiles, EvoViz |
| Create drawer | 85% | `create-drawer.tsx` — HubSpot-style right sheet |
| Desk shell | 75% | Full-height inbox inside canvas chrome |
| Consistency | 65% | Companies show = hub; contacts/deals = chrome; legacy hub files remain |

### AI layer (60)

| Check | Status | Evidence |
|-------|--------|----------|
| Ask Evo service | ✅ | `RecordInsight` — keyword retrieval + optional `LlmClient` |
| Engagement score | ✅ | `contactEngagement()` heuristic |
| Forecast band | ✅ | Deal AI band in insight |
| UI on records | ❌ | `ContactController` passes `askEvo`; `contacts/show.tsx` does not render |
| vs Breeze | ❌ | No vector RAG, no cross-record copilot, no content studio |
| Tests | ✅ | `RecordInsightTest` (7), `EvoCell4AiLayerTest` (2) |

---

## EvoSales moats (not HubSpot parity — competitive advantage)

| Moat | Score target | Evidence |
|------|--------------|----------|
| **Owned outbound stack** | 105 | SMTP/IMAP mailboxes, warmup, domains, suppressions, quiet hours, Roundcube |
| **Algeria-native CRM** | 120 | Wilaya/city filters, DZD, Africa/Algiers reporting TZ |
| **Meta-native funnel** | 110 | Ads center + segment → Custom Audience without Zapier |
| **Self-hosted / data sovereignty** | — | Laravel + Docker; no per-seat HubSpot tax |
| **EvoDesk embed** | — | Chatwoot Community in CRM iframe |

---

## Top 10 gaps to close for Omega (≥95 composite)

| # | Gap | Dimensions | Effort |
|---|-----|------------|--------|
| 1 | **Unify chrome + feature-complete lists** — wire `FilterBuilder`, `ColumnChooser`, save-view on `index` pages | M2, M14 | Medium — components exist in `list-toolbar.tsx` |
| 2 | **Wire AI on record show pages** — render `AskEvoPanel`, engagement, custom properties | M4, M10 | Small |
| 3 | **Visual workflow canvas** (read-only v1 → editable) | M6 | Large |
| 4 | **SMS send path** (Twilio or DZ provider) + live-chat routing | M8 | Medium |
| 5 | **RBAC settings UI** — permission matrix per role/user | M11 | Medium |
| 6 | **Record layout admin** — settings UI for workspace-default layouts | M4 | Small |
| 7 | **Segment exit triggers** — `segment.exited` workflow + analytics | M5, M6 | Medium |
| 8 | **Scheduled report delivery** — attach real report output to email | M9 | Medium |
| 9 | **Forecast backtest** — validate AI band within 15% on historical deals | M3, M10 | Large |
| 10 | **Realign tests + remove hub dead-ends** — single UI architecture | All | Small |

---

## Screenshot-worthy QA checklist

Use [production](https://crm.evotechly.com) or local with seeded workspace.

### Sidebar & home
- [ ] Sidebar: Home, Contacts, Companies, Deals, Desk, Outbound, Ads, Segments, Reports visible
- [ ] More drawer: categorized CRM / Outbound / Reports / Settings links
- [ ] Pin/unpin persists after reload
- [ ] Home: Today tiles, department row (Inbox → Integrations), EvoViz area + bar charts
- [ ] Home owner/date filter controls render (non-blocking if not wired)

### List chrome (contacts, deals, companies)
- [ ] Header: object title + view tabs (All / My / saved views)
- [ ] Toolbar: search, sort, owner filter
- [ ] Create drawer opens from primary CTA; stays on list after save
- [ ] Empty state with CTA when no rows
- [ ] Footer: record count + Export link (contacts/deals)
- [ ] Deals: stage pills with counts

### Record chrome (contact, deal)
- [ ] Back link to list
- [ ] Action row: Note, Email, Call, Task, Meeting
- [ ] 3-column layout: key info | timeline | associations rail
- [ ] Association cards link to related records
- [ ] **Known gap:** Ask Evo panel absent on chrome show pages

### Desk
- [ ] `/inbox` full-height inside CRM shell
- [ ] EvoDesk iframe OR native thread list with channel cards
- [ ] Embed-blocked banner when X-Frame-Options blocks iframe

### Pipelines & deals board
- [ ] `/crm/deals/board` — drag card between stages
- [ ] Forecast bar totals at top
- [ ] `/settings/pipelines` — reorder stages (admin)

### Automation & outbound
- [ ] `/crm/workflows` — create from template, toggle active
- [ ] `/outbound/sequences/{id}` — step list, enroll, pause on reply
- [ ] `/outbound/warmup` — mailbox warmup toggles

### Reporting & segments
- [ ] `/reports` — at least one category with EvoViz when data exists
- [ ] `/crm/report-builder` — save + run report
- [ ] `/crm/segments` — list links to filtered CRM view
- [ ] Segment → Meta sync button (admin, Meta connected)

### Settings
- [ ] `/settings/people` — invite member, change role
- [ ] `/settings/attributes` — create custom field with fill rate
- [ ] `/settings/connectors` — Google + desk catalog
- [ ] `/settings/apps` — Meta OAuth status

---

## Related docs

- [EvoCells roadmap & dimension scorecard](./evocells-roadmap.md)
- [HubSpot gap module porting notes](./hubspot-gap-module-porting.md)
- [Architecture](./ARCHITECTURE.md)
