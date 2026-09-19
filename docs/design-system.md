# EvoCRM design system

**Status:** Locked for the P00–P29 product UI rebuild.  
**V-series:** Visual work from V01 onward follows [`docs/visual/EVOCRM-VISUAL-LAW.md`](./visual/EVOCRM-VISUAL-LAW.md). V00 index: [`docs/visual/README.md`](./visual/README.md).  
**Companion:** [`ui-audit.md`](./ui-audit.md) (P-series inventory), [`ui-migration-plan.md`](./ui-migration-plan.md) (P-series how).  
**Rule:** one design system. No per-object visual forks. No HubSpot teal. No Salesforce blue.

## Preserve forever

Backend stays: business logic, routes, APIs, auth, permissions, integrations, DB, CRM workflows, functionality. This file specifies **frontend visual language and shared components only**.

## Design read

Reading this as: a **desktop CRM operators live in all day**, with **Apple restraint** (quiet surfaces, one accent, no decoration), **HubSpot list usability** (saved views, filter chips, bulk bar, advanced drawer), **Salesforce workflow depth** (grouped rail, record inspector, path, command), and **EvoCRM identity** (orange mark `#E8530E`, Geist/Inter, warm paper).

Dials for *product* UI (not marketing):

| Dial | Value | Meaning |
|---|---|---|
| Variance | 3 | Precision. Same grammar on every object. |
| Motion | 3 | Open/close, selection, board drag. Honor `prefers-reduced-motion`. |
| Density | 8 | Cockpit. 36px controls, 48px rows, 32px page pad-x. |

References for **density and IA only** (do not clone branding or copy):

- HubSpot contacts list: [saved views + chips](https://mobbin.com/screens/2c2951a8-ec56-41c0-a3e0-990330bdc5f4), [bulk bar](https://mobbin.com/screens/fedf5525-727c-4f83-92d8-9ebc647363d4), [advanced filters](https://mobbin.com/screens/edbed4a5-0814-4c04-bf4e-c55dc948a900)
- Salesforce record: [icon rail + path + 3 columns + search](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6)

Marketing / public pages (`pages/public/*`, future landing) may use a different orange. **Authenticated product** uses `#E8530E` as specified below.

---

## 1. Tokens (user-locked)

Map these onto CSS variables in P02. Do not invent extra brand hues.

### Color

| Token | Hex | CSS variable (target) | Use |
|---|---|---|---|
| Accent | `#E8530E` | `--color-accent` | Primary CTA, active/focus/selected, key highlights, chart series 1. **Not** page wash, **not** every link, **not** every pill. |
| Accent hover | `#D74908` | `--color-accent-hover` | Derived; keep ~8% darker. |
| Accent pressed | `#B8410B` | `--color-accent-pressed` | |
| Accent wash | `#FFF1EA` | `--color-accent-wash` | Selected row, active nav, focus fill. |
| Background | `#F7F7F5` | `--color-bg` | App canvas |
| Surface | `#FFFFFF` | `--color-surface` | Cards, tables, drawers, popovers |
| Subtle | `#F1F1EF` | `--color-subtle` | Table header, zebra optional, filter band, skeleton |
| Text | `#161616` | `--color-text` | Titles, body, primary labels |
| Secondary | `#666666` | `--color-text-secondary` | Descriptions, unread-but-useful |
| Muted | `#929292` | `--color-text-muted` | Metadata, placeholders, table headers |
| Border | `#E3E3DF` | `--color-border` | Hairlines, input border, row rules |

Destructive stays a **semantic red** (existing `--destructive` / `--color-danger`), never orange. Online/presence may stay green `#22C55E` for status only.

Dark cabinet is **out of scope for P02–P15** unless a later brief reopens it. `use-appearance.tsx` currently forces Light Cabinet; keep that until a dedicated dark pass.

### Token mapping (P02 lock)

Stable names → hex / CSS variables / Tailwind. P03 primitives should consume these names; do not introduce another palette.

| Stable name | Hex | CSS variable | Legacy alias | Tailwind |
|---|---|---|---|---|
| Background / canvas | `#F7F7F5` | `--color-bg` | `--evosales-canvas`, `--evosales-canvas-soft`, `--background` | `bg-canvas`, `bg-canvas-soft`, `bg-background` |
| Surface | `#FFFFFF` | `--color-surface` | `--card`, `--popover` | `bg-surface`, `bg-card` |
| Subtle surface | `#F1F1EF` | `--color-subtle` | `--secondary`, `--muted`, `--accent` (shadcn hover) | `bg-subtle`, `bg-secondary`, `bg-muted`, `bg-accent` |
| Primary text | `#161616` | `--color-text` | `--evosales-ink`, `--foreground` | `text-ink`, `text-foreground` |
| Secondary text | `#666666` | `--color-text-secondary` | `--evosales-mute` | `text-mute` |
| Muted text | `#929292` | `--color-text-muted` | `--muted-foreground` | `text-muted-foreground` |
| Border default | `#E3E3DF` | `--color-border` | `--evosales-hairline`, `--border`, `--input` | `border-hairline`, `border-border` |
| Border strong | `#D6D6D1` | `--color-border-strong` | `--aurora-border-strong` | `border-border-strong` |
| Accent | `#E8530E` | `--color-accent` | `--evosales-mark`, `--primary` | `bg-brand`, `bg-primary`, `text-brand` |
| Accent hover | `#D74908` | `--color-accent-hover` | `--evosales-mark-hover` | `bg-brand-hover` |
| Accent pressed | `#B8410B` | `--color-accent-pressed` | `--evosales-mark-pressed` | — |
| Accent soft / wash | `#FFF1EA` | `--color-accent-soft`, `--color-accent-wash` | — | `bg-accent-soft` |
| Success | `#24845B` | `--color-success` | — | `text-success`, `bg-success` |
| Warning | `#C77A11` | `--color-warning` | — | `text-warning`, `bg-warning` |
| Danger | `#D92D20` | `--color-danger` | `--destructive` | `text-danger`, `text-destructive` |
| Focus ring | accent | `--color-focus-ring` | `--ring` | `ring-ring`, `ring-focus-ring` |
| Sidebar surface | `#F7F7F5` | `--color-sidebar` | `--sidebar` (literal in Aurora bridge) | `bg-sidebar` |
| Sidebar text | `#161616` | `--color-sidebar-text` | `--sidebar-ink`, `--sidebar-foreground` | `text-sidebar-ink` |
| Sidebar mute | `#666666` | `--color-sidebar-text-mute` | `--sidebar-mute` | `text-sidebar-mute` |
| Sidebar hover | text 6% on paper | `--color-sidebar-hover` | `--sidebar-hover` | `bg-sidebar-hover` |
| Sidebar active | accent soft | `--color-sidebar-active` | `--sidebar-accent` | `bg-sidebar-accent` |
| Sidebar well | `#FFFFFF` | `--color-sidebar-well` | `--sidebar-well` | `bg-sidebar-well` |
| Sidebar border | `#E3E3DF` | `--color-sidebar-border` | `--sidebar-border` | `border-sidebar-border` |

**Collision note:** `--color-accent` in `:root` is brand orange. Tailwind `bg-accent` maps to shadcn `--accent` (`--color-subtle`) via `@theme inline` so hover surfaces stay paper, not orange. Use `bg-brand` / `bg-primary` / `var(--color-accent)` for the product accent.

**Source of truth:** `resources/css/app.css`. Aurora (`aurora-evotechly-bridge.css`) and shadcn New York alias the same variables — no third theme file.

### Typography

Family: **Inter or Geist**. This repo already ships Geist Sans (`@fontsource/geist-sans` + Bunny). **Keep Geist** unless Inter is added as the only product face. Do not mix Geist + Inter on product screens.

| Role | Size / line / weight | CSS |
|---|---|---|
| Page | 28 / 34 / 650 | `--text-page` |
| Section | 18 / 26 / 600 | `--text-section` |
| Card | 15 / 22 / 600 | `--text-card` |
| Body | 14 / 20 / 400 | `--text-body` |
| Labels / table | 13 / 18 / 500 | `--text-label` |
| Metadata | 12 / 16 / 400 | `--text-meta` |

Replace today's `--text-page-title` (22px) and the `text-[15px]` override on `CrmObjectHeader`. One role, one size.

### Spacing

Scale (px): **4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64**.

No `13px`, `2.5` as a layout gap unless it is 8+2 from the scale (icon optical). Page content **pad-x 32** (`px-8`) on desktop; 16 on viewports `<768`.

### Control metrics

| Measure | Value |
|---|---|
| Control height | **36px** (Button, Input, Select, Tabs trigger) |
| Table row | **48px** |
| Table header | 40px, muted 13px |
| Page pad-x | **32px** |
| Sidebar collapsed | **64px** |
| Sidebar expanded | **240px** |
| Topbar | 56px (search + actions fit without wrapping) |
| Settings form measure | **max ~900px** |
| Drawer width | 480px default record / create; 560px advanced filters |
| Radius | 8px controls and cards; 6px chips; no pills except search field and avatars |

### Accent discipline

Use `#E8530E` for **at most one** of: the page's primary CTA, the selected nav item, the focus ring, a selected table row wash, or the primary chart series.

Do **not** use accent for: every saved-view pill, every tab, every table link, every secondary button, page backgrounds, or "orange wash" cards.

---

## 2. Shell

### Sidebar

`AppShell` owns the rail. Collapse state persists (cookie already exists as `sidebar_state` in `ui/sidebar.tsx`).

```
64 collapsed                          240 expanded
┌────┐                                ┌──────────────┐
│ ◆  │                                │ EvoCRM       │
│    │                                │              │
│ ⌂  │ Home                           │ Home         │
│    │ CRM                            │ CRM          │
│ 👤 │  Contacts                      │  Contacts    │
│ 🏢 │  Companies                     │  Companies   │
│ 🤝 │  Deals                         │  Deals       │
│ ▦  │  Pipeline                      │  Pipeline    │
│    │ Communication                  │ Communication│
│ 📥 │  Inbox                         │  Inbox       │
│ ✓  │  Activities                    │  Activities  │
│    │ Sales                          │ Sales        │
│ 📄 │  Quotes                        │  Quotes      │
│ ⚡  │ Automation                     │ Automation   │
│ …  │ More                           │ More         │
│    │                                │              │
│ ⚙  │ Settings (bottom)              │ Settings     │
└────┘                                └──────────────┘
```

**Groups (lock):**

| Group | Leaves | href |
|---|---|---|
| (none) | Home | `/dashboard` |
| CRM | Contacts, Companies, Deals, Pipeline | `/crm/contacts`, `/crm/companies`, `/crm/deals`, `/crm/deals/board` |
| Communication | Inbox, Activities | `/inbox`, `/crm/activities` |
| Sales | Quotes | `/crm/quotes` |
| Automation | Workflows | `/crm/workflows` (keep `/automation` alias) |
| More | Leads, Tickets, Segments, Ads, Reports, Outbound, … | existing URLs |
| (footer) | Settings | `/settings` |

Simple mode still swaps the leaf list from the server (`useSimpleMode`). Groups hide when they have no visible leaves.

Collapsed: icons + tooltips (today's Phosphor treatment, 64px hit area). Expanded: 13px labels, 36px rows, accent wash on active. **Do not keep the Wave 0 black-only 56px rail.** Sidebar surface is `--color-bg` or a 2% darker paper, text `--color-text`, not a second black product.

### Topbar

Left to right:

1. Sidebar toggle (and mark when rail is collapsed)
2. Search field, placeholder **`Search EvoCRM…`**, readOnly click → command palette, **Cmd/Ctrl+K** affordance
3. **AI** (opens Ask Evo / command Ask section; do not invent a second AI product)
4. **Create** (Contact, Company, Deal, Quote)
5. **Notifications**
6. **Profile**

Remove the extra Help/Tasks-as-peer-to-search clutter from the default desktop row, or fold Tasks into Notifications / command. Do not ship two bells.

### Command palette

`CommandPalette` is a first-class DS component (P14). Sections: Navigate · Records (`evoSearchIndex`) · Create · Ask Evo (if capability). Same 36px rows, 13px labels. One icon family.

---

## 3. Shared component inventory

Every product screen composes from this list. If a screen needs something else, add it here first.

### Foundations

`Button`, `Input`, `Select`, `Tabs`, `Badge`, `Avatar`, `Checkbox`, `Dropdown`, `Tooltip`, `Modal`, `Drawer`, `Toast`, `Skeleton`, `EmptyState`.

API sketches (props only; implement in P03):

```ts
type ButtonProps = {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md'; // md = 36px. No third size in product.
};

type InputProps = {
  label?: string;
  hint?: string;
  error?: string;
  // label above, error below. Never placeholder-as-label.
};
```

Primary button: `#E8530E` fill, white label. Secondary: surface + border. Ghost: no fill. Danger: destructive.

### Chrome

`AppShell`, `Sidebar`, `Topbar`, `CommandPalette`, `PageHeader`.

```ts
type PageHeaderProps = {
  title: string;            // 28/34/650
  description?: string;     // 14/20 secondary
  primaryAction?: ReactNode; // one primary only
  secondaryActions?: ReactNode;
};
```

`CrmObjectHeader` and `page-header.tsx` converge on `PageHeader`.

### Data workspace (mandatory for objects)

Contacts, Companies, Deals (list **and** board), Quotes share **one** `DataWorkspace`. Not a fork per object.

```ts
type DataWorkspaceObject = 'contact' | 'company' | 'deal' | 'quote';

type DataWorkspaceProps<Row> = {
  object: DataWorkspaceObject;
  title: string;
  description?: string;
  primaryAction: { label: string; onClick: () => void };

  // Saved views
  views: SavedView[];
  activeViewId?: string;
  onViewChange: (id: string | null) => void;
  onViewSave?: (input: { name: string; filters: ListViewFilters; columns: ListViewColumn[] }) => void;

  // Filters
  filters: ListViewFilters | Record<string, unknown>;
  onFiltersChange: (next: ListViewFilters) => void;
  filterFields: ListFieldDef[];
  chips?: Array<{ id: string; label: string; onRemove: () => void }>;

  // Table
  columns: ListViewColumn[];
  columnDefs: ListColumnDef[];
  rows: Row[];
  rowHref: (row: Row) => string;
  onColumnsChange: (columns: ListViewColumn[]) => void;
  sort?: { id: string; dir: 'asc' | 'desc' };

  // Selection / bulk
  selectable?: boolean;
  selectedIds: number[];
  onSelectedIdsChange: (ids: number[]) => void;
  bulk?: ReactNode; // BulkActionBar slot

  // Modes (deals)
  mode?: 'list' | 'board';
  onModeChange?: (mode: 'list' | 'board') => void;
  board?: ReactNode; // Pipeline board when mode === 'board'

  // Empty / loading
  loading?: boolean;
  empty: { title: string; body: string; actionLabel?: string };

  paginator?: { page: number; perPage: number; total: number; lastPage: number };
  extraQuery?: Record<string, string | number | null | undefined>;
  basePath: string;
};
```

`DataWorkspace` layout (desktop):

```
PageHeader
SavedViews          (pills, one accent on active)
FilterBar           (search + 2–4 quick filters + "Advanced")
AdvancedFilterDrawer (Sheet, not inline)
BulkActionBar       (only when selectedIds.length > 0)
DataTable | Board
footer / pagination
```

This is the HubSpot contacts grammar ([list](https://mobbin.com/screens/2c2951a8-ec56-41c0-a3e0-990330bdc5f4) + [filters drawer](https://mobbin.com/screens/edbed4a5-0814-4c04-bf4e-c55dc948a900)) with EvoCRM tokens.

Leads / Tickets / Activities / Segments may adopt `DataWorkspace` later. They are not blockers for P05–P08. Do not invent a second list shell for them in the meantime.

### DataTable

```ts
type DataTableProps<Row> = {
  columns: Array<{ id: string; label: string; width?: number; render: (row: Row) => ReactNode }>;
  rows: Row[];
  rowHeight?: 48;
  selectedIds?: number[];
  onToggle?: (id: number) => void;
  onRowClick?: (row: Row) => void;
};
```

Reuse `list-view-table.tsx` renderers. Replace markup/spacing only.

### BulkActionBar

```ts
type BulkActionBarProps = {
  object: 'contact' | 'company' | 'deal' | 'quote';
  selectedIds: number[];
  actions: Array<'assign_owner' | 'enroll_sequence' | 'move_stage' | 'delete' | 'export'>;
  members?: Array<{ id: number; name: string }>;
  onClear: () => void;
};
```

Today only contact + deal post to bulk endpoints. Company/quote can show selection + assign/delete when the API exists; do not fake endpoints.

Sticky under the filter bar, surface + border, 36px controls. HubSpot pattern: [bulk bar](https://mobbin.com/screens/fedf5525-727c-4f83-92d8-9ebc647363d4).

### RecordDrawer

New. Does not delete `/crm/{object}/{id}` show routes.

```ts
type RecordDrawerProps = {
  object: DataWorkspaceObject | 'lead' | 'ticket';
  recordId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // identity, properties, activity, associations as slots so
  // existing record-hub panels can mount without a new API.
};
```

Desktop: 480–560px right drawer over the workspace (Salesforce inspector depth without Lightning chrome). "Open full record" links to the existing show page.

### Deals Board + List

Same `DataWorkspace` with `mode`. Board columns **must** remain:

`New → Qualified → Demo → Proposal → Won → Lost`

as defined in `config/evosales.php`. Forecast strip stays (`DealForecastBar` data). Cards: title, amount (DZD tabular), company, owner, close date. Accent only on first-column hover / drag preview, not on every stage header.

### Home dashboard

`PageHeader` + KPI strip (28px numbers) + Needs attention (first) + pipeline + activity. Widgets use `Surface` + border, not orange cards. Charts: series 1 = `#E8530E`, grid = `#E3E3DF`. Keep `HomeDashboardBuilder` props.

### Inbox (4-pane)

```
Folders (200) | Threads (320) | Conversation (flex) | Contact (240)
```

Reuse `inbox-chrome.tsx` folder model and `AdaptiveWorkspaceShell` for `<lg` (tabs). Native CRM inbox is the product IA. Desk iframe is a fallback, not the layout.

### Settings

Nav groups: **Personal / Workspace / CRM / Channels / Integrations / Billing**.

Map current leaves (do not invent URLs):

| Target group | Current leaves |
|---|---|
| Personal | Profile, Security, Appearance |
| Workspace | Workspace, People, Meetings, Get started |
| CRM | Attributes, Pipelines, Qualify, Quotas, Record layouts, Playbooks |
| Channels | Channels, SMS, WhatsApp/Evolution |
| Integrations | Apps, Connectors, Meta |
| Billing | Placeholder leaf only if a route exists; otherwise omit the group until billing ships |
| Admin (keep under Workspace or a locked Admin subnav) | Permissions, Audit, System health |

Form column `max-w-[900px]`. `settings/chrome.tsx` restyles to tokens; keep permission filters.

---

## 4. Target folder architecture

After P03–P05, new work lives here. Old files become adapters until P16.

```
resources/js/
  ds/                          # the one design system
    tokens.css                 # or remain in resources/css/app.css
    components/
      Button.tsx
      Input.tsx
      Select.tsx
      Tabs.tsx
      Badge.tsx
      Avatar.tsx
      Checkbox.tsx
      Dropdown.tsx
      Tooltip.tsx
      Modal.tsx
      Drawer.tsx
      Toast.tsx
      Skeleton.tsx
      EmptyState.tsx
    chrome/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
      CommandPalette.tsx
      PageHeader.tsx
    workspace/
      DataWorkspace.tsx
      SavedViews.tsx
      FilterBar.tsx
      AdvancedFilterDrawer.tsx
      DataTable.tsx
      BulkActionBar.tsx
      RecordDrawer.tsx
  pages/                       # Inertia pages stay; they import from @/ds
  components/crm/              # shrinks to domain widgets (Ask Evo, pipeline cards)
```

Until P16, `components/ui/button.tsx` re-exports `ds/components/Button` so existing imports keep compiling (strangler). Do not add new Aurora variants.

Icon family: **Phosphor** (already on the rail). Remove Lucide from product chrome in P03/P14. `components.json` `iconLibrary` should be updated when the DS owns icons.

### P03 lock — canonical primitives

Implementations live in `resources/js/ds/components/*`. `@/components/ui/*` re-exports them so existing product imports keep working. Aurora is the paint layer, not a second theme.

| Product import (`@/components/ui/…`) | DS module | Implementation | Notes |
|---|---|---|---|
| `button` | `ds/components/Button` | Aurora Button via `shadcn-bridge` | Default = filled accent `#E8530E`, white label, **36px** |
| `input` | `ds/components/Input` | Aurora Input + optional label/hint/error | Label above, error below. `h-9` / 36px |
| `select` | `ds/components/Select` | Aurora Select + optional label/hint/error | Trigger `h-9`. Label above, error below |
| `native-select` | — | Aurora NativeSelect | Same 36px / 8px control |
| `tabs` | `ds/components/Tabs` | Aurora Tabs | Trigger `h-9`. Accent underline on active only |
| `badge` | `ds/components/Badge` | Aurora Badge via `shadcn-bridge` | `default` → accent solid; `secondary`/`outline` stay paper |
| `avatar` | `ds/components/Avatar` | Aurora Avatar adapter | Ink fallback, no accent ring by default |
| `checkbox` | `ds/components/Checkbox` | Aurora Checkbox | Phosphor check / minus |
| `dropdown-menu` | `ds/components/Dropdown` | Aurora dropdown | |
| `tooltip` | `ds/components/Tooltip` | Aurora tooltip | |
| `dialog` | `ds/components/Modal` | Aurora dialog | `Modal*` aliases on the DS export |
| `sheet` + `drawer` | `ds/components/Drawer` | Aurora sheet | Drawer is the same primitive |
| `sonner` + `toast` | `ds/components/Toast` | Sonner | Aurora toast stays unused |
| `skeleton` | `ds/components/Skeleton` | Aurora skeleton | |
| `label` | — | Aurora label | |
| `textarea` | — | Aurora textarea | |
| `switch` | — | Aurora switch | |
| `separator` | — | Aurora separator | |
| `popover` | — | Aurora popover | |
| `field` | — | Aurora Field | `FieldError` for auth forms |
| `callout` | — | Aurora Callout | Canonical status surface; `alert.tsx` is the shadcn adapter |
| `empty-state` | `ds/components/EmptyState` | Aurora EmptyState + product illustration | |

**P04 should import `@/components/ui/*` or `@/ds/components/*` — not `ui/aurora/*`.** Command palette is P14; do not add a third command primitive here.

Aurora-only internals (`prompt-input`, unused `combobox` / `data-table` / `pagination` / `toast`) stay under `ui/aurora/` until P16. Do not import them from product pages.

Control metrics in this phase: height **36px**, radius **8px** (`--aurora-radius-1`), focus ring `--color-focus-ring` (accent). Sidebar width stays 56px until P04.

---

## 5. Do / Don't

### Do

- One primary per page
- Hairline `#E3E3DF` for structure; space for hierarchy
- Tabular numbers for money (keep `.money`)
- Africa/Algiers dates (keep `ListViewTable` formatter)
- Keyboard: Tab through controls, `Cmd/Ctrl+K`, Esc closes drawers
- Empty / loading / error on every workspace
- Compose Contacts/Companies/Deals/Quotes from `DataWorkspace`

### Don't

- Orange wash backgrounds or orange-on-orange pills
- Gray overload: no `#eaeaea` on `#eaeaea` on muted borders. Canvas `#F7F7F5`, surface `#FFFFFF`, one border
- Extra card chrome around a table (table **is** the surface)
- Per-object list shells (`CrmShell` tabs + `CrmListShell` + custom header)
- Salesforce blue `#0176D3`, HubSpot teal `#00A4BD`, Aurora navy `#07131c` in product
- Antique `#EC6025` or Wave 0 `#d9500f` after P02
- Inter **and** Geist on the same screen
- Lucide **and** Phosphor on the same screen
- `rounded-full` buttons (search field only)
- Drop shadows on tables or the rail
- Marketing motion (marquees, mesh, glass on scrolling content)
- Big-bang rewrite of `pages/crm/**` in one PR

---

## 6. Relation to older design docs

| Doc | Role after this lock |
|---|---|
| `docs/brandbook/design-tokens.md` | Historical Wave 0 shipped tokens |
| `docs/design-system/PRO-PRODUCT-DIRECTION.md` | Historical direction (black rail, older orange) |
| `docs/visual-system/*` | Responsive / Aurora notes; IA still useful, colors are not |
| **This file** | Product UI source of truth for P02–P16 |
