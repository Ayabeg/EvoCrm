# DataTable migration strategy

Audit date: 2026-08-25 (branch `cursor/visual-foundation-91cb`)

## Summary

| Metric | Count |
|--------|------:|
| Inline `<table>` in `resources/js/pages/` | **30** |
| Pages using `ListViewTable` | **3** (contacts, companies, deals) |
| Migrated this pass | **0** (Activities deferred — see below) |

## `ListViewTable` scope

[`resources/js/components/crm/list-view-table.tsx`](../../resources/js/components/crm/list-view-table.tsx) is built for CRM list entities with saved-view column config:

- Supported entities: `contact`, `company`, `deal`
- Requires `ListViewMeta` (`columnDefs`, `columns`, `sort`) from the server
- Renders name/title cells as links to `${basePath}/${id}`

It is **not** a generic table primitive. Operational pages (outbound health, ads sync, settings) need different row shapes and actions.

## Migrated

| Page | Status | Notes |
|------|--------|-------|
| `crm/contacts/index.tsx` | ✅ Already on `ListViewTable` | Reference implementation |
| `crm/companies/index.tsx` | ✅ Already on `ListViewTable` | Reference implementation |
| `crm/deals/index.tsx` | ✅ Already on `ListViewTable` | Reference implementation |
| `crm/activities/index.tsx` | ⏸ Deferred | Adopted **CrmListShell chrome** (header, footer, `text-ui` table). `ListViewTable` has no `activity` entity; extending it is a separate data-model task |

## Specialized (keep inline)

These tables are domain-specific dashboards or admin surfaces — inline markup is appropriate until a shared **operational table** primitive exists (sticky header, dense rows, optional row actions — without saved-view columns).

| Page | Tables | Reason |
|------|-------:|--------|
| `outbound/index.tsx` | 2 | Mailbox health + recent activity — mixed link/badge columns |
| `outbound/outbox.tsx` | 1 | Status/defer reason columns |
| `outbound/replies.tsx` | 1 | Thread preview |
| `outbound/reports.tsx` | 2 | Aggregated send metrics |
| `outbound/warmup.tsx` | 1 | Warmup schedule matrix |
| `outbound/suppressions.tsx` | 1 | Suppression list |
| `outbound/campaigns/index.tsx` | 1 | Campaign status |
| `outbound/campaigns/show.tsx` | 1 | Recipient grid |
| `outbound/sequences/index.tsx` | 1 | Sequence list |
| `outbound/sequences/show.tsx` | 1 | Enrollment steps |
| `outbound/domains/index.tsx` | 1 | DNS verification |
| `outbound/lists/index.tsx` | 1 | Static lists |
| `ads/index.tsx` | 3 | Funnel + account tables |
| `ads/show.tsx` | 3 | Campaign drill-down |
| `ads/campaigns/index.tsx` | 1 | Meta sync |
| `ads/ad-sets/index.tsx` | 1 | Meta sync |
| `ads/ads/index.tsx` | 1 | Meta sync |
| `crm/leads/index.tsx` | 1 | Legacy leads list (pre–saved-view) |
| `crm/reports.tsx` | 1 | Report builder output |
| `crm/segments/index.tsx` | 1 | Segment admin |
| `crm/conversations.tsx` | 1 | Conversation log |
| `crm/workflows/index.tsx` | 1 | Workflow editor grid |
| `settings/people.tsx` | 1 | Team admin |
| `settings/permissions.tsx` | 1 | Role matrix |

## Next batch priority

1. **`crm/leads/index.tsx`** — Align with contacts/deals: add saved-view backend + `CrmListShell` + `ListViewTable` (highest CRM parity gap).
2. **`crm/activities/index.tsx`** — Add `activity` entity to `list-view-config` + extend `ListViewTable` OR introduce `OperationalTable` shared primitive.
3. **Outbound department** — Extract `OperationalTable` (sticky header, `text-ui`, hairline rows) and migrate `outbox`, `replies`, `suppressions` (highest traffic).
4. **Settings** — `people`, `permissions` after operational table exists.

## Implementation notes

- Do **not** force `ListViewTable` onto non–list-view pages; it couples to filter/column-chooser UX.
- New shared primitive should use tokens: `text-ui`, `border-hairline`, `bg-muted/50` thead — matching Activities and Outbound overview tables from this pass.
- Count inline tables with: `rg '<table' resources/js/pages/`
