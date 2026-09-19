# P28 — Evidence-based legacy cleanup

**Status:** Deletion executed. Behavior unchanged.  
**Repo:** `Mohamedbeghanem/EvoCrm`  
**Base SHA (exact `starting_ref`):** `9093aae6ff4c5ebb0499dd5597b2a89222d34ccd`  
**P00–P26:** Frozen. This PR does not reopen them.  
**P27 / P29 / V00:** Not started. No motion work.  
**Contabo / merge:** Not authorized. `READY_FOR_CONTABO: NO` · `MERGE READY: NO`

**Input:** P28A docs from PR #240 (`p28a-legacy-audit`): `P28A-AUDIT.md`, `P28A-DELETION-MAP.md`, `P28A-RISK-MATRIX.md`. Those were audited at `fa13a64`. Every candidate was **re-proven** at `9093aae` (P25/P26 landed after P28A).

**Policy applied:** Delete only **A SAFE DELETE + LOW RISK + NO ACTIVE REFERENCES** after revalidation. Do not auto-delete all original 33. Never delete B / C / D / E / HIGH / MEDIUM without conclusive new evidence. When uncertain: KEEP.

**Behavior changes:** NONE.

---

## 1. Revalidation method (9093aae)

| Channel | Result for deleted rows |
|---|---|
| Static imports (`resources/js/**/*.{ts,tsx}`) | Zero importers |
| Dynamic `import()` / `React.lazy` | None in `resources/js` |
| Inertia `Inertia::render` / `Route::inertia` | No live page pointed at deleted files |
| Routes `web` / `settings` / `api` / `console` | No controller/job/resource wired |
| Blade | Untouched (9 views remain) |
| Tests (`file_get_contents` / `toBeFile()` / class instantiate) | No existence lock on deleted paths |
| Flags / config / providers / events / scheduler | No references |
| Jobs / CLI | Drain job never dispatched; `leads:capture-drain` + `CaptureDrainNode` kept |
| API / webhooks / migrations / packages | Untouched. `lucide-react` and Radix deps kept (B) |
| Mobile | No references |
| P25 / P26 source locks | Read live Aurora/dialog/sheet/popover/command, Inbox, Ask Evo, activation, DataWorkspace — none of the deleted files |

P26 audit note that `LeadBoardController` was “still routed” is **stale**. At `9093aae`, `routes/web.php` has `Route::redirect('/leads', '/crm/deals/board')` and `CrmListWorkspaceTest` forbids `LeadBoardController` in routes.

---

## 2. Deleted (A + LOW + no active references)

| PATH / CLASS | P28A | REVALIDATION (9093aae) | WHY SAFE | REPLACED BY | VALIDATION |
|---|---|---|---|---|---|
| `resources/js/components/nav-main.tsx` | A1 | Zero TS/PHP importers; not in P01 file list | Unreachable starter rail | `app-sidebar.tsx` `NAV_GROUPS` | rg empty |
| `resources/js/components/nav-user.tsx` | A2 | Zero importers | Unreachable starter user menu | `user-menu-content.tsx` | rg empty |
| `resources/js/components/nav-footer.tsx` | A3 | Zero importers | Unreachable starter footer | Settings rail leaf | rg empty |
| `resources/js/components/crm/crm-analytics-shell.tsx` | A4 | Zero importers | Dead product shell | `reports-shell.tsx` | rg empty |
| `resources/js/components/crm/associations-card.tsx` | A5 | Zero importers | Dead record card | Record hub associations | rg empty |
| `resources/js/components/crm/contact-deals-kanban.tsx` | A6 | Zero importers | Dead contact kanban | `/crm/deals/board` | rg empty |
| `resources/js/components/crm/deal-health-pill.tsx` | A7 | Zero importers (Lead-OS `deal-health` node is unrelated) | Dead pill | P12 attention | rg empty |
| `resources/js/components/crm/record-workspace.tsx` | A8 | Only imported A9 | Dead record chain | `record-hub.tsx` / `record-chrome.tsx` | rg empty |
| `resources/js/components/crm/timeline-filter.tsx` | A9 | Only imported by A8 | Dead chain leaf | `record-activity-panel.tsx` | rg empty |
| `resources/js/lib/nav-pins.ts` | A10 | Zero JS imports | Unused pin helper | Hardcoded `NAV_GROUPS` | rg empty |
| `resources/js/components/ui/icon.tsx` | A11 | Zero imports | Lucide wrapper leftover | Inline Phosphor | rg empty |
| `resources/js/components/ui/placeholder-pattern.tsx` | A12 | Zero imports | Starter SVG | — | rg empty |
| `resources/js/components/ui/collapsible.tsx` | A13 | Zero imports (`sidebar.tsx` uses its own `collapsible` prop, not this module) | Unused Radix wrapper | — | rg empty; Radix dep **kept** (B12) |
| `resources/js/components/ui/toggle.tsx` | A14 | Only A15 | Mutual-only pair | — | rg empty; Radix dep **kept** |
| `resources/js/components/ui/toggle-group.tsx` | A15 | Only A14 | Mutual-only pair | — | rg empty |
| `CrmListHeader` in `list-chrome.tsx` | A16 | Export never imported. Live file still required: `CrmEmptyState` / `CrmListFooter` / `ListView` type (`record-hub.tsx`) | Dead export only | `ds/chrome/PageHeader` | Wave6 + CrmListWorkspace still read live exports |
| `CrmListToolbar` (+ private `FormBar`) in `list-chrome.tsx` | A17 | Export never imported | Dead export only | `FilterBar` | `list-toolbar.tsx` (C07) untouched |
| `app/Http/Controllers/Crm/LeadBoardController.php` | A18 | No web/api route; tests **forbid** class name in `routes/web.php` | Unrouted. `/leads` redirect + `/crm/leads` + API board stay | `DealController@board` | Keep C20/C25/C17 |
| `app/Http/Controllers/Outbound/OutboundReportController.php` | A19 | No route; `/outbound/reports` is a redirect | Unrouted | `ReportController` + `OutboundReportsDetail` | `OutboundPagesTest` redirect stays |
| `resources/js/pages/outbound/reports.tsx` | A20 | Only A19 | Orphan Inertia page | `pages/crm/reports.tsx` | Redirect C22 stays |
| `app/Jobs/DrainLeadCapturesJob.php` | A21 | Never `dispatch`ed; not in scheduler | Unused job wrapper | `leads:capture-drain` / `LeadCaptureDrainer` / `CaptureDrainNode` | LeadOs + capture tests stay |
| `app/Http/Resources/PipelineResource.php` | A22 | Zero PHP references (`SavedFilterResource` is the live resource) | Unused API resource | Inline controller arrays | rg empty |
| `routes/console.php` `inspire` closure | A23 | Laravel scaffold; scheduler list unchanged | Unused artisan command | — | `ScheduledCommandHealthTest` names live commands only |
| `resources/js/components/ui/aurora/data-table.tsx` | A25 | Zero `@/` imports; CRM tests **forbid** list pages to import it | Unused Lucide skin | `ds/workspace/DataTable` | Live Aurora primitives untouched |
| `resources/js/components/ui/aurora/pagination.tsx` | A26 | Zero `@/` imports | Unused Lucide skin | `WorkspacePaginator` | — |
| `resources/js/components/ui/aurora/toast.tsx` | A27 | Zero imports; comments already call it unused | Unused Lucide skin | Sonner (`ui/toast.tsx` barrel kept — P03 lock) | — |
| `resources/js/components/ui/aurora/combobox.tsx` | A28 | Zero `@/` imports | Unused Lucide skin | `NativeSelect` | — |
| `resources/js/components/ui/aurora/breadcrumb.tsx` | A29 | Zero `@/` imports | Unused Aurora breadcrumb | Phosphor `ui/breadcrumb.tsx` | P03 Phosphor lock stays |
| `resources/js/components/ui/aurora/progress.tsx` | A30 | Zero `@/` imports | Unused skin | — | — |
| `resources/js/components/ui/aurora/stat-card.tsx` | A31 | Zero imports | Unused skin | `home-kpi-strip.tsx` | C14 `evo-kpi-card.tsx` kept |
| `resources/js/components/ui/aurora/listbox.tsx` | A32 | Only imported by A28 | Dead leaf of A28 | — | — |
| `resources/js/lib/aurora/widget-interactions.ts` | A33 | Only imported by A28 | Dead leaf of A28 | — | `lib/aurora/{portal-container,shadcn-bridge}` kept |

**Deleted count:** 32 artifacts (30 files + 2 named exports). Not 33.

---

## 3. Retained from original A-33

| PATH | P28A | Why kept |
|---|---|---|
| `resources/js/components/aurora/prompt-input.tsx` | A24 | `SOURCE.json` `vendoredPaths` lists this file by name. Directory pin + explicit path = COMPATIBILITY, not unlocked A. No conclusive evidence it is safe to drop the vendor pin. |

---

## 4. Retained (do not delete in P28)

### B AFTER CONFIRMATION (12) — all kept

`GuidedActionBuilder.php`, `QuotaTracker.php`, `CRM_RAIL_OBJECTS`, Select/Switch/Popover chains, `next-env.d.ts`, `lucide-react` dep, `types/navigation.ts` `LucideIcon`, `hub-chrome.tsx`, `bulk-action-bar.tsx`, Radix leftover deps.

### C COMPATIBILITY (26) — all kept

`app-header.tsx` + `app-header-layout.tsx` (P01 `toBeFile()` + Lucide string), auth `{simple,card,split}` layouts (Wave0), `page-header.tsx`, `list-toolbar.tsx`, `saved-view-tabs.tsx`, Home leftover widgets, `evo-kpi-card.tsx`, `quick-launch-grid.tsx`, `record-action-row.tsx`, `pages/leads/board.tsx` (P26 + token test), `ui/alert.tsx`, `ui/navigation-menu.tsx`, `GET /leads` redirect, `GET /desk` → `/inbox`, `GET /outbound/reports` redirect, Inbox embed, `QuickRecordHarnessController`, `GET /api/v1/leads/board`, `CrmListShell`.

### D ACTIVE — all kept

DataWorkspace + `CrmListShell`, Contacts/Companies/Leads/Deals/Quotes, deal board, inbound `/crm/leads`, tickets domain, activities + `TasksOverlay`, segments/workflows/outbound/ads/reports, create/peek/Ask Evo drawers, native inbox + embed + `/conversations`, Activation + setup wizard, command palette, Settings IA, Phosphor rail, live Aurora primitive chain + bridge CSS, Ask Evo routes, webhooks, API v1, public quote/book, `SimpleMode` keys, `CrmEmptyState` / `CrmListFooter` / `CrmShell`.

### E UNKNOWN — all kept

Unused CSS classes inside live Aurora sheets; runtime `QuotaTracker` callers; external `/leads` HTML traffic.

### HIGH scrutiny (explicit keep)

Inbox native + embed, `/crm/leads`, `/leads` redirect, API `leads/board`, Ask Evo drawer/panel/command, Activation + wizard, webhooks, Quotes, Automation/workflows, Settings aliases, DataWorkspace bridges, onboarding, Lucide leftover files that tests lock (`app-header`, `leads/board`, `saved-view-tabs`, `quick-launch-grid`).

---

## 5. What this PR is not

- Not a refactor, rename, reorg, or dependency upgrade.
- Not a route/API/webhook/auth/AI behavior change.
- Not P27 motion, P29, or V00.
- Not a Contabo deploy.
- Not a merge.

P00–P26 implementation docs stay. Historical `docs/ui-audit.md` / `docs/ui-migration-plan.md` stay historical.

---

## 6. Validation plan

1. `rg` deleted paths — zero TS/TSX/PHP imports (comments + “must not contain” tests OK).
2. Routes: `/leads` redirect, `/crm/leads`, `/outbound/reports` redirect, API `leads/board` unchanged.
3. Focused Pest: Wave0, P01–P05, P25, P26, CrmListWorkspace, OutboundPages, EvoCrmP9, LeadCapture, LeadOsGraph, AuroraTokenBridge.
4. Full Pest via CI.
5. `npm run types:check`, `npm run lint:check`, `npm run build`.
6. P25 + P26 source locks preserved (no edits to those files).
