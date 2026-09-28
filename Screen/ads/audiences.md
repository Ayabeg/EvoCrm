# Ads audiences

## 1. Screen Identity

Screen ID: SCR-ADS-006
Product area: Ads
Route: `/ads/audiences`
Route name: `ads.audiences`
Frontend file: `resources/js/pages/ads/audiences.tsx`
Primary component: `AdsAudiences`
Layout: `AdsShell` title “Audiences”. Breadcrumbs Ads `/ads`, Audiences `/ads/audiences`. Tab exact `/ads/audiences`. [CONFIRMED-CODE]
Authentication: `auth` + `verified`. [CONFIRMED-CODE]
Permissions: GET not `ads.manage`. POST sync uses `crm.segments.sync-meta` which requires `ads.manage` **and** `role->canManageSettings()` inside `SegmentController::syncMeta`. Simple mode 403 `/ads*`. [CONFIRMED-CODE]
Parent navigation: Ads tab Audiences; overview caption link. [CONFIRMED-CODE]
Entry points: Ads tabs, `/ads` caption, command palette only via Ads hub. [CONFIRMED-CODE]
Exit points: `/crm/segments`, `/crm/contacts?filter_id={id}`, `/outbound/campaigns/{id}`, `/outbound/campaigns`. [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): **403**. [CONFIRMED-UI]
Evidence: runtime-index `/ads/audiences` 403. `AdsCenterController::audiences`. [CONFIRMED-CODE] [CONFIRMED-UI]

## 2. Purpose

Bridge CRM contact segments (saved filters) to outbound campaigns and optional Meta Custom Audience sync. Does not list Meta-native audiences; it lists workspace `SavedFilter` entity=contact. [CONFIRMED-CODE]

## 3. Current UX Summary

Header with Meta connected/not-connected badge and “Manage segments”. Optional reason panel. List of segments: name (opens contacts with filter), usage count, view members, outbound campaign chips, or “Create campaign”. If `meta.connected`, each row gets a Custom Audience ID input + “Sync to Meta”. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. App shell + Ads tabs. [CONFIRMED-CODE]
2. `SurfaceHeader` title “Audiences”, description about CRM segments and Meta Custom Audiences. Actions: Badge, Link manage segments. [CONFIRMED-CODE]
3. Optional `HairlinePanel` with `meta.reason` + “Meta audience sync requires a connected Meta app and audience ID.” [CONFIRMED-CODE]
4. Panel: empty copy **or** `ul.divide-y` of segment rows. [CONFIRMED-CODE]
5. Per row: name + caption “Contact segment · used by N outbound campaign(s)”; View members; campaign pills or create-campaign link; conditional sync form. [CONFIRMED-CODE]

## 5. Data Displayed

Props: `segments` mapped `{ id, name, entity, campaigns[{id,name,status}] }`, `meta { connected, reason }`. [CONFIRMED-CODE]

Source: `SavedFilter` workspace, `entity = contact`, `orderBy name`. OutboundCampaigns with non-null `saved_filter_id` grouped onto those filters. [CONFIRMED-CODE]

Badge: “Meta connected” vs “Meta not connected” (not “Demo data”). [CONFIRMED-CODE]

## 6. Primary Actions

- View members / name → `/crm/contacts?filter_id={id}`. [CONFIRMED-CODE]
- **Sync to Meta** — POST `/crm/segments/{id}/sync-meta` with required `audience_id`. Shown only if `meta.connected`. [CONFIRMED-CODE]

## 7. Secondary Actions

- Manage segments `/crm/segments`. [CONFIRMED-CODE]
- Open outbound campaign `/outbound/campaigns/{id}`. [CONFIRMED-CODE]
- Create campaign `/outbound/campaigns`. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT. Contact-entity saved filters only (server-side). [CONFIRMED-CODE]

## 10. Sorting

Name ascending. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT (per-segment sync only). [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

All matching saved filters. Sync uses Inertia `Form` (no explicit processing disable on button). [CONFIRMED-CODE]

## 14. Forms

**Sync to Meta** (per segment, if connected):

- Action: `POST /crm/segments/{segment.id}/sync-meta`
- Field: `audience_id` text, required, placeholder `1234567890`, Label “Meta Custom Audience ID”
- Submit: “Sync to Meta”
- Validation: `audience_id` required string max 80; segment must be contact entity; workspace match else 404; `canManageSettings` else 403; middleware `ads.manage`.
- Flash: `back()->with('meta_sync', $result)` — **not** the standard `toast` flash used by ads sync. Whether UI shows `meta_sync` on this page: **NOT PRESENT** in `audiences.tsx`. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT. [CONFIRMED-CODE]

## 16. States

- Empty segments: instructions to save a filter from Contacts or create in Segments. [CONFIRMED-CODE]
- Segment with zero outbound campaigns: helper + create link. [CONFIRMED-CODE]
- Meta disconnected: no sync form; badge secondary. [CONFIRMED-CODE]
- Meta reason panel. [CONFIRMED-CODE]
- Simple mode 403 (cannot use this UI even if segments exist). [CONFIRMED-UI]

## 17. Empty State

Paragraph with Contacts and Segments links, not a table. [CONFIRMED-CODE]

## 18. Error Handling

403 simple mode; 403/422/404 on sync. No on-page display of `meta_sync` or validation errors in this component (`errors` bag [UNVERIFIED] if Inertia shares it globally). [CONFIRMED-CODE]

## 19. Feedback

Badge + reason text. Sync result flash key `meta_sync` is not consumed here — user may get no toast. [CONFIRMED-CODE]

## 20. Navigation Behavior

Leaves Ads room for CRM/outbound. Tab exact so nested paths would not stick (none exist). [CONFIRMED-CODE]

## 21. Entity Relationships

SavedFilter (contact) optionally used by OutboundCampaign.saved_filter_id. Meta Custom Audience identified by user-supplied external id. Not AdAccount objects. [CONFIRMED-CODE]

## 22. Business Rules

- Only `entity = contact` filters. [CONFIRMED-CODE]
- Sync form hidden unless `meta.connected` (`WorkspaceMetaCredentials` ok). [CONFIRMED-CODE]
- Sync additionally requires settings-capable role. Members with only ads.manage may still 403. [CONFIRMED-CODE]
- Simple mode blocks the page but `/crm/segments` may remain available — split surface. [CONFIRMED-CODE]

## 23. Backend Dependencies

`AdsCenterController::audiences`, `SavedFilter`, `OutboundCampaign`, `SegmentController::syncMeta`, `MetaAudienceSyncService`. [CONFIRMED-CODE]

## 24. Frontend Dependencies

`AdsShell`, `SurfaceHeader`, `HairlinePanel`, `Badge`, `Button`, `Input`, `Label`, Inertia `Form`/`Link`. [CONFIRMED-CODE]

## 25. Responsive Behavior

Row header wraps; form `min-w-[200px] flex-1`. Viewport NOT VERIFIED. [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: labels tied via `htmlFor` `audience-{id}`. [CONFIRMED-CODE]
LIKELY ISSUE: list not a table; campaign chips are links; sync button no processing/aria. [CONFIRMED-CODE]
REQUIRES MANUAL TEST: 403, sync errors. [UNKNOWN]

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-ADS-AUD-001 | BLOCKER | 403 simple_mode | Cannot manage ad audiences here | runtime-index [CONFIRMED-UI] |
| UX-ADS-AUD-002 | HIGH | Sync success/error not shown (`meta_sync` unused) | User cannot tell if Meta accepted the audience | `audiences.tsx` vs `SegmentController` [CONFIRMED-CODE] |
| UX-ADS-AUD-003 | MEDIUM | Requires pre-existing Meta audience ID | No “create audience” flow | form placeholder [CONFIRMED-CODE] |
| UX-ADS-AUD-004 | MEDIUM | Dual permission (ads.manage + canManageSettings) | Owner works; others fail opaquely | `syncMeta` [CONFIRMED-CODE] |
| UX-ADS-AUD-005 | OBSERVATION | Mixes outbound email campaigns with Meta ads room | Conceptual overlap | campaigns from OutboundCampaign [CONFIRMED-CODE] |

## 28. Consistency Comparison

Segments index also has Meta sync. Overview uses “Demo data”; this uses “Meta not connected”. Outbound lists are a different product. [CONFIRMED-CODE]

## 29. Functional Preservation Contract

Must keep: contact saved-filter list, outbound campaign links/counts, contacts filter_id deep link, segments link, Meta badge/reason, per-segment audience_id sync POST, hide sync when disconnected, simple-mode 403.

## 30. Design Input Contract

Purpose: Use CRM segments as ad/outbound audiences.
Primary goal: Open members and optionally push to a Meta Custom Audience ID.
Primary actions: View members; Sync to Meta.
Secondary: Manage segments; outbound campaigns.
Required information: segment name, outbound usage, Meta connection, audience ID field.
Required components: header, reason, segment list, conditional sync form.
Required states: empty, disconnected, connected+form, 403.
May NOT be removed: filter_id links, sync endpoint, connected gate.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- Shape of `meta_sync` flash payload. [UNVERIFIED]
- Whether Inertia shared `errors.audience_id` renders (no `usePage().errors` in file). [UNVERIFIED]
