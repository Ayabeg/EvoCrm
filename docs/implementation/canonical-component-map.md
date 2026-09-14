# Canonical component map

Ownership boundaries for the UX program. **No god components.** DataWorkspace orchestrates lists; domain owns columns, cells, filters, bulk, create, and board flags.

Tokens / type / density: `docs/design-system.md`.  
Behavioral refs: `docs/research/*.md` + `docs/evocrm-mobbin-contract.md` (pattern only).

---

## 1. Folder ownership

```
resources/js/ds/
  components/     # primitives (Button, Drawer, …)
  chrome/         # App-level chrome that is not a page
  workspace/      # DataWorkspace suite + future QuickRecordDrawer

resources/js/components/crm/
                  # Domain widgets only after migration
                  # (kanban cards, Ask Evo, composers, lead path, …)

resources/js/pages/
                  # Inertia pages: compose, do not restyle primitives
```

New product work imports `@/ds/*` or the `@/components/ui/*` re-export. Do not add Aurora variants. Do not add a third button.

---

## 2. Chrome contracts

### AppShell

- **Owner:** `components/app-shell.tsx` + `layouts/app/app-sidebar-layout.tsx`
- **Owns:** sidebar provider, content column, no page IA
- **Must not own:** object lists, settings nav, inbox panes

### Sidebar

- **Owner:** `components/app-sidebar.tsx`
- **Owns:** groups, More, Settings footer, collapse cookie, simple-mode leaf swap
- **Must not own:** command palette, create forms

### Topbar

- **Owner:** `components/app-sidebar-header.tsx`
- **Owns:** search affordance, global Create, Tasks overlay entry, profile, Ask Evo *entry* (same palette)
- **Must not own:** record search implementation (delegates to Command)

### CommandPalette

- **Owner:** `components/crm/command-palette.tsx` (config) + one presentation primitive
- **Owns:** sections Navigate · Records · Create · Ask Evo (capability)
- **Must not own:** record editing, workflow execution
- **Home href:** `/dashboard` (P02; not `/home`)

### PageHeader

- **Owner:** `ds/chrome/PageHeader.tsx`
- **Owns:** title 28/34/650, one primary, optional secondary
- **Must not own:** saved views, filters

---

## 3. DataWorkspace suite

### DataWorkspace

- **Owner:** `ds/workspace/DataWorkspace.tsx`
- **Owns:** orchestration — header, SavedViews, FilterBar, AdvancedFilterDrawer, **shared selection + bulk-active state**, bulk slot, list|board switch, empty/loading, pagination **when it owns rows**
- **Must not own:** cell renderers, bulk POST shapes, create forms, kanban cards, Ask Evo
- **Result modes (P03A):** `resultMode: 'shared-table'` owns `rows` + shared table chrome. `resultMode: 'domain'` takes `renderResults` and forbids `rows` / `children`. `CrmListShell` is domain mode until P04–P08 migrate objects.
- **Selection (P03B):** chrome `selection` contract (`RowId = string | number`). Domain consumes `renderResults({ columns, selection })`. Actions stay domain.

### SavedViews / FilterBar / AdvancedFilterDrawer

- **Owner:** `ds/workspace/*`
- **Write path:** existing `list-query.ts` + GET list URLs + POST/PATCH/DELETE `/crm/filters`
- **Must not** add a second filter store

### DataTable

- **Owner:** `ds/workspace/DataTable.tsx`
- **Owns:** row height 48, selection checkboxes, row click routing
- **Delegates cells to:** `ListViewTable` renderers / domain `columnDefs`
- **Domain owns:** `columnDefs`, `rowHref`, object-specific columns (wilaya, amount, stage)

### BulkActionBar

- **Owner:** `ds/workspace/BulkActionBar.tsx` (canonical after P03)
- **Domain owns:** which `actions[]` are legal, members/sequences/stages, permission to show
- **Must not invent endpoints.** Today only contacts + deals POST bulk.

### CrmListShell

- **Role after P03B:** thin page helper that maps Inertia list props → `DataWorkspace` domain mode (`renderResults` + `selection`). Domain tables still render via children. Shared-table `rows` wait for P04–P08.
- **Deprecate as a visual fork** once all five objects pass through shared-table mode without a domain result surface.

---

## 4. Record contracts

### QuickRecordDrawer

- **Owner:** `ds/workspace/QuickRecordDrawer.tsx` (new, P09)
- **Owns:** open state, Esc/focus, `?record=` helper, layout (480–560)
- **Slots (domain):** identity, status, owner, essentials, associations, recent, next action, shortcuts
- **Must not own:** layout editor, merge, quote builder, deep attribute admin
- **Must not delete** show routes

### FullRecordWorkspace

- **Owner:** `RecordShell` + `RecordPageFrame` (`record-chrome.tsx`, `record-hub.tsx`)
- **Owns:** 3-pane adaptive layout, back link, action toolbar
- **Domain owns:** object-specific center/right panes (deal line items, lead convert, quote editor, ticket thread)

### ActivityTimeline

- **Owner:** `record-activity-panel.tsx` + `record-workspace.tsx` `RecordTimeline`
- **Owns:** grouping, type filters
- **Must not own:** the activities *queue* page (that is ActivityQueue)

---

## 5. Pipeline contracts

### PipelineBoard / PipelineColumn / DealCard

- **Owner:** `pipeline-kanban.tsx` + `pages/crm/deals/board.tsx` card
- **Owns:** column header (name, count, total, weighted), card fields, drag preview
- **DataWorkspace owns:** shared views/filters/mode toggle when board is `mode="board"`
- **Laravel owns:** move, forecast numbers, stage-required properties
- **Must implement (P11–P12):** keyboard move, menu move, undo, rejection recovery, next-activity line

Tickets board may use PipelineKanban as a primitive. It is not the deal engine.

---

## 6. Inbox suite

| Component | Owner file | Owns | Must not own |
|---|---|---|---|
| InboxWorkspace | `pages/desk/inbox.tsx` | Mode switch native/embed | CRM record editor |
| InboxFolderRail | `inbox-chrome.tsx` | Folders | Thread fetch |
| InboxThreadList | inbox page | Selection, unread | Reply send |
| InboxConversation | inbox page | Messages, reply box | Connector admin |
| InboxContactContext | `InboxContactSidebar` | Facts, Open contact | Full record workspace |
| Desk embed | inbox page iframe | Official desk | Native IA |

Embed remains a **fallback**, not the information architecture.

---

## 7. Activity queue

- **Owner (target):** `pages/crm/activities/index.tsx` composed with a queue chrome (P15)
- **Owns:** overdue / today / upcoming, complete, attendance
- **Must not own:** the record timeline
- **Write path:** existing `POST /crm/activities`, `.../complete`, `.../attendance`

---

## 8. Quotes

| Component | Owner | Owns | Must not own |
|---|---|---|---|
| Quote list | DataWorkspace `object="quote"` | Views, filters, row open | Public accept |
| Quote create | `CreateDrawer` (keep compact) **or** split builder entry (P18) | Deal association | Payment capture |
| QuoteWorkspace / Builder | `pages/crm/quotes/show.tsx` | Line items, send, revoke, preview | List chrome |
| Public quote | `pages/public/quote.tsx` | Accept | Authenticated shell |

---

## 9. Automation

| Component | Owner | Owns | Must not own |
|---|---|---|---|
| AutomationWorkspace | `pages/crm/workflows/index.tsx` | List, toggle, delete | n8n canvas (forbidden default) |
| WorkflowBuilder | structured drawer / page (P19) | Trigger / condition / action / else | Arbitrary JS |
| Test / history / safety | P20 | Dry-run, run log, confirm on destructive | Changing engine semantics |

Keep Shopify Flow / HubSpot / Zapier **structured** grammar. Do not introduce a node canvas unless a later brief explicitly replaces this lock.

---

## 10. Settings & integrations

| Component | Owner | Owns |
|---|---|---|
| SettingsShell | `layouts/settings/layout.tsx` | Scope groups, permission filter, width |
| IntegrationDirectory | `pages/settings/apps/index.tsx` + connectors | Catalog, connect/disconnect |

Danger actions stay on the object they destroy.

---

## 11. Onboarding & AI

| Component | Owner | Owns |
|---|---|---|
| OnboardingChecklist | new Home region (P23) | Durable first-outcome items |
| Setup wizard | `pages/settings/setup/wizard.tsx` | OAuth / channel connect |
| AskEvo | `ask-evo-panel.tsx` | Contextual ask on a record; command section |
| Shared overlays / states | `ds/components/{Drawer,Modal,Toast,EmptyState,Skeleton}` | Focus, Esc, reduced motion |

---

## 12. DataWorkspace vs domain (list migrations)

Migrate Contacts, Companies, Leads, Deals list, Quotes **without erasing domain differences**.

| Concern | DataWorkspace | Domain page / lib |
|---|---|---|
| Title, primary CTA, empty copy | chrome | copy strings |
| Saved views / chips / advanced | yes | `listView.filterFields` |
| Columns | layout | `columnDefs` + cell renderers |
| Selection | state in workspace | which rows exist |
| Bulk | slot | actions + POST |
| Create | triggers `onCreate` | `CreateDrawer` fields |
| Board mode | switch + slot | `PipelineKanban` + forecast |
| Wilaya / city | — | company/contact filterContext |
| Lead score / path | — | leads page only |
| Quote needs a deal | — | quote create form |

Leads stay a **lead object**, not a second deal board.

---

## 13. What is not a canonical component

Do not promote these to DS:

- `CrmShell` tab strip (retire per page)
- `list-toolbar.tsx` / `saved-view-tabs.tsx`
- `app-header.tsx`
- `pages/leads/board.tsx`
- Hairline table (workflows may keep it as domain chrome until P19)
- EvoViz (charts stay in `evoviz/`)
