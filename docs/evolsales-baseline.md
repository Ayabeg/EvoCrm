# EvoSales Repository and Production Baseline

**Audit date:** 2026-08-25  
**Repository baseline:** `cursor/hubspot-gap-plan-fd45` at `41727db`, based on `main` at `7e0e1da`  
**Scope:** Task 0 audit only. No application behavior was changed.

**Status after remaining waves (2026-08-25):** Tasks 1–21 are implemented on `cursor/hubspot-gap-remaining-waves-fd45`. The Gap column below is the pre-implementation inventory, not current product state. See `CHANGELOG.md` and `docs/production-processes.md` for shipped behavior.

## Executive Finding

EvoSales is a Laravel 13 monolith with a React 19/Inertia frontend and substantial working CRM, outbound, Meta Ads, WhatsApp, automation, and reporting functionality. The production evidence checked into the repository points to a Docker Compose deployment on a VPS called “Server 1” under `/home/deploy/evosales`. The repository does not contain a Render Blueprint, Kubernetes manifest, systemd unit, Supervisor configuration, or host cron definition.

The checked-in runtime starts only the HTTP process. Laravel defines six schedules, but no production scheduler process is defined. The application defaults to a database queue, but no production queue-worker process is defined and the current application has no `app/Jobs` classes. Database-backed cache and locks are the defaults.

The authoritative production database and exact host-level process manager cannot be proven from this checkout. Documentation alternates between SQLite/Postgres descriptions and “MySQL-ready”; the Docker image installs `pdo_mysql`. Task 1 must preserve the evidenced Docker Compose VPS topology and make the three responsibilities explicit without claiming an unverified managed platform.

Render account inspection was attempted because Render workspace rules are present in the agent environment. The Render integration returned `unauthorized`, and the repository has no `render.yaml`. Render is therefore not treated as the production orchestrator.

## Capability Baseline

| Area | Current implementation | Relevant files | Gap | Target task |
|---|---|---|---|---|
| Production orchestrator | Repository evidence says Docker Compose on VPS “Server 1” | `docker-compose.yml`, `Dockerfile`, `docs/hubspot-gap-module-porting.md`, `docs/evocells-roadmap.md` | Host process manager and live Compose state are not accessible | Task 1 |
| Web process | `php artisan serve --host=0.0.0.0 --port=$PORT` | `Dockerfile`, `docker-compose.yml` | Development server is the only explicit process | Task 1 |
| Queue worker | Database queue configured | `.env.example`, `config/queue.php` | No queue startup definition; no application jobs currently dispatch | Task 1 |
| Scheduler process | Six schedules registered in Laravel | `routes/console.php` | No `schedule:work` or host cron definition | Task 1 |
| Production database | SQLite default; MySQL/Postgres supported; image installs `pdo_mysql` | `.env.example`, `config/database.php`, `Dockerfile` | Authoritative live engine cannot be established from repository | Task 1 |
| Queue backend | `database` default, `sync` in tests | `.env.example`, `config/queue.php`, `phpunit.xml` | Requires durable shared SQL and an independent worker | Task 1 |
| Cache/lock backend | Database cache and database locks by default | `.env.example`, `config/cache.php` | Scheduler locks fail without migrated shared cache tables | Tasks 1–2 |
| Scheduled commands | Outbound, workflow, reports, replies, mailbox sync, warmup | `routes/console.php`, `app/Console/Commands/` | No durable runtime ownership or health telemetry | Tasks 1–2 |
| Scheduler health | No persisted execution state | `routes/console.php` | Cannot distinguish never-run, running, failed, successful, or stale | Task 2 |
| Google OAuth | One Socialite client for sign-in and connector reconnect; optional Gmail/Calendar scopes | `GoogleController.php`, `GoogleAuth.php`, `ConnectorController.php`, `config/services.php` | No Gmail or Calendar synchronization | Tasks 11–12 |
| Meta OAuth | Long-lived user token stored encrypted per workspace with scopes/assets | `MetaController.php`, `Integration.php`, `MetaAuth.php` | Runtime Ads/Audience services ignore workspace token | Task 4 |
| Meta Ads sync | Marketing API sync using global env token/account | `MetaAdsService.php`, `config/meta.php` | Connection shown in Settings is not the runtime credential path | Task 4 |
| Meta audience sync | Segment emails sent to Meta Custom Audiences | `MetaAudienceSyncService.php` | Uses global config and logs provider response body | Task 4 |
| Evolution webhook | Public GET verification and POST ingestion | `routes/web.php`, `EvolutionWebhookController.php` | POST selects `Workspace::first()` and does not fail closed by identity | Task 3 |
| Meta lead webhook | Optional global header token and lead ingestion | `routes/web.php`, `MetaLeadWebhookController.php` | Empty token permits ingestion; selects `Workspace::first()` | Task 3 |
| Workspace tenancy | Most domain rows carry `workspace_id`; controllers often manually compare IDs | `BelongsToWorkspace.php`, models and controllers | Integration boundaries are not consistently tenant-resolved | Tasks 3–5 |
| CRM roles | Owner, admin, member | `WorkspaceRole.php`, `User.php` | Coarse role model exists; granular grants are largely unenforced | Task 5 |
| Authorization policies | Pipeline and saved-filter policies; settings middleware | `PipelinePolicy.php`, `SavedFilterPolicy.php`, `EnsureUserCanManageSettings.php` | Most CRM mutations/exports rely only on authentication and workspace checks | Task 5 |
| Permission overrides | `users.permissions` JSON and read-only matrix | `User.php`, `PermissionsController.php`, `settings/permissions.tsx` | No edit endpoint; `canPermission()` is not authoritative across routes | Task 5 |
| Contacts/companies/deals | CRUD, list/record chrome, saved views, custom attributes, activities | CRM controllers, `resources/js/pages/crm/` | Baseline regressions exist in tests; no import/merge/bulk operations | Tasks 5–9 |
| Imports | No import routes, models, or services | `routes/web.php`, CRM controllers | CSV migration path absent | Tasks 6–8 |
| Bulk actions | List selection UI groundwork only | `list-view-table.tsx`, CRM routes | No authorized bulk API or durable batch state | Task 9 |
| Lead conversion | Qualification status update | `LeadController.php`, `Lead.php` | Does not transactionally create/link a deal | Task 10 |
| Line items | Models, totals service, controller, component, tests | `DealLineItemController.php`, `DealLineTotals.php`, `deal-line-items.tsx` | Component/props are not fully wired on redesigned deal page | Task 14 |
| Deal splits | Table, model, controller endpoint | `DealSplit.php`, `DealSplitController.php` | No user-facing editor | Task 15 |
| Quotes | Quote/item models, totals and status updates | `QuoteController.php`, `QuoteTotals.php`, quote migrations | No immutable snapshot, PDF, delivery, public view, or acceptance | Tasks 16–17 |
| Outbound provider | EvoOutreach/BillionMail stack via SMTP, IMAP, mailbox API and Roundcube | `.env.example`, `MailboxSync.php`, `SmtpMailboxMailer.php`, `ImapReplyPoller.php` | Exact production bounce event contract is not documented | Task 18 |
| Bounce handling | Reports explicitly say bounces unavailable | `OutboundReportController.php`, outbound report UI | No provider adapter, normalized event, or hard-bounce suppression | Task 18 |
| Segments | Saved-filter matching, memberships, `segment.entered` workflow trigger | `SegmentMatcher.php`, `Workflow.php` | Exit deletes membership silently; no exit event | Task 19 |
| Workflows | Six triggers, eight actions, delays, queue table, form UI | `WorkflowRunner.php`, `Workflow.php`, workflow migrations | Authorization is incomplete; no segment-exit trigger | Tasks 5, 19 |
| Scheduled reports | Model/table and daily command | `ScheduledReport.php`, `DeliverScheduledReports.php` | No management UI; email contains placeholder link text | Task 20 |
| Pipeline filtering | Board supports pipeline context; primary list has tests for selection | `DealController.php`, deals pages, `PipelineSettingsTest.php` | Current baseline test shows list falls back to wrong pipeline | Task 21 |
| Domain events | Eloquent observers directly invoke workflows; activities act as timeline records | `ContactObserver.php`, `DealObserver.php`, `LeadObserver.php`, `ActivityRecorder.php` | No durable unified domain-event ledger; avoid duplicating activity timeline | Task 5.5 |
| Timeline | `activities` stores notes, tasks, calls, meetings, stage/sequence events | `Activity.php`, `ActivityRecorder.php`, `CrmHub.php` | Event coverage and idempotency are inconsistent | Task 5.5 |
| Staging configuration | No staging manifest or staging environment template in repository | repository search | Manual staging gate cannot be executed from this checkout | All provider/checkpoint tasks |
| Production configuration | Environment template plus VPS/Docker documentation | `.env.example`, deployment docs | Live values and host configuration are intentionally unavailable | Task 1 |
| CI | GitHub Actions runs `composer setup` then `composer ci:check`; `ci:check` runs tests only | `.github/workflows/tests.yml`, `composer.json` | CI does not gate lint, PHPStan, ESLint, TS types, or build independently | Checkpoint work |

## Production Process Architecture

### Evidenced current topology

```text
VPS "Server 1"
└── /home/deploy/evosales
    └── Docker Compose
        └── app container
            └── php artisan serve --host=0.0.0.0 --port=$PORT
```

The repository documents a prior container name `evosales-web-1` and deployment commands using `docker compose build web && docker compose up -d web`, while the current Compose service is named `app`. This is configuration drift.

### Required Task 1 topology

```text
Docker Compose on Server 1
├── web
│   └── HTTP application on 0.0.0.0:$PORT
├── queue
│   └── php artisan queue:work
└── scheduler
    └── php artisan schedule:work
```

All three processes must use the same release image, application key, durable database, queue configuration, and cache/lock backend. They must restart independently. Local or ephemeral files cannot be authoritative state.

## Database, Queue, Cache, and Lock Architecture

- Local/default DB: SQLite.
- Supported DBs: SQLite, MySQL/MariaDB, PostgreSQL, SQL Server.
- Container extension evidence: `pdo_mysql`, not `pdo_pgsql`.
- Queue default: database table `jobs`; failed jobs use `failed_jobs`; batches use `job_batches`.
- Tests override queue to `sync`.
- Cache default: database table `cache`; scheduler overlap locks use `cache_locks`.
- Sessions default to the database.
- The full schema includes queue/cache/session tables through the initial migration.

For a multi-process production topology, all state above must point to the same durable SQL service. SQLite on an ephemeral container filesystem is not an acceptable production source of truth. The exact live SQL engine remains an external verification item.

## Scheduled Laravel Commands

| Command | Schedule | Purpose | Current runtime definition |
|---|---|---|---|
| `outbound:run` | Every minute | Dispatch due sequence/campaign messages | Laravel schedule only |
| `workflow:run` | Every minute | Execute delayed workflow actions | Laravel schedule only |
| `outbound:poll-replies` | Every five minutes | Poll IMAP and match replies | Laravel schedule only |
| `outbound:sync-mailboxes` | Every fifteen minutes | Sync EvoOutreach mailboxes | Laravel schedule only |
| `reports:deliver` | Daily 08:00 Africa/Algiers | Deliver scheduled reports | Laravel schedule only; content stub |
| `outbound:warmup` | Daily 08:05 Africa/Algiers | Advance warmup and optional peer pings | Laravel schedule only |

`withoutOverlapping()` depends on the configured cache lock store. Running `schedule:list` against an unmigrated in-memory database failed on missing `cache_locks`, confirming the lock dependency.

## Integration Architecture

### Google

Google sign-in and connector reconnection use one Socialite client. Login requests basic identity scopes only. Gmail and Calendar reconnects request optional scopes from the same client and persist connector intent/status. There are no provider synchronization commands, cursors, provider identity tables, or activity ingestion services.

### Meta

Meta OAuth stores an encrypted workspace token, scopes, expiration, discovered pages, and ad accounts in `integrations`. Meta Ads and audience runtime services separately read `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` from global config. This split can show “connected” while sync uses a different credential or no credential.

### Webhooks

Both inbound domain webhooks are global paths. Evolution and Meta lead POST handlers select the first workspace. Meta lead authorization is optional when the global token is empty. This is a production-blocking tenant isolation flaw.

### Outbound

EvoSales owns campaign/sequence state and sends through EvoOutreach SMTP. It polls replies over IMAP and synchronizes mailboxes through the EvoOutreach HTTP API. The repository does not contain evidence of the provider's bounce webhook or mailbox contract, so Task 18 must not guess one.

## Authorization Architecture

- Authentication and verified-email middleware wrap most product routes.
- Owner/admin settings access is enforced by `can-manage-settings`.
- Pipeline and saved-filter policies are registered.
- Most CRM controllers manually enforce workspace ownership for bound records.
- `User::canPermission()` returns all permissions for owner/admin and checks JSON grants for members.
- The permission matrix is read-only and the helper is not used as an authoritative route boundary.
- Exports, standard CRM mutations, sequence operations, workflows, and integration management require a route-by-route permission audit in Task 5.

## Existing Event and Timeline Architecture

The application does not have `app/Events` or `app/Listeners`. Eloquent observers synchronously call `WorkflowRunner` for lifecycle triggers. `ActivityRecorder` and direct `Activity` writes form the visible CRM timeline. Deal stage movement writes a `stage_change` activity, sequence enrollment writes a `sequence` activity, and tasks/notes/calls/meetings are also activities.

Task 5.5 must extend this architecture with a durable workspace-scoped event ledger and bridge relevant events to activities/workflows. It must not create a competing visible timeline or distributed event bus.

## Baseline Verification Results

The Cloud VM initially lacked PHP, Composer, and installed Node packages because it booted from a stale environment snapshot that skipped installation. PHP 8.3, Composer, locked PHP dependencies, and locked Node dependencies were installed locally for the audit. No dependency files changed.

| Check | Result | Baseline detail |
|---|---|---|
| `composer test` | **Fail** | 322 tests: 308 passed, 13 failed, 1 error |
| `composer lint:check` | **Fail** | Pint reports pre-existing formatting issues across controllers, services, tests, and routes |
| `composer types:check` | **Fail** | PHPStan reports 721 pre-existing errors |
| `npm run lint:check` | **Fail** | Pre-existing ESLint/style errors, including imported Aurora sources |
| `npm run types:check` | **Fail** | Generated Wayfinder modules absent before build plus real record-layout/forecast type mismatches |
| `npm run build` | **Pass** | Vite production build completed |
| `php artisan schedule:list` | **Blocked without schema** | Database lock store queried missing `cache_locks` in an unmigrated in-memory DB |

### Failing PHP tests at baseline

1. Activity KPI shape mismatch.
2. Conversion funnel amount query mismatch.
3. Funnel stage event recording mismatch.
4. Contact create-drawer redirect retains `create=1`.
5. Company record association count prop mismatch.
6. Manual deal amount overwrites line-item rollup.
7. Deal page omits expected products/line-item props.
8. Deal CSV route calls missing `DealController::export()`.
9. Delayed workflow execution count mismatch.
10. Team-only deal scope is not enforced.
11. Outbound reports route expectation mismatch.
12. Deals list ignores selected pipeline.
13. Deal-health props are absent.
14. One automation behavior test errors because `outbound_messages.to_address` is required.

These failures predate Wave 1. They are not silently reclassified as Wave 1 regressions. Wave 1 changes must add focused tests and must not increase this baseline. The hard checkpoint remains blocked until the required full gate is green or the unrelated baseline failures are separately resolved with explicit scope.

## Known Blockers and External Verification

1. Live VPS access is unavailable, so the running Compose services and host restart policy cannot be observed.
2. The authoritative production database engine is not present in checked-in configuration.
3. There is no staging environment definition or credential set available to this agent.
4. Render MCP is unauthenticated and no Render deployment manifest exists.
5. The production outbound bounce contract is undocumented.
6. Baseline tests, PHP formatting, PHP static analysis, frontend lint, and frontend type checks are already red.

Task 1 can proceed using the evidenced Docker Compose VPS architecture by adding explicit `web`, `queue`, and `scheduler` process definitions and documenting required durable services. Actual staging/production process verification remains a checkpoint item, not a claim made from source code.
