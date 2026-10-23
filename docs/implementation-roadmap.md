# EvoCRM acquisition systems implementation roadmap

Status vocabulary: **planned**, **in progress**, **blocked**, **implemented**, and **verified** are kept separate. A task is not verified until its relevant checks have actually run.

## Repository baseline

- **Repository:** `/home/mia-aya/Documents/Codex/EvoCrm-ayabeg-copy`
- **Stack:** Laravel 13, PHP 8.3+, SQLite locally / MySQL-ready, Inertia 3, React 19, TypeScript, Tailwind 4, Pest 4, Vite.
- **Current branch:** `main`, ahead of `origin/main`; the working tree already contains user changes. Those changes are out of scope and must remain intact.
- **Existing reusable foundations:** companies, contacts, leads, deals, activities, consents, lead captures, lead scoring, enrichment runs, CSV/import batches, outbound mailboxes/templates/sequences/campaigns, suppression, reply polling, tracking, queues, scheduled commands, and conversion funnels.
- **Current release posture:** the three-system core is implemented in the shared EvoCRM model and covered by focused integration suites. Large outbound audiences and contact/deal imports now advance through bounded durable continuation jobs, public analytics requires explicit visitor consent, outbound HTML is sanitized, marketing consent is required by default, and the latest hardening aligns queue leases, signs tracking destinations, makes unsubscribe confirmation explicit, bounds webhook work, and rejects cross-workspace relationship IDs. Remaining release gates are the 8 unrelated UI/source-contract failures, external provider verification, deployment secret rotation, and legal review for any consentless cold-outreach configuration.

## Dependency-aware work plan

| ID | Work item | Status | Depends on | Acceptance criteria | Relative complexity |
|---|---|---|---|---|---|
| A1 | Repository audit and architecture baseline | **verified** | — | Stack, branch, dirty files, schema, auth, queue, existing enrichment/outbound/capture paths, and risks documented | S |
| A2 | Shared acquisition contract and documentation | **verified** | A1 | Architecture, data model, roadmap, progress log, and test contract committed; boundaries distinguish CRM source records, evidence, consent, suppression, and events | M |
| A3 | Shared data-model migration gaps | **verified** | A2 | First-class provenance, verification, suppression/eligibility, and lead-magnet records have workspace-scoped constraints and indexes without competing with existing entities | L |
| E1 | Enrichment provider contract audit | **verified** | A2 | Existing Google Places/website providers documented; provider results preserve source, time, confidence, status, conflicts, and errors | M |
| E2 | Enrichment normalization, deduplication, and scoring | **verified** | E1, A3 | Incomplete imports are retained; normalization is idempotent; ambiguous duplicates are reviewable; data-quality and sales-fit scores are explainable and configurable | L |
| E3 | Enrichment orchestration and operator UI | **verified** | E2 | Individual/batch queueing, retries/backoff, provider limits, status/error visibility, pagination, evidence, and retry actions work through the existing CRM | L |
| O1 | Outbound eligibility and campaign safety audit | **verified** | A2, E2 | Last-mile send checks target segment, usable/allowed verification status, consent policy, suppression, conflicts, authorization, and campaign limits | M |
| O2 | Durable outbound execution and reply lifecycle | **implemented** | O1 | Retry-safe sends, provider events, replies, follow-up stop conditions, idempotency, and restart recovery are covered locally; live provider semantics remain external | L |
| O3 | Outbound analytics and operational UI | **implemented** | O2 | Metrics use explicit denominators and provider events are separated from estimates; campaign preview, draft/scheduled editing, configurable campaign daily caps, and activation are safe by default | M |
| M1 | Lead Leakage Calculator domain logic | **verified** | A2 | Validated user assumptions produce transparent estimates; no fabricated benchmarks or guarantees; unit tests cover reset, boundaries, and invalid input | S |
| M2 | Public lead-magnet landing page and submission flow | **verified** | M1, A3 | Accessible responsive page, useful result without unnecessary PII, distinct delivery/marketing consent, duplicate-safe persistence, and honest errors | M |
| M3 | Lead-magnet delivery, CRM integration, and conversion path | **implemented** | M2, O1 | Submission creates/updates shared records, records attribution and offer event, optionally queues a result copy with honest delivery state, presents demo CTA, records attributed booking analytics, and never auto-enrolls cold outreach without consent | M |
| I1 | End-to-end outbound workflow | **implemented** | E3, O3 | Import → enrich → verify → score → select → preview → activate → send → event/reply → pipeline is integration-tested locally; live provider delivery remains external | L |
| I2 | End-to-end inbound workflow | **verified** | M3, E3 | Visit → use → submit → consent → shared record → permitted enrichment → delivery → demo request → analytics is integration-tested | M |
| I3 | Data maintenance workflow | **verified** | E3, O1, A3 | Stale records can be refreshed without replacing stronger evidence or reintroducing suppressed contacts | M |
| Q1 | Security, privacy, and abuse review | **implemented** | E3, O2, M3 | Current-tree standard review completed after the latest reliability/public-endpoint hardening; findings, coverage, and external limitations are recorded in the release report | M |
| Q2 | Release readiness and operating documentation | **in progress** | I1, I2, I3, Q1 | Run/test/configure/operate docs, migrations, external dependency blockers, and final verification report are current | M |

## Execution order

1. Complete A2 documentation, then verify the shared provenance and lead-magnet delivery slices before moving into enrichment and outbound eligibility.
2. Close E1–E3 using the existing enrichment and import code rather than creating parallel services.
3. Close O1–O3 using the existing outbound abstractions and database scheduler.
4. Close M1–M3 and connect lead-magnet submissions to existing `Contact`, `Lead`, `LeadCapture`, consent, activity, and funnel concepts.
5. Run I1–I3, then Q1–Q2.

## Risks and unresolved decisions

- **External credentials:** Google Places, mail-stack API, SMTP/IMAP, and provider-backed email verification remain environment-dependent. The email-verification contract, disabled fallback, safe DNS-evidence adapter, and authenticated HTTP adapter are locally testable; live mailbox-level semantics remain blocked until an approved provider is configured and tested.
- **Legal/compliance:** public-data collection, email outreach, consent, retention, and applicable anti-spam/privacy rules require product/legal confirmation for each market. The implementation will remain conservative by default.
- **Schema evolution:** existing migrations already contain enrichment, capture, scoring, import, and outbound tables. New tables must extend those sources of truth instead of duplicating them.
- **No fabricated evidence:** unavailable enrichment fields remain unknown; estimates in the calculator are explicitly user-provided assumptions. Website enrichment honors cached robots policies and records a skip instead of scraping when access is disallowed or the policy cannot be verified.
- **Provider semantics:** acceptance by a mail API is not delivery; provider delivery, bounce, and complaint events are now recorded in an idempotent workspace-scoped ledger; catch-all and unknown email results remain conservative.
- **Large audiences:** broadcast preview and small expansion paths walk the workspace audience with 250-contact pages; audiences over 1,000 are materialized through durable cursor jobs with retry, cancellation, and idempotent message creation, so 50k-lead workflows do not run in one request.
- **Enrichment queueing:** bulk queueing is capped at 100 IDs per request, workspace-scoped, deduplicated by workspace/target type/record ID, rate-limited per workspace, protected against concurrent duplicate execution, retryable from failed record history, and transient website/Places failures are rethrown after provenance is recorded so queue backoff is effective. Providers are isolated within one run, so a transient website failure no longer prevents Places from returning partial results. Email verification is modular, cached by normalized address, and disabled by default until an approved provider is configured. Broader provider coverage remains open.
- **Incomplete imports:** contact CSV rows with a company or location signal are retained without inventing missing email/phone data; the importer queues enrichment after commit and stores a deterministic import identity for safe re-imports. Queue workers process contact/deal batches in bounded 100-row pages and continue while pending rows remain, so large files do not depend on one long-running worker. Blank/ambiguous rows remain visible as row errors.
- **Scheduled maintenance:** `leads:enrich` now defaults to a seven-day freshness window and excludes records with a recent queued, proposed, or applied run; the window is configurable with `--stale-hours` and remains workspace-scoped.
- **Quality-based selection:** contact segments and campaign saved filters can now require a minimum persisted lead data-quality score; broader duplicate review and provider-backed verification remain open. Website CRM signatures are best-effort evidence only and never prove CRM absence.
- **Security review:** the earlier standard scan is sealed for its captured revision with partial coverage, and the committed hardening diff review is sealed with complete coverage of the five changed security surfaces and zero reportable findings. The hardening addresses queue lease mismatch, stale SMTP outcome duplication, graph failure chaining, unbounded Lead OS/webhook work, signed tracking destinations, GET unsubscribe side effects, expired quote capabilities, import-row concurrency, and cross-workspace CRM relationship IDs. Outbound marketing consent is safe-by-default; disabling that requirement remains an external lawful-basis/legal-review gate. The remaining operational item is rotating the local/deployment APP_KEY, and live-provider verification remains external.
- **Reply safety:** deterministic reply classification is intentionally conservative; explicit unsubscribe is suppressed immediately, while uncertain language remains `needs_review` and no AI or automatic reply is sent. Human review and live mailbox verification remain operational requirements.

