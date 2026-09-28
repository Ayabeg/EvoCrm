# Lead captures

## 1. Screen Identity

Screen ID: SCR-LEAD-003
Product area: CRM / Leads
Route: `GET /crm/leads/captures`
Route name: `crm.leads.captures`
Frontend file: `resources/js/pages/crm/leads/captures.tsx`
Primary component: `LeadCapturesIndex`
Layout: `CrmShell` title “Capture inbox”, `chrome="workspace"` (still wraps `RoomShell` CRM tabs; simple mode tabs shrink to Contacts/Deals). Breadcrumbs Leads → Captures. `[CONFIRMED-CODE]`
Authentication: auth + verified + product permissions + simple mode. `[CONFIRMED-CODE]`
Permissions: GET ungated by named permission. Mutations require `crm.edit` (`crm.*` non-safe). `[CONFIRMED-CODE]`
Parent navigation: Command palette `nav-captures` (operator extras, not feature-gated). List header “Capture inbox”. CrmShell tab “Captures” in full mode. `[CONFIRMED-CODE]`
Entry points: `/crm/leads` secondary link; palette; CRM tab; URL. `[CONFIRMED-CODE]`
Exit points: “Leads list”; merged-lead links `/crm/leads/{id}`. `[CONFIRMED-CODE]`
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/leads/captures`. `[CONFIRMED-UI]`
Evidence: props `captures`, `filters`, `sources`, `statuses`. `[CONFIRMED-UI]`

## 2. Purpose

Inbox of inbound identities from Meta forms, CSV, a public URL, or an operator-run maps search. Deduplicate by phone/email onto one Lead. Accept or reject pending rows. `[CONFIRMED-CODE]` (header description)

## 3. Current UX Summary

Workspace header + chip filters (source, status) + three ingest panels (CSV, URL, Maps) + hairline table of last 200 captures. Accept/Reject only when `status === 'new'`. `[CONFIRMED-CODE]` Runtime 200; table contents `[UNVERIFIED]`.

## 4. Screen Anatomy

- `CrmObjectHeader` title “Capture inbox”, description, secondary “Leads list”
- Filter chips: All sources + Meta form / CSV / URL / Maps search; All statuses + New / Merged / Rejected / Error
- Grid of `HairlinePanel` ingest forms (xl: 3 columns)
- Empty block or `HairlineTable` (Identity, Source, Status, Merged into, Actions)
- Mobile row title/meta on table rows `[CONFIRMED-CODE]`

## 5. Data Displayed

Each capture: id, source, status, name, phone, email, company, wilaya, error, matched_lead_id, matched_lead_title, created_at. `[CONFIRMED-CODE]`
`filters.{source,status}` from query string (invalid values cleared). `[CONFIRMED-CODE]`
`sources` = `meta_form|csv|url|maps_search`; `statuses` = `new|merged|rejected|error`. `[CONFIRMED-CODE]`
Identity cell joins phone, email, company, wilaya; error in red. `[CONFIRMED-CODE]`

## 6. Primary Actions

- **Accept** POST `/crm/leads/captures/{id}/accept` → `LeadCaptureDeduper::process` `[CONFIRMED-CODE]`
- **Reject** POST `.../reject` → `deduper->reject` `[CONFIRMED-CODE]`
- **Upload CSV** POST `/crm/leads/captures/csv` multipart `file` `[CONFIRMED-CODE]`
- **Capture URL** POST `.../url` `url` `[CONFIRMED-CODE]`
- **Store search** POST `.../maps` query, wilaya, results[] `[CONFIRMED-CODE]`

## 7. Secondary Actions

- Filter chip navigation (toggle off if already active). `[CONFIRMED-CODE]`
- Open merged lead. `[CONFIRMED-CODE]`
- Maps: Add result / remove result (Trash, aria-label). `[CONFIRMED-CODE]`
- Leads list link. `[CONFIRMED-CODE]`

## 8. Search

NOT PRESENT (no text search of captures). `[CONFIRMED-CODE]`

## 9. Filters

Query `source` and `status`. Chips write GET `/crm/leads/captures?...`. Server `when()` filters; limit 200 latest. `[CONFIRMED-CODE]`

## 10. Sorting

`latest()` only. No UI sort. `[CONFIRMED-CODE]`

## 11. Selection

NOT PRESENT. `[CONFIRMED-CODE]`

## 12. Bulk Actions

NOT PRESENT. `[CONFIRMED-CODE]`

## 13. Pagination / Loading Strategy

Hard `limit(200)`. No paginator. Inertia Form `processing` disables submit. Accept/Reject `router.post` without explicit loading UI. `[CONFIRMED-CODE]`

## 14. Forms

CSV: `file` required, mimes csv/txt, max 10240 KB. `[CONFIRMED-CODE]`
URL: `url` required max 2048. Copy: “Emails are never invented.” `[CONFIRMED-CODE]`
Maps: `query` required, `wilaya` required, `results` min 1 with optional name/phone/email/company. Client starts with one empty result. `[CONFIRMED-CODE]`
Accept/Reject: no body; 404 if capture workspace mismatch. `[CONFIRMED-CODE]`

## 15. Overlays

NOT PRESENT (inline panels, not drawers). `[CONFIRMED-CODE]`

## 16. States

- Empty filter: “No captures in this filter” + ingest hint. `[CONFIRMED-CODE]`
- Table with badges (error destructive, merged default, else outline). `[CONFIRMED-CODE]`
- Actions column shows status label when not `new`. `[CONFIRMED-CODE]`
- Form processing. `[CONFIRMED-CODE]`

## 17. Empty State

See §16. No primary create-lead CTA (ingest is the create path). `[CONFIRMED-CODE]`

## 18. Error Handling

Capture `error` string rendered under identity. Invalid filter query ignored (reset to ''). Validation on ingest. `[CONFIRMED-CODE]` `[UNVERIFIED]` failed CSV UX.

## 19. Feedback

Forms `resetOnSuccess`; maps resets results to one empty row. Accept/Reject `back()`. No toasts in this page. `[CONFIRMED-CODE]`

## 20. Navigation Behavior

Filters are GET links. After ingest, stay on captures. Merged lead leaves to SCR-LEAD-002. `[CONFIRMED-CODE]`

## 21. Entity Relationships

`LeadCapture` → optional `matchedLead`. Accept merges onto Lead (+ contact identity). Meta form ingest also arrives via webhook (not this UI). `[CONFIRMED-CODE]`

## 22. Business Rules

- Same phone/email merges onto one Lead (header copy + `LeadCaptureDeduper`). `[CONFIRMED-CODE]` `[UNVERIFIED]` exact match rules
- Only `new` can accept/reject. `[CONFIRMED-CODE]`
- Maps: operator supplies results; product does not scrape Google Maps itself. `[CONFIRMED-CODE]`
- Simple mode does not block this route. `[CONFIRMED-CODE]`

## 23. Backend Dependencies

`LeadCaptureController`, `LeadCapture`, `LeadCsvCaptureIngestor`, `PublicUrlCaptureIngestor`, `MapsSearchCaptureIngestor`, `LeadCaptureDeduper`. `[CONFIRMED-CODE]`

## 24. Frontend Dependencies

`CrmShell`, `CrmObjectHeader`, `HairlinePanel`, `HairlineTable`, `Badge`, Inertia `Form`/`router`. `[CONFIRMED-CODE]`

## 25. Responsive Behavior

Filter chips wrap; ingest grid `xl:grid-cols-3`; table `minWidth={880}` with mobileTitle/mobileMeta. `[CONFIRMED-CODE]` Viewport: NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: file/url/maps labels + ids; remove-result `aria-label`. `[CONFIRMED-CODE]`
LIKELY ISSUE: Filter chips are links without `aria-pressed`/`aria-current`. `[CONFIRMED-CODE]`
REQUIRES MANUAL TEST: file input, accept/reject without confirm (immediate POST).

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-LEAD-201 | HIGH | Accept/Reject have no confirm | Accidental merge/reject | `router.post` `[CONFIRMED-CODE]` |
| UX-LEAD-202 | MEDIUM | 200-row cap, no search | Cannot find an old capture | controller limit `[CONFIRMED-CODE]` |
| UX-LEAD-203 | MEDIUM | Maps results are manual transcription | Easy to paste incomplete phones | maps form `[CONFIRMED-CODE]` |
| UX-LEAD-204 | LOW | `created_at` loaded but not a table column | Hard to see recency | captures.tsx columns `[CONFIRMED-CODE]` |

## 28. Consistency Comparison

Not `CrmListShell`. Closer to a tool inbox than contacts. Filter chips similar to ticket pills but GET-only two dimensions. `[CONFIRMED-CODE]`

## 29. Functional Preservation Contract

- Keep four sources and four statuses.
- Keep CSV / URL / maps ingest contracts.
- Keep Accept/Reject for `new` only.
- Keep merge link to lead.
- Keep 200-row honesty or replace with real pagination (do not silently drop).

## 30. Design Input Contract

Purpose: triage inbound identities onto leads.
Primary goal: ingest then accept/reject.
Primary actions: Accept, Reject, three ingest submits.
Secondary: source/status chips, open lead.
Required information: identity, source, status, error, matched lead.
Required components: ingest panels, filter chips, table.
Required states: empty, pending, merged, rejected, error, processing.
Information priority: pending identity → actions → merge target.
Business-critical: accept/reject, CSV, URL, maps, Meta-sourced rows.
Must not remove: dedupe onto lead; “emails never invented” URL rule.

## 31. Open Questions / Unknowns

- Seeded capture count on local DB. `[UNKNOWN]`
- Meta form rows appear here vs webhook-only create of leads. `[UNVERIFIED]`
- Deduper match keys beyond copy. `[UNVERIFIED]`
