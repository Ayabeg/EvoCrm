# EvoSales

Evotechly’s **all-in-one sales OS**: one workspace, one login, four rooms.

1. **Desk** — **[EvoDesk](https://github.com/Mohamedbeghanem/evodesk)** (Chatwoot Community, MIT) at `EVOSALES_INBOX_URL` (default `https://desk.evotechly.com`). The Desk nav item opens that URL in the same window. EvoSales does **not** vendor Chatwoot, does **not** copy Chatwoot CSS/assets, and the Laravel page is **not** a Chatwoot clone. A lightweight **conversation history** list stays in CRM as contact ↔ deal context synced from the desk.
2. **CRM** — companies, contacts, leads, deals + stages, qualify, kanban.
3. **Ads Center** — Meta ad accounts, campaigns, click-to-WhatsApp, lead forms.
4. **Outbound Center** — SMTP mailboxes, sequences, official WhatsApp Cloud templates, quiet hours, unsubscribe, suppression.

This is **slice 2**: a sales rep can run a week in the seeded workspace (Home KPIs, CRM CRUD/kanban, outbound enroll, Ads empty-state when Meta env is empty).

Default timezone: **Africa/Algiers**. Algeria-first (`+213`). Company: **Evotechly**.

## What this is not

- **Not Baileys.** Official WhatsApp Cloud API only, via Evolution API in Cloud / Business API mode (`WHATSAPP-BUSINESS`). No QR login, Linked-devices, OpenWA, or consumer-WhatsApp takeover.
- **Not a Kommo / amoCRM clone.**
- **Not an Instantly clone.**
- **Not a Laravel Chatwoot clone.** The sold desk is EvoDesk / Chatwoot Community MIT. The in-app thread list is CRM history only.

## Stack

Laravel 13 · PHP 8.3+ · Inertia 3 · React 19 · TypeScript · Tailwind 4 · Fortify · Pest · Vite. SQLite locally, MySQL-ready.

## Run locally

```bash
composer setup
php artisan serve --host=0.0.0.0 --port="${PORT:-8000}"
```

`composer setup` installs PHP/JS deps, copies `.env.example`, generates `APP_KEY`, migrates SQLite, seeds, and builds Vite assets.

Local seed login (local only):

- Email: `owner@evosales.local`
- Password: `password`

Then open `/dashboard`. Empty Evolution / Meta env vars show a clear **not connected** state. Desk opens `https://desk.evotechly.com` unless you change **Settings → Channels**.

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

Meta Tech Provider / Embedded Signup, IMAP reply poller (stub only today), EvoOutreach mail server, Evoleads scraper, live Meta OAuth, Chatwoot/EvoDesk webhook sync beyond the local history list.
