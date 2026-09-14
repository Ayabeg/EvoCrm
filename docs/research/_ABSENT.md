# Absent research sources

**Searched:** 2026-09-14  
**Baseline:** `main` @ `7d05ca7` (HEAD at plan time). Research was requested against the audit SHA `a0b9a85` (i18n hydrate, #201) — that SHA also has **no** `docs/research/`.  
**Method:** `git ls-tree -r` across every local remote branch; `git log --all` for `docs/research/*`, `*benchmark*.md`, `docs/evocrm-ux-blueprint.md`; workspace glob. GitHub code search was unavailable (MCP discovery failed).

None of the requested Source-of-Truth research files exist on `main` or on any reachable branch in this clone.

## Absent on every searched ref

| Requested path | Status |
|---|---|
| `docs/research/ux-benchmark.md` | Absent. **Reconstructed** in this PR from the approved research summary + present docs. |
| `docs/research/dashboard-benchmark.md` | **Absent. Not reconstructed** — no approved body, no branch copy, no scores. |
| `docs/research/data-workspace-benchmark.md` | **Absent. Not reconstructed** — contract is specified in `docs/design-system.md` and implemented (adapter) in `resources/js/ds/workspace/*`. |
| `docs/research/record-workspace-benchmark.md` | Absent. **Reconstructed** from the approved summary + `docs/evocrm-mobbin-contract.md` + live `RecordShell`. |
| `docs/research/pipeline-benchmark.md` | Absent. **Reconstructed** from the approved summary + live deals board. |
| `docs/research/inbox-benchmark.md` | **Absent. Not reconstructed** — live dual-mode inbox documented in the system map. |
| `docs/research/automation-benchmark.md` | **Absent. Not reconstructed** — live workflows are a structured table, not a canvas. |
| `docs/research/command-benchmark.md` | **Absent. Not reconstructed** — live palette documented in the system map. |
| `docs/research/onboarding-benchmark.md` | Absent. **Reconstructed** from the approved summary + setup wizard + Home `GuidedActions`. |
| `docs/research/settings-benchmark.md` | Absent. **Reconstructed** from the approved summary + `layouts/settings/layout.tsx`. |
| `docs/research/micro-ux-benchmark.md` | Absent. **Reconstructed** from the approved summary + `docs/design-system.md` Do/Don't. |
| `docs/research/major-category-scorecard.md` | **Absent. Not reconstructed** — inventing numeric scores would be false precision. |
| `docs/research/evocrm-pattern-map.md` | **Absent. Not reconstructed** — superseded by `docs/implementation/canonical-component-map.md`. |
| `docs/evocrm-ux-blueprint.md` | **Absent.** Closest present locks: `docs/design-system.md`, `docs/evocrm-mobbin-contract.md`. |

## Present docs used instead (do not treat as the missing research)

- `docs/design-system.md` — locked tokens, shell, DataWorkspace contract sketch
- `docs/ui-audit.md` — historical inventory (stale on DataWorkspace; written before P05 landed)
- `docs/ui-migration-plan.md` — historical P01–P16 visual strangler (P02–P05 already shipped)
- `docs/evocrm-mobbin-contract.md` — HubSpot/Salesforce density refs (pattern only, never paint)
- `docs/visual-system/responsive-architecture.md` — breakpoint behavior
- `docs/crm-redesign-plan.md` — older redesign narrative (black rail / `#EC6025`; superseded by design-system lock)

## Reconstruction rule

The six files created under `docs/research/` in this PR are **faithful reconstructions** of the approved research *intent*. They cite Mobbin IDs only when those IDs already exist in `docs/evocrm-mobbin-contract.md` or `docs/design-system.md`. They do **not** invent scores, fake screenshots, or new Mobbin URLs.
