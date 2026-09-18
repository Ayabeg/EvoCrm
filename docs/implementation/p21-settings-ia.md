# P21 — Settings Information Architecture

**PR:** One searchable Settings workspace. IA + composition only.  
**Baseline:** `main` @ `71e3d8b8db85a3e253520b56bfd9603c184d45ac` (P17 #226 / Wave-1 base).  
**Date:** 2026-09-17.

P00–P17 frozen. Parallel Wave 1: this lane does not pull or cherry-pick P18 Quotes or P19 Automation. P21 is not a settings capability rewrite, not SettingsV2, not a second Command OS, and not P22 Integrations redesign.

Live Contabo deploy + populated QA is owned by Research after this PR opens.

---

## P21 STATUS

Audit complete on fresh main @ `71e3d8b` **before** product code. CURRENT SETTINGS INVENTORY recorded below. The active `resources/js/layouts/settings/layout.tsx` remains the only Settings shell. No SettingsV2 / NewSettings / SettingsShell2.

**MERGE READY: NO** until Research Contabo populated QA is PASS.

## BASE / PR / TIP

- Base: `71e3d8b8db85a3e253520b56bfd9603c184d45ac`
- Branch: `cursor/p21-settings-ia`
- PR title: P21 — Settings IA
- Tip: this branch after the P21 commits

---

## AUDIT

Inspected on fresh main @ `71e3d8b` **before coding**. Search hits for settings, preferences, profile, password, security, appearance, workspace, member, team, meeting, property, pipeline, qualification, layout, whatsapp, meta, email, sms, integration, connector, api, webhook, billing, danger confirmed the inventory below.

| Area | Paths |
|---|---|
| Shell | `layouts/settings/layout.tsx` — You / Workspace / Integrations / CRM / Admin. Applied in `app.tsx` for every `settings/*` page. |
| Chrome | `components/settings/chrome.tsx` — page header, card, form row, save bar, empty. |
| Routes | `routes/settings.php` + `routes/web.php` settings block. `/settings` → `/settings/profile`. |
| Personal | Profile, Security (Fortify + optional 2FA), Appearance. |
| Workspace | Workspace (owner), People (owner/admin), Meetings, Get started wizard. **No Teams page.** |
| CRM | Attributes, Pipelines, Qualify, Quotas, Record layouts, Playbooks. |
| Channels | Evolution WhatsApp, WhatsApp Cloud, WhatsApp Business, Meta, Channels (Desk embed), SMS. |
| Integrations | Apps marketplace, Connectors, Apps/Meta manage. |
| Admin | Permissions, Audit, System health. **No API or Webhooks settings UI.** |
| Billing | None. |
| Automation | No `/settings/workflows`. Workflows stay `/crm/workflows` (P19). Playbooks are CRM config. |
| Search | None on the settings page. P16 Command OS Navigate has one Settings entry (`/settings`). |
| Permissions | Client `requiredPermissionByHref` + `adminOnlyHrefs` + owner-only workspace + simple-mode SMS. Server: `can-manage-settings`, `EnforceProductPermissions` (settings.php group), controller abort. |

## CURRENT SETTINGS INVENTORY

| Route | Label (pre-P21) | Category (pre) | Permission / guard | Controller | Source of truth | Form / mutation | Nav | Notes |
|---|---|---|---|---|---|---|---|---|
| `GET /settings` | — | — | auth | redirect | — | — | — | Alias → `/settings/profile` |
| `/settings/profile` | Profile | You | auth | `ProfileController` | `users` | PATCH profile; DELETE account | Yes | Fortify. Danger: delete account |
| `/settings/security` | Security | You | auth + password confirm | `SecurityController` | Fortify | PUT password; 2FA only if enabled | Yes | No fake passkeys |
| `/settings/appearance` | Appearance | You | verified | Inertia page | client theme | appearance hook | Yes | Light cabinet |
| `/settings/workspace` | Workspace | Workspace | owner (`can-manage-settings` + role) | `WorkspaceSettingsController` | `workspaces.simple_mode` | PUT | Owner only | Relabel General |
| `/settings/people` | People | Workspace | owner/admin | `PeopleController` | `users` | invite / role / destroy | Manager | Relabel Members. No Teams |
| `/settings/meetings` | Meetings | Workspace | verified | `MeetingScheduleController` | workspace meeting fields | PUT | Yes | |
| `/settings/setup` | Get started | Workspace | auth | `OAuthSetupController` | connectors | wizard steps | Yes | Relabel Setup. Not a fake complete |
| `/settings/setup/{provider}` | Setup wizard | Workspace | auth | `OAuthSetupController` | same | POST meta page | Child | Deep link |
| `/settings/attributes` | Custom attributes | CRM | GET open; mutate `settings.attributes` | `CustomAttributeController` | attribute definitions | POST/PUT/DELETE | Capability | Relabel Properties |
| `/settings/pipelines` | Pipelines | CRM | GET open; mutate `settings.pipelines` | `PipelineController` | pipelines/stages | CRUD + reorder | Capability | P11 semantics untouched |
| `/settings/qualify` | Qualify | CRM | `can-manage-settings` | `LeadScoreSettingsController` | score thresholds | PUT | Admin | Relabel Qualification |
| `/settings/quotas` | Quotas | CRM | `can-manage-settings` | `QuotaController` | quotas | PUT | Admin | |
| `/settings/record-layouts` | Record layouts | CRM | `can-manage-settings` + attributes | `RecordLayoutSettingsController` | layouts | page only | Hidden from members | |
| `/settings/playbooks` | Playbooks | CRM | `can-manage-settings` | `PlaybookController` | playbooks | POST/PUT/DELETE | Admin | Not workflow editor |
| `/settings/evolution` | WhatsApp | Integrations | GET open; nav `settings.integrations` | `EvolutionSettingsController` | Evolution | sync + deep links | Yes | Canonical WhatsApp |
| `/settings/whatsapp` | WhatsApp | — | same | `WhatsAppController` | phone channel | connect / delete | **Not in old nav** | Real page. Now Communication |
| `/settings/whatsapp-business` | WhatsApp Business | — | same | `WhatsAppController` | WABA | connect / delete | **Not in old nav** | Real page. Now Communication |
| `/settings/meta` | Meta | Integrations | GET open; mutate manager | `MetaSettingsController` | Meta integration | ad account / mappings / sync | Yes | IA only. P22 owns redesign |
| `/settings/channels` | Channels | Integrations | GET open; nav integrations | `ChannelSettingsController` | Desk URL + channels | POST | Yes | Closest email/desk surface |
| `/settings/sms` | SMS | Integrations | `can-manage-settings` | `SmsSettingsController` | SMS integration | POST / DELETE | Integrations + simple-mode | Danger: disconnect |
| `/settings/apps` | Apps | Integrations | GET open; nav integrations | `AppsController` | integrations | directory | Yes | P22 redesign later |
| `/settings/apps/meta` | Meta app | Integrations | auth | `AppsController` | Meta OAuth | DELETE disconnect | Child of Apps | |
| `/settings/connectors` | Connectors | Integrations | GET open; nav integrations | `ConnectorController` | connectors | store / sync / pause | Yes | Wave 5 “No Baileys” stays |
| `/settings/permissions` | Permissions | Admin | controller `canManageSettings` | `PermissionsController` | member permissions | PUT | Admin | Relabel group Developer |
| `/settings/audit` | Audit trail | Admin | `can-manage-settings` | `AuditTrailController` | audit log | read | Admin | |
| `/settings/system-health` | System health | Admin | `can-manage-settings` | `SystemHealthController` | health services | read | Admin | |
| `/webhooks/*` | — | inbound | public signed | webhook controllers | endpoints | — | **No settings UI** | Not a Developer leaf |
| Billing / Teams / Email / API tokens | — | — | — | — | — | — | **Absent** | Do not invent |

Legacy aliases: `/settings` → profile. `/settings/setup` → `/settings/setup/start`. No SettingsV2.

---

## TARGET IA (IMPLEMENTED)

Max two nav levels: group → leaf. Existing hrefs only.

| Group | Scope | Leaves |
|---|---|---|
| **Personal** | `ME` | Profile, Security, Appearance |
| **Workspace** | `WORKSPACE` | General (`/settings/workspace`, owner), Members (`/settings/people`), Meetings, Setup (`/settings/setup`) |
| **CRM** | `CRM` | Properties, Pipelines, Qualification, Quotas, Record layouts, Playbooks |
| **Communication** | `CHANNEL` | WhatsApp, WhatsApp Cloud, WhatsApp Business, Meta, Channels, SMS |
| **Integrations** | `INTEGRATION` | Apps, Connectors |
| **Developer** | `DEVELOPER` | Permissions, Audit trail, System health |

Omitted (no real page): Automation group, Teams, Email, Billing, API, Webhooks.

Admin → Developer (not both). Get started is Setup under Workspace, not a permanent top-level peer.

## ONE SETTINGS SHELL

`layouts/settings/layout.tsx` is the only shell. `app.tsx` still wraps `settings/*` with `[AppLayout, SettingsLayout]`. Catalog lives in `lib/settings/ia.ts` so nav, search, and permission filters share one list.

## SEARCH

Local destination filter over **authorized** catalog rows. Title / group / scope / href / keywords. Not record search. Not P16 Command OS. P16 still has a single Navigate item to `/settings`.

## ROUTE LAW

No route files changed. Bookmarked URLs stay. Deep links use Inertia `Link` / `router.visit`. Active state is exact path or `href/` child, so `/settings/whatsapp` does not steal `/settings/whatsapp-business`. Profile is never treated as parent of every `/settings/*` page.

## SECTIONS

Personal / Workspace / CRM / Communication / Integrations / Developer as above. Danger stays on the object (profile delete, SMS disconnect, people row, pipeline/attribute delete). No dump danger page. Fortify / 2FA / passkeys not rewritten. P19 workflow editor not touched. Apps / Connectors chrome not redesigned.

## FORMS / SAVE / UX

Existing mutations and Save vs immediate-toggle semantics unchanged. Chrome typography only: page 28/34/650, section 18/26/600, body 14/20, label 13/18/500, help 12–13. Forms `max-w-[900px]`; wide tables stay wide.

## VISUAL

Stable nav + calm forms. Canvas `#F7F7F5` / `bg-canvas`, white cards, brand `#E8530E` on active rail and Save. No card-grid settings home.

## RESPONSIVE

`lg+`: grouped rail. `<lg`: search + native select (no dual columns, no horizontal nav overflow). 1440 / 1280 / 1024 / 768. Contabo walk is Research.

## SHARED-SURFACE CHANGES

| FILE | WHY | CHANGE | COMPATIBILITY | OTHER LANES AT RISK |
|---|---|---|---|---|
| `tests/Feature/EvoCrmWave5SettingsChromeTest.php` | Wave 5 locked You/Admin labels | Assert Personal/Developer catalog + one-shell locks | Href and chrome contracts kept | None if they still read Wave 5 strings |
| `resources/js/pages/settings/{people,attributes,qualify,workspace}.tsx` | IA labels | People→Members, attributes→Properties, Qualify→Qualification, Workspace→General | URLs and mutations unchanged | P22 should keep `/settings/people` etc. |

Not touched: `command-os.ts`, `app.tsx` (import path unchanged), `routes/*.php`, P19 workflow editor, Apps/Connectors presentation.

## HANDOFFS

- **P22:** Apps, Connectors, Meta credentials/health/disconnect, API/webhooks if those pages are built.
- **P23:** Setup remains a Workspace deep link. Wizard dismiss is not configured.
- **P28:** Old You/Admin labels, Get started copy on Apps, unused aliases — document, do not delete here.

## TESTS

- `tests/Feature/Settings/SettingsInformationArchitectureTest.php`
- Updated `EvoCrmWave5SettingsChromeTest`
- Existing Settings/*, People, Connectors, FirstRunSetup, Security, Profile

Commands:

| Command | Result |
|---|---|
| Focused Pest (P21 + Wave5 + Settings/* + FirstRun + PipelineSettings) | **82 passed** |
| `php artisan test` | **962 passed** (12117 assertions) |
| eslint on P21-touched JS | **pass** |
| `npm run types:check` | **pass** |
| `composer types:check` | Repo-wide phpstan already red on main-era files. Not a GitHub CI gate (`composer ci:check` = Pest only). |
| `npm run build` | **pass** |

## LIVE VISUAL QA

**NEEDS RESEARCH.** Agent did not walk Contabo populated Settings. Research owns Contabo after the PR opens.

## REGRESSIONS

P17 Dashboard, P16 Command (single Settings navigate), P15 Activities, P13/P14 Inbox, P11 Deals/Pipeline, P19 untouched, app shell unchanged.

## ACCEPTABLE DEFERRALS

Deep integration redesign; billing; full-text search; personalization; recents; AI help; perfect mobile; Teams/Email/API/Webhooks pages that do not exist.

## RISKS

- Operators who memorized You / People / Custom attributes / Admin need the new labels (URLs unchanged).
- Members with a granted `settings.integrations` capability no longer see SMS in nav (route is `can-manage-settings` / 403). That closes a pre-existing 403-after-click leak.
- Contabo is a merge blocker owned by Research.

## FILES CHANGED

- `resources/js/lib/settings/ia.ts` (new catalog)
- `resources/js/layouts/settings/layout.tsx`
- `resources/js/components/settings/chrome.tsx`
- `resources/js/pages/settings/{people,attributes,qualify,workspace}.tsx`
- `tests/Feature/Settings/SettingsInformationArchitectureTest.php`
- `tests/Feature/EvoCrmWave5SettingsChromeTest.php`
- `docs/implementation/p21-settings-ia.md`

## MERGE READY

NO — Contabo populated QA pending Research. Do not merge. Do not start P22.
