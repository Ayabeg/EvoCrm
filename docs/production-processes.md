# EvoSales Production Processes

EvoSales runs three independent Laravel process responsibilities from the same release image and environment:

| Service | Responsibility | Command |
|---|---|---|
| `web` | HTTP application | `php artisan serve --host=0.0.0.0 --port=$PORT` |
| `queue` | Consume queued jobs | `php artisan queue:work --sleep=3 --tries=3 --timeout=90 --max-time=3600` |
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
| `reports:deliver` | Daily at 08:00 Africa/Algiers | scheduled reports |
| `outbound:warmup` | Daily at 08:05 Africa/Algiers | mailbox warmup state |

Task 2 adds persisted running/success/failed/stale health for these commands. Until then, container status and logs are the only runtime signals.

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

## Rollback

Application rollback uses the previous Git revision and image. Migrations must remain backward compatible within a release rollback window. Do not run destructive down migrations against production data.

```bash
git checkout <previous-release>
docker compose build web queue scheduler
docker compose up -d web queue scheduler
```
