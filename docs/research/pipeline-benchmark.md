# Pipeline benchmark (reconstructed)

**Status:** Reconstructed 2026-09-14. Original file never existed on `main` or any searched branch.  
**Provenance:** Approved research summary + live `/crm/deals` + `/crm/deals/board` + `docs/evocrm-mobbin-contract.md` board refs.  
**Honesty:** No invented scores. Mobbin IDs below already exist in-repo.

---

## Reference pattern (behavior only)

Pipedrive + HubSpot board grammar:

- **One deal engine.** List and board are the same object, same filters, same views, same URL family.
- **Column = stage + count + total + weighted.**
- **Card = name, company/contact, amount, owner, next activity, stale when meaningful.**
- **Move = DnD + card menu + keyboard + undo + rejection recovery.**
- List ↔ board share filters, views, drawer, and query state.

Density refs already locked:

- Board cards + column totals — [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1)
- Closed won/lost columns — [b1e0be46](https://mobbin.com/screens/b1e0be46-49a1-44ba-a06e-abe62d9bdebe)
- Board editor (compact/default, inactive after N days) — [d9777088](https://mobbin.com/screens/d9777088-2fcd-4363-9f4a-eec9f1282860)
- Deals list chrome — [9e67fda1](https://mobbin.com/screens/9e67fda1-7a17-4149-91cf-6097a5c22e2d)

Do not copy HubSpot teal, Pipedrive green, or Salesforce path chrome onto the board.

---

## Current implementation (verified)

| Piece | Path | Notes |
|---|---|---|
| Deal list | `pages/crm/deals/index.tsx` | `CrmListShell` adapter + `ListViewTable` + `BulkActionBar` + `CreateDrawer` + `DealLayoutToggle` + `PipelineSwitcher` |
| Deal board | `pages/crm/deals/board.tsx` | Own header (`CrmObjectHeader`), **not** DataWorkspace `mode="board"` |
| Kanban primitive | `components/crm/pipeline-kanban.tsx` | Shared with tickets board |
| Forecast | `components/crm/deal-forecast-bar.tsx` | Stays |
| Move API | `POST /crm/deals/{id}/move` | `MoveDealTest` |
| IA redirect | `Route::redirect('/leads', '/crm/deals/board')` | Named `leads.index` |
| CRM leads list | `/crm/leads` | **Different object** — raw table, not the deal engine |
| Orphan board | `pages/leads/board.tsx` + `LeadBoardController` | **No web route**; richer next-task cards. Do not resurrect as a second engine |

### Card fields already present

`pages/crm/deals/board.tsx` `DealCard`:

- Amount via `formatDzd(deal.amount_cents)`
- Owner (`owner_name`, hidden in compact)
- `inactive_days`, `is_inactive`, `has_next_activity`
- Column `weighted_cents` rendered in kanban footer

### Missing vs approved benchmark

- Explicit **next activity** line (due date / title) on the default card — today implied by `has_next_activity` / “No activity scheduled”
- Keyboard column move
- Undo toast after a successful move
- Rejection recovery when stage-required properties fail (`StageRequiredPropertiesTest` is backend; UI recovery is incomplete)
- Shared DataWorkspace chrome between list and board (filters/views/drawer)
- Quick Record Drawer from a card (P09)

---

## Target architecture

Keep **one** deal engine:

```
/crm/deals            DataWorkspace mode=list
/crm/deals/board      DataWorkspace mode=board   (same views, filters, extraQuery, pipeline id)
/leads                stays a redirect
/crm/leads            stays the inbound lead object (later DataWorkspace, not this board)
```

`PipelineBoard` / `PipelineColumn` / `DealCard` stay domain components under `components/crm/`. DataWorkspace owns chrome and `mode`. Domain owns card fields, move POST, forecast math, stage-required property dialogs.

Tickets board (`pages/crm/tickets/board.tsx`) may keep using `PipelineKanban` as a **primitive**. It is not the deal engine.

---

## Behavior that must not change

- Stage slugs and default path (`config/evosales.php` / settings pipelines)
- `POST /crm/deals/{deal}/move` and bulk move/assign/delete
- Forecast strip data from the existing board payload
- DZD tabular money
- Permission / simple-mode hiding of Ads/Reports (unrelated but must not regress while touching the rail)

---

## Out of scope

- A second `/leads` kanban product
- n8n-style pipeline canvas
- Recoloring stages to match HubSpot
- Changing deal models or forecast formulas
