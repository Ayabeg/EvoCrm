# EvoCRM acquisition systems implementation roadmap

Status vocabulary: **planned**, **in progress**, **blocked**, **implemented**, and **verified** are kept separate. A task is not verified until its relevant checks have actually run.

## Repository baseline

- **Repository:** `/home/mia-aya/Documents/Codex/EvoCrm-ayabeg-copy`
- **Stack:** Laravel 13, PHP 8.3+, SQLite locally / MySQL-ready, Inertia 3, React 19, TypeScript, Tailwind 4, Pest 4, Vite.
- **Current branch:** `main`, ahead of `origin/main`; the working tree already contains user changes. Those changes are out of scope and must remain intact.
- **Existing reusable foundations:** companies, contacts, leads, deals, activities, consents, lead captures, lead scoring, enrichment runs, CSV/import batches, outbound mailboxes/templates/sequences/campaigns, suppression, reply polling, tracking, queues, scheduled commands, and conversion funnels.
- **Important gap:** the requested three-system contract is broader than the current implementation. In particular, a first-class lead-magnet offer/submission workflow and shared field-level provenance/eligibility contract need to be completed and tested.

## Dependency-aware work plan

| ID | Work item | Status | Depends on | Acceptance criteria | Relative complexity |
|---|---|---|---|---|---|
| A1 | Repository audit and architecture baseline | **verified** | — | Stack, branch, dirty files, schema, auth, queue, existing enrichment/outbound/capture paths, and risks documented | S |
| A2 | Shared acquisition contract and documentation | **verified** | A1 | Architecture, data model, roadmap, progress log, and test contract committed; boundaries distinguish CRM source records, evidence, consent, suppression, and events | M |
| A3 | Shared data-model migration gaps | **in progress** | A2 | First-class provenance, verification, suppression/eligibility, and lead-magnet records have workspace-scoped constraints and indexes without competing with existing entities | L |
| E1 | Enrichment provider contract audit | **in progress** | A2 | Existing Google Places/website providers documented; provider results preserve source, time, confidence, status, conflicts, and errors | M |
| E2 | Enrichment normalization, deduplication, and scoring | **in progress** | E1, A3 | Incomplete imports are retained; normalization is idempotent; ambiguous duplicates are reviewable; data-quality and sales-fit scores are explainable and configurable | L |
| E3 | Enrichment orchestration and operator UI | **in progress** | E2 | Individual/batch queueing, retries/backoff, provider limits, status/error visibility, pagination, evidence, and retry actions work through the existing CRM | L |
| O1 | Outbound eligibility and campaign safety audit | **in progress** | A2, E2 | Last-mile send checks target segment, usable/allowed verification status, consent policy, suppression, conflicts, authorization, and campaign limits | M |
| O2 | Durable outbound execution and reply lifecycle | **in progress** | O1 | Retry-safe sends, provider events, replies, follow-up stop conditions, idempotency, and restart recovery are covered by integration tests | L |
| O3 | Outbound analytics and operational UI | **in progress** | O2 | Metrics use explicit denominators and provider events are separated from estimates; campaign preview/activation is safe by default | M |
| M1 | Lead Leakage Calculator domain logic | **verified** | A2 | Validated user assumptions produce transparent estimates; no fabricated benchmarks or guarantees; unit tests cover reset, boundaries, and invalid input | S |
| M2 | Public lead-magnet landing page and submission flow | **verified** | M1, A3 | Accessible responsive page, useful result without unnecessary PII, distinct delivery/marketing consent, duplicate-safe persistence, and honest errors | M |
| M3 | Lead-magnet delivery, CRM integration, and conversion path | **in progress** | M2, O1 | Submission creates/updates shared records, records attribution and offer event, optionally queues a result copy with honest delivery state, presents demo CTA, records attributed booking analytics, and never auto-enrolls cold outreach without consent | M |
| I1 | End-to-end outbound workflow | **in progress** | E3, O3 | Import → enrich → verify → score → select → preview → activate → send → event/reply → pipeline is integration-tested | L |
| I2 | End-to-end inbound workflow | **in progress** | M3, E3 | Visit → use → submit → consent → shared record → permitted enrichment → delivery → demo request → analytics is integration-tested | M |
| I3 | Data maintenance workflow | **in progress** | E3, O1, A3 | Stale records can be refreshed without replacing stronger evidence or reintroducing suppressed contacts | M |
| Q1 | Security, privacy, and abuse review | **in progress** | E3, O2, M3 | Authorization, validation, rate limits, secrets, PII logging, webhooks, XSS/SQLi protections, and suppression behavior reviewed with tests | M |
| Q2 | Release readiness and operating documentation | **in progress** | I1, I2, I3, Q1 | Run/test/configure/operate docs, migrations, external dependency blockers, and final verification report are current | M |

## Execution order

1. Complete A2 documentation, then verify the shared provenance and lead-magnet delivery slices before moving into enrichment and outbound eligibility.
2. Close E1–E3 using the existing enrichment and import code rather than creating parallel services.
3. Close O1–O3 using the existing outbound abstractions and database scheduler.
4. Close M1–M3 and connect lead-magnet submissions to existing `Contact`, `Lead`, `LeadCapture`, consent, activity, and funnel concepts.
5. Run I1–I3, then Q1–Q2.

## Risks and unresolved decisions

- **External credentials:** Google Places, mail-stack API, SMTP/IMAP, and any future verification provider remain environment-dependent. Local adapters and failure paths can be tested without live credentials; live verification is blocked until configured.
- **Legal/compliance:** public-data collection, email outreach, consent, retention, and applicable anti-spam/privacy rules require product/legal confirmation for each market. The implementation will remain conservative by default.
- **Schema evolution:** existing migrations already contain enrichment, capture, scoring, import, and outbound tables. New tables must extend those sources of truth instead of duplicating them.
- **No fabricated evidence:** unavailable enrichment fields remain unknown; estimates in the calculator are explicitly user-provided assumptions.
- **Provider semantics:** acceptance by a mail API is not delivery; provider delivery, bounce, and complaint events are now recorded in an idempotent workspace-scoped ledger; catch-all and unknown email results remain conservative.
- **Large audiences:** broadcast preview and expansion walk the workspace audience with 250-contact `chunkById` pages, retaining idempotent message creation while avoiding one in-memory collection for 50k-lead workflows.
- **Enrichment queueing:** bulk queueing is capped at 100 IDs per request, workspace-scoped, deduplicated by workspace/target type/record ID, rate-limited per workspace, protected against concurrent duplicate execution, retryable from failed record history, and transient website/Places failures are rethrown after provenance is recorded so queue backoff is effective. Broader provider coverage remains open.
- **Scheduled maintenance:** `leads:enrich` now defaults to a seven-day freshness window and excludes records with a recent queued, proposed, or applied run; the window is configurable with `--stale-hours` and remains workspace-scoped.
- **Quality-based selection:** contact segments and campaign saved filters can now require a minimum persisted lead data-quality score; broader duplicate review and provider-backed verification remain open. Website CRM signatures are best-effort evidence only and never prove CRM absence.
- **Security review:** the parent-only review confirmed and remediated unvalidated redirect SSRF in website enrichment/URL capture and spreadsheet formula injection in contact/deal exports. The current tree has regression coverage; full repository inventory, webhook-auth consistency, DNS rebinding controls, and live-provider verification remain open.

