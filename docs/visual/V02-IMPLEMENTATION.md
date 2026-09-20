# V02 — Dashboard operating home implementation

**Status:** First production visual pass of Home / Dashboard.  
**Base:** `bb50aa7dc803e3f209287fe99b99e1ba9ad627ea` (V01 #247 merge).  
**Taste:** `design-taste-frontend` used as product-design reasoning only. Dials 4 / 3 / 7.  
**Aurora:** preserved. No new component library. Official Aurora Sidebar / DataTable not installed.

P00–P29 behavior is unchanged. P17 payload, P12 attention, P15 today/work, and P11 pipeline stage truth are unchanged. V00 Visual Law and V01 shell are unchanged.

---

## Taste diagnosis

**Reading this as:** authenticated CRM operating home for all-day sellers, with Apple restraint + Linear speed + Shopify snapshot clarity + HubSpot queue usability, leaning toward Aurora/`ds` + Geist + EvoCRM paper/orange.

Baseline Home was a generic SaaS dashboard: title + orange Create + 2×2 widget gallery, KPI rail in the middle, Pipeline and Recent sharing equal card weight. Eye landed on chrome and cards, not on the first exception.

V02 composition (one, recorded before paint — see `V02-BASELINE.md`):

```text
[ Home 28/34/650 · workspace · date 12     ] [ New deal secondary ]
[ Activation band — hairline, only if visible                    ]
[ NEEDS ATTENTION queue          |  TODAY queue                 ]
[ BUSINESS SNAPSHOT — 4 numbers, hairlines, no cards            ]
[ PIPELINE overview — full width, stage rows                    ]
[ RECENT ACTIVITY — full width, secondary hairline feed         ]
```

Not: page title → 4 KPI cards → chart → more cards.

---

## Baseline vs final composition

| Zone | Baseline | V02 |
|---|---|---|
| Page context | `text-page-title` + orange `New deal` | Page 28/34/650 + mute 12px context + secondary `New deal` |
| Attention + Today | Equal boxed widgets, 13/11 helper copy | Unboxed sibling queues, 18 section / 15 row, no helper headings |
| KPI | Hairline strip, values shout to 28 at `lg` | Same 2×2 / 4-up truth, values locked at 20/26 |
| Pipeline | Half of a 2×2 with Recent | Full-width stage rows, ink bars, no orange stages |
| Recent | Equal card | Full-width secondary feed after Pipeline |
| Actions | Dual orange Creates + orange View all | Global Create stays primary; page Create demoted; View all mute |
| Surfaces | White widget + 1px shadow | Transparent `.home-widget`, `box-shadow: none` |

---

## Visual decisions

- Hierarchy by position and type, not color. Attention is first because it is first, not because it is red/orange.
- Continuous canvas. Sections are headings + lists, not a card gallery.
- KPI is a snapshot strip, not a hero metric row.
- Pipeline is a commercial overview (name · count · amount · ink bar). No decorative chart.
- Recent is a feed. No avatars, no timeline graphics, no card-per-event.
- Orange reserved for V01 global Create, focus rings, and truthful activation progress. Page `New deal` is secondary.
- Floor 12px. No 10/11 Dashboard copy.
- No invented trends, forecasts, health scores, or AI copy.

---

## Components touched

- `resources/js/pages/home.tsx`
- `resources/js/components/dashboard/dashboard-header.tsx`
- `resources/js/components/dashboard/home-widget.tsx`
- `resources/js/components/dashboard/home-kpi-strip.tsx`
- `resources/js/components/dashboard/dashboard-attention.tsx`
- `resources/js/components/dashboard/dashboard-work.tsx`
- `resources/js/components/dashboard/dashboard-pipeline.tsx`
- `resources/js/components/dashboard/dashboard-recent.tsx`
- `resources/js/components/dashboard/dashboard-section.tsx`
- `resources/js/components/dashboard/activation-checklist.tsx`
- `resources/js/lib/dashboard-operating-home.ts`
- `resources/css/app.css` (`.home-widget` shadow debt)

Not touched: V01 shell, Command OS, Contacts/Deals/Inbox/Settings page contents, Pipeline Board, QRD, backend builders.

---

## Shared primitives touched

| Primitive | V02 treatment |
|---|---|
| `.home-widget` | Transparent, no border, no shadow. Class retained for Wave0 lock |
| Home KPI value | 20/26 semibold. CRM `evo-kpi-card` still Brand Book `text-kpi` |
| Page header geometry | 32 / 24 (`md:px-8`, `pb-6`) on Home, matching V01 PageHeader |
| Queue hover | Subtle `#F1F1EF` wash, radius 10, P27 120ms color |

---

## Functional preservation

- Attention items still open QRD (`openRecord`) and keep deal hrefs.
- Today counts still link overdue / today / upcoming. No complete-from-Home.
- KPI keys, formats, hrefs, and optional truthful `change` (vs last month when previous > 0) unchanged.
- Pipeline stage hrefs / amounts / counts unchanged.
- Recent still uses RecordLink / view-all. Empty still offers Create contact when `crm.edit`.
- `/crm/deals?create=1` preserved on page Create.
- Activation checklist payload and dismiss unchanged.
- Frozen a11y names (`Needs attention`, `Today`, `Sales snapshot`) preserved.

---

## Impeccable findings

Recorded after first populated 1440 review. See later sections in this file once the review pass lands.

### /clarify

Pending first populated 1440 capture.

### /distill

Pending first populated 1440 capture.

### /polish

Pending first populated 1440 capture.

---

## Anti-slop results

Pending stop-slop gate after Impeccable.

---

## Responsive results

Pending 1280 / 1024 / 768 after final 1440.

---

## Accessibility preservation

P26 names, QRD openers, focus rings (`ring-brand`), and keyboard targets preserved. No frozen label renames.

---

## Motion preservation

P27 hover class on queue/KPI/stage rows (~120ms). No Home entrance spectacle. Reduced-motion still kills decorative transition.

---

## Deferrals

- V03–V15 page redesigns
- Pipeline Board furniture (V07)
- QRD / list density
- Unused `activity-feed.tsx` 11px (not mounted on Home)
- Repo-wide Lucide / official Aurora Sidebar / DataTable
- Dark cabinet
