# EvoCRM Mobbin contract

**P0** of the EvoCRM build. Engineers implement against these screens, not against memory.

| | |
|---|---|
| **Audited** | 2026-09-08 |
| **Platform** | Mobbin web |
| **Apps** | HubSpot, Salesforce |
| **Repo SHA at freeze** | `9dcde6e5` (`main`) |
| **Scope** | Linked screens + what to copy / not copy. No new product claims. |

EvoCRM is the CRM surface of EvoSales (CRM + Desk + Outbound + Ads). This file does not change routes, objects, or brand tokens.

Related: [hubspot-side-by-side.md](./hubspot-side-by-side.md) · [OBJECT_MODEL.md](./OBJECT_MODEL.md) · [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## How to use

1. Open the Mobbin URL for the surface you are shipping.
2. Match layout zones, controls, and empty states visible in the screenshot.
3. Do not invent chrome that is not on the cited screen.
4. Evotechly tokens stay white / black / `#EC6025`. Do not copy HubSpot teal or Salesforce blue.
5. Copy names: **Ask Evo**, not Breeze or Copilot.

QA later PRs against [§9](#9-qa-checklist).

---

## 1. HubSpot — chrome source of truth

| EvoCRM surface | Copy from the screen | Mobbin |
|---|---|---|
| Sales home | Guided actions left, activity feed right, trophy empty when caught up | [1f571c85](https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748) |
| Sales workspace | Summary / Leads / Deals / Tasks / Schedule tabs | [87dcd39f](https://mobbin.com/screens/87dcd39f-a9aa-461e-9fb6-5aec87d0e017) |
| Deals list | Saved views, filter chips, list/board toggle, Create deal, amount column, pagination | [9e67fda1](https://mobbin.com/screens/9e67fda1-7a17-4149-91cf-6097a5c22e2d) |
| Deals workspace | Preset views (Open / Stalled / No activity), stage bar, health score, next meeting | [d947de05](https://mobbin.com/screens/d947de05-912e-49f9-8db7-c846ac7e50ee) |
| Deals board | Stage columns, card (name, company, amount, close date), inactivity line, High/Low, column Total + Weighted | [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1) |
| Deals board (closed) | Closed Won / Closed Lost columns | [b1e0be46](https://mobbin.com/screens/b1e0be46-49a1-44ba-a06e-abe62d9bdebe) |
| Board editor | Compact vs Default cards, priority + associations, inactive after N days | [d9777088](https://mobbin.com/screens/d9777088-2fcd-4363-9f4a-eec9f1282860) |
| Contacts list | Saved views, filters, Create contact | [70e7b2e2](https://mobbin.com/screens/70e7b2e2-e7ca-4ee4-9fd8-bb7d881a8d27) |
| Contact record | 3-pane: identity + properties \| Overview / Activities / Intelligence \| AI rail + associations. Quick actions: Note, Email, Call, Task, Meet | [f215a882](https://mobbin.com/screens/f215a882-8c79-4bf8-8483-4d8ae465c3c1) |
| Contact activities | Type chips, upcoming vs month groups | [f93e89bd](https://mobbin.com/screens/f93e89bd-1b63-4d1d-92d6-9753e9f4c8ba) |
| Log call | Outcome, direction, datetime, comment, associations | [344a79cd](https://mobbin.com/screens/344a79cd-4663-471c-b710-dd920abd0718) |
| AI rail shape | Persistent right summary, collapse chevron, Ask a question | [7783b0d6](https://mobbin.com/screens/7783b0d6-ca17-40ef-89ea-bc8752e3a6fb) |
| Sequences list | Manage / Analyze / Automate / Scheduled, enrolled / reply / meeting columns | [d0f633b6](https://mobbin.com/screens/d0f633b6-cdf7-4c10-ba54-3a80a9df20f5) |
| Sequence create | Template vs scratch vs dynamic | [e417eb18](https://mobbin.com/screens/e417eb18-bbd1-472c-893a-6489696e54c7) |
| Sequence steps | Vertical steps, delay, A/B, step actions | [0a34649c](https://mobbin.com/screens/0a34649c-a49d-475b-9a2a-9da4128bc112) |

---

## 2. Salesforce — lead / opportunity source of truth

| EvoCRM surface | Copy from the screen | Mobbin |
|---|---|---|
| Lead record | Path (New → Contacted → Nurturing → Unqualified → Converted), Convert / Change Owner / Edit, Mark Status as Complete | [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6) |
| Contact record | About + Get in Touch with inline pencils, related Opportunities / Files, activity composer icons | [d61b0a8f](https://mobbin.com/screens/d61b0a8f-84b6-4c8f-b9a8-a3d2186b0e78) |
| Activity composer | Email / Call / Task / Event icon row, type filters, Upcoming & Overdue | [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6) · [45c8db2b](https://mobbin.com/screens/45c8db2b-5cd1-4b82-8df9-5cfd9135acef) |
| Task record | Details + Related, Complete, follow-up (v1 may stay on-timeline) | [5384fae6](https://mobbin.com/screens/5384fae6-9728-4b29-a40f-cb05445ac07c) |
| Leads list | Recently Viewed picker, numbered rows, bulk New / Import / Send Email / Change Owner | [f7b32108](https://mobbin.com/screens/f7b32108-1960-4bc8-8509-c53f92e72ebb) |
| Contacts list | Team list views, filter panel | [5c41cc89](https://mobbin.com/screens/5c41cc89-1e24-4ccb-9318-43eac73e3ad4) |

---

## 3. Anti-patterns (do not copy)

| Screen | Do not ship | Mobbin |
|---|---|---|
| Salesforce home | Widget soup, AI promo cards, trial Buy Now bar | [7dac13de](https://mobbin.com/screens/7dac13de-4760-4219-9f58-dabea6659236) |
| Salesforce lead | Slack Channel on the record | [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6) |
| HubSpot datasets | CMS / dataset explorer | [1b68fa46](https://mobbin.com/screens/1b68fa46-fe8c-41ba-a4cf-06d9de230388) |
| HubSpot sequence create | LinkedIn Connect step | [e417eb18](https://mobbin.com/screens/e417eb18-bbd1-472c-893a-6489696e54c7) |
| Either product | Names Breeze, Copilot, Einstein; Salesforce blue; HubSpot teal as brand | — |

Replacements already in this product:

- Slack rail → Desk thread + WhatsApp Cloud
- LinkedIn sequence step → official WhatsApp template step
- Salesforce widget home → HubSpot guided home ([1f571c85](https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748))

---

## 4. Split of responsibility

| Source | Owns |
|---|---|
| HubSpot screens in §1 | Daily chrome: home, lists, board, 3-pane record, sequence editor |
| Salesforce screens in §2 | Lead Path, Convert, inline field edit, activity composer |
| EvoSales (this repo) | DZD, wilaya, Africa/Algiers, owned SMTP + warmup, Evolution WhatsApp, Meta ads funnel, `#EC6025` |

P0 does not add tickets, custom objects, CMS, Flow canvas, SAML, or e-sign.

---

## 5. Later PRs (index only)

Implementation PRs cite the Mobbin URL in the PR body. Do not start them in this commit.

| PR | Surface | Primary Mobbin |
|---|---|---|
| P1 | Guided home | [1f571c85](https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748) |
| P2 | List chrome | [9e67fda1](https://mobbin.com/screens/9e67fda1-7a17-4149-91cf-6097a5c22e2d) |
| P3 | Board cards + options | [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1) · [d9777088](https://mobbin.com/screens/d9777088-2fcd-4363-9f4a-eec9f1282860) |
| P4 | Lead Path + Convert | [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6) |
| P5 | 3-pane + Ask Evo rail | [f215a882](https://mobbin.com/screens/f215a882-8c79-4bf8-8483-4d8ae465c3c1) · [7783b0d6](https://mobbin.com/screens/7783b0d6-ca17-40ef-89ea-bc8752e3a6fb) |
| P6 | Activity composer + log call | [344a79cd](https://mobbin.com/screens/344a79cd-4663-471c-b710-dd920abd0718) · [45c8db2b](https://mobbin.com/screens/45c8db2b-5cd1-4b82-8df9-5cfd9135acef) |
| P7 | Sequence step editor | [0a34649c](https://mobbin.com/screens/0a34649c-a49d-475b-9a2a-9da4128bc112) |
| P8 | Deal health + next-step columns | [d947de05](https://mobbin.com/screens/d947de05-912e-49f9-8db7-c846ac7e50ee) |
| P9 | Retire duplicate `/leads` IA | — |
| P10 | Screenshot QA vs this file | §9 |

---

## 9. QA checklist

Used by P10. Each item is a screenshot diff against the cited Mobbin screen.

1. Home: guided left + feed right — [1f571c85](https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748)
2. Deals list: views + chips + Create deal — [9e67fda1](https://mobbin.com/screens/9e67fda1-7a17-4149-91cf-6097a5c22e2d)
3. Deals board: inactivity + weighted footer — [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1)
4. Contact show: 3-pane + Ask Evo — [f215a882](https://mobbin.com/screens/f215a882-8c79-4bf8-8483-4d8ae465c3c1)
5. Lead show: Path + Convert — [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6)
6. Sequence editor: vertical steps — [0a34649c](https://mobbin.com/screens/0a34649c-a49d-475b-9a2a-9da4128bc112)
7. No Salesforce blue, no Breeze/Copilot copy, no Slack rail, no second `/leads` product
