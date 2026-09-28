# Contact import

## 1. Screen Identity

Screen ID: `SCR-CONTACT-003`
Product area: Contacts
Route: `GET /crm/contacts/import` (upload); `GET /crm/contacts/import/{batch}` (mapping/progress)
Route names: `crm.contacts.import`, `crm.contacts.import.show` (also POST store, PUT update mapping, POST commit)
Frontend file: `resources/js/pages/crm/contacts/import.tsx`
Primary component: `ContactImport` inside `CrmShell`
Layout: `AppLayout` + `CrmShell` title “Import contacts”; breadcrumbs Contacts → Import
Authentication: auth + verified
Permissions: any `*.import*` route name requires `crm.import` (`EnforceProductPermissions`). Owner/admin default true; member false. List hides Import without capability; direct URL 403. [CONFIRMED-CODE]
Parent navigation: Contacts list secondary “Import”.
Entry points: list header; capability-gated. Not in simple-mode nav extras.
Exit points: Back to Contacts; after commit “View contacts”; “Upload another file” / “Import another file” reset to GET import (`batch: null`).
Runtime HTTP (owner, simple_mode=true): `GET /crm/contacts/import` `200` component `crm/contacts/import`, props include `batch` (null on create). [CONFIRMED-BOTH]
Evidence: runtime-index; `ContactImportController`; `ContactCsvImporter`; `import.tsx`.

## 2. Purpose

CSV ingest for contacts: upload → auto-map columns (HubSpot aliases) → preview create/update/skip/error → confirm mapping → async commit.

## 3. Current UX Summary

Centered max-w-5xl canvas. Intro: “Upload a CSV, confirm the column mapping, then import. Matching uses external ID, then email, then phone.” Phase 1: file picker + “Preview import”. Phase 2: filename, row total, status, four count cards, mapping table, sample rows (8), row errors (up to 25), commit or processing poll or completed CTAs. [CONFIRMED-CODE]

## 4. Screen Anatomy

- `CrmShell` (CRM tab chrome including Contacts/Companies — extra to app sidebar).
- `RecordBack` → `/crm/contacts`.
- Title + matching copy.
- Upload form **or** batch workspace.
- Count grid Create/Update/Skip/Errors.
- Mapping table (CSV column → EvoSales field / Ignore).
- Sample rows table.
- Row errors list.
- Primary commit / processing text / completed buttons.

## 5. Data Displayed

`batch` null | payload:

- `id`, `status`, `filename`, `headers[]`, `mapping` header→field, `fields` field→label (core + `attr.{key}` custom), `preview` counts, `progress` counts + `processed`, `samples[]` (`row_number`, `action`, `values` name/email/phone/company, `error`), `errors[]`.

Core mappable fields (`ContactCsvImporter::FIELDS`): `external_id`, `first_name`, `last_name`, `email`, `phone`, `company_name`, `owner`, `city`, `wilaya`, `source`, `lead_status`. [CONFIRMED-CODE]

Statuses used in UI: not completed/processing → mapping editable; `processing` → 2s `router.reload({ only: ['batch'] })`; `completed` → view/import another. PUT mapping abort 409 if processing or completed. [CONFIRMED-CODE]

## 6. Primary Actions

- Preview import: `POST /crm/contacts/import` multipart `file` (csv/txt, max 10240 KB).
- Update preview: `PUT /crm/contacts/import/{batch}` `mapping[header]`.
- Import contacts: `POST /crm/contacts/import/{batch}/commit` — disabled if preview created+updated === 0.
- View contacts after completion.

## 7. Secondary Actions

Upload another file (`GET /crm/contacts/import`). Back. Ignore columns.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT PRESENT. Samples `limit(8)` unspecified extra order (table id). Errors ordered by `row_number`.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT (import itself is a batch job `ProcessImportBatch`).

## 13. Pagination / Loading Strategy

No pager. Processing polls every 2s. Form `processing` disables buttons. Full-page Inertia for upload redirect to show.

## 14. Forms

1. Multipart file, required, accept `.csv,text/csv`. Helper “HubSpot exports are supported. Maximum 10 MB.” `errors.file`.
2. Mapping selects `mapping[{header}]` default suggested aliases (Record ID, hs_object_id, First name, e-mail, mobile, company, HubSpot Owner, …).
3. Commit POST no extra fields.

## 15. Overlays

NOT PRESENT beyond shell palettes.

## 16. States

No batch (upload). Uploaded/mapped (preview + mapping). Processing (poll + progress “processed of total”). Completed. Mapping 409 if already running. Empty mappable creates disables commit.

## 17. Empty State

Upload-first empty is the file form, not a dedicated empty illustration. [CONFIRMED-CODE]

## 18. Error Handling

Validation file type/size. Mapping values not in allowed fields throw ValidationException. Row errors listed. Batch workspace/type mismatch 404. Permission 403. [CONFIRMED-CODE]

## 19. Feedback

Count cards switch from preview to progress when `status === 'completed'`. Processing copy. Row action capitalize. [CONFIRMED-CODE]

## 20. Navigation Behavior

Store redirects to `crm.contacts.import.show`. Update mapping redirects show. Commit redirects show (job dispatched). Completed “View contacts” leaves wizard.

## 21. Entity Relationships

Creates/updates Contacts; may create/match Companies by `company_name`; owner by name; custom attributes `attr.*`. Match order: external_id → email → phone (page copy + importer). [CONFIRMED-CODE] [UNVERIFIED] classify() edge cases against live CSV.

## 22. Business Rules

- Type `ImportBatch::TYPE_CONTACTS` only.
- Max 10 MB.
- Cannot remap after processing/completed (409).
- Commit is no-op if already processing/completed.
- Unique identity still applies at row process time (errors recorded per row).
- Custom attribute keys allowed in mapping.

## 23. Backend Dependencies

`ContactImportController`, `ContactCsvImporter`, `CsvUpload`, `ProcessImportBatch` job, `ImportBatch` / `ImportRow` models, `CustomAttributes`, `AlgerianPhone`.

## 24. Frontend Dependencies

`CrmShell`, `RecordBack`, Inertia `Form`, `router.reload`, Button/Label.

## 25. Responsive Behavior

`grid-cols-2 sm:grid-cols-4` counts; mapping `overflow-x-auto`; max-w-5xl. [CONFIRMED-CODE]
Viewport: [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: file input labelled `htmlFor="file"`. [CONFIRMED-CODE]
LIKELY ISSUE: mapping `<select>`s have no per-row `<label>` (header text adjacent only); sample table no caption; processing status not `aria-live`.
REQUIRES MANUAL TEST: keyboard file picker, SR table.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| UX-CONTACT-IMP-01 | MEDIUM | Commit disabled when only skips/errors — cannot acknowledge a dry-run that updates nothing | User stuck besides “upload another” | `created + updated === 0` |
| UX-CONTACT-IMP-02 | MEDIUM | Only 8 sample rows / 25 errors | Large files hard to audit | `present()` limits |
| UX-CONTACT-IMP-03 | LOW | CrmShell duplicate object tabs vs app sidebar | Chrome noise | `crm-shell.tsx` |
| UX-CONTACT-IMP-04 | OBSERVATION | Polling every 2s with full Inertia reload of `batch` | Possible jank | `setInterval` 2000 |

## 28. Consistency Comparison

Deal import is a sibling wizard (`SCR-DEAL-004`). Contacts have no company import. List export is GET CSV; import is this multi-step page.

## 29. Functional Preservation Contract

Must keep: capability gate; CSV upload 10 MB; HubSpot aliases; match external id → email → phone; mapping including custom attrs; preview counts; async commit; poll; workspace isolation; back to contacts.

## 30. Design Input Contract

Purpose: bring a list of people in safely.
Primary goal: correct mapping then commit without silent duplicates.
Primary actions: upload, remap, import.
Required information: filename, status, create/update/skip/error, samples, row errors.
May NOT remove: match order copy, mapping Ignore, HubSpot support, progress while processing.

## 31. Open Questions / Unknowns

- [UNVERIFIED] company create-from-name during import on seed data.
- [UNKNOWN] queue worker required locally for `processing` to finish (user may see stuck processing if queue not run).
- [UNVERIFIED] `text/plain` MIME vs `accept` attribute mismatch.
