# Outbound template detail

## 1. Screen Identity

Screen ID: `SCR-OUT-005`
Product area: Outbound
Route: `/outbound/templates/{template}`
Route name: `outbound.templates.show`
Frontend file: `resources/js/pages/outbound/templates/show.tsx`
Primary component: `TemplateShow`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title = template name.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET open; PUT/DELETE `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Templates primary tab (path prefix `/outbound/templates/`). [CONFIRMED-CODE]
Entry points: list “Edit & preview”; direct URL. Runtime crawled `/outbound/templates/1` 200. [CONFIRMED-UI]
Exit points: Delete redirects to templates index; room tabs; no explicit back link besides breadcrumbs/tab.
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/templates/show`, props `template`, `preview`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `TemplateController::show`; `templates/show.tsx`.

## 2. Purpose

Edit one email template and preview it rendered through the same HTML builder the mailer uses (unsubscribe footer on, tracking off), against a real workspace contact when possible.

## 3. Current UX Summary

Two-column layout: edit form left, HTML preview right. Ghost Delete in page actions.

## 4. Screen Anatomy

1. Room chrome, Templates tab active. [CONFIRMED-CODE]
2. `OutboundPage` title = name; description lists merge tags; Delete action. [CONFIRMED-CODE]
3. Edit form: name, subject, body text, body HTML. [CONFIRMED-CODE]
4. Preview: contact label, subject, `dangerouslySetInnerHTML` html. [CONFIRMED-CODE]

## 5. Data Displayed

- `template`: id, name, subject, body, body_html. [CONFIRMED-CODE]
- `preview.contact`: `{displayName} <email>` from first workspace contact with email, else synthetic Amine Benali / amine@example.dz. [CONFIRMED-CODE]
- `preview.subject` and `preview.html` via `TemplateRenderer` + `EmailHtml::build(..., preview: true)`. [CONFIRMED-CODE]

## 6. Primary Actions

- **Save template** PUT `/outbound/templates/{id}`. [CONFIRMED-CODE]

## 7. Secondary Actions

- **Delete** confirm then DELETE; controller redirects to index. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT. Preview contact is not selectable. [CONFIRMED-CODE]

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Single record. Save `back()`; full reload of preview after save. [CONFIRMED-CODE]

## 14. Forms

PUT validates name required, subject nullable, body required, body_html nullable — same as store. [CONFIRMED-CODE]
No inline error rendering. [CONFIRMED-CODE]

## 15. Overlays

`window.confirm` only. [CONFIRMED-CODE]

## 16. States

- Processing on save. [CONFIRMED-CODE]
- Preview always rendered (even empty HTML). [CONFIRMED-CODE]
- Missing template: Laravel 404 (implicit model bind) [CONFIRMED-CODE] [UNVERIFIED] UI
- Wrong workspace: `abort 404`. [CONFIRMED-CODE]

## 17. Empty State

NOT APPLICABLE for missing template (404). Body can be empty string only if validation bypassed — required on save.

## 18. Error Handling

- 404 other workspace. [CONFIRMED-CODE]
- Validation: no on-page error nodes. [CONFIRMED-CODE]
- HTML preview XSS: operator-controlled HTML injected. [CONFIRMED-CODE]

## 19. Feedback

No toast on save/delete. [CONFIRMED-CODE]

## 20. Navigation Behavior

- Save stays on show. [CONFIRMED-CODE]
- Delete → `outbound.templates.index`. [CONFIRMED-CODE]
- Breadcrumbs: Templates + “Template” href `#` (not the actual id). [CONFIRMED-CODE]

## 21. Entity Relationships

Template → workspace. Preview uses Contact (+ company) and a throwaway `OutboundMessage` (not persisted). [CONFIRMED-CODE]

## 22. Business Rules

- Preview tracking disabled; unsub link still points at CRM host. [CONFIRMED-CODE]
- Sample contact fallback if none with email. [CONFIRMED-CODE]
- Renderer applies the same variables as live send. [CONFIRMED-CODE]

## 23. Backend Dependencies

`TemplateController@show|update|destroy`, `TemplateRenderer`, `EmailHtml`, `Contact`, `OutboundMessage` (in-memory).

## 24. Frontend Dependencies

`OutboundPage`, `OutboundShell`, `Button`, `Input`, `Label`, Inertia `Form`, `router`.

## 25. Responsive Behavior

`lg:grid-cols-2` stacks on smaller. [CONFIRMED-CODE] NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: labeled inputs. [CONFIRMED-CODE]
LIKELY ISSUE: `dangerouslySetInnerHTML` preview has no sandbox/iframe; heading structure is `h2` Edit/Preview under sr-only room h1. [CONFIRMED-CODE]
Breadcrumb last item href `#`. [CONFIRMED-CODE]
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-040 | LOW | Cannot pick which contact to preview. | Preview may not match target persona. | `show()` first email contact [CONFIRMED-CODE] |
| UX-OUT-041 | LOW | Breadcrumb “Template” is `#`. | Poor orientation / copy-paste URL. | `show.tsx` layout breadcrumbs [CONFIRMED-CODE] |
| UX-OUT-042 | MEDIUM | Unsanitized HTML preview. | If a template contains script, it runs in app origin. | `dangerouslySetInnerHTML` [CONFIRMED-CODE] |
| UX-OUT-032 | MEDIUM | No save errors/toasts. | Same as list. | [CONFIRMED-CODE] |

## 28. Consistency Comparison

Split edit/preview similar to sequence step editor, unlike campaign show (read-only content). Delete in header like some settings pages.

## 29. Functional Preservation Contract

Must keep: edit all template fields; honest preview via EmailHtml with tracking off and unsub on; delete with confirm returning to list; workspace 404; merge-tag list in description.

## 30. Design Input Contract

- Purpose: author and verify one template.
- Primary goal: save copy that matches the mailed HTML.
- Required information: fields + rendered subject/HTML + which contact was used.
- Must not remove: preview honesty (same builder as mailer).

## 31. Open Questions / Unknowns

- Seed template 1 name/body. [UNKNOWN]
- Whether EmailHtml escapes operator HTML in preview. [UNVERIFIED] read EmailHtml not fully.
