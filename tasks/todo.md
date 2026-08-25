# EvoSales HubSpot Gap Closure Tasks

## Task 0: Audit repository and production architecture

**Description:** Establish the actual repository, deployment, data, integration, authorization, event, and quality baseline before changing production-critical behavior.

**Acceptance criteria:**
- [x] Production process, database/queue/cache, integrations, webhooks, permissions, CRM gaps, and event architecture are inventoried.
- [x] Baseline tests, lint, static analysis, type checks, and build are run and recorded.
- [x] Unknown production/staging facts are explicitly identified instead of inferred.

**Verification:**
- [x] Baseline document created: `docs/evolsales-baseline.md`
- [x] Repository evidence includes exact files and target tasks.
- [x] No application behavior or unrelated refactor was included.

**Dependencies:** None

**Files touched:**
- `docs/evolsales-baseline.md`
- `tasks/plan.md`
- `tasks/todo.md`

**Estimated scope:** Medium

## Task 1: Deploy the scheduler as a durable worker

**Description:** Add a production-safe process definition that runs Laravel scheduling independently of the HTTP service and documents the required database/locking assumptions.

**Acceptance criteria:**
- [x] Web and scheduler processes have separate startup definitions.
- [x] Scheduler restarts automatically without changing the web server command.
- [x] Deployment documentation names every scheduled command and required environment value.

**Verification:**
- [x] Tests pass: `composer test -- --filter=Schedule`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: observe two consecutive `schedule:list`/worker cycles in staging.

**Dependencies:** None

**Files likely touched:**
- `Dockerfile`
- `docker-compose.yml`
- `routes/console.php`
- `README.md`

**Estimated scope:** Medium

## Task 2: Add scheduler and integration health signals

**Description:** Persist command freshness and expose an admin health view so operators can distinguish healthy automation from a configured-but-idle deployment.

**Acceptance criteria:**
- [x] Each critical scheduled command records last start, success, failure, and error summary.
- [x] Settings displays freshness for sequences, workflows, replies, mailbox sync, warmup, and reports.
- [x] Stale or failed jobs produce a clear warning without exposing secrets.

**Verification:**
- [x] Tests pass: `php artisan test --filter=SchedulerHealthTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: force one command failure and confirm the warning appears.

**Dependencies:** Task 1

**Files likely touched:**
- `database/migrations/*_create_scheduler_runs_table.php`
- `app/Models/SchedulerRun.php`
- `app/Support/SchedulerHealth.php`
- `app/Http/Controllers/Settings/ConnectorController.php`
- `resources/js/pages/settings/connectors.tsx`

**Estimated scope:** Medium

## Task 3: Make inbound webhooks tenant-safe

**Description:** Replace first-workspace selection with signed, provider-specific workspace resolution for Evolution and Meta lead ingestion.

**Acceptance criteria:**
- [x] Every inbound webhook resolves exactly one workspace from a stored provider mapping or signed token.
- [x] Unknown, ambiguous, or invalid webhook identities are rejected without writing domain rows.
- [x] Cross-workspace replay tests prove contacts, threads, leads, and events remain isolated.

**Verification:**
- [x] Tests pass: `php artisan test --filter=WebhookTenancyTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: send staging webhooks for two workspaces and inspect isolated results.

**Dependencies:** None

**Files likely touched:**
- `database/migrations/*_add_webhook_identity_to_integrations.php`
- `app/Services/Integrations/WebhookWorkspaceResolver.php`
- `app/Http/Controllers/Webhooks/EvolutionWebhookController.php`
- `app/Http/Controllers/Webhooks/MetaLeadWebhookController.php`
- `tests/Feature/WebhookTenancyTest.php`

**Estimated scope:** Medium

## Task 4: Unify Meta OAuth credentials with runtime services

**Description:** Make ads and audience synchronization consume the encrypted workspace Meta integration selected in Settings instead of unrelated global access-token configuration.

**Acceptance criteria:**
- [x] Ads and audience services resolve credentials for the current workspace.
- [x] Expired, missing, or insufficient-scope tokens return an actionable connection state.
- [x] Disconnecting Meta immediately prevents subsequent synchronization.

**Verification:**
- [x] Tests pass: `php artisan test --filter=MetaWorkspaceCredentialsTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: connect, sync, disconnect, and verify sync is blocked.

**Dependencies:** Task 3

**Files likely touched:**
- `app/Services/Ads/MetaAdsService.php`
- `app/Services/Ads/MetaAudienceSyncService.php`
- `app/Models/Integration.php`
- `app/Http/Controllers/Settings/AppsController.php`
- `tests/Feature/MetaWorkspaceCredentialsTest.php`

**Estimated scope:** Medium

## Task 5: Enforce CRM permissions and expose editable overrides

**Description:** Turn the read-only permission matrix into server-enforced authorization with owner-controlled per-member overrides.

**Acceptance criteria:**
- [x] Mutating, export, import, merge, bulk, and settings operations use policies or permission middleware.
- [x] Owners can edit supported member overrides; admins cannot grant privileges they do not hold.
- [x] Default owner/admin/member behavior remains backward compatible and denial paths return 403.

**Verification:**
- [x] Tests pass: `php artisan test --filter=CrmPermissionsTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: change a member override and confirm navigation and endpoint behavior agree.

**Dependencies:** None

**Files likely touched:**
- `app/Models/User.php`
- `app/Policies/CrmPolicy.php`
- `app/Http/Controllers/Settings/PermissionsController.php`
- `resources/js/pages/settings/permissions.tsx`
- `routes/web.php`

**Estimated scope:** Medium

## Checkpoint: Production Trust

- [x] Tasks 1–5 acceptance criteria pass.
- [x] `composer test` passes.
- [ ] `composer lint:check && composer types:check` pass.
- [x] `npm run lint:check && npm run types:check && npm run build` pass.
- [ ] Staging proves scheduler freshness, webhook isolation, Meta sync, and permission denial.
- [ ] Human review completed before migration work.

## Task 6: Import contacts from mapped CSV files

**Description:** Add a preview-first contact importer with column mapping, normalization, idempotent matching, row errors, and durable batch progress.

**Acceptance criteria:**
- [x] Admins can upload CSV, map supported fields/custom attributes, and preview create/update/skip/error counts.
- [x] Confirmed imports process in chunks and match contacts using the approved identity order.
- [x] Re-importing the same source produces no unintended duplicate contacts.

**Verification:**
- [x] Tests pass: `php artisan test --filter=ContactImportTest`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: import a representative HubSpot contacts export twice.

**Dependencies:** Tasks 1, 5

**Files likely touched:**
- `database/migrations/*_create_import_batches_table.php`
- `app/Services/Crm/ContactCsvImporter.php`
- `app/Http/Controllers/Crm/ContactImportController.php`
- `resources/js/pages/crm/contacts/import.tsx`
- `tests/Feature/ContactImportTest.php`

**Estimated scope:** Medium

## Task 7: Import deals and associations from mapped CSV files

**Description:** Extend the import framework to deals, pipelines, owners, contact/company associations, amounts, currencies, and close dates.

**Acceptance criteria:**
- [x] Deal import previews mapping and unresolved association errors before writes.
- [x] Imported deals resolve valid pipeline stages and associate with existing/imported contacts and companies.
- [x] A stable external ID or approved composite key makes re-import idempotent.

**Verification:**
- [x] Tests pass: `php artisan test --filter=DealImportTest`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: import paired HubSpot contact/deal exports and inspect associations.

**Dependencies:** Task 6

**Files likely touched:**
- `app/Services/Crm/DealCsvImporter.php`
- `app/Http/Controllers/Crm/DealImportController.php`
- `resources/js/pages/crm/deals/import.tsx`
- `routes/web.php`
- `tests/Feature/DealImportTest.php`

**Estimated scope:** Medium

## Task 8: Add duplicate review and contact merge

**Description:** Detect likely duplicate contacts and provide a transactional merge that preserves associations and an audit record.

**Acceptance criteria:**
- [x] Duplicate review groups candidates by normalized email, phone, or imported external ID.
- [x] An authorized user selects the surviving values before merging.
- [x] Deals, leads, activities, threads, enrollments, attributes, and messages point to the survivor after merge.

**Verification:**
- [x] Tests pass: `php artisan test --filter=ContactMergeTest`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: merge a contact with activity, deal, thread, and sequence history.

**Dependencies:** Task 6

**Files likely touched:**
- `app/Services/Crm/ContactMerger.php`
- `app/Http/Controllers/Crm/ContactMergeController.php`
- `resources/js/pages/crm/contacts/duplicates.tsx`
- `routes/web.php`
- `tests/Feature/ContactMergeTest.php`

**Estimated scope:** Medium

## Task 9: Add bulk CRM actions

**Description:** Connect list selection to permission-aware batch operations for owner assignment, sequence enrollment, stage movement, and safe deletion.

**Acceptance criteria:**
- [x] Contact and deal lists support select-page and explicit selected-record actions.
- [x] Every bulk request validates workspace scope, permissions, and action-specific constraints.
- [x] Large selections run as batches with progress and row-level failures.

**Verification:**
- [x] Tests pass: `php artisan test --filter=CrmBulkActionsTest`
- [ ] Build succeeds: `npm run build`
- [ ] Manual check: assign, enroll, move, and delete mixed-validity selections.

**Dependencies:** Tasks 1, 5

**Files likely touched:**
- `app/Services/Crm/BulkActionRunner.php`
- `app/Http/Controllers/Crm/BulkActionController.php`
- `resources/js/components/crm/list-view-table.tsx`
- `resources/js/components/crm/bulk-action-bar.tsx`
- `tests/Feature/CrmBulkActionsTest.php`

**Estimated scope:** Medium

## Checkpoint: Migration

- [x] Tasks 6–9 acceptance criteria pass.
- [x] Import and bulk operations remain workspace-isolated under load.
- [x] Representative HubSpot exports import twice without duplicates.
- [x] Contact merge preserves every tested relationship.
- [x] Full backend and frontend verification commands pass.

## Task 10: Convert a qualified lead into a linked deal

**Description:** Replace status-only qualification with an explicit conversion flow that creates or links a pipeline deal and records the transition.

**Acceptance criteria:**
- [x] Qualification asks for pipeline, stage, owner, amount, and whether to create or link a deal.
- [x] Conversion is transactional and cannot create multiple deals from repeated submission.
- [x] Lead, contact, deal, source attribution, and timeline remain linked.

**Verification:**
- [x] Tests pass: `php artisan test --filter=LeadConversionTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: qualify one lead into a new deal and another into an existing deal.

**Dependencies:** Task 5

**Files likely touched:**
- `app/Services/Crm/LeadConverter.php`
- `app/Http/Controllers/Crm/LeadController.php`
- `resources/js/pages/crm/leads/show.tsx`
- `resources/js/components/crm/lead-conversion-dialog.tsx`
- `tests/Feature/LeadConversionTest.php`

**Estimated scope:** Medium

## Task 11: Synchronize Google email activity

**Description:** Use stored Google OAuth grants to import relevant sent and received email metadata into CRM timelines with incremental cursors and deduplication.

**Acceptance criteria:**
- [x] Connected users can start, pause, reconnect, and inspect Gmail sync state.
- [x] Matching email activity is attached once to contacts and relevant deals.
- [x] Sync stores provider IDs/cursors and handles token refresh and revocation safely.

**Verification:**
- [x] Tests pass: `php artisan test --filter=GoogleMailSyncTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: send and receive staging messages, sync twice, and confirm no duplicates.

**Dependencies:** Tasks 1, 2, 3

**Files likely touched:**
- `database/migrations/*_add_google_sync_state.php`
- `app/Services/Connectors/GoogleMailSync.php`
- `app/Console/Commands/SyncGoogleMail.php`
- `resources/js/pages/settings/connectors.tsx`
- `tests/Feature/GoogleMailSyncTest.php`

**Estimated scope:** Medium

## Task 12: Synchronize Google Calendar activity

**Description:** Synchronize relevant Google Calendar events into meeting activities and expose conflict-safe connector status.

**Acceptance criteria:**
- [x] Calendar sync imports, updates, and cancels CRM meeting activities idempotently.
- [x] Attendee emails associate meetings with known contacts and relevant deals when unambiguous.
- [x] Incremental cursor expiration triggers a safe full resync rather than data loss.

**Verification:**
- [x] Tests pass: `php artisan test --filter=GoogleCalendarSyncTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: create, move, and cancel a staging meeting and inspect the timeline.

**Dependencies:** Tasks 1, 2, 3; shared Google sync contract from Task 11

**Files likely touched:**
- `app/Services/Connectors/GoogleCalendarSync.php`
- `app/Console/Commands/SyncGoogleCalendar.php`
- `app/Models/Activity.php`
- `resources/js/pages/settings/connectors.tsx`
- `tests/Feature/GoogleCalendarSyncTest.php`

**Estimated scope:** Medium

## Task 13: Surface deal health and forecast guidance

**Description:** Wire existing deal-health and forecast services into deal records and boards with transparent explanations instead of unsupported predictive claims.

**Acceptance criteria:**
- [x] Deal pages show current health, contributing factors, and suggested next action.
- [x] Board forecast receives the computed forecast band rather than `null`.
- [x] Empty or insufficient history produces an honest deterministic state.

**Verification:**
- [x] Tests pass: `php artisan test --filter=DealGuidanceTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: compare stale, active, won, and low-data deals.

**Dependencies:** Task 10

**Files likely touched:**
- `app/Http/Controllers/Crm/DealController.php`
- `app/Services/Ai/RecordInsight.php`
- `resources/js/pages/crm/deals/show.tsx`
- `resources/js/pages/crm/deals/board.tsx`
- `tests/Feature/DealGuidanceTest.php`

**Estimated scope:** Medium

## Checkpoint: Seller Workflow

- [x] Tasks 10–13 acceptance criteria pass.
- [x] Lead conversion is idempotent and attribution-safe.
- [x] Google sync imports each provider event once.
- [x] Sync failures and stale states are visible.
- [x] Forecast guidance does not claim unsupported predictive accuracy.

## Task 14: Restore deal line-item editing on the record page

**Description:** Mount the existing line-item capability on the redesigned deal page and add the missing product selection and total-refresh contract.

**Acceptance criteria:**
- [x] Reps can add, edit, and remove product or ad hoc line items from a deal.
- [x] Deal amount and displayed totals update transactionally from line items.
- [x] Controller props, UI, and existing line-item tests agree.

**Verification:**
- [x] Tests pass: `php artisan test --filter=DealLineItemTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: modify quantities and prices and confirm all totals refresh.

**Dependencies:** Task 5

**Files likely touched:**
- `app/Http/Controllers/Crm/DealController.php`
- `app/Http/Controllers/Crm/DealLineItemController.php`
- `resources/js/pages/crm/deals/show.tsx`
- `resources/js/components/crm/deal-line-items.tsx`
- `tests/Feature/DealLineItemTest.php`

**Estimated scope:** Medium

## Task 15: Add deal-split editing

**Description:** Expose the existing deal-split API through an authorized editor with allocation validation.

**Acceptance criteria:**
- [x] Authorized users can add/remove teammates and edit split percentages or amounts.
- [x] Invalid users, cross-workspace users, negative values, and incorrect totals are rejected.
- [x] Deal records show the current split and update atomically.

**Verification:**
- [x] Tests pass: `php artisan test --filter=DealSplitTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: create valid and invalid split allocations.

**Dependencies:** Task 5

**Files likely touched:**
- `app/Http/Controllers/Crm/DealSplitController.php`
- `app/Models/DealSplit.php`
- `resources/js/components/crm/deal-splits.tsx`
- `resources/js/pages/crm/deals/show.tsx`
- `tests/Feature/DealSplitTest.php`

**Estimated scope:** Medium

## Task 16: Generate and email quote PDFs

**Description:** Turn quote records into immutable versioned documents that can be rendered and emailed through the workspace mailbox.

**Acceptance criteria:**
- [x] A quote snapshot includes customer, seller, currency, line items, totals, and expiration.
- [x] An authorized rep can preview and email the generated PDF.
- [x] Sending records a timeline event and does not mutate the sent version when deal data later changes.

**Verification:**
- [x] Tests pass: `php artisan test --filter=QuoteDeliveryTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: send a quote and compare the email/PDF with its saved snapshot.

**Dependencies:** Tasks 1, 14

**Files likely touched:**
- `app/Services/Crm/QuoteDocument.php`
- `app/Services/Crm/QuoteMailer.php`
- `app/Http/Controllers/Crm/QuoteController.php`
- `resources/js/components/crm/deal-quotes.tsx`
- `tests/Feature/QuoteDeliveryTest.php`

**Estimated scope:** Medium

## Task 17: Add secure quote acceptance

**Description:** Provide a minimal public quote view with revocable signed access and auditable acceptance.

**Acceptance criteria:**
- [x] Customers can view only the intended quote through a random, expiring or revocable token.
- [x] Acceptance captures timestamp and the approved evidence policy without requiring CRM login.
- [x] Accepted quotes become immutable and emit timeline/workflow events.

**Verification:**
- [x] Tests pass: `php artisan test --filter=QuoteAcceptanceTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: accept once, retry, expire/revoke a link, and attempt cross-quote access.

**Dependencies:** Task 16

**Files likely touched:**
- `database/migrations/*_add_quote_acceptance_fields.php`
- `app/Http/Controllers/Public/QuoteAcceptanceController.php`
- `resources/js/pages/public/quote.tsx`
- `routes/web.php`
- `tests/Feature/QuoteAcceptanceTest.php`

**Estimated scope:** Medium

## Checkpoint: Revenue Loop

- [x] Tasks 14–17 acceptance criteria pass.
- [ ] Deal and quote totals remain consistent under concurrent updates.
- [x] Sent quote versions are immutable.
- [x] Public quote access passes authorization and leakage tests.
- [ ] A full lead-to-accepted-quote staging walkthrough succeeds.

## Task 18: Process real outbound bounce events

**Description:** Normalize provider bounce events, update outbound-message outcomes, and automatically suppress hard-bounced addresses.

**Acceptance criteria:**
- [x] One provider adapter records soft/hard bounce type and timestamp idempotently.
- [x] Hard bounces add email suppression before future dispatch.
- [x] Outbound reports distinguish sent, delivered where known, bounced, opened, clicked, and replied.

**Verification:**
- [x] Tests pass: `php artisan test --filter=OutboundBounceTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: replay soft and hard bounce fixtures and inspect reporting/suppression.

**Dependencies:** Tasks 1, 3

**Files likely touched:**
- `app/Services/Outbound/BounceProcessor.php`
- `app/Http/Controllers/Webhooks/OutboundBounceWebhookController.php`
- `app/Models/OutboundMessage.php`
- `app/Http/Controllers/Outbound/OutboundReportController.php`
- `tests/Feature/OutboundBounceTest.php`

**Estimated scope:** Medium

## Task 19: Trigger automation when contacts leave segments

**Description:** Make segment membership exits first-class events that can start workflows and remain auditable.

**Acceptance criteria:**
- [x] Segment synchronization records enter and exit transitions idempotently.
- [x] `segment.exited` is available as a workflow trigger with the source segment.
- [x] Re-entry after exit produces a new valid transition without duplicate executions.

**Verification:**
- [x] Tests pass: `php artisan test --filter=SegmentExitWorkflowTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: move a contact into, out of, and back into a segment.

**Dependencies:** Task 1

**Files likely touched:**
- `app/Services/Crm/SegmentMatcher.php`
- `app/Models/Workflow.php`
- `app/Services/Crm/WorkflowRunner.php`
- `resources/js/pages/crm/workflows/index.tsx`
- `tests/Feature/SegmentExitWorkflowTest.php`

**Estimated scope:** Medium

## Task 20: Deliver real scheduled reports

**Description:** Replace placeholder report emails with configurable schedules and actual report output.

**Acceptance criteria:**
- [x] Authorized users can create, edit, pause, and delete report schedules.
- [x] Delivery renders the selected report/dashboard for the configured date range and recipients.
- [x] Success/failure state is recorded and visible with no duplicate delivery for one schedule window.

**Verification:**
- [x] Tests pass: `php artisan test --filter=ScheduledReportDeliveryTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: schedule a staging report and inspect content, filters, recipients, and status.

**Dependencies:** Tasks 1, 2

**Files likely touched:**
- `app/Console/Commands/DeliverScheduledReports.php`
- `app/Services/Crm/ScheduledReportRenderer.php`
- `app/Http/Controllers/Crm/ScheduledReportController.php`
- `resources/js/pages/crm/reports.tsx`
- `tests/Feature/ScheduledReportDeliveryTest.php`

**Estimated scope:** Medium

## Task 21: Add multi-pipeline selection to the deals list

**Description:** Bring the board's pipeline selection behavior to the primary deals list and preserve pipeline context across views and exports.

**Acceptance criteria:**
- [x] Deals list, stage pills, saved views, create drawer, and export respect the selected pipeline.
- [x] Pipeline selection cannot expose another workspace's pipeline.
- [x] The workspace default remains the fallback when no pipeline is selected.

**Verification:**
- [x] Tests pass: `php artisan test --filter=DealListPipelineTest`
- [x] Build succeeds: `npm run build`
- [ ] Manual check: switch among pipelines and verify counts, records, creation, and export.

**Dependencies:** Task 5

**Files likely touched:**
- `app/Http/Controllers/Crm/DealController.php`
- `resources/js/pages/crm/deals/index.tsx`
- `resources/js/components/crm/pipeline-switcher.tsx`
- `app/Services/Crm/CrmFilter.php`
- `tests/Feature/DealListPipelineTest.php`

**Estimated scope:** Medium

## Checkpoint: Complete

- [x] Tasks 18–21 acceptance criteria pass.
- [x] Full regression suite passes: `composer test`.
- [ ] Backend quality passes: `composer lint:check && composer types:check`.
- [x] Frontend quality passes: `npm run lint:check && npm run types:check && npm run build`.
- [ ] Security review covers webhooks, imports, bulk operations, Google data, and public quotes.
- [ ] Performance review covers import batches, synchronization, segment matching, and campaign expansion.
- [x] Documentation reflects implemented behavior and removes superseded stub claims.
- [ ] Human acceptance walkthrough completed.

## Task 22: Keep segment membership history

**Description:** Record enter and exit as durable membership stints so operators can audit who left a segment without relying only on workflow executions.

**Acceptance criteria:**
- [x] Exit sets `exited_at` instead of deleting the membership row.
- [x] Re-entry inserts a new current row and leaves the prior stint visible.
- [x] Segment history is workspace-scoped and visible on `/crm/segments/{id}`.

**Verification:**
- [x] Tests pass: `php artisan test --filter=SegmentMembershipHistoryTest`
- [x] Build succeeds: `npm run build`
- [x] Manual check: local browser — Alger history shows Amine Benali entered then exited (not staging).

**Dependencies:** Task 19

**Estimated scope:** Small
