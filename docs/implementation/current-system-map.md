# Current system map

**Baseline:** `main` @ `1b1c10d` (inspected 2026-09-14; P02 facts below).  
**Classifications:** `CANONICAL KEEP` · `ADAPTER KEEP TEMPORARILY` · `MIGRATE` · `DEPRECATE` · `REPLACE` (only if fundamentally unsuitable).  
**Companion:** [canonical-component-map.md](./canonical-component-map.md) · [deprecation-map.md](./deprecation-map.md).

This is the P00 freeze of **what exists**. It is not permission to rewrite Laravel.

---

## 1. Stack (as shipped)

| Layer | Evidence |
|---|---|
| Laravel 13 / PHP 8.3 | `composer.json` |
| Inertia Laravel 3 + React 3 | `inertiajs/inertia-laravel`, `@inertiajs/react` |
| React 19 + TypeScript | `package.json` |
| Tailwind 4 | `@tailwindcss/vite`, `resources/css/app.css` |
| Wayfinder | `@laravel/vite-plugin-wayfinder` |
| DS primitives | `resources/js/ds/components/*` re-exported from `@/components/ui/*` |
| Icons | Phosphor on active product chrome (`components.json`); Lucide remains in leftover/legacy only (see P01 report) |
| Charts | In-house EvoViz (`resources/js/evoviz/*`) |

Layout switch (`resources/js/app.tsx`):

- `auth/*` → `AuthLayout`
- `settings/*` → `[AppLayout, SettingsLayout]`
- `public/*` → `PublicLayout`
- else → `AppLayout` → `layouts/app/app-sidebar-layout.tsx`

---

## 2. App shell

| System | Paths | Verdict | Evidence |
|---|---|---|---|
| Authenticated shell | `layouts/app-layout.tsx`, `layouts/app/app-sidebar-layout.tsx`, `components/app-shell.tsx` | **CANONICAL KEEP** | Default for all product pages |
| Sidebar 64/240 | `components/app-sidebar.tsx`, `components/ui/sidebar.tsx` | **CANONICAL KEEP** | Groups Home / CRM / Communication / Sales / Automation + More + Settings. Phosphor. `P04AppShellTest` |
| Topbar | `components/app-sidebar-header.tsx` | **CANONICAL KEEP** (P02 normalized) | Search/⌘K → palette, Ask Evo → same palette, Create dropdown, one Tasks overlay button, profile |
| Header layout leftover | `layouts/app/app-header-layout.tsx`, `components/app-header.tsx` | **DEPRECATE** | Lucide starter-kit header. **Not imported by `AppLayout`.** Marked `@deprecated` in P02; delete in P28. |
| Settings chrome | `layouts/settings/layout.tsx`, `components/settings/chrome.tsx` | **CANONICAL KEEP** (IA migrate P21) | Groups You / Workspace / Integrations / CRM / Admin |
| Auth / public | `layouts/auth-*`, `layouts/public-layout.tsx` | **CANONICAL KEEP** | Out of this UX program except tokens |
| Page header | `ds/chrome/PageHeader.tsx`, `components/page-header.tsx`, `crm-object-header.tsx` | **MIGRATE** toward `PageHeader` | DataWorkspace already uses `PageHeader`. Deals board / leads still use `CrmObjectHeader` |

### Sidebar IA (live)

```
Home                  /dashboard
CRM                   Contacts, Companies, Deals, Pipeline=/crm/deals/board
Communication         Inbox=/inbox, Activities
Sales                 Quotes
Automation            Workflows (/crm/workflows, /automation alias)
More                  Leads, Tickets, Segments, Ads, Reports, Outbound
Footer                Settings
```

`CRM_RAIL_OBJECTS` in the same file still lists leads/tickets for other consumers — do not confuse with `NAV_GROUPS`.

---

## 3. Data workspace

| System | Paths | Verdict | Evidence |
|---|---|---|---|
| DataWorkspace suite | `ds/workspace/{DataWorkspace,SavedViews,FilterBar,AdvancedFilterDrawer,DataTable,BulkActionBar,WorkspaceEmpty,WorkspacePaginator,surface,types,index}` | **CANONICAL KEEP** | Owns chrome. Native table/pagination/empty only in `resultMode: 'shared-table'`. Board slot works in both modes when `mode="board"`. Domain mode uses `renderResults` |
| CrmListShell adapter | `components/crm/crm-list-shell.tsx` | **ADAPTER KEEP TEMPORARILY** | Thin Inertia mapper. `resultMode="domain"` + `renderResults` + workspace `selection` (P03B). Domain children still own the table. No stub `rows` / `selectedIds` |
| ListViewTable | `components/crm/list-view-table.tsx` | **ADAPTER KEEP TEMPORARILY** | Domain cell renderers. `ListDataTable` already delegates here |
| Domain BulkActionBar | `components/crm/bulk-action-bar.tsx` | **ADAPTER KEEP TEMPORARILY** | Used by contacts + deals pages. DS `ds/workspace/BulkActionBar.tsx` exists in parallel |
| list-query | `lib/list-query/*`, `components/crm/list-query.ts`, `lib/list-view-config.ts` | **CANONICAL KEEP** | P03C canonical query + domain adapters. `list-query.ts` still owns chips + `filterFields` whitelist. URL is SoT |
| FilterBuilder | `components/crm/filter-builder.tsx` | **CANONICAL KEEP** | Mounted inside AdvancedFilterDrawer |
| list-toolbar + saved-view-tabs | `list-toolbar.tsx`, `saved-view-tabs.tsx` | **DEPRECATE** | No page imports. Only self-reference |
| list-chrome header | `list-chrome.tsx` (`CrmListHeader`, `CrmListFooter`, `CrmEmptyState`) | **MIGRATE** | Activities still uses `CrmListHeader`. Footer/empty still used by adapter pages |
| CrmShell / RoomShell | `crm-shell.tsx`, `room-shell.tsx` | **ADAPTER KEEP TEMPORARILY** | Still wraps companies, leads, tickets, activities, segments, workflows. Contacts/deals/quotes skip it |
| Per-product shells | `desk-shell.tsx`, `outbound-shell.tsx`, `ads-shell.tsx`, `reports-shell.tsx`, `crm-analytics-shell.tsx` | **CANONICAL KEEP** for those products | Out of P04–P08. Do not force DataWorkspace onto Ads/Outbound in this program |

### List page matrix

| Object | Page | Shell | Table | Create | Bulk | Saved views |
|---|---|---|---|---|---|---|
| Contacts | `pages/crm/contacts/index.tsx` | CrmListShell → DataWorkspace `shared-table` (no CrmShell) | ListDataTable / ListViewTable (workspace selection) | CreateDrawer | Domain BulkActionBar via workspace `bulk` slot | Yes |
| Companies | `pages/crm/companies/index.tsx` | **CrmShell + CrmListShell** | ListViewTable (selection wired, not selectable) | CreateDrawer | No | Yes |
| Deals list | `pages/crm/deals/index.tsx` | CrmListShell | ListViewTable (workspace selection) | CreateDrawer | Domain BulkActionBar (shared selection) | Yes + stage pills |
| Deals board | `pages/crm/deals/board.tsx` | Custom CrmObjectHeader | PipelineKanban | CreateDrawer | No | Board options, not DataWorkspace views |
| Quotes | `pages/crm/quotes/index.tsx` | CrmListShell | ListViewTable (selection wired, not selectable) | CreateDrawer (needs deal id) | No | Yes |
| Tickets list | `pages/crm/tickets/index.tsx` | CrmShell + CrmListShell | ListViewTable | CreateDrawer | No | Yes |
| Tickets board | `pages/crm/tickets/board.tsx` | CrmShell + header | PipelineKanban | — | — | Status columns |
| Leads | `pages/crm/leads/index.tsx` | CrmShell + CrmObjectHeader | **Raw `<table>`** | CreateDrawer | No | **No** |
| Activities | `pages/crm/activities/index.tsx` | CrmShell + CrmListHeader | Custom cards | `?create=1` redirect | No | Inline filters only |
| Segments | `pages/crm/segments/index.tsx` | CrmShell + header | Custom | CreateDrawer | No | Client filter |
| Workflows | `pages/crm/workflows/index.tsx` | CrmShell + HairlineTable | Structured rows | CreateDrawer + templates | — | — |

**No page imports `DataWorkspace` directly.** All list chrome goes through `CrmListShell`.

---

## 4. Records

| System | Paths | Verdict |
|---|---|---|
| Full record workspace | `record-chrome.tsx`, `record-hub.tsx`, `record-workspace.tsx`, `record-properties.tsx`, `record-activity-panel.tsx`, `adaptive-workspace-shell.tsx` | **CANONICAL KEEP** |
| Ask Evo | `ask-evo-panel.tsx` + POST `/crm/{object}/{id}/ask` | **CANONICAL KEEP** (unify entry in P24) |
| Activity composer | `activity-composer.tsx` | **CANONICAL KEEP** |
| CreateDrawer | `create-drawer.tsx` | **CANONICAL KEEP** for create; **not** a peek. P01: imports `@/components/ui/drawer` |
| QuickRecordDrawer | — | **REPLACE** gap — does not exist; add in P09 (not a replacement of show pages) |
| Lead path / convert | `record-path.tsx`, `lead-conversion-dialog.tsx` | **CANONICAL KEEP** |

---

## 5. Pipeline

| System | Paths | Verdict |
|---|---|---|
| Deal board | `pages/crm/deals/board.tsx` | **CANONICAL KEEP** (adapt onto DataWorkspace mode=board in P11) |
| Kanban primitive | `pipeline-kanban.tsx` | **CANONICAL KEEP** |
| Layout toggle / switcher / options | `deal-layout-toggle.tsx`, `pipeline-switcher.tsx`, `board-options-sheet.tsx`, `deal-forecast-bar.tsx` | **CANONICAL KEEP** |
| `/leads` redirect | `routes/web.php` | **CANONICAL KEEP** |
| `/crm/leads` inbound list | `pages/crm/leads/index.tsx` | **MIGRATE** onto DataWorkspace (P06), not onto the deal board |
| Orphan `leads/board` | `pages/leads/board.tsx`, `LeadBoardController` | **DEPRECATE** — no web route |
| Tickets board | `pages/crm/tickets/board.tsx` | **CANONICAL KEEP** as a consumer of the kanban primitive |

Move contract: `POST /crm/deals/{deal}/move`. No keyboard move, no undo toast.

---

## 6. Inbox & communication

| System | Paths | Verdict |
|---|---|---|
| Inbox page | `pages/desk/inbox.tsx` | **CANONICAL KEEP** |
| Native chrome | `inbox-chrome.tsx`, `adaptive-workspace-shell.tsx`, `desk-thread-card.tsx` | **CANONICAL KEEP** |
| Embed fallback | iframe `title="EvoDesk inbox"` when `embedUrl && !useNative` | **CANONICAL KEEP** — fallback, not IA |
| Desk connectors | `desk/official-connect-panel.tsx`, `POST /desk/connectors` | **CANONICAL KEEP** |
| Conversations | `pages/crm/conversations.tsx` | **CANONICAL KEEP** (history) |
| Reply / ticket | `POST /desk/threads/{thread}/reply`, `.../ticket` | **CANONICAL KEEP** |

---

## 7. Command, AI, overlays

| System | Paths | Verdict |
|---|---|---|
| CRM palette | `components/crm/command-palette.tsx` | **CANONICAL KEEP** (P01: Phosphor; P02: Home → `/dashboard`; sections still P16) |
| Aurora palette primitive | `components/aurora/command-palette.tsx` | **ADAPTER KEEP TEMPORARILY** — presentation layer |
| Search index | `evoSearchIndex` Inertia share | **CANONICAL KEEP** |
| Tasks overlay | `components/crm/tasks-overlay.tsx` | **ADAPTER KEEP TEMPORARILY** — P02 kept it as the single topbar tasks entry; fold into `/crm/activities` in P15 |
| DS overlays | `ds/components/{Drawer,Modal,Toast}` | **CANONICAL KEEP** |

Palette today: sections `records` + `navigate` only. Phosphor icons (P01). Home item `href: '/dashboard'` (P02). `/` is named `home` and redirects; there is no `/home` route.

Topbar Ask Evo opens the palette, not `AskEvoPanel`. Topbar Tasks opens `TasksOverlay` (not a second Notifications dropdown).

---

## 8. Home, quotes, automation, onboarding

| System | Paths | Verdict |
|---|---|---|
| Home | `pages/home.tsx`, `components/dashboard/*`, `HomeController` | **CANONICAL KEEP** (P17 hierarchy) |
| Guided actions | `guided-actions.tsx` | **ADAPTER KEEP TEMPORARILY** toward durable ACTIVATION checklist |
| Quotes list | `pages/crm/quotes/index.tsx` | **MIGRATE** onto full DataWorkspace contract (P08) |
| Quotes show / editor | `pages/crm/quotes/show.tsx` | **CANONICAL KEEP** (P18 is builder polish, not a rewrite) |
| Public quote | `pages/public/quote.tsx`, `/q/{token}` | **CANONICAL KEEP** — do not touch in UI phases |
| Workflows | `pages/crm/workflows/index.tsx` | **CANONICAL KEEP** structured authoring (not n8n canvas) |
| Setup wizard | `pages/settings/setup/wizard.tsx` | **CANONICAL KEEP** (connectors). Not activation complete |
| Integrations | `pages/settings/apps/*`, `connectors.tsx` | **CANONICAL KEEP** (P22 directory IA) |

---

## 9. Icons

| Family | Where | Verdict |
|---|---|---|
| Phosphor | Sidebar, topbar, command palette, record chrome, Ask Evo, setup wizard, settings chrome, DS FilterBar/SavedViews | **CANONICAL KEEP** (P01 converged) |
| Lucide | Leftover `app-header`, unused starter-kit/`NavItem` type, orphan `leads/board`, unused Aurora skins | **DEPRECATE** — stop importing; delete in P28 |
| `components.json` | `"iconLibrary": "phosphor"` | Correct; active chrome now matches |

---

## 10. Backend contracts (do not move)

Frozen unless a phase AC explicitly adds a query param:

- `routes/web.php`, `routes/settings.php`, `routes/api.php`
- Inertia names and prop shapes: `listView`, `savedFilters`, `activeFilters`, `HomeDashboardBuilder` KPIs, `evoSearchIndex`, `auth.capabilities`
- Bulk POST `/crm/contacts/bulk`, `/crm/deals/bulk`
- Saved views `/crm/filters`
- Deal move, quote send/revoke/accept, workflow toggle/store, inbox reply
- Permissions + simple mode
- Desk iframe header rules (`docs/desk-iframe-headers.md`)

---

## 11. Stale docs (read with this map)

`docs/ui-audit.md` §2 claims “There is **no** `DataWorkspace` component.” That was true at audit SHA `5131471`. It is **false** on current `main` (P05 landed in #198). Prefer this file.
