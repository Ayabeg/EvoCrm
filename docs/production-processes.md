# EvoSales Production Processes

EvoSales runs three independent Laravel process responsibilities from the same release image and environment:

| Service | Responsibility | Command |
|---|---|---|
| `web` | HTTP application | `php artisan serve --host=0.0.0.0 --port=$PORT` |
| `queue` | Consume queued jobs | `php artisan queue:work --sleep=3 --tries=3 --backoff=3 --timeout=90 --max-time=3600` |
| `scheduler` | Evaluate Laravel schedules | `php artisan schedule:work` |

The queue process is not called a scheduler worker. It consumes queued jobs. The scheduler process evaluates the schedule in `routes/console.php`.

Laravel documents `queue:work` as a long-lived process that must be restarted during deployment and recommends a process monitor to restart failed workers. Laravel documents `schedule:work` as the foreground scheduler process. Sources:

- https://laravel.com/docs/13.x/queues#running-the-queue-worker
- https://laravel.com/docs/13.x/queues#supervisor-configuration
- https://laravel.com/docs/13.x/scheduling#running-the-scheduler-locally

## Evidenced production topology

Repository deployment notes identify Docker Compose on the EvoSales VPS (“Server 1”) under `/home/deploy/evosales`. `docker-compose.yml` therefore defines the three processes directly. No Render, Kubernetes, systemd, or Supervisor configuration is assumed.

Each service has `restart: unless-stopped`, so Docker restarts it independently. Restarting `scheduler` or `queue` does not restart `web`.

## Shared durable state

All three services must receive the same:

- `APP_KEY`
- database configuration
- `QUEUE_CONNECTION`
- `CACHE_STORE`
- provider credentials

Production must use a durable MySQL-compatible database. SQLite inside a container is not supported as the production source of truth. The database queue uses `jobs`, `job_batches`, and `failed_jobs`. Database cache and scheduler overlap locks use `cache` and `cache_locks`. Sessions use `sessions`.

These tables are created by the checked-in Laravel migrations. Run migrations before starting a new release:

```bash
php artisan migrate --force
```

`withoutOverlapping()` on scheduled commands relies on the shared cache lock store. If processes use different databases or a local file cache, overlap protection is not reliable.

## Deployment

Create the production environment from `.env.production.example` in the existing secret store. Never commit populated credentials.

Reference compose services (the Contabo project `evocrm` keeps its own Dockerfile/compose; copy these if the server file is missing them):

```yaml
  queue:
    build: .
    restart: unless-stopped
    environment: *app-environment
    command: >
      sh -c "php artisan queue:work --sleep=3 --tries=3 --backoff=3 --timeout=90 --max-time=3600"

  scheduler:
    build: .
    restart: unless-stopped
    environment: *app-environment
    command: >
      sh -c "php artisan schedule:work"
```

Both reuse the same image and env as `web` (`QUEUE_CONNECTION=database`, shared MySQL). The worker exits after `--max-time=3600`; Docker restarts it. Failed jobs land in `failed_jobs`.

```bash
cd /home/deploy/evosales
git pull origin main
docker compose build web queue scheduler
docker compose run --rm web php artisan migrate --force
docker compose up -d web queue scheduler
docker compose ps
```

After deployment:

```bash
docker compose exec web php artisan about
docker compose exec web php artisan schedule:list
docker compose logs --since=10m queue
docker compose logs --since=10m scheduler
```

The queue worker exits after one hour through `--max-time=3600`; Docker restarts it with the current release and fresh connections. On release, explicitly restart all three services after the migration.

## Scheduled command inventory

| Command | Frequency | Durable state |
|---|---|---|
| `outbound:run` | Every minute | enrollments, campaigns, outbound messages |
| `workflow:run` | Every minute | workflow executions and CRM rows |
| `outbound:poll-replies` | Every five minutes | outbound messages, enrollments, activities |
| `outbound:sync-mailboxes` | Every fifteen minutes | mailboxes |
| `google:sync-mail` | Every fifteen minutes | Gmail tokens, `google_sync_states`, activities |
| `google:sync-calendar` | Every fifteen minutes | Calendar tokens, `google_sync_states`, activities |
| `meta:sync` | Every fifteen minutes | `ad_*` hierarchy, `meta_sync_runs` |
| `reports:deliver` | Daily at 08:00 Africa/Algiers | scheduled reports, last window/status |
| `outbound:warmup` | Daily at 08:05 Africa/Algiers | mailbox warmup state |

Each command records start/success/failure freshness in `scheduled_command_runs`. Settings → System health shows stale or failed commands without exposing secrets.

Inbound webhooks resolve a workspace from a stored provider key, not “first workspace”:

- Evolution and Meta lead ingestion
- Outbound delivery, bounce, and complaint events at `POST /webhooks/outbound/bounces/{webhookKey}`. The route name is retained for compatibility; the endpoint requires an event ID and records the normalized event in `outbound_provider_events` before projecting message state.

The outbound event payload may identify the message with `message_id` or recipient `email`/`to`. Normalize `type` as `delivered`, `soft`, `hard`, or a complaint value such as `spam_complaint`. Provider acceptance is recorded separately from confirmed delivery. Duplicate event IDs are workspace/provider scoped and safe to retry.

For manual enrichment maintenance, run `php artisan leads:enrich --stale-hours=168` from the web container. It queues stale contacts, companies, and leads for the database worker; use `--sync` only for controlled local verification. The worker must be running for queued enrichment, lead-magnet result delivery, and other background jobs.

## Environment requirements

Required platform values:

- `APP_ENV=production`
- `APP_DEBUG=false`
- non-empty `APP_KEY`
- public `APP_URL`
- `DB_CONNECTION=mysql` and complete durable database credentials
- `SESSION_DRIVER=database`
- `QUEUE_CONNECTION=database`
- `CACHE_STORE=database`

Provider values are required only for enabled integrations. The complete non-secret template is `.env.production.example`.

Pilot / hardening values the Contabo `.env` should also set (repo compose is reference only; the server keeps its own file):

- `EVOCRM_SIGNUP_MODE=invite` (default) — close public `/register` and OAuth workspace creation
- `EVOCRM_SIGNUP_REQUEST_URL=mailto:hello@evotechly.com` — login-page request-access target
- `TRUSTED_PROXIES=*` or the nginx hop IP — do not leave blank behind a reverse proxy
- `MAIL_MAILER=resend`, `RESEND_API_KEY`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME`
- `POSTHOG_API_KEY` + `POSTHOG_HOST` — leave empty to disable capture
- `QUEUE_CONNECTION=database` — uses `jobs` / `failed_jobs`; worker `--tries=3 --backoff=3 --max-time=3600`

Scheduler liveness: `GET /up/scheduler` (public JSON) and Settings → System health (`schedule:heartbeat`, every minute).

## Transactional mail (Resend) — Contabo flip

Day-1 product mail (meetings, quotes, invites, Fortify) is Laravel's default mailer. Official Evotechly mail is Resend Pro. Sequence/warmup SMTP on `outbound.evotechly.com` stays separate (`EVOSALES_SMTP_*` / workspace mailboxes).

Contabo still ships theater until these env values are set (never commit the key):

1. `MAIL_MAILER=resend`
2. `RESEND_API_KEY=` (Laravel official; `RESEND_KEY` is accepted as an alias)
3. `MAIL_FROM_ADDRESS=no-reply@evocrmapp.com` (or `support@evocrmapp.com`) on a **verified** Resend domain
4. `MAIL_FROM_NAME` / `APP_NAME` — `EvoCrm · Evotechly`
5. `php artisan config:clear` (web, queue, and scheduler share this env)
6. Send a test: `php artisan evocrm:mail-smoke --send --to=you@evotechly.com`

Rollback: set `MAIL_MAILER=log` and `config:clear`. Mail becomes theater again; sequences are unchanged.

Sources: https://laravel.com/docs/13.x/mail#resend-driver

## Rollback

Application rollback uses the previous Git revision and image. Migrations must remain backward compatible within a release rollback window. Do not run destructive down migrations against production data.

```bash
git checkout <previous-release>
docker compose build web queue scheduler
docker compose up -d web queue scheduler
```
