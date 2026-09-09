# EvoTickets — WhatsApp work items, not empty Service Hub

| | |
|---|---|
| **Repo** | [Mohamedbeghanem/EvoSales](https://github.com/Mohamedbeghanem/EvoSales) (`main`) |
| **Product name** | EvoTickets (after-sale object). EvoSales remains the OS. Desk remains the inbox. |
| **Source of truth** | Mobbin HubSpot Help Desk + Salesforce Cases. Do not invent chrome from memory. |
| **Screen freeze** | [evotickets-mobbin-contract.md](./evotickets-mobbin-contract.md) (P0) |
| **Date** | 2026-09-08 |
| **Buyer** | 5–20 seat Algeria-first sales team. After-sale lives on WhatsApp. |
| **Status** | P0–P2 on `main` ([#143](https://github.com/Mohamedbeghanem/EvoSales/pull/143)). P3 [#144](https://github.com/Mohamedbeghanem/EvoSales/pull/144). P4 in this PR. |

This plan **reverses** the 2026-08-29 deferral (“tickets sit unused”) by shrinking the object until it is a status layer on Desk — not a second Service Hub.

Related: [evocrm-plan.md](./evocrm-plan.md) · [OBJECT_MODEL.md](./OBJECT_MODEL.md) · [ideas/next-hubspot-feature.md](./ideas/next-hubspot-feature.md)

---

## 1. Thesis

A ticket in this market is **a WhatsApp thread that needs an owner, a Path, and a close**. HubSpot’s Help Desk without a conversation is the failure mode ([8967ff1d](https://mobbin.com/screens/8967ff1d-c744-4825-9f99-7449632e4b6d)).

| Steal from HubSpot | Steal from Salesforce | Keep / beat with EvoSales |
|---|---|---|
| Help Desk board columns, inactivity on cards, list/board toggle, filter chips, ticket properties rail | Numbered cases, Recently Viewed, Change Owner, Cases card on the contact, Path | WhatsApp Cloud is the channel. Desk thread is the conversation. Quote / deal stay one click away. Africa/Algiers SLA clock. No per-seat Service Hub tax. |

**Do not build (v1):** knowledge base, CSAT, macros library, round-robin teams, business-hours calendars, unknown-visitor tickets, Copilot, Slack, e-sign, custom objects, a second inbox.

Meetings stay a **separate** sales slice ([next-hubspot-feature.md](./ideas/next-hubspot-feature.md)). This plan does not replace the scheduler.

---

## 2. Why now (and why the old deferral was right)

The old note was correct about **empty** Service Hub. It was wrong about **no object at all**.

Evotechly sellers already have:

- Won deals + quotes
- Inbound WhatsApp on Desk
- No place to say “this is waiting on the customer” vs “we owe a reply”

Without tickets, that work hides in unread Desk threads. With HubSpot tickets and no thread, you get “There are no conversations on this ticket”.

**Rule:** a ticket is invalid without a Contact. A ticket without a Thread is allowed only as a manual stub, and the empty state is “Open WhatsApp / attach thread”, never “Add Contact to start”.

---

## 3. Object

New table `tickets`. Workspace-scoped. Not a custom object. Not a Thread rename.

| Field | Notes |
|---|---|
| `number` | Human, workspace-unique, zero-padded (`EVO-000041`) |
| `subject` | Required |
| `status` | `new` → `waiting_on_contact` → `waiting_on_us` → `closed` (HubSpot Support Pipeline) |
| `priority` | `low` / `medium` / `high` |
| `owner_id` | User, nullable = unassigned queue |
| `contact_id` | **Required** |
| `company_id` | Optional, from contact |
| `deal_id` | Optional — post-sale on a won (or open) deal |
| `thread_id` | Optional Desk `threads.id` |
| `channel` | `whatsapp_cloud` / `email` / `manual` |
| `first_response_at` | Set on first outbound after open |
| `resolved_at` | Set when status becomes `closed` |
| `sla_due_at` | v1: +8h `Africa/Algiers` for high, +24h otherwise, skip 21:00–08:00 quiet hours |
| `last_activity_at` | Thread last message or ticket update |

Activity types already exist. Add `ticket_opened` / `ticket_status` on the contact timeline (same `activities` table, `meta.ticket_id`).

Permissions: `desk.manage` covers mutate; all CRM seats can view (`crm.edit` already gates `/crm/*`). No new role.

Workflow hook later: `ticket.created`, `ticket.status_changed`, `ticket.sla_breached`. **Out of P1–P5.**

---

## 4. Information architecture

| Route | Shell | Notes |
|---|---|---|
| `GET /crm/tickets` | `CrmListShell` | Saved views: All open, Assigned to me, Unassigned, Closed |
| `GET /crm/tickets/board` | Same kanban as deals | PipelineKanban, list/board toggle |
| `GET /crm/tickets/{ticket}` | `RecordShell` 3-pane | Left properties, center thread + Path, right Ask Evo |
| `POST /crm/tickets` | Drawer | Subject, contact, optional deal, optional thread |
| Desk thread action | Existing `/inbox` | **Open ticket** — prefilled from contact + thread |
| Contact / deal show | Related list | Salesforce Cases card |

Nav: **Tickets** under CRM More (next to Leads). Desk keeps `/inbox`. Do not add a second Help Desk app in the pin rail.

---

## 5. Surfaces (Mobbin)

### 5.1 Board — HubSpot Help Desk

Match [f9b9fcf1](https://mobbin.com/screens/f9b9fcf1-0767-4ee5-adad-12003a31331e):

- Columns = ticket statuses (not deal stages)
- Card: subject, company, owner, inactivity line, High/Low
- Views: All open / Assigned to me — **not** My Team’s Unassigned / Mentions / Spam
- Board options reuse deal board options (compact, inactive after N days)

### 5.2 List — HubSpot table + Salesforce rows

Match [d99d4a6b](https://mobbin.com/screens/d99d4a6b-9634-4cd3-8ae1-39e337ebd2ea) + [bf33c8f7](https://mobbin.com/screens/bf33c8f7-e5a0-48d5-9665-d7d8a8e26509):

- Columns: number, subject, status, priority, channel, contact, company, owner, created, SLA
- Filter chips: owner, priority, status, channel, unanswered (no last inbound reply)
- Create ticket CTA (orange)

### 5.3 Record — Path + Desk thread + Ask Evo

- Path steps = the four statuses. **Mark Status as Complete** advances one step. Closed is terminal.
- Center pane is the **Desk thread**, not an empty “no conversations” illustration. If `thread_id` is null, CTA: Open WhatsApp / Attach thread.
- Right: Ask Evo + associations (contact, deal, quote if any).
- Composer is the existing Desk composer (WhatsApp Cloud). Do not add a third comment box.

### 5.4 Desk — ticket is born here

From `/inbox` thread header: **Open ticket**. Creates `tickets` row, links `thread_id`, subject from last inbound snippet.

Inbound on a **closed** ticket with the same thread: reopen to `waiting_on_us` (do not spawn a duplicate).

### 5.5 Contact related

Salesforce Cases card ([a6d82c16](https://mobbin.com/screens/a6d82c16-51a1-4ad7-ba34-f4ebdd3f3aed)): open count, number, subject, priority. HubSpot contact Tickets related ([16a4c1d3](https://mobbin.com/screens/16a4c1d3-33e4-4f0b-9e93-aa2c470abf22)) for placement.

---

## 6. Visual system

Same as EvoCRM:

- White / black / `#EC6025`
- Geist 13px, tabular nums
- No HubSpot teal, no Salesforce **Buy Now** blue
- No trial banners, no Copilot chip

---

## 7. Implementation PRs (ordered)

Each PR independently reviewable. Mobbin URL in the PR body. Pest on the route.

| PR | Title | Depends | Acceptance |
|---|---|---|---|
| **P0** | `docs: EvoTickets Mobbin contract + plan` | [#141](https://github.com/Mohamedbeghanem/EvoSales/pull/141) | This file + contract. No product code. |
| **P1** | `feat(tickets): model, number, permissions` | [#142](https://github.com/Mohamedbeghanem/EvoSales/pull/142) | Factory, unique `number`, contact required |
| **P2** | `feat(tickets): list + board chrome` | [#143](https://github.com/Mohamedbeghanem/EvoSales/pull/143) | CrmListShell + PipelineKanban vs [f9b9fcf1](https://mobbin.com/screens/f9b9fcf1-0767-4ee5-adad-12003a31331e) / [d99d4a6b](https://mobbin.com/screens/d99d4a6b-9634-4cd3-8ae1-39e337ebd2ea) |
| **P3** | `feat(tickets): record Path + thread pane` | [#144](https://github.com/Mohamedbeghanem/EvoSales/pull/144) | 3-pane; no empty-conversation product |
| **P4** | `feat(desk): Open ticket from thread` | P3 | Inbox CTA; reopen on inbound if closed |
| **P5** | `feat(records): Tickets related list` | P3 | Contact + deal cards |
| **P6** | `feat(tickets): SLA + inactivity` | P2 | 8h/24h Algiers; board inactivity line |
| **P7** | `test: EvoTickets Mobbin QA Pest` | P1–P6 | Checklist green |

Do not start P2 until P1 refuses a ticket without `contact_id`.

---

## 8. QA checklist (screenshot against Mobbin)

1. Board columns New / Waiting on contact / Waiting on us / Closed — vs [f9b9fcf1](https://mobbin.com/screens/f9b9fcf1-0767-4ee5-adad-12003a31331e)
2. List: views + chips + Create — vs [d99d4a6b](https://mobbin.com/screens/d99d4a6b-9634-4cd3-8ae1-39e337ebd2ea)
3. Record: Path + live thread — vs [8967ff1d](https://mobbin.com/screens/8967ff1d-c744-4825-9f99-7449632e4b6d) (layout) **without** the empty state
4. Desk Open ticket — vs HubSpot inbox [56cf36dd](https://mobbin.com/screens/56cf36dd-2345-49d2-8284-df2965a29945)
5. Contact Cases card — vs [a6d82c16](https://mobbin.com/screens/a6d82c16-51a1-4ad7-ba34-f4ebdd3f3aed)
6. No Copilot, no Slack, no Unknown Contact, no second `/leads`-style duplicate inbox

---

## 9. Out of this plan (“etc”)

| Item | Verdict |
|---|---|
| Public meeting scheduler | **Still the next sales feature.** Do not block it on tickets. Parallel train is fine. |
| Knowledge base / articles | Deferred. WhatsApp canned replies + playbooks already exist. |
| CSAT / surveys | Deferred. |
| Round-robin / teams | Deferred. Owner + unassigned is enough at 5–20 seats. |
| Custom objects | Still no. |
| Visual workflow canvas | Still no. Form workflows can grow `ticket.*` triggers after P5. |
| SMS | Still on-demand. |

---

## 10. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Second inbox (`/crm/tickets` vs `/inbox`) | High | Ticket record **embeds** the thread; Desk stays canonical |
| Tickets with no contact (HubSpot unknown visitor) | High | DB constraint + Pest |
| SLA clocks in UTC | Med | All due times `Africa/Algiers` |
| Duplicate tickets per thread | Med | One open ticket per `thread_id`; inbound reopens closed |
| Scope creep into Service Hub | High | PRs above; reject knowledge/CSAT/teams in review |

---

## 11. Open questions

1. **Default view:** All open board (HubSpot) or Recently Viewed list (Salesforce)? **Proposal: board**, list is one toggle away.
2. **Auto-open on inbound after a won deal?** **Proposal: no in v1.** Manual Open ticket. Auto-open is a workflow later.
3. **Product string:** **Tickets** in the UI. EvoTickets is the docs name only (same pattern as EvoCRM).
