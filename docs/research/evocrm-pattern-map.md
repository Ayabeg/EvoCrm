# EvoCRM Pattern Map

## How to use this map

The references below win a behavioral problem. Their visual language is not imported. Every pattern is translated through the existing EvoCRM contract in docs/design-system.md and docs/evocrm-mobbin-contract.md.

## Surface map

| EvoCRM surface | Best reference | Secondary reference | Pattern to adopt | EvoCRM adaptation |
|---|---|---|---|---|
| App shell | Linear | Slack, Shopify | Compact persistent navigation with command access | Keep EvoCRM four-room structure, 64/240 sidebar, and global create/search. |
| Dashboard/Home | Shopify | Stripe, HubSpot | Action-oriented overview with comparison and drill-down | Replace commerce metrics with CRM health, attention, pipeline, activity, and communication outcomes. |
| Contacts | HubSpot | Attio, Airtable | Saved views plus data workspace | Preserve shared DataWorkspace and add fast record drawer. |
| Companies | Attio | HubSpot | Relational record context and flexible attributes | Show people, deals, conversations, and activity without spreadsheet sprawl. |
| Leads | HubSpot | Pipedrive | Lifecycle qualification and next action | Keep /crm/leads as list/detail and the existing /leads redirect to PipelineBoard. |
| Deals list | HubSpot | Pipedrive, Airtable | Shared saved-view/table model | Keep sales-specific stage, amount, owner, and next-activity defaults. |
| Quotes list | Stripe | HubSpot, PandaDoc | Status-driven object list | Add sent/viewed/accepted/expired clarity while preserving shared shell. |
| Record details | HubSpot | Attio, Pipedrive | Identity, properties, activity, associations | Keep current RecordShell; add contextual Quick Record Drawer. |
| PipelineBoard | Pipedrive | HubSpot, Monday | Value-and-next-activity Kanban | Add weighted totals, stale cues, accessible movement, list parity. |
| Inbox | Intercom | Front, HubSpot | Queue, conversation, composer, context | Keep embedded Desk boundary and make native fallback a clear four-pane contract. |
| Activities | Linear | Asana, Todoist | Fast queue with due/priority/complete | Add object relationship, channel, and next-action linkage. |
| Automation | Shopify Flow | HubSpot, Zapier | Structured trigger-condition-action | Keep current structured builder; add preview, test, history, and safe activation. |
| Quote builder | Stripe | PandaDoc, HubSpot | Line-item editor with preview/send state | Connect deal/contact/company, taxes, discounts, validity, viewed/accepted state. |
| Settings | Stripe | Shopify, Linear | Scope-aware, searchable admin IA | Group personal, workspace, CRM, communication, automation, integrations, developer. |
| Integrations | Shopify | Slack, Zapier, HubSpot | Directory, connected state, permission-aware config | Map WhatsApp, Meta, email, EvoDesk, and future apps to one connector model. |
| Search/command | Linear | Slack, Notion, Raycast | Keyboard-first grouped search and actions | Cross-object search with create, context actions, and optional grounded Ask Evo. |
| Create flows | Linear | Stripe, HubSpot, Attio | Fast progressive disclosure | Use drawers for quick create, full pages for complex quotes/imports/configuration. |
| Onboarding | Shopify | Stripe, Linear, HubSpot | Persistent activation checklist | Guide identity, team, import, pipeline, WhatsApp/Meta, first contact, first deal, first action. |
| AI | Intercom | HubSpot, Linear | Contextual assistance inside work | Summaries, drafting, next actions, and grounded search; no floating generic AI button. |
| Micro-UX | Linear/Stripe | WAI-ARIA, Vercel | Consistent focus, feedback, errors, and shortcuts | Normalize through EvoCRM tokens and shared primitives. |

## Recommended score summary

These are benchmark judgments, not usability-study results. Scores use the rubric in docs/research/ux-benchmark.md.

| Category | Behavioral winner | Confidence | Main reason |
|---|---|---|---|
| Shell | Linear | High | Fast orientation and keyboard access. |
| Dashboard | Shopify | High | Signal-to-action hierarchy. |
| Data workspace | HubSpot with Attio/Airtable inputs | High | CRM familiarity plus flexible views. |
| Record workspace | HubSpot | High | Best balance of identity, properties, timeline, and associations. |
| Pipeline | Pipedrive | High | Sales clarity and movement speed. |
| Inbox | Intercom with Front inputs | High | Strong triage/composer plus collaboration. |
| Activities | Linear/Asana hybrid | Medium | Speed from Linear, scheduling/queue clarity from Asana. |
| Automation | Shopify Flow | High | Structured and approachable. |
| Quotes | Stripe with PandaDoc status | High | Builder clarity plus document lifecycle. |
| Settings | Stripe | High | Scope and danger clarity. |
| Integrations | Shopify/Zapier hybrid | Medium | Directory discoverability plus connector action clarity. |
| Command | Linear with Slack search | High | Speed plus cross-object retrieval. |
| Onboarding | Shopify | High | Persistent setup momentum. |
| AI | Intercom/HubSpot contextual patterns | Medium | Useful when attached to real work, risky as a generic destination. |

## 35 signature EvoCRM experiences

These are opportunities to be better because the product combines CRM, communication, outbound, ads, and sales in one workspace.

| # | Signature experience | Why it matters | Classification |
|---:|---|---|---|
| 1 | Universal CRM Record Drawer | Inspect a contact/company/deal from any room without losing place. | ADOPT |
| 2 | WhatsApp to Contact | Convert an unknown WhatsApp participant into a contact with prefilled context. | ADAPT |
| 3 | WhatsApp to Deal | Create or attach a deal from the conversation with source/channel preserved. | ADAPT |
| 4 | Conversation to Quote | Draft a quote from a live conversation and return to the thread. | ADAPT |
| 5 | Conversation to Task | Turn a customer promise into a dated activity with owner and record link. | ADOPT |
| 6 | Conversation to Company | Resolve or create a company from domain/phone metadata with confirmation. | ADAPT |
| 7 | Unified Activity Timeline | Combine CRM, inbox, outbound, quote, and workflow events with typed sources. | ADAPT |
| 8 | Smart Needs Attention | Rank overdue, stale, unassigned, failed, and waiting work across rooms. | ADAPT |
| 9 | Deal next-action guarantee | Every open deal exposes next action or explains why none exists. | ADOPT |
| 10 | Quote acceptance to next step | Accepted quote prompts deal update, task, and optional message. | ADAPT |
| 11 | Quote viewed signal in record | Viewed state appears beside deal and conversation context. | ADOPT |
| 12 | Global cross-object search | One query finds people, companies, deals, quotes, tickets, threads, and tasks. | ADOPT |
| 13 | Cmd/Ctrl+K create flow | Create common CRM objects without leaving the current room. | ADAPT |
| 14 | Contextual command actions | Search result offers safe actions for its object and permissions. | ADAPT |
| 15 | Activity-to-inbox handoff | Overdue call/task opens the related conversation or record context. | ADAPT |
| 16 | Inbox reply with deal stage suggestion | A grounded suggestion appears after a meaningful reply, never auto-applies. | ADAPT |
| 17 | Inbox contact context with quote status | Agent sees whether a quote is draft, sent, viewed, or accepted. | ADAPT |
| 18 | Inbox internal note to workflow | Note or tag can trigger a reviewable automation. | ADAPT |
| 19 | Stale deal explanation | Card tells the user whether staleness comes from age, no activity, or overdue next action. | ADOPT |
| 20 | Pipeline drag with undo and activity prompt | Stage movement can immediately create the next task. | ADAPT |
| 21 | Board/list view parity | Same filters, saved views, drawer, and query state in both views. | ADOPT |
| 22 | Import preview with duplicate merge path | Import quality is visible before records enter the CRM. | ADOPT |
| 23 | Company relationship graph in plain language | Show people, deals, threads, and ads without a graph visualization requirement. | ADAPT |
| 24 | Channel-aware record timeline | WhatsApp, email, Desk, outbound, and manual activities stay distinct. | ADOPT |
| 25 | One-click “send approved follow-up” | Use templates and permissions to make follow-up safe and fast. | ADAPT |
| 26 | Ask Evo with evidence links | Every answer links to the records, threads, or metrics it used. | ADOPT |
| 27 | Ask Evo to draft, never silently send | AI can prepare a message or task for review. | ADOPT |
| 28 | Workflow test from a real record | Preview the exact path using representative CRM data. | ADOPT |
| 29 | Integration health in Needs Attention | Failed sync or disconnected WhatsApp is an operating issue, not buried settings. | ADAPT |
| 30 | Setup checklist to first customer outcome | Onboarding ends at a real contact/deal/action, not a completed form. | ADAPT |
| 31 | Saved view shared with action context | A view can be opened from dashboard, command, and attention queue. | ADOPT |
| 32 | Quote line-item from deal context | Avoid re-entering customer and deal data. | ADAPT |
| 33 | Record-aware outbound enrollment | Sequence enrollment warns about open deal, consent, or existing conversation. | ADAPT |
| 34 | Ads attribution to CRM record | Show source and campaign context on lead/contact/deal where available. | ADAPT |
| 35 | Permission-aware universal actions | The same command/drawer action explains why it is unavailable instead of disappearing silently. | ADOPT |

## Frankenstein prevention rules

1. Use one EvoCRM component contract for buttons, controls, badges, tables, drawers, and focus states.
2. Borrow behavior, not colors, typography, logos, icon sets, or branded terminology.
3. Keep object semantics in configuration and shared primitives in the DS.
4. Prefer one interaction model with domain-specific fields over five separate page patterns.
5. Every new pattern must name its existing EvoCRM primitive and its URL/state contract.

