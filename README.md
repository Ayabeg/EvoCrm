# EvoCrm

EvoCrm is Evotechly’s **all-in-one sales OS** (CRM + Desk + Outbound + Ads): one workspace, one login, four rooms. Renamed from EvoSales on 2026-09-13. GitHub: [Mohamedbeghanem/EvoCrm](https://github.com/Mohamedbeghanem/EvoCrm).

1. **Desk** — **[EvoDesk](https://github.com/Mohamedbeghanem/evodesk)** (Chatwoot Community, MIT) **embedded at `/inbox`**. The iframe source is `EVOSALES_INBOX_URL` (default `https://desk.evotechly.com`) plus optional `EVOSALES_INBOX_EMBED_PATH` (default `/`; Chatwoot serves the agent app at `/app`). Operators never leave the CRM hostname — there is no "Open Desk" eject. If EvoDesk sends `X-Frame-Options`, allow-frame the CRM origin on the desk; clearing the workspace inbox URL makes `/inbox` serve the native CRM conversation desk instead. EvoCrm does **not** vendor Chatwoot, does **not** copy Chatwoot CSS/assets, and the Laravel page is **not** a Chatwoot clone. A lightweight **conversation history** list stays in CRM as contact ↔ deal context synced from the desk.
2. **CRM (Sales Hub)** — list + detail + associations sidebar. Activity timeline (notes/tasks/calls/meetings), owners, Algeria city/wilaya lists, custom attributes, light quotes, light reports. **`/reports` is the analytics room**: default per-category rooms (Pipeline, Leads, Outbound, Ads, Desk, Activity) plus saved dashboards (name / owner / EvoViz widgets JSON), an add-widget picker that reuses the existing chart components, and global owner + date-range filters. Contact and deal records include **Ask Evo** (answers from this record's fields + recent activities; live OpenAI/Anthropic only when those env keys are set, otherwise a deterministic field stub) and deals show an Evo **deal health** score 0–100. Not a contact list. Not HubSpot Breeze. **`/crm/deals/board` is the deals Board** next to the existing list hub (`/crm/deals`): same pipeline stages (New → Qualified → Demo → Proposal → Won / Lost), drag a card to persist stage (`POST /crm/deals/{deal}/move`), per-column count + DZD total + weighted forecast, and a pipeline picker when the workspace has more than one pipeline. Weighted amount uses stage win probability (0–100): stored `stages.probability` if set, otherwise **New 10, Qualified 25, Demo 50, Proposal 75, Won 100, Lost 0** (unknown open stages 20) — see `config/evosales.php`. **`/leads` is the Kommo-style pipeline board**: horizontal stages (New → Qualified → Demo → Proposal → Won / Lost) with colored underlines, cards showing contact/company, DZD amount, and next task; quick-add on the first column; a top strip for Active / tasks due today / without tasks / overdue / new today; search. Dragging a card between stages updates the deal (`POST /crm/deals/{deal}/move`). It is the same deal engine as `/crm/deals` — no parallel pipeline.
3. **Ads Hub** — Meta ad accounts, campaigns, ad sets, ads, and a per-campaign funnel board: Impressions → Clicks → Conversations/Leads → Qualified → Deals → Won. Official Marketing API sync when `META_*` env is set (`POST /ads/sync`); demo seed data otherwise. Click-to-WhatsApp and lead-form campaigns only — lead forms ingest through a workspace-scoped `/webhooks/meta/leads/{webhookKey}` endpoint into CRM contacts/leads/deals.
4. **Outbound Center** — the full email department at `/outbound`: SMTP + IMAP mailboxes (warmup status, daily limit, test send, full edit), sending domains with an SPF/DKIM/DMARC checklist (records stored for the operator to publish; manual verified mark — no DNS API), HTML+text templates with `{{variables}}` and a rendered preview, email sequences (per-step delay/mailbox/template, enroll contacts or whole CRM lists, pause/resume), **broadcast campaigns** (one-shot newsletter to all contacts with email or a saved contact list, scheduled or send-now, every recipient logged as an OutboundMessage), outbox with deferred states, idempotent IMAP replies with conservative classification and explicit-unsubscribe suppression, delivery/bounce/complaint provider events, honest reports (provider-accepted sends / confirmed deliveries / bounces / complaints / replies; opens remain secondary signals), quiet hours, unsubscribe, suppression. `outbound:run` dispatches due sequence steps and campaign messages every minute; `outbound:poll-replies` reads IMAP. The unsubscribe link and all tracking URLs stay on the CRM hostname.

   **`outbound.evotechly.com` is the live mail stack (EvoOutreach).** The CRM uses it for **SMTP send**, **IMAP reply polling**, and **Roundcube webmail**. Set `EVOSALES_MAIL_API_TOKEN` and every mailbox on the stack syncs into `/outbound/mailboxes` automatically (`outbound:sync-mailboxes` every 15 minutes, or the Sync button on the page); SMTP/IMAP hosts come from `EVOSALES_SMTP_*` / `EVOSALES_IMAP_*` (defaults `outbound.evotechly.com` 587/tls + 993/ssl). The stack's BillionMail marketing dashboard is **not** linked, iframed, or vendored (AGPL) — the only stack URL in the product is Roundcube (`EVOSALES_ROUNDCUBE_URL`, default `https://outbound.evotechly.com/roundcube/`). Campaigns and sequences live natively in the CRM.

   **Mailbox warmup** lives at `/outbound/warmup`: per enabled box a warmup toggle (status warming vs active), plan day, today's cap, sent/remaining, 14-day fail rate, an EvoViz sent-vs-cap history, and tomorrow's cap preview. The ramp is conservative — 8, 12, 18, 25, 35, 45, then holds at the per-mailbox ceiling (default 40) — and the scheduled `outbound:warmup` command (daily, Africa/Algiers) advances one plan day per date and writes `daily_limit` itself. System roles (abuse@, dmarc@, postmaster@, noreply@) stay out unless explicitly opted in. Optional peer pings run **only between the workspace's own enabled non-system mailboxes**, a few per day well under the cap, never during quiet hours, and never under Pest — there is no third-party warmup network and no seed inboxes.

This is **slice 2 + Sales Hub**: a sales rep lives in CRM the way they live in Chatwoot inbox — without cloning Chatwoot. Desk remains EvoDesk.

### Acquisition systems

- **Dead Magnet:** `/lead-magnet/{workspace-slug}/lead-leakage-calculator` provides a transparent, user-assumption-based lead leakage calculator, duplicate-safe submission capture, separate delivery/marketing/enrichment consent, queued result delivery, demo handoff, and attributed booking analytics.
- **Dead Enrichment:** existing contacts, companies, and leads can be imported, enriched from the approved website/Google Places adapters, reviewed through provenance-backed enrichment runs, scored for data quality, and queued individually or in workspace-scoped batches. Run stale maintenance explicitly with `php artisan leads:enrich --stale-hours=168`.
- Contact CSV imports retain usable incomplete business rows, queue enrichment for missing email/phone data after commit, and keep repeated incomplete imports idempotent; blank or ambiguous rows remain visible as row errors.

Default timezone: **Africa/Algiers**. Algeria-first (`+213`). Default locale: **French (`APP_LOCALE=fr`)** with English fallback (`APP_FALLBACK_LOCALE=en`). Company: **Evotechly**.

## What this is not

- **WhatsApp is Evolution-native.** Phone WhatsApp uses Evolution `WHATSAPP-BAILEYS` (QR). WhatsApp Business uses Evolution `WHATSAPP-BUSINESS` (Facebook Login + Graph WABA). OpenWA and linked-device takeovers stay refused. Clients never type Evolution or Cloud keys.
- **Not a Kommo / amoCRM clone.**
- **Not an Instantly clone.**
- **Not a Laravel Chatwoot clone.** The sold desk is EvoDesk / Chatwoot Community MIT. The in-app thread list is CRM history only.

## Brand

EvoCrm is **paper + ink + accent**. Do not invent more.

- Product mark: `public/brand/evocrm/logo.svg` (artwork fill `#E8530E`, do not recolor). Favicon is the mark.
- Tokens in `resources/css/app.css` (P02 lock, see [`docs/design-system.md`](docs/design-system.md)): canvas `#F7F7F5`, surface `#FFFFFF`, text `#161616`, border `#E3E3DF`, accent `#E8530E`, Geist.
- Accent `#E8530E` is the mark, active rail, focus, and selected chrome — not a page wash. Filled primary CTAs use the accent.
- **Two faces, chosen in Settings → Appearance** (persisted via the `appearance` cookie + `localStorage`; `app.blade.php` stamps `class="dark"` on `<html>` only for an explicit Dark choice):
  - **Light Cabinet** (default): white cards + hairlines, Chatwoot dark rail (`#151718`) on the left, ~52px topbar.
  - **Dark Cabinet**: TRUE BLACK — canvas `#000000`, elevated surfaces `#0A0A0A`, hairline `#1F1F1F`, ink `#F5F5F5`, mute `#A3A3A3`. Neutral grays only: no navy, blue, indigo, or teal tints in dark tokens. The rail reads black (`#000000`) with the same Chatwoot structure.
- Titles and auth mail: **EvoCrm · Evotechly**.

## Stack

Laravel 13 · PHP 8.3+ · Inertia 3 · React 19 · TypeScript · Tailwind 4 · Fortify · Pest · Vite. SQLite locally, MySQL-ready. Geist via `@fontsource/geist-sans` (Bunny Geist as well).

## Run locally

```bash
composer setup
php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
```

`composer setup` installs PHP/JS deps, copies `.env.example`, generates `APP_KEY`, migrates SQLite, seeds, and builds Vite assets.

### Apps marketplace (Settings → Apps)

`/settings/apps` is the mini-app marketplace. First wave only, every tile real:

1. **Meta** — one official Facebook Login OAuth (Laravel Socialite) unlocks **Facebook Page, Instagram, WhatsApp Cloud, and Ads**. Tokens are stored on the workspace, **encrypted** (`integrations` table), long-lived via `fb_exchange_token`, and the granted scope list is read back from `/me/permissions` — declined permissions show as not granted. Connected Meta/IG/WA chips appear on the rail footer only while the connection exists.
2. **Google** — sign-in (below). The card says Connected for sign-in; Calendar sync is later work and is not faked.
3. **Email / SMTP** — the native outbound mailboxes. The card links to `/outbound/mailboxes` and, when `WEBMAIL_URL` is set, to webmail (e.g. Roundcube). Not OAuth.

#### Meta OAuth setup

1. Meta App Dashboard → your app → **Facebook Login → Settings → Valid OAuth Redirect URIs**: add `https://crm.evotechly.com/auth/meta/callback`.
2. Set `.env`:

```bash
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=https://crm.evotechly.com/auth/meta/callback
```

3. Settings → Apps → Meta → **Connect**. Routes: `GET /auth/meta` (redirect) and `GET /auth/meta/callback`. Leave the vars empty and Connect stays disabled with setup copy — the routes 404, never 500.

Requested scopes: `public_profile`, `email`, `pages_show_list`, `pages_manage_metadata`, `instagram_basic`, `instagram_manage_messages`, `whatsapp_business_management`, `whatsapp_business_messaging`, `ads_management`, `business_management`.

**Meta Business Verification (and App Review advanced access on the Ads/WhatsApp scopes) is still required before live Ads spend or WhatsApp Cloud messaging.** Until then the connection works in development mode with app-role users.

### Google sign-in

Email/password (Fortify) is the default path; Google sign-in rides alongside it via Laravel Socialite. Routes: `GET /auth/google` (redirect) and `GET /auth/google/callback`. The callback finds or creates the user by email, marks the email verified, provisions the workspace, and respects Fortify 2FA when already enabled on that user.

Setup (no secrets in git — configure `.env` only):

1. Google Cloud Console → **APIs & Services → Credentials → Create Credentials → OAuth client ID** (type **Web application**).
2. **Authorized JavaScript origins:** `https://crm.evotechly.com`
3. **Authorized redirect URIs:** `https://crm.evotechly.com/auth/google/callback`
4. Copy the client ID/secret into `.env`:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://crm.evotechly.com/auth/google/callback
```

Leave the client ID/secret empty and the "Continue with Google" button stays hidden (the routes return 404, never 500). Leave `GOOGLE_REDIRECT_URI` empty to derive `${APP_URL}/auth/google/callback`. For local dev, also add `http://localhost:8000` as a JS origin and `http://localhost:8000/auth/google/callback` as a redirect URI on the same OAuth client.

**Error 400 `redirect_uri_mismatch`:** the app is sending `https://crm.evotechly.com/auth/google/callback` (or your `APP_URL` + `/auth/google/callback`). Google Cloud Console → the **same** Web application OAuth client that owns `GOOGLE_CLIENT_ID` → **Authorized redirect URIs** must contain that exact string — `https` not `http`, no trailing slash, no `www`. Authorized JavaScript origins get the origin only (`https://crm.evotechly.com`). Saving the client can take a minute to apply. The same URI is printed on Settings → Apps and Settings → Connectors.

### Invite-only signup

Public `/register` is closed unless `EVOCRM_SIGNUP_MODE=open`. The default is `invite`: guests see “Invite-only pilot — request access” on the login screen (`EVOCRM_SIGNUP_REQUEST_URL`, default `mailto:hello@evotechly.com`). Workspace growth is Settings → People. Invited users still set a password through the Fortify reset link. Login, password reset, email verification, and 2FA are unchanged. Google/Apple sign-in still works for **existing** accounts; they cannot create a workspace while invite-only.

### People (Settings → People)

`/settings/people` manages who can sign in to the workspace — owner/admin only (members get 403 and never see the nav item). The table lists name, email, role, last login / invited, and status (active vs invite pending). Invites take name + email + role (**admin|member only** — one owner by default; a second owner needs a real transfer) and send a **login email** with a single-use Fortify set-password link on `https://crm.evotechly.com` — never a standing password in the mail. Delivery prefers the workspace's default enabled SMTP mailbox (`SmtpMailboxMailer`). With no mailbox, invites (and meeting confirmations) use Laravel's default mailer — **Resend** when `MAIL_MAILER=resend`. If that mailer is still `log` and no mailbox is enabled, the invite stays pending and the failure is reported honestly. Setting a password through the link marks the email verified and flips the person to active. Rows support resend-invite (pending only), role change (the last owner can't be demoted, and nobody below owner touches an owner), and remove (not yourself, not the last owner).

### Transactional mail (Resend)

Meetings, quotes, workspace invites, and Fortify auth use Laravel's default mailer. Official Evotechly mail is **Resend Pro**. Local `.env.example` stays `MAIL_MAILER=log`. Production copies `.env.production.example`: `MAIL_MAILER=resend`, `RESEND_API_KEY` (or alias `RESEND_KEY`), and `MAIL_FROM_ADDRESS` on a verified domain (`no-reply@evocrmapp.com` or `support@evocrmapp.com`). Sequence send + warmup stay on `outbound.evotechly.com` SMTP (`EVOSALES_SMTP_*`) and are not Resend. After flipping Contabo env: `php artisan config:clear` then `php artisan evocrm:mail-smoke --send --to=you@evotechly.com`. See [`docs/production-processes.md`](docs/production-processes.md).

Local seed login (local only):

- Email: `owner@evosales.local`
- Password: `password`

Then open `/dashboard`. Empty Evolution / Meta env vars show a clear **not connected** state. My Inbox (`/inbox`) embeds `https://desk.evotechly.com` unless you change **Settings → Channels**; clear that URL to use the native CRM desk instead.

```bash
composer test
```

## Docker

```bash
docker compose up --build
```

Compose starts independent `web`, `queue`, and `scheduler` services. The web
service binds `0.0.0.0:$PORT` (default 8000); queue and scheduler processes
restart independently. Production requires a shared durable SQL database for
database queues, cache locks, and sessions. See
[production processes](docs/production-processes.md).

Optional Evolution API (Cloud env only, no Baileys instance):

```bash
docker compose --profile evolution up --build
```

See [docs/evolution.md](docs/evolution.md). Create instances only with `WHATSAPP-BUSINESS` and `qrcode: false`.

## Architecture

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/OBJECT_MODEL.md](docs/OBJECT_MODEL.md)
- [docs/evolution.md](docs/evolution.md)
- [docs/evocrm-plan.md](docs/evocrm-plan.md) — EvoCrm build (HubSpot chrome + Salesforce Path, Mobbin as source of truth)

## Secrets

No secrets in git. Configure `.env` from `.env.example` only.

## Later work

 Meta Tech Provider / Embedded Signup, Evoleads scraper, Google Calendar sync, richer provider-specific event adapters, Chatwoot/EvoDesk webhook sync beyond the local history list. (Outbound email is the native `/outbound` department sending through the EvoOutreach mail stack over official SMTP + IMAP — no BillionMail dashboard in the product, Roundcube webmail only.)
