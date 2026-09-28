# Public unsubscribe

## 1. Screen Identity

Screen ID: `SCR-PUB-004`
Product area: Public / Outbound
Route: `GET /unsubscribe`
Route name: `unsubscribe`
Frontend file: **None (not Inertia).** Blade `resources/views/unsubscribe.blade.php`
Primary component: NOT APPLICABLE (server-rendered HTML)
Layout: Standalone HTML document (not `PublicLayout`, not AppLayout)
Authentication: Guest. **200** with or without query params. `[CONFIRMED-UI]` HEAD `/unsubscribe` 200; HEAD `/unsubscribe?email=test@example.com` 200
Permissions: None. Anyone who can hit the URL with `email` or `phone` can suppress that value on a workspace.
Parent navigation: Outbound email `{{unsub}}` / `{{unsubscribe_url}}` (`TemplateRenderer`) and List-Unsubscribe header
Entry points: `/unsubscribe?email=&phone=&workspace=`
Exit points: None
Runtime HTTP (owner, simple_mode=true): Not in runtime-index (crawl was authenticated Inertia). Guest probe 200.
Evidence: `routes/web.php`, `UnsubscribeController.php`, `unsubscribe.blade.php`, `SuppressionService`, `EmailHtml` / `TemplateRenderer`.

## 2. Purpose

One-click suppression of an email and/or phone from automated Outbound Center sends for a workspace.

## 3. Current UX Summary

Centered white card on `#F7F7F5`. Logo + **EvoCrm**. H1 Unsubscribe.

If `$ok`: “You have been added to the workspace suppression list. Evotechly will not send further automated outbound to this address or number.”

Else: “Provide `?email=` or `?phone=` to be suppressed. Quiet hours and suppression apply to Outbound Center only.”

No form. **GET is the action** — providing email/phone immediately writes suppressions.

Document title: `Unsubscribe · EvoSales · Evotechly` (brand mix). `[CONFIRMED-CODE]`

## 4. Screen Anatomy

Inline CSS (Geist, hairline card). Logo `/brand/evocrm/logo.svg`. Optional `<a>` color brand (no actual link in the body besides none).

## 5. Data Displayed

Boolean `$ok` = workspace found AND (email or phone present). Does not echo the email/phone back. Does not name the workspace in the success sentence except hard-coded “Evotechly”.

## 6. Primary Actions

Load the URL with identifiers (from the email link). There is no button.

## 7. Secondary Actions

NOT PRESENT (cannot undo on this page; CRM Outbound suppressions list is the operator tool).

## 8. Search

NOT PRESENT.

## 9. Filters

Query params: `email` nullable email, `phone` nullable string, `workspace` nullable integer.

## 10. Sorting

NOT PRESENT.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

If both email and phone are provided, both are suppressed.

## 13. Pagination / Loading Strategy

Single GET. HEAD also hits the controller (Laravel) so a HEAD with email **may still suppress** `[UNVERIFIED]` whether `__invoke` runs on HEAD — typically yes for Laravel GET routes.

## 14. Forms

NOT PRESENT. Validation in the controller.

## 15. Overlays

NOT PRESENT.

## 16. States

Success `$ok`. Help state missing identifiers. Workspace missing: `$ok` false even if email present (`Workspace::first()` fallback if workspace id omitted).

## 17. Empty State

The help paragraph *is* the empty state (no email/phone).

## 18. Error Handling

Invalid email query → Laravel validation 422 HTML `[UNVERIFIED]` appearance. No workspace → treated as not-ok help copy, not 404. No confirmation step.

## 19. Feedback

Success vs help paragraphs only.

## 20. Navigation Behavior

Not Inertia. No redirect. Mail links are absolute on the CRM host (`TemplateRenderer` comment: never a third-party domain).

## 21. Entity Relationships

Writes `Suppression` rows (`type` email/phone, `reason` default unsubscribe, `source` public) for the resolved `Workspace`. Outbound sequences/campaigns skip those values.

## 22. Business Rules

- GET with identifiers mutates suppressions (no POST, no CSRF).
- If `workspace` omitted, **first workspace in the database** is used (`Workspace::query()->first()`). On a multi-tenant install this can suppress on the wrong tenant `[CONFIRMED-CODE]`.
- Quiet hours are mentioned in the help copy; they are a different feature.
- Applies to Outbound Center automated mail, not necessarily transactional CRM mail `[UNVERIFIED]` all mailers.

## 23. Backend Dependencies

`UnsubscribeController`, `SuppressionService::suppress`, `Workspace`.

## 24. Frontend Dependencies

None (Blade + static CSS). Logo SVG.

## 25. Responsive Behavior

`max-width: 32rem; padding: 2rem; min-height: 100vh` grid center. `NOT VERIFIED` on mobile beyond CSS.

## 26. Accessibility Observations

**CONFIRMED:** h1, logo alt EvoCrm, viewport meta.

**LIKELY ISSUE:** success not `role="status"`; `<code>` instructions are developer-facing for the empty state; title still says EvoSales; no language `fr` (`lang="en"`).

**REQUIRES MANUAL TEST:** real unsub URL from a rendered template.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| PUB-U-001 | HIGH | GET side effect; no confirm | Prefetch/crawlers/HEAD may suppress | controller on GET |
| PUB-U-002 | HIGH | Default workspace = first row if id missing | Cross-tenant suppression risk | `Workspace::first()` |
| PUB-U-003 | MEDIUM | Empty state tells users to craft query params | Recipients without a proper mail link cannot self-serve | blade else branch |
| PUB-U-004 | LOW | Title “EvoSales · Evotechly” vs UI “EvoCrm” | Brand drift | blade `<title>` |
| PUB-U-005 | LOW | Hard-coded Evotechly in success copy | Wrong name if another workspace | blade `$ok` paragraph |

## 28. Consistency Comparison

Quote/book are Inertia + PublicLayout + `t()`. Unsubscribe is a one-off Blade page with English copy and a different title stack. In-app suppressions UI is `SCR-OUT-013`.

## 29. Functional Preservation Contract

- Keep `/unsubscribe` on the CRM host (not a vendor domain).
- Keep email/phone/workspace query contract used by `TemplateRenderer`.
- Keep writing suppressions via `SuppressionService`.
- Keep success vs missing-param copy.
- Document GET-mutate honestly; do not “fix” in this audit.

## 30. Design Input Contract

Purpose: stop outbound to this address/number.
Primary goal: confirm suppression.
Primary actions: none on-page (the click of the mail link is the action).
Required information: success vs needs-params.
Required components: identity, heading, explanation.
Required states: ok, not-ok, validation failure.
Must not remove: query param contract, suppression write, outbound-only disclaimer.

## 31. Open Questions / Unknowns

- `[UNVERIFIED]` whether mail templates always include `workspace=` id.
- `[UNKNOWN]` HEAD/prefetch side effects in production bots.
- `[UNVERIFIED]` 422 HTML for invalid `email=`.
