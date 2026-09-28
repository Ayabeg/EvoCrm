# Company create drawer

## 1. Screen Identity

Screen ID: `OVR-COMPANY-001`
Product area: Companies
Route: **Not a separate route.** Overlay on `GET /crm/companies`. `createOpen` from `?create=1` (`$request->boolean('create')`). Submit `POST /crm/companies` (`crm.companies.store`).
Frontend file: `resources/js/pages/crm/companies/index.tsx` + `create-drawer.tsx`
Primary component: `CreateDrawer` title “Create company”
Layout: overlays `SCR-COMPANY-001`
Authentication: same as list
Permissions: POST `crm.edit`. Trigger not gated. [CONFIRMED-CODE]
Parent navigation: list primary/empty CTA; header Create → Company; command “Create company” `/crm/companies?create=1`; contact hub “Add” when no company.
Entry points: those links. Runtime index crawled `/crm/companies` 200 with `createOpen` key; `?create=1` for companies **not** in runtime-index — [CONFIRMED-CODE] same boolean as contacts; [UNVERIFIED] HTTP crawl of companies `?create=1`.
Exit points: Cancel/dismiss; success redirect index (or index `create=1` if `add_another` — **UI has no add-another button**). `onSuccess` closes drawer. [CONFIRMED-CODE]
Evidence: `CompanyController@store`; `companies/index.tsx`.

## 2. Purpose

Create an Algerian account (country forced `DZ`) from the companies workspace without a dedicated create URL.

## 3. Current UX Summary

Right drawer, fields Name *, Domain, City select (None + `cities`), Cancel + Create. No industry, phone, wilaya, owner, add-another in UI. “Edit this form” `#edit-form` dead. [CONFIRMED-CODE]

## 4. Screen Anatomy

Same CreateDrawer chrome as contacts. Form `space-y-3`. Buttons in form, not footer slot.

## 5. Data Displayed

`cities` options from `config('evosales.cities')`. Members/wilayas available on the page but unused in this form. [CONFIRMED-CODE]

## 6. Primary Actions

Create POST.

## 7. Secondary Actions

Cancel. Dead “Edit this form”. Dismiss.

## 8. Search

NOT PRESENT (city is a long native select).

## 9. Filters

NOT APPLICABLE.

## 10. Sorting

Cities as config array order. [UNKNOWN] config sort.

## 11. Selection

NOT APPLICABLE.

## 12. Bulk Actions

NOT APPLICABLE.

## 13. Pagination / Loading Strategy

`processing` disables Create. `resetOnSuccess`.

## 14. Forms

| Field | UI | Backend validation |
|---|---|---|
| `name` | required | required string max 180 |
| `domain` | optional | nullable max 180 |
| `city` | select | nullable max 120 |
| `industry` | **absent** | nullable max 120 |
| `phone` | **absent** | nullable max 40 |
| `wilaya` | **absent** | nullable max 80 |
| `owner_id` | **absent** | nullable integer |
| `add_another` | **absent** | sometimes boolean |

Create always sets `workspace_id` and `country => 'DZ'`. No uniqueness check on name/domain. [CONFIRMED-CODE]

No per-field Inertia error display. [CONFIRMED-CODE]

## 15. Overlays

This overlay. May stack over list peek theoretically if both opened — [UNKNOWN] z-index.

## 16. States

Closed; open; processing; validation (native required name only).

## 17. Empty State

City “None”. No helper if cities config empty.

## 18. Error Handling

403 without crm.edit. HTML5 name required. Server errors not bound. [CONFIRMED-CODE]

## 19. Feedback

Redirect to companies index (filters dropped). Drawer closes.

## 20. Navigation Behavior

Does not visit the new company show. Contact “Add company” lands here without linking the contact (contact create would need company_id the other way). [CONFIRMED-CODE]

## 21. Entity Relationships

Standalone Company. Owner null unless provided. No contact created.

## 22. Business Rules

- crm.edit + workspace.
- Country DZ hardcoded.
- Duplicate names allowed.
- add_another supported by server, unused in UI.

## 23. Backend Dependencies

`CompanyController@store`, Company model.

## 24. Frontend Dependencies

`CreateDrawer`, Inertia Form, Input/Label/Button, cities prop.

## 25. Responsive Behavior

`w-full sm:max-w-md` right drawer. [CONFIRMED-CODE]
Viewport: [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: Name labelled with asterisk. [CONFIRMED-CODE]
LIKELY ISSUE: Domain/City labels not `htmlFor`; dead edit-form link; no live error region.
REQUIRES MANUAL TEST: focus trap.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| UX-COMPANY-CRT-01 | HIGH | Wilaya/phone/industry/owner omitted | Incomplete accounts vs detail facts | form vs `store()` |
| UX-COMPANY-CRT-02 | MEDIUM | No add-another while contacts have it and API supports it | Extra reopen | index.tsx vs validate add_another |
| UX-COMPANY-CRT-03 | MEDIUM | Success does not open the company | Confirmation weak | redirect index |
| UX-COMPANY-CRT-04 | MEDIUM | Contact hub Add company does not associate the contact | Manual second edit | contact show addHref |
| UX-COMPANY-CRT-05 | LOW | `#edit-form` | Dead | create-drawer |
| UX-COMPANY-CRT-06 | LOW | Duplicate names allowed with no warning | Duplicate accounts | no unique rule |
| UX-COMPANY-CRT-07 | OBSERVATION | Simple mode Create menu still offers Company | Orphan from rail | header vs SIMPLE_NAV |

## 28. Consistency Comparison

Thinner than contact drawer (3 fields vs 6 + add-another). Same chrome. Deals drawer can prefill contact_id; this cannot prefill from a contact.

## 29. Functional Preservation Contract

Must keep: overlay on `/crm/companies` not a create route; `?create=1`; POST name required; optional domain/city; country DZ; crm.edit; cancel.

## 30. Design Input Contract

Purpose: add an account quickly.
Primary goal: a named company, preferably with city.
Primary action: Create.
Required information: name.
Required components: right drawer, city select from config.
May NOT remove: `?create=1` contract, POST `/crm/companies`.

## 31. Open Questions / Unknowns

- [UNKNOWN] whether domain should be unique.
- [UNVERIFIED] companies `?create=1` runtime (code equivalent to contacts).
- [UNKNOWN] record-layout “Edit this form” target.
