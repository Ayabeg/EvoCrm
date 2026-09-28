# Setup wizard (OAuth / first-run)

## 1. Screen Identity

Screen ID: SCR-SET-007
Product area: Settings / Workspace
Route: `/settings/setup` → 302 `/settings/setup/start`; `/settings/setup/{provider}`
Route names: `settings.setup.start`, `settings.setup.show`, `settings.setup.meta.page` POST
Frontend file: `resources/js/pages/settings/setup/wizard.tsx`
Primary component: `OAuthSetupWizard`
Layout: `[AppLayout, SettingsLayout]` (component prefix `settings/`). Not in `WIDE_SETTINGS_COMPONENTS`.
Authentication: `auth` + `verified` + `EnforceProductPermissions` + `EnforceSimpleMode` (web.php group). GET is safe → EPP skips. POST meta page → `settings.integrations`.
Permissions: **Nav:** no extra flags (all authorized users see “Setup”). Mutations: Meta page save needs connected Meta + `settings.integrations` on POST. Disconnect Meta from finish step is DELETE `/settings/apps/meta` → `can-manage-settings`.
Parent navigation: Settings IA **Workspace**, title **Setup**, href `/settings/setup`.
Entry points: settings nav Setup; Apps “Get started”; Apps empty “Open setup”; Apps Google/WhatsApp `setup_url`.
Exit points: `/dashboard`, `/settings/apps`, `/settings/apps/meta`, skip links between steps, Facebook/Google OAuth.
Runtime HTTP (owner, simple_mode=true): `/settings/setup` **302** → `http://127.0.0.1:8000/settings/setup/start` `[CONFIRMED-UI]`. Wizard **200** not in runtime-index `[UNVERIFIED]`.
Evidence: `OAuthSetupController`; `config/oauth_setup.php`; `wizard.tsx`; `routes/web.php`.

## 2. Purpose

Kommo-style stepper to connect Google Calendar, WhatsApp (Meta), Algeria SMS, and a dedicated Meta app flow (select → connect → finish).

## 3. Current UX Summary

Back link to Apps, H1 “Connect {providerName}”, `SetupStepper`, step body, optional troubleshooting links. Providers in config: `start` (workspace first-run) and `meta`.

## 4. Screen Anatomy

1. App + settings chrome
2. Link “Apps” + title + tagline
3. Stepper
4. Step section (`aria-labelledby="setup-step-title"`)
5. Troubleshooting card (external docs)

**start steps:** Google Calendar → WhatsApp → SMS → Finish.
**meta steps:** Select app → Connect Facebook → Finish (unlocks, default Page, uninstall).

## 5. Data Displayed

Inertia: `provider`, `providerName`, `tagline`, `steps`, `currentStep`, `stepIndex`, `troubleshooting`, `connectUrl`, `appsUrl`, `metaState`, `startState` `[CONFIRMED-CODE]`.

`startState`: google connected/configured/connect_url; whatsapp connected/connect_url; sms connected/key_set/url/sender.
`metaState`: configured/connected/account/pages/selected page/unlocks.

## 6. Primary Actions

- Continue with Google / Facebook
- Save SMS key (POST `/settings/sms` with `return=start`)
- Save default Facebook Page (POST `/settings/setup/meta/page`)
- Go to Home / Apps
- Disconnect Meta (finish, confirm)

## 7. Secondary Actions

Skip/Back between steps; “Skip to finish” on Meta connect; “Manage connection” to `/settings/apps/meta`.

## 8. Search

NOT PRESENT.

## 9. Filters

Query `?step=` selects step; invalid step falls back to first `[CONFIRMED-CODE]`.

## 10. Sorting

NOT APPLICABLE. Step order from config.

## 11. Selection

Meta default Page `<select name="page_id">`.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Step-by-step Inertia visits. Session stores `oauth_setup.{provider}.step`.

## 14. Forms

- SMS: hidden driver=http, method=POST, auth=form; url, api_key, sender; gated by SMS controller (can-manage-settings) — **members hitting this step may 403** `[CONFIRMED-CODE]`
- Meta page: `page_id` must exist on grant
- Disconnect: DELETE apps/meta

## 15. Overlays

`window.confirm` on Meta disconnect. Brand connect may open Facebook popup `[UNVERIFIED]` (`popup=1`).

## 16. States

Google: connected / connect URL / not configured.
WhatsApp: connected badge vs BrandConnectButtons.
SMS: gateway saved badge vs form.
Meta: not connected, already connected, no pages, unlocks granted/not.
Unknown provider → 404 `[CONFIRMED-CODE]`. Unconfigured step keys → “Step content … is not configured yet.”

## 17. Empty State

“Meta is not connected yet” card; “Google is not configured on this install”; “No Facebook Pages discovered”.

## 18. Error Handling

404 unknown provider; 404/422 page save if Meta disconnected or page not in grant. SMS validation via SMS controller.

## 19. Feedback

Toast on page save and SMS save `[CONFIRMED-CODE]`. Status rows with Check/Minus on finish.

## 20. Navigation Behavior

`/settings/setup` always redirects to provider `start`. Step URLs `/settings/setup/{provider}?step=`. Breadcrumbs: Apps → Setup. Simple mode does **not** block this path (`SimpleMode::blocks` omits setup) `[CONFIRMED-CODE]`. SMS nav is hidden in simple mode but this wizard still includes SMS step `[CONFIRMED-CODE]`.

## 21. Entity Relationships

Google Calendar connector; Meta/WhatsApp/WhatsApp Business integrations; SMS integration; Apps marketplace.

## 22. Business Rules

- Only `start` and `meta` configs exist
- SMS POST requires can-manage-settings (owner/admin)
- Meta disconnect requires can-manage-settings
- Facebook login is the WhatsApp path (no App ID typed)
- SMS only Algerian mobiles (copy; enforcement on send path)

## 23. Backend Dependencies

`OAuthSetupController`, `config/oauth_setup.php`, `GoogleAuth`, `MetaAuth`, `SmsSettingsController`, `AppsController::destroyMeta`.

## 24. Frontend Dependencies

`SetupStepper`, `BrandConnectButtons`, `GoogleMark`/`MetaMark`, `Card`, `Badge`.

## 25. Responsive Behavior

Flex wrap buttons; cards stack `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: step heading id, decorative icons aria-hidden.
LIKELY ISSUE: stepper component a11y `[UNVERIFIED]`; confirm() not accessible.
REQUIRES MANUAL TEST: OAuth popup, keyboard.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-007-01 | HIGH | SMS step POSTs `/settings/sms` which is can-manage-settings | Members in Setup nav can open wizard then fail save | `settings.php` vs IA Setup unguarded |
| SET-007-02 | MEDIUM | Simple mode hides SMS settings but wizard still asks for SMS | Confusing launch path | `SimpleMode::features` vs wizard |
| SET-007-03 | LOW | Wizard chrome (Cards/muted) differs from SettingsCard hairline | Visual inconsistency | `wizard.tsx` |

## 28. Consistency Comparison

Does not use `SettingsPageHeader`/`SettingsCard` except Apps-meta-like cards. Unique stepper.

## 29. Functional Preservation Contract

- Redirect `/settings/setup` → start
- start: Google, WhatsApp, SMS, finish status
- meta: select, connect, finish, page pick, disconnect
- Skip/back
- Troubleshooting outbound links
- Session current step

## 30. Design Input Contract

Purpose: first-run connect without typing secrets (except SMS key).
Primary actions: OAuth continue, save SMS, save page, finish to Home.
Required information: per-step connected flags, unlocks, pages.
Required states: not configured, connected, skipped, error.
Must not remove: official Facebook/Google paths; encrypted SMS key; no fake providers.

## 31. Open Questions / Unknowns

- HTTP 200 body of `/settings/setup/start` on this DB `[UNVERIFIED]`
- Whether Meta provider is linked from Apps when disconnected `[UNVERIFIED]` (`setup_url`)
