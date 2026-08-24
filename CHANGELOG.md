# Changelog

<<<<<<< HEAD
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
=======
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
>>>>>>> origin/cursor/pipelines-kanban-forecast-91cb
