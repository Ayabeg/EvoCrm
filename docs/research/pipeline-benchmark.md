# EvoCRM pipeline benchmark

| | |
|---|---|
| **Status** | Approved research |
| **Audited revision** | `a0b9a8571fed2a1cbe7bd98d58b47d043c4fc7b2` |
| **Companion** | [`ux-benchmark.md`](./ux-benchmark.md) Finding 7 · [`micro-ux-benchmark.md`](./micro-ux-benchmark.md) drag/keyboard/undo |
| **Reference pattern** | Pipedrive + HubSpot — **behavior and density only**. Never import paint. |
| **Authority** | EvoCRM tokens, DZD tabular money, existing move POST, forecast math. |

---

## 1. One deal engine

There is **one** deal engine. List and board are the same object.

| URL | Role |
|---|---|
| `/crm/deals` | List — `pages/crm/deals/index.tsx` |
| `/crm/deals/board` | Board — `pages/crm/deals/board.tsx` |
| `/leads` | **Redirect** → `/crm/deals/board` (`routes/web.php`, named `leads.index`) |
| `/crm/leads` | Inbound **lead object** — not this board |

Shared: filters, views, drawer, pipeline id, URL query state, Quick Record Drawer (when it exists).

`PipelineKanban` (`components/crm/pipeline-kanban.tsx`) is the board primitive. Tickets board may consume it. Tickets are not the deal engine.

---

## 2. Current implementation

| Piece | Path | Notes |
|---|---|---|
| Board page | `resources/js/pages/crm/deals/board.tsx` | Own `CrmObjectHeader`; **not** DataWorkspace `mode="board"` |
| List page | `resources/js/pages/crm/deals/index.tsx` | `CrmListShell` adapter + `ListViewTable` + domain bulk + `DealLayoutToggle` + `PipelineSwitcher` |
| Kanban primitive | `resources/js/components/crm/pipeline-kanban.tsx` | Columns, cards, footer slot |
| Forecast | `deal-forecast-bar.tsx` | Stays |
| Board options | `board-options-sheet.tsx` | Compact/default, inactive after N days |
| Move | `POST /crm/deals/{deal}/move` | `MoveDealTest` |
| Orphan | `pages/leads/board.tsx` + `LeadBoardController` | **No web route.** Do not resurrect. |

Board payload already includes `weighted_cents`, `inactive_days`, `is_inactive`, `has_next_activity`. Next-activity **line** (title / due) is incomplete. Keyboard move, undo toast, and rejection recovery are missing.

---

## 3. Stages

Default deal path (do not rename in a UX PR):

**New → Qualified → Demo → Proposal → Won → Lost**

Locked in `config/evosales.php` (weights: New 10, Qualified 25, Demo 50, Proposal 75, Won 100, Lost 0) and workspace pipeline settings. Closed columns stay on the same board.

**Mobbin:** Closed Won / Closed Lost — [b1e0be46](https://mobbin.com/screens/b1e0be46-49a1-44ba-a06e-abe62d9bdebe).

---

## 4. Column header

Each column **must** show:

| Slot | Meaning |
|---|---|
| **Stage** | Stage name (not color-only) |
| **Count** | Deals in the column |
| **Total** | Sum of amounts (DZD tabular) |
| **Weighted** | Weighted forecast (`weighted_cents`) |

**Mobbin:** Board columns + Total + Weighted — [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1).

Accent is not a stage identity system. Stage color (if any) is accompanied by the name.

---

## 5. Card field order

Default card, in this order:

1. **Name** — deal title
2. **Company / contact** — association line
3. **Amount** — DZD tabular (`formatDzd`)
4. **Owner** — name or Unassigned (may hide in compact)
5. **Next activity** — due + title, or “No activity scheduled”
6. **Stale** — when meaningful (`inactive_days` / board “inactive after N days”), labeled, not color-only
7. **Quote signal** — when the deal has an open / sent quote (do not invent a second quote object)

Compact vs Default card density is a board option ([d9777088](https://mobbin.com/screens/d9777088-2fcd-4363-9f4a-eec9f1282860)), not a second engine.

Peek / Open full record use the future Quick Record Drawer + `/crm/deals/{id}`. Click must not be drag-only.

---

## 6. Move interactions

A stage change **must** be possible all four ways:

| Method | Required |
|---|---|
| **DnD** | Existing kanban drag; drop target visible |
| **Card menu** | Move to stage… |
| **Keyboard** | Focus card; move to previous/next stage without a pointer |
| **Undo** | Toast after a **successful** move; revert via the same move POST |

Plus **rejection recovery**: when stage-required properties fail (`StageRequiredPropertiesTest`), show the recovery UI; do not fake success; do not leave the card in a lying column.

Drag-only is **rejected**.

---

## 7. List ↔ board parity

| Shared | List | Board |
|---|---|---|
| Saved views | DataWorkspace `SavedViews` | Same views, same `filter_id` / `view` |
| Filters / chips / Advanced | FilterBar + drawer | Same query |
| Pipeline switcher | `PipelineSwitcher` | Same `pipeline` extraQuery |
| Create | `CreateDrawer` / `?create=1` | Same |
| Peek drawer | future `?record=` | Same record id |
| Layout toggle | List \| Board | Same URLs: `/crm/deals` · `/crm/deals/board` |
| Bulk | assign / move stage / delete | Board may select later; do not invent a second bulk API |

Until DataWorkspace `mode="board"` owns chrome, the board’s custom header is an adapter — not a second product.

---

## 8. ADOPT / REJECT

### Adopt

- Pipedrive + HubSpot **one engine**, column money, inactivity line, weighted footer
- Board editor: compact/default, inactive after N days — [d9777088](https://mobbin.com/screens/d9777088-2fcd-4363-9f4a-eec9f1282860)
- Deals workspace presets (Open / Stalled / No activity) as **saved views**, not a second IA — [d947de05](https://mobbin.com/screens/d947de05-912e-49f9-8db7-c846ac7e50ee)
- List chrome — [9e67fda1](https://mobbin.com/screens/9e67fda1-7a17-4149-91cf-6097a5c22e2d)
- Keyboard + menu + undo (`micro-ux-benchmark.md`)

### Reject

| Reject | Why |
|---|---|
| **Separate Lead Board** | `/leads` already redirects; `pages/leads/board.tsx` is orphaned; `/crm/leads` is a different object |
| **Drag-only move** | Fails keyboard / a11y; no undo; no menu recovery |
| **Color-only stale or stage** | WCAG; label required |
| **Second deal engine** | Splits filters, views, forecast, move |
| **n8n-style pipeline canvas** | Not the deal board |
| **HubSpot teal / Pipedrive green / Salesforce path chrome on the board** | Pattern only |
| **Fake next-activity** | Only render the line when the payload has it; otherwise “No activity scheduled” |

---

## 9. Mobbin evidence (user pack)

| Screen | Copy | Mobbin |
|---|---|---|
| Deals board | Stage columns, card (name, company, amount, close date), inactivity, High/Low, column Total + Weighted | [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1) |
| Deals board (closed) | Closed Won / Closed Lost | [b1e0be46](https://mobbin.com/screens/b1e0be46-49a1-44ba-a06e-abe62d9bdebe) |
| Board editor | Compact vs Default, priority + associations, inactive after N days | [d9777088](https://mobbin.com/screens/d9777088-2fcd-4363-9f4a-eec9f1282860) |
| Deals list | Saved views, chips, list/board toggle, Create deal, amount, pagination | [9e67fda1](https://mobbin.com/screens/9e67fda1-7a17-4149-91cf-6097a5c22e2d) |
| Deals workspace | Open / Stalled / No activity, stage bar, health, next meeting | [d947de05](https://mobbin.com/screens/d947de05-912e-49f9-8db7-c846ac7e50ee) |

---

## 10. Behavior that must not change

- Stage slugs and default path
- `POST /crm/deals/{deal}/move` and bulk assign / move / delete
- Forecast strip math from the existing board payload
- DZD tabular money
- `/leads` → `/crm/deals/board` redirect
- `/crm/leads` as an inbound lead object (migrate its *list* later; do not merge it into this board)

---

## 11. Target architecture

```
/crm/deals            DataWorkspace mode=list
/crm/deals/board      DataWorkspace mode=board   (same views, filters, extraQuery, pipeline id)
/leads                stays a redirect
/crm/leads            stays the inbound lead object
```

`PipelineBoard` / `PipelineColumn` / `DealCard` stay domain components under `components/crm/`. DataWorkspace owns chrome and `mode`. Domain owns card fields, move POST, forecast, stage-required dialogs, quote signal.

Backend stays. Paint stays EvoCRM.
