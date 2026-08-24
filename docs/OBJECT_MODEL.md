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
| **Lead** | Pre-pipeline interest. `qualify()` sets `qualified_at`. |
| **Pipeline** | Default “Sales” pipeline per workspace. |
| **Stage** | New → Qualified → Demo → Proposal → Won / Lost. Optional `probability` (0–100) for board forecast; if missing: New 10, Qualified 25, Demo 50, Proposal 75, Won 100, Lost 0 (unknown open 20). |
| **Deal** | Sales Hub record: amount (cents, display DZD), currency default DZD, `close_date`, `next_step`, `owner_id`, `source`, `lost_reason`. `moveTo(Stage)` writes a `stage_change` activity. Amount rolls up from `DealLineItem` when items exist; stays manual when the deal has no items. |
| **Product** | Local catalog stand-in until Evostock sync. Workspace-scoped `sku`, `name`, `unit_cents` (DZD), `active`. SKU is the later Evostock join key. |
| **DealLineItem** | Product line on a Deal: name/sku snapshot, quantity, unit cents, line total. Deal `amount_cents` is the sum when any items exist. |
| **Activity** | Timeline spine: `note`, `task`, `call`, `meeting`, `stage_change`, `sequence`. Tasks have `due_at`, `owner_id`, `done`. Home next steps = open tasks. |
| **CustomAttributeDefinition** | Workspace-defined field (text / number / list) on contact, company, or deal. |
| **CustomAttributeValue** | Value for one entity + definition. |
| **SavedFilter** | Named list: stage, owner, city, wilaya, last activity, unanswered, unassigned. |
| **Dashboard** | Saved Reports board on top of the default rooms. `name`, `owner_id`, `widgets` JSON (keys into existing EvoViz charts). Workspace-scoped. |
| **Workflow** | Additive Automation MVP. Trigger `contact.created` or `deal.stage_changed` (optional target stage). Action: create a Task on the record, or enroll the contact in an existing Outbound Sequence. Runs synchronously from Eloquent observers. |
| **Quote** | Light quote on a Deal. Status `draft` / `sent` / `accepted`. Currency DZD. |
| **QuoteItem** | Line: optional `product_id` from the same catalog, name, quantity, unit cents, line total. Quote `total_cents` is the sum. |

## Desk

| Object | Notes |
| --- | --- |
| **Channel** | `whatsapp_cloud` (Evolution), `email`, `telegram` (later stub). |
| **Thread** | Conversation history synced from EvoDesk for CRM (contact ↔ deal). Not the Chatwoot UI. `unread_count` feeds Home. |
| **Message** | Inbound/outbound log. Optional CRM composer uses Evolution Cloud `sendText` or stores `failed` with a reason. |

## Outbound

| Object | Notes |
| --- | --- |
| **Mailbox** | SMTP credentials. `password` encrypted at rest. |
| **Sequence** | Email or `whatsapp_cloud`. |
| **SequenceStep** | Delay + body or official WA template name. |
| **Enrollment** | Contact progressing through a sequence. Enroll writes a `sequence` activity. |
| **OutboundMessage** | Send attempt + status. |
| **Suppression** | Unique workspace + type + value. Written by `/unsubscribe`. |
| **QuietHours** | Default 21:00–08:00 Africa/Algiers. |

## Ads

| Object | Notes |
| --- | --- |
| **AdAccount** | Meta ad account listing (env connection, no invented IDs). |
| **AdCampaign** | Campaign / ads “Campaign” object. Flags: `click_to_whatsapp`, `lead_form`. |
| **AdLead** | Raw lead-form payload linked to Contact + Lead. |

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
