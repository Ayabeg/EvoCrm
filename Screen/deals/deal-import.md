# Deal import

## 1. Screen Identity

Screen ID: SCR-DEAL-004
Product area: CRM / Deals
Route: `/crm/deals/import` (plus `/crm/deals/import/{batch}` show/update/commit)
Route names: `crm.deals.import`, `crm.deals.import.store`, `crm.deals.import.show`, `crm.deals.import.update`, `crm.deals.import.commit` [CONFIRMED-CODE]
Frontend file: `resources/js/pages/crm/deals/import.tsx` (all steps)
Primary component: `DealImport`
Layout: `CrmShell` title “Import deals”. Breadcrumbs: Deals → Import.
Authentication: CRM auth group.
Permissions: UI link gated by `crm.import` on the list; controller itself does not re-check that capability in `DealImportController` (workspace + type guard on batch). [CONFIRMED-CODE] Direct URL without capability: [UNVERIFIED]
Parent navigation: none; secondary from deals list.
Entry points: Deals list **Import**.
Exit points: Back **Deals**; after complete **View deals** / **Import another file**.
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/deals/import`, `batch: null`. [CONFIRMED-BOTH]
Evidence: `Screen/_evidence/runtime-index.json`; `%TEMP%/evocrm-inertia/crm_deals_import.json`.

## 2. Purpose

CSV ingest of deals with mapping, preview counts, and commit. Match existing deals by external ID or (title + contact). Block rows with unresolved contacts/stages.

## 3. Current UX Summary

Two phases on one page: (1) file upload, (2) mapping + sample rows + commit, with polling while `processing`. Copy tells users to import contacts first. Max 10 MB. [CONFIRMED-CODE]

## 4. Screen Anatomy

- RecordBack to `/crm/deals`.
- H1 **Import deals** + helper paragraph.
- Phase A: multipart form, file input `accept=.csv,text/csv`, **Preview import**.
- Phase B: filename + row/status; **Upload another file**; count cards Create/Update/Skip/Errors; mapping table (CSV column → EvoSales field or Ignore); sample table (row, action, deal, amount, stage, contact); row errors list; **Import deals** or processing text or completed CTAs.

## 5. Data Displayed

Prop `batch` null | presented batch: id, status, filename, headers, mapping, fields, preview counts, progress counts, samples, errors. [CONFIRMED-CODE] `DealCsvImporter::present`

Mappable fields: External ID, Deal name, Amount, Currency, Close date, Pipeline, Stage, Contact email, Contact phone, Contact external ID, Company name, Owner, Source, plus `attr.{key}` custom deal attributes. [CONFIRMED-CODE] `FIELDS`

## 6. Primary Actions

- Upload CSV `POST /crm/deals/import` → redirect show.
- Update mapping `PUT /crm/deals/import/{batch}`.
- Commit `POST /crm/deals/import/{batch}/commit`.

## 7. Secondary Actions

Upload another file (fresh create URL). View deals. Update preview without committing.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT (import is the bulk path).

## 13. Pagination / Loading Strategy

No pagination. While `status === processing`, `router.reload({ only: ['batch'] })` every 2s. Commit disabled if preview created+updated === 0. Mapping PUT aborted 409 if processing or completed. [CONFIRMED-CODE]

## 14. Forms

Upload: `file` required, mimes csv/txt, max 10240 KB. Mapping: `mapping[header]` strings. Commit: empty POST.

## 15. Overlays

NOT PRESENT (page-level). Shell overlays still exist.

## 16. States

No batch (upload). Mapped preview. Processing (poll). Completed. Error rows. File validation error. Disabled commit when nothing to create/update.

## 17. Empty State

The upload panel is the empty/start state (`batch === null`). No “no files history” list. [CONFIRMED-CODE]

## 18. Error Handling

`errors.file` under input. Row errors list. Unresolved contact/stage blocked (importer). Wrong workspace/type 404. [CONFIRMED-CODE] Commit failure UX [UNVERIFIED].

## 19. Feedback

Status string + numeric progress `processed of total`. No toast in page.

## 20. Navigation Behavior

Store redirects to batch show. Mapping update redirects to show. Commit redirects to show. Completed → list.

## 21. Entity Relationships

Creates/updates Deal; resolves Contact (external_id, email, phone); optional company_name; pipeline/stage by name; owner; custom attributes. Does not create missing contacts (blocked). [CONFIRMED-CODE] `findExisting` / contact resolve.

## 22. Business Rules

- Match deal: `external_id` else `title` + `contact_id`.
- Contact resolve: external_id, else email, else phone (AlgerianPhone).
- Currency typically DZD.
- Aliases include HubSpot-ish headers (`hs_object_id`, close date, hubspot owner).
- Processing is queued (`ProcessImportBatch`).
- Contacts should be imported first (copy).

## 23. Backend Dependencies

`DealImportController`, `DealCsvImporter`, `CsvUpload`, `ImportBatch` TYPE_DEALS, `ProcessImportBatch` job, `AuditLogger`.

## 24. Frontend Dependencies

`import.tsx`, `CrmShell`, `RecordBack`, Inertia `Form`.

## 25. Responsive Behavior

`max-w-5xl` centered; mapping/sample tables `overflow-x-auto`; count grid 2 then `sm:grid-cols-4`. [CONFIRMED-CODE] Viewport [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: file `Label htmlFor="file"`; mapping table headers.
LIKELY ISSUE: polling has no live region; counts not `aria-live`.
REQUIRES MANUAL TEST: keyboard mapping selects, file picker.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-DEAL-030 | MEDIUM | Unresolved contacts block rather than create | Users must pre-import contacts | page copy + importer |
| UX-DEAL-031 | LOW | No import history index | Must bookmark batch URL | `create()` always `batch: null` |
| UX-DEAL-032 | LOW | Capability check only on list link | Direct URL may still work | controller vs `canImport` |

## 28. Consistency Comparison

Mirrors contact import (upload → map → preview → commit, 10 MB, poll). Deal-specific match keys and stage/pipeline fields.

## 29. Functional Preservation Contract

Must keep: CSV upload, mapping including aliases, preview counts, sample rows, row errors, commit, poll, contact/stage blocking, external_id or title+contact match, back to deals.

## 30. Design Input Contract

Purpose: load deals from spreadsheet.
Primary goal: map columns and import without silent bad associations.
Primary actions: preview, update mapping, import.
Required information: filename, status, create/update/skip/error counts, samples, errors.
Required states: upload, preview, processing, completed, validation error.
Business-critical: contact/stage resolution, match keys, 10 MB cap.
Must not remove: mapping step or blocking of unresolved rows.

## 31. Open Questions / Unknowns

- Whether `crm.import` is enforced by `EnforceProductPermissions` on the route. [UNKNOWN]
- Seed has no sample batch to screenshot. [UNVERIFIED]
