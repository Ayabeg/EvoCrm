# Company detail

## 1. Screen Identity

Screen ID: `SCR-COMPANY-002`
Product area: Companies
Route: `GET /crm/companies/{company}`
Route name: `crm.companies.show`
Frontend file: `resources/js/pages/crm/companies/show.tsx`
Primary component: `CompanyShow`
Layout: `AppLayout`; breadcrumbs Companies → Company (`href: '#'`)
Authentication: auth + verified
Permissions: workspace 404. Update `crm.edit`. Ask POST blocked in simple mode; panel hidden. Enrich allowed. Attributes PUT **route exists** (`crm.companies.attributes`) but **`CompanyController` has no `updateAttributes` method** (only Contact/Deal implement it). Saving attributes is [BROKEN] (missing action). [CONFIRMED-CODE]
Parent navigation: companies list; related links from contacts/deals.
Entry points: list/peek; contact company association; seed `/crm/companies/1`.
Exit points: Back to Companies; contact/deal links; add contact `?create=1`; Ask Evo; settings attributes.
Runtime HTTP (owner, simple_mode=true): `200` `crm/companies/show`. Props: `company`, `selected`, `associations`, `timeline`, `attributes`, `members`, `cities`, `wilayas`, `askEvo`, `enrichmentRuns`, `enrichAction`. [CONFIRMED-BOTH]
Evidence: runtime-index; `CompanyController@show`; `show.tsx`; route vs controller methods.

## 2. Purpose

Account hub: identity, location, owner, related people and deals, activity log, enrichment, optional Ask Evo, inline edit of core fields.

## 3. Current UX Summary

Header: Back + `RecordIdentity` in the **header** (title, kind Company, subtitle domain · location · owner) + `RecordActions` (no contactId so WhatsApp still, More: Add contact not Create deal) + Edit toggle. Body three panels: Company information facts, enrichment, optional edit form, attributes | Activity (no catch-up) | Ask Evo, empty DeskThreadCard, Contacts, Deals. [CONFIRMED-CODE]

## 4. Screen Anatomy

- Header identity (unlike contact, identity is not in the left column).
- Left: facts Domain/Phone/Industry/Owner/Location; EnrichmentPanel; Edit company form when `editing`; RecordProperties.
- Center: RecordActivityPanel `companyId` only — no catchUp, no highlights.
- Right: AskEvoPanel (simple mode off), DeskThreadCard **with no thread prop**, Contacts association (add `/crm/contacts?create=1` **does not pass company_id**), Deals (no addHref).

`selected` prop aliased to company, unused in component. [CONFIRMED-CODE]

## 5. Data Displayed

Company: name, domain, industry, phone, city, wilaya, country, owner, owner_id. Location join city · wilaya · country.

Associations: contacts (first/last), deals (title, stage name). Threads/enrollments flattened in hub payload unused. `loadCount('contacts')` unused in UI. [CONFIRMED-CODE]

Timeline: activities where `company_id` matches, last 80. No catch-up (catchUp requires a contact).

## 6. Primary Actions

Edit / Close edit. Save company (`PUT /crm/companies/{id}`). Record actions: Note/Email/Call/Task/Meet, WhatsApp `/inbox`, More Add contact. Enrich POST. Ask Evo POST (feature). Save attributes PUT (broken).

## 7. Secondary Actions

Back. Open contacts/deals. Add contact (unbound). Manage attributes link.

## 8. Search

NOT PRESENT.

## 9. Filters

Activity tabs/chips in center panel only.

## 10. Sorting

NOT APPLICABLE. Related lists unordered beyond eager load.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

`SkeletonRecord` while Inertia loading. Related lists unpaginated.

## 14. Forms

Edit (when toggled): name required, domain, phone, city select, wilaya select, owner_id (Unassigned + members). **Missing vs backend:** industry, notes. Country not editable (create sets DZ). [CONFIRMED-CODE]

Attributes form posts to `/crm/companies/{id}/attributes` — method missing on controller → Laravel error. [BROKEN]

Activity composers with `companyId`.

## 15. Overlays

Ask Evo mobile trigger; More dropdown; shell create/peek.

## 16. States

Loading; view; editing; no contacts; no deals; no Ask Evo (simple mode); attributes empty → Manage attributes; enrichment history.

## 17. Empty State

“No contacts” / “No deals”. Desk thread empty. [CONFIRMED-CODE]

## 18. Error Handling

404 workspace. Update validation. Attributes save [BROKEN]. Ask 403 simple mode. [CONFIRMED-CODE]

## 19. Feedback

Save company Inertia `back()`. No explicit success toast. Enrichment badges.

## 20. Navigation Behavior

Back `/crm/companies` drops filters. Add contact does not attach this company. Deals have no create-from-company URL (contact detail does). [CONFIRMED-CODE]

## 21. Entity Relationships

Company has many contacts and deals; owner user; activities; enrichment runs; custom attributes. Threads via contacts (not shown).

## 22. Business Rules

Workspace 404. Update authorize crm.edit. Attributes on update() also accept `attributes` array on the main PUT — so custom values **can** save through the unused update path if included; the dedicated attributes form is the broken one. [CONFIRMED-CODE]

## 23. Backend Dependencies

`CompanyController@show|update` (missing `updateAttributes`), `CrmHub::companyAssociations|timeline|attributeBag`, `RecordInsight::forCompany`, `EnrichmentService`, cities/wilayas config.

## 24. Frontend Dependencies

Same record hub kit as contacts minus playbooks, catch-up, tickets, engagement.

## 25. Responsive Behavior

Same AdaptiveWorkspaceShell breakpoints. Identity subtitle may truncate. Edit fields full width stacked. [CONFIRMED-CODE]
Viewport: [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: Edit `aria-expanded`; Record actions toolbar; Ask Evo labels. [CONFIRMED-CODE]
LIKELY ISSUE: edit selects without `<Label>`; industry displayed but not editable so SR users see stale facts while editing other fields.
REQUIRES MANUAL TEST: edit toggle focus.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| UX-COMPANY-DET-01 | BLOCKER | Attributes PUT target has no controller method | Save attributes crashes | route vs `CompanyController` |
| UX-COMPANY-DET-02 | HIGH | Add contact does not pass `company_id` | New people not linked | addHref `/crm/contacts?create=1` |
| UX-COMPANY-DET-03 | MEDIUM | Industry/notes not in edit form | Cannot maintain fields shown/accepted | form vs validate |
| UX-COMPANY-DET-04 | MEDIUM | No create-deal from company; More lacks Create deal (needs contactId) | Extra hops | RecordActions |
| UX-COMPANY-DET-05 | LOW | DeskThreadCard empty always | Dead chrome | `<DeskThreadCard />` |
| UX-COMPANY-DET-06 | LOW | Back drops list query | Context loss | RecordBack |
| UX-COMPANY-DET-07 | OBSERVATION | `selected` duplicate prop | Noise | controller |

## 28. Consistency Comparison

Contact hub puts identity in left column and has playbooks/catch-up/tickets/engagement/kanban payload. Company puts identity in header and offers core Edit — the inverse of contact (which cannot edit core fields). Both share RecordShell.

## 29. Functional Preservation Contract

Must keep: show URL, workspace 404, header identity, facts, edit toggle + PUT core fields, related contacts/deals, timeline, enrichment, Ask Evo when featured, members/cities/wilayas for edit, back to list.

## 30. Design Input Contract

Purpose: operate one account.
Primary goal: confirm location/owner and jump to people/deals.
Primary actions: Edit/save, log activity, open related, enrich.
Required information: name, domain, phone, industry, owner, location, related contacts/deals, timeline.
May NOT remove: edit of name/domain/phone/city/wilaya/owner, related lists.

## 31. Open Questions / Unknowns

- [UNKNOWN] whether `updateAttributes` was omitted accidentally (Deal/Contact have it).
- [UNVERIFIED] notes field usage elsewhere.
- [UNKNOWN] intended deal create URL from a company.
