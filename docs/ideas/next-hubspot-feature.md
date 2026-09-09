# Next HubSpot feature: public meeting scheduler

**Decision date:** 2026-08-29  
**Shipped:** 2026-09-09 (`feat/meeting-scheduler`) — public `/book/{slug}`, Settings → Meetings, Google busy + event write, `meeting.booked` workflow.  
**Prior audit:** [`docs/hubspot-parity-comparison.md`](../hubspot-parity-comparison.md) (~85 composite, 2026-08-25)  
**Buyer:** 5–20 seat Algeria-first sales team, not HubSpot Enterprise feature-count parity

---

## Problem statement

How might we close the one HubSpot-shaped hole that an EvoSales seller still hits after they already have contacts, deals, quotes, sequences, and WhatsApp — without cloning Service Hub, Marketing Hub, or Breeze?

---

## How EvoSales compares to HubSpot CRM (2026)

HubSpot's 2026 stack is **Smart CRM + Sales Hub + Service Hub + Marketing Hub + Revenue Hub + Breeze**. EvoSales is a **sales OS**: CRM + owned outbound + Meta ads + WhatsApp desk. The right comparison is **HubSpot Sales Hub Professional**, not the whole suite.

| HubSpot surface | What HubSpot ships (2026) | What EvoSales already ships | Verdict |
|-----------------|---------------------------|-----------------------------|---------|
| **Objects** | Contacts, companies, deals, tickets, custom objects | Contacts, companies, **first-class leads**, deals | Match on sales objects. Tickets / custom objects are a Service/Enterprise play — **do not add yet** |
| **Lists & views** | Saved views, AND/OR filters, calculated columns, bulk | Chrome lists, FilterBuilder, column chooser, calc columns, bulk, CSV import/merge | **Match** |
| **Pipeline** | Multi-pipeline, required-property gating, AI deal progression | Multi-pipeline list + board, weighted forecast, deterministic deal health | **Partial** — missing stage-required fields and forecast backtest |
| **Record** | 3-column, playbooks, Breeze on-record | 3-column chrome, playbooks, Ask Evo, line items, quotes, splits | **Match** for a 5–20 seat team |
| **Sequences** | Email + task + LinkedIn, reply pause, A/B | Email + WhatsApp + call/meeting steps, warmup, bounce suppress, owned SMTP | **Ahead** for DZ / owned mail |
| **Workflows** | Visual canvas, 100+ actions | 7 triggers, 8 actions, delays, if/else, form UI | **Partial** — enough to run the sales loop; canvas is polish |
| **Inbox** | Email, live chat, SMS, WhatsApp app, SLA, bots | EvoDesk embed + native WA/email | **Partial** — WhatsApp is stronger; SMS/live-chat widget are the wrong clone |
| **Meetings** | Public booking links on every Sales seat | Meeting is only an **activity type**. Calendar syncs *inbound*. No public book page | **Gap — this is the feature** |
| **Calling** | Click-to-call, recording, conversation intelligence | Call activity + Desk composer stub | Gap, but Algeria is WhatsApp-first |
| **Quotes / money** | Commerce Hub: e-sign, payments, subscriptions | Snapshot quote, PDF, email, public accept | **Partial** — accept is a button, not money or a legal signature |
| **Marketing** | Forms, CMS, SEO, ads, attribution | Meta Ads hub, lead webhooks, outbound campaigns, segment → Custom Audience | **Ahead** on Meta+WA; **deferred** on CMS/forms/SEO |
| **Reporting** | Explorer, dashboards, attribution, scheduled send | Category rooms, EvoViz, saved reports, scheduled HTML | **Match** for this buyer |
| **AI** | Breeze Copilot, agents, Smart Deal Progression, enrichment | Ask Evo (keyword RAG + optional LLM), deal health heuristic | **Partial** — do not fake agents |
| **Admin** | Teams, fine RBAC, SAML, marketplace | Owner/admin/member, permission matrix, audit, Google login | **Partial** — SAML/marketplace stay deferred |
| **Regional** | Generic i18n | Wilaya, DZD, Africa/Algiers, AR/FR | **Ahead** |

**Composite read:** EvoSales is a credible Sales Hub for the ICP (~85). The remaining HubSpot suite (tickets, CMS, marketplace, Breeze agents, e-sign/pay) is either deferred on purpose or a different product.

**Moats to protect, not dilute:** owned SMTP/IMAP + warmup, WhatsApp Cloud, Meta ads funnel, wilaya/DZD, self-host / no per-seat tax.

---

## What not to add (clone traps)

These are real HubSpot features. Adding them now would slow the sales OS without winning the Algeria buyer.

| Tempting clone | Why not now |
|----------------|-------------|
| **Tickets / Service Hub** | After-sale work in this market lives in WhatsApp, not a ticket queue. Empty Service Hub would sit unused. |
| **Custom objects** | Enterprise modeling. The sales loop is already Contact → Lead → Deal → Quote. |
| **Visual workflow canvas** | Form UI already runs the 7×8 automation set. Canvas is UX, not capability. |
| **Breeze agents / vector RAG** | Ask Evo is honest. Fake "Closing Agent" claims would be a product lie. |
| **CMS / landing pages / SEO** | Marketing Hub. Meta lead forms + outbound already cover inbound for this ICP. |
| **App marketplace** | Integration tax. Google + Meta + Evolution cover the stack. |
| **SAML** | 5–20 seats. Google login is enough. |
| **LinkedIn sequence steps** | Not the Algeria outbound motion. WhatsApp already is. |
| **SMS** | Composer stub exists; DZ sellers use WhatsApp. Wire SMS only when a customer asks. |
| **Stripe e-sign / payments** | Quote accept exists. DZ collection is CCP / CIB / virement — a later commerce slice, not a HubSpot clone. |

---

## Recommended feature: public meeting scheduler

**Add HubSpot's most-used Sales Hub primitive that EvoSales has none of: a public booking page that writes a Meeting onto the CRM timeline and the connected Google Calendar.**

HubSpot wins free and Starter seats on three things: CRM records, email tracking, and **a `/meetings` link**. EvoSales has the first two. Sequences can already drop a "book a meeting" *task*. Nobody can actually book.

This closes the outbound loop that is otherwise already built:

```text
Lead / sequence email
    → public book link
    → Meeting activity on the Contact (and Deal if one exists)
    → busy time on the connected Google Calendar
    → confirmation via mailbox (and later WA template)
    → show / no-show
    → qualify or next step
```

### Why this, not forecast backtest or tickets

| Candidate | User-visible? | Uses existing rails? | Daily seller value | Verdict |
|-----------|---------------|----------------------|--------------------|---------|
| **Meeting scheduler** | Yes — public page + record timeline | Google Calendar sync, Meeting activity, outbound mail | High — every demo / discovery | **Build** |
| Required-property stage gating | Yes — pipeline admin | Stages, custom attributes | Medium — data quality | Next after this |
| Sales quotas / goal tracking | Yes — home + reports | Home sales performance table | Medium — managers | After gating |
| Forecast backtest | Internal metric | Deal health band | Low for sellers | Engineering quality, not a product feature |
| Tickets | Yes | None (new object) | Low for this ICP | Stay deferred |
| Native website forms | Yes | Lead ingest | Medium | After meetings, if inbound sites matter |

### Key assumptions to validate

- [ ] Algerian B2B buyers will open a booking page from WhatsApp or email (not only reply "demain 15h")
- [ ] Connected Google Calendar busy times are enough availability (no separate availability database at first)
- [ ] One link per seller covers v1; team round-robin can wait
- [ ] Timezone default `Africa/Algiers` is correct for guest + host

### MVP scope

**In**

- Per-user public page: `/book/{user-slug}` (no CRM chrome, same public-layout as `/q/{token}`)
- Host sets working hours + slot length (30 / 45 / 60) in Settings
- Slots subtract Google Calendar busy times when Calendar sync is on; otherwise show working hours only and say so
- Guest submits name, email, phone (`+213` first), optional note
- Creates or matches a Contact (`ContactIdentity::findOrCreate`), writes a `meeting` Activity, optional Deal association if `?deal=` is present
- Confirmation email through the workspace default mailbox
- Host gets an in-app activity + optional notify workflow hook (`meeting.booked`)

**Out of v1**

- Team / round-robin pools
- Zoom / Meet link generation (paste-a-link field is enough)
- Payments on booking
- WhatsApp confirmation template (v1.1 — this is the DZ moat follow-up)
- Buffer times, intake forms, reminder sequences (reuse existing sequence enroll as v1.1)

### Not doing (and why)

- **Calendly clone** — no routing, no paid tiers, no video marketplace
- **Replacing EvoDesk** — booking is CRM, conversation stays Desk
- **New calendar provider** — Google is already synced; do not add Microsoft until a customer has it

---

## After this ships

1. **Required properties on stage move** — HubSpot Professional pipeline honesty; makes the existing forecast band trustworthy.
2. **WhatsApp booking confirmation** — Evolution template on `meeting.booked`. This is the Algeria-native version of HubSpot's email confirmation.
3. **Quotas on Home** — monthly DZD target vs won, per owner. The sales-performance table is already there.

Do not start canvas, tickets, Breeze agents, marketplace, or SAML until a named customer is blocked by them.

---

## Open questions

- Should the book URL be per-user (`/book/amina`) or per-workspace with a host picker?
- Do we require Google Calendar to be connected before the page goes live, or allow "honor-system" hours?
- Does a booked meeting auto-enroll a reminder sequence, or stay a single activity until the host acts?
