# CRM Lists — HubSpot side-by-side parity

**Module:** M2 Lists & views (contacts, companies, deals index)  
**Branch:** `cursor/crm-module-lists-side-by-side-91cb`  
**Audit baseline:** HubSpot parity comparison — Lists & views scored **85/100** with chrome dual-UI gap

## Why this module first

CRM list pages are the highest-traffic CRM surfaces and were the #1 functional gap after the chrome migration: index routes dropped `FilterBuilder`, saved-view save flow, and live column chooser wiring while legacy `hub.tsx` still had them.

## Side-by-side comparison

| Capability | HubSpot | EvoSales before | EvoSales after |
|------------|---------|-----------------|----------------|
| Unified list chrome on index routes | Tab bar + filter row + column picker on every object list | Dual UI: `hub.tsx` had full toolbar; `index.tsx` had simplified chrome only | `CrmListShell` wraps contacts, companies, deals index with shared toolbar |
| Saved view tabs (All / My / custom) | Yes, with counts | Read-only header tabs on index; full tabs only on hub | `SavedViewTabs` on all three index pages via `ListToolbar` |
| Save current view (+ visibility) | Yes | Missing on index | `+` save form posts to `/crm/filters` with filter groups + columns |
| Quick filters (owner, dates, status) | Yes | Partial on index | `ColumnFilterRow` on all index pages |
| Advanced AND/OR filters | Yes | Backend only; UI on hub | `FilterBuilder` wired on index via `ListToolbar` |
| Column chooser (show/hide/reorder) | Yes, persisted per view | Local-only on hub; index used fixed columns | Chooser drives table columns; columns included in filter apply + save |
| Stage pills (deals) | Pipeline stage chips with counts | On hub + broken props on toolbar | `stagePills` from controller; pills preserve active filters via `crmListHref` |
| Export CSV | Yes | Yes | Unchanged — export links on contacts + filter row |
| Bulk actions | Yes | Row checkboxes only | Still gap — no bulk API (unchanged) |
| Multi-pipeline switcher on list | Yes | Hub only | Still gap — index uses default pipeline (next slice) |

## Parity score (this module only)

| Metric | Before | After | Notes |
|--------|--------|-------|-------|
| **Lists & views (M2)** | ~85 (backend strong, index UI gap) | **~92** | Index parity with hub toolbar; bulk + multi-pipeline remain |
| FilterBuilder on primary routes | ❌ | ✅ | |
| Saved view save on index | Partial | ✅ | |
| Column chooser → table | ❌ | ✅ | Shell lifts column state |
| Test drift (`hub` vs `index`) | Failing assertions | ✅ | `CrmSavedViewTest`, `DealStagePillsTest`, `CrmCreateDrawerTest`, `DealBoardTest` |

## Next module-by-side

**Record pages (Contact/Deal show)** — wire Ask Evo, custom properties, and layout editor on chrome `show` pages (M4/M10 gap, score ~84→90).
