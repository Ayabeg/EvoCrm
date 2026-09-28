# EvoCRM DataWorkspace Benchmark

## Scope

This benchmark covers Contacts, Companies, Leads, Deals list, Quotes list, saved views, filtering, table behavior, and bulk operations. The existing shared architecture is preserved.

## Current EvoCRM baseline

The shared foundation is resources/js/ds/workspace/DataWorkspace.tsx with types, SavedViews, FilterBar, AdvancedFilterDrawer, DataTable, and BulkActionBar. Domain pages are wrapped by resources/js/components/crm/crm-list-shell.tsx. Contacts, Companies, Deals, and Quotes use that wrapper while retaining domain-specific ListViewTable or board children.

The important audit finding is architectural rather than visual: CrmListShell currently passes rows={[]} to DataWorkspace and uses children for the rendered domain table. The shell therefore standardizes header, views, filters, loading, empty state, and pagination, but row rendering, selection, and some bulk behavior are not yet one shared contract. SavedViews currently pins the first three saved views, limits most users to five, and does not offer a new view on the Quotes path.

## Benchmark evidence

| Product | Evidence | Strong behavior | Limitation for EvoCRM |
|---|---|---|---|
| HubSpot | [contacts/list screen](https://mobbin.com/screens/2c2951a8-ec56-41c0-a3e0-990330bdc5f4), [bulk action bar](https://mobbin.com/screens/fedf5525-727c-4f83-92d8-9ebc647363d4), [advanced filters](https://mobbin.com/screens/edbed4a5-0814-4c04-bf4e-c55dc948a900), [saved views docs](https://knowledge.hubspot.com/records/create-and-manage-saved-views) | Familiar index model: object title, saved views, search/filter row, configurable columns, selection, bulk bar, and pagination. | Can become a dense maze of object-specific controls and plan-gated concepts. |
| Attio | [records docs](https://attio.com/help/reference/managing-your-data/records/create-and-view-records), [filter and sort docs](https://attio.com/help/reference/managing-your-data/views/filter-and-sort-views) | Fast, clean views with flexible attributes, lightweight relationships, and a modern spreadsheet-like feel. | Flexibility can make a sales workflow less opinionated and harder for first-time CRM users. |
| Airtable | [views docs](https://support.airtable.com/articles/5189551686-getting-started-with-airtable-views) | Makes view type, filters, grouping, sorting, and field visibility explicit and reusable. | A CRM needs ownership, lifecycle, and follow-up semantics beyond generic records. |
| Salesforce | Production CRM list and report patterns. | Scales to complex permissions, objects, and enterprise data models. | Navigation and configuration burden are too high for EvoCRM's target unless hidden behind advanced controls. |
| Pipedrive | Pipeline/list relationship and sales-first list behavior. | Keeps deal data tied to stage, owner, activity, and value. | Its object model is narrower than EvoCRM's four rooms and communication context. |

## Score comparison

| Candidate | Hierarchy | Ease | Speed | Discoverability | Density | Scale | A11y | Keyboard | Responsive | EvoCRM fit | Complexity |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HubSpot | 9 | 8 | 7 | 9 | 8 | 9 | 7 | 7 | 7 | 9 | 7 |
| Attio | 8 | 9 | 9 | 8 | 8 | 8 | 7 | 8 | 8 | 8 | 6 |
| Airtable | 8 | 8 | 8 | 8 | 9 | 9 | 7 | 8 | 6 | 8 | 7 |
| Salesforce | 7 | 5 | 5 | 6 | 9 | 10 | 6 | 6 | 5 | 7 | 10 |
| Pipedrive | 8 | 9 | 8 | 9 | 7 | 7 | 7 | 7 | 8 | 8 | 5 |

## Coherent EvoCRM model

The DataWorkspace should be one shell with object configuration, not one generic page that erases domain differences.

| Layer | Shared contract |
|---|---|
| Header | Object title, record count, primary create action, import/export if allowed, and optional board toggle. |
| View rail | Saved views with All, Mine, Unassigned or lifecycle defaults, followed by user/team views and a manage affordance. |
| Query bar | Search, quick filters, Advanced filters, active filter chips, columns, and clear all. |
| Result surface | Shared selection and density behavior, with object-specific cell renderers and optional domain board view. |
| Bulk bar | Appears after selection, shows count, safe bulk actions first, destructive actions last, and supports keyboard escape. |
| Footer | Cursor or page pagination, loaded count, and selection scope. |

The URL is the source of truth for object, saved view, filters, sorting, columns, page, and board/list mode. Refresh and back/forward must preserve the query.

## Filter behavior

Quick filters cover common CRM states: owner, lifecycle/stage, activity status, created date, updated date, and source. Advanced filters use grouped AND/OR clauses, human-readable chips, and a preview count before applying. A filter must expose its field, operator, and value; do not hide logic in a generic “custom” pill.

Columns support show/hide, order, and width within safe bounds. Object-critical fields cannot be removed without a visible reset. Sorting is single-column by default and multi-sort belongs in an advanced menu.

## Density and interaction

Use the existing density contract: 48px rows, 36px controls, 32px page padding, 8px radius, and restrained borders. Provide keyboard focus on every row/action, shift-selection where feasible, and inline editing only for low-risk fields. High-risk fields such as owner, stage, amount, and lifecycle need explicit confirmation or a clear undo toast.

## ADOPT / ADAPT / REJECT

| Decision | Rationale |
|---|---|
| ADOPT HubSpot's saved-view mental model | It is familiar to CRM users and fits the current DataWorkspace foundation. |
| ADOPT Airtable's explicit field/view configuration | It makes customization discoverable and reusable. |
| ADOPT Attio's lightweight speed and relationship awareness | It reduces friction for fast record capture and browsing. |
| ADAPT Pipedrive's sales context | Keep owner, stage, value, next activity, and stale indicators visible for Deals without forcing them on Contacts. |
| ADAPT Salesforce's scale behind progressive disclosure | Permissions, record layouts, and advanced operators exist in EvoCRM but should be surfaced only when needed. |
| REJECT per-object visual forks | Contacts, Companies, Deals, and Quotes must feel like one system. |
| REJECT a completely free-form spreadsheet | CRM lifecycle, ownership, associations, and communication need opinionated defaults. |
| REJECT a fixed five-view ceiling as a product rule | Keep the first-level rail focused but allow a manage-all view and search. |

## Implementation impact

Eventually affect DataWorkspace.tsx, SavedViews.tsx, FilterBar.tsx, AdvancedFilterDrawer.tsx, DataTable.tsx, BulkActionBar.tsx, crm-list-shell.tsx, list-query.ts, list-view-config.ts, and the Contacts/Companies/Deals/Quotes/Leads page wrappers. Record layout routes and object-specific controllers should remain the source of field permissions. No implementation is made in this phase.

## Sources

See the [overall benchmark](ux-benchmark.md), [design system](../design-system.md), and [Mobbin contract](../evocrm-mobbin-contract.md).
