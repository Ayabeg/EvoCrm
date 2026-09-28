# Outbound lists

## 1. Screen Identity

Screen ID: `SCR-OUT-010`
Product area: Outbound
Route: `/outbound/lists`
Route name: `outbound.lists.index`
Frontend file: `resources/js/pages/outbound/lists/index.tsx`
Primary component: `OutboundListsIndex`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Lists"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET only; no mutations on this controller. [CONFIRMED-CODE]
Parent navigation: Primary tab **Lists**.
Entry points: room tab.
Exit points: “Manage segments” `/crm/segments` (`SCR-SEGMENT-001`); campaign names; “View” `/crm/contacts?filter_id={id}`.
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/lists/index`, prop `lists`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `ListsController.php`; `lists/index.tsx`.

## 2. Purpose

Read-only index of contact **saved filters** (CRM segments) with live counts and which outbound campaigns use them. Lists are not created here.

## 3. Current UX Summary

Short description, link to segments, one native table: List, Contacts (right), Campaigns, Open.

## 4. Screen Anatomy

1. Room chrome. [CONFIRMED-CODE]
2. Title “Audience lists”, description “Contact segments for outbound campaigns.” [CONFIRMED-CODE]
3. Actions: Manage segments. [CONFIRMED-CODE]
4. Table. [CONFIRMED-CODE]

## 5. Data Displayed

`SavedFilter` entity=contact: id, name, `CrmFilter::count`, campaigns grouped by `saved_filter_id` (id, name, status). [CONFIRMED-CODE]

## 6. Primary Actions

- **View** → contacts hub with `filter_id`. [CONFIRMED-CODE]
- **Manage segments**. [CONFIRMED-CODE]

## 7. Secondary Actions

- Campaign name links to campaign show. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

`orderBy('name')`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

All contact saved filters; count computed per list (N queries). [CONFIRMED-CODE]

## 14. Forms

NOT PRESENT.

## 15. Overlays

NOT PRESENT.

## 16. States

Empty: “No contact segments yet.” [CONFIRMED-CODE]
Campaigns cell may be empty with no placeholder. [CONFIRMED-CODE]

## 17. Empty State

Single table row copy; CTA is header “Manage segments”. [CONFIRMED-CODE]

## 18. Error Handling

None specific. GET 200. [CONFIRMED-UI]

## 19. Feedback

NOT PRESENT.

## 20. Navigation Behavior

Read-only. Breadcrumbs Outbound + Lists. [CONFIRMED-CODE]
This is the only outbound list page with a two-level breadcrumb including hub. [CONFIRMED-CODE]

## 21. Entity Relationships

SavedFilter (contact) ← OutboundCampaign.saved_filter_id. Also used to enroll sequences (not shown here).

## 22. Business Rules

- Lists **are** CRM saved contact filters, not a separate outbound entity. [CONFIRMED-CODE]
- Count via `CrmFilter` live, not a stored size. [CONFIRMED-CODE]
- Campaigns with null saved_filter_id (all-email) do not appear on any row. [CONFIRMED-CODE]

## 23. Backend Dependencies

`ListsController`, `SavedFilter`, `OutboundCampaign`, `CrmFilter`.

## 24. Frontend Dependencies

`OutboundPage`, `OutboundShell`, Inertia `Link`. Extremely small page.

## 25. Responsive Behavior

`overflow-x-auto` table. [CONFIRMED-CODE] NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: none extra.
LIKELY ISSUE: thead uppercase 11px; no caption; campaign links concatenated with `me-2` no list semantics. [CONFIRMED-CODE]
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-090 | MEDIUM | Cannot create/edit lists here despite being a primary Outbound tab. | Extra trip to Segments/Contacts. | GET-only controller [CONFIRMED-CODE] |
| UX-OUT-091 | LOW | Empty campaigns cell is blank, not “—”. | Looks broken. | `lists/index.tsx` [CONFIRMED-CODE] |
| UX-OUT-092 | OBSERVATION | Naming: “Lists” vs “Segments” vs “saved filters”. | Vocabulary split. | copy vs `SavedFilter` [CONFIRMED-CODE] |

## 28. Consistency Comparison

Thinnest outbound page. Segments index also links campaigns. Unlike campaigns, no create form.

## 29. Functional Preservation Contract

Must keep: live counts; campaign links; view in contacts with filter_id; manage segments escape hatch; contact-entity-only.

## 30. Design Input Contract

- Purpose: pick an audience that already exists in CRM.
- Primary goal: see size and which campaigns use it.
- Required information: name, count, campaigns.
- Must not remove: that lists are CRM filters.

## 31. Open Questions / Unknowns

- Seed list count. [UNKNOWN]
- Count performance on large workspaces. [UNVERIFIED]
