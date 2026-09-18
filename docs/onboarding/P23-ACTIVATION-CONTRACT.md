# P23 — Activation contract

**SoT:** this file + `App\Services\Activation\WorkspaceActivationService`.  
**UI must not guess completion.** React renders the payload. No localStorage “done”. No click-Next complete.

**BASE:** `4d2976befc7a94c267528e4a1fa7a810fe45e4a8`

---

## First useful CRM action (definition)

A workspace is **activated** when it has produced a real sales loop:

1. CRM data exists (a contact **or** a company — created or imported).
2. A deal exists.
3. An activity exists (task, note, call, or any logged/scheduled row).

Page visits, wizard Next, Setup dismiss, and “I looked at Home” are **not** first value.

---

## Overall rule (CORE vs OPTIONAL)

| | Steps | Activated? |
|---|---|---|
| **CORE** | `add_crm_data`, `first_deal`, `first_activity` | **Yes** when all three `complete` |
| **OPTIONAL** | `configure_pipeline`, `connect_integration` | Do **not** block activated |

`activated === core_completed === core_total`.  
`progress.completed / progress.total` is checklist completeness (may be &lt; 100% while activated).  
Never show a fake health / ROI / ML score. Never invent a percentage that is not `completed/total` of applicable steps.

---

## Checklist steps

| id | Kind | Complete when (fact) | Applicable | can_view | can_perform | CTA (only if can_perform) |
|---|---|---|---|---|---|---|
| `add_crm_data` | CORE | `contacts` EXISTS **or** `companies` EXISTS in this workspace | Always | `crm.view` (default true) | `crm.edit` | `/crm/contacts?create=1` · secondary import if `crm.import` |
| `configure_pipeline` | OPTIONAL | Pipeline **customized vs seed** (see below) | Always | workspace member | `WorkspaceRole::canManageSettings()` (matches `PipelinePolicy::create`) | `/settings/pipelines` |
| `first_deal` | CORE | `deals` EXISTS | Always | `crm.view` | `crm.edit` | `/crm/deals?create=1` |
| `first_activity` | CORE | `activities` EXISTS | Always | `crm.view` | `crm.edit` | `/crm/activities?create=1` |
| `connect_integration` | OPTIONAL | P22 `integrations.activation.has_configured_integration` | Always | workspace member (GET Apps) | `settings.integrations` | `/settings/apps` |

### Pipeline customization (measurable vs defaults)

Seed (every workspace): one pipeline named `Sales`, stages exactly `config('evosales.pipeline')` (slug, name, position, is_won, is_lost).

Complete when **any** of:

- More than one pipeline in the workspace, or
- Default pipeline name ≠ `Sales`, or
- Stage set differs from the seed list.

Existence of the seeded pipeline is **not** complete. Visiting the board is **not** complete.

### Deferred (audit)

- **Workspace profile / name the workspace** — name is always set at provision; General settings cannot rename. Filler if shipped as a step. Fact `workspace_named` is available but not a checklist row.
- Invite teammate, board visit, quote sent, Google-only connect, wizard-finished.

---

## Step payload (per row)

```
id, label, description, kind: core|optional,
complete: bool,           // server fact only
can_view: bool,
can_perform: bool,
href: string|null,        // null unless can_perform
cta_label: string|null,
secondary_href: string|null,
secondary_cta_label: string|null
```

No tokens, webhook URLs, mailbox passwords, or other-workspace ids.

---

## Presentation flags (server)

| Flag | Rule |
|---|---|
| `dismissed` | Preference row for **this user + this workspace** has `dismissed_at` |
| `visible` | `! dismissed` |
| `collapsed` | `activated` (core done) |
| `activated` | All CORE complete |

Unactivated + not dismissed → expanded checklist.  
Activated + not dismissed → compact strip (optional leftovers may still show as N of M).  
Dismissed → hide. Do not re-open aggressively. Dismiss **≠** complete.

---

## Dismissal

- Persisted: `workspace_activation_preferences` (`workspace_id`, `user_id`, `dismissed_at`).
- Why persist: cannot be derived from CRM facts; must survive refresh, logout/login, and another session.
- Scoped: user A dismiss on workspace 1 does not hide user B; workspace 2 is a different row.
- No migrate-to-0% for existing workspaces.

---

## Wizard

`/settings/setup` remains the connector wizard. Completing or leaving it does **not** set `activated` and does **not** complete CORE steps.

---

## Permissions

- Payload is visible to every authorized member of the workspace (same CRM facts they can already infer from lists).
- CTAs omitted when `! can_perform` so members do not hit 403.
- No permission elevation.
- Facts are `forWorkspace` only.

---

## Queries

Per Home load (in addition to existing P17 composition):

- 4× `EXISTS` (contacts, companies, deals, activities)
- 1× pipeline `COUNT`
- 1× stages for default pipeline (bounded)
- P22 `Integrations::forWorkspace` activation booleans (no secrets)
- 1× preference lookup (`workspace_id` + `user_id`)

No N+1. No `all()` CRM dumps.

---

## Live derivation

Delete the last contact **and** last company → `add_crm_data` incomplete.  
Delete the last deal → `first_deal` incomplete.  
Delete the last activity → `first_activity` incomplete.  
Disconnect the last P22-configured integration / mailbox → `connect_integration` incomplete.  
Activated can become false. That is truthful.

---

## Existing workspaces

Progress is computed from current rows. A workspace that already has contacts, deals, and activities is activated on first P23 deploy. No backfill job. No punish.
