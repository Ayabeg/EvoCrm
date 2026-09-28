# Outbound templates list

## 1. Screen Identity

Screen ID: `SCR-OUT-004`
Product area: Outbound
Route: `/outbound/templates`
Route name: `outbound.templates.index`
Frontend file: `resources/js/pages/outbound/templates/index.tsx`
Primary component: `TemplatesIndex`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Templates"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET open; POST store/send require `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Primary tab **Templates**. No subtabs. [CONFIRMED-CODE]
Entry points: room tab; sequence step “prefill from template”; campaign template picker (related screens).
Exit points: **Edit & preview** → `/outbound/templates/{id}` (`SCR-OUT-005`).
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/templates/index`, props `templates`, `contacts`, `note`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `TemplateController.php`; `templates/index.tsx`.

## 2. Purpose

CRUD entry for reusable email subject/body (text + optional HTML) with merge tags; plus a separate official WhatsApp Cloud template send (not stored as `OutboundTemplate` rows).

## 3. Current UX Summary

Create form, then a 2-column card grid of templates (name, HTML badge, subject, body preview, Edit & preview). Below, a WhatsApp Cloud send form using contacts that have `phone_e164`.

## 4. Screen Anatomy

1. Room tabs, Templates active. [CONFIRMED-CODE]
2. Title “Email templates” + merge-tag description including `{{unsub}}`. [CONFIRMED-CODE]
3. New template form. [CONFIRMED-CODE]
4. Template cards `lg:grid-cols-2`. [CONFIRMED-CODE]
5. WhatsApp Cloud send section with server `note`. [CONFIRMED-CODE]

## 5. Data Displayed

- `templates`: full `OutboundTemplate` models latest-first. [CONFIRMED-CODE]
- Card: name, HTML badge if `body_html`, subject, body whitespace-pre-wrap. [CONFIRMED-CODE]
- `contacts`: id, first_name, last_name, phone_e164 — only contacts with phone. [CONFIRMED-CODE]
- `note`: `'Official WhatsApp Cloud templates only. Sends go through Evolution Cloud — never Baileys.'` [CONFIRMED-CODE]

## 6. Primary Actions

- **Save template** POST `/outbound/templates`. [CONFIRMED-CODE]
- **Edit & preview** Link to show. [CONFIRMED-CODE]
- **Send via Evolution Cloud** POST `/outbound/templates/send`. [CONFIRMED-CODE]

## 7. Secondary Actions

NOT PRESENT (no delete on list; delete is on show). [CONFIRMED-CODE]

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

Backend `latest()`. No UI sort. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT (WA contact is a `<select>`, not a table selection). [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

All templates loaded. [CONFIRMED-CODE] Create `resetOnSuccess`. [CONFIRMED-CODE]

## 14. Forms

**Email template** — name required max 160; subject nullable max 180; body required; body_html optional. [CONFIRMED-CODE]
Create form does not print field errors. [CONFIRMED-CODE]

**WA send** — `contact_id` required, `wa_template_name` required max 120, `wa_template_language` default `fr`. Dispatches `channel=whatsapp_cloud`. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT.

## 16. States

- Empty: “No templates yet.” [CONFIRMED-CODE]
- HTML badge. [CONFIRMED-CODE]
- Processing buttons. [CONFIRMED-CODE]
- WA contact list may be empty (Select only). [CONFIRMED-CODE]

## 17. Empty State

Copy only; create form still visible. [CONFIRMED-CODE]

## 18. Error Handling

- WA send: `findOrFail` contact in workspace. [CONFIRMED-CODE]
- No inline errors on email create. [CONFIRMED-CODE]
- Dispatcher failures not toasted in this controller (`return back()`). [CONFIRMED-CODE]

## 19. Feedback

No toasts on store/send. [CONFIRMED-CODE] Success is implied by reset form / new card after reload.

## 20. Navigation Behavior

Stay on index after create/send. Breadcrumbs: Templates. [CONFIRMED-CODE]

## 21. Entity Relationships

`OutboundTemplate` used by campaigns and sequence steps (`template_id`). WA send creates `OutboundMessage` via `OutboundDispatcher`, not an `OutboundTemplate` row. Contacts for WA filtered by phone.

## 22. Business Rules

- Merge tags documented: first_name, last_name, name, email, phone, company, city, wilaya, unsub. Unsubscribe always this CRM host. [CONFIRMED-CODE]
- WhatsApp: Cloud templates only, Evolution Cloud, never Baileys. [CONFIRMED-CODE]
- Email templates are workspace-scoped. [CONFIRMED-CODE]

## 23. Backend Dependencies

`TemplateController@index|store|send`, `OutboundTemplate`, `Contact`, `OutboundDispatcher`.

## 24. Frontend Dependencies

`OutboundPage`, `OutboundShell`, `Badge`, `Button`, `Input`, `Label`, Inertia `Form`, `Link`. Native `<textarea>` / `<select>` (not shared Textarea/NativeSelect).

## 25. Responsive Behavior

Name/subject `md:grid-cols-2`; cards `lg:grid-cols-2`; WA form `md:grid-cols-4`. [CONFIRMED-CODE] NOT VERIFIED viewport.

## 26. Accessibility Observations

CONFIRMED: Labels on create and WA fields. [CONFIRMED-CODE]
LIKELY ISSUE: native select/textarea without `id`/`htmlFor` pairing on some fields (Label not associated). [CONFIRMED-CODE]
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-030 | MEDIUM | WhatsApp send lives on Email templates list; contacts without phone omitted without explanation beyond section title. | Confusing two products on one page. | `index.tsx` + controller contact query [CONFIRMED-CODE] |
| UX-OUT-031 | LOW | No delete/duplicate on list. | Extra navigation to show. | [CONFIRMED-CODE] |
| UX-OUT-032 | MEDIUM | No validation error UI or toast on create/send. | Silent failure. | [CONFIRMED-CODE] |
| UX-OUT-033 | OBSERVATION | `contacts` typed as `any[]`. | Dev-only. | `index.tsx` [CONFIRMED-CODE] |

## 28. Consistency Comparison

Cards instead of HairlineTable (unlike sequences). Campaigns also embed a create form above a table.

## 29. Functional Preservation Contract

Must keep: create email template with text + optional HTML and merge tags; list with preview snippet; link to edit/preview; official WA Cloud send with language default `fr`; note never Baileys.

## 30. Design Input Contract

- Purpose: reusable email copy + one-off WA Cloud send.
- Primary goal: save a template operators can attach to sequences/campaigns.
- Required information: name, subject, body, HTML flag.
- Must not remove: `{{unsub}}` documentation, Evolution Cloud constraint.

## 31. Open Questions / Unknowns

- Seed templates exist (`/outbound/templates/1` 200) — names not dumped. [CONFIRMED-UI] [UNKNOWN] content
- Whether WA send actually delivers without Cloud credentials. [UNVERIFIED]
