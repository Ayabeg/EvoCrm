# EvoCRM Automation Benchmark

## Scope

This benchmark covers trigger, conditions, branching, actions, templates, testing, activation, monitoring, and the question of node-based versus structured workflow authoring.

## Current EvoCRM baseline

The current automation surface is resources/js/pages/crm/workflows/index.tsx with a structured trigger/action/condition/else editor, templates, and enable/disable behavior. The backend includes WorkflowController and app/Services/Crm/WorkflowRunner.php. This is a meaningful structured foundation; the target should not default to an open canvas.

## Benchmark evidence

| Product | Evidence | Strong behavior | Limitation for EvoCRM |
|---|---|---|---|
| Shopify Flow | [workflow editor](https://help.shopify.com/en/manual/shopify-flow/create/workflow-editor), [conditions](https://help.shopify.com/en/manual/shopify-flow/getting-started/understanding-conditions) | Structured trigger-condition-action model, readable branching, and approachable commerce automation. | Commerce objects and actions are not CRM-neutral. |
| Zapier | [branching screen](https://mobbin.com/screens/299ebab9-6845-46cb-b9d6-1f8b83ed030f) | Excellent step-by-step authoring, app/action discoverability, and broad integrations. | Long linear recipes can hide state, retries, and data shape. |
| HubSpot | [workflow branches](https://knowledge.hubspot.com/workflows/use-if-then-branches-in-workflows?pass=1), [workflow testing](https://knowledge.hubspot.com/workflows/test-your-workflow?product=crm) | Strong CRM triggers, if/then branches, enrollment criteria, test-before-activation, and history. | Advanced options can be intimidating and plan-dependent. |
| Klaviyo | Production flow builder patterns. | Strong event segmentation, timing, filters, and message-preview loop. | Marketing-first concepts are too specialized for core CRM. |
| Make | Production visual canvas patterns. | Powerful routing and data transformation. | Canvas complexity and spatial navigation are a poor SMB default. |
| n8n | Production node editor patterns. | Transparent technical execution and extensibility. | Technical mental model and error handling are too advanced for the default user. |

## Score comparison

| Candidate | Hierarchy | Ease | Speed | Discoverability | Density | Scale | A11y | Keyboard | Responsive | EvoCRM fit | Complexity |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Shopify Flow | 9 | 9 | 8 | 9 | 7 | 8 | 7 | 6 | 7 | 9 | 5 |
| Zapier | 8 | 9 | 9 | 9 | 7 | 9 | 7 | 8 | 7 | 9 | 6 |
| HubSpot | 9 | 7 | 7 | 8 | 8 | 10 | 7 | 7 | 6 | 9 | 8 |
| Klaviyo | 8 | 8 | 8 | 8 | 7 | 8 | 7 | 7 | 7 | 7 | 7 |
| Make | 7 | 6 | 6 | 7 | 8 | 9 | 6 | 6 | 5 | 6 | 9 |
| n8n | 7 | 5 | 6 | 7 | 8 | 9 | 6 | 7 | 5 | 6 | 9 |

## Target authoring model

Use structured steps as the primary builder:

1. Trigger: object/event, for example Deal stage changes or new WhatsApp conversation.
2. Enrollment: who or what qualifies, with frequency and re-entry rules.
3. Conditions: grouped AND/OR rules, with a plain-language summary.
4. Branches: If/Else paths only when needed; label each branch with the outcome.
5. Actions: create task, assign owner, update field, send approved message/email, create note, create quote, notify team, or call a connector.
6. Timing: delay, business hours, quiet hours, and cancellation condition.
7. Test and review: select a representative record, show predicted path, show actions that would run, and identify missing permissions/data.
8. Activation: name, owner, status, version, and audit history.

An advanced canvas may be offered later for complex branching, but it must compile to the same workflow model and not create a second mental model.

## Safety and observability

Every workflow needs draft, active, paused, and failed states. Activation requires a review summary. Destructive or external actions need explicit warnings. History must show trigger record, path taken, action result, retry/error detail, and a link back to the record.

## ADOPT / ADAPT / REJECT

| Decision | Rationale |
|---|---|
| ADOPT Shopify Flow's readable structured sequence | It matches ordinary SMB authoring and is accessible to non-technical users. |
| ADOPT HubSpot's test-before-activate and branch semantics | Users need confidence about enrollment and path behavior. |
| ADOPT Zapier's action discovery | It makes the next useful action easy to find. |
| ADAPT Klaviyo's event and timing clarity | Apply to CRM activities, conversations, and stage changes without marketing jargon. |
| ADAPT Make/n8n ideas only for an advanced mode | Preserve power without forcing a canvas on everyone. |
| REJECT canvas-first authoring | Spatial complexity, poor mobile behavior, and weak keyboard/accessibility defaults. |
| REJECT one-click activation with no preview | Automation can create customer-facing and data integrity failures. |
| REJECT arbitrary code as a normal action | Custom code belongs in controlled integration infrastructure, not the SMB workflow default. |

## Implementation impact

Eventually affect resources/js/pages/crm/workflows/index.tsx, WorkflowController, WorkflowRunner, workflow templates, connector action registries, validation, execution history, and automation tests. No code is changed in this phase.

## Sources

See the [overall benchmark](ux-benchmark.md) and [Mobbin contract](../evocrm-mobbin-contract.md).
