# EvoCrm product-ready (G6)

Stop gate before the Mobbin Salesforce / HubSpot chrome redesign. Accurate against `main` at #182 (desk/outbound #179, G4 policies #180, simple mode #181, Sanctum `/api/v1` #182).

**Trunk is this repo** ([Mohamedbeghanem/EvoCrm](https://github.com/Mohamedbeghanem/EvoCrm), ex-EvoSales). Evomerde is the retired DS host, not trunk.

Gate: `php artisan evocrm:product-ready` (existence + validator only — it does not run Pest). CI (`composer ci:check` → `php artisan test`) must stay green.

## Write workflows that exist

Authenticated writes sit behind `EnforceProductPermissions` and, from #181, `EnforceSimpleMode`. Record mutations also call G4 policies.

| Surface | Write path | What the code does |
| --- | --- | --- |
| Contacts | `POST /crm/contacts` | `ContactController@store` → `authorize('create', Contact::class)` → `ContactIdentity::createUnique` (Algeria-first). Update / attributes / import / merge / bulk also exist. |
| Companies | `POST /crm/companies` | `CompanyController@store` → `authorize('create', Company::class)`. Country forced `DZ`. |
| Leads | `POST /crm/leads` | `LeadController@store` → `authorize('create', Lead::class)`. Qualify is `POST /crm/leads/{lead}/qualify` + `LeadPolicy::qualify`. |
| Deals + move | `POST /crm/deals`, `POST /crm/deals/{deal}/move` | Create + `DealController@move` → `authorize('move', $deal)` → `$deal->moveTo($stage)`. Same engine as `/crm/deals/board` and `/leads`. |
| Activities | `POST /crm/activities` | `ActivityController@store` → `authorize('create', Activity::class)` → `ActivityRecorder`. Types: note / task / call / meeting / email. |
| Quotes | `POST /crm/deals/{deal}/quotes`, `POST /crm/quotes/{quote}/send` | Create + email send. **Public accept is atomic:** `POST /q/{token}/accept` → `QuoteAcceptanceController` → `QuoteAcceptor` (`lockForUpdate`, activity + audit + workflow inside the transaction; WhatsApp confirm after commit). |
| Outbound | `outbound:run`, IMAP poll, bounce webhook | `QuietHoursGuard` defers sends (default 21:00–08:00 `Africa/Algiers`). Hard bounce (`BounceProcessor` + `POST /webhooks/outbound/bounces/{webhookKey}`) writes suppression. IMAP reply (`ImapReplyPoller`) sets `replied_at` and pauses the active enrollment unless the step has `on_reply_step`. |
| Ads | `POST /ads/sync` | `AdsCenterController@sync` → `MetaAdsService` when workspace Meta is connected. Hub is read + sync, not ad creation. |
| Desk iframe CSP | `/inbox` | `EmbedSecurityHeaders` sets `frame-ancestors` (CRM hosts) + `frame-src` (desk). `X-Frame-Options` is stripped. Desk vhost headers are not set from this repo — see `docs/desk-iframe-headers.md`. |
| `/book` | `GET/POST /book/{slug}` | Public `MeetingBookController` → `MeetingBooker` (Algerian mobile required). Throttled store. |
| Google / Meta auth | `/auth/google`, `/auth/google/callback`, `/auth/meta`, `/auth/meta/callback` | Google: guest login + authenticated Gmail/Calendar reconnect; hops onto the callback host when the request host differs (#178). Meta: Facebook Login, 404 unless `META_*` is set; tokens encrypted on `integrations`. |

WhatsApp: Evolution `WHATSAPP-BAILEYS` (QR) and `WHATSAPP-BUSINESS` are first-class. OpenWA and linked-device takeovers throw `UnofficialWhatsAppRefused`.

## Authz

- **Route layer:** `App\Http\Middleware\EnforceProductPermissions` maps unsafe methods (and a few named exports/imports) to `canPermission(...)` — `crm.edit`, `outbound.manage`, `ads.manage`, `desk.manage`, settings keys, etc.
- **G4 policies (#180):** `ContactPolicy`, `CompanyPolicy`, `LeadPolicy`, `DealPolicy`, `QuotePolicy`, `ActivityPolicy`. Shared trait `AuthorizesWorkspaceCrmRecord`: same-workspace view; `crm.edit` for create/update/delete. Extra verbs: `DealPolicy::move`, `LeadPolicy::qualify`, `QuotePolicy::acceptInternal`.
- Registered in `AppServiceProvider`. Controllers call `$this->authorize(...)` on the write actions above.

## Simple mode (EVO-27 / #181)

Default **ON** for new workspaces: `workspaces.simple_mode` boolean default `true` (migration backfills existing rows to `false`). `WorkspaceProvisioner` sets `simple_mode => true`. Owner/admin toggle at `PUT /settings/workspace`.

`App\Support\SimpleMode` + `EnforceSimpleMode`: rail is Home / Contacts / Deals / Inbox / Quotes. Blocked while on: `/crm/tickets`, `/ads`, `/outbound/warmup`, `/crm/report-builder`, Ask Evo / draft-email, desk-open-ticket.

## Public HTTP API (Sanctum) — landed (#182)

`laravel/sanctum` is in `composer.json`. `bootstrap/app.php` registers `api: routes/api.php`. Tokens belong to a Fortify user and are stamped `workspace:{id}`; authenticated routes use `auth:sanctum` + `api-workspace` (`EnsureApiWorkspaceToken`) + `EnforceProductPermissions`. **Web Inertia remains the system of record.** Contract: [api-v1.md](../api-v1.md). Endpoints below are only those in `routes/api.php` — do not invent more.

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/v1/auth/token` | Issue bearer token (throttle 10/min). Email + password + `device_name`. |
| `DELETE` | `/api/v1/auth/token` | Revoke current token. |
| `GET` | `/api/v1/me` | User + workspace + permissions. |
| `GET` `POST` | `/api/v1/contacts` | List / create (`ContactIdentity::createUnique`). |
| `GET` `PUT` | `/api/v1/contacts/{contact}` | Workspace-scoped. |
| `GET` | `/api/v1/leads/board` | Same deal pipeline as `/crm/deals/board`. |
| `GET` | `/api/v1/leads/{lead}` | |
| `POST` | `/api/v1/leads/{lead}/qualify` | Wraps `LeadConverter::convert`. |
| `GET` | `/api/v1/deals/{deal}` | |
| `POST` | `/api/v1/deals/{deal}/move` | `Deal::moveTo`. |
| `GET` `POST` | `/api/v1/activities` | `ActivityRecorder`. |
| `GET` | `/api/v1/quotes/{quote}` | Read-only. |
| `POST` | `/api/v1/quotes/{quote}/send` | `QuoteMailer`. Accept stays `POST /q/{token}` → `QuoteAcceptor`. |
| `GET` | `/api/v1/threads` | Desk history. |
| `POST` | `/api/v1/threads/{thread}/reply` | `DeskComposer::reply` — not a second chat engine. |
| `POST` | `/api/v1/devices` | APNs / FCM token upsert. |

Not in v1: import, Data Hub, tickets, SMS, warmup, ads.

## CI

`.github/workflows/tests.yml` → `composer ci:check` → `php artisan test`. Product-ready means that job is green. The Artisan gate does **not** re-run the suite.

## Explicitly not this file

- **Next:** Mobbin Salesforce / HubSpot chrome ([#172](https://github.com/Mohamedbeghanem/EvoCrm/issues/172)). Do not start it from this gate.
- **Brand paint** (Slate vs `#EC6025`) is a founder decision. This file does not pick a palette.
