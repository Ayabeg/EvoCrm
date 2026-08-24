# Changelog

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
