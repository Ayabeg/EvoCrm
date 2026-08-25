# HubSpot Parity Comparison — EvoSales vs HubSpot (2026-08-25)

**Audit date:** 2026-08-25  
**Codebase:** `cursor/hubspot-gap-remaining-waves-fd45` @ `d139f6e` ([PR #92](https://github.com/Mohamedbeghanem/EvoSales/pull/92))  
**Previous audits:** `3c271d8` on `main` (2026-08-24, composite **~81**) → `9a17fd0` via [PR #51](https://github.com/Mohamedbeghanem/EvoSales/pull/51)  
**Methodology:** Evidence from routes, controllers/services, Inertia pages, and Pest feature tests. A capability scores only when it has a route, a user-visible surface, and a service/test — not a backend-only stub.

**Product target (not feature-count parity):** a 5–20 seat Algeria-first sales OS that a team can migrate into, use as system of record, and carry lead → quote. Explicitly deferred: custom objects, tickets, CMS, SAML, marketplace, visual workflow canvas, full CPQ/payments/e-sign, Breeze-scale RAG, Laravel live chat.

**Capability matrix (HubSpot | EvoSales | verdict):** [hubspot-side-by-side.md](./hubspot-side-by-side.md) · [visual](./hubspot-side-by-side.html)

---

## Executive summary

| Area | HubSpot (Sales + Service + Marketing, 2026) | EvoSales | Score | Evidence |
|------|---------------------------------------------|----------|-------|----------|
| **CRM core** | Contacts, companies, deals, tickets, custom objects, Commerce Hub quotes/e-sign/payments | Contacts, companies, deals, leads, quotes with PDF/email/accept, line items, splits, import/merge | **96** | 191 authenticated `web.php` names; `LeadConverter`, `QuoteDocument`, `ContactMerger`; `LeadConversionTest`, `QuoteDeliveryTest`, `QuoteAcceptanceTest` |
| **Lists & views** | Saved views, advanced filters, calculated columns, bulk actions | Chrome lists with FilterBuilder, column chooser, save-view, bulk, CSV import/export | **90** | `CrmListShell` → `list-toolbar.tsx`; `CrmBulkActionsTest`, `ContactImportTest`, `DealImportTest` |
| **Pipelines & forecast** | Multi-pipeline, required-property gating, AI/Smart Deal Progression, revenue workspace | Multi-pipeline list+board, weighted forecast, deterministic deal-health band | **90** | `PipelineSwitcher`, `DealBoardForecast`, `RecordInsight::dealHealth`; `DealListPipelineTest`, `DealGuidanceTest`, `DealBoardTest` |
| **Record UX** | Configurable layouts, playbooks, side panels, Breeze on-record | 3-column chrome, timeline, associations, Ask Evo, custom props, health, commerce editors | **90** | `contacts/show`, `deals/show`, `companies/show`; `settings/record-layouts`; `RecordInsightTest` |
| **Segments** | Active lists, enter/exit events, ads sync | FilterBuilder segments, enter/exit workflows, Meta audience sync | **88** | `SegmentMatcher`, `segment.exited`; `SegmentExitWorkflowTest`, `CrmSegmentsTest` |
| **Workflows** | Visual canvas, branches, 100+ actions, Operations Hub | 7 triggers, 8 actions, delays, if/else, form UI | **80** | `Workflow::triggers()`, `WorkflowRunner`; `CrmWorkflowsTest` (21), `SegmentExitWorkflowTest` |
| **Sequences (Sales Hub)** | Email sequences, AI personalization, task/LinkedIn steps, reporting | Email + WA sequences, A/B subjects, call/meeting steps, reply pause, warmup, bounce suppress | **93** ⭐ | `SequenceController`, `BounceProcessor`; `OutboundWarmupTest`, `OutboundBounceTest` |
| **Desk / Inbox** | Unified inbox, live chat, SMS, SLA, bots | EvoDesk embed, native WA/email threads, channel cards | **76** | `InboxController`, `DeskComposer`; SMS still `Twilio SMS dispatch pending` |
| **Marketing** | Campaigns, ads, attribution, forms, SEO, AEO | Meta Ads center, lead webhooks, outbound campaigns, segment → audience | **88** ⭐ | `AdsCenterController`, `MetaAudienceSyncService`, `AdsHubTest` |
| **Reporting** | Custom explorer, dashboards, attribution, scheduled send | Category rooms + EvoViz, saved reports, dashboards, real scheduled HTML email | **85** | `ScheduledReportRenderer`, `CrmReportDashboardsTest`, `ScheduledReportDeliveryTest` |
| **Settings / admin** | Teams, RBAC, SSO, audit log | Owner/admin/member, permission matrix UI, people, layouts, system health | **80** | `settings/permissions.tsx`, `EnforceProductPermissions`, `CrmPermissionsTest`, `ScheduledCommandHealthTest` |
| **Integrations / OAuth** | 1,000+ marketplace apps | Google OAuth + Gmail/Calendar sync, Meta OAuth, Evolution WA, tenant webhooks | **96** ⭐ | `GoogleMailSync`, `GoogleCalendarSync`, `WebhookEndpointManager`; `GoogleMailSyncTest`, `WebhookTenantIsolationTest` |
| **Visual chrome** | One Smart CRM shell | HubSpot-style sidebar, list/record chrome, home command center; hub split-panel retired | **84** | No `hub.tsx`; `CrmListShell` on contacts/deals/companies; `record-chrome.tsx` |
| **AI layer** | Breeze Copilot, agents, Smart Deal Progression, vector RAG | Ask Evo on records, engagement score, deterministic health/forecast — keyword RAG, not agents | **72** | `AskEvoPanel` on contact/deal/company; `DealGuidanceTest`, `RecordInsightTest` |
| **Regional DZ moat** | Generic i18n | Wilaya, DZD, Africa/Algiers TZ, AR/FR prompts | **95** ⭐ | `config/evosales.php`, wilaya cross-object report |

⭐ = EvoSales **moat** (ahead or uniquely strong for Algeria / owned stack)

---

## Composite score

| Metric | `9a17fd0` | `3c271d8` (2026-08-24) | `d139f6e` (2026-08-25) | Δ vs last |
|--------|-----------|------------------------|------------------------|-----------|
| **M1–M11 average** | **~81** | **~81** | **~85** | **+4** |
| **Visual chrome (M14)** | ~62 | **~79** | **~84** | **+5** |
| **Omega gate (≥95 on M1–M11)** | Not met | Not met | **Not met** | — |

### Scoring methodology

1. M1–M11 are scored 0–100 against **HubSpot Sales Hub + Service Hub** (Marketing Hub stays in the Marketing row and is not double-counted).
2. Score requires **route + user-accessible UI + service depth**. Backend-only features score ≤70 unless tested.
3. Moat dimensions (M7 Sequences, M12 Integrations, M13 Regional) may exceed 100 in narrative but are **excluded from the M1–M11 average**.
4. M14 Visual chrome is tracked separately. It no longer has a dual-UI penalty; remaining drag is leads/legacy surfaces, not missing list/record chrome.
5. Deferred items from `tasks/plan.md` stay gaps. Shipping them would raise Omega; this audit does not pretend they exist.

**Current M1–M11 breakdown:** 96 + 90 + 90 + 90 + 88 + 80 + 93 + 76 + 85 + 72 + 80 = **940 → ~85**

---

## What closed since `3c271d8`

Waves 1–5 on this branch. The 2026-08-24 scorecard stayed flat because chrome look-and-feel landed without wiring. That is no longer true.

| Change | Tasks | Dimensions | Score effect |
|--------|-------|------------|--------------|
| Scheduler + queue + health UI | 1–2 | M11 | Visible freshness for 8 scheduled commands |
| Tenant-safe webhooks; workspace Meta credentials | 3–4 | M12 | No first-workspace ingestion |
| Server-enforced permissions + matrix UI | 5 | M11 | `settings/permissions`, `CrmPermissionsTest` |
| Contact/deal CSV import, duplicate merge, bulk actions | 6–9 | M1, M2 | Migration path + list operations |
| Lead → deal conversion | 10 | M1, M4 | `LeadConversionDialog` |
| Gmail + Calendar timeline sync | 11–12 | M12, M4 | Incremental cursors, start/pause |
| Deal health + forecast band on UI | 13 | M3, M10 | Low-data label; board band no longer `null` |
| Line items, splits, quote PDF/email/public accept | 14–17 | M1, M4 | Revenue loop on the deal page |
| Outbound bounce webhook + suppression | 18 | M7, M9 | Reports count real `bounced` rows |
| `segment.exited` workflows | 19 | M5, M6 | Re-entry is a new enter transition |
| Scheduled report HTML delivery | 20 | M9 | CRUD + one email per window |
| Deals-list pipeline selection | 21 | M2, M3 | List/create/views/export honor `?pipeline=` |
| Chrome lists/records unified | prior + this branch | M2, M4, M10, M14 | `FilterBuilder` / `ColumnChooser` / Ask Evo / `RecordProperties` on primary routes; no `hub.tsx` |

---

## What did not move (still the honest gaps)

| Gap | Why it still matters vs HubSpot 2026 |
|-----|--------------------------------------|
| No tickets / custom objects | HubSpot Smart CRM + Service Hub; Enterprise custom objects |
| No visual workflow canvas | Operations Hub canvas vs EvoSales form UI |
| No SMS send path or Laravel live chat | Service Hub inbox / bots; EvoDesk remains the chat boundary |
| No SAML, audit log, or HubSpot-style teams | Enterprise admin |
| No Breeze agents / vector RAG / Smart Deal Progression | Spring 2026 HubSpot AI; EvoSales health/forecast are deterministic heuristics |
| No forecast backtest | Professional/Enterprise revenue intelligence |
| No e-sign, payments, subscriptions | Commerce Hub |
| No marketplace / CMS / forms / SEO | Marketing Hub + App Marketplace |
| No calculated columns on lists | Custom report explorer / calculated properties in list views |
| Segment membership is current-state only | Exit deletes the membership row; history is the workflow execution, not a list audit |

---

## Area deep-dives

### CRM core (96)

| Check | Status | Evidence |
|-------|--------|----------|
| Routes render | ✅ | `/crm/contacts`, `/crm/companies`, `/crm/deals`, `/crm/leads` |
| Associations | ✅ | `CrmHub` timeline, catch-up, association cards |
| Import | ✅ | Preview-first CSV for contacts and deals; idempotent rematch |
| Merge | ✅ | Duplicate review + transactional `ContactMerger` |
| Lead conversion | ✅ | Create or link one deal; unique `deals.lead_id` |
| Commerce | ✅ | Line items (product or ad hoc), splits, quote snapshot/PDF/email |
| Public quote | ✅ | `/q/{token}` — expire/revoke/accept without CRM login |
| Custom properties | ✅ | Settings + `RecordProperties` on show pages |
| Tests | ✅ | Conversion, quote, line-item, split, import, merge, associations |
| Gaps | | Tickets, custom objects, e-sign, payments, CPQ |

### Lists & views (90)

| Check | Status | Evidence |
|-------|--------|----------|
| Saved views | ✅ | Private / team / workspace; create from chrome toolbar (`SavedViewTabs`) |
| Filters | ✅ | `FilterBuilder` AND/OR groups on contacts/deals/companies index |
| Column chooser | ✅ | `ColumnChooser` persisted when a view is saved |
| Bulk actions | ✅ | Assign, enroll, move, delete — `CrmBulkActionsTest` |
| Import / export | ✅ | Contact + deal CSV; export honors pipeline |
| Pipeline context | ✅ | Deals list switcher + `?pipeline=` on create/views/export |
| Tests | ✅ | `CrmSavedViewTest` asserts `crm/*/index` (no hub drift) |
| Gaps | | Calculated list columns; HubSpot-depth association filters |

### Pipelines & forecast (90)

| Check | Status | Evidence |
|-------|--------|----------|
| Pipeline admin | ✅ | `settings/pipelines` — CRUD, reorder (`PipelineSettingsTest`) |
| Kanban | ✅ | `/crm/deals/board` drag move + forecast (`DealBoardTest`) |
| List switcher | ✅ | Same `PipelineSwitcher` as the board (`DealListPipelineTest`) |
| Deal health | ✅ | Score, factors, next action, Low data when empty |
| Forecast band | ✅ | `pipelineForecastBand()` on the board — not `null` |
| Gaps | | Required-property stage gating; 15% historical backtest; Smart Deal Progression |

### Record UX (90)

| Check | Status | Evidence |
|-------|--------|----------|
| Record chrome | ✅ | Back link, action row, activity tabs, association rail |
| Ask Evo | ✅ | Rendered on contact, deal, and company show |
| Custom properties | ✅ | `RecordProperties` on those show pages |
| Layout admin | ✅ | `/settings/record-layouts` workspace default |
| Deal commerce | ✅ | Health, line items, quotes, splits on `deals/show` |
| Timeline | ✅ | Activities + Google mail/calendar events when synced |
| Gaps | | Playbooks; company/lead density still thinner than deal/contact |

### Segments (88)

| Check | Status | Evidence |
|-------|--------|----------|
| List UI | ✅ | `/crm/segments` + `FilterBuilder` |
| Enter / exit | ✅ | `segment.entered` and `segment.exited`; re-entry is a new transition |
| Meta sync | ✅ | `POST /crm/segments/{id}/sync-meta` |
| Gaps | | Membership history table; active-list analytics |

### Workflows / automation (80)

| Check | Status | Evidence |
|-------|--------|----------|
| Triggers (7) | ✅ | contact/deal created, stage changed, enrollment finished/replied, segment entered/exited |
| Actions (8) | ✅ | task, sequence, webhook, set property, assign owner, create deal, email, notify |
| Delays / if-else | ✅ | `delay_minutes` queue + condition/else in the form |
| Canvas | ❌ | Form list only — explicitly deferred |
| Tests | ✅ | `CrmWorkflowsTest` 21 cases + segment-exit tests |

### Sequences — moat (93)

| Check | Status | Evidence |
|-------|--------|----------|
| Steps | ✅ | Email, WhatsApp, call, meeting |
| A/B + reply pause + warmup | ✅ | `EvoCell3SequencesDepthTest`, `OutboundWarmupTest` |
| Owned SMTP/IMAP | ✅ | Mailboxes, domains, quiet hours, Roundcube |
| Bounces | ✅ | Soft/hard webhook; hard bounce → suppression |
| Gaps | | SMS sequence channel; HubSpot LinkedIn steps; Breeze personalization |

### Desk / Inbox (76)

| Check | Status | Evidence |
|-------|--------|----------|
| Unified inbox | ✅ | `/inbox` in CRM chrome |
| EvoDesk embed + native fallback | ✅ | iframe probe + thread list |
| WhatsApp / email | ✅ | Evolution Cloud + thread composer |
| SMS | ❌ | `DeskComposer` — Twilio wiring pending |
| Live chat widget | ❌ | Deferred; EvoDesk remains the boundary |

### Marketing (88 moat)

| Check | Status | Evidence |
|-------|--------|----------|
| Meta Ads | ✅ | `/ads`, sync, campaign show |
| Lead ingestion | ✅ | Tenant-keyed Meta lead webhook |
| Outbound campaigns | ✅ | Schedule + send |
| Attribution | Partial | Ads funnel; no multi-touch explorer |
| Gaps | | Forms, landing pages, SEO/AEO, Marketing Hub |

### Reporting (85)

| Check | Status | Evidence |
|-------|--------|----------|
| Category rooms | ✅ | Pipeline, sales, outbound, ads + EvoViz |
| Builder + dashboards | ✅ | Saved reports, widgets, owner filter |
| Scheduled delivery | ✅ | Cron UI, HTML body, `last_window` dedupe |
| Bounce reporting | ✅ | Distinct bounced bucket from webhook events |
| Gaps | | Arbitrary SQL explorer; HubSpot attribution |

### Settings / admin (80)

| Check | Status | Evidence |
|-------|--------|----------|
| People & invites | ✅ | `/settings/people` |
| Permission matrix | ✅ | Role defaults + owner member grants; server enforced |
| System health | ✅ | Scheduled-command freshness |
| Pipelines / attributes / layouts | ✅ | Dedicated settings pages |
| Gaps | | SAML/SSO, audit log, HubSpot-style teams |

### Integrations (96 moat)

| Check | Status | Evidence |
|-------|--------|----------|
| Google login + Gmail/Calendar sync | ✅ | Tokens on `Integration`; 15-minute commands; start/pause |
| Meta OAuth | ✅ | Workspace credentials, not a global token |
| Evolution WA | ✅ | Tenant webhook key |
| Bounce webhook | ✅ | `POST /webhooks/outbound/bounces/{webhookKey}` |
| Marketplace | ❌ | Explicitly deferred |

### Visual chrome (84)

| Surface | Parity | Evidence |
|---------|--------|----------|
| Sidebar | 85% | `app-sidebar.tsx` — primary nav + More drawer |
| List chrome | 88% | `CrmListShell` + toolbar on contacts/deals/companies |
| Record chrome | 86% | 3-column + Ask Evo + properties; deal commerce mounted |
| Home | 80% | Command center + EvoViz |
| Desk | 75% | Embed + native fallback |
| Consistency | 78% | Hub split-panel gone; leads board/list still a second pattern |

### AI layer (72)

| Check | Status | Evidence |
|-------|--------|----------|
| Ask Evo on records | ✅ | Contact, deal, company show |
| Engagement score | ✅ | Contact show |
| Deal health / forecast | ✅ | Deterministic factors; Low data when empty |
| vs Breeze 2026 | ❌ | No vector RAG, no Prospecting/Closing agents, no Smart Deal Progression, no content studio |
| Tests | ✅ | `RecordInsightTest`, `DealGuidanceTest`, `EvoCell4AiLayerTest` |

---

## EvoSales moats (not HubSpot parity)

| Moat | Target | Evidence |
|------|--------|----------|
| **Owned outbound stack** | 105 | SMTP/IMAP, warmup, domains, suppressions, quiet hours, bounce webhook, Roundcube |
| **Algeria-native CRM** | 120 | Wilaya/city, DZD, Africa/Algiers reporting TZ |
| **Meta-native funnel** | 110 | Ads center + segment → Custom Audience without Zapier |
| **Self-hosted / data sovereignty** | — | Laravel + Docker on Server 1; no per-seat HubSpot tax |
| **EvoDesk embed** | — | Chatwoot Community in the CRM iframe |

---

## Top remaining gaps toward Omega (≥95 composite)

These replace the 2026-08-24 list. Items 7–8 from that list (`segment.exited`, scheduled reports) are **done**.

| # | Gap | Dimensions | Effort | Notes |
|---|-----|------------|--------|-------|
| 1 | **Forecast backtest** — validate the band within 15% on historical deals | M3, M10 | Large | Still the honest AI/forecast ceiling |
| 2 | **SMS send path** (Twilio or DZ provider) | M8 | Medium | Composer already stubs the failure |
| 3 | **Visual workflow canvas** (read-only v1 → editable) | M6 | Large | Explicitly deferred; largest remaining automation gap |
| 4 | **Calculated columns + association filters on lists** | M2 | Medium | FilterBuilder is wired; list math is not |
| 5 | **Playbooks on records** | M4 | Medium | HubSpot Professional staple; EvoSales has none |
| 6 | **SSO + audit log** | M11 | Medium | SAML deferred; even a login/audit trail would lift admin |
| 7 | **Segment membership history** | M5 | Small | Exit is an event; the membership row is deleted |
| 8 | **Breeze-comparable RAG** (optional) | M10 | Large | Explicitly deferred; do not fake agent claims |
| 9 | **Tickets or a Service Hub boundary** | M1, M8 | Large | Empty ticket card on deals is UI only |
| 10 | **E-sign / payments** | M1 | Large | Quotes accept; they do not collect money or a legal signature |

---

## Screenshot-worthy QA checklist

Use [production](https://crm.evotechly.com) after merge, or local with the seeded workspace (`owner@evosales.local`).

### Sidebar & home
- [ ] Sidebar: Home, Desk, Outbound, Ads, Reports
- [ ] CRM tabs: Contacts, Companies, Leads, Deals, Activities, Pipeline, Automation
- [ ] Home: Today tiles, department shortcuts, EvoViz

### List chrome (contacts, deals, companies)
- [ ] Saved-view tabs All / My / named views; create a view
- [ ] Advanced FilterBuilder; column chooser; export
- [ ] Contacts/deals: bulk bar after selecting rows
- [ ] Deals: pipeline switcher, stage pills, import link
- [ ] Create drawer stays on the list after save

### Record chrome
- [ ] Contact: Ask Evo + engagement score + custom properties
- [ ] Deal: health factors, line items, quotes, splits, Ask Evo
- [ ] Company: Ask Evo + custom properties (not a hub split-panel)
- [ ] Lead: conversion dialog (create or link a deal)

### Quotes
- [ ] Preview PDF and email a quote from the deal
- [ ] Public `/q/{token}` has no CRM sidebar
- [ ] Accept once; retry does not double-accept; revoked/expired 404

### Desk, outbound, ads
- [ ] `/inbox` embed or native threads
- [ ] Sequence enroll + reply pause
- [ ] Outbound reports show a bounced bucket
- [ ] Ads center + Meta connection state

### Automation & reports
- [ ] Workflow trigger list includes **Segment exited**
- [ ] Reports → Scheduled reports create/pause/delete
- [ ] `/crm/segments` → Meta sync when connected

### Settings
- [ ] Permissions matrix + member override
- [ ] System health freshness for the eight scheduled commands
- [ ] Record layouts workspace default
- [ ] Connectors: Gmail/Calendar start and pause
- [ ] People, pipelines, attributes, Meta, Evolution

---

## Related docs

- [Side-by-side capability matrix](./hubspot-side-by-side.md)
- [EvoCells roadmap & dimension scorecard](./evocells-roadmap.md)
- [Production processes](./production-processes.md)
- [Object model](./OBJECT_MODEL.md)
- [HubSpot gap module porting notes](./hubspot-gap-module-porting.md)
- [Architecture](./ARCHITECTURE.md)
- [Implementation plan](../tasks/plan.md)
