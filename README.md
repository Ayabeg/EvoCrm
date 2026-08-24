# EvoSales

Evotechly’s **all-in-one sales OS**: one workspace, one login, four rooms.

1. **Desk** — **[EvoDesk](https://github.com/Mohamedbeghanem/evodesk)** (Chatwoot Community, MIT) **embedded at `/inbox`**. The iframe source is `EVOSALES_INBOX_URL` (default `https://desk.evotechly.com`) plus optional `EVOSALES_INBOX_EMBED_PATH` (default `/`; Chatwoot serves the agent app at `/app`). Operators never leave the CRM hostname — there is no "Open Desk" eject. If EvoDesk sends `X-Frame-Options`, allow-frame the CRM origin on the desk; clearing the workspace inbox URL makes `/inbox` serve the native CRM conversation desk instead. EvoSales does **not** vendor Chatwoot, does **not** copy Chatwoot CSS/assets, and the Laravel page is **not** a Chatwoot clone. A lightweight **conversation history** list stays in CRM as contact ↔ deal context synced from the desk.
2. **CRM (Sales Hub)** — list + detail + associations sidebar. Activity timeline (notes/tasks/calls/meetings), owners, Algeria city/wilaya lists, custom attributes, light quotes, light reports. Not a contact list. **`/crm/deals/board` is the deals Board** next to the existing list hub (`/crm/deals`): same pipeline stages (New → Qualified → Demo → Proposal → Won / Lost), drag a card to persist stage (`POST /crm/deals/{deal}/move`), per-column count + DZD total + weighted forecast, and a pipeline picker when the workspace has more than one pipeline. Weighted amount uses stage win probability (0–100): stored `stages.probability` if set, otherwise **New 10, Qualified 25, Demo 50, Proposal 75, Won 100, Lost 0** (unknown open stages 20) — see `config/evosales.php`. **`/leads` is the Kommo-style pipeline board**: horizontal stages (New → Qualified → Demo → Proposal → Won / Lost) with colored underlines, cards showing contact/company, DZD amount, and next task; quick-add on the first column; a top strip for Active / tasks due today / without tasks / overdue / new today; search. Dragging a card between stages updates the deal (`POST /crm/deals/{deal}/move`). It is the same deal engine as `/crm/deals` — no parallel pipeline.
3. **Ads Hub** — Meta ad accounts, campaigns, ad sets, ads, and a per-campaign funnel board: Impressions → Clicks → Conversations/Leads → Qualified → Deals → Won. Official Marketing API sync when `META_*` env is set (`POST /ads/sync`); demo seed data otherwise. Click-to-WhatsApp and lead-form campaigns only — lead forms ingest via `/webhooks/meta/leads` into CRM contacts/leads/deals.
4. **Outbound Center** — the full email department at `/outbound`: SMTP + IMAP mailboxes (warmup status, daily limit, test send, full edit), sending domains with an SPF/DKIM/DMARC checklist (records stored for the operator to publish; manual verified mark — no DNS API), HTML+text templates with `{{variables}}` and a rendered preview, email sequences (per-step delay/mailbox/template, enroll contacts or whole CRM lists, pause/resume), **broadcast campaigns** (one-shot newsletter to all contacts with email or a saved contact list, scheduled or send-now, every recipient logged as an OutboundMessage), outbox with deferred states, IMAP replies, honest reports (sent / pixel opens / link clicks / IMAP replies; bounces need ESP webhooks), quiet hours, unsubscribe, suppression. `outbound:run` dispatches due sequence steps and campaign messages every minute; `outbound:poll-replies` reads IMAP. The unsubscribe link and all tracking URLs stay on the CRM hostname.

   **Mailbox warmup** lives at `/outbound/warmup`: per enabled box a warmup toggle (status warming vs active), plan day, today's cap, sent/remaining, 14-day fail rate, an EvoViz sent-vs-cap history, and tomorrow's cap preview. The ramp is conservative — 8, 12, 18, 25, 35, 45, then holds at the per-mailbox ceiling (default 40) — and the scheduled `outbound:warmup` command (daily, Africa/Algiers) advances one plan day per date and writes `daily_limit` itself. System roles (abuse@, dmarc@, postmaster@, noreply@) stay out unless explicitly opted in. Optional peer pings run **only between the workspace's own enabled non-system mailboxes**, a few per day well under the cap, never during quiet hours, and never under Pest — there is no third-party warmup network and no seed inboxes.

   **`outbound.evotechly.com` is retired.** The old BillionMail/EvoOutreach deployment is not the sold path and is never linked, iframed, or vendored (AGPL). Outbound is native EvoSales: official SMTP + IMAP only — no bundled mail server, no Postfix, no Roundcube.

This is **slice 2 + Sales Hub**: a sales rep lives in CRM the way they live in Chatwoot inbox — without cloning Chatwoot. Desk remains EvoDesk.

Default timezone: **Africa/Algiers**. Algeria-first (`+213`). Company: **Evotechly**.

## What this is not

- **Not Baileys.** Official WhatsApp Cloud API only, via Evolution API in Cloud / Business API mode (`WHATSAPP-BUSINESS`). No QR login, Linked-devices, OpenWA, or consumer-WhatsApp takeover.
- **Not a Kommo / amoCRM clone.**
- **Not an Instantly clone.**
- **Not a Laravel Chatwoot clone.** The sold desk is EvoDesk / Chatwoot Community MIT. The in-app thread list is CRM history only.

## Brand

EvoSales is **white + black + orange**. Do not invent more.

- Company mark: `public/brand/evotechly/mark.svg` (artwork fill `#EC6025`, do not recolor). Favicon is the mark.
- Tokens in `resources/css/app.css`: canvas `#FFFFFF`, canvas-soft `#F7F7F6` (page wash only), ink `#111111`, mute `#525252`, hairline `#E5E5E5`, mark/brand `#EC6025`, Geist.
- Orange `#EC6025` is the only action color: CTAs, links, active sidebar pip, Open Desk button, action badges.
- **Two faces, chosen in Settings → Appearance** (persisted via the `appearance` cookie + `localStorage`; `app.blade.php` stamps `class="dark"` on `<html>` only for an explicit Dark choice):
  - **Light Cabinet** (default): white cards + hairlines, Chatwoot dark rail (`#151718`) on the left, ~52px topbar.
  - **Dark Cabinet**: TRUE BLACK — canvas `#000000`, elevated surfaces `#0A0A0A`, hairline `#1F1F1F`, ink `#F5F5F5`, mute `#A3A3A3`. Neutral grays only: no navy, blue, indigo, or teal tints in dark tokens. The rail reads black (`#000000`) with the same Chatwoot structure.
- Titles and auth mail: **EvoSales · Evotechly**.

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

Leave the vars empty and the "Continue with Google" button stays hidden (the routes return 404, never 500). For local dev, also add `http://localhost:8000` as a JS origin and `http://localhost:8000/auth/google/callback` as a redirect URI on the same OAuth client, and point `GOOGLE_REDIRECT_URI` at the local callback.

### People (Settings → People)

`/settings/people` manages who can sign in to the workspace — owner/admin only (members get 403 and never see the nav item). The table lists name, email, role, last login / invited, and status (active vs invite pending). Invites take name + email + role (**admin|member only** — one owner by default; a second owner needs a real transfer) and send a **login email through the workspace's default enabled SMTP mailbox** (the `SmtpMailboxMailer` path) with a single-use Fortify set-password link on `https://crm.evotechly.com` — never a standing password in the mail. Setting a password through that link marks the email verified and flips the person to active. Rows support resend-invite (pending only), role change (the last owner can't be demoted, and nobody below owner touches an owner), and remove (not yourself, not the last owner). With no enabled mailbox the invite is created as pending and the failure is reported honestly — resend it after enabling a mailbox under Outbound → Mailboxes.

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

App binds `0.0.0.0:$PORT` (default 8000). Optional Evolution API (Cloud env only, no Baileys instance):

```bash
docker compose --profile evolution up --build
```

See [docs/evolution.md](docs/evolution.md). Create instances only with `WHATSAPP-BUSINESS` and `qrcode: false`.

## Architecture

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/OBJECT_MODEL.md](docs/OBJECT_MODEL.md)
- [docs/evolution.md](docs/evolution.md)

## Secrets

No secrets in git. Configure `.env` from `.env.example` only.

## Later work

Meta Tech Provider / Embedded Signup, Evoleads scraper, Google Calendar sync, ESP bounce webhooks, Chatwoot/EvoDesk webhook sync beyond the local history list. (No EvoOutreach/BillionMail mail server — outbound email is the native `/outbound` department over official SMTP + IMAP.)
