# EvoTickets Mobbin contract

**P0** of the tickets slice. Engineers implement against these screens, not against memory.

| | |
|---|---|
| **Audited** | 2026-09-08 |
| **Platform** | Mobbin web |
| **Apps** | HubSpot Service Hub, Salesforce Service |
| **Repo SHA at freeze** | `17e3557` (`main`, EvoCRM P0–P10 merged) |
| **Scope** | Linked screens + what to copy / not copy. No code in this file. |

EvoTickets is the **after-sale work item** on EvoSales. It is not a second inbox. Desk (`/inbox`) stays the conversation. The ticket is status, owner, SLA, and Path on top of a WhatsApp (or email) thread.

Related: [evotickets-plan.md](./evotickets-plan.md) · [evocrm-mobbin-contract.md](./evocrm-mobbin-contract.md) · [OBJECT_MODEL.md](./OBJECT_MODEL.md)

---

## How to use

1. Open the Mobbin URL for the surface you are shipping.
2. Match layout zones, controls, and empty states visible in the screenshot.
3. Do not invent chrome that is not on the cited screen.
4. Evotechly tokens stay white / black / `#EC6025`. Do not copy HubSpot teal or Salesforce blue.
5. Copy names: **Ask Evo**, not Breeze or Copilot. Channel: **WhatsApp**, not Slack.

---

## 1. HubSpot — chrome source of truth

| EvoTickets surface | Copy from the screen | Mobbin |
|---|---|---|
| Help desk board | Support pipeline columns: New / Waiting on contact / Waiting on us / Closed. Card: subject, company, owner, inactivity, Low/High | [f9b9fcf1](https://mobbin.com/screens/f9b9fcf1-0767-4ee5-adad-12003a31331e) |
| Tickets list | Saved views (All Open), filter chips (owner, priority, status), table: channel, name, contact, company, create date | [d99d4a6b](https://mobbin.com/screens/d99d4a6b-9634-4cd3-8ae1-39e337ebd2ea) |
| Ticket record chrome | Split: ticket list rail + conversation + right properties (pipeline, status, priority, create date, summary) | [8967ff1d](https://mobbin.com/screens/8967ff1d-c744-4825-9f99-7449632e4b6d) |
| Conversation (what the empty ticket is missing) | Thread in the middle, owner picker, About this contact on the right, composer at the bottom | [30fef3ed](https://mobbin.com/screens/30fef3ed-8b0e-4ec1-b929-39d1ceb8d81e) · [56cf36dd](https://mobbin.com/screens/56cf36dd-2345-49d2-8284-df2965a29945) |
| Contact related | Tickets card on the contact record (with Deals / Companies) | [16a4c1d3](https://mobbin.com/screens/16a4c1d3-33e4-4f0b-9e93-aa2c470abf22) |

Reuse EvoCRM list/board/record chrome already on `main`. Do not invent a fourth shell.

---

## 2. Salesforce — Path / list source of truth

| EvoTickets surface | Copy from the screen | Mobbin |
|---|---|---|
| Cases list | Recently Viewed, numbered rows, Case Number, Subject, Status, opened datetime, owner, bulk New / Change Owner | [bf33c8f7](https://mobbin.com/screens/bf33c8f7-e5a0-48d5-9665-d7d8a8e26509) |
| Contact related | Cases card on the contact (number, subject, priority, opened) next to Opportunities | [a6d82c16](https://mobbin.com/screens/a6d82c16-51a1-4ad7-ba34-f4ebdd3f3aed) |
| Path on the record | Same Path chrome as leads: steps + Mark Status as Complete + Change Owner | [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6) |

---

## 3. Anti-patterns (do not copy)

| Screen | Do not ship | Mobbin |
|---|---|---|
| HubSpot ticket record | Ticket with **no conversation** and “Add Contact” / Unknown Contact | [8967ff1d](https://mobbin.com/screens/8967ff1d-c744-4825-9f99-7449632e4b6d) |
| HubSpot help desk | Service Hub trial bar, Copilot, Assigned Teams as a required filter | [f9b9fcf1](https://mobbin.com/screens/f9b9fcf1-0767-4ee5-adad-12003a31331e) |
| Salesforce record | Slack Channel rail | [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6) |
| Either product | Names Breeze, Copilot, Einstein; Salesforce blue; HubSpot teal as brand | — |
| HubSpot lists | “Use AI to create filters” lock wall | [05965ba2](https://mobbin.com/screens/05965ba2-052b-4cfc-bee5-15aad0cd83ec) |

Replacements:

- Slack rail → Desk thread + WhatsApp Cloud
- Unknown Contact → ticket **requires** a Contact (find-or-create from the thread)
- Empty conversation → opening a ticket from Desk **attaches the thread**; creating from CRM must pick a contact and optionally a thread
- Copilot → Ask Evo (cached `AiInsight`, same as records)
