# Apps → Meta connection details

## 1. Screen Identity

Screen ID: SCR-SET-021
Product area: Settings / Integrations
Route: `/settings/apps/meta`
Route names: `settings.apps.meta` GET; `settings.apps.meta.destroy` DELETE (`can-manage-settings`)
Frontend file: `resources/js/pages/settings/apps/meta.tsx`
Primary component: `MetaApp`
Layout: `[AppLayout, SettingsLayout]`; **wide** (`settings/apps/meta`).
Authentication: `auth` + `verified`.
Permissions:
- **Not in IA nav** (no destination href). Reachable from Apps Manage, Meta “Connection details”, Setup finish.
- **GET:** if neither Meta nor Instagram integration connected → **302 `/settings/apps`** `[CONFIRMED-CODE]` `[CONFIRMED-UI]` this crawl
- **DELETE:** can-manage-settings + EPP `settings.integrations`; audit `meta.disconnected`
Parent navigation: Integrations / Apps child. Breadcrumbs Apps → Meta.
Entry points: Apps Manage when connected; Setup finish; Meta settings link.
Exit points: Back Apps; Disconnect → Apps.
Runtime HTTP (owner, simple_mode=true): **302** → `http://127.0.0.1:8000/settings/apps` `[CONFIRMED-UI]` (meta not configured). Page **not rendered**.
Evidence: `AppsController::meta`; `apps/meta.tsx`; runtime-index.

## 2. Purpose

Read-only detail of an existing Meta OAuth grant (account, token class, graph version, unlocks, pages, ad accounts, scopes) and disconnect.

## 3. Current UX Summary

Decorative 4-step pills (all but first muted), back to Apps, header with Connected badge, account card, unlocks, discovered assets, scopes, destructive disconnect.

## 4. Screen Anatomy

Stepper chrome (visual only, not wired); SettingsPageHeader; cards for account/token, unlocks+scopes, pages/ad accounts, disconnect form.

## 5. Data Displayed

`integration`: connected_at, expires_at, scopes, account_name/email, long_lived, pages, ad_accounts; `unlocks`; `graph_version`. Controller also passes `instagram_connected` unused in page `[CONFIRMED-CODE]`. Runtime: **no Inertia props** (redirect).

## 6. Primary Actions

Disconnect Meta (confirm).

## 7. Secondary Actions

Back to Apps.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

Unlocks from MetaAuth/InstagramAuth merge `[CONFIRMED-CODE]`.

## 11. Selection

NOT PRESENT (pages listed, not selected — page pick is Setup finish).

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Static.

## 14. Forms

DELETE `/settings/apps/meta` with confirm.

## 15. Overlays

`window.confirm`.

## 16. States

Unreachable when disconnected (redirect). Connected-only UI always shows Connected badge (no disconnected design).

## 17. Empty State

“None discovered” for pages/ad accounts. Redirect is the disconnected state.

## 18. Error Handling

403 delete for members. Redirect if not connected.

## 19. Feedback

Toast “Meta disconnected. Stored tokens were deleted.” Audit log `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

GET 302 Apps if not connected — **[UNREACHABLE]** in this seed. Breadcrumbs assume connected.

## 21. Entity Relationships

Meta + Instagram integrations; unlocks drive Ads/WhatsApp Cloud/Pages. Settings Meta (SCR-SET-017) is the operational twin.

## 22. Business Rules

- Tokens never shown (long-lived vs short-lived copy)
- Disconnect deletes local tokens; revoke on Meta separately (copy)
- Admin/owner to disconnect
- Advanced access / App Review still required (copy)

## 23. Backend Dependencies

`AppsController::meta/destroyMeta`, MetaAuth, InstagramAuth, AuditLogger.

## 24. Frontend Dependencies

Settings header, Card, Badge, Check/Minus.

## 25. Responsive Behavior

Wide pane; wrap stepper `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: back link.
LIKELY ISSUE: fake stepper not a real wizard (`index === 0` always branded).
REQUIRES MANUAL TEST: disconnect confirm.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-021-01 | MEDIUM | Decorative stepper always step 1 active | Looks unfinished | `apps/meta.tsx` |
| SET-021-02 | LOW | Overlaps SCR-SET-017 connection card | Two manage UIs | routes |
| SET-021-03 | OBSERVATION | Crawl never sees 200 | Seed has no Meta | runtime 302 |

## 28. Consistency Comparison

Closer to Setup finish than SettingsCard stack. Wide like Meta settings.

## 29. Functional Preservation Contract

- Redirect if not connected
- Account/token/graph/unlocks/assets/scopes
- Disconnect + audit + toast
- No raw tokens
- Not a nav destination

## 30. Design Input Contract

Purpose: inspect and revoke Meta grant.
Primary action: Disconnect.
Secondary: back to Apps.
Required information: account, dates, token class, unlocks, pages, ad accounts, scopes.
Required states: redirect-disconnected, connected, empty assets.
Must not remove: 302 guard; encrypted-token copy; Meta-side revoke note.

## 31. Open Questions / Unknowns

- Instagram accounts passed as `instagram_accounts` in controller publicAssets but page type omits them `[CONFIRMED-CODE]` — IG list missing on this page
- Whether `instagram_connected` should change badge `[UNKNOWN]`
