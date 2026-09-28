# EvoCRM entity map

Canonical backend model notes: `docs/OBJECT_MODEL.md`. This file is the audit view: where entities appear in UI, CRUD, statuses.

All domain rows are workspace-scoped unless noted. `[CONFIRMED-CODE]`

## Identity

### Workspace
- Purpose: tenant. Timezone Africa/Algiers, country DZ, dial 213, `inbox_url`, `simple_mode`, quotas, lead score settings, meeting WA templates.
- Screens: Settings General; shared Inertia `workspace`.
- Update: `PUT /settings/workspace` owner-only.

### User
- Fields: name, email, password, role (`owner|admin|member`), permissions JSON, 2FA, last_login_at, workspace_id.
- Screens: Settings People, Profile, Security, Permissions.
- Create: invite `POST /settings/people` (set-password email). Seed also creates users directly.

## CRM

### Company
- Fields: name, domain, city, wilaya, phone, country, owner_id.
- Relationships: contacts, deals, activities.
- List `/crm/companies`; detail `/crm/companies/{id}`; create POST; update PUT; attributes PUT; enrich POST; Ask Evo POST (blocked in simple mode).
- No dedicated destroy route in web.php grep `[CONFIRMED-CODE]`.

### Contact
- Fields: first/last name, email (unique per workspace), phone / phone_e164 / whatsapp_jid, city, wilaya, source, lead_status (`new|working|qualified|disqualified`), owner_id, last_activity_at, unanswered, meta JSON.
- Relationships: company, owner, deals, leads, tickets, threads, activities, enrollments.
- List, detail, import, export, duplicates, merge, bulk, create drawer, enrich, Ask Evo, draft-email.

### Lead
- Pre-pipeline interest; score; status; contact; qualify → deal.
- List `/crm/leads` (does **not** use full savedFilters props in crawl); detail; captures ingest; `POST qualify`.
- `/leads` is **not** this list — redirects to deals board.

### Pipeline / Stage
- Default Sales pipeline. Stages New → Qualified → Demo → Proposal → Won / Lost. Optional probability and `required_properties`.
- Settings `/settings/pipelines`. Deal board/list consume stages.
- `Deal::moveTo` 422 if required properties missing `[CONFIRMED-CODE]` OBJECT_MODEL.

### Deal
- Fields: title, amount_cents, currency, close_date, next_step, owner, source, lost_reason, stage, pipeline, contact, company, lead_id, last_activity_at, priority, type.
- Line items roll up amount when present.
- List, board (drag move), import, export, bulk, detail, splits, suggestions, Ask Evo, draft-email.

### Product / DealLineItem
- Catalog + deal lines. Detail deal UI.

### Quote / QuoteItem
- Status draft/sent/accepted. Send freezes snapshot; public token `/q/{token}`. Immutable after send/accept.
- List/detail in CRM; create via deal or `?create=1` if `crm.edit`.

### Activity
- Types: note, task, call, meeting, stage_change, sequence. Tasks: due_at, owner_id, done.
- Screens: record timeline, `/crm/activities`, header Tasks overlay, Home work/attention.

### Ticket
- Number `EVO-######`, status new / waiting_on_contact / waiting_on_us / closed, priority, channel, contact required, optional deal/thread/owner, SLA.
- List/board/detail. **Simple mode 403.** No ticket in seed so `/crm/tickets/1` 404 even if unblocked.

### SavedFilter / Segment
- Named list views + contact/deal segment membership + Meta sync.
- `/crm/segments`, show, preview POST, CRUD, sync-meta (`ads.manage`).

### CustomAttributeDefinition / Value
- text/number/list on contact|company|deal. Settings Properties; record attribute editors.

### RecordLayout
- Per-user/workspace hub card layout. Settings Record layouts; `GET/PUT /crm/record-layouts/{entity}`.

### Playbook
- Scripts on contact/deal records. Settings Playbooks.

### EnrichmentRun / AiInsight
- Enrichment apply/dismiss. Ask Evo last Q&A. Deal health computed live not stored as insight.

### LeadCapture
- Ingest rows (csv/url/maps) accept/reject → leads.

### ImportBatch / ImportRow / BulkActionRun
- Contact and deal import wizards; bulk POST endpoints.

## Desk

### Channel, Thread, Message
- Inbox folders, native composer, Evolution send.
- Conversation history list.

### Connector
- Desk/official connectors; Settings Connectors + inbox official-connect-panel.

## Outbound

Mailbox, OutboundDomain, OutboundTemplate, Sequence, SequenceStep, Enrollment, OutboundCampaign, OutboundMessage, Suppression, QuietHours.

Warmup is mailbox plan state (blocked in simple mode).

## Ads / Meta

AdAccount, AdCampaign, AdSet, Ad, AdLead, AdCampaignStat, MetaLeadForm, MetaFieldMapping, MetaWebhookEvent, MetaConversionConfig/Event, MetaSyncRun.

UI blocked in simple mode.

## Automation / analytics

Workflow, WorkflowExecution, Dashboard (saved report board), SavedReport, ScheduledReport, ConversionFunnel / FunnelEvent, GraphRun (Lead OS).

## Relationship map (actual)

```
Workspace
├── Users (owner/admin/member)
├── Companies
│     └── Contacts
│           ├── Leads ──qualify──► Deal (lead_id unique)
│           ├── Deals
│           │     ├── Stage / Pipeline
│           │     ├── DealLineItem → Product
│           │     ├── Quotes → QuoteItem → Product
│           │     ├── DealSplit
│           │     └── Activities
│           ├── Tickets ── Thread ── Message
│           ├── Enrollments → Sequence → SequenceStep → Mailbox
│           └── Activities
├── SavedFilters / Segments
├── Workflows
├── Mailboxes / Domains / Templates / Campaigns / Suppressions
├── AdAccounts → Campaigns → AdSets → Ads → AdLeads
└── Dashboards / SavedReports / Funnels
```

## Frontend representation patterns

| Pattern | Entities |
|---------|----------|
| DataWorkspace list + CrmListShell | contact, company, deal, lead, quote, ticket |
| Record hub (record-chrome / record-hub) | contact, company, deal, lead, ticket |
| Kanban | deals board, tickets board, ads funnel board, lead captures? |
| Settings cards | workspace config entities |
| Outbound hub cards/tables | mail stack |
| Public token pages | quote, meeting |

## Status / enum highlights `[CONFIRMED-CODE]`

- Contact.lead_status: new, working, qualified, disqualified
- Deal via stage slug + open/won/lost filter
- Quote: draft, sent, accepted
- Ticket: new, waiting_on_contact, waiting_on_us, closed; priority low/medium/high
- ConnectorStatus / ChannelType / WorkspaceRole enums under `app/Enums`
- OutboundMessage deferred states (outbox)
- Mailbox warmup: warming vs active
