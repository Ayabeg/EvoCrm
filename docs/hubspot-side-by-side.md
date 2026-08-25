# HubSpot vs EvoSales — side by side

**Audit:** 2026-08-25 · `d139f6e` / [PR #92](https://github.com/Mohamedbeghanem/EvoSales/pull/92)  
**Scores:** [hubspot-parity-comparison.md](./hubspot-parity-comparison.md) · composite **~85** (Omega ≥95 not met)  
**Visual:** [hubspot-side-by-side.html](./hubspot-side-by-side.html)

HubSpot column is **Sales Hub Professional + Service Hub + Marketing Hub** as of 2026, including Breeze and Commerce Hub quotes. EvoSales column is what ships on this branch (route + UI + tests). Verdict is for a **5–20 seat Algeria-first sales team**, not feature-count parity.

| Verdict | Meaning |
|---------|---------|
| **Match** | Equivalent for that buyer |
| **Ahead** | EvoSales is stronger for DZ / owned stack |
| **Partial** | Present, thinner than HubSpot |
| **Gap** | HubSpot has it; EvoSales does not |
| **Deferred** | Explicitly out of the gap plan |

---

## CRM core (96)

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Contacts, companies, deals | Smart CRM objects | Same, DZD amounts | Match |
| Leads | Usually a deal or custom object | First-class Lead + board | Ahead |
| Associations | Contact ↔ company ↔ deal | `CrmHub` associations + rail | Match |
| Custom properties | Property library | Workspace attributes on show pages | Match |
| Tickets | Service Hub | Empty ticket card only | Deferred |
| Custom objects | Enterprise | None | Deferred |
| CSV import | Import tool, field mapping | Preview-first contact + deal CSV | Match |
| Duplicate merge | Merge contacts | Duplicate review + transactional merge | Match |
| Lead → deal | Workflows / manual | Qualify dialog: create or link, unique `lead_id` | Match |
| Line items | Products on deals | Product or ad hoc on the deal page | Match |
| Deal splits | Sales Hub | Authorized split editor | Match |
| Quotes | Commerce Hub | Snapshot, PDF, email | Partial |
| Quote acceptance | E-sign + payments | Public `/q/{token}`, no e-sign/pay | Partial |
| Payments / subscriptions | Commerce Hub | None | Deferred |

## Lists & views (90)

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Saved views | Private / team / shared | Private / team / workspace | Match |
| AND/OR filters | Advanced filters | `FilterBuilder` on contacts, deals, companies | Match |
| Column chooser | Persisted per view | Chooser saved with the view | Match |
| Bulk actions | Assign, enroll, edit, delete | Assign, enroll, move, delete | Match |
| Calculated columns | List formulas | Custom/calculated attributes as list columns | Match |
| Association filters | Cross-object filters | Contact `deal_stage` / `has_open_deal` | Partial |
| Export | CSV | Contacts + deals; deals honor pipeline | Match |
| Multi-pipeline on list | Yes | `PipelineSwitcher` + `?pipeline=` | Match |

## Pipelines & forecast (90)

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Multiple pipelines | Yes | Yes, list and board | Match |
| Kanban | Drag between stages | `/crm/deals/board` | Match |
| Stage admin | Required properties, win/loss | CRUD, reorder, probability | Partial |
| Weighted forecast | Yes | Stage probability × amount | Match |
| Deal health | AI / Smart Deal Progression | Deterministic score, factors, next action, Low data | Partial |
| Forecast backtest | Revenue workspace | None | Gap |

## Record UX (90)

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| 3-column record | Highlights / timeline / sidebar | `record-chrome` | Match |
| Timeline | Email, calls, meetings, notes | Same + Google sync events | Match |
| On-record AI | Breeze Copilot / agents | Ask Evo on contact, deal, company | Partial |
| Engagement | Scores / intent | Contact engagement heuristic | Partial |
| Custom props on record | Yes | `RecordProperties` | Match |
| Layout editor | Card library | `/settings/record-layouts` | Partial |
| Playbooks | Professional | Settings scripts on contact/deal records | Match |
| Deal commerce on record | Quotes / products | Health, line items, quotes, splits | Match |

## Segments (88)

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Active lists | Yes | `/crm/segments` + FilterBuilder | Match |
| Enter trigger | Yes | `segment.entered` | Match |
| Exit trigger | Yes | `segment.exited` | Match |
| Ads sync | Ads / audiences | Segment → Meta Custom Audience | Match |
| Membership history | List membership log | Enter/exit stints on `/crm/segments/{id}` | Match |

## Workflows (80)

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Builder | Visual canvas | Form list | Deferred |
| Triggers | 100+ | 7 (create, stage, enroll, reply, segment in/out) | Partial |
| Actions | 100+ | 8 (task, sequence, webhook, property, owner, deal, email, notify) | Partial |
| Delays | Yes | `delay_minutes` queue | Match |
| If / else | Yes | Condition + else action | Partial |
| Quiet hours | Limited | Africa/Algiers quiet hours on outbound | Ahead |

## Sequences (93) — moat

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Email sequences | Yes, daily caps | Owned SMTP, no HubSpot send cap | Ahead |
| WhatsApp steps | Limited / App | Native Evolution / Cloud | Ahead |
| Call / meeting steps | Yes | Yes | Match |
| A/B subjects | Yes | Per-step variants | Match |
| Reply pause | Yes | Auto-pause enrollment | Match |
| Mailbox warmup | Marketplace / 3rd party | Built-in warmup planner | Ahead |
| Bounce handling | Native | Tenant bounce webhook + hard-bounce suppression | Match |
| LinkedIn steps | Yes | None | Gap |
| AI personalization | Breeze | None | Deferred |

## Desk / inbox (76)

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Shared inbox | Conversations | `/inbox` in CRM chrome | Match |
| Email threads | Yes | Native + mailbox | Match |
| WhatsApp | App / WhatsApp channel | Evolution Cloud | Ahead |
| Live chat widget | Yes | EvoDesk embed only | Deferred |
| SMS | Service Hub / Twilio | Composer stub | Gap |
| SLA / bots | Service Hub | None | Gap |

## Marketing (88) — moat on Meta

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Ads manager | Ads tool | Meta Ads center | Partial |
| Lead-form ingest | Forms + ads | Tenant Meta lead webhook | Match |
| Outbound campaigns | Marketing email | Owned campaign + sequence send | Ahead |
| Segment → audience | Yes | Custom Audience sync | Match |
| Forms / landing / CMS / SEO | Marketing Hub | None | Deferred |
| Multi-touch attribution | Yes | Ads funnel only | Partial |

## Reporting (85)

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Sales / pipeline reports | Yes | Category rooms + EvoViz | Match |
| Custom builder | Explorer / SQL-ish | Entity + metric + group_by | Partial |
| Dashboards | Yes | Multi-dashboard + widgets | Match |
| Scheduled email | Yes | Cron + real HTML, one send per window | Match |
| Bounce reporting | Yes | Distinct bounced bucket | Match |
| Attribution explorer | Yes | None | Gap |

## Settings / admin (80)

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| People & invites | Yes | `/settings/people` | Match |
| Roles | Many | Owner / admin / member | Partial |
| Permission matrix | Fine-grained | Role defaults + owner member grants, server-enforced | Partial |
| Pipeline / property admin | Yes | Dedicated settings pages | Match |
| Record layouts | Yes | Workspace default editor | Partial |
| System health | Status / ops | Eight scheduled-command freshness signals | Ahead |
| SSO / SAML | Enterprise | Fortify + Google login | Deferred |
| Audit log | Enterprise | `/settings/audit` for login, import, merge, quotes, permissions | Partial |

## Integrations (96) — moat

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Google login | Yes | Yes | Match |
| Gmail / Calendar on timeline | Native sync | Incremental sync, start/pause, 15-min jobs | Match |
| Meta Ads OAuth | Yes | Workspace credentials, not a global token | Match |
| WhatsApp | Channel / app | Evolution tenant webhook | Ahead |
| Bounce webhook | Native | `POST /webhooks/outbound/bounces/{key}` | Match |
| App marketplace | 1,000+ | None | Deferred |

## AI (72)

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| On-record assistant | Breeze Copilot | Ask Evo (keyword RAG + optional LLM) | Partial |
| Agents | Prospecting, Closing, Customer | None | Deferred |
| Smart Deal Progression | Transcript → CRM updates | Deterministic health / next action | Gap |
| Enrichment | Breeze Intelligence | None | Gap |
| Content studio | Breeze | None | Deferred |

## Regional / platform — moat

| Capability | HubSpot | EvoSales | Verdict |
|------------|---------|----------|---------|
| Algeria geography | Generic country | Wilaya + city filters and report | Ahead |
| Currency | Multi | DZD-first | Ahead |
| Reporting TZ | Account TZ | Africa/Algiers | Ahead |
| Hosting | HubSpot cloud | Self-hosted Docker on Server 1 | Ahead |
| Seat tax | $15–$150+/seat + onboarding | No HubSpot per-seat tax | Ahead |

---

## Scoreboard

| | HubSpot | EvoSales |
|--|---------|----------|
| **M1–M11 composite** | 100 (reference) | **~85** |
| **Won outright** | Canvas, Breeze agents, tickets/custom objects, Commerce e-sign/pay, SMS/live chat, marketplace, SSO | Owned mail + warmup, WhatsApp native, Meta funnel, wilaya/DZD, self-host, scheduler health |
| **Now matched** | Lists/filters/bulk, lead→deal, quotes send/accept (without pay), segment exit, Gmail/Calendar, scheduled reports, permission UI | — |
| **Still the ceiling** | Omega ≥95 needs forecast backtest, SMS, canvas, playbooks, calculated list columns, audit trail | Explicitly not cloning HubSpot Enterprise |

---

## Related

- [Parity scores and evidence](./hubspot-parity-comparison.md)
- [Lists module history](./crm-lists-side-by-side.md)
- [EvoCells scorecard](./evocells-roadmap.md)
