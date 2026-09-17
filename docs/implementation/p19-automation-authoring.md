# P19 — Automation Authoring

**PR:** Turn the existing structured workflow editor into a coherent, safe, premium Automation authoring experience.  
**Baseline:** `main` @ `71e3d8b8db85a3e253520b56bfd9603c184d45ac` (P17 #226).  
**Date:** 2026-09-17.

P00–P17 merged and frozen. P19 owns **authoring only**. It is not WorkflowV2, not a canvas, not AI authoring, not P20 test/history/logs/retry, not P22 integration redesign, and not P24 Ask Evo.

Live Contabo deploy + populated QA is owned by Research after this PR opens.

---

## P19 STATUS

Audit complete on `main` @ `71e3d8b` **before** product code. CURRENT AUTOMATION DOMAIN recorded below. The active `Workflow` + `WorkflowRunner` + `WorkflowController` remain the only automation engine. No WorkflowV2 / canvas / prompt-to-workflow.

Authoring UI is a structured WHEN / IF / THEN / ELSE drawer over the existing runner contract.

**MERGE READY: NO** until Research Contabo populated QA is PASS.

## BASE / PR / TIP

- Base: `71e3d8b8db85a3e253520b56bfd9603c184d45ac`
- Requested branch: `cursor/p19-automation-authoring`
- Working branch: `cursor/p19-automation-authoring-5696` (cloud suffix required)
- PR title: P19 — Automation Authoring
- Tip: this branch after the P19 commits

---

## AUDIT

Inspected on `main` @ `71e3d8b` **before coding**:

| Area | Paths |
|---|---|
| Model | `app/Models/Workflow.php` — one trigger, one condition, one then action, optional else, `active`, `delay_minutes` |
| Factory | `database/factories/WorkflowFactory.php` |
| Runner | `app/Services/Crm/WorkflowRunner.php` — active workflows only; condition → then else else; single action `match` |
| Controller | `app/Http/Controllers/Crm/WorkflowController.php` |
| Templates | `app/Services/Crm/EvoWorkflowTemplates.php` — 5 real starters, `apply()` writes rows |
| Executions | `WorkflowExecution` + `workflow:run` — delay/quiet-hours queue. **P20 owns history UI** |
| Routes | `GET/POST /crm/workflows`, `PUT/DELETE /crm/workflows/{workflow}`, `POST …/templates`, `POST …/toggle` |
| Policies | `GET` is safe (view). Mutations require `automation.manage` via `EnforceProductPermissions` |
| Defaults | Owner/admin manage; member view unless granted `automation.manage` |
| Editor (before) | `resources/js/pages/crm/workflows/index.tsx` — list + create-only `CreateDrawer` |
| List (before) | Name, trigger, Active/Off, Edit/Delete. No last-modified. Create always `active=true` |
| Tests | `CrmWorkflowsTest`, `TicketWorkflowTest`, `EvoCell2AutomationSpineTest` |
| Chrome | Hairline + `CreateDrawer` (Aurora chrome test). Kept. |

Search hits for workflow, trigger, action, condition, else, template, toggle, execution, automation confirmed the above.

**Did not invent:** AND/OR, action lists, reorder, nested branches, scheduling types, WhatsApp/Meta actions, last-run metrics, AI authoring, canvas.

---

## CURRENT AUTOMATION DOMAIN

| Topic | Finding |
|---|---|
| Surface | `/crm/workflows` — Inertia `crm/workflows/index`, rail title Automation |
| Engine | `Workflow` row + `WorkflowRunner` |
| Shape | WHEN one trigger → IF optional one condition → THEN one action → ELSE optional one action |
| Lifecycle | `active` boolean. Runner ignores inactive. Toggle flips. Update does **not** write `active` |
| Create (legacy) | Omitted `active` stores `true` |
| Delay | `delay_minutes` 0–43200; quiet-hours can push `WorkflowExecution` |
| Templates | Five Evotechly starters. `apply()` writes a real row with `active=true` (pre-existing) |
| History | `workflow_executions` exists. P19 does not list it |
| Integrations | `send_email` needs an enabled mailbox at **runtime**. `enroll_sequence` needs a workspace sequence. P22 owns connect UX |

---

## CURRENT WORKFLOW SCHEMA

Exact persisted columns (no WorkflowV2):

| Column | Type | Notes |
|---|---|---|
| `id` | int | |
| `workspace_id` | int | |
| `name` | string | max 160 |
| `trigger` | string | `Workflow::triggers()` |
| `trigger_stage_id` | int\|null | required when `deal.stage_changed` |
| `trigger_status` | string\|null | ticket status when `ticket.status_changed` |
| `trigger_saved_filter_id` | int\|null | required when `segment.entered` / `segment.exited` |
| `action` | string | `Workflow::actions()` |
| `action_config` | json | action-specific; see ACTION PARAMETERS |
| `condition_field` | string\|null | built-ins + `contact.attr.{key}` |
| `condition_operator` | string\|null | `Workflow::operators()` |
| `condition_value` | string\|null | required unless `is_set` / `is_empty` |
| `else_action` | string\|null | only meaningful when condition is set |
| `else_action_config` | json | same shape as `action_config` |
| `active` | bool | runner gate |
| `template_key` | string\|null | set when instantiated from a template |
| `delay_minutes` | int | 0 = immediate |
| `created_at` / `updated_at` | timestamps | |

**Not in schema:** action arrays, AND/OR trees, nested IF, success_rate, run_count, versions.

---

## CURRENT RUNNER CONTRACT

`WorkflowRunner::run`:

1. Load workspace workflows where `active = true` and `trigger` matches.
2. Extra filters: `deal.stage_changed` vs `trigger_stage_id`; `ticket.status_changed` vs `trigger_status`; segment triggers vs `trigger_saved_filter_id` (null = any).
3. If `delay_minutes > 0`, enqueue `WorkflowExecution` (quiet-hours may shift `run_at`). Else `execute`.
4. `execute`: if no condition **or** `conditionPasses` → then action + `action_config`. Else else action + `else_action_config`. If else is empty, no-op.
5. One `match` on a single action identifier. No sequential action list.

Authoring must represent this and nothing else.

---

## AUTHORING ARCHITECTURE

| Layer | File | Job |
|---|---|---|
| Registries + draft | `resources/js/lib/workflow-authoring.ts` | Identifiers, labels, hydrate, payload, validate, summarize |
| Builder | `resources/js/components/crm/workflow-builder.tsx` | WHEN / IF / THEN / ELSE |
| Page | `resources/js/pages/crm/workflows/index.tsx` | List + editor drawer + enable |
| Controller | `WorkflowController` | Additive props + else_* mapping + optional `active` on create |

No new engine. No React Flow. No AI.

---

## WORKFLOW LIST

Truthful columns only:

- Name + deterministic summary
- Trigger (human label; stored id unchanged)
- Status: **Draft** / **Active** from `active`
- Last modified from `updated_at`
- Edit / Turn on|off / Delete when `automation.manage`

No success rate. No run counts. No last-run (P20).

---

## EDITOR

`CreateDrawer` (`sm:max-w-2xl`) with `WorkflowBuilder`.

Hierarchy:

```
Workflow name                    Draft/Active is a list badge, not a Save side-effect
WHEN  trigger (+ stage / status / segment / delay)
IF    field · operator · value   (optional)
THEN  one action + schema fields
ELSE  optional one action        (only if IF is set)
[ Cancel ] [ Save ]
```

Hairline connector on `md+`. Orange only on primary Save / Active badge. Controls use existing `h-9` (~36px) Input / NativeSelect.

---

## TRIGGER

Selector uses `Workflow::triggers()` / `WORKFLOW_TRIGGERS`. One trigger per workflow.

| Stored id | Label |
|---|---|
| `contact.created` | Contact created |
| `deal.stage_changed` | Deal stage changed |
| `deal.created` | Deal created |
| `enrollment.finished` | Sequence finished |
| `segment.entered` | Segment entered |
| `segment.exited` | Segment exited |
| `enrollment.replied` | Sequence reply received |
| `lead.scored` | Lead scored |
| `lead.qualified` | Lead qualified |
| `meeting.booked` | Meeting booked |
| `meeting.no_show` | Meeting no-show |
| `ticket.created` | Ticket created |
| `ticket.status_changed` | Ticket status changed |
| `ticket.sla_breached` | Ticket SLA breached |

No invented cron / “deal won” / WhatsApp event.

---

## CONDITIONS

Exactly one optional condition: `field` + `operator` + `value`.

Built-in fields: `deal.amount`, `deal.stage`, `ticket.status`, `contact.wilaya`, `contact.city`, `contact.source`, `contact.email`, `contact.phone`, plus `contact.attr.{key}`.

No AND/OR. Clearing the field clears ELSE (runner would ignore else without a condition).

---

## OPERATORS

Locked to `Workflow::operators()` / `Workflow::compare()`:

`eq` is · `neq` is not · `gt` greater than · `gte` at least · `lt` less than · `lte` at most · `contains` · `is_set` · `is_empty`

`is_set` / `is_empty` omit value. No `starts_with` or other frontend-only operators.

---

## ACTIONS

Chooser lists only `Workflow::actions()`. Labels are display-only.

| Stored id | Label | Form |
|---|---|---|
| `create_task` | Create task | subject, body, due_in_days |
| `enroll_sequence` | Enroll in sequence | sequence_id (empty = first workspace sequence, matching runner) |
| `send_webhook` | Send webhook | webhook_url → config `url` |
| `set_property` | Set property | entity, field, value |
| `assign_owner` | Assign owner | entity, owner_id |
| `create_deal` | Create deal | title via subject; amount DZD → `amount_cents` |
| `send_email` | Send email | subject, body |
| `notify_user` | Notify user | subject, body, user_id |

No generic JSON editor. No `send_whatsapp`.

---

## ACTION PARAMETERS

`actionConfig()` mapping (then and else share the same shape):

| Action | Config keys the runner reads |
|---|---|
| `create_task` | `subject`, `body`, `due_in_days` |
| `enroll_sequence` | `sequence_id` |
| `send_webhook` | `url` |
| `set_property` | `entity`, `field`, `value` |
| `assign_owner` | `entity`, `owner_id` |
| `create_deal` | `title`, `amount_cents` (P19 additive so the form matches the runner; keeps `subject` for older rows) |
| `send_email` | `subject`, `body` |
| `notify_user` | `subject`, `body`, `user_id` |

Else property / assign / notify previously reused then fields. P19 maps `else_*` without changing then serialization.

---

## ACTION ORDER

Runtime executes **one** then **or** one else action. No list. No reorder UI. Payload has no `actions[]`.

---

## ELSE

Exposed only when a condition field is set. Optional. Empty else = no-op (runner contract). One else action, same registry as then.

---

## NESTING

None. No nested IF. No else-if. Depth is the runner: one condition, two action slots.

---

## TEMPLATES

Existing five `EvoWorkflowTemplates` only. Each writes a valid `Workflow` row.

| Key | Shape |
|---|---|
| `evo_new_contact_task` | contact.created → create_task |
| `evo_deal_qualified_task` | deal.stage_changed (qualified) → create_task |
| `evo_new_contact_enroll` | contact.created → enroll_sequence |
| `evo_deal_created_amount_branch` | deal.created + amount ≥ 500000 → create_task else create_task |
| `evo_contact_alger_branch` | contact.created + wilaya eq Alger → enroll_sequence else create_task |

`apply()` still sets `active=true` (pre-existing). P19 does not change template enablement semantics. No fake templates.

---

## DRAFT / ACTIVE

| Path | `active` |
|---|---|
| Authoring **Save** (create) | posts `active: false` → Draft |
| Legacy POST omitting `active` | remains `true` (no silent API break) |
| Authoring **Save** (update) | does not write `active` even if a client sends it |
| **Turn on / Turn off** | `POST …/toggle` only |
| Templates | still apply as active (existing) |

Save never enables.

---

## ENABLE / DISABLE

Explicit list action. Disabled while a toggle is in flight. No optimistic flip — Inertia reload is authoritative. Failed outsider toggle 404 leaves the row unchanged.

---

## VALIDATION

Client (`validateWorkflowDraft`) blocks incomplete drafts: name, registered trigger/action/operator, stage/segment when required, action-required fields, condition value unless `is_set`/`is_empty`.

Server (`WorkflowController::validated`) remains authoritative: `Rule::in` on registries, webhook URL, condition value, etc.

---

## SUMMARY LANGUAGE

`summarizeWorkflow` is deterministic string formatting from the draft. Example:

> When a contact is created create a task “Introduce Evotechly to {{contact}}”.

Not AI. Shown under the name in the editor and as a list subtitle.

---

## AI DECISION

**Out.** No “Build workflow with AI”, prompt-to-workflow, or recommendations. P24 owns Ask Evo. No reserved AI button.

---

## CANVAS DECISION

**Out.** No React Flow / XYFlow. Structured vertical authoring only. Locked in Pest + `package.json`.

---

## INTEGRATION-DEPENDENT ACTIONS

| Action | Unavailable when | UI |
|---|---|---|
| `send_email` | no enabled mailbox | option disabled + reason |
| `enroll_sequence` | no workspace sequence | option disabled + reason |

Already-selected unavailable actions stay selectable so existing rows can be edited. P22 owns connecting mailbox / WhatsApp / Meta. P19 does not redesign integrations.

---

## PERMISSIONS

| Action | Gate |
|---|---|
| View list | authenticated workspace member |
| Create / edit / delete / toggle / template | `automation.manage` |

UI hides mutation controls when `capabilities.can_manage` is false. Middleware still 403s mutations.

---

## SAVE SAFETY

`submitting` + `submittingRef` reject duplicate submit. Save button shows “Saving…”.

---

## UNSAVED CHANGES

Dirty = `!draftsEqual(draft, baseline)`. Drawer close confirms. Inertia `before` confirms (skipped while submitting). `beforeunload` while dirty.

---

## ERROR

Client issues + Inertia `page.props.errors` flatten onto the matching field. Server remains source of truth after submit.

---

## 1440 QA / 1280 QA / 1024 QA / 768 QA / PAGE H-OVERFLOW

Editor stacks: `grid-cols-1` → `md:grid-cols-[3.25rem_1fr]`. Condition row `md:grid-cols-3`. List grid collapses at `<md`. Page: `overflow-x-hidden`.

Local scripted + browser QA on seeded SQLite (`owner@evosales.local`):

| Width | List | Editor | `scrollWidth <= innerWidth` |
|---|---|---|---|
| 1440 | usable | WHEN/IF/THEN drawer | **true** |
| 1280 | usable | same | **true** |
| 1024 | usable | same | **true** |
| 768 | templates/list stack | structured vertical (no canvas) | **true** |

Populated Contabo walk remains **NEEDS RESEARCH**.

---

## LIVE SIMPLE / CONDITIONAL / ELSE / MULTI-ACTION / TEMPLATE / ENABLE / PERMISSION QA

Feature tests cover:

- Simple create: trigger → `create_task`, `active=false`, reload fields
- Conditional + else property round-trip
- Template instantiate (`evo_deal_created_amount_branch`)
- Toggle on/off; outsider 404 does not flip
- Member without `automation.manage` can GET, 403 on mutations; granted member can create draft

Local seeded QA (owner):

| Scenario | Result |
|---|---|
| Simple `P19 QA simple` | Save Draft → reload → edit fields survived |
| Conditional `P19 QA conditional` | Deal created + amount ≥ 500000 → task; reload survived |
| Else `P19 QA else` | Then “Gros” / else “Light”; reload survived |
| Multi-action | **Not in UI** (correct) |
| Template `evo_new_contact_task` | Wrote a real **Active** row (existing `apply()`) |
| Enable/disable | Draft → Turn on Active → Turn off Draft |
| Member `sara@evosales.local` | View list; Create/Edit/Turn on/Delete/Use template **hidden** |

**LIVE MULTI-ACTION QA:** not supported by the runner. UI does not offer it.

Contabo populated workspace: **NEEDS RESEARCH**.

---

## RUNTIME REGRESSION

Runner, model compare, and existing `CrmWorkflowsTest` / `TicketWorkflowTest` / `EvoCell2AutomationSpineTest` are untouched except additive authoring mappings. No new execute semantics.

---

## P17 / P16 / P15 / P14 / P12 / P11 / APP SHELL REGRESSION

P19 touches only `/crm/workflows` authoring files + additive controller props. Home, Command, Activities, Inbox, Attention, Deals board/list, and `CrmShell` internals are not rewritten. Workflows page still mounts `CrmShell`.

---

## SHARED-SURFACE CHANGES

**None.** Consumed as-is: `CrmShell`, `CreateDrawer`, `HairlinePanel`, `SurfaceHeader`, `Badge`, `Button`, `Input`, `NativeSelect`.

---

## FILES CHANGED

| File | Change |
|---|---|
| `docs/implementation/p19-automation-authoring.md` | This audit + contract |
| `app/Http/Controllers/Crm/WorkflowController.php` | Additive list props; optional create `active`; else_* / create_deal / notify mapping |
| `resources/js/lib/workflow-authoring.ts` | Registries, draft, validate, summarize |
| `resources/js/components/crm/workflow-builder.tsx` | WHEN/IF/THEN/ELSE builder |
| `resources/js/pages/crm/workflows/index.tsx` | Truthful list + editor + dirty/save/toggle |
| `tests/Feature/P19AutomationAuthoringTest.php` | Locks + HTTP contracts |
| `tests/js/p19-automation-authoring.ts` | Registry / summary / round-trip proofs |

**Not changed:** `WorkflowRunner`, `Workflow` model, migrations, templates catalog, routes, permissions config, Home, Command, Activities, Inbox, Deals, integrations.

---

## TESTS

- `tests/Feature/P19AutomationAuthoringTest.php`
- `tests/js/p19-automation-authoring.ts` (`npx vite-node`)

Existing: `CrmWorkflowsTest`, `TicketWorkflowTest`.

Commands:

| Command | Result |
|---|---|
| Focused Pest (P19 + CrmWorkflows + Ticket + Spine + Aurora chrome) | **54 passed** (397 assertions) |
| Focused Pest P19 after CI-safe proofs | **14 passed** (206 assertions) |
| `php artisan test` | **968 passed** (12002 assertions) |
| `tests/js/p19-automation-authoring.ts` | source-locked from Pest (vite-node is not spawned in CI) |
| eslint on P19-touched JS | **pass** |
| `php artisan wayfinder:generate --with-form && npm run types:check` | **pass** |
| `npm run build` | **pass** |
| GitHub CI (`tests / ci` on #229) | first run **failed** (`vite-node` HMR in CI); fixed in this tip |
| Contabo tip deploy | **NEEDS RESEARCH** |

---

## LIVE VISUAL QA

**LOCAL PASS** on seeded app at 1440 / 1280 / 1024 / 768 (no page H-overflow). Screenshots under `/opt/cursor/artifacts/screenshots/`.

**CONTABO: NEEDS RESEARCH.** This agent cannot deploy the tip. Research owns populated QA.

---

## REMAINING DEBT

- Test / dry run / execution history / run logs / retry → **P20**
- Integration connect UX (mailbox / WhatsApp / Meta) → **P22**
- Ask Evo / AI authoring → **P24**
- Workflow analytics leftover if Home/Reports still mention automation counts → **P28**
- Template `apply()` still activates (pre-existing; product may want draft templates later)
- Contabo populated responsive walk

---

## P20 HANDOFF

Do not start P20. Leave `WorkflowExecution` off the list. Do not add test-run, preview, logs, retry, or failure observability in this PR.

## P22 HANDOFF

`capabilities.has_mailbox` / `has_sequences` are read-only flags. Do not redesign Integrations here.

## P24 HANDOFF

No AI seam on Automation. Deterministic summaries only.

## P28 HANDOFF

Do not invent success-rate tiles on this list.

---

## RISKS

- Create omitting `active` still enables (legacy). Authoring UI always sends `false`.
- Templates still activate on apply.
- `create_deal` now writes `title` + `amount_cents` **in addition to** legacy `subject`.
- Else property/assign/notify now use `else_*` keys; then keys are unchanged.
- Contabo is a merge blocker owned by Research.

## MERGE READY

NO — Contabo populated QA pending Research. Do not merge. Do not start P20.
