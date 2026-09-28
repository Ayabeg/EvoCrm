# Contact merge

## 1. Screen Identity

Screen ID: `SCR-CONTACT-005`
Product area: Contacts
Route: `GET /crm/contacts/merge/{survivor}/{absorbed}`
Route name: `crm.contacts.merge.show`
Commit: `POST /crm/contacts/merge` (`crm.contacts.merge.store`)
Frontend file: `resources/js/pages/crm/contacts/merge.tsx`
Primary component: `ContactMerge` in `CrmShell`
Layout: `AppLayout` + CrmShell title “Merge contacts”; breadcrumbs Contacts → Duplicates → Merge (Merge crumb href incorrectly points at `/crm/contacts/duplicates`, not the current merge URL). [CONFIRMED-CODE]
Authentication: auth + verified
Permissions: `.merge` in route name → `crm.merge`. Direct GET without permission 403. [CONFIRMED-CODE]
Parent navigation: Duplicates screen merge links. No list-level “Merge” button. **`GET /crm/contacts/merge` is 404** (no index merge). [CONFIRMED-BOTH]
Entry points: `SCR-CONTACT-004` only in product UI (`UNREACHABLE` by guessing `/merge` without ids).
Exit points: Cancel → duplicates; success → `crm.contacts.show` survivor; Back “Duplicates”.
Runtime HTTP: `/crm/contacts/merge` `404`. Pair route not in runtime-index (no seed pair crawled). [CONFIRMED-BOTH] for 404; pair show [CONFIRMED-CODE] [UNVERIFIED] HTTP 200 on seed without known ids.
Evidence: runtime-index 404; `ContactMergeController`; `merge.tsx`; `ContactMerger::merge`.

## 2. Purpose

Choose field-by-field surviving values, reassign child records from absorbed → survivor, delete absorbed after clearing unique identity fields.

## 3. Current UX Summary

Comparison table: Field | survivor name | absorbed name. Each row two radios; survivor default checked; absorbed radio disabled if empty. Footer Merge contacts + Cancel. Copy: “{absorbed} will be merged into {survivor}.” [CONFIRMED-CODE]

## 4. Screen Anatomy

- RecordBack to duplicates.
- H1 + explanation.
- POST form hidden `survivor_id`, `absorbed_id`.
- Field table.
- Buttons.

## 5. Data Displayed

`present()`: id, first_name, last_name, display_name, email, phone, phone_e164, city, wilaya, source, lead_status, external_id, company_id, company (name), owner_id.

UI FIELDS: first_name, last_name, email, phone, city, wilaya, source, lead_status, external_id, company (posted as `values[company_id]`). **Owner not in the table** despite `owner_id` in payload and allowed merge attributes. `phone_e164` shown only if bound to `phone` key (field key `phone` uses `contact.phone` not e164). [CONFIRMED-CODE]

## 6. Primary Actions

Submit Merge contacts → POST `/crm/contacts/merge`.

## 7. Secondary Actions

Cancel / Back to duplicates. No swap-survivor control (would need the inverse URL).

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

Per-field radio selection of survivor vs absorbed value. Default all survivor. Empty absorbed disabled so user cannot “choose blank” from absorbed; they can still keep survivor blank by leaving default. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT (pairwise only).

## 13. Pagination / Loading Strategy

Single form; `processing` disables submit. Redirect to survivor show after merge.

## 14. Forms

POST fields: `survivor_id`, `absorbed_id` (must differ), `values.*` nullable with max lengths; email validated if present; company_id/owner_id integers.

`ContactMerger` reassigns deals, leads, activities, messages, outbound messages, workflow executions, enrollments, threads; clears absorbed email/phone/phone_e164/whatsapp_jid/external_id; fills survivor from values; records activity type `merge` + audit `contact.merged`; deletes absorbed. If phone chosen, `phone_e164` set null (renormalize expected later). [CONFIRMED-CODE]

Same contact or cross-workspace: 404 / validation.

## 15. Overlays

NOT PRESENT.

## 16. States

Valid pair; 404 if same ids or foreign workspace. Processing. Validation errors [UNVERIFIED] display on this page (no explicit `errors` UI in merge.tsx).

## 17. Empty State

NOT APPLICABLE (404 instead of empty).

## 18. Error Handling

404 survivor=absorbed or workspace mismatch. Validation `absorbed_id` different. Merge inside DB transaction. [CONFIRMED-CODE]
No confirm dialog (“are you sure”). [CONFIRMED-CODE]

## 19. Feedback

Redirect to survivor record; merge activity appears on timeline. No success toast coded on merge.tsx. [CONFIRMED-CODE]

## 20. Navigation Behavior

GET pair → form. POST → show survivor. Cancel → duplicates. Breadcrumb “Merge” does not deep-link the pair. [CONFIRMED-CODE]

## 21. Entity Relationships

`ContactMerger::reassign` moves: Deal, Lead, Activity, Message, OutboundMessage, WorkflowExecution, Enrollment (deduping same sequence), Thread (merge messages if same channel), CustomAttributeValue (survivor keys win), Segment memberships. Quotes follow deals. **Tickets `contact_id` is not updated in `reassign`.** [CONFIRMED-CODE]

## 22. Business Rules

- Both contacts must belong to the actor workspace and be distinct.
- Absorbed unique identity cleared then row deleted.
- Chosen `values` overwrite survivor; empty keys skipped (survivor keeps existing).
- Choosing a phone sets `phone_e164` null on survivor (re-normalize not done in merger).
- Duplicate enrollments on the same sequence are deleted from absorbed before reassign.
- Same-channel threads collapse onto survivor thread.
- Audit event `contact.merged`; activity type `merge`.
- `GET /crm/contacts/merge` without ids is not a route (404).

## 23. Backend Dependencies

`ContactMergeController@show|store`, `ContactMerger`, `ActivityRecorder`, `AuditLogger`, Contact model `displayName()`.

## 24. Frontend Dependencies

`CrmShell`, `RecordBack`, Inertia `Form`/`Link`, Button.

## 25. Responsive Behavior

Table in overflow-hidden rounded border; no dedicated mobile stacked comparison. Buttons wrap. [CONFIRMED-CODE]
Viewport: [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: radios inside `<label>`. [CONFIRMED-CODE]
LIKELY ISSUE: table has no caption; no `fieldset`/`legend` per field; disabled absorbed radios not explained; no confirm dialog.
REQUIRES MANUAL TEST: keyboard radio group, SR announcement of irreversible delete.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| UX-CONTACT-MRG-01 | HIGH | Tickets not reassigned | Orphan tickets on deleted contact | `reassign()` has no Ticket update |
| UX-CONTACT-MRG-02 | HIGH | No confirmation; absorbed deleted | Accidental data loss | `merge.tsx` + `$absorbed->delete()` |
| UX-CONTACT-MRG-03 | MEDIUM | Owner not choosable in UI | Owner silently stays on survivor | FIELDS vs `owner_id` allowed |
| UX-CONTACT-MRG-04 | MEDIUM | Cannot swap survivor without new URL | Users must return to duplicates | GET pair order |
| UX-CONTACT-MRG-05 | MEDIUM | Phone merge nulls `phone_e164` | Phone match/WhatsApp until later normalize | `survivorAttributes` |
| UX-CONTACT-MRG-06 | LOW | Merge breadcrumb href is duplicates | Wrong current-page crumb | `ContactMerge.layout` |
| UX-CONTACT-MRG-07 | OBSERVATION | Bare `/crm/contacts/merge` 404 | Runtime crawlers / guessed URLs fail | runtime-index |

## 28. Consistency Comparison

Only contact merge exists (no company merge). Unlike list drawers, this is a full page. Irreversible vs bulk delete which is also POST without confirm in bulk bar.

## 29. Functional Preservation Contract

Must keep: pair GET URL, POST `/crm/contacts/merge`, field radios, default survivor values, `crm.merge` gate, reassignment of deals/leads/activities/messages/threads/enrollments/attributes/segments, audit+timeline, redirect to survivor, 404 on same-id/cross-workspace, 404 on `/crm/contacts/merge`.

## 30. Design Input Contract

Purpose: resolve two people into one.
Primary goal: pick surviving field values then merge.
Primary action: Merge contacts.
Secondary: Cancel.
Required information: both display names and all listed fields.
Business-critical: irreversible delete, child reassignment, identity uniqueness after merge.
May NOT remove: pair ids, per-field choice, duplicates back path.

## 31. Open Questions / Unknowns

- [UNKNOWN] Ticket (and any other FK) leakage after merge in production data.
- [UNVERIFIED] live GET 200 for a real pair on this seed.
- [UNKNOWN] whether phone is re-normalized on next contact save.
- [UNVERIFIED] validation error rendering when email invalid on POST.
