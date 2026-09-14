# Absent Source-of-Truth research files

**Searched:** 2026-09-14  
**Baseline:** `main` @ `7d05ca7`. Requested audit SHA `a0b9a8571fed2a1cbe7bd98d58b47d043c4fc7b2` also has **no** `docs/research/` on any reachable ref.  
**Method:** `git ls-tree -r` on every local remote branch; `git log --all` for `docs/research/*`, `*benchmark*.md`, `docs/evocrm-ux-blueprint.md`; workspace glob. GitHub code search was unavailable (MCP discovery failed).

None of the requested Source-of-Truth files existed on `main` or on any searched branch **before this PR**. This file lists what is **still missing** (not restored) and what this PR restored from the approved user pack.

---

## Still absent (not found on the repo — do not invent)

These Source-of-Truth files were requested and were **not** on any searched ref. This PR does **not** create fake scores, fake Mobbin screenshots, or stub replacements for them.

| Requested path | Status |
|---|---|
| `docs/research/dashboard-benchmark.md` | **Absent.** Home behavior is covered in `ux-benchmark.md` Finding 12 and `onboarding-benchmark.md`. No standalone dashboard scorecard. |
| `docs/research/data-workspace-benchmark.md` | **Absent.** Contract lives in `docs/design-system.md` + `ds/workspace/*` + `ux-benchmark.md` Findings 1–2, 4. |
| `docs/research/inbox-benchmark.md` | **Absent.** Inbox/EvoDesk boundary is `ux-benchmark.md` Finding 6 + `current-system-map.md`. |
| `docs/research/automation-benchmark.md` | **Absent.** Structured-not-canvas + test-before-activate is `ux-benchmark.md` Finding 9. |
| `docs/research/command-benchmark.md` | **Absent.** Command/Ask Evo gap is `ux-benchmark.md` Finding 10. |
| `docs/research/major-category-scorecard.md` | **Absent.** No numeric scores invented. |
| `docs/research/evocrm-pattern-map.md` | **Absent.** Use `docs/implementation/canonical-component-map.md`. |
| `docs/evocrm-ux-blueprint.md` | **Absent.** Closest locks: `docs/design-system.md`, `docs/evocrm-mobbin-contract.md`, this research pack. |

---

## Restored in this PR (were absent on git; now present from the approved pack)

| Path | Pack contents |
|---|---|
| `docs/research/ux-benchmark.md` | Audited `a0b9a8571fed2a1cbe7bd98d58b47d043c4fc7b2`; Findings 1–12; benchmark matrix; Mobbin user-pack URLs |
| `docs/research/micro-ux-benchmark.md` | Behavior matrix Button → Keyboard shortcut; ADOPT/REJECT; Lucide/Phosphor risk |
| `docs/research/pipeline-benchmark.md` | One deal engine; `board.tsx`; stages; column/card/move; reject Lead Board + drag-only |
| `docs/research/record-workspace-benchmark.md` | KEEP RecordShell; ADD QuickRecordDrawer; drawer vs full; HubSpot/Attio/Salesforce/Pipedrive ADOPT/ADAPT/REJECT; header/left/center/right; URL-addressable peek |
| `docs/research/settings-benchmark.md` | Target IA Personal / Workspace / CRM / Communication / Automation / Integrations / Developer; scopes ME/WORKSPACE/CRM/CHANNEL/INTEGRATION/DEVELOPER; Stripe danger; max 2 levels |
| `docs/research/onboarding-benchmark.md` | Persistent Home 9-step checklist; states; ADOPT Shopify/Linear/Stripe; REJECT wizard-hides-product and auto-connect without consent |

---

## Present docs that are not the missing research

- `docs/design-system.md`
- `docs/ui-audit.md` (stale: claims DataWorkspace does not exist)
- `docs/ui-migration-plan.md` (historical P01–P16; P02–P05 shipped)
- `docs/evocrm-mobbin-contract.md`
- `docs/visual-system/responsive-architecture.md`
- `docs/crm-redesign-plan.md`

**Rule:** Do not invent Mobbin IDs or scores for absent files. Cite only the user pack / `evocrm-mobbin-contract.md` / `design-system.md`.
