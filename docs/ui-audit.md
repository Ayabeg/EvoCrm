# EvoCRM UI audit

**Scope:** frontend visual and component system only.  
**Audited tree:** `main` @ `5131471` (after Wave 4 Quotes / Wave 5 Settings).  
**This document does not change production UI.** It is the P01 inventory for the visual rebuild specified in [`design-system.md`](./design-system.md) and sequenced in [`ui-migration-plan.md`](./ui-migration-plan.md).

## Preserve forever

The rebuild is visual and system-level. Do not rewrite, relocate, or thin out:

- Business logic, Laravel controllers, form requests, observers, jobs
- Routes in `routes/web.php`, `routes/settings.php`, `routes/api.php`
- Auth (Fortify, Socialite Google / Meta / Instagram), permissions, `EnforceProductPermissions`, `EnforceSimpleMode`
- Integrations (WhatsApp Cloud / Evolution, Meta, SMS, mailboxes, ads)
- Database schema, seeders, CRM workflows, Lead OS, quotes accept, desk connectors
- Inertia page contracts (prop shapes such as `listView`, `savedFilters`, `activeFilters`, `HomeDashboardBuilder` KPIs)

Operators keep the same URLs and the same work. Screens change how they look and how they share chrome, not what they do.

---

## 1. Stack (as shipped)

| Layer | What this repo actually uses | Paths |
|---|---|---|
| App shell | Laravel 13 + PHP 8.3, Inertia Laravel 3 | `composer.json`, `resources/views/app.blade.php` |
| Frontend | React 19 + Inertia React 3, Vite 8 | `package.json`, `vite.config.ts`, `resources/js/app.tsx` |
| Routing (FE) | Wayfinder typed routes + Inertia page names | `vite.config.ts` `wayfinder()`, `resources/js/app.tsx` `layout:` switch |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), no `tailwind.config.js` | `resources/css/app.css` |
| Design tokens | CSS variables on `:root` / `.dark` + `@theme` aliases | `resources/css/app.css` |
| Component libs | **Two stacks:** shadcn/ui New York (`components.json`) **and** Aurora registry (`@aurora` → `https://aurora.tootie.tv/r/{name}.json`) | `resources/js/components/ui/*`, `resources/js/components/ui/aurora/*` |
| Bridge | shadcn `Button` / tokens remap onto Aurora primitives | `resources/js/lib/aurora/shadcn-bridge.ts`, `resources/css/aurora-evotechly-bridge.css` |
| Icons | **Two families:** Phosphor on product chrome, Lucide still in command palette + leftover starter-kit + `components.json` `"iconLibrary": "lucide"` | `@phosphor-icons/react`, `lucide-react` |
| Type | Geist Sans via `@fontsource/geist-sans` **and** Vite Bunny `geist` | `app.css` imports, `vite.config.ts` `bunny('Geist')` |
| Toasts | Sonner | `resources/js/components/ui/sonner.tsx`, mounted in `app.tsx` |
| Charts | In-house EvoViz, not Recharts | `resources/js/evoviz/*` |
| Analytics | PostHog JS | `resources/js/lib/posthog.ts` |

Not Vue. Not Next.js (root `next-env.d.ts` is leftover). Not CSS modules. Product pages are Inertia React under `resources/js/pages/**`.

`createInertiaApp` in `resources/js/app.tsx` assigns layouts by page name:

- `auth/*` → `AuthLayout`
- `settings/*` → `[AppLayout, SettingsLayout]`
- `public/*` → `PublicLayout`
- everything else → `AppLayout` → `layouts/app/app-sidebar-layout.tsx`

Progress bar color is hardcoded `#d9500f`.

---

## 2. File map of the current frontend

```
resources/
  css/
    app.css                         # live tokens, type utilities, .app-topbar, .h-app-workspace
    aurora-evotechly-bridge.css     # remaps Aurora → Wave 0 triad
    aurora-motion.css
  js/
    app.tsx
    components/
      app-sidebar.tsx               # product rail (Phosphor)
      app-sidebar-header.tsx        # product topbar
      app-header.tsx                # leftover Laravel starter-kit header (unused by AppLayout)
      app-shell.tsx
      page-header.tsx               # generic header; CRM lists do not use it
      aurora/                       # CommandPalette + PromptInput
      aurora.css / aurora-components.css
      brand/marks.tsx               # third-party brand SVGs (Meta, WhatsApp, Google)
      crm/                          # ~70 CRM-specific files (see below)
      dashboard/                    # Home widgets
      desk/                         # Desk iframe + OfficialConnectPanel
      settings/chrome.tsx           # Wave 5 settings form chrome
      ui/                           # shadcn wrappers
      ui/aurora/                    # Aurora primitives (button, dialog, data-table, …)
    evoviz/
    hooks/                          # use-appearance, use-simple-mode, use-mobile, …
    layouts/
      app-layout.tsx
      app/app-sidebar-layout.tsx    # the live authenticated shell
      app/app-header-layout.tsx     # unused by default AppLayout
      settings/layout.tsx
      auth/
      public-layout.tsx
    lib/
      aurora/shadcn-bridge.ts
      list-view-config.ts           # shared list column + filter types
      list-query helpers live in components/crm/list-query.ts
    pages/
      home.tsx
      auth/
      crm/{contacts,companies,deals,quotes,leads,tickets,activities,segments,workflows,…}
      desk/inbox.tsx
      outbound/
      ads/
      reports/
      settings/
      public/{quote,book,book-done}.tsx
    types/
```

### `components/crm/` (the real product UI)

Shared-ish list chrome:

| File | Role today |
|---|---|
| `crm-list-shell.tsx` | Object header + `ListToolbar` + children. Used by Contacts, Companies, Deals list, Quotes, Tickets. |
| `list-toolbar.tsx` | Saved views + filters + search + column chooser + (deals) stage pills / pipeline switcher. |
| `list-view-table.tsx` | One table implementation with per-entity cell renderers (`contact` / `company` / `deal` / `ticket` / `quote`). Desktop table, card stack below `@[480px]/list`. |
| `list-query.ts` | Query-string filters, chips, pagination hrefs. |
| `saved-view-tabs.tsx` | Saved view pills. |
| `filter-builder.tsx` | AND/OR groups. Desktop: inline. Mobile: toggle + Sheet. |
| `column-filter-row.tsx` | Simple filter row + advanced builder slot. |
| `column-chooser.tsx` | Visible columns. |
| `bulk-action-bar.tsx` | Contacts + Deals only (`entity: 'contact' \| 'deal'`). Native `<select>`, not DS Select. |
| `create-drawer.tsx` | Right `Sheet` for create. Not a record inspector. |
| `crm-object-header.tsx` | Title + primary CTA. Title is `text-page-title` **and** `text-[15px]`. |
| `crm-shell.tsx` | Extra CRM **tab strip** (Home, Leads, Captures, Contacts, …). Companies and Leads still wrap with this. Contacts/Deals/Quotes do not. |
| `room-shell.tsx` | Room tabs used by `CrmShell`. |
| `desk-shell.tsx`, `outbound-shell.tsx`, `ads-shell.tsx`, `reports-shell.tsx`, `crm-analytics-shell.tsx` | Per-product room chrome forks. |

Records (full page, not a drawer):

`record-hub.tsx`, `record-chrome.tsx`, `record-workspace.tsx`, `record-properties.tsx`, `record-activity-panel.tsx`, `ask-evo-panel.tsx`, `playbook-card.tsx`, `associations-card.tsx`, `create-drawer.tsx`.

Pipeline:

`pipeline-kanban.tsx`, `deal-forecast-bar.tsx`, `deal-layout-toggle.tsx`, `pipeline-switcher.tsx`, `board-options-sheet.tsx`, `stage-pills.tsx`.

Inbox:

`inbox-chrome.tsx` (folder rail, contact facts, embed skeleton), `adaptive-workspace-shell.tsx` (3 panels + mobile tab switcher), `desk-thread-card.tsx`.

### Pages that implement object lists

| Object | Page | Uses `CrmListShell`? | Notes |
|---|---|---|---|
| Contacts | `pages/crm/contacts/index.tsx` | Yes | Also `BulkActionBar`, `CreateDrawer`, duplicates/import links. |
| Companies | `pages/crm/companies/index.tsx` | Yes | **Also wrapped in `CrmShell`** (double chrome: room tabs + object header). |
| Deals list | `pages/crm/deals/index.tsx` | Yes | Layout toggle + `PipelineSwitcher` + stage pills + bulk. |
| Deals board | `pages/crm/deals/board.tsx` | No | Own header + `PipelineKanban`. Same object, different shell. |
| Quotes | `pages/crm/quotes/index.tsx` | Yes | Wave 4. Hardcoded mark orange on primary CTA. |
| Tickets | `pages/crm/tickets/index.tsx` | Yes | Plus `tickets/board.tsx` fork. |
| Leads | `pages/crm/leads/index.tsx` | **No** | Raw `<table>`, `CrmShell` + `CrmObjectHeader` only. No saved views, no `ListViewTable`. |
| Activities | `pages/crm/activities/index.tsx` | **No** | Custom `CrmListHeader` + card/list markup. |
| Segments / workflows | `pages/crm/segments/*`, `workflows/index.tsx` | No | Own layouts. |

There is **no** `DataWorkspace` component. The closest shared unit is `CrmListShell`, and even that is not used by Leads, Activities, the deals board, or Home.

---

## 3. Tokens as shipped (not the target)

Live values from `resources/css/app.css` (also documented in `docs/brandbook/design-tokens.md`):

| Role | Variable | Hex now |
|---|---|---|
| Page wash | `--evosales-canvas` / `--evosales-canvas-soft` | `#eaeaea` |
| Card | `--card` | `#ffffff` |
| Ink | `--evosales-ink` | `#000000` |
| Mute | `--evosales-mute` | `#525252` |
| Hairline | `--evosales-hairline` | `#d4d4d4` |
| Mark | `--evosales-mark` | `#d9500f` |
| Mark hover / pressed | `--evosales-mark-hover` / `--pressed` | `#bf460d` / `#a93e0c` |
| Primary (filled CTA) | `--primary` | mark (`#d9500f`) |
| Sidebar | `--sidebar` | `#000000` |
| Sidebar active | `--sidebar-accent` | `rgba(217, 80, 15, 0.22)` |

Shipped type utilities (`@theme` in `app.css`):

| Token | Size | Used as |
|---|---|---|
| `--text-page-title` | 22px / 1.375rem | `.text-page-title` |
| `--text-record-title` | 20px | record name |
| `--text-ui` | 13px | tables, desk |
| `--text-ui-relaxed` | 14px | secondary panels |
| `--text-section-label` | 11px uppercase | section labels |
| `--text-micro` | 10px | badges |
| `--text-kpi` | 28px | home tiles |

Target tokens in [`design-system.md`](./design-system.md) are **different**: accent `#E8530E`, page `#F7F7F5`, text `#161616`, page title 28/34/650, control height 36, table row 48, page pad-x 32. Wave 0 tests currently **forbid** drifting off `#eaeaea` / `#d9500f`. P02 must update those tests in the same change that retokens.

Older brand docs still mention `#EC6025` (antique orange) and `#d9500f`. Product marketing landings (if reintroduced) may keep a different orange. **Authenticated product UI** uses the locked `#E8530E` after P02.

---

## 4. Hardcoded colors, duplicated CSS, inline styles

### Hardcoded Wave 0 hex (should be tokens)

Counted occurrences of `#d9500f` / `#eaeaea` in `resources/js` (plus `app.tsx` progress bar): settings layout, settings chrome, apps/connectors/meetings/channels/profile, quotes list/show, public quote, create-drawer / record-hub accent bars, empty-illustration, evoviz comments.

Examples:

- `layouts/settings/layout.tsx`: `bg-[#eaeaea]`, active `border-[#d9500f] bg-[rgba(217,80,15,0.1)]`
- `components/settings/chrome.tsx`: `bg-[#d9500f]`, required asterisk `text-[#d9500f]`
- `pages/crm/quotes/index.tsx`: `primaryClassName="bg-[var(--evosales-mark,#d9500f)] …"`
- `app.tsx`: `progress: { color: '#d9500f' }`
- `pages/auth/auth-screen.tsx`: `background: '#ffffff'` inline style

### Inline `style={{…}}`

Present in CRM chrome (`app-sidebar.tsx` More panel, `record-hub.tsx`, `pipeline-kanban.tsx`, `hairline-table.tsx`, `board-options-sheet.tsx`) and heavily inside `components/ui/aurora/*` (Aurora primitives use inline CSS variables). Product pages should not add more inline color.

### Aurora leftover palette

`resources/js/components/aurora.css` still defines Aurora navy/teal (`#07131c`, accent blues). The Evotechly bridge remaps some of this, but Aurora button variants (`aurora-btn--aurora`, rose, success) and color-picker rainbows in `aurora-components.css` are a second visual language sitting under the CRM.

### Duplicated components

| Concern | Copies |
|---|---|
| Button | `ui/button.tsx` (shadcn API) → `ui/aurora/button.tsx` |
| Input / Select / Tabs / Dialog / Sheet / Badge / Avatar / Checkbox / Tooltip / EmptyState | same dual folders |
| Data table | Aurora `ui/aurora/data-table.tsx` **unused** by CRM lists; CRM uses `list-view-table.tsx` |
| Empty state | `ui/empty-state.tsx`, `ui/aurora/empty-state.tsx`, `crm/empty-room.tsx` (`CrmEmptyState`, `SkeletonList`) |
| Page header | `page-header.tsx` vs `crm-object-header.tsx` vs `dashboard/dashboard-header.tsx` vs `CrmListHeader` in `list-chrome.tsx` |
| Shell | `AppShell` + `CrmShell` + `RoomShell` + `DeskShell` + `OutboundShell` + `AdsShell` + `ReportsShell` + `AdaptiveWorkspaceShell` |
| Command palette | `components/crm/command-palette.tsx` wraps `components/aurora/command-palette.tsx` |
| Icons | Phosphor rail/topbar vs Lucide command items vs Lucide leftover `app-header.tsx` |

---

## 5. Spacing and typography inconsistency

- **No single spacing scale in use.** Tailwind defaults mix with `px-4` / `sm:px-6` list padding (16/24), target pad-x is **32**. Home widgets, settings (`px-4 lg:px-6`), and inbox (`px-3`) each pick their own.
- **Type tokens exist but are overridden.** `CrmObjectHeader` sets `text-page-title text-[15px]` (token 22px, then 15px wins). Lists, desk, settings, and home use raw `text-[10px]`–`text-[15px]` in dozens of files (home.tsx alone has ~29 arbitrary text sizes).
- **Control height:** primary list CTA is `h-8` (32px). Native filter/bulk `<select>` is `h-8`. Target control height is **36**. Topbar is 44/52 via `--app-chrome-height`, not 36.
- **Table rows:** `ListViewTable` header/body cells are `py-1.5` (tight). No `h-12` / 48px row. Target is **48**.
- **Radius:** `--radius: 0.5rem`. Rail items `border-radius: 6px`. Search input is `rounded-full`. Quotes/settings Wave pages mix `rounded-[4px]` with `rounded-md`.

---

## 6. Surface-by-surface

### 6.1 Navigation / AppShell

Live rail: `components/app-sidebar.tsx`.

Desktop width is locked at **56px** (`3.5rem`) in `components/ui/sidebar.tsx` (`SIDEBAR_WIDTH` = `SIDEBAR_WIDTH_ICON`). Comment: "Wave 0: Salesforce-density ink icon rail. Desktop is always 56px." There is **no expanded 240px labeled desktop rail**. Mobile Sheet is 240px and labeled.

`PRIMARY` order (not grouped):

1. Home → `/dashboard`
2. Contacts → `/crm/contacts`
3. Companies → `/crm/companies`
4. Deals → `/crm/deals`
5. Inbox → `/inbox` (also active on `/desk`, `/conversations`)
6. Quotes → `/crm/quotes`

`MORE_ITEMS`: Leads, Tickets, Segments, Automation, Ads, Reports.  
Settings is a footer `RailLink` to `/settings`.

Missing vs target IA:

- No **CRM** group, no **Pipeline** leaf (`/crm/deals/board` is only in command palette + `CrmShell` tabs)
- No **Communication** group; Activities (`/crm/activities`) is not on the rail
- No **Sales** group (Quotes is a primary leaf today)
- No **Automation** on the primary rail (More only)
- Simple mode replaces `PRIMARY` with server `nav` from `useSimpleMode()` (`hooks/use-simple-mode.ts`)

`CrmShell` adds a **second** object tab bar on some pages (Companies, Leads, Activities). That duplicates the rail and is the main chrome-stack problem called out in older audits.

### 6.2 Topbar

`components/app-sidebar-header.tsx`:

- Mark + (sr-only) wordmark on `md+`
- Search placeholder **"Find a record or page"** (target: **"Search EvoCRM…"**)
- ⌘K hint from `sm`
- Help (ghost, `lg+`), Tasks overlay with count, **Create** filled icon, Notifications, Profile
- **No AI control** in the topbar (Ask Evo lives on record pages)
- Create menu: Contact / Company / Deal only (no Quote)

`useCommandPaletteShortcut` opens the palette. Palette does navigate + `evoSearchIndex` record hits (`components/crm/command-palette.tsx`). It is **Lucide-iconed** and still lists `/home` while Home is `/dashboard`.

### 6.3 Tables

`ListViewTable` is the production table. Strengths: shared column defs from `lib/list-view-config.ts`, row click → `router.visit`, optional selection, DZD money, Africa/Algiers dates, custom attributes.

Gaps vs target `DataTable`:

- Row height ~32px (`py-1.5`), not 48
- Header labels 11px uppercase-ish mute, not 13
- Contacts/Deals force `bg-white`; companies/quotes/tickets stay `bg-canvas` (`#eaeaea`)
- Checkbox is a raw `<input>`, not DS `Checkbox`
- No freeze column, no inline edit (except record pages)
- Below 480px container: card stack, not a horizontally scrollable dense table

Aurora `DataTable` exists but is not wired to CRM lists.

### 6.4 Filters

`ListToolbar` + `ColumnFilterRow` + `FilterBuilder` + `SavedViewTabs` + `CrmActiveFilters`.

- Saved views persist via `/crm/filters` (`SavedFilterController`)
- Advanced builder is **inline on desktop**, Sheet on mobile. Target is a dedicated **AdvancedFilterDrawer**
- Simple filters and advanced share one band (HubSpot separates chip row vs drawer; see Mobbin [HubSpot contacts + All filters](https://mobbin.com/screens/edbed4a5-0814-4c04-bf4e-c55dc948a900))
- Leads/Activities do not use this stack at all

### 6.5 Buttons and forms

- `ui/button.tsx` is a compatibility wrapper: `default` → Aurora filled `aurora` (orange).
- List primaries are `size="sm"` `h-8`. Settings Wave 5 uses `settings/chrome.tsx` filled `#d9500f` buttons.
- Many create forms are **inside `CreateDrawer`** with raw `Input` + `Label` + Inertia `<Form>`.
- Bulk bar and several settings pages use **native `<select>`**, bypassing `ui/select.tsx`.
- Auth forms: `pages/auth/*` + `layouts/auth/*` on paper canvas.

### 6.6 Page shells

Authenticated product: `AppSidebarLayout` → `AppShell variant="sidebar"` → `AppSidebar` + `AppContent` (`aurora-page-shell`) + `AppSidebarHeader`.

Then each room adds its own shell. Contacts are the cleanest (`data-crm="contacts-workspace"` + `CrmListShell` only). Companies still nest `CrmShell`. Home is a widget workspace (`data-home="workspace"`). Settings is a second nav column.

### 6.7 Modals / drawers

| Pattern | Implementation |
|---|---|
| Create record | `CreateDrawer` → shadcn/Aurora `Sheet` right, `sm:max-w-md`, 3px mark stripe |
| Advanced filters (mobile) | `Sheet` in `list-toolbar.tsx` |
| Board options | `board-options-sheet.tsx` |
| Tasks | `tasks-overlay.tsx` |
| Command | Aurora command dialog |
| Record inspect | **None.** Contacts/Companies/Deals/Quotes/Leads open **full Inertia show pages** |
| Lead dialogs | `lead-owner-dialog.tsx`, `lead-edit-dialog.tsx`, `lead-conversion-dialog.tsx` |

Target `RecordDrawer` does not exist. That is new work in P09, not a restyle.

### 6.8 Record pages

`pages/crm/contacts/show.tsx` (same grammar on companies/deals/leads/tickets/quotes show):

- `RecordHub` / `RecordChrome`: identity, facts, actions, timeline, associations, Ask Evo, playbooks, enrichment
- Three-column intent on desktop via `AdaptiveWorkspaceShell` / record frames
- Ask Evo is still a loud card on the record (older audits asked to demote it)

### 6.9 Deals board + list

- List: `/crm/deals` + `CrmListShell` + `DealLayoutToggle`
- Board: `/crm/deals/board` + `PipelineKanban` HTML5 drag, `DealForecastBar`, `PipelineSwitcher`
- Default stages from `config/evosales.php`: **New → Qualified → Demo → Proposal → Won → Lost** (probabilities 10/25/50/75/100/0). Keep these names. Do not rename to HubSpot "Appointment Scheduled".
- Board and list do **not** share `CrmListShell` filters/saved views. Target: both are `DataWorkspace` modes.

### 6.10 Home dashboard

`pages/home.tsx` + `components/dashboard/*` + `HomeDashboardBuilder` (backend).

Shipped widgets: KPI strip, performance chart (EvoViz), pipeline health, needs attention, guided actions, activity feed, quotas, Lead OS graph, recent records. Data is real. Layout is a card grid on `#eaeaea` with white `.home-widget` tiles. Title treatment is room-like, not an operating sentence. Orange is used on multiple equal-weight controls.

### 6.11 Inbox

`pages/desk/inbox.tsx`:

1. If `embedUrl` is set: **EvoDesk iframe** (`DeskEmbedWorkspace`) instead of native panes.
2. Native path: `AdaptiveWorkspaceShell` with **3 named panels** (Folders / Inbox / Conversation) plus `InboxContactSidebar` (15.5rem) inside the conversation column.

That is a **3-pane shell + optional 4th contact facts column**, or a single iframe. Target is an explicit **4-pane** product inbox (folders, thread list, conversation, contact/context) without depending on the Chatwoot frame for IA.

Folders already exist: All, Unassigned, Assigned to me, All open, per-channel, All closed.

### 6.12 Settings

`layouts/settings/layout.tsx` (Wave 5):

Current groups: **You · Workspace · Integrations · CRM · Admin**.  
Target groups: **Personal / Workspace / CRM / Channels / Integrations / Billing**.

Gaps: no Billing group; Channels is a leaf under Integrations (`/settings/channels`); WhatsApp is split across `/settings/evolution`, `/settings/whatsapp`, `/settings/whatsapp-business`. Narrow panes use `lg:max-w-3xl` (768px); target form measure is **~900px**. Wide pages opt out via `wideComponents`. Hardcoded `#eaeaea` / `#d9500f`.

---

## 7. Responsive behavior

Documented in `docs/visual-system/responsive-architecture.md` and still accurate:

- Rail → Sheet below `md` (768), 240px labeled
- Topbar hides Help / Tasks / Notifications on small widths (`max-width: 389px` hides notify)
- Lists: table hidden below `@[480px]/list`, card stack instead
- `AdaptiveWorkspaceShell`: one panel at a time on `<lg` via tabs
- `h-app-workspace` uses `100dvh` minus `--app-chrome-height`
- Settings nav is horizontal scroll on small screens, 15.5rem column on `lg`

Target desktop CRM is **HubSpot/Salesforce density** (see Mobbin). Mobile must keep the Sheet + single-panel workspace. Do not build a separate mobile product.

Mobbin density references (IA only, not branding):

- HubSpot contacts list + saved views + filter chips: [screen](https://mobbin.com/screens/2c2951a8-ec56-41c0-a3e0-990330bdc5f4)
- HubSpot bulk action bar: [screen](https://mobbin.com/screens/fedf5525-727c-4f83-92d8-9ebc647363d4)
- HubSpot advanced filters drawer: [screen](https://mobbin.com/screens/edbed4a5-0814-4c04-bf4e-c55dc948a900)
- Salesforce record (icon rail, path, 3 columns, global search): [screen](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6)

---

## 8. What to reuse vs replace

### Reuse (keep contracts, restyle later)

- `lib/list-view-config.ts` types and column/filter field catalogs
- `components/crm/list-query.ts` URL state
- Saved view CRUD (`/crm/filters`)
- `ListViewTable` cell renderers and entity unions (extract into `DataTable` slots)
- `FilterBuilder` rule model
- `BulkActionBar` POST payloads (`/crm/contacts/bulk`, `/crm/deals/bulk`)
- `CreateDrawer` open/close + Inertia forms
- `PipelineKanban` drag + stage probability (`DealBoardForecast`)
- `AdaptiveWorkspaceShell` panel switching
- Home widget **data** and `data-home="workspace"` sections
- Settings permission gating (`requiredPermissionByHref`, `adminOnlyHrefs`)
- Simple-mode nav injection
- Command palette `NAV_ITEMS` + `evoSearchIndex`
- Phosphor marks on the rail (one icon family going forward)
- EvoViz contract (recolor series to `#E8530E` in P02/P10)

### Replace or collapse (visual/system)

- Wave 0 token values and black 56px-only rail
- Dual Aurora/shadcn skins → **one** design system
- `CrmShell` tab strip on list pages (rail owns IA)
- Per-room shells that only change padding/title
- Leads raw table; Activities custom list
- Hardcoded `#d9500f` / `#eaeaea`
- Native `<select>` in bulk/settings where DS `Select` exists
- Leftover `app-header.tsx` starter-kit (Laravel docs links)
- Lucide inside the product command palette (or drop Phosphor; pick one)
- Aurora teal/navy in `aurora.css` once primitives are retokened
- Full-page-only records (add `RecordDrawer` without deleting show routes)

### Do not replace

- Controllers, models, policies, jobs, webhooks
- `/crm/*`, `/inbox`, `/settings/*`, `/outbound/*`, `/ads/*` URLs
- Quote public accept `/q/{token}`
- Official WhatsApp Cloud / "No Baileys" rules
- Capability checks (`auth.capabilities`)

---

## 9. Risks if parallel FE wave PRs are mid-flight

Waves already on `main` (do not revert their **behavior**; restyle in P06+):

| Wave | Tests that lock chrome | What they assert |
|---|---|---|
| Wave 0 | `tests/Feature/Wave0ShellChromeTest.php`, `AuroraTokenBridgeTest.php` | `#eaeaea`, `#000000`, `#d9500f`, `--primary: mark`, 56px rail, placeholder `Find a record or page`, Phosphor-only rail, Home `data-home="workspace"` |
| Wave 1 | `tests/Feature/EvoCrmWave1ContactsChromeTest.php` | Contacts `CrmListShell` / HubSpot-dense workspace |
| Wave 2 | `tests/Feature/EvoCrmWave2DealsChromeTest.php` | Deals list chrome |
| Wave 4 | `tests/Feature/EvoCrmWave4QuotesChromeTest.php` | Quotes list/record on Wave 1 list props + public accept |
| Wave 5 | `tests/Feature/EvoCrmWave5SettingsChromeTest.php` | Settings workspace on Wave 0 triad |

If another agent is mid-wave (Inbox, Dashboard, Record, Tokens):

1. **Do not restyle those files in this docs PR.** This PR is documentation only.
2. **P02 (tokens) will fail Wave 0/4/5 string tests** until those tests are updated to the new hex and type scale. Budget test rewrites into P02, not into a silent drive-by.
3. **P04 (AppShell)** conflicts with anyone editing `app-sidebar.tsx`, `app-sidebar-header.tsx`, `ui/sidebar.tsx`.
4. **P05 (DataWorkspace)** conflicts with Contacts/Companies/Deals/Quotes list pages and `crm-list-shell.tsx`.
5. Quotes (`#192`) and Settings (`#193`) just landed. Treat those pages as "behavior frozen, chrome owned by later P12/P13".
6. Older direction docs (`docs/design-system/PRO-PRODUCT-DIRECTION.md`, `docs/brandbook/design-tokens.md`, `docs/visual-system/*`) describe the **shipped** Wave 0 system. This audit + `design-system.md` is the **next** lock. Do not implement both.

---

## 10. Existing docs this audit supersedes for *next* UI work

Keep them as history; do not implement from them when they disagree with `design-system.md`:

- `docs/brandbook/design-tokens.md` (shipped `#eaeaea` / `#d9500f`)
- `docs/design-system/PRO-PRODUCT-DIRECTION.md` (black rail, `#EC6025` era)
- `docs/crm-redesign-plan.md`, `docs/EVOSALES_FULL_FRONTEND_PLAN.md`
- `tasks/pro-product-ui.md` (blocked on the old direction doc)

Canonical next-step docs: this file, [`design-system.md`](./design-system.md), [`ui-migration-plan.md`](./ui-migration-plan.md).
