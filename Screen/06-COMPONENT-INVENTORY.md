# EvoCRM component inventory

Scope: reusable frontend under `resources/js/components` and `resources/js/ds`. Not a refactor list.

Duplicated patterns are **documented, not fixed**.

## Shell

| Component | Path | Purpose | Screens |
|-----------|------|---------|---------|
| AppLayout | `layouts/app-layout.tsx` | Authenticated layout picker | all app pages |
| AppSidebarLayout | `layouts/app/app-sidebar-layout.tsx` | Rail + header + content | canonical |
| AppSidebar | `components/app-sidebar.tsx` | Primary nav | SCR-SHELL-002 |
| AppSidebarHeader | `components/app-sidebar-header.tsx` | Topbar | SCR-SHELL-003 |
| AppShell | `components/app-shell.tsx` | Shell primitive | |
| AppHeader | `components/app-header.tsx` | **Unused by AppLayout** `[CONFIRMED-CODE]` comment | dead for product chrome |
| Settings layout | `layouts/settings/layout.tsx` | Settings IA | SCR-SHELL-004 |
| Auth layouts | `layouts/auth/*` | Login family | SCR-AUTH-* |
| Public layout | `layouts/public-layout.tsx` | Quote/book | SCR-PUB-* |
| UserMenuContent | `components/user-menu-content.tsx` | Account menu | OVR-SHELL-004 |

## Command / overlays

| Component | Path | Notes |
|-----------|------|-------|
| CommandPalette (CRM) | `components/crm/command-palette.tsx` | wraps Aurora command palette |
| Aurora CommandPalette | `components/aurora/command-palette.tsx` | |
| TasksOverlay | `components/crm/tasks-overlay.tsx` | |
| CreateDrawer | `components/crm/create-drawer.tsx` | right Drawer |
| AskEvo drawer/panel | `ask-evo-drawer.tsx`, `ask-evo-panel.tsx` | |
| Quick record | `resources/js/ds/workspace/quick-record` | peek/create |

## CRM list / workspace

| Component | Path | Notes |
|-----------|------|-------|
| CrmListShell | `crm/crm-list-shell.tsx` | Maps Inertia → DataWorkspace |
| DataWorkspace | `ds/workspace/DataWorkspace` | shared table/board workspace |
| list-query | `lib/list-query/*` | URL contract |
| ListViewTable / hairline-table | `crm/list-view-table.tsx`, `crm/hairline-table.tsx`, `surface/hairline-table.tsx` | **two hairline tables** (crm vs surface) |
| ListToolbar, ListChrome, HubChrome | `crm/list-toolbar.tsx` etc. | |
| SavedViewTabs | `crm/saved-view-tabs.tsx` | |
| FilterBuilder / column-filter-row / crm-active-filters | | |
| BulkActionBar | `crm/bulk-action-bar.tsx` | |
| StagePills | `crm/stage-pills.tsx` | |
| ColumnChooser | `crm/column-chooser.tsx` | |
| PipelineSwitcher | `crm/pipeline-switcher.tsx` | |
| Deal layout toggle | `crm/deal-layout-toggle.tsx` | |
| Ticket layout toggle | `crm/ticket-layout-toggle.tsx` | |
| EmptyState | `ui/empty-state.tsx`, `ui/aurora/empty-state.tsx`, `crm/empty-room.tsx` | **triple empty pattern** |

## Record hub

| Component | Path |
|-----------|------|
| RecordChrome / RecordHub / RecordPath / RecordProperties | `crm/record-*.tsx` |
| RecordActivityPanel / activity-composer | |
| InlineRecordField | `crm/inline-record-field.tsx` |
| Deal line items, quotes, splits, suggestion card | |
| Lead dialogs | `lead-conversion-dialog`, `lead-edit-dialog`, `lead-owner-dialog` |
| EnrichmentPanel | |
| PipelineKanban / deal-pipeline-board | |

## Module shells

AdsShell, DeskShell, OutboundShell, ReportsShell, RoomShell, AdaptiveWorkspaceShell, InboxChrome.

## Dashboard

`components/dashboard/*` — header, KPI strip, attention, work, pipeline, recent, activation, widgets. Working tree has uncommitted V02 edits — audit those files as current; do not treat git HEAD as UI truth for Home.

## Settings primitives

`settings/chrome.tsx`: SettingsPageHeader, SettingsCard, SettingsFormRow, SettingsSaveBar.

## Design system / Aurora / shadcn

`components/ui/*` and `components/ui/aurora/*` — **parallel button, dialog, input, select, tabs, etc.** Product uses a mix. Aurora SOURCE.json records upstream.

Toaster: `ui/sonner.tsx` + `ui/toast.tsx` — **two toast stacks possible**.

Drawer vs Sheet vs Dialog vs Dropdown vs Popover all present.

## Icons / brand

Phosphor icons. `brand/marks.tsx`, `app-logo.tsx`.

## Shared vs local

Column contracts live **next to pages** (`contact-columns.tsx`) not in ds/. Domain list pages are thin; behavior is shared.

## Duplicated implementations (do not merge in this audit)

1. `crm/hairline-table.tsx` vs `surface/hairline-table.tsx`
2. `ui/*` vs `ui/aurora/*`
3. `ui/empty-state` vs `aurora/empty-state` vs `empty-room`
4. Command palette: aurora vs crm wrapper
5. AppHeader vs AppSidebarHeader
6. Inbox chrome vs desk-shell vs desk-glass
7. French copy: `t()` vs some hardcoded strings `[LIKELY]` — confirm per screen
