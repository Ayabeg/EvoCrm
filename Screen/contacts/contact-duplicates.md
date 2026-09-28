# Contact duplicates

## 1. Screen Identity

Screen ID: `SCR-CONTACT-004`
Product area: Contacts
Route: `GET /crm/contacts/duplicates`
Route name: `crm.contacts.merge.index` (name is merge.index; path is `/duplicates`)
Frontend file: `resources/js/pages/crm/contacts/duplicates.tsx`
Primary component: `ContactDuplicates` in `CrmShell`
Layout: `AppLayout` + `CrmShell` title “Duplicate contacts”; breadcrumbs Contacts → Duplicates
Authentication: auth + verified
Permissions: route name contains `.merge` → `crm.merge` required (`EnforceProductPermissions`). List link hidden without capability. [CONFIRMED-CODE]
Parent navigation: Contacts list secondary “Duplicates”.
Entry points: list header; merge breadcrumb back.
Exit points: Back to Contacts; Open / row click → `SCR-CONTACT-002`; “Merge A into B” → `SCR-CONTACT-005`.
Runtime HTTP (owner, simple_mode=true): `200` component `crm/contacts/duplicates`, props `groups`. [CONFIRMED-BOTH]
Evidence: runtime-index; `ContactMergeController@index`; `ContactMerger::groups`; `duplicates.tsx`.

## 2. Purpose

Surface workspace contacts that share normalized email, E.164 phone, or imported `external_id`, and offer a path to pick a survivor merge.

## 3. Current UX Summary

Max-w-5xl list of groups. Each card: header “Same {reasons}”, member rows (name + email · phone · company), Open link, footer merge links pairing first contact as survivor with each other as absorbed. Empty: “No duplicate groups in this workspace.” [CONFIRMED-CODE]

## 4. Screen Anatomy

- CrmShell + RecordBack Contacts.
- H1 “Duplicate contacts” + subtitle about email/phone/external ID.
- Empty paragraph or `<ul>` of group cards.
- Per group: reason bar, contact rows, merge links.

## 5. Data Displayed

`groups[]`: `{ key, reasons[], contacts[] }` where contact is `id`, `display_name`, `email`, `phone_e164`, `external_id`, `company` (name string), plus first/last from merger (first/last/city sent but UI uses display_name + email/phone/company). [CONFIRMED-CODE]

Reasons labels: `email`, `phone`, `external ID` (from field map). Groups built by union-find across those keys; contacts ordered `orderBy('first_name')` then grouped; survivor in UI is **first in that array**, not “most complete”. [CONFIRMED-CODE]

## 6. Primary Actions

Merge links: `GET /crm/contacts/merge/{survivorId}/{absorbedId}` for each non-first member into the first. [CONFIRMED-CODE]

## 7. Secondary Actions

Open contact; row click (except on a/input/button/label) `router.visit` show; back to list.

## 8. Search

NOT PRESENT. Entire workspace loaded into memory for grouping. [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT. Cannot filter groups by reason.

## 10. Sorting

Contacts globally sorted by first_name before grouping. Groups iteration order is union-find root order (insertion). [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT. No multi-select merge. Survivor is implicit first row.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

No pagination. `ContactMerger::groups` loads **all** workspace contacts with companies. [CONFIRMED-CODE]
No skeleton on this page.

## 14. Forms

NOT PRESENT (merge form is the next screen).

## 15. Overlays

NOT PRESENT.

## 16. States

Empty groups; one or more groups; groups with <2 others still need `others.length > 0` for merge footer (always if group size ≥2).

## 17. Empty State

Bordered mute paragraph, no CTA to import or create. [CONFIRMED-CODE]

## 18. Error Handling

403 without `crm.merge`. No error UI for grouping failures. [CONFIRMED-CODE]

## 19. Feedback

Hover row `bg-canvas-soft`. No toast. [CONFIRMED-CODE]

## 20. Navigation Behavior

Stay on duplicates until Open or Merge. Merge is a distinct GET with two ids. There is **no** `GET /crm/contacts/merge` (404). [CONFIRMED-BOTH]

## 21. Entity Relationships

Duplicate detection on Contact identity fields only (not fuzzy name). Merge reassignment happens on the merge screen.

## 22. Business Rules

- Same non-empty email **or** phone_e164 **or** external_id.
- Empty values ignored.
- Workspace scoped.
- Survivor heuristic = first after first_name sort (unstable relative to data quality).

## 23. Backend Dependencies

`ContactMergeController@index`, `ContactMerger::groups`.

## 24. Frontend Dependencies

`CrmShell`, `RecordBack`, Inertia `Link`/`router`.

## 25. Responsive Behavior

Flex wrap on rows and merge links; max-w-5xl padding. [CONFIRMED-CODE]
Viewport: [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: Open is a real link. [CONFIRMED-CODE]
LIKELY ISSUE: whole `<li>` is clickable via `onClick` without `role="link"`/keyboard handler; merge links are text-only brand color.
REQUIRES MANUAL TEST: keyboard access to row navigate.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| UX-CONTACT-DUP-01 | HIGH | Survivor is first_name order, not user-chosen on this page | May merge into the worse record | `duplicates.tsx` `[survivor, ...others]` |
| UX-CONTACT-DUP-02 | MEDIUM | Full table scan in PHP | Slow/large workspaces | `Contact::...->get()` |
| UX-CONTACT-DUP-03 | MEDIUM | No name-similarity duplicates | Real-world twins missed | groups() fields |
| UX-CONTACT-DUP-04 | LOW | Clickable row + Open link redundant | Accidental navigation | onClick visit |

## 28. Consistency Comparison

Unique to contacts (no company/deal duplicate UI). Uses CrmShell like import/merge, not DataWorkspace.

## 29. Functional Preservation Contract

Must keep: `/crm/contacts/duplicates`, `crm.merge` gate, reason labels, merge URLs with survivor/absorbed ids, open record, empty copy, identity match fields.

## 30. Design Input Contract

Purpose: find and start merges.
Primary goal: confirm two people are the same and choose a merge pair.
Primary action: start merge.
Required information: why grouped, names, email, phone, company.
May NOT remove: reason display, per-pair merge URL, capability gate.

## 31. Open Questions / Unknowns

- [UNKNOWN] scale at which groups() becomes unusable.
- [UNVERIFIED] seed database actually contains duplicate groups (empty state vs cards).
- [UNKNOWN] whether phone matching uses raw `phone` as well as `phone_e164` (code: `phone_e164` only).
