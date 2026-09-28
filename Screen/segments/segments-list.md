# Segments list

## 1. Screen Identity

Screen ID: SCR-SEGMENT-001
Product area: CRM / Segments
Route: `GET /crm/segments`
Route name: `crm.segments.index`
Frontend file: `resources/js/pages/crm/segments/index.tsx`
Primary component: `SegmentsIndex`
Layout: `CrmShell` workspace; breadcrumbs Segments. `[CONFIRMED-CODE]`
Authentication: authenticated CRM group. **Not** simple-mode blocked. `[CONFIRMED-CODE]`
Permissions: GET ungated. Store/update/destroy `crm.edit`. `sync-meta` requires `ads.manage` **and** `role->canManageSettings()`. `[CONFIRMED-CODE]`
Parent navigation: Sidebar **More → Segments** (full mode only; not in SIMPLE_NAV). Command palette `nav-segments`. Ads audiences + outbound lists link here. `[CONFIRMED-CODE]`
Entry points: More; palette; ads/outbound; URL. `[CONFIRMED-CODE]`
Exit points: row click / name → `/crm/contacts?filter_id=` or `/crm/deals?filter_id=`; History → `/crm/segments/{id}`; campaign names → `/outbound/campaigns/{id}`. `[CONFIRMED-CODE]`
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/segments/index`. `[CONFIRMED-UI]`
Evidence: props `segments`, `tab`, `members`, `cities`, `wilayas`, `stages`, `contactFilterFields`, `dealFilterFields`, `canSyncMeta`. `[CONFIRMED-UI]`

## 2. Purpose

CRUD saved views (`SavedFilter` entity contact|deal) for reuse as list filters and campaign audiences. Optional Meta audience sync for contact segments. `[CONFIRMED-CODE]`

## 3. Current UX Summary

Header “Segments” / “Saved views for contacts and deals.” + New segment. Client chips all/contact/deal + search. Table: name, entity, count, campaigns, actions (History, Edit, Meta, Delete). Drawers for create/edit with `SegmentFilterForm`. `[CONFIRMED-BOTH]` Runtime 200; row data `[UNVERIFIED]`.

## 4. Screen Anatomy

- `CrmObjectHeader` primary New segment
- Toolbar entity buttons + Search input (client-only)
- Table min-width 640
- `CrmListFooter` count of **filtered** rows
- `CreateDrawer` New segment / Edit segment `[CONFIRMED-CODE]`

## 5. Data Displayed

Each segment: id, name, entity, filters, count (`CrmFilter::count`), campaigns (id, name, status). `[CONFIRMED-CODE]`
`tab` always `'manage'` (unused in UI). `[CONFIRMED-CODE]`
`canSyncMeta` from `canManageSettings()`. `[CONFIRMED-CODE]`
Cities/wilayas from `config('evosales.*')`; stages from default pipeline. `[CONFIRMED-CODE]`

## 6. Primary Actions

- **New segment** POST `/crm/segments` (name, entity, filters_json). `[CONFIRMED-CODE]`
- Open members: visit contacts/deals with `filter_id`. `[CONFIRMED-CODE]`

## 7. Secondary Actions

- History link (SCR-SEGMENT-002)
- Edit PUT `/crm/segments/{id}` (entity hidden, not switched)
- Delete `confirm('Delete?')` then DELETE
- Meta: POST `/crm/segments/{id}/sync-meta` with `audience_id` (contact + canSyncMeta only)
- Entity filter + name search (client) `[CONFIRMED-CODE]`

## 8. Search

Client `segment.name.toLowerCase().includes`. Does not hit the server. `[CONFIRMED-CODE]`

## 9. Filters

Client entity `all|contact|deal`. Segment **definitions** store CrmFilter bags (stage, owner, city, wilaya, last_activity, created, status, unanswered, unassigned, plus filter_groups via FilterBuilder). `[CONFIRMED-CODE]`

## 10. Sorting

Server `orderBy('name')`. No UI sort. `[CONFIRMED-CODE]`

## 11. Selection

NOT PRESENT. Row click unless target is a/button/input/form. `[CONFIRMED-CODE]`

## 12. Bulk Actions

NOT PRESENT. `[CONFIRMED-CODE]`

## 13. Pagination / Loading Strategy

All matching saved filters loaded. Footer is count only (no pages). `[CONFIRMED-CODE]`

## 14. Forms

Validated: name max 120; entity contact|deal; filters array or `filters_json`; fallback scalar filter fields. `[CONFIRMED-CODE]`
Preview route `POST /crm/segments/preview` JSON — **no frontend caller** in `resources/js`. `[CONFIRMED-CODE]` `[UNREACHABLE]` from this UI
Sync-meta: audience_id required; 422 if not contact; 403 if cannot manage settings. `[CONFIRMED-CODE]`

## 15. Overlays

Create and edit `CreateDrawer`s with `SegmentFilterForm` (FilterBuilder + legacy selects). `[CONFIRMED-CODE]`

## 16. States

Empty `CrmEmptyState` “No segments yet”; populated table; drawers; processing buttons. `[CONFIRMED-CODE]`

## 17. Empty State

“No segments yet” / “Save a contact or deal view to reuse it as a list filter or campaign audience.” + New segment. Same empty when search/entity filter matches none (title still “No segments yet” — not “no matches”). `[CONFIRMED-CODE]`

## 18. Error Handling

Workspace 404 on update/destroy; confirm delete only. `[CONFIRMED-CODE]` `[UNVERIFIED]` validation UI

## 19. Feedback

Redirect to index on store/update/destroy. Sync `back()->with('meta_sync', $result)` — page does not read `meta_sync`. `[CONFIRMED-CODE]` `[UNVERIFIED]` flash

## 20. Navigation Behavior

Row click goes to **object list**, not segment show. History is explicit. `[CONFIRMED-CODE]`

## 21. Entity Relationships

`SavedFilter` workspace-scoped; outbound campaigns `saved_filter_id`; membership history table used on show; workflows can trigger on segment enter/exit using saved_filter id. `[CONFIRMED-CODE]`

## 22. Business Rules

- Only contact|deal entities (abort 404 otherwise). `[CONFIRMED-CODE]`
- Count is live filter count, not membership table. `[CONFIRMED-CODE]`
- Simple mode: reachable by URL/palette, not in rail. `[CONFIRMED-BOTH]`
- Meta sync settings-admin only. `[CONFIRMED-CODE]`

## 23. Backend Dependencies

`SegmentController`, `SavedFilter`, `CrmFilter`, `OutboundCampaign`, `MetaAudienceSyncService`. `[CONFIRMED-CODE]`

## 24. Frontend Dependencies

`SegmentFilterForm`, `CreateDrawer`, `CrmListFooter`, `CrmEmptyState`. `[CONFIRMED-CODE]`

## 25. Responsive Behavior

Toolbar wrap; table min 640. `[CONFIRMED-CODE]` Viewport: NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: Name label on create; Delete uses `confirm()`. `[CONFIRMED-CODE]`
LIKELY ISSUE: Entity filter buttons have no `aria-pressed`. Row click vs inner History link. `[CONFIRMED-CODE]`
REQUIRES MANUAL TEST: FilterBuilder inside drawer.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-SEG-001 | HIGH | Primary click is contacts/deals list, not history | “Show” is easy to miss | `router.visit(href)` `[CONFIRMED-CODE]` |
| UX-SEG-002 | MEDIUM | Filtered empty reuses “No segments yet” | Misleading when search is on | empty branch `[CONFIRMED-CODE]` |
| UX-SEG-003 | MEDIUM | Preview API unused | No live member preview in drawer | grep preview `[CONFIRMED-CODE]` |
| UX-SEG-004 | LOW | `tab` always manage | Dead prop | controller `[CONFIRMED-CODE]` |
| UX-SEG-005 | LOW | Meta audience_id tiny field in actions cell | Easy to miss / tight | index.tsx `[CONFIRMED-CODE]` |

## 28. Consistency Comparison

Not `CrmListShell`. Contacts list owns “saved filters” for the same `SavedFilter` model — two UIs for one concept (list tabs vs Segments room). `[CONFIRMED-CODE]`

## 29. Functional Preservation Contract

- Keep contact/deal saved filters with counts and campaign links.
- Keep create/edit/delete and History.
- Keep Meta sync gated.
- Keep `filter_id` deep links into lists.
- Keep preview endpoint even if unused in UI.

## 30. Design Input Contract

Purpose: manage reusable audiences/views.
Primary goal: create a segment and open its members.
Primary actions: New segment, open members.
Secondary: History, Edit, Delete, Meta.
Required information: name, entity, count, campaigns.
Required components: table, filter form drawer, entity chips, search.
Required states: empty, populated, editing, deleting confirm.
Information priority: name → count → entity → campaigns.
Business-critical: filter payload, filter_id navigation, Meta for contacts.
Must not remove: deal vs contact entity; campaign links.

## 31. Open Questions / Unknowns

- Seeded segment id 1 contents. `[UNKNOWN]`
- Whether `meta_sync` flash is shown globally. `[UNVERIFIED]`
- FilterBuilder vs scalar fallback which path operators actually use. `[UNKNOWN]`
