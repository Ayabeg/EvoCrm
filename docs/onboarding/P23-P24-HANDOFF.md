# P23 → P24 handoff

P24 is **Contextual Ask Evo**. Do not implement it here.

## Safe facts P24 may read

These are product facts already visible to the signed-in workspace member. They are **not** secrets.

| Fact | Where | Meaning |
|---|---|---|
| `activation.activated` | Home payload | CORE loop exists (CRM data + deal + activity) |
| `activation.progress` | Home payload | completed / total / core_* |
| `activation.steps[].id` + `complete` | Home payload | Checklist row state |
| `activation.dismissed` | Home payload | User hid the panel |
| `workspace_named` | Service `facts()` (not a checklist row) | Workspace has a name |
| P22 `integrations.activation.*` | Shared Inertia `integrations` | Connected mailbox / Meta / WhatsApp / SMS **booleans only** |
| Home `context.name` | P17 | First name for greeting — not a prompt to invent coaching |

## Do not hand to P24

- Integration `access_token`, refresh tokens, mailbox passwords
- Webhook keys / full callback URLs
- Other-workspace ids or counts
- Wizard session `oauth_setup.*`
- Fake health / ROI / readiness scores
- “Ask Evo to finish onboarding” as a completion cheat

## Placement constraint

Ask Evo must not replace this checklist, must not become an orange Home hero, and must not mark activation complete. P17 Attention / Today / KPI / Pipeline / Recent stay the operating home.

## Suggested later (not in P23)

If Ask Evo needs setup context, consume `activation.steps` as read-only. Do not write dismissal or step completion from the model.
