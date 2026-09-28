# Contact create drawer

## 1. Screen Identity

Screen ID: `OVR-CONTACT-001`
Product area: Contacts
Route: **Not a separate route.** Overlay on `GET /crm/contacts` (`crm.contacts.index`). Opened when `createOpen` is true (`$request->boolean('create')` ← `?create=1`) or when the list primary button / empty CTA runs `setDrawer(true)`. Submit: `POST /crm/contacts` (`crm.contacts.store`).
Frontend file: drawer markup lives in `resources/js/pages/crm/contacts/index.tsx`; chrome `resources/js/components/crm/create-drawer.tsx`
Primary component: `CreateDrawer` (right `Drawer`) wrapping Inertia `Form`
Layout: overlays `SCR-CONTACT-001` inside `AppLayout`
Authentication: same as list
Permissions: POST requires `crm.edit` (`ContactPolicy::create` + `EnforceProductPermissions` for `crm.*` unsafe methods). Drawer trigger is **not** capability-gated. [CONFIRMED-CODE]
Parent navigation: Contacts list primary; empty state; header Create → Contact (`OVR-SHELL-003`); command palette “Create contact” (`command-os.ts` href `/crm/contacts?create=1`); dashboard activation; company/deal “Add contact” links to `?create=1` (company add does not prefill company). [CONFIRMED-CODE]
Entry points: listed above. Runtime `GET /crm/contacts?create=1` `200` same component, `createOpen` true. [CONFIRMED-BOTH]
Exit points: Cancel / overlay dismiss; successful Create → `redirect()->route('crm.contacts.index')`; Create and add another → index with `create=1` (drawer should reopen via prop). `onSuccess` currently **always** `setDrawer(false)` even for add-another — reopen depends on full Inertia remount with `createOpen`. [CONFIRMED-CODE]
Evidence: runtime-index `?create=1`; `ContactController@store`; `index.tsx`; `create-drawer.tsx`.

## 2. Purpose

Capture a new unique person without leaving the contacts workspace.

## 3. Current UX Summary

Right sheet, `sm:max-w-md`, brand 3px stripe, title “Create contact”, “Edit this form” anchor `#edit-form` (no matching id on this form — likely dead). Fields stacked; footer Cancel, outline “Create and add another”, primary Create. [CONFIRMED-CODE]

## 4. Screen Anatomy

- `DrawerContent` side=right `data-aurora="drawer"`.
- Header: title, optional description (unused), “Edit this form”.
- Scrollable body: form fields.
- Buttons inside the form (not `CreateDrawer` `footer` prop).

## 5. Data Displayed

Company `<select>` options from list prop `companies` (`id`, `name`). Lead status options New / Open / Unqualified. No members/owner, city, wilaya in the drawer despite store validation accepting `owner_id`, `city`, `wilaya`. [CONFIRMED-CODE]

## 6. Primary Actions

Create (`POST /crm/contacts`). Create and add another (`name="add_another" value="1"`).

## 7. Secondary Actions

Cancel (`setDrawer(false)`). “Edit this form” `#edit-form`. Overlay dismiss.

## 8. Search

NOT PRESENT (company is a native select, not typeahead).

## 9. Filters

NOT APPLICABLE.

## 10. Sorting

Companies `orderBy('name')` from controller. [CONFIRMED-CODE]

## 11. Selection

NOT APPLICABLE.

## 12. Bulk Actions

NOT APPLICABLE.

## 13. Pagination / Loading Strategy

Submit `processing` disables both submit buttons. `resetOnSuccess`. No independent loading of companies (uses list payload).

## 14. Forms

POST `/crm/contacts` fields:

| Field | UI | Validation |
|---|---|---|
| `first_name` | required input, labelled First name * | required string max 120 |
| `last_name` | optional | nullable max 120 |
| `email` | type=email | nullable email |
| `phone` | placeholder `0550…` | nullable max 40; normalized Algerian E.164 |
| `company_id` | select None + companies | nullable integer |
| `lead_status` | None / new / open / unqualified | nullable max 40 |
| `add_another` | extra submit | sometimes boolean |
| `owner_id`, `city`, `wilaya` | **not in UI** | accepted by backend |

`ContactIdentity::createUnique`: duplicate phone → “A contact with this phone already exists…”; duplicate email similarly. Owner not auto-assigned. [CONFIRMED-CODE]

Lead status UI enum **does not match** list filter (`working/qualified/disqualified`) nor filter implementation (leads.status). [CONFIRMED-CODE]

## 15. Overlays

This screen **is** the overlay. Nested inside list with QuickRecord possible behind it. Global create navigates to `?create=1` rather than lifting state.

## 16. States

Closed; open from button; open from query; processing; validation errors (Inertia `errors` — **no per-field error display in the drawer JSX** except native `required`/`type=email`). [CONFIRMED-CODE]
Duplicate identity errors may not render unless a generic errors slot exists (it does not in this form). [CONFIRMED-CODE]

## 17. Empty State

Company select “None”. No empty companies helper.

## 18. Error Handling

HTML5 required on first_name. Server 403 without crm.edit. Duplicate unique validation. [CONFIRMED-CODE]
LIKELY ISSUE: server errors not bound to inputs.

## 19. Feedback

Success redirect + form reset + local close. Add-another relies on redirect `create=1`. Closing does not remove query param. [CONFIRMED-CODE]

## 20. Navigation Behavior

Always returns to contacts index (not the new record show). Does not preserve list filters in the redirect (`redirect()->route('crm.contacts.index')` only). [CONFIRMED-CODE]

## 21. Entity Relationships

Optional `company_id`. No deal/lead created. Unique on email/phone_e164.

## 22. Business Rules

- `authorize('create', Contact::class)` → crm.edit + workspace.
- Unique phone/email in workspace.
- Phone normalized via `AlgerianPhone`.
- `add_another` keeps wizard open via query, not client-only loop.

## 23. Backend Dependencies

`ContactController@store`, `ContactIdentity::createUnique`, `AlgerianPhone`.

## 24. Frontend Dependencies

`CreateDrawer`, Inertia `Form`, shadcn Drawer, Button/Input/Label, `t()`.

## 25. Responsive Behavior

Drawer `w-full sm:max-w-md`. Full-width on small screens. [CONFIRMED-CODE]
Viewport: [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: DrawerTitle; first name asterisk. [CONFIRMED-CODE]
LIKELY ISSUE: `#edit-form` dead link; no `aria-required` beyond native; duplicate errors not `role=alert`; lead status/company selects lack explicit Label `htmlFor`.
REQUIRES MANUAL TEST: focus trap, restore focus to Create button.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| UX-CONTACT-CRT-01 | HIGH | Server validation errors not shown in drawer | Duplicate phone/email feels like no-op | form JSX has no `errors.*` |
| UX-CONTACT-CRT-02 | MEDIUM | Redirect drops list query; does not open the new record | Context + confirmation loss | `store()` redirect |
| UX-CONTACT-CRT-03 | MEDIUM | No owner/city/wilaya despite Algeria-centric product | Incomplete records | form vs validate() |
| UX-CONTACT-CRT-04 | MEDIUM | Lead status options ≠ list filter options | Status unfilterable as created | select vs ListViewConfig |
| UX-CONTACT-CRT-05 | LOW | “Edit this form” `#edit-form` | Dead control | `create-drawer.tsx` |
| UX-CONTACT-CRT-06 | LOW | Create shown without crm.edit | 403 | ungated primary |
| UX-CONTACT-CRT-07 | OBSERVATION | Company create from contact drawer not offered | Extra trip to companies | company select only |

## 28. Consistency Comparison

Same `CreateDrawer` as companies/deals. Contacts uniquely have add-another and lead_status. Company drawer has no add-another in UI (backend supports it). Deals prefill `contact_id` from query; this drawer does **not** prefill `company_id` from referrer.

## 29. Functional Preservation Contract

Must keep: overlay on list not a dedicated create route; `?create=1`; POST unique identity; add-another; required first name; optional email/phone/company/lead_status; cancel; crm.edit on store.

## 30. Design Input Contract

Purpose: add a person quickly.
Primary goal: unique identity with a name and a way to reach them.
Primary actions: Create; Create and add another.
Required fields: first name.
Required components: right drawer, company select, cancel.
May NOT remove: uniqueness checks, `?create=1` contract, POST `/crm/contacts`.

## 31. Open Questions / Unknowns

- [UNKNOWN] intended record-layout “Edit this form” destination.
- [UNVERIFIED] add-another reopen after `onSuccess` close vs Inertia remount.
- [UNKNOWN] default owner should be current user (currently null).
