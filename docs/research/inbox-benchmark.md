# EvoCRM Inbox Benchmark

## Scope

This benchmark covers inbox navigation, conversation list, message workspace, composer, assignment, channels, CRM context, tickets, internal notes, collaboration, AI, resolution, and WhatsApp.

## Current EvoCRM baseline

The repository has two inbox modes. resources/js/pages/desk/inbox.tsx embeds EvoDesk when the configured Desk URL exists and renders a native FrontDesk fallback otherwise. The native view uses AdaptiveWorkspaceShell with InboxFolderRail, conversation list/thread content, and InboxContactSidebar. Local filters include all, unassigned, mine, open, closed, WhatsApp, and channel filters. Reply and internal-note modes, ticket linking, and contact context are present.

resources/js/pages/crm/conversations.tsx is a separate lightweight CRM conversation history surface using DeskShell and InboxContactSidebar. This boundary is important: the four-pane contract must be clear even when the production inbox is an embedded Desk product.

## Benchmark evidence

| Product | Evidence | Strong behavior | Limitation for EvoCRM |
|---|---|---|---|
| Intercom | [Inbox screen](https://mobbin.com/screens/3e62661f-4671-4234-b8d2-603067b35efe), [Inbox explained](https://www.intercom.com/help/en/articles/6258745-the-inbox-explained), [customization](https://www.intercom.com/help/en/articles/7911926-customize-the-inbox-to-suit-you-and-how-you-work-best), [macros](https://www.intercom.com/help/en/articles/6584504-using-macros-in-the-inbox) | Clear queue navigation, conversation list, rich composer, assignment, collision awareness, and customer context. | Defaults toward support workflows and can overemphasize bot/AI surfaces. |
| Front | [Inbox screen](https://mobbin.com/screens/42adf3bd-2dee-4f3b-82a8-bdec59a9556b) | Strong collaborative inbox, shared drafts, assignment, team context, and multi-channel identity. | Email-centric mental model and configuration burden. |
| HubSpot | [team collaboration in inbox](https://knowledge.hubspot.com/inbox/collaborate-with-your-team-in-the-conversations-inbox?rc=novicell) | Connects conversation to CRM record, ticket, owner, and follow-up work. | Inbox can inherit the breadth and complexity of the wider platform. |
| Zendesk | Production agent workspace patterns. | Triage, status, assignment, internal notes, macros, and resolution state are explicit. | Ticket-centric workflows do not cover sales conversations as naturally. |
| Gorgias | Production ecommerce support inbox patterns. | Fast triage and customer/order context. | Commerce assumptions do not map to CRM deals and quotes. |
| Salesforce | Production Service Cloud patterns. | Deep record, case, routing, permission, and automation integration. | Complexity and setup are disproportionate for SMB users. |

## Score comparison

| Candidate | Hierarchy | Ease | Speed | Discoverability | Density | Scale | A11y | Keyboard | Responsive | EvoCRM fit | Complexity |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Intercom | 9 | 9 | 8 | 9 | 8 | 8 | 7 | 8 | 7 | 9 | 7 |
| Front | 9 | 8 | 8 | 8 | 8 | 8 | 7 | 8 | 7 | 9 | 7 |
| HubSpot | 8 | 8 | 7 | 8 | 8 | 9 | 7 | 7 | 7 | 9 | 8 |
| Zendesk | 9 | 7 | 8 | 8 | 8 | 9 | 7 | 8 | 7 | 7 | 8 |
| Gorgias | 8 | 9 | 9 | 8 | 8 | 7 | 7 | 8 | 8 | 7 | 6 |
| Salesforce | 8 | 6 | 6 | 7 | 9 | 10 | 6 | 6 | 5 | 7 | 10 |

## Target four-pane contract

| Pane | Responsibility | Required behavior |
|---|---|---|
| Inbox navigation | Folders, teams, ownership, channels, saved queues | Counts, unread state, active queue, collapse on smaller widths. |
| Conversation list | Triage and selection | Search, sort, unread, assignment, priority, channel icon, latest message, SLA/age where applicable. |
| Conversation | Read, reply, note, resolve | Composer mode, attachments, templates/macros, optimistic draft, reply state, errors, keyboard shortcuts. |
| CRM context | Relationship and next action | Contact, company, deal, quote, ticket, recent activity, owner, and quick actions; contextual rather than a second full CRM page. |

The four panes are a logical model. On desktop, navigation may be a narrow rail plus list; on tablet, navigation and context become drawers; on mobile, the conversation is the primary screen with explicit sheets for list and CRM context.

## Channel and state model

Channel identity must be shown in the list and header: WhatsApp, email, web, or other connector. The channel label is semantic, not only color. Assignment, open/closed/resolved, internal note, and waiting-on-customer states need separate labels. Resolve must not erase the thread; it moves it into a retrievable state and supports reopen.

## CRM signature flow

From a conversation, the primary contextual actions should be: open or create contact, open company, create or attach deal, create quote, create task, and open full record. A WhatsApp conversation should preserve channel identity and should not become a generic activity in the timeline.

## ADOPT / ADAPT / REJECT

| Decision | Rationale |
|---|---|
| ADOPT Intercom's queue and composer behavior | It minimizes time from triage to useful response. |
| ADOPT Front's collaboration model | Shared drafts, assignment, and collision awareness fit team selling. |
| ADOPT HubSpot's CRM context | The inbox should create and advance sales work, not just close messages. |
| ADAPT Zendesk's explicit resolution state | Use open, waiting, resolved, and reopen without forcing every conversation into a ticket. |
| ADAPT Gorgias' fast context loading | Keep related contact/company/deal context compact and scannable. |
| REJECT AI as the dominant composer | Assistance must be optional and grounded in the selected thread. |
| REJECT channel-specific visual languages | Use semantic labels and EvoCRM tokens, not a different app per channel. |
| REJECT silently losing context when moving from embedded EvoDesk | Preserve handoff, identity, and deep-link behavior across the boundary. |

## Implementation impact

Eventually affect pages/desk/inbox.tsx, components/crm/desk-shell.tsx, inbox-chrome.tsx, components for InboxFolderRail and InboxContactSidebar, pages/crm/conversations.tsx, Desk iframe handoff, thread reply/ticket routes, activity timeline integration, and command/record drawer links. No implementation is made in this phase.

## Sources

See the [overall benchmark](ux-benchmark.md), [design system](../design-system.md), and [Mobbin contract](../evocrm-mobbin-contract.md).
