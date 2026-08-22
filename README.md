# EvoSales

Evotechly’s **all-in-one sales OS**: one workspace, one login, four rooms.

1. **Desk** — conversation inbox (Chatwoot Community–inspired three-pane). We do not sell the name Chatwoot. No Chatwoot CSS/assets. No vendored Chatwoot tree.
2. **CRM** — companies, contacts, leads, deals + stages, qualify.
3. **Ads Center** — Meta ad accounts, campaigns, click-to-WhatsApp, lead forms.
4. **Outbound Center** — SMTP mailboxes, sequences, official WhatsApp Cloud templates, quiet hours, unsubscribe, suppression.

Default timezone: **Africa/Algiers**. Algeria-first (`+213`). Company: **Evotechly**.

## What this is not

- **Not Baileys.** Official WhatsApp Cloud API only, via Evolution API in Cloud / Business API mode (`WHATSAPP-BUSINESS`). No QR login, Linked-devices, OpenWA, or consumer-WhatsApp takeover.
- **Not a Kommo / amoCRM clone.**
- **Not an Instantly clone.**
- **Not Chatwoot Enterprise.** EvoDesk (sibling Chatwoot Community MIT repo) is an optional integration target.

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

Then open `/dashboard`. Empty Evolution / Meta env vars show a clear **not connected** state.

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

Meta Tech Provider / Embedded Signup, IMAP reply poller (stub only today), EvoOutreach mail server, Evoleads scraper, live Meta OAuth.
