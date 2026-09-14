# Signature capability map

Do **not** implement 35 experiences independently. Five reusable capabilities (plus two justified by this repo) cover the approved UX program.

Capabilities are **module ids**. Later PRs implement slices of a capability, not one-off page art.

---

## Capability table

| Id | Responsibility | Primary surfaces | Depends on |
|---|---|---|---|
| `record-context` | A record can be identified, peeked, and opened fully with the same facts | QuickRecordDrawer, FullRecordWorkspace, Inbox contact pane, command record hits | — |
| `action-routing` | One place decides “create / log / assign / move / ask / open” and lands on the right overlay or route | Topbar Create, Command, RecordActions, BulkActionBar, board card menu | `record-context` |
| `attention-engine` | What needs a human now: stale deals, overdue activities, inbox, Home needs-attention | Home AttentionList, pipeline stale/next, ActivityQueue, inbox unread | `record-context` |
| `command` | Keyboard OS: navigate, find records, create, ask | CommandPalette, topbar search, Ask Evo section | `action-routing` |
| `activation` | Durable path to first CRM outcome | Home checklist, setup wizard deep-link, empty states | `action-routing` |
| `data-workspace` | Shared list orchestration (views, filters, selection, list\|board) | Contacts, Companies, Leads, Deals, Quotes (+ later tickets) | — |
| `structured-automation` | Trigger → condition → action authoring without a canvas | Workflows list/builder, test/history | `action-routing` |

`data-workspace` and `structured-automation` are extra because this codebase already has those spines (`ds/workspace/*`, `/crm/workflows`). Inventing per-page list chrome or an n8n canvas would fight the repo.

---

## 1. RECORD CONTEXT

**Job:** Anywhere a contact / company / deal / lead / quote / ticket appears, the operator can see *who this is* and jump to the full workspace.

**Ship as**

- Shared identity slot (name, badge, owner, status)
- `QuickRecordDrawer` (P09–P10)
- Existing `RecordShell` (keep)
- Inbox `InboxContactSidebar` consumes the same facts, not a third card

**Do not ship as**

- A second property editor
- Peek-only product (full page stays)

**Code already close**

- `record-hub.tsx` `RecordIdentity` / `RecordFact`
- Inbox contact sidebar
- `evoSearchIndex` hits

---

## 2. ACTION ROUTING

**Job:** Create, log activity, assign, move stage, ask Evo, open full record — one router, many entry points.

**Ship as**

- A small action catalog (not a framework): `{ type, object, id, href | overlay }`
- Topbar Create and Command Create **share the same destinations** (`?create=1` routes already exist)
- Board card menu and keyboard move call the same `POST /crm/deals/{id}/move` as DnD
- Bulk actions are the same verbs as row menus where an API exists

**Do not ship as**

- A generic “workflow engine” in the client
- Duplicate Create CTAs (page + topbar both filled orange)

**Code already close**

- `AppSidebarHeader` Create dropdown
- `RecordActions` (note / email / call / task / meet)
- Domain + DS bulk bars
- `CreateDrawer` + `?create=1`

---

## 3. ATTENTION ENGINE

**Job:** Surface work that is late, missing a next step, or unread.

**Ship as**

- Shared “attention item” shape: `{ id, object, title, reason, href, tone }`
- Home `AttentionList` / future checklist reads the same reasons as pipeline stale + activity overdue
- Pipeline card stale **when meaningful** (`inactive_days`, board options already exist)
- Activity queue groups overdue / today

**Do not ship as**

- A new notification product
- Color-only stale pips

**Code already close**

- `components/dashboard/attention-list.tsx`
- Deal board `is_inactive` / `has_next_activity`
- `evoOpenTaskCount` on the topbar
- `HomeDashboardBuilder` props

---

## 4. COMMAND

**Job:** `Cmd/Ctrl+K` is the operating system.

**Sections (target)**

1. Records (`evoSearchIndex`)
2. Navigate (real hrefs — Home is `/dashboard`)
3. Create (same as topbar)
4. Ask Evo (capability-gated)

**Do not ship as**

- A second AI product
- Lucide-only island

**Code already close**

- `components/crm/command-palette.tsx`
- Topbar search + shortcut
- Missing: Create / Ask sections (P16). Home href and Phosphor: done (P01/P02).

---

## 5. ACTIVATION

**Job:** First CRM outcome, persisted.

**Ship as**

- Home checklist bound to real workspace facts
- Wizard remains the connector path
- Empty DataWorkspace CTAs point at the next unfinished activation item when relevant

**Do not ship as**

- “Wizard completed” = onboarded
- Fake KPI percentages

**Code already close**

- `GuidedActions` + `CaughtUpStrip` (not durable)
- `/settings/setup`
- `FirstRunSetupTest`

---

## 6. DATA WORKSPACE (justified extra)

Without this capability, P04–P08 become five visual forks. The suite exists; the **contract** (workspace owns rows + selection) does not.

**Build order:** `data-workspace` → list migrations → `record-context` drawer → pipeline mode=board.

---

## 7. STRUCTURED AUTOMATION (justified extra)

The repo already executes workflows server-side. UI must stay structured (Shopify Flow / HubSpot / Zapier), not a canvas rewrite.

---

## Build order

```
data-workspace
    → list migrations (contacts → … → quotes)
        → record-context (drawer)
            → action-routing polish (command create, board menu)
attention-engine  (can start after record-context identity slot exists; Home already has a list)
command           (after action-routing destinations are stable)
activation        (after create + Home region exist)
structured-automation  (independent after overlays/icons)
```

---

## Mapping to Pxx

| Capability | Phases |
|---|---|
| `data-workspace` | P03A–D, P04–P08 |
| `record-context` | P09–P10, P13 (inbox), P24 (Ask Evo context) |
| `action-routing` | P01 overlays, P02 create/AI entries, P11 board menu, P16 command |
| `attention-engine` | P12 pipeline attention, P15 activity queue, P17 Home |
| `command` | P16, P24 |
| `activation` | P23 |
| `structured-automation` | P19–P20 |
