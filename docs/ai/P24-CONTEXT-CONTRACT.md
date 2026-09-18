# P24 — Ask Evo context contract

**Base:** `00899f5ab90902409ac814ce5408eab319e3b8a1`  
**Server types:** `App\Services\Ai\AskEvoContextRequest` → `AskEvoContextResolver` → `AskEvoContext`  
**HTTP:** `GET /ask-evo/context`, `POST /ask-evo`  
**One orchestration path:** `AskEvoCopilot` (Command OS and record rails both end here).

Frontend may send **page + entity type + entity id + optional scope_key only**. Extra keys (`facts`, `records`, `summary`, `prompt`, CRM field dumps) are ignored.

---

## Identity in

| Field | Allowed |
|---|---|
| `page` | `workspace` `dashboard` `activation` `contact` `company` `deal` `quote` `inbox` `activity` `automation` `qrd` |
| `entity_type` | Same values as `AskEvoContextKind` (`inbox` maps to `inbox_conversation`) |
| `entity_id` | Positive integer |
| `scope_key` | Client echo of last server `scope_key` (stale check) |

Unknown pages become `workspace`. QRD maps by record identity (below).

---

## Supported contexts (exact set)

| Kind | When | Label |
|---|---|---|
| `workspace` | Global / Command OS / inbox embed / unsupported QRD peek / activity or automation list with no id | Workspace name |
| `contact` | Contact show, QRD contact, `/crm/contacts/{id}` | Display name |
| `company` | Company show, QRD company | Company name |
| `deal` | Deal show, QRD deal | Deal title |
| `quote` | Quote show, QRD quote | `Quote · {deal}` or `Quote #{id}` |
| `inbox_conversation` | Native inbox `?thread=` | Subject or contact |
| `activity` | Activities `?activity=` | Subject or type |
| `automation` | Workflows `?workflow=` / `?history_workflow_id=` | Workflow name |
| `dashboard` | `/dashboard` | Home |
| `activation` | `page=activation` (P23 checklist facts) | Workspace activation |

### Deferred / not first-class

| Context | Behavior |
|---|---|
| Lead / ticket | Existing `POST /crm/{leads,tickets}/{id}/ask` stay. QRD lead → **workspace** + note. |
| Inbox **embed** (EvoDesk iframe, no `thread`) | Workspace flags + note. Not a conversation. |
| Activity / automation index (no id) | Workspace flags (`empty` is not invented). |
| Custom attributes, full timelines, all deals/contacts | Omitted. |
| Streaming / multi-turn model history | Each ask is stateless against current scope. |

---

## Bounded projections (fields that may enter the prompt)

Authorize **before** any of these are loaded. Secrets are stripped again by `AskEvoSecretRedactor`.

### Contact

Name, Email, Phone, City, Wilaya, Company, Owner, Open deals (count), Latest deal (title), Last activity (one line).

### Company

Name, Domain, Industry, Phone, City, Wilaya, Owner, Contacts (count), Open deals (count), Latest deal (title), Last activity.

### Deal

Title, Stage, Amount (formatted stored cents), Probability (`DealBoardForecast` on the **stage**, not a new forecast), Contact, Company, Owner, Next step, Close date, Last activity.

### Quote

Status, Total (stored `total_cents`), Currency, Deal, Line items (count), Sent at, Accepted at, Expires at, Revoked (yes/no). **Never** `public_token`, HTML snapshot, or a recalculated sum.

### Inbox conversation

Subject, Status, Channel name, Channel type, Contact (if `Gate::view`), Recent messages (latest 5, 240 chars, redacted). **Never** `Channel.config`, webhook secrets, message `payload`.

### Activity

Type, Subject, Due, Done, Owner, Contact, Deal, Company. No body dump.

### Automation

Name, Active, Trigger, Action, Condition, Else action, Delay minutes, Recent runs (latest 3, redacted errors). **Never** `action_config` secrets. No retry / write.

### Dashboard (P12 / P15 / P23 only)

Greeting name, Open deals (count), Attention (≤3 titles + primary labels), Overdue / Today / Upcoming counts, Activation complete, Activation progress. **No** invented analytics or forecast narrative.

### Activation (P23 handoff only)

Activated, Dismissed, Progress, Steps (`id:complete|open`), Mailbox / Meta / communication / any-integration **booleans**. **No** tokens, passwords, OAuth, webhook URLs.

### Workspace (global)

Workspace name, Has contacts / companies / deals / activities (`EXISTS`). Optional “Matching records” labels from authorized `CommandSearch` (no emails).

---

## Context switching (no silent blend)

| Rule | Behavior |
|---|---|
| Server `scope_key` | `{kind}` or `{kind}:{id}` |
| Client sends previous `scope_key` | If it does not match the resolved key → `409` `stale`. No answer. |
| UI | `shouldResetAskEvoScope(prev, next)` clears turns / error / draft question. |
| QRD open on a supported record | Identity is that record, compatible with the full show page. |
| QRD lead / other | Workspace + note. Not blended with the peek’s raw fields. |
| Command OS Ask | `openAskEvo()` on the current page identity. Same `/ask-evo` path. |

Each request is rebuilt from identity. Prior answers are UI-only and discarded on scope change.

---

## Grounding

- Prompt: facts in `<crm_data>`, question in `<question>`. CRM content is untrusted DATA.
- Stub (no live key): “From this record —” + matching authorized facts. Never invents missing fields.
- Live model: `LlmClient` (OpenAI then Anthropic). Same economics (8s, 220 tokens, temp 0.2).
- Quote grounding note: “Totals are the stored quote totals. Do not recalculate.”
- Dashboard: “Home facts only. No forecasts or invented analytics.”
- If a fact is absent: say it is not available.

---

## Suggestions and actions

- Chips: `AskEvoSuggestions` from kind + `canPermission` capabilities. Deterministic. No fake insights.
- Actions: user-initiated hrefs (`Open record`, Home, activities). Draft-email remains the frozen `crm.edit` confirm path. Ask Evo does **not** execute writes.

---

## Query strategy (no N+1 / no workspace preload)

1. `forWorkspace($workspace)` + `select` of allowlisted columns + `find($id)`.
2. `Gate::view` after the workspace check; fail → empty facts.
3. Counts / `EXISTS` for flags. Latest deal = `orderByDesc('id')->value('title')`.
4. Latest activity = one row. Inbox = `limit 5`. Executions = `limit 3`. Attention = `limit 3`.
5. Global search = existing `CommandSearch` (bounded LIKE + Gate). Never `Contact::all()`.

---

## Errors (truthful, no stack)

| Code | HTTP | When |
|---|---|---|
| `unauthorized` | 404 | Cross-workspace, failed Gate, missing record |
| `stale` | 409 | Client `scope_key` ≠ server key |
| `rate_limit` | 429 | 20 asks / user / workspace / minute, or provider 429 |
| `timeout` | 504 | Provider connection / timeout |
| `unavailable` | 422 | Key set but provider failed |
| `empty` | 422 | Empty question (or resolver empty) |
| validation | 422 | Laravel `question` required, max 280 |
