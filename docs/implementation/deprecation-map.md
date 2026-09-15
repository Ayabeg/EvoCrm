# Deprecation map

Strangler removals only. **P28** is the delete PR. Earlier phases stop importing.

Nothing in this file authorizes a behavior change to Laravel routes or Inertia contracts.

---

## 1. Delete in P28 (after zero imports)

| Artifact | Why | Stop importing in | Replacement |
|---|---|---|---|
| `components/app-header.tsx` | Laravel starter-kit; Lucide; unused by AppLayout | P02 (marked `@deprecated`; still not imported) | `AppSidebarHeader` |
| `layouts/app/app-header-layout.tsx` | Only consumer of `AppHeader` | P02 (marked `@deprecated`; still not imported) | `app-sidebar-layout.tsx` |
| `components/crm/list-toolbar.tsx` | Superseded by `ds/workspace/FilterBar` | already unused | FilterBar |
| `components/crm/saved-view-tabs.tsx` | Only used by list-toolbar | already unused | SavedViews |
| `pages/leads/board.tsx` | Orphan UI; `/leads` redirects to deals board | keep unrouted; delete P28 | `/crm/deals/board` |
| `app/Http/Controllers/Crm/LeadBoardController.php` | Renders orphan page | P28 **only if** no route/tests require the class — see `LeadsBoardTest` / `EvoCrmP9RetireLeadsBoardTest` before delete | Deal board controller |
| Lucide imports on leftover / unused files | Dual family leftover after P01 | P28 | `@phosphor-icons/react` — P01 already cleared active chrome. Remaining: `app-header.tsx`, `nav-main.tsx`, `ui/icon.tsx`, `types/navigation.ts`, `leads/board.tsx`, `saved-view-tabs.tsx`, `quick-launch-grid.tsx`, unused Aurora skins |
| Domain `components/crm/bulk-action-bar.tsx` | Thin wrapper over DS bar; still used by contacts + deals | Later bar-visual phase (not P03C URL work) | `ds/workspace/BulkActionBar` |
| `CrmListHeader` (list-chrome) | Legacy activities header | P15 | PageHeader + queue chrome |
| Dead Aurora skins unused by DS re-exports | `ui/aurora/{data-table,pagination,toast,combobox}` if still unreferenced | P28 | DS primitives |
| Hardcoded `#d9500f` / `#eaeaea` leftovers | Pre-token lock | opportunistic through P29 | CSS variables |

---

## 2. Adapter — keep until the named phase, then shrink

| Adapter | Keep until | Then |
|---|---|---|
| `CrmListShell` domain `renderResults` (pages still own tables) | P08 done for Quotes; Tickets remain | Shared-table `rows`; shell only maps Inertia → DataWorkspace props. Selection already workspace-owned (P03B). |
| `CrmShell` on tickets / activities / workflows | Each page’s migrate PR | Remove double chrome; rail is enough. Companies list dropped CrmShell in P05. Leads list dropped it in P06. |
| `components/aurora/command-palette.tsx` | P16 | Either become `ds/chrome/CommandPalette` or a thin re-export |
| `TasksOverlay` as a second notify surface | P15 (P02 kept overlay as the only topbar tasks entry) | `/crm/activities` work queue |
| `GuidedActions` as the only activation UI | P23 | Durable checklist **plus** leftover guided deals/prospecting if still useful |
| `list-chrome` `CrmListFooter` / `CrmEmptyState` | P08 done for Quotes; Tickets / other domain pages remain | `WorkspacePaginator` + `WorkspaceEmpty` on shared-table; domain pages still use list-chrome |
| `CrmObjectHeader` on boards | P11 | PageHeader inside DataWorkspace |

---

## 3. Do not deprecate

| Keep | Reason |
|---|---|
| Full record show pages | Approved: KEEP workspace, ADD drawer |
| Native inbox + embed fallback | Intentional dual mode |
| `/crm/leads` as an object | Not the deal engine; inbound leads |
| `/leads` → `/crm/deals/board` redirect | One deal engine |
| Structured workflows (no canvas) | Approved automation grammar |
| `CreateDrawer` | Create ≠ peek |
| `list-query.ts` / `/crm/filters` | URL state authority |
| `PipelineKanban` primitive | Shared with tickets |
| Phosphor on the rail | Icon authority |
| Public `/q/{token}` and `/book/{slug}` | Outside authenticated chrome |

---

## 4. REPLACE (rare)

`REPLACE` is only for something fundamentally unsuitable.

| Gap | Classification | Notes |
|---|---|---|
| Missing QuickRecordDrawer | **Add** (not replace) | Show pages stay |
| Command Home → `/home` | **Fixed** in P02 (`/dashboard`) | Not a component replace |
| n8n-style canvas | **Do not add** | Structured builder is the replacement for “we should have a canvas” |

No live product screen is classified REPLACE.

---

## 5. Removal checklist (P28)

1. `rg` for each deprecated path — zero TS/TSX imports
2. `rg lucide-react resources/js` — empty except comments or third-party leftovers explicitly listed
3. `rg "CrmListHeader|list-toolbar|AppHeaderLayout|AppHeader" resources/js`
4. Pest: Wave0–5, P03–P05, SimpleMode, MoveDeal, Quotes, Inbox still green
5. Do not delete controllers that tests still instantiate without a replacement test

---

## 6. Docs that are historical, not deprecated code

Keep in tree; do not “implement” them as current:

- `docs/ui-audit.md` (stale DataWorkspace paragraph)
- `docs/ui-migration-plan.md` P01–P16 (partially shipped) — now points here
- `docs/crm-redesign-plan.md` (black rail / antique orange)
