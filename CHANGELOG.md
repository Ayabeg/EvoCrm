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
