# Contact detail

## 1. Screen Identity

Screen ID: `SCR-CONTACT-002`
Product area: Contacts
Route: `GET /crm/contacts/{contact}`
Route name: `crm.contacts.show`
Frontend file: `resources/js/pages/crm/contacts/show.tsx`
Primary component: `ContactShow` → `RecordPageFrame` + `RecordShell` (`AdaptiveWorkspaceShell`)
Layout: `AppLayout`; breadcrumbs Contacts → Contact (`href: '#'` for current)
Authentication: auth + verified + product middleware
Permissions: workspace match or 404 (`abort_unless` workspace_id). Updates require `crm.edit` (`ContactPolicy::update`). Ask/draft-email POSTs additionally blocked in simple mode (`SimpleMode::blocks()`). Enrich POST is not in that block list. [CONFIRMED-CODE]
Parent navigation: Contacts list; command search results; peek “open”; related links from deals/companies/inbox.
Entry points: list identity link; peek; `/crm/contacts/1` (seed). After merge redirect.
Exit points: Back to Contacts; company/deal/ticket links; WhatsApp/inbox; create deal `?create=1&contact_id=`; sequences/campaigns/segments; settings attributes.
Runtime HTTP (owner, simple_mode=true): `200` component `crm/contacts/show`. Prop keys include `contact`, `associations`, `timeline`, `catchUp`, `attributes`, `playbooks`, `companies`, `members`, `askEvo`, `contactEngagement`, `proactiveSummary`, `enrichmentRuns`, `enrichAction`, `dealsKanban`. [CONFIRMED-BOTH]
Evidence: `Screen/_evidence/runtime-index.json`; `ContactController@show`; `resources/js/pages/crm/contacts/show.tsx`.

## 2. Purpose

Single-record hub: who the person is, how to act (log activity, WhatsApp, deal), timeline/catch-up, related company/deals/tickets, enrichment, playbooks, custom attributes, optional Ask Evo.

## 3. Current UX Summary

Brand-striped header with “← Back to Contacts” (Ask Evo trigger only on `md:hidden` and only if `features.ask_evo`). Three-panel hub: About | Activity | Related. About: identity (name, company · owner, lead_status badge, engagement score), action toolbar (Note/Email/Call/Task/Meet/WhatsApp/More), fact list, enrichment, playbooks, attributes. Center: activity tabs, catch-up, composer, timeline. Right: Ask Evo (hidden in simple mode), desk thread card, company, deals, tickets (hidden in simple mode). Loading uses `SkeletonRecord`. [CONFIRMED-CODE]

## 4. Screen Anatomy

- Header: `RecordBack`, mobile Ask Evo.
- Left “About”: `RecordIdentity`, `RecordActions`, `RecordSection` “About this contact”, `EnrichmentPanel`, `PlaybookCard`, `RecordProperties`.
- Center “Activity”: `RecordActivityPanel` (next action, catch-up, tabs Overview/Activities/…, composer, timeline).
- Right “Related”: `AskEvoPanel`, `DeskThreadCard`, company `AssociationCard`, deals `AssociationCard`, `TicketsRelatedCard`.
- Overlays: QuickRecord not this page; Ask Evo drawer on small screens (`OVR-SHELL-005` pattern).

Contact show does **not** render an Edit form (unlike company). `PUT /crm/contacts/{id}` exists but has no control on this page. Only attributes PUT is wired. [CONFIRMED-CODE]

## 5. Data Displayed

Contact: `display_name` (or formatted first/last), email, `phone_e164`, lead_status, created_at (date slice 0–10), company, owner, `company_id`.

Engagement: `{score, label, reason}` — reason hidden on extra-small (`hidden sm:inline`).

Facts: Email, Phone, Company, Owner, Lead status, Created. **Not shown:** city, wilaya, source, unanswered, last_activity, external_id. [CONFIRMED-CODE]

Associations loaded: company, deals, leads, threads, enrollments, quotes, tickets. UI uses company, deals, first thread, tickets. **Unused in UI:** leads, enrollments, quotes lists; `dealsKanban`; `proactiveSummary`; `companies` and `members` page props (typed off the component). [CONFIRMED-CODE]

Timeline: last 80 activities for `contact_id`. Catch-up: inbound desk vs outbound.

## 6. Primary Actions

Record action group: Note, Email, Call, Task, Meet (toggle composer types), WhatsApp link (`/conversations?thread=` or `/inbox`). More: Create deal, Enroll in sequence (`/outbound/sequences` — not in-place enroll), Add to campaign, View segments, Draft email with Evo (`POST .../draft-email`, **403 in simple mode**), Open in Desk. [CONFIRMED-CODE]

Activity panel: complete next task; log activities via `/crm/activities`.

Enrich: `POST /crm/contacts/{id}/enrich`.

Ask Evo: `POST /crm/contacts/{id}/ask` (blocked simple mode; panel hidden).

Save attributes: `PUT /crm/contacts/{id}/attributes`.

## 7. Secondary Actions

Back to list. View/add company (`/crm/companies/{id}` or `/crm/companies?create=1`). Add deal `/crm/deals?create=1&contact_id=`. Add ticket `/crm/tickets?create=1&contact_id=` (card hidden if `!features.tickets`). Manage attributes settings link. Playbooks read-only.

## 8. Search

NOT PRESENT on the record page. Command palette is shell-level.

## 9. Filters

Activity chips: All / Calls / Emails / Tasks / Meetings / Notes (client filter of timeline). Activity tabs from `RECORD_ACTIVITY_TABS`. NOT APPLICABLE as list filters.

## 10. Sorting

NOT APPLICABLE. Timeline `latest()`, limit 80.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Full-page Inertia visit. `useInertiaLoading` → `SkeletonRecord`. Timeline capped at 80; no pager. Enrichment history list unbounded in UI (payload from `EnrichmentService::history`).

## 14. Forms

- Activity composers → `POST /crm/activities` with hidden `contact_id` / `company_id`.
- Attribute form grouped fields → PUT attributes (`enforceRequired: true`).
- Ask Evo question POST.
- Enrich POST.
- Draft email POST (More menu).
- Complete task POST `/crm/activities/{id}/complete`.
No core-field edit form. Update validator would accept first_name, last_name, email, phone, company_id, owner_id, city, wilaya, lead_status, unanswered, attributes. [CONFIRMED-CODE]

## 15. Overlays

- Ask Evo mobile drawer (`AskEvoTrigger`) when feature on.
- More actions dropdown.
- Global Ask Evo / command / create remain in shell.
- Create contact drawer is **not** on this page.

## 16. States

Loading skeleton; populated; missing company (“No company linked”); no deals; no tickets; no playbooks (section omitted); no attribute definitions (Manage attributes link); Ask Evo hidden in simple mode; tickets card omitted in simple mode; engagement omitted if null.

## 17. Empty State

No whole-page empty (404 if missing). Section empties: “No company linked”, “No deals yet”, “No tickets”. Timeline empty handled inside activity panel. [CONFIRMED-CODE] [UNVERIFIED] exact empty timeline copy.

## 18. Error Handling

404 other workspace. Validation errors on attribute/activity forms via Inertia `errors`. Ask/draft 403 simple mode if a hidden path is hit. Enrichment run `failed` badge. [CONFIRMED-CODE]

## 19. Feedback

`preserveScroll` on Ask Evo and many activity posts. Enrichment panel badges (applied / failed / proposed). No inline edit success besides Inertia reload. [CONFIRMED-CODE]

## 20. Navigation Behavior

Back always `/crm/contacts` (drops list query). Related records visit their show routes. Create deal/company use `?create=1` drawers on those lists. Ticket create URL exists but tickets 403 in simple mode (entry hidden). [CONFIRMED-CODE]

## 21. Entity Relationships

Contact owns/links Company, Deals (+ stages, amounts in unused kanban), Threads, Tickets, Leads, Quotes (via deals), Enrollments, Activities, EnrichmentRuns, Playbooks (workspace entity=contact), custom attributes, Owner.

## 22. Business Rules

- Workspace 404 boundary.
- `displayName()` for title.
- WhatsApp prefers first thread id.
- Company addHref: view if linked else companies create drawer — does **not** prefill this contact.
- Tickets related uses `Ticket::presentRelatedList`.
- Simple mode: Ask Evo UI off; Ask/draft POSTs blocked; tickets UI off; companies still reachable by URL.

## 23. Backend Dependencies

`ContactController@show|update|updateAttributes`, `CrmHub` associations/timeline/catchUp/attributeBag/playbooks, `RecordInsight` (askEvo, engagement, proactiveSummary), `EnrichmentService`, `AskEvoController`, `ActivityController`, default pipeline (kanban payload unused).

## 24. Frontend Dependencies

`record-hub`, `record-chrome`, `record-activity-panel`, `ask-evo-panel`, `enrichment-panel`, `playbook-card`, `record-properties`, `desk-thread-card`, `tickets-related-card`, `catch-up-block`, `activity-composer`, `useSimpleMode`, `formatContactName`.

## 25. Responsive Behavior

`AdaptiveWorkspaceShell`: `<768` one panel (default center Activity); `768–1023` center+right, left via switcher; `≥1024` three columns. Ask Evo trigger `md:hidden`. Engagement reason `hidden sm:inline`. [CONFIRMED-CODE]
Viewport screenshots: [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: Record actions `role="toolbar"` `aria-label="Record actions"`; `aria-pressed` on action types; More `aria-label="More actions for record {id}"`; Ask Evo labels/live region; playbooks `aria-label="Playbooks"`. [CONFIRMED-CODE]
LIKELY ISSUE: breadcrumb current href `#`; no heading outline beyond identity title; WhatsApp icon `aria-hidden` with visible text.
REQUIRES MANUAL TEST: panel switcher, composer focus, toolbar keyboard.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| UX-CONTACT-DET-01 | HIGH | No UI to edit core contact fields despite PUT update | Users cannot fix name/email/phone/owner/city on the hub | `show.tsx` vs `ContactController@update` |
| UX-CONTACT-DET-02 | HIGH | `dealsKanban` and `proactiveSummary` shipped unused | Dead payload; no pipeline board on contact | controller vs unused props |
| UX-CONTACT-DET-03 | MEDIUM | City/wilaya/source not in facts | Algeria location data invisible | fact list |
| UX-CONTACT-DET-04 | MEDIUM | More → Enroll/campaign/segments leave the record; not in-context | Extra hops | `record-chrome.tsx` |
| UX-CONTACT-DET-05 | MEDIUM | Draft email / Ask Evo 403 in simple mode even though More still shows Draft | Broken action for seed owner workspace | `SimpleMode::blocks`; More menu unguarded |
| UX-CONTACT-DET-06 | LOW | Back link drops list filters | Context loss | `href="/crm/contacts"` |
| UX-CONTACT-DET-07 | OBSERVATION | Leads/quotes/enrollments associated but not listed | Incomplete relationship picture | `contactAssociations` vs UI |

## 28. Consistency Comparison

Same RecordPageFrame/RecordShell as company and deal hubs. Company has inline Edit toggle for core fields; contact does not. Company has no playbooks, catch-up, engagement, tickets card, or deals-create-from-contact. Contact identity lives in left column; company identity is in the header.

## 29. Functional Preservation Contract

Must keep: show URL, workspace 404, three-panel hub, identity+facts, actions+WhatsApp+More, activity log/catch-up, enrichment, playbooks, attributes PUT, company/deals/tickets associations (tickets feature-flagged), Ask Evo when feature on, create-deal with contact_id, back to contacts.

## 30. Design Input Contract

Purpose: operate one person.
Primary goal: understand identity and next communication, then log or advance a deal.
Primary actions: log activity, WhatsApp, create deal, enrich, save attributes.
Secondary: related records, playbooks, Ask Evo, sequences.
Required information: name, company, owner, status, email, phone, created, engagement, timeline, related deals/company.
Business-critical: contact_id on new deals; attribute required enforcement; workspace isolation.
May NOT remove: activity composer, related deals, enrichment, attributes, back navigation.

## 31. Open Questions / Unknowns

- [UNKNOWN] intended editor for core fields (missing UI vs record-layout engine unused here).
- [UNVERIFIED] record-layouts settings apply to this hub.
- [UNKNOWN] whether `companies`/`members` were meant for an edit form that was removed.
- [UNVERIFIED] catch-up empty copy and next-action derivation with seed data.
