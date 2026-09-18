# P20 — Automation Testing, History & Safety

P19 authoring is frozen. This slice makes the existing runner inspectable after authoring.

## Domain contract

The engine is still one trigger, optional IF, one THEN action, optional ELSE action.

`workflow_executions` is now the history table as well as the delay queue.

Persisted statuses only:

| Status | Meaning | Terminal | Retryable |
|---|---|---|---|
| `pending` | Delayed run waiting for `run_at` | No | No |
| `running` | Scheduler claimed the row | No | No |
| `completed` | Action path finished (including no-action ELSE) | Yes | No |
| `failed` | Action threw or webhook HTTP was not 2xx | Yes | No |
| `cancelled` | Workflow was off/missing when a delayed row became due | Yes | No |

Derived UI labels only: Scheduled (`pending` + future `run_at`), Due (`pending` + `run_at` <= now). No invented `skipped` / `retry` status.

## Safety

- Immediate runs persist a row.
- Delayed runs claim `pending` → `running` before execute.
- Turning a workflow off cancels **pending** rows immediately. Running rows are not cancelled.
- Delete still cascades history. The UI confirms this.
- Retry is not implemented. Actions are not idempotent.

## Redaction

`WorkflowExecutionRedactor` strips secrets at write and present time. `crm.view` and `deals.team_only` gate record labels, emails, and hrefs.

## Test / preview

No dry-run exists. The editor shows **Review configuration** only. That is not a test run.

## P24

History rows are structured facts: workflow, status, timestamps, trigger, branch, action, condition, sanitized parameters/result/error, record refs. Do not add AI summaries here.

## P28

No obsolete execution-history chrome existed on P19. Do not delete the authoring list or builder.
