# EvoSales object model

All domain rows are scoped by `workspace_id` unless noted.

## Identity

| Object | Notes |
| --- | --- |
| **Workspace** | Evotechly tenant. Timezone `Africa/Algiers`, dial code `213`. `inbox_url` is the sold EvoDesk URL (default `https://desk.evotechly.com`). Stores last Evolution webhook timestamp/event. |
| **User** | Fortify-authenticated. `role`: owner / admin / member. Belongs to one workspace in this slice. |

## CRM

| Object | Notes |
| --- | --- |
| **Company** | Account. Algeria-first city/country. |
| **Contact** | Canonical person. Unique per workspace on `phone_e164` and on `email`. Phone normalized to E.164 with default country 213. |
| **Lead** | Pre-pipeline interest. `qualify()` sets `qualified_at`. |
| **Pipeline** | Default “Sales” pipeline per workspace. |
| **Stage** | New → Qualified → Demo → Proposal → Won / Lost. |
| **Deal** | Points at Contact (and optional Company + Lead). `moveTo(Stage)` enforces same pipeline. `next_activity_at` drives Home next steps. |

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
| **Enrollment** | Contact progressing through a sequence. |
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
Contact 1─* Thread (Desk)
Contact 1─* Deal   (CRM)
Contact 1─* Lead
Contact 1─* Enrollment
```

Click-to-WA and lead forms resolve through `ContactIdentity::findOrCreate` so Desk and CRM stay on the same person.
