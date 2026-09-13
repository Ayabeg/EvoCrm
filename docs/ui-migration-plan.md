# EvoCRM UI migration plan

**Scope:** visual/system rebuild only.  
**Locks:** [`ui-audit.md`](./ui-audit.md), [`design-system.md`](./design-system.md).  
**Method:** strangler. One phase per PR. Routes and APIs do not move.

## Preserve forever

Do not change in any P01–P16 PR unless that PR's acceptance criteria explicitly say so:

- Laravel routes (`routes/web.php`, `routes/settings.php`, `routes/api.php`)
- Controller method signatures and Inertia prop contracts
- Auth, permissions, capabilities, simple mode
- Integrations, webhooks, jobs, observers
- Schema, seeders, default pipeline slugs (`new` … `lost`)
- Public quote accept (`/q/{token}`) and meeting book (`/book/{slug}`)

If a phase needs a new UI-only query param (`?drawer=1`), it is additive. Do not rename `savedFilters`, `listView`, `activeFilters`, or bulk POST shapes.

---

## 1. How to migrate without a big bang

```
P01  docs (this PR)
P02  tokens in app.css + test lock rewrite
P03  primitives behind existing @/components/ui imports
P04  AppShell / Sidebar / Topbar
P05  DataWorkspace (adapter over CrmListShell)
P06–P08  swap list pages onto DataWorkspace (contacts → companies → deals)
P09  RecordDrawer (additive; show pages stay)
P10–P13  Home, Inbox, Quotes, Settings
P14  CommandPalette
P15  motion
P16  delete dead Aurora skins / old utilities
```

**Strangler rules**

1. New DS components land under `resources/js/ds/` (see design-system.md). Old `components/ui/button.tsx` re-exports until P16.
2. One object at a time for lists. Contacts first because Wave 1 already isolated `data-crm="contacts-workspace"`.
3. Feature flags are optional. Prefer "new chrome, same props" so QA is visual + existing Pest feature tests.
4. Never ship P02 tokens without updating Wave 0/4/5 **string** tests in the same PR.
5. Parallel wave PRs: if another branch is rewriting a page this phase owns, **skip that page** and note it in the PR. Do not merge two chrome rewrites for the same file.
6. Backend PRs (workflows, permissions, connectors) should not conflict. If they touch a Blade/Inertia prop, rebase and keep the prop.

**Compatibility checklist (every phase)**

- Same URL, same Inertia component name unless the phase is explicitly renaming (none do)
- Same POST/PATCH endpoints
- Keyboard create (`?create=1`) still opens the create drawer
- Saved views still round-trip `/crm/filters`
- Simple mode nav still works
- `auth.capabilities` still hide Import / Merge / Settings leaves

---

## 2. Phases P01–P16

### P01 Audit

**This PR.** Adds `docs/ui-audit.md`, `docs/design-system.md`, `docs/ui-migration-plan.md` only.

**Acceptance**

- [ ] Three files exist; no `resources/js` / `resources/css` / route changes
- [ ] Audit cites real paths (`app-sidebar.tsx`, `crm-list-shell.tsx`, Wave tests)
- [ ] Design system locks `#E8530E` and DataWorkspace
- [ ] Plan lists P01–P16 with AC and QA

### P02 Tokens

**Touch:** `resources/css/app.css`, `resources/css/aurora-evotechly-bridge.css`, `resources/js/evoviz/contract.ts`, `resources/js/app.tsx` progress color, Pest locks (`Wave0ShellChromeTest`, `AuroraTokenBridgeTest`, Wave 4/5 hex assertions).

**Do not** restyle pages. Components should pick up variables automatically where they already use `bg-canvas`, `text-ink`, `border-hairline`, `--evosales-mark`.

Map:

| Old | New |
|---|---|
| `--evosales-canvas` `#eaeaea` | `#F7F7F5` (bg) |
| `--card` `#ffffff` | `#FFFFFF` |
| `--evosales-ink` `#000000` | `#161616` |
| `--evosales-mute` `#525252` | `#666666` + muted `#929292` as a new alias |
| `--evosales-hairline` `#d4d4d4` | `#E3E3DF` |
| `--evosales-mark` `#d9500f` | `#E8530E` |
| `--text-page-title` 22px | 28/34/650 |
| Sidebar `#000000` 56px | paper / 64px collapsed (width can wait for P04 if tests split) |

If changing rail width in P02 fails Wave 0 "56px" tests, **leave width for P04** and only recolor in P02.

**Acceptance**

- [ ] No hardcoded `#d9500f` / `#eaeaea` required for compile (leftover hex in settings/quotes is OK until P12/P13, but tokens themselves are new)
- [ ] Wave 0 tests updated to new hex; still forbid `#0176D3` / `#00A4BD`
- [ ] Geist still loads; type utilities match the locked scale
- [ ] `php artisan test --filter=Wave0` and `AuroraTokenBridge` pass
- [ ] Visual: Home / Contacts / Settings still render, just recolored

### P03 Primitives

**Add** `resources/js/ds/components/*` for Button, Input, Select, Tabs, Badge, Avatar, Checkbox, Dropdown, Tooltip, Modal, Drawer, Toast, Skeleton, EmptyState.

**Re-export** from `resources/js/components/ui/*` so existing imports keep working.

**Acceptance**

- [ ] Default Button is 36px, primary `#E8530E`, white label
- [ ] Input/Select 36px, label above, error below
- [ ] One icon family in these primitives (Phosphor)
- [ ] No new Aurora color variants
- [ ] `npm run types:check` and existing Pest UI chrome tests pass
- [ ] Story-less OK; smoke via Contacts create drawer + Settings profile

### P04 AppShell

**Touch:** `app-sidebar.tsx`, `app-sidebar-header.tsx`, `ui/sidebar.tsx`, maybe `app-shell.tsx`.

Implement 64 / 240 grouped rail and topbar from design-system.md.

**Acceptance**

- [ ] Desktop collapsed 64px, expanded 240px, state persisted
- [ ] Groups: Home · CRM (Contacts, Companies, Deals, Pipeline) · Communication (Inbox, Activities) · Sales (Quotes) · Automation · More · Settings bottom
- [ ] Active item: accent wash, not orange fill of the whole rail
- [ ] Topbar search placeholder `Search EvoCRM…` + Cmd/Ctrl+K
- [ ] AI · Create · Notifications · Profile present
- [ ] Simple mode still replaces leaves
- [ ] Mobile: 240px labeled Sheet
- [ ] Wave 0 sidebar tests rewritten for new IA (still Phosphor, still no Salesforce/HubSpot brand hex)
- [ ] `tests/Feature/SimpleModeNavTest.php` still green

### P05 DataWorkspace

**Add** `ds/workspace/DataWorkspace.tsx` + SavedViews, FilterBar, AdvancedFilterDrawer, DataTable (wrap `list-view-table` renderers), BulkActionBar restyle.

**Adapter:** `CrmListShell` becomes a thin wrapper that renders `DataWorkspace` so unmigrated pages keep compiling.

**Acceptance**

- [ ] Props match the sketch in design-system.md
- [ ] Advanced filters open a Drawer, not an inline second band on desktop
- [ ] Saved views + URL filters still use `list-query.ts` and `/crm/filters`
- [ ] Table row 48px, page pad-x 32, controls 36
- [ ] No object-specific CSS in the workspace
- [ ] Unit/feature: Contacts index still receives the same Inertia props (Wave 1 test updated for new `data-*` if needed)

### P06 Contacts

**Touch:** `pages/crm/contacts/index.tsx` only (plus shared workspace if gaps appear).

**Acceptance**

- [ ] Page is `DataWorkspace object="contact"`; no `CrmShell` tabs
- [ ] Create drawer, Import, Duplicates, bulk enroll/assign/delete unchanged
- [ ] Empty and filtered-empty copy still accurate
- [ ] `EvoCrmWave1ContactsChromeTest` updated, not deleted
- [ ] Row click → `/crm/contacts/{id}` (full page until P09)

### P07 Companies

**Touch:** `pages/crm/companies/index.tsx`.

**Acceptance**

- [ ] Same workspace as Contacts
- [ ] **Remove `CrmShell` wrapper** (this is the double-chrome bug)
- [ ] Create company drawer and city/wilaya filters still work
- [ ] No company-only table styles

### P08 Deals list + board

**Touch:** `pages/crm/deals/index.tsx`, `pages/crm/deals/board.tsx`.

**Acceptance**

- [ ] List and board are `DataWorkspace` `mode="list" | "board"`
- [ ] Shared saved views / filters / pipeline switcher
- [ ] Stages remain New → Qualified → Demo → Proposal → Won → Lost
- [ ] Drag-and-drop + forecast strip still call existing deal update routes
- [ ] Bulk assign / move stage / delete unchanged
- [ ] `EvoCrmWave2DealsChromeTest` updated
- [ ] Layout toggle does not remount a different shell

### P09 RecordDrawer

**Add** drawer; **do not remove** show pages.

**Acceptance**

- [ ] From a list, optional click-modifier or peek control opens `RecordDrawer`
- [ ] "Open full record" → existing `/crm/{object}/{id}`
- [ ] Identity, properties, activity, associations reuse `record-hub` / `record-chrome` slots
- [ ] Ask Evo is secondary, not the first orange block
- [ ] Esc / overlay click closes; URL can stay on the list (`?record=`)
- [ ] Show-page feature tests still pass

### P10 Dashboard (Home)

**Touch:** `pages/home.tsx`, `components/dashboard/*`.

**Acceptance**

- [ ] `PageHeader` 28/34/650
- [ ] Attention list above vanity charts
- [ ] KPIs use tokens; chart series 1 = `#E8530E`
- [ ] No duplicate Create (header vs quick actions vs global Create): one obvious path
- [ ] Props still from `HomeController` / `HomeDashboardBuilder`
- [ ] Wave 0 Home assertions (`data-home="workspace"`, Needs attention, HomeWidget) updated if class names change

### P11 Inbox

**Touch:** `pages/desk/inbox.tsx`, `inbox-chrome.tsx`, `adaptive-workspace-shell.tsx`.

**Acceptance**

- [ ] Native inbox is 4 panes: folders · threads · conversation · contact
- [ ] `<lg` collapses via existing panel switcher
- [ ] Embed/iframe path remains a fallback, not the IA
- [ ] Reply / note / open ticket / official WhatsApp Cloud CTAs unchanged
- [ ] Desk iframe header rules (`docs/desk-iframe-headers.md`) untouched

### P12 Quotes

**Touch:** `pages/crm/quotes/index.tsx`, `show.tsx` chrome only.

**Acceptance**

- [ ] List is `DataWorkspace object="quote"`
- [ ] Hardcoded `bg-[var(--evosales-mark,#d9500f)]` removed
- [ ] Send / revoke / public accept behavior unchanged (`EvoCrmWave4QuotesChromeTest` + accept test)
- [ ] Record drawer optional if P09 already generic

### P13 Settings

**Touch:** `layouts/settings/layout.tsx`, `components/settings/chrome.tsx`.

**Acceptance**

- [ ] Nav groups: Personal / Workspace / CRM / Channels / Integrations / (Billing if routed) + Admin as specified
- [ ] No hardcoded `#eaeaea` / `#d9500f`
- [ ] Forms `max-w-[900px]` on narrow panes; wide tables stay wide
- [ ] Permission filtering unchanged
- [ ] `EvoCrmWave5SettingsChromeTest` updated
- [ ] Connectors "No Baileys" copy stays contiguous (Wave 5 fix)

### P14 CommandPalette

**Touch:** `components/crm/command-palette.tsx`, Aurora command wrapper.

**Acceptance**

- [ ] Triggered by search field + Cmd/Ctrl+K
- [ ] Sections: Navigate, Records, Create, Ask (capability-gated)
- [ ] `/dashboard` not `/home` for Home
- [ ] Phosphor only
- [ ] Record hits still from `evoSearchIndex`

### P15 Motion

**Touch:** `resources/css/aurora-motion.css` + DS open/close.

**Acceptance**

- [ ] Drawer/modal/palette: 150–200ms transform+opacity only
- [ ] Board drag unchanged
- [ ] `@media (prefers-reduced-motion: reduce)` disables non-essential motion
- [ ] No scroll listeners, no marketing choreography

### P16 Visual QA / remove old styles

**Delete or isolate**

- Unused Aurora skins that are not re-exported
- Leftover `app-header.tsx` starter-kit (if still unreferenced)
- Dead CSS: unused `.aurora-*` that no DS component uses
- Duplicate empty states once `ds/EmptyState` is universal
- Comments/docs that still prescribe `#d9500f` as the product lock (point them here)

**Acceptance**

- [ ] `rg "#d9500f|#eaeaea|#EC6025|#0176D3|#00A4BD" resources/js resources/css` is empty except comments pointing at history or third-party brand SVGs (`brand/marks.tsx`)
- [ ] Contacts / Companies / Deals list+board / Quotes share one workspace implementation
- [ ] Lighthouse-level: no new layout shift from font swap; Geist still `font-display: swap`
- [ ] Full Pest + `npm run types:check` + `npm run lint:check` green

---

## 3. QA checklist (run on every phase that touches UI)

### Functional (must)

- [ ] Login / logout / 2FA
- [ ] Home KPIs render real workspace numbers (empty workspace shows empties, not fake %)
- [ ] Contacts: create, saved view, filter, export, import permission, duplicates, bulk assign
- [ ] Companies: create, filter, open record
- [ ] Deals: list, board drag across New→Lost, forecast updates, bulk move
- [ ] Quotes: create from deal, send, public accept
- [ ] Inbox: folder change, open thread, reply (or official connect empty)
- [ ] Settings: profile save, a gated integrations page 403s for members
- [ ] Command palette navigates + opens a contact from search index
- [ ] Simple mode hides Ads/Reports as server dictates

### Visual

- [ ] Accent only on the one primary / selection / focus
- [ ] Canvas `#F7F7F5`, surfaces white, border `#E3E3DF`
- [ ] Page title 28/34, table 13, metadata 12
- [ ] Controls 36, rows 48, desktop pad-x 32
- [ ] Rail 64/240, Settings forms ≤900px
- [ ] No orange wash, no navy/teal

### Responsive

- [ ] 375: Sheet nav, single inbox panel, list cards or horizontal table (do not clip Create)
- [ ] 768: usable list + filters
- [ ] 1280 / 1440: 4-pane inbox and DataWorkspace feel like the Mobbin density references without cloning HubSpot/Salesforce paint

### A11y

- [ ] Focus ring uses accent, 3:1 against canvas
- [ ] Buttons are `<button>` / Inertia `Link`, not clickable divs
- [ ] Drawer focus trap + Esc
- [ ] Contrast: body `#161616` on `#F7F7F5` / white; muted `#929292` only for metadata

### Regression tests to run

```bash
php artisan test --filter=Wave0
php artisan test --filter=Wave1
php artisan test --filter=Wave2
php artisan test --filter=Wave4
php artisan test --filter=Wave5
php artisan test --filter=SimpleMode
npm run types:check
npm run lint:check
```

Update the Wave `toContain` hex/class assertions in the **same** PR that changes those strings. Do not leave red tests for a follow-up.

---

## 4. Parallel wave handling

| If a parallel PR is editing… | This plan's owner |
|---|---|
| `app-sidebar.tsx` / topbar | P04 waits or rebases |
| `crm-list-shell.tsx` / contacts index | P05–P06 |
| deals board | P08 |
| quotes pages | P12 (Wave 4 just merged; rebase) |
| settings layout | P13 (Wave 5 just merged; rebase) |
| inbox | P11 |
| `app.css` tokens | P02 only. No second token PR. |

This docs PR (P01) must not edit those files. Implementers of later phases should `git fetch` and rebase onto `main` immediately before starting.

---

## 5. Out of scope (never sneak into a UI phase)

- Renaming EvoSales leftover PHP namespaces
- New CRM objects
- Billing product (settings group can appear when the route exists)
- Dark mode redesign
- Replacing Inertia with Next / a SPA
- Cloning HubSpot or Salesforce visual identity
- Marketing landing rewrite (different orange allowed there)
