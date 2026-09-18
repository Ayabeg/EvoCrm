# P23 — Onboarding & Activation

**PR title:** P23 — Onboarding & Activation  
**BASE:** `4d2976befc7a94c267528e4a1fa7a810fe45e4a8`  
**P00–P22:** frozen. Additive Home + dismiss persist only.

## Why

Home had three create chips that vanished after the first deal **or** activity. Wizard dismiss was not activation. Existing workspaces that already did real CRM work had no durable, fact-based checklist.

## Files

| Path | Role |
|---|---|
| `app/Enums/ActivationStepId.php` | Step ids + CORE/OPTIONAL |
| `app/Services/Activation/WorkspaceActivationService.php` | SoT: facts, steps, progress, dismiss |
| `app/Models/WorkspaceActivationPreference.php` | Dismissal row only |
| `app/Http/Controllers/Activation/ActivationDismissalController.php` | POST dismiss |
| `database/migrations/2026_09_18_181700_create_workspace_activation_preferences_table.php` | Persist dismiss |
| `resources/js/lib/activation.ts` | Payload types (no completion logic) |
| `resources/js/components/dashboard/activation-checklist.tsx` | Presentation |
| `resources/js/pages/home.tsx` | Additive region above Attention |
| `docs/onboarding/P23-AUDIT.md` | Pre-code inventory |
| `docs/onboarding/P23-ACTIVATION-CONTRACT.md` | Contract |
| `docs/onboarding/P23-P24-HANDOFF.md` | Safe facts for P24 |

## Why persist

Dismissal cannot be derived from CRM rows. One row per `(workspace_id, user_id)` survives refresh, logout/login, and a second browser. Steps are **never** stored as complete.

## Queries

Per Home: 4 EXISTS + pipeline COUNT + bounded stages + P22 `Integrations::forWorkspace` booleans + 1 preference EXISTS. No N+1, no secrets.

## Permissions

See contract. CTAs omitted unless `can_perform`. Members still receive derived progress.

## Deferred

Workspace-profile step (no rename UI). Board-visit, invite, quote-sent, Google-only connect, P24 Ask Evo, visual redesign.

## Tests

`tests/Feature/P23ActivationTest.php` plus updated P17 / HomeCommandCenter activation assertions.
