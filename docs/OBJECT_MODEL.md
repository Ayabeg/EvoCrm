# EvoSales object model

All domain rows are scoped by `workspace_id` unless noted.

## Identity

| Object | Notes |
| --- | --- |
| **Workspace** | Evotechly tenant. Timezone `Africa/Algiers`, dial code `213`. `inbox_url` is the sold EvoDesk URL (default `https://desk.evotechly.com`). Stores last Evolution webhook timestamp/event. |
| **User** | Fortify-authenticated. `role`: owner / admin / member. Owns Contacts and Deals (`owner_id`). Unassigned queue = `owner_id` null. |

## CRM (Sales Hub)

| Object | Notes |
| --- | --- |
| **Company** | Account. Algeria-first `city` / `wilaya` / country. Optional owner. |
| **Contact** | Canonical person. Unique per workspace on `phone_e164` and on `email`. `owner_id`, `city`, `wilaya`, `last_activity_at`, `unanswered`. |
| **Lead** | Pre-pipeline interest. Qualification can create or link one Deal (`deals.lead_id` unique) and writes a `lead_converted` activity. |
| **Pipeline** | Default “Sales” pipeline per workspace. |
| **Stage** | New → Qualified → Demo → Proposal → Won / Lost. Optional `probability` (0–100) for board forecast; if missing: New 10, Qualified 25, Demo 50, Proposal 75, Won 100, Lost 0 (unknown open 20). Optional `required_properties` (deal fields + `attr.{key}` custom) — `Deal::moveTo` 422s until they are filled. |
| **Deal** | Sales Hub record: amount (cents, display DZD), currency default DZD, `close_date`, `next_step`, `owner_id`, `source`, `lost_reason`. `moveTo(Stage)` writes a `stage_change` activity. Amount rolls up from `DealLineItem` when items exist; stays manual when the deal has no items. |
| **Product** | Local catalog stand-in until Evostock sync. Workspace-scoped `sku`, `name`, `unit_cents` (DZD), `active`. SKU is the later Evostock join key. |
| **DealLineItem** | Product or ad hoc line on a Deal: name/sku snapshot, quantity, unit cents, line total. Deal `amount_cents` is the sum when any items exist. |
| **Activity** | Timeline spine: `note`, `task`, `call`, `meeting`, `stage_change`, `sequence`. Tasks have `due_at`, `owner_id`, `done`. Home next steps = open tasks. Public `/book/{slug}` writes a `meeting` with `meta.source = booking`. |
| **MeetingSchedule** | Per-user public booking page. `slug`, slot length 30/45/60, Africa/Algiers hours, weekdays. Optional Google Calendar busy subtract + event write. |
| **CustomAttributeDefinition** | Workspace-defined field (text / number / list) on contact, company, or deal. |
| **CustomAttributeValue** | Value for one entity + definition. |
| **SavedFilter** | Named list: stage, owner, city, wilaya, last activity, unanswered, unassigned. |
| **ContactSegmentMembership** | Enter/exit stint for a contact on a contact SavedFilter. Current member = `exited_at` null. Exit sets `exited_at`; re-entry inserts a new row. |
| **AuditEvent** | Workspace log for login, import, merge, quote send/accept, and permission changes. Owner/admin read `/settings/audit`. |
| **Playbook** | Named script for contact or deal records. Shown on the matching record page. |
| **Dashboard** | Saved Reports board on top of the default rooms. `name`, `owner_id`, `widgets` JSON (keys into existing EvoViz charts). Workspace-scoped. |
| **Workflow** | Automation with triggers including `contact.created`, `deal.stage_changed`, `segment.entered`, `segment.exited`, and `meeting.booked`. Actions include task, sequence, webhook, property, owner, deal, email, and notify. Delayed actions queue. |
| **Quote** | Versioned quote on a Deal. Status `draft` / `sent` / `accepted`. Currency DZD. Sending freezes `snapshot`/`snapshot_html` and issues a revocable public token. Sent and accepted quotes are immutable. |
| **ScheduledReport** | Named cron delivery of a saved report or dashboard. Records `last_status`, `last_error`, and `last_window` so one schedule window is emailed once. |
| **QuoteItem** | Line: optional `product_id` from the same catalog, name, quantity, unit cents, line total. Quote `total_cents` is the sum. |
| **AiInsight** (`record_insights`) | Last Ask Evo Q&A on a contact or deal. Source `fields` / `openai` / `anthropic`. Deal health is computed live (stage probability + recency + amount), not stored here. |

## Desk

| Object | Notes |
| --- | --- |
| **Channel** | `whatsapp` (Evolution Baileys / phone), `whatsapp_cloud` (Evolution Business), `email`, `telegram` (later stub). |
| **Thread** | Conversation history synced from EvoDesk for CRM (contact ↔ deal). Not the Chatwoot UI. `unread_count` feeds Home. |
| **Ticket** | After-sale work item on a Contact. Human `number` (`EVO-000041`) unique per workspace. Status `new` → `waiting_on_contact` → `waiting_on_us` → `closed`. Optional `thread_id` (one ticket per thread), `deal_id`, `owner_id`. Contact is required. |
| **Message** | Inbound/outbound log. Optional CRM composer uses Evolution Cloud `sendText` or stores `failed` with a reason. |

## Outbound

| Object | Notes |
| --- | --- |
| **Mailbox** | SMTP credentials. `password` encrypted at rest. |
| **Sequence** | Email or `whatsapp_cloud`. |
| **SequenceStep** | Delay + body or official WA template name. |
| **Enrollment** | Contact progressing through a sequence. Enroll writes a `sequence` activity. |
| **OutboundMessage** | Send attempt + status. Bounce webhooks set `bounce_type`, `bounced_at`, and `provider_event_id` (idempotent per workspace). |
| **Suppression** | Unique workspace + type + value. Written by `/unsubscribe` and hard-bounce processing. |
| **QuietHours** | Default 21:00–08:00 Africa/Algiers. |

## Ads

| Object | Notes |
| --- | --- |
| **AdAccount** | Workspace Meta ad account (external id, currency, timezone, status). |
| **AdCampaign** | Campaign object. Flags: `click_to_whatsapp`, `lead_form`. Budget + start/end when Meta sends them. |
| **AdSet** | Ad set under a campaign (optimization goal, targeting summary). |
| **Ad** | Ad + creative reference under an ad set. |
| **AdLead** | Raw lead-form payload linked to Contact + Lead, with campaign/ad set/ad/page attribution. |
| **MetaLeadForm** | Synced Instant Form catalog. |
| **MetaFieldMapping** | Tenant map of Meta form fields → CRM properties. |
| **MetaWebhookEvent** | Durable Lead Ads webhook envelope (idempotent, queue-backed). |
| **MetaConversionConfig** | CRM lifecycle → Meta standard event mapping (disabled until a pixel is set). |
| **MetaConversionEvent** | Outbound Conversions API attempt log (hashed user data only). |
| **MetaSyncRun** | Ads / forms / historical lead sync run. |

## Evolution

| Object | Notes |
| --- | --- |
| **EvolutionEvent** | Stored webhook envelope for health + audit. |

## Identity of a person

```
Contact 1─* Thread (Desk history)
Contact 1─* Deal   (CRM)
Contact 1─* Lead
Contact 1─* Enrollment
Contact 1─* Activity
Deal    1─* Quote
Deal    1─* DealLineItem
Deal    1─* Activity
Product 1─* DealLineItem
Product 1─* QuoteItem
```

Click-to-WA and lead forms resolve through `ContactIdentity::findOrCreate` so Desk and CRM stay on the same person. “Open in Desk” leaves EvoSales for `EVOSALES_INBOX_URL`.
