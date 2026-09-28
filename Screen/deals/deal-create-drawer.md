# Deal create drawer

## 1. Screen Identity

Screen ID: OVR-DEAL-001
Product area: CRM / Deals
Route: Overlay on `/crm/deals` and `/crm/deals/board`. Opened by `?create=1` (list) or local state (board). Submit `POST /crm/deals` (`crm.deals.store`).
Route name: `crm.deals.store` [CONFIRMED-CODE]
Frontend file: `resources/js/pages/crm/deals/index.tsx` (full form); `resources/js/pages/crm/deals/board.tsx` (subset). Shared chrome `resources/js/components/crm/create-drawer.tsx`.
Primary component: `CreateDrawer` + Inertia `Form`
Layout: Right drawer `side="right"` `data-aurora="drawer"` `sm:max-w-md` over the deals workspace.
Authentication: same as parent screens.
Permissions: `DealPolicy::create` = workspace + `crm.edit`. [CONFIRMED-CODE]
Parent navigation: N/A (overlay).
Entry points: **Create deal** on list/board; empty states; `/crm/deals?create=1`; `/crm/deals?create=1&contact_id=`; command palette / create menu `href: /crm/deals?create=1`; contact show add deal; dashboard New deal; quotes empty-state “Create a deal”; ticket/lead links. [CONFIRMED-CODE]
Exit points: Cancel / overlay dismiss; success redirect list (or list with `create=1` if add another).
Runtime HTTP (owner, simple_mode=true): parent list **200** with `createOpen` when `?create=1`. [CONFIRMED-BOTH] Drawer DOM itself not screenshot-crawled. [UNVERIFIED]
Evidence: `Screen/_evidence/runtime-index.json` `/crm/deals?create=1`; `%TEMP%/evocrm-inertia/crm_deals_create_1.json`; `DealsDrawerTest.php`.

## 2. Purpose

Quick-create an opportunity with name, DZD amount, close date, optional contact, stage, current pipeline.

## 3. Current UX Summary

Thin right sheet, brand stripe on header, title **Create deal**, “Edit this form” `#edit-form` link. List form is richer than board form.

## 4. Screen Anatomy

Header: title, optional description, **Edit this form**.
Body:
- Deal name * (required)
- Amount (DZD) number min 0 step 0.01 (`amount_dzd`)
- Close date
- Contact select (list only): “New from deal name” or existing contacts; `defaultValue={prefillContactId}`
- Stage select (all pipeline stages)
- hidden `pipeline_id`
Footer in form: Cancel; list also **Create and add another** (`add_another=1`); **Create**.

Board omits contact, add-another, and prefill.

## 5. Data Displayed

Uses parent props: `contacts`, `stages`, `pipeline`, `createOpen`, `prefillContactId`. No dedicated Inertia page. [CONFIRMED-CODE]

## 6. Primary Actions

Submit Create → `POST /crm/deals`. Create and add another (list).

## 7. Secondary Actions

Cancel. Edit this form (non-functional hash). Dismiss overlay.

## 8. Search

NOT PRESENT inside drawer (contact is a `<select>`, not combobox). [CONFIRMED-CODE]

## 9. Filters

NOT APPLICABLE.

## 10. Sorting

Contacts ordered `first_name` on the parent index query. [CONFIRMED-CODE]

## 11. Selection

NOT APPLICABLE.

## 12. Bulk Actions

NOT APPLICABLE.

## 13. Pagination / Loading Strategy

Submit `processing` disables buttons. `resetOnSuccess`; list `onSuccess` closes drawer (then redirect unmounts). [CONFIRMED-CODE]

## 14. Forms

Validated server-side: title required max 180; amount_cents or amount_dzd; stage_id; pipeline_id; owner_id; source; type; priority; close_date; next_step; contact_id / contact_name; add_another. UI does not expose owner, source, type, priority, next_step, contact_name. [CONFIRMED-CODE]

Amount: DZD × 100 → cents.

If no contact_id: split `contact_name` or use title as first_name; source `deal`.

Default stage if omitted: pipeline `new`. Gate `assertCanEnter` before save. Initial model construction sets stage to `new` then overwrites after gate. [CONFIRMED-CODE]

Success: redirect `crm.deals.index` or with `create=1`.

## 15. Overlays

This document **is** the overlay. Nested: none.

## 16. States

Closed; open from button; open from query; processing; validation errors on fields [UNVERIFIED] visual; board vs list field sets.

## 17. Empty State

NOT APPLICABLE (drawer). If contacts list empty, only “New from deal name”. [CONFIRMED-CODE]

## 18. Error Handling

403 without `crm.edit`. 422 from StagePropertyGate if creating directly into a gated stage. Inertia Form error bag. [CONFIRMED-CODE]

## 19. Feedback

Drawer closes on success then full list visit. No toast in form.

## 20. Navigation Behavior

Always lands on **list**, even if opened on board (UX-DEAL-010). Add another keeps drawer intent via query.

## 21. Entity Relationships

Creates Deal + possibly Contact; copies company_id from contact; stage/pipeline; owner = current user unless owner_id posted (UI does not post owner_id).

## 22. Business Rules

- `crm.edit` required.
- Currency DZD.
- Source default `manual`.
- StagePropertyGate applies on create, not only move.
- Prefill contact from URL `contact_id`.

## 23. Backend Dependencies

`DealController::store`, `PipelineManager`, `ContactIdentity`, `StagePropertyGate`, `DealPolicy::create`.

## 24. Frontend Dependencies

`CreateDrawer`, list/board pages, `command-os.ts` create-deal, dashboard header `New deal`.

## 25. Responsive Behavior

Full width on small screens, `sm:max-w-md`. [CONFIRMED-CODE] Viewport [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: labels; required asterisk on name; native required on title.
LIKELY ISSUE: contact/stage are native selects without combobox search; “Edit this form” unclear; no `aria-modal` inspection of Drawer primitive (shadcn Drawer usually dialog).
REQUIRES MANUAL TEST: focus trap, ESC, return focus to Create button.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-DEAL-040 | MEDIUM | Board and list forms differ | Contact cannot be chosen from board | board.tsx vs index.tsx |
| UX-DEAL-041 | MEDIUM | Success from board goes to list | Context loss | store redirect |
| UX-DEAL-042 | LOW | Dead “Edit this form” | Trust | `#edit-form` |
| UX-DEAL-043 | LOW | No owner/priority/next_step in UI | Extra edit later | store vs form fields |
| UX-DEAL-044 | LOW | Contact picker does not search | Pain with many contacts | `<select>` |

## 28. Consistency Comparison

Same `CreateDrawer` as contacts/companies/quotes. Quotes create requires an existing deal; deal create can spawn a contact.

## 29. Functional Preservation Contract

Must keep: POST `/crm/deals`; required title; DZD amount; close date; stage; pipeline hidden; list contact + prefill; add another; `?create=1`; command-palette href; StagePropertyGate; DZD→cents.

## 30. Design Input Contract

Purpose: capture a new opportunity in seconds.
Primary goal: name + amount + stage on the current pipeline.
Primary action: Create.
Secondary: add another, pick contact.
Required fields: title; optional amount, close, contact, stage.
Required states: open/closed/processing/error.
Must not remove: query-open, contact prefill, pipeline id, DZD.

## 31. Open Questions / Unknowns

- Whether record layouts customize this form (`#edit-form` implies yes). [UNKNOWN]
- Owner assignment from UI elsewhere at create time. [UNKNOWN]
