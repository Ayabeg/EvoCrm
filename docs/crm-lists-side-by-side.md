# CRM Lists — HubSpot side-by-side parity

**Module:** M2 Lists & views (contacts, companies, deals index)  
**Superseded by:** the full product matrix in [hubspot-side-by-side.md](./hubspot-side-by-side.md)  
**Current M2 score:** **90** (2026-08-25 audit)

## Side-by-side

| Capability | HubSpot | EvoSales |
|------------|---------|----------|
| Unified list chrome | Tab bar + filter row + column picker | `CrmListShell` on contacts, companies, deals |
| Saved view tabs + save | Yes, with counts | `SavedViewTabs` + create form on index |
| AND/OR filters | Yes | `FilterBuilder` on primary list routes |
| Column chooser | Persisted per view | Chooser saved with the view |
| Stage pills (deals) | Pipeline chips | `stagePills` + `crmListHref` |
| Bulk actions | Yes | Assign, enroll, move, delete |
| Multi-pipeline on list | Yes | `PipelineSwitcher` + `?pipeline=` on create/views/export |
| Calculated columns | List formulas | Still a gap |

## History

The 2026-08-24 lists note treated bulk actions and the pipeline switcher as open. Both shipped in remaining waves (Tasks 9 and 21).
