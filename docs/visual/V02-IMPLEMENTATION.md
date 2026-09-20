# V02 — Dashboard operating home implementation

**Status:** Shopify × HubSpot revision. Previous flat V02 direction rejected.  
**Research:** `docs/visual/V02-REFERENCE-RESEARCH.md`  
**Base:** `bb50aa7dc803e3f209287fe99b99e1ba9ad627ea` (V01 #247 merge).  
**Taste:** `design-taste-frontend` used as product-design reasoning only, *after* Mobbin research. Dials 4 / 3 / 7.  
**Aurora:** preserved. No new component library.

P00–P29 behavior is unchanged. P17 payload, P12 attention, P15 today/work, and P11 pipeline stage truth are unchanged. V00 Visual Law and V01 shell are unchanged.

Human review gate: 1440 populated Dashboard only. No responsive finalization, no Contabo, no merge ready.

---

## Taste diagnosis (second pass)

**Reading this as:** authenticated CRM operating home for all-day sellers, Shopify Home composition + HubSpot queue IA + EvoCRM paper/orange, leaning toward Aurora/`ds` + Geist.

The rejected V02 flattened Visual Law into “no cards.” Shopify Home shows the correct reading: **3–5 contained modules** on paper, metrics as typographic columns, work inside the strongest surface.

Taste adapted the references. It did not replace them with landing-page rules, and it did not clone Shopify greetings or HubSpot guided-action tabs.

---

## Composition (1440)

```text
[ Accueil 28/34/650                    workspace · date 12     ] [ New deal secondary ]
[ ACTIVATION — compact .home-module, P23 only, secondary                              ]
[ ╔ PRIMARY OPERATING MODULE ══════════════════════════════════════════════════════╗ ]
[ ║  Needs attention                      │  Today                                 ║ ]
[ ║  WHAT / WHY / STATE                   │  18:33  subject · type · person        ║ ]
[ ╚═══════════════════════════════════════╧════════════════════════════════════════╝ ]
[ BUSINESS SNAPSHOT — one module, 4 typographic columns, 20/26                        ]
[ PIPELINE — stacked share + stage rows (count · amount · %)                          ]
[ RECENT RECORDS — event · context · timestamp                                        ]
```

Surface count: **4** always, **5** when activation is visible.  
Card-in-card: **none**. `.home-widget` remains a header+body. `.home-module` is the only box.

---

## Baseline vs this revision

| Zone | Rejected V02 | This revision |
|---|---|---|
| Surfaces | Unboxed text + hairlines on paper | White modules on `#F7F7F5`, radius 10, `#E3E3DF` |
| Attention + Today | Two queues joined by a line, Today could float | **One** operating module, internal split |
| Snapshot | Full-bleed spreadsheet cells | Typographic columns inside a module |
| Pipeline | Per-stage `h-1` loading bars | One stacked distribution + labeled rows |
| Attention severity | Reason and label shared the same tone | Overdue (critical) louder than No next action |
| Today | Subject then type · when | Time-first column from `due_at` |
| Activation | Full-bleed hairline band | Compact secondary module |

---

## Visual decisions

- Modules, not Tailwind cards. Useful containment only.
- Content column `max-w-[72rem]` + 32px pad (not the locked `max-w-6xl` string).
- KPI grammar: small mute label → 20/26 value → quiet hint. No invented arrows.
- Pipeline: largest stage may use one restrained `#E8530E` segment. Other segments ink/subtle. No rainbow.
- Orange otherwise: V01 Create + focus only. Page New deal secondary. Activation ink.
- Type floor 12. No 10/11 Dashboard copy.
- Density 7: 24px module gap, 20–24px module pad. Not gallery air.

---

## Components touched

- `resources/js/pages/home.tsx`
- `resources/js/components/dashboard/home-kpi-strip.tsx`
- `resources/js/components/dashboard/dashboard-attention.tsx`
- `resources/js/components/dashboard/dashboard-work.tsx`
- `resources/js/components/dashboard/dashboard-pipeline.tsx`
- `resources/js/components/dashboard/dashboard-recent.tsx`
- `resources/js/components/dashboard/activation-checklist.tsx`
- `resources/js/lib/dashboard-operating-home.ts` (`formatDashboardTime`, KPI track class)
- `resources/css/app.css` (`.home-module`; `.home-widget` stays transparent / no shadow)

Not touched: V01 shell, Command OS, Contacts/Deals/Inbox/Settings page contents, Pipeline Board, QRD, backend builders.

---

## Functional preservation

- Attention still opens QRD (`openRecord`) and keeps deal hrefs.
- Today counts still link overdue / today / upcoming. No complete-from-Home. No Date.now.
- KPI keys, formats, hrefs, and optional truthful `change` unchanged. Grid remains `grid-cols-2` / `lg:grid-cols-4`.
- Pipeline stage hrefs / amounts / counts unchanged. Share % is derived presentation of `amount_cents`.
- Recent still uses RecordLink / view-all.
- `/crm/deals?create=1` preserved.
- Activation payload and dismiss unchanged.
- Frozen a11y names (`Needs attention`, `Today`, `Sales snapshot`) preserved.

---

## Impeccable

See `docs/visual/V02-IMPECCABLE.md` after the 1440 populated pass.

`/distill` may not remove a module merely because it is a card. A surface that groups a real information job stays.

---

## Deferrals (human review gate)

- 1280 / 1024 / 768 finalization
- Contabo deploy
- Merge readiness
- V03
