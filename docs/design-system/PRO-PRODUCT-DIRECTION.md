# EvoSales — Pro product design direction

**Status:** Approved. Implementation is one PR per phase, starting with global chrome.  
**Baseline:** PR #101 (Aurora architecture) + #114 (responsive) + #115 (a11y / token hygiene).  
**Date:** 2026-08-28.

---

## Design read

Reading this as: **an all-day enterprise CRM for Algerian sales operators**, with a **precision / density / EvoTechly-identity** language, leaning toward **Brand Book tokens + Aurora primitives + the existing EvoSales IA**.

Dials (explicit, so this cannot drift into a marketing restyle):

| Dial | Value | Meaning |
|------|-------|---------|
| Variance | **3** | Precision, not decoration |
| Motion | **3** | Aurora open/close, selection, drag — nothing else |
| Density | **8** | Cockpit. Information first. Air only where it creates hierarchy |

This is **not** a Linear clone, Attio clone, HubSpot clone, or generic SaaS template. Those products are studied for *operating speed* (command, progressive filters, record identity). The visual system stays Evotechly: black rail, orange mark, Geist, hairline, canvas-soft.

---

## What is already working

Do not throw this away.

- Identity is recognizable: `#000` rail, `#EC6025` mark, Geist, white/soft canvas.
- Aurora primitives (Sheet, Dialog, Button, Input, Command, EmptyState) are the interaction layer.
- Mobile nav is **EvoSales IA → Aurora Sheet → 240px opaque drawer**. Keep it.
- Home KPIs, attention, activity, and pipeline health are **real workspace data** (`HomeDashboardBuilder`). Never fabricate metrics.
- Contacts / Companies / Deals already have `CrmListShell` + `ListViewTable` + saved views + filters + bulk actions.
- Record show already has identity, status, actions, timeline, associations, Ask Evo.
- Pipeline already has stage value, weighted %, owner, close date, drag.
- Desk already has a three-pane inbox. Official Cloud only. No Baileys.

The product is **technically correct**. It is not yet **fast to operate**.

---

## Phase 1 — Current-state audit

Screenshots from the seeded owner workspace (`owner@evosales.local`), 2026-08-28.

### 1. Shell

<img alt="Home 1440" src="/opt/cursor/artifacts/screenshots/audit-home-1440.png" />

**What exists**

- Black 240px rail: Evotechly mark + wordmark, then **rooms** (Home, CRM, Desk, Outbound, Ads, Reports) + More.
- Default pins = those rooms (`DEFAULT_PINNED`). CRM objects (Contacts, Companies, Deals, Lead board) live in More unless pinned.
- Top bar: Find or Ask (opens Aurora command palette) · + create · bell · initials.
- Account lives in the top bar, **not** at the bottom of the rail. Rail footer is Collapse + a decorative bell.

**What’s wrong**

- Daily CRM work is one click deeper than the rooms. The user’s target tree (Leads / Contacts / Companies / Deals under CRM) matches how operators think. The current rail matches how the *product is packaged*.
- “Find or Ask” overpromises. ⌘K only filters a static **Navigate** list. It does not search records and does not Ask Evo.
- Two bells (top bar + rail footer). Top-bar bell has no feed and no unread count, even though Desk already has unread (Home shows “12 unread”).
- Orange + is strong. That’s correct. Don’t enlarge it.

**Do not**

- Replace `AppSidebar` with Aurora Sidebar.
- Move the wordmark off the rail.
- Invent a notifications product.

### 2. Home

<img alt="Home 375" src="/opt/cursor/artifacts/screenshots/audit-home-375.png" />

**Available data (do not invent)**

| Surface | Source |
|---------|--------|
| Revenue, Pipeline, Win rate, Open deals, Activities done | `HomeDashboardBuilder` KPIs |
| Period + owner filters | query string |
| Performance chart | won revenue in window (omitted if empty) |
| Pipeline health | open deals by stage + optional chart |
| Needs attention | stalled deals, tasks due, overdue, unread threads, leads without follow-up |
| Recent activity | last workspace activities |
| Sales performance | won-by-owner table |
| Quick actions | static hrefs to create surfaces |

**What’s wrong**

- Title is the room name (“Home”), not an operating sentence.
- Filter card is a third-level panel with too much padding.
- Five equal KPI cards + a large Performance chart + a side column. Attention (the only *act now* list) is secondary. The chart is a single late spike — it should not win the page.
- “New deal” in the header **and** Quick actions **and** the global +. Three create surfaces.
- “+100% vs previous period” on small windows is mathematically true and operationally noisy.

**What’s right**

- Builder already omits empty sections. Keep that contract.
- KPI tiles already have label / value / comparison. Compact them; don’t replace them.

### 3. CRM lists

<img alt="Contacts 1440" src="/opt/cursor/artifacts/screenshots/audit-contacts-1440.png" />

<img alt="Contacts 375" src="/opt/cursor/artifacts/screenshots/audit-contacts-375.png" />

**What exists**

- `CrmShell` room title + object tabs (Contacts, Companies, Leads list, Deals, Activities, Pipeline, Automation).
- `RecordHubHeader`: second title + Duplicates / Import / **Add contacts**.
- `ListToolbar`: saved-view pills + Columns + **+ Create** + owner/date/status row + Apply / Clear / Advanced / Export + (deals) stage pills.
- `ListViewTable` on desktop; card stack on small screens.
- Leads **list** (`/crm/leads`) is a weaker sibling: raw form + HTML table, not the hub.

**What’s wrong**

- Chrome stack: CRM title → tabs → Contacts title → two create buttons → views → four filters → table. On 375 this eats most of the first screen.
- Orange is used for: active tab, active view pill, name links, Duplicates/Import, Add contacts, Apply. Everything is a primary.
- Two create CTAs (“Add contacts” and “+ Create”).
- Advanced filters already exist (`ColumnFilterRow` `advanced` toggle) but sit in the same band as the simple filters.

**Keep**

- `ListViewTable`. Saved views. Filter builder. Bulk bar. Create drawer.

### 4. Record pages

<img alt="Contact show 1440" src="/opt/cursor/artifacts/screenshots/audit-contact-show-1440.png" />

**What exists (contact show)**

- Back link · avatar · name · company/email · engagement (“Cold 30/100”) · Note/Email/Call/Task/Meeting + more.
- Left: **Ask Evo** (loudest card) → playbook → key facts → attributes.
- Center: Catch-up / All / typed activity tabs.
- Right: deals-by-stage + associations.

**What’s wrong**

- Ask Evo (gradient, sparkle, orange Ask button) is the first thing the eye hits. Identity and next action should be.
- Six equal action buttons. “More” already exists — use it.
- Key information repeats email already shown in the header.

**Keep**

- Ask Evo (demote, don’t delete). Catch-up. Adaptive workspace. ListViewTable stays off this page.

### 5. Pipeline

<img alt="Deals board 1440" src="/opt/cursor/artifacts/screenshots/audit-board-1440.png" />

**What exists**

- Room tabs + Deals board title + List/Board toggle.
- Three KPI cards (open count, pipeline value, weighted) + AI band strip.
- Columns: name, amount, weighted %, count, accent rule.
- Cards: title, contact · company, amount, owner · close date. Drag + drop target.

**What’s wrong**

- Forecast is told three times (KPI cards + band + column headers).
- Board is already the operational surface. The cards above it delay the work.

**Keep**

- `pipeline-kanban` product behavior. Weighted math. Stage colors. No DataTable swap.

### 6. Desk

<img alt="Inbox 1440" src="/opt/cursor/artifacts/screenshots/audit-inbox-1440.png" />

**What exists**

- Room title “Desk” + Inbox / Conversations / Channels.
- Three panes: filters · thread list (avatar, snippet, unread badge) · conversation or empty state.
- Official Cloud connectors only. “No Baileys” is product policy.

**What’s wrong**

- Title + tabs are tall relative to the thread list.
- `DeskGlass` is existing chrome; do not spread glass.
- Selecting a thread is the job. The empty state is already honest.

**Do not**

- Rewrite messaging. Introduce Baileys. Invent channels that are not connected.

### 7. Mobile

PR #114 already fixed drawer width (240), top-bar fit, Home/KPI density.

Remaining mobile problem is **chrome budget**, not the drawer:

- Home 375: title + New deal + filter card + 2-col KPIs — attention is below the fold.
- Contacts 375: room + tabs + header + views + four filters before the first card.

Strategy: first screen = work. Filters / secondary actions → Sheet or a single “Filters” control. Table/cards stay. Drawer stays 240px opaque.

### 8. Accessibility

#101 / #115 preserved:

- Sheet header inside content, Brand overlay, Escape / backdrop.
- Create / Notifications / account / pins named.
- Rail rows `min-h-11`. Icon buttons stay 32px (do not inflate to 44 on the 320 top bar).

Gaps to fix *while* redesigning, not as a separate crusade:

- Command placeholder vs actual capability (honesty is an a11y issue).
- Orange-on-canvas name links: keep 4.5:1; prefer ink names + brand hover.
- Record action icon+label buttons are fine; don’t strip labels on mobile without `aria-label`.

### 9. Design system

Ownership is settled. Do not open it.

```text
Brand Book → semantic tokens → Aurora bridge → Aurora primitives → EvoSales IA
```

No new token layer. No new `--evosales-pro-*`. If a token is missing, it must be justified, owned, and written into `docs/brandbook/design-tokens.md`.

Aurora still owns elevation, focus, overlay, motion. Brand Book still owns `#000` / `#EC6025` / Geist / canvas.

---

## Ten highest-impact changes

Ranked by operator speed. Not by prettiness.

| # | Change | Why | Owner | Fake-function risk |
|---|--------|-----|-------|--------------------|
| 1 | **Home: act first.** Full-width Needs attention under compact KPIs; chart and sales table after pipeline. Compress the date/owner row. | Attention is the only “do this now” list and is currently a side card. | EvoSales Home | None — reorder existing props |
| 2 | **CRM list: one chrome band.** One title, one primary create, views, then a single Filters disclosure. Keep `ListViewTable`. | Stacked CRM title + object title + two Creates + always-visible filters hide the table, especially at 375. | EvoSales lists | None |
| 3 | **Expanded rail: CRM objects first-class.** Group Contacts / Companies / Deals / Lead board under a CRM label when the rail is expanded. Rooms stay. More stays for the long tail. Collapsed rail stays icon rooms. | Operators live in objects, not rooms. IA is preserved; hierarchy is improved. | EvoSales AppSidebar | None |
| 4 | **Orange discipline.** Orange = mark, one primary CTA, one active pip. Table names and secondary links become ink (brand on hover/active). | Everything-orange destroys hierarchy and looks like a theme, not a product. | Brand Book | None |
| 5 | **Command honesty + Actions.** Same Aurora palette. Sections: Actions (create contact / company / deal / lead — existing hrefs) + Navigate. Placeholder becomes “Find a page or action”. | Placeholder already claims “Search contacts, deals”. There is **no** global record-search API. Do not fake results. | Aurora Command + EvoSales wrapper | Record search deferred until a real endpoint exists |
| 6 | **Record: identity before Ask Evo.** Facts + next action first; Ask Evo / playbook below. Collapse 6 actions to 2–3 + overflow. | Salespeople open a record to know who / status / value / what next. | EvoSales record | None |
| 7 | **Top bar as one instrument.** Honest search copy. One bell. If unread exists on threads, surface a count from **shared existing data** — no fake feed. | Duplicate bells and a dead control. Unread is already computed for Home. | EvoSales chrome | Count only if already on the page or cheap shared prop; no inbox clone |
| 8 | **Pipeline header: one forecast strip.** Keep kanban. Fold the three KPI cards into the existing forecast band. | Value is already on every column. The cards delay the board. | EvoSales pipeline | None |
| 9 | **Desk: quieter frame, denser threads.** Keep three panes. Reduce title stack. Slightly tighter thread rows. No new glass. | Inbox is the work; “Desk” as a marketing title is not. | EvoSales Desk | None |
| 10 | **Mobile chrome budget.** Filters and secondary actions into Sheet/menu on &lt;768. First viewport = table / attention / thread. 240px drawer unchanged. | #114 fixed overflow. The remaining fail is “chrome before work”. | EvoSales + Aurora Sheet | None |

**Explicitly not in the ten**

- Notifications product.
- Global record search (no API).
- ListViewTable → DataTable.
- Aurora Sidebar.
- Leads-list rebuild as a new object model.
- Forms overhaul as a separate design system.
- New illustrations / empty-state art.

---

## Phase 2 — Design direction

### Visual hierarchy

1. **Work** (table, board, thread, attention list)
2. **Identity** (who / what / status)
3. **Primary action** (one orange control)
4. **Context** (KPIs, filters, Ask Evo)
5. **Chrome** (rail, top bar)

If a control is not 1–3, it must be quieter or disclosed.

### Spacing strategy

Use the existing scale only (`--space-*` / Tailwind 4/8/12/16/20/24).

| Context | Rhythm |
|---------|--------|
| Rail rows | keep current `min-h-11` / 10px icon gap |
| Page header | 16px below title, not 32 |
| Section gap | 16 mobile / 24 desktop |
| Table row | stay dense |
| Card padding | 12–16, not 24–32 |
| Filter row | 8 vertical when disclosed |

No new spacing tokens.

### Typography hierarchy

Already in Brand Book. Use it; stop mixing ad-hoc 16px marketing titles.

| Role | Token | Use |
|------|-------|-----|
| Page title | `--text-page-title` 22 / semibold | One per page |
| Record title | `--text-record-title` 20 | Record name only |
| UI / data | `--text-ui` 13 | Tables, rail, desk, forms |
| Section label | `--text-section-label` 11 | KPI labels, column headers |
| KPI value | `--text-kpi` 28 | Home / forecast only — not every number |

Sentence case. DZD via `.money`. No Plus Jakarta in product.

### Component strategy

Search the repo before creating anything.

| Need | Use |
|------|-----|
| Button, input, select, dialog, sheet, popover, tabs, badge, avatar | `@/components/ui/*` → Aurora |
| Command | Existing `CommandPalette` wrapper + Aurora block |
| Empty | Aurora `EmptyState` (what / why / next + one CTA) |
| Loading | existing `SkeletonList` / `SkeletonRecord` — match final hierarchy |
| Table | `ListViewTable` |
| List chrome | slim `CrmListShell` / `ListToolbar` — don’t add a third toolbar |
| Record frame | `RecordPageFrame` / `RecordIdentity` / `RecordShell` |
| Kanban | `pipeline-kanban` |
| Desk panes | `DeskShell` |

New files only when composition is reused **three times**. Otherwise edit the existing component.

### Navigation strategy

```text
Expanded rail
  Evotechly
  Home
  CRM
    Contacts
    Companies
    Deals
    Lead board        ← existing /leads
  Desk
  Outbound
  Ads
  Reports
  More → same catalog (pins, settings, outbound children, …)

Collapsed rail
  Icon rooms + pins (current behavior)

Mobile
  EvoSales IA → Aurora Sheet → 240px opaque drawer
```

This is **grouping**, not a new IA. `CrmShell` object tabs can stay as local context so deep links still work. They should get quieter (not a second primary nav).

Workspace identity stays the Evotechly mark + wordmark on the rail. Account stays in the top bar (already the professional pattern). Do not invent a second account block unless we *move* the existing one — never duplicate.

### Page composition

**Home (command center)**

```text
Good morning{, name}                    [period · owner]   [one primary]
Your sales overview · {from} → {to}

[Revenue] [Pipeline] [Win rate] [Open deals]     ← compact strip, not 5 hero cards

Needs attention
  title · why · owner/count · action             ← full width, table-like

Pipeline health
  stage rows or existing chart + Open board

Performance (if chart exists)
Recent activity | Sales by owner (if rows exist)
```

Greeting uses `auth.user` first name. Filters stay real. Quick actions drop (global + covers them).

**CRM list**

```text
Contacts                    15 · [Filters] [Columns]  [Add contact]
All | My | …saved

[ ListViewTable ]
```

Filters open a Popover (desktop) or Sheet (mobile) containing the existing filter row + FilterBuilder. No second Create.

**Record**

```text
← Contacts
[avatar] Name                 Status
company · email · owner       [Log activity ▾] [Add deal]

Key facts (non-repeating)     Timeline              Related
Ask Evo (secondary)           Catch-up / types      Deals
```

**Pipeline**

```text
Deals board          Sales · {n} · {value} · weighted {n} · band   [List | Board]
[ kanban ]
```

**Desk**

```text
Inbox                         [filters]
threads                       conversation
```

### Density strategy

- Prefer **rows** over **cards** for attention, activity, and list data.
- Prefer **strips** over **KPI card grids** once the number is known.
- Cards are for records on a board and for empty states — not for every widget.
- One orange fill per view.

### Responsive strategy

| Width | Shell | Content |
|-------|-------|---------|
| 320–430 | 240px Sheet drawer; top bar: menu + compact search + + + avatar (bell can sit in overflow if 320 clips) | Stack. Filters in Sheet. KPIs 2-col. Lists as existing cards. Board: horizontal scroll columns (already). Desk: thread list full-width; conversation as Sheet. |
| 768 | Icon rail. No mobile Sheet. | Filters may stay inline but collapsed by default. |
| 1024–1440 | Labeled 240 rail with CRM group. | Three-pane records/desk. |
| 1920 | Same IA. `max-w` on Home only; lists/board/desk use the width. |

Never introduce horizontal overflow on the shell. Board columns are the one intentional `overflow-x`.

### Empty / loading / error language

| State | Rule |
|-------|------|
| Empty | Aurora EmptyState: what’s empty, why it matters, one next action. No art. |
| Loading | Skeleton that matches the final regions (header / strip / rows). No full-page flash. |
| Error | Callout error: what failed + what to do. No stack traces, no “WHATSAPP-BAILEYS”. |

### Motion

Aurora `--motion-duration-fast` / `--motion-ease-out` for Sheet, Dialog, command, drag opacity. `prefers-reduced-motion` already in `aurora.css`. No bounce, no page-level fades.

---

## Implementation order (approved)

Operator journey. One PR per phase. Do not restyle the same chrome twice.

| Phase | Items | Status |
|-------|-------|--------|
| 1. Global chrome | #7 top bar · #4 orange discipline (chrome) · #10 mobile chrome budget | Done (PR #117) |
| 2. Navigation | #3 expanded rail CRM objects | Not started |
| 3. Home | #1 act first | In progress (this PR; after chrome, before nav) |
| 4. CRM lists | #2 one chrome band | Not started |
| 5. Records | #6 identity before Ask Evo | Not started |
| 6. Pipeline | #8 one forecast strip | Not started |
| 7. Desk | #9 quieter frame | Not started |
| 8. Command | #5 honesty + Actions | Not started |

Each phase: `AuroraTokenBridgeTest` + focused Pest, then full suite, `types:check`, `lint:check`, build, breakpoint probe.

**Architecture impact allowed:** frontend composition only.  
**Architecture impact forbidden:** Aurora replacement, token cycle, AppSidebar rewrite, ListViewTable migration, Inertia rewrite, API/DB, `migrate:fresh`, Baileys.

---

## Approval checkpoint

Implement only if all of these stay true:

- [ ] EvoTechly identity remains immediately recognizable
- [ ] Aurora remains the primitive layer
- [ ] EvoSales IA (rooms, More, pins, mobile Sheet) remains
- [ ] No fake metrics, fake search results, or fake notifications
- [ ] No second design system or token layer
- [ ] Changes ship in the ten-item order, not as a hundred-file restyle
