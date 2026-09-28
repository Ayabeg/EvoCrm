# Outbound sequences list

## 1. Screen Identity

Screen ID: `SCR-OUT-006`
Product area: Outbound
Route: `/outbound/sequences`
Route name: `outbound.sequences.index`
Frontend file: `resources/js/pages/outbound/sequences/index.tsx`
Primary component: `SequencesIndex`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Sequences"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET open; POST create/toggle `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Primary tab **Sequences**.
Entry points: room tab; Overview KPI; dashboard guided actions `sequencesHref`; workflows.
Exit points: name → `/outbound/sequences/{id}`.
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/sequences/index`, prop `sequences`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `SequenceController::index|store|toggle`; `sequences/index.tsx`.

## 2. Purpose

Create multi-step outbound sequences (email / SMS DZ / WhatsApp Cloud) and see enrollment counts; activate or pause the sequence.

## 3. Current UX Summary

Create panel (scratch vs template origin, name, channel) then HairlineTable of sequences with enrollment stats and Activate/Pause.

## 4. Screen Anatomy

1. Room chrome, Sequences active. [CONFIRMED-CODE]
2. Title + description (variables, quiet hours, suppression, Cloud-only WA, SMS never stubs). [CONFIRMED-CODE]
3. HairlinePanel “Create sequence”. [CONFIRMED-CODE]
4. HairlineTable minWidth 760. [CONFIRMED-CODE]

## 5. Data Displayed

Each sequence with `steps`, counts: enrollments, enrollments_active/paused/finished. [CONFIRMED-CODE]
Columns: Sequence (name + description), Channel label (Email SMTP / WhatsApp Cloud / SMS (DZ)), Steps length, Enrolled, Active, Paused, Finished, State badge active|draft, actions.

## 6. Primary Actions

- **Create** POST `/outbound/sequences`. [CONFIRMED-CODE]
- Name link to show. [CONFIRMED-CODE]
- **Activate / Pause** POST `/outbound/sequences/{id}/toggle`. [CONFIRMED-CODE]

## 7. Secondary Actions

NOT PRESENT (no delete sequence UI). [CONFIRMED-CODE] [UNREACHABLE] destroy route does not exist.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

`latest()`. No UI sort. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

All sequences. [CONFIRMED-CODE]

## 14. Forms

Create: `origin` radio scratch|template; `name` required; `channel` email|sms|whatsapp_cloud. Description not in UI though validated nullable. [CONFIRMED-CODE]
Store always `active=false`. Creates first step: delay 0; email default subject/body or first workspace template if origin=template and channel=email; SMS default STOP copy; WA `hello_world` / `fr`. [CONFIRMED-CODE]
`resetOnSuccess`. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT.

## 16. States

- Empty: “No sequences yet. Create one above.” [CONFIRMED-CODE]
- active vs draft badge. [CONFIRMED-CODE]
- Processing on create. [CONFIRMED-CODE]

## 17. Empty State

Table empty string; create form remains. [CONFIRMED-CODE]

## 18. Error Handling

No inline errors on create. [CONFIRMED-CODE]
Channel validation `in:email,whatsapp_cloud,sms`. [CONFIRMED-CODE]
Member without permission: tests exist (`SequenceSmsTest` rejects create). [CONFIRMED-CODE] [UNVERIFIED] UI

## 19. Feedback

No toasts on create/toggle. [CONFIRMED-CODE]

## 20. Navigation Behavior

Create `back()` stays on list (does not jump to show). [CONFIRMED-CODE]
Breadcrumbs: Sequences. [CONFIRMED-CODE]

## 21. Entity Relationships

Sequence → steps, enrollments. Optional first-step `template_id`. Channel stored on sequence.

## 22. Business Rules

- New sequences start inactive (draft). [CONFIRMED-CODE]
- Origin template only prefills when channel is email and a template exists; otherwise still creates a default email step. [CONFIRMED-CODE]
- Toggle flips `active` boolean (Pause on list = deactivate sequence, not pause enrollments). [CONFIRMED-CODE]
- SMS copy promises connected DZ gateway in Settings. [CONFIRMED-CODE]
- Simple mode hides SMS in `SimpleMode::features` but this page still offers SMS channel. [CONFIRMED-CODE]

## 23. Backend Dependencies

`SequenceController@index|store|toggle`, `Sequence`, `OutboundTemplate` (optional).

## 24. Frontend Dependencies

`HairlinePanel`, `HairlineTable`, `OutboundPage`, `OutboundShell`, `Badge`, `Button`, `Input`, `Label`, `NativeSelect`, Inertia `Form`, `Link`, `router`.

## 25. Responsive Behavior

HairlineTable mobile cards with Activate in footer. [CONFIRMED-CODE] Create `md:grid-cols-3`. NOT VERIFIED viewport.

## 26. Accessibility Observations

CONFIRMED: `htmlFor` on name/channel. [CONFIRMED-CODE]
LIKELY ISSUE: origin radios lack `id`/`htmlFor` (wrapped in label — OK). Sequence names are links. [CONFIRMED-CODE]
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-050 | MEDIUM | Create stays on list; operator must click through to add real steps. | Extra hop; first dummy step may ship if they activate from list. | `store()` + `return back()` [CONFIRMED-CODE] |
| UX-OUT-051 | HIGH | List **Pause** deactivates the whole sequence, while show page also pauses **enrollments**. Same word, different objects. | Operators may think contacts paused. | `toggle` vs `EnrollmentController` [CONFIRMED-CODE] |
| UX-OUT-052 | MEDIUM | SMS channel offered in simple_mode even though SMS feature is full-nav only. | Create SMS sequence without Settings → SMS in simple rail. | `sequences/index.tsx` vs `SimpleMode::features` [CONFIRMED-CODE] |
| UX-OUT-053 | LOW | Description cannot be set at create. | Must edit on show. | form vs validate [CONFIRMED-CODE] |

## 28. Consistency Comparison

Matches Mailboxes: HairlinePanel create + table. Campaigns redirect to show after create; sequences do not.

## 29. Functional Preservation Contract

Must keep: create with channel + origin; auto first step; inactive by default; enrollment counts; activate/toggle; link to show; SMS/WA/email labels.

## 30. Design Input Contract

- Purpose: inventory of sequences.
- Primary goal: create and open a sequence.
- Required information: name, channel, step count, enrollment breakdown, active flag.
- Must not remove: draft-by-default; distinction that list Pause toggles sequence.active.

## 31. Open Questions / Unknowns

- Seed sequence 1 exists (show 200). [CONFIRMED-UI] list contents [UNKNOWN]
- “From template” with zero templates still creates default copy — confirm UX. [CONFIRMED-CODE]
