# V00 — Screen signatures

The shared design system creates consistency.

Composition creates identity.

Do not make every page: title + button + four cards + generic table.

---

## Dashboard

```text
[ Page 28/34 + one Create ]
[ KPI STRIP — numbers, dividers, no cards ]
[ ATTENTION — full-width list, first ]
[ TODAY | PIPELINE ]   ← two columns, not four equal tiles
[ RECENT — hairline list ]
[ Activation band only if incomplete — not a nested card ]
```

**Identity:** Operating home. Attention first. Metrics as a rail. No widget furniture.

**Inherits:** PageHeader, type, buttons, list rows, empty/skeleton.

**Must not become:** 2×2 equal HomeWidgets with 11px captions.

---

## CRM lists (Contacts, Companies, Leads, Deals list, Quotes list)

```text
[ Page 28/34 + one primary ]
[ VIEW PILLS + FILTER BAND — one continuous chrome ]
[ TABLE — the page ]
[ pager ]
```

**Identity:** Workspace, not a card around a table. Identity column is the only bold cell.

**Inherits:** DataWorkspace, SavedViews, FilterBar, table rows, QRD peek.

**Variance 4:** Deals may keep a slim attention line under the filter band. Leads may keep path-specific filters. The chrome geometry stays shared.

---

## Pipeline

```text
[ Slim title + list/board toggle + one Create ]
[ Optional forecast as a number rail, not a banner card ]
[ BOARD — columns are the page ]
```

**Identity:** Board-first. Stage names readable. Cards quiet.

**Inherits:** DataWorkspace mode, kanban, QRD, P25 local H-scroll.

**Must not become:** A Contacts page with the table replaced by cards.

---

## Record workspace + QRD

```text
Record (1440):
[ back + name 20 + actions ]
[ ABOUT 320 | ACTIVITY flex | INSIGHTS 320 ]
     facts         timeline        one surface

QRD:
[ name 16–20 + Open full ]
[ section pills ]
[ facts ]
```

**Identity:** Three continuous panes. Inspector, not a dashboard of cards.

**Inherits:** RecordShell, AdaptiveWorkspaceShell, Field, timeline rows, Ask Evo panel.

**Must not become:** Nested association cards + Ask Evo card + files card.

---

## Inbox

```text
[ folders 200 | threads 320 | conversation flex | context 240? ]
```

**Identity:** Desk. Conversation is the hero. Context is an inspector.

**Inherits:** AdaptiveWorkspaceShell, 13px body, empty/connect.

**Must not become:** RoomShell + four bordered columns.

**P25:** Native and embed both remain. Embed keeps a thin header, not a second product.

---

## Activities

```text
[ Page 28/34 ]
[ filter band ]
[ grouped queue — sticky group labels ]
```

**Identity:** Work queue. Rows are tasks, not table chrome.

**Inherits:** PageHeader, badges, RecordLink, 48px rows.

**Must not become:** CRM RoomShell + another header.

---

## Quotes (builder)

```text
[ properties 280 | DOCUMENT paper flex | delivery 280 ]
```

**Identity:** Document canvas. The quote is a piece of paper on canvas, not a card in a card.

**List** uses the CRM list signature. **Show** does not grow a 22px second title.

**Inherits:** DataWorkspace on the list. Builder grid. Money never-clip (P25).

**Must not become:** A contact record with a table in the middle.

---

## Automation

```text
[ Page 28/34 + Create ]
[ templates as a compact rail or empty ]
[ workflow list OR canvas + run history ]
```

**Identity:** Authoring surface. Canvas when editing. List when choosing.

**Inherits:** PageHeader, hairline rows, dialogs.

**Must not become:** Aurora display-2 marketing header + RoomShell.

---

## Settings

```text
[ settings nav 248 | form column max 900 ]
```

**Identity:** Admin console. One column. A card only around a saveable group.

**Inherits:** Settings IA (P21), SettingsPageHeader 28/34, Field.

**Must not become:** Marketplace cards inside settings cards inside a card.

---

## Ask Evo / Integrations / Activation

**Ask Evo:** Composer + answer at 13–14px. Context line 12. Same header whether rail, sheet, or command section.

**Integrations:** App rows or a simple grid. Logo + name + status + one connect. Not a storefront.

**Activation:** A Home band with a named progressbar. Not a third card above the widgets.

---

## Shared vs unique

| Shared (solve once) | Unique (signature) |
|---|---|
| Type scale, buttons, inputs, badges | Dashboard attention-first band |
| Page geometry 32 / 24 | Pipeline board-first |
| Filter band + table rows | Record 3-pane |
| Dialog / drawer / popover | Inbox desk columns |
| Rail + topbar | Quote paper canvas |
| Empty / skeleton | Automation canvas |
| | Settings form column |
