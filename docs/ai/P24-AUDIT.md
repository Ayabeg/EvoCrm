# P24 — Contextual Ask Evo audit

**Base:** `00899f5ab90902409ac814ce5408eab319e3b8a1` (P23 merged).  
**Date:** 2026-09-18.  
**Method:** Inspected before product code. P00–P23 frozen — consume, do not rewrite.

---

## EXISTING

| Surface | Path | Notes |
|---|---|---|
| Record Ask UI | `resources/js/components/crm/ask-evo-panel.tsx` | Rail + bottom drawer trigger. Inertia `Form` POST. `features.ask_evo` hide. No context indicator, chips, loading, or error codes. |
| Record show wiring | `crm/{contacts,companies,deals,leads,tickets}/show.tsx` | `askEvo` Inertia prop + per-object `action`. |
| Per-record POSTs | `AskEvoController` + `routes/web.php` | `POST /crm/{contacts,companies,deals,leads,tickets}/{id}/ask`. Question `max:280`. Workspace `abort_unless` → 404. |
| Draft email writes | `draftContact` / `draftDeal` | Session flash `emailDraft`. Keep confirmation + `crm.edit`. **Do not expand.** |
| Insight engine | `app/Services/Ai/RecordInsight.php` | Field summaries, stub answers, optional LLM, `AiInsight` persist, deal health, pipeline forecast band/backtest, lead-score reason, ticket ask, RAG-lite activities. |
| Provider | `app/Services/Ai/LlmClient.php` | OpenAI then Anthropic. Server-side keys only. 8s timeout, 220 tokens, temp 0.2. Failures swallowed → stub. **No OpenRouter.** |
| Config | `config/services.php` `openai` / `anthropic` | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`. Empty = deterministic stub. |
| Persistence | `AiInsight` → `record_insights` | `workspace_id`, subject type/id, question, answer, source. |
| Feature flag | `SimpleMode::features().ask_evo` | Off in simple mode. `SimpleMode::blocks()` also blocks `*.ask` and `draft-email`. |
| Command OS | `command-os.ts` + `command-palette.tsx` | `kind:"ask"` seam `ask-evo-seam`. Closes palette. **No AI POST.** Sparkle opens Command OS (P16). |
| Authorized search | `CommandSearch` + `GET /crm/command/search` | Bounded LIKE + `Gate::view`. Compact labels only. |
| QRD | `QuickRecordPeek` / `useQuickRecord` | Types: contact, company, lead, deal, quote. Identity only. |
| P23 handoff | `docs/onboarding/P23-P24-HANDOFF.md` | Safe booleans / step IDs / CTAs. No secrets. |
| P12 / P15 / P17 | `DealAttentionEvaluator`, `ActivityWorkQueueQuery`, `HomeDashboardBuilder` | Authoritative Home facts. |
| P20 redaction | `WorkflowExecutionRedactor` | Secret keys + safe parameter allowlist. |
| Inbox | Native 3-pane + optional EvoDesk embed | `InboxCrmContextComposer` is CRM side-panel, not Ask Evo. |
| Permissions | `EnforceProductPermissions` | Unsafe `crm.*` POST → `crm.edit`. Policies: workspace membership = `view`. |
| Tests | `RecordInsightTest`, `EvoCell4AiLayerTest` | Stub + OpenAI fake + cross-workspace 404. |

---

## PARTIAL

| Item | Gap |
|---|---|
| Workspace isolation | ID mismatch → 404. No Gate::view before fact build. Activities query is not workspace-scoped in `recentActivities()`. |
| Context | Per-record only. No dashboard / inbox / quote / activity / automation / activation / global. |
| Bounded facts | Contact/company dump all deals + custom attributes + up to 30 activities. Company loads all contacts. |
| Grounding | System prompt says “only from fields” but no known-vs-general marker and no injection wrapper. |
| Command OS | Seam exists; does not open Ask Evo with page identity. |
| Failure UX | LLM failure silently becomes stub. No timeout / rate-limit / unauthorized codes. |
| Logging | No Ask Evo operational log. LLM errors discarded. |
| Rate limit | None on Ask POSTs (only login / 2FA). |
| Suggestions | None. |
| Context switching | Last `AiInsight` for the record is shown; no scope key; Command OS has no conversation. |
| Provider economics | Reused. No streaming, no second vendor. |

---

## MISSING

- Server-authoritative `AskEvoContext` (frontend may send page + entityType + entityId only).
- Authorize-before-build for every context kind.
- Supported contexts beyond contact/company/deal/lead/ticket.
- Secret/credential strip before prompt (quote tokens, channel config, integration tokens, mailbox passwords).
- Prompt-injection defense + tests.
- Deterministic suggestion chips from capabilities.
- Global / Command OS Ask Evo drawer on one orchestration path.
- Truthful error codes: unavailable / timeout / rate_limit / unauthorized / stale / empty.
- Operational metadata logging (no prompts/secrets).
- P23 activation facts consumption.
- Dashboard / inbox / quote / automation / activity projections.

---

## LEGACY (keep working; do not rewrite)

| Item | Why |
|---|---|
| `POST /crm/{object}/{id}/ask` + draft-email | MASTER frozen contract. |
| `RecordInsight` deal health / forecast band / backtest / lead reason / ticket ask / proactive summary | Frozen scoring / show props. |
| Lead + ticket Ask rails | Not in P24 first-class set; existing routes stay. |
| `AskEvoPanel` chrome on show pages | Enhance indicator/chips/errors only. |
| OpenAI / Anthropic `LlmClient` | Reuse. No new provider, no client keys. |
| `features.ask_evo` + simple-mode block | Same permission gating. |
| Command OS Sparkle → same palette | P16 frozen. Ask item opens Ask Evo; does not become a second AI. |

---

## DUPLICATED

- None mounted. Historical command-palette forks unused.
- Do **not** add OpenRouter, AskEvoV2, CopilotChat, or a second LLM client.

---

## SAFE TO REUSE

- `LlmClient` (add status classification; keep `complete()`).
- `CommandSearch` for global search hits (labels only).
- `Gate::view` + workspace policies.
- `WorkflowExecutionRedactor::SECRET_KEYS` for prompt stripping.
- `WorkspaceActivationService::getState` + `Integrations::forWorkspace` booleans.
- `HomeDashboardBuilder` / P12 queue / P15 `dashboardWork` for Home facts.
- `AiInsight` table (no new model).
- Existing record POSTs as compatibility wrappers.

---

## SECURITY RISK

| Risk | Detail |
|---|---|
| Frontend field dumps | None today, but no server reject of extra keys. |
| Cross-workspace activity bleed | `recentActivities()` filters by contact/deal/company id only — not `workspace_id`. |
| Secrets in adjacent records | Quote `public_token`, `Channel.config`, `Integration.access_token`, mailbox passwords must never enter a prompt. |
| Custom attributes | Unbounded; may contain anything. Omit from P24 projections. |
| `crm.edit` on Ask POST | View-only members cannot use frozen record POSTs. New read path must authorize `view`, not require edit. |
| Prompt injection | CRM names/bodies concatenated into the user prompt with no data fence. |
| Admin ≠ secret access | Owner/admin still must not send tokens/keys to the LLM. |

---

## PRIVACY RISK

- Show-page summaries include email/phone (already on the record page).
- Command search no longer ships emails (P16). Keep it that way.
- Do not log questions, answers, or fact payloads.
- Do not persist quote public tokens or channel configs on `record_insights`.

---

## DO NOT TOUCH

CRM models, DataWorkspace, QRD peek contracts, Pipeline/board, Inbox composer, Activities engine, Dashboard widgets, Quote totals/lifecycle, Automation runner/history, Settings IA, Integrations, P23 activation writes, permissions defaults, workspace isolation semantics, business routing.

---

## DEFER

| Item | Why |
|---|---|
| Lead / ticket as first-class P24 kinds | Existing rails stay; not in the P24 set. QRD lead → workspace. |
| Inbox **embed** (EvoDesk iframe) | No thread identity. Native `?thread=` only. |
| Streaming / multi-turn history to the model | Each ask is stateless + current scope. |
| New write tools / autonomous actions | READ+EXPLAIN only. |
| OpenRouter / new vendors / client keys | Reuse `LlmClient`. |
| Custom attribute projection | Untrusted / unbounded. |
| Full timelines / all deals / all contacts | Bounded latest / counts / EXISTS. |
| P25 global responsive / a11y / motion | Ask Evo surfaces only. |
| Contabo deploy | Research-owned. |

---

## P24 IMPLEMENTATION INTENT (this PR)

`CURRENT CONTEXT → PERMISSION FILTER → BOUNDED CONTEXT PAYLOAD → ASK EVO → GROUNDED RESPONSE → optional SAFE user-initiated next action.`

Not an autonomous write agent.
