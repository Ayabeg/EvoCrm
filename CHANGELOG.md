# Changelog

## Gap #1 — Saved views + advanced filters + column chooser (2026-08-24)

### Added
- Extended `saved_filters` with `columns`, `sort`, and `is_default` for reusable list views
- `ListViewConfig` registry for contact/deal/company column and filter field definitions
- `SavedFilterPolicy` and `SavedFilterResource` for authorization and API shape
- Filter builder with AND/OR groups persisted inside saved view filters
- Column chooser sheet (show/hide + reorder) on Contacts, Deals, and Companies lists
- Per-view record count badges on saved view tabs
- `CrmFilter::apply()` / `applyFilterGroups()` / `applySort()` for generic list filtering

### HubSpot comparison
HubSpot list views support nested filter groups, column layouts, and view sharing across teams. This ships the 80% version: workspace-scoped saved views owned by the creator, flat field operators (equals / is true / is false), and column customization without cross-user default views or calculated columns. Enough for a single-digit sales team to save “Unanswered Alger” or “My open deals” layouts without HubSpot’s enterprise view permissions.

## Gap #2 — Deal kanban + pipelines + forecasting (2026-08-24)

### Added
- `PipelineManager` service centralizing pipeline resolution, board payload, and forecast math
- `PipelinePolicy` and `PipelineResource` for authorization and API shape
- Settings page at `/settings/pipelines` to create pipelines and set the workspace default
- Pipeline switcher on **both** Deals list hub and kanban board (`?pipeline=` query param)
- Shared `DealForecastBar` showing deal count, total, weighted forecast, and open pipeline value
- List view scoped to the active pipeline (stage pills and deals filtered per pipeline)

### Already existed (polished)
- Kanban board with HTML5 drag-drop and `/crm/deals/{deal}/move`
- Per-column totals + weighted amounts using `DealBoardForecast` stage probabilities
- List/Board toggle via `DealLayoutToggle`

### HubSpot comparison
HubSpot Sales Hub supports unlimited custom pipelines, drag-and-drop stage editing, deal splits, and AI forecasting. This ships multi-pipeline **list + board views**, stage-probability weighted totals, and admin-created pipelines cloned from the Evotechly default stage template — enough for a small team running separate motions (e.g. Sales vs Enterprise) without HubSpot's visual pipeline designer or revenue intelligence tier.

## Gap #3 — Configurable 3-column record page (2026-08-24)

### Added
- `RecordLayoutProvider`, card registry, and customize panel on contact/company/deal hubs
- Left/main/side column cards with drag-reorder persisted in localStorage

### HubSpot comparison
HubSpot record pages support team-shared layouts, conditional cards, and association limits. This ships per-user card visibility/reorder on the existing 3-column hub shell without a server-side layout admin.

## Gap #4 — Workflow engine v1 (2026-08-24)

### Exists on main + added
- Rule-based workflows: triggers (contact/deal created, deal stage changed), actions (task, sequence enroll, webhook), if/else branches
- `PUT /crm/workflows/{workflow}` for updating existing rules

### HubSpot comparison
HubSpot Operations Hub adds visual canvas, 100+ actions, and delay branches. This ships structured form workflows dispatched from model observers — enough for internal automation without a drag-drop builder.

## Gap #5 — Custom properties admin (2026-08-24)

### Exists on main
- `/settings/attributes` CRUD for contact/deal/company fields (text/number/date/list), groups, required flags, fill rates
- Values on record hubs via `RecordProperties`

### HubSpot comparison
HubSpot adds conditional logic and calculated properties. EvoSales ships jsonb-backed custom attributes with admin UI — sufficient for a small team without fill-rate analytics or dependency rules.

## Gap #6 — Sequences + enrollments + cron (2026-08-24)

### Exists on main + wired
- Outbound sequences with steps, enrollments, `outbound:run` every minute
- Saved-filter bulk enroll now uses `CrmFilter::apply()` (respects filter groups from Gap #1)

### HubSpot comparison
HubSpot Sequences include A/B tests and meeting links. EvoSales ships templated merge-field cadences with quiet hours and suppression — the 80% outbound motion for a single-digit team.

## Gap #7 — Multi-dashboard reporting (2026-08-24)

### Exists on main
- Saved dashboards with EvoViz widget catalog, owner/date filters, report rooms
- `/reports` board + dashboard CRUD

### HubSpot comparison
HubSpot custom reports support SQL and cross-object joins. EvoSales reuses pre-built EvoViz rooms plus saved widget boards — monitoring without ad hoc report builder.

## Gap #8 — Omni-channel inbox (2026-08-24)

### Exists on main
- `/inbox` with Chatwoot embed + native desk fallback, thread reply, official connectors

### HubSpot comparison
HubSpot Conversations unifies chat, SMS, and team inbox routing. EvoSales ships email/desk-first with WhatsApp Cloud connectors — chat channels flagged for a separate integration pass.

## Gap #9 — Dynamic segments (2026-08-24)

### Added
- Segment manager with live preview API (`POST /crm/segments/preview`)
- Segment counts use `CrmFilter::fromSaved()` for parity with list views

### HubSpot comparison
HubSpot lists support OR logic, behavior filters, and ad audiences. EvoSales segments reuse saved filters with debounced live preview — enough for sequence enroll and export audiences internally.

## Gap #10 — AI layer (2026-08-24)

### Exists on main + wired
- Deal health heuristic (stage probability + activity recency + amount)
- Ask Evo panel with template summaries; custom attribute values included in AI facts

### HubSpot comparison
HubSpot Breeze adds LLM scoring and generative email. EvoSales ships heuristic deal health and field-aware Ask Evo stubs — RAG over full activity history deferred until EVOSTACK AI platform is defined.

