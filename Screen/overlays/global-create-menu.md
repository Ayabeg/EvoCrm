# Global Create menu

## 1. Screen Identity

Screen ID: `OVR-SHELL-003`
Product area: Shell overlays
Route: Not a route. Items visit list pages with `?create=1`.
Route name: List routes `crm.contacts.index` etc. (query `create=1` is a page prop, not a named route)
Frontend file: `resources/js/components/app-sidebar-header.tsx` (inline `DropdownMenu`)
Primary component: Header Create `DropdownMenu`
Layout: shadcn dropdown `align="end" className="w-44"` from the primary Create button
Authentication: Authenticated shell
Permissions: Quote item only if `canCreateQuote(capabilities)` → `crm.edit`. Contact/Company/Deal always shown.
Parent navigation: Topbar (`SCR-SHELL-003`)
Entry points: Create button (Plus; label visible `sm+`)
Exit points: Each item is an Inertia `Link`
Runtime HTTP (owner, simple_mode=true): `/crm/contacts?create=1` 200 component `crm/contacts/index` with `createOpen` in props; `/crm/deals?create=1` 200 similarly. Company/quote create URLs not separately listed in the index snippet but same pattern exists in code. `[CONFIRMED-BOTH]`
Evidence: `app-sidebar-header.tsx`, `resources/js/lib/command-os.ts` `canCreateQuote`, runtime-index `/crm/contacts?create=1`.

## 2. Purpose

Fast path to open the existing create drawer on a list room without using Command OS.

## 3. Current UX Summary

Primary filled button “Create”. Menu: Contact, Company, Deal, optional Quote. No Task, no Ticket, no Lead, no Company hidden in simple mode even though Companies is off the rail.

## 4. Screen Anatomy

Trigger: `Button variant="default"` `aria-label={t('Create')}`. Content `DropdownMenuItem asChild` + `Link`.

## 5. Data Displayed

Labels via `t('Contact'|'Company'|'Deal'|'Quote')`. No descriptions, shortcuts, or icons in the menu (Plus only on the trigger).

## 6. Primary Actions

Navigate to:

- `/crm/contacts?create=1`
- `/crm/companies?create=1`
- `/crm/deals?create=1`
- `/crm/quotes?create=1` (if `crm.edit`)

## 7. Secondary Actions

None. Keyboard via dropdown primitive.

## 8. Search

NOT PRESENT (Command OS Create section is the searchable analog).

## 9. Filters

NOT PRESENT.

## 10. Sorting

Fixed order Contact → Company → Deal → Quote.

## 11. Selection

NOT APPLICABLE.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Inertia visit to the list; the list page is responsible for opening its create drawer from `createOpen` / query.

## 14. Forms

NOT PRESENT in the menu. Drawers on destination pages own the forms.

## 15. Overlays

This dropdown. Destination pages then open create drawers (`OVR-CONTACT-001` etc., documented elsewhere).

## 16. States

Quote missing when no `crm.edit`. Button always enabled (no capability to hide the whole control).

## 17. Empty State

NOT APPLICABLE (at least three items always).

## 18. Error Handling

If the user lacks create permission, the list page/drawer should 403 or hide — `[UNVERIFIED]` for a member role. Simple mode does not block company/quote URLs.

## 19. Feedback

None in the menu. Drawers provide validation.

## 20. Navigation Behavior

Same-tab Inertia. Simple-mode users land on Companies list even though it is not in SIMPLE_NAV.

## 21. Entity Relationships

Creates a new contact/company/deal/quote in the current workspace (server-side on submit of the destination drawer).

## 22. Business Rules

- Query flag `create=1` is the contract with list pages (`createOpen` on contacts crawl).
- Quote gated; others not.
- Command OS additionally offers “Log activity” and gates **all** creates on `crm.edit`.

## 23. Backend Dependencies

List GET handlers that read `create` query. No dedicated create-menu endpoint.

## 24. Frontend Dependencies

shadcn dropdown, Inertia Link, `t()`, `canCreateQuote`.

## 25. Responsive Behavior

Trigger shrinks to icon-only below `sm`. Menu width 11rem. `NOT VERIFIED` on touch.

## 26. Accessibility Observations

**CONFIRMED:** trigger `aria-label` Create; items are links.

**LIKELY ISSUE:** no keyboard shortcut shown; Company in simple mode is surprising; items not disabled when unauthorized.

**REQUIRES MANUAL TEST:** arrow keys, typeahead.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| CRT-001 | MEDIUM | Company create promoted while Companies is off the simple rail | IA inconsistency | SIMPLE_NAV vs menu |
| CRT-002 | MEDIUM | Permission gate weaker than Command OS | Members might see items they cannot submit | header vs `commandCreateItems` |
| CRT-003 | LOW | No Task/Lead despite those objects existing | Users go to rooms instead | menu items |

## 28. Consistency Comparison

Command Create: Contact, Company, Deal, Quote, Log activity — all `crm.edit`. Record drawers are the actual editors. Settings has no create analog.

## 29. Functional Preservation Contract

- Keep the four destinations and `?create=1` contract.
- Keep Quote capability check.
- Keep Create as a visible primary button in the topbar.

## 30. Design Input Contract

Purpose: start a new CRM object.
Primary goal: open the correct create drawer.
Primary actions: Contact, Company, Deal, Quote.
Required information: capability for quotes.
Required components: primary button, dropdown, links.
Required states: quote hidden.
Must not remove: the four hrefs or the query flag.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` seed owner `crm.edit` (Quote visibility on this database).
- `[UNVERIFIED]` `/crm/companies?create=1` and `/crm/quotes?create=1` HTTP in the crawl (contacts/deals confirmed).
