# Lead detail

## 1. Screen Identity

Screen ID: SCR-LEAD-002
Product area: CRM / Leads
Route: `GET /crm/leads/{lead}`
Route name: `crm.leads.show`
Frontend file: `resources/js/pages/crm/leads/show.tsx`
Primary component: `LeadShow` (`RecordPageFrame` + `RecordShell`)
Layout: App shell; breadcrumbs Leads → Lead. No `CrmShell` wrapper. `[CONFIRMED-CODE]`
Authentication: `auth`, `verified`, product permissions, simple-mode middleware. `[CONFIRMED-CODE]`
Permissions: Show is a GET (no named permission). Updates `LeadPolicy::update` (`crm.edit`). Qualify `LeadPolicy::qualify`. Ask endpoint `crm.leads.ask` is blocked in simple mode (`SimpleMode::blocks` matches `*.ask`). Enrich POST needs `crm.edit`. `[CONFIRMED-CODE]`
Parent navigation: From SCR-LEAD-001; command search hits; ads/outbound links. `[CONFIRMED-CODE]`
Entry points: list row; capture “Merged into”; command search; `/crm/leads/1` in crawl. `[CONFIRMED-BOTH]`
Exit points: Back to Leads; related contact/company/deal/inbox/conversations; convert stays on page (`back()`). `[CONFIRMED-CODE]`
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/leads/show` for `/crm/leads/1`. `[CONFIRMED-UI]`
Evidence: runtime prop keys include `lead`, `leadScore`, `path`, `askEvo`, `associations`, `whatsapp`, `contacts`, `pipelines`, `members`, `contactDeals`, `enrichmentRuns`, `enrichAction`. `[CONFIRMED-UI]`

## 2. Purpose

Work a single inbound lead: Path status, convert to a deal, change owner, edit title/source, inline-edit contact fields, enrich, see associations (Desk, WhatsApp, deal, contact, company, enrollments). `[CONFIRMED-CODE]`

## 3. Current UX Summary

Salesforce-like record: back link, identity (title, kind Lead, contact · source · owner, status badge, score pill), Path chevrons, Convert / Change Owner / Edit. Three-column shell: About + Get in Touch + enrichment | Activity stub | associations + Ask Evo (hidden when `features.ask_evo` is false). `[CONFIRMED-CODE]` Runtime 200 with path/leadScore/whatsapp props; Ask Evo UI suppressed in this simple_mode crawl. `[CONFIRMED-BOTH]`

## 4. Screen Anatomy

- `RecordBack` “Back to Leads”
- `RecordIdentity` + `LeadScorePill` + status badge
- Actions: `LeadConversionDialog`, `LeadOwnerDialog`, `LeadEditDialog`, mobile `AskEvoTrigger`
- `RecordPath` steps from `LeadPath::present`
- Left: About facts + inline fields; Get in Touch; `EnrichmentPanel`
- Center: Activity copy + “Open in Inbox”
- Right: Ask Evo (feature-gated), Desk, WhatsApp, Deal, Contact, Company, Enrollments
- Loading: `SkeletonRecord` `[CONFIRMED-CODE]`

## 5. Data Displayed

`lead`: id, title, status, source, qualified_at, contact, score, latest_score. `[CONFIRMED-CODE]`
`leadScore`: `latestScore->present()`. `[CONFIRMED-CODE]` Runtime present. `[CONFIRMED-UI]`
`path`: steps New / Contacted / Nurturing / Unqualified / Converted; current; next; complete. `[CONFIRMED-CODE]`
`associations`: contact, company, deal, threads, enrollments, deals. `[CONFIRMED-CODE]`
`whatsapp`: thread_id, subject, last_message, last_message_at, direction — or null. `[CONFIRMED-BOTH]`
`pipelines` + stages; `members`; `contactDeals` (id, title, stage); `enrichmentRuns`; `enrichAction` `/crm/leads/{id}/enrich`. `[CONFIRMED-CODE]`
`askEvo` still serialized in simple mode even though UI hides it. `[CONFIRMED-BOTH]`

Displayed About: Source, Lead Status (path label), Name, Company, Title, Source (again), Lead Status (again), Lead Owner. Get in Touch: Phone, Email, Address (city, wilaya). `[CONFIRMED-CODE]`

## 6. Primary Actions

- **Convert** (hidden when `path.complete` or `status === 'qualified'`): dialog POST `/crm/leads/{id}/qualify` (`mode` create|link, pipeline, stage, owner, amount, deal_id). `[CONFIRMED-CODE]`
- **Path select**: PUT `{ path_step }` except `converted` opens Convert. `[CONFIRMED-CODE]`
- **Mark Status as Complete**: advances `path.next`. `[CONFIRMED-CODE]`
- Open related contact/deal/company/inbox. `[CONFIRMED-CODE]`

## 7. Secondary Actions

- **Change Owner** PUT `owner_id` (writes `contact.owner_id`, toast “{name} now owns the record for {recordName}.”). `[CONFIRMED-CODE]`
- **Edit** PUT title + source. `[CONFIRMED-CODE]`
- Inline PUT contact `first_name` / `phone` / `email` to `/crm/contacts/{id}` or lead title/source to lead URL. `[CONFIRMED-CODE]`
- Enrich panel POST `enrichAction`; apply/dismiss enrichment runs (global routes). `[CONFIRMED-CODE]`
- Ask Evo POST `/crm/leads/{id}/ask` — **403 in simple_mode**; component returns null when `!features.ask_evo`. `[CONFIRMED-CODE]`

## 8. Search

NOT APPLICABLE on the record. `[CONFIRMED-CODE]`

## 9. Filters

NOT APPLICABLE. `[CONFIRMED-CODE]`

## 10. Sorting

NOT APPLICABLE. `[CONFIRMED-CODE]`

## 11. Selection

NOT APPLICABLE. `[CONFIRMED-CODE]`

## 12. Bulk Actions

NOT PRESENT. `[CONFIRMED-CODE]`

## 13. Pagination / Loading Strategy

`useInertiaLoading` → `SkeletonRecord`. Association lists are not paginated (threads all; deals of contact). `[CONFIRMED-CODE]`

## 14. Forms

Qualify (`LeadConverter`):
- `mode` create|link
- create: pipeline_id, stage_id, owner_id, amount_cents / amount_dzd
- link: deal_id of a contact deal
Sets lead qualified, links or creates deal, activity `lead_converted`. `[CONFIRMED-CODE]`

Update: title, source, status in `new|working|disqualified`, path_step in `new|contacted|nurturing|unqualified`, owner_id. Converted is not a path_step (`LeadPath::apply` throws). `[CONFIRMED-CODE]`

Inline contact fields PUT contact update route. `[CONFIRMED-CODE]` `[UNVERIFIED]` contact policy interaction.

## 15. Overlays

- Convert dialog (`LeadConversionDialog`)
- Change Owner dialog
- Edit lead dialog
- Ask Evo drawer (mobile trigger) — hidden in simple mode
- Enrichment apply/dismiss UI inside panel `[CONFIRMED-CODE]`

## 16. States

- Loading skeleton `[CONFIRMED-CODE]`
- Open lead (path incomplete) with Convert `[CONFIRMED-CODE]`
- Converted/qualified: Convert hidden, Path disabled `[CONFIRMED-CODE]`
- Missing contact/company/deal/whatsapp empty association copy `[CONFIRMED-CODE]`
- Ask Evo hidden (`features.ask_evo=false` on this crawl) `[CONFIRMED-BOTH]`

## 17. Empty State

NOT APPLICABLE as a list. Per-rail empty: “No Desk thread”, “No WhatsApp thread”, “No deal”, “No contact”, “No company”. Center activity is always a stub, not a timeline. `[CONFIRMED-CODE]`

## 18. Error Handling

Cross-workspace lead `abort 404`. Validation on update/qualify. Convert already-linked deal short-circuits to existing. `[CONFIRMED-CODE]` `[UNVERIFIED]` dialog error UI.

## 19. Feedback

Owner toast via `Inertia::flash('toast', …)`. Convert/edit `back()` with preserveScroll on path PUT. `[CONFIRMED-CODE]` `[UNVERIFIED]` toast rendering on localhost.

## 20. Navigation Behavior

Back `/crm/leads`. Related records leave the page. Qualify stays on show. Path PUT preserveScroll. Converted path step does not PUT. `[CONFIRMED-CODE]`

## 21. Entity Relationships

Lead ↔ Contact (owner lives on contact) ↔ Company; Lead → Deal after convert; threads/WhatsApp via contact; outbound enrollments on contact; enrichment runs TARGET_LEAD. `[CONFIRMED-CODE]`

## 22. Business Rules

- Path keys map to statuses: new→new, contacted/nurturing→working (step in payload), unqualified→disqualified, converted→qualified. `[CONFIRMED-CODE]`
- Converted only via Convert, not Path. `[CONFIRMED-CODE]`
- Owner change does not set `leads.owner_id`; it updates contact. `[CONFIRMED-CODE]`
- Simple mode: show is allowed; Ask Evo POST blocked; qualify still works (`SimpleModeGuardTest`). `[CONFIRMED-CODE]`
- WhatsApp preview only first `WhatsAppCloud` thread. `[CONFIRMED-CODE]`

## 23. Backend Dependencies

`LeadController::show|update|qualify`, `LeadPath`, `LeadConverter`, `LeadScorer` (create path), `RecordInsight::forLead`, `PipelineManager`, `EnrichmentService`, `AskEvoController::lead`, `ChannelType`. `[CONFIRMED-CODE]`

## 24. Frontend Dependencies

`record-hub`, `record-chrome`, `record-path`, conversion/owner/edit dialogs, `LeadScorePill`, `InlineRecordField`, `EnrichmentPanel`, `AskEvoPanel`. `[CONFIRMED-CODE]`

## 25. Responsive Behavior

Actions wrap; Ask Evo trigger `md:hidden`; Path `lg:flex-row`. `[CONFIRMED-CODE]` Viewport: NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: Path `aria-label` default “Lead path”; `aria-current="step"`; dialog titles. `[CONFIRMED-CODE]`
LIKELY ISSUE: Source and Lead Status duplicated in About facts and fields. `[CONFIRMED-CODE]`
REQUIRES MANUAL TEST: Path keyboard, convert dialog focus trap, inline field save.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-LEAD-101 | HIGH | Activity column is a stub (“Open Desk or WhatsApp”) with no timeline | Cannot work the lead’s history on-record | `show.tsx` center `[CONFIRMED-CODE]` |
| UX-LEAD-102 | MEDIUM | About duplicates Source / Lead Status | Noise | `show.tsx` `[CONFIRMED-CODE]` |
| UX-LEAD-103 | MEDIUM | Owner is contact owner, labeled “Lead Owner” | Wrong mental model if lead vs contact owners diverge later | update() `[CONFIRMED-CODE]` |
| UX-LEAD-104 | LOW | Ask Evo props load then hide in simple mode | Extra payload; operators cannot ask | runtime `askEvo` + `features.ask_evo` `[CONFIRMED-BOTH]` |
| UX-LEAD-105 | OBSERVATION | Inline name field writes contact `first_name` only | Last name not inline | `InlineRecordField` name `[CONFIRMED-CODE]` |

## 28. Consistency Comparison

Same Path + Convert chrome intent as tickets/deals records. Unlike contact/deal show, no activity timeline, playbooks, custom attributes, or deals kanban. WhatsApp rail is lead-specific. `[CONFIRMED-CODE]`

## 29. Functional Preservation Contract

- Keep Path steps and Convert-only converted.
- Keep qualify create/link deal with pipeline, stage, owner, amount.
- Keep owner on contact with toast.
- Keep score pill, enrich, associations (Desk, WhatsApp last message, deal, contact, company, enrollments).
- Keep Inbox escape hatch.
- Keep workspace 404 isolation.

## 30. Design Input Contract

Purpose: qualify or nurture one inbound lead.
Primary goal: move Path or Convert to a deal.
Primary actions: Convert, Path complete/select.
Secondary: Edit, Change Owner, enrich, open related.
Required information: title, path, score, contact, source, owner, WhatsApp snippet, deal link.
Required components: identity, Path, convert dialog, association cards.
Required states: loading, open, converted, missing associations, Ask Evo off.
Information priority: identity + path → convert → contact reachability → associations.
Business-critical: Convert, Path, score, contact link.
Must not remove: qualify API, Path mapping, WhatsApp preview, enrich.

## 31. Open Questions / Unknowns

- Seeded lead 1 title/status/score values. `[UNKNOWN]` (props present, values not dumped)
- Whether `contacts` prop on show is unused by this page (typed in index create only). Page does not list unused `contacts` in destructure — controller still sends it. `[CONFIRMED-CODE]`
- Enrichment success UX. `[UNVERIFIED]`
