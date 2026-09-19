# P24 → P25 handoff

P25 is **not** started in this PR. Do not merge P24 as a visual or global a11y rewrite.

## What P25 may consume

- `AskEvoContext` / `scope_key` / error codes as the only Ask Evo contract.
- Context indicator + suggestion chips + drawer trigger a11y already on Ask Evo surfaces (`data-testid="ask-evo-context"`, `ask-evo-trigger`, `ask-evo-rail`).
- Command OS `kind:"ask"` → `openAskEvo()` (one path).
- P23 activation booleans / step IDs via the activation context (read-only).
- Frozen record POSTs and draft-email confirmation.

## What P25 must not do

- Second LLM client, OpenRouter, client-side keys, streaming provider, or autonomous writes.
- Expand Ask Evo write tools or mark activation complete.
- Recalculate quote money or send quotes from the model.
- Retry / edit automations from Ask Evo.
- Preload the CRM or log prompts / secrets.
- Redesign chrome, DataWorkspace, QRD, Pipeline, Inbox, Dashboard, Quotes, Automation, Settings, Onboarding.
- Global responsive / motion / a11y pass (P25). P24 only touched Ask Evo indicator, chips, loading, and errors. Surfaces stay `overflow-x-hidden` at 1440 / 1024 / 768.

## Contabo

Research owns deploy. This PR reports `READY_FOR_CONTABO` only after CI is green. Agents do **not** deploy.

## Merge

`MERGE READY: NO` until a human reviews security tests A–T and frozen P09–P23 rails.
