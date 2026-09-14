# EvoCRM record workspace benchmark

| | |
|---|---|
| **Status** | Approved research |
| **Audited revision** | `a0b9a8571fed2a1cbe7bd98d58b47d043c4fc7b2` |
| **Companion** | [`ux-benchmark.md`](./ux-benchmark.md) Finding 5 · [`micro-ux-benchmark.md`](./micro-ux-benchmark.md) drawer / Esc / URL |
| **Reference pattern** | HubSpot + Attio (workspace + inspector) · Salesforce (Path / Convert / inline pencils) · Pipedrive (deal next-step) — **behavior and density only** |
| **Authority** | EvoCRM tokens. Product AI name is **Ask Evo**, not Breeze / Copilot / Einstein. |

---

## 1. KEEP full RecordShell · ADD QuickRecordDrawer

```
KEEP  FullRecordWorkspace  /crm/{object}/{id}
ADD   QuickRecordDrawer    from list / pipeline / inbox / activities / command
```

The full record is a **workspace**, not a form. The drawer is a **peek**, not a second editor.

| Surface | Verdict |
|---|---|
| `RecordShell` / `RecordPageFrame` / `AdaptiveWorkspaceShell` | **KEEP** |
| Show pages: contact, company, deal, lead, quote, ticket | **KEEP** |
| `CreateDrawer` | **KEEP** for create — it is not a record peek |
| `QuickRecordDrawer` | **ADD** — does not exist in code today |
| Replacing show routes with drawer-only CRM | **REJECT** |

**Evidence (live):** `components/crm/record-chrome.tsx` (`RecordShell`, `RecordActions`, `RecordBack`), `record-hub.tsx`, `record-workspace.tsx`, `record-properties.tsx`, `record-activity-panel.tsx`, `ask-evo-panel.tsx`. No `QuickRecordDrawer` / `RecordDrawer` under `resources/js`.

---

## 2. Drawer vs full workspace

| Rule | Full RecordShell | QuickRecordDrawer |
|---|---|---|
| **Job** | Do the work | Orient and jump |
| **Identity** | Yes | Yes |
| **Status / stage / Path** | Yes (lead Path + Convert stay here) | Status badge only — no Convert |
| **Owner** | Yes + change | Show + change-owner shortcut if the API already exists |
| **Essentials** | Full properties + custom attributes | Phone, email, amount, wilaya — object-specific, read-mostly |
| **Associations** | Full related lists | Compact links (company / contact / deal) |
| **Timeline** | Full ActivityTimeline + composer | Last 3 items + next action |
| **Ask Evo** | Rail on the record | Secondary shortcut, not the first orange block |
| **Deep edit** | Inline pencils, layout editor, quote lines, merge | **Forbidden** |
| **Quote builder / line items** | Deal + quote show | Quote **signal** only |
| **Layout editor / merge / import** | Settings + dedicated pages | Never |
| **URL** | `/crm/{object}/{id}` | Additive `?record={id}` on the host list/board/inbox |
| **Back** | `RecordBack` to the list | Explicit **Open full record** — Esc / overlay closes; not a history trap |
| **Width** | 3-pane adaptive | 480–560px right drawer |

**No deep edit in the drawer.** If the operator needs Path complete, convert, line items, merge, or layout, they open the full record.

---

## 3. Recommended full-workspace structure

Desktop (`AdaptiveWorkspaceShell` already supplies the pane switch `<lg`):

```
HEADER
  RecordBack · identity (name, object badge) · status / Path · owner
  Primary actions (one row): Note · Email · Call · Task · Meet
  Secondary: more menu · Open in Inbox / WhatsApp when relevant
  One filled accent at most

LEFT                         CENTER                         RIGHT
  Properties / essentials      Overview | Activities         Ask Evo (collapse)
  Associations                 | Intelligence                Related / quotes
  Custom attributes            Timeline + composer           Associations overflow
```

| Zone | Owns | Must not own |
|---|---|---|
| **Header** | Identity, status/Path, owner, `RecordActions` | Second Create, orange hero Ask Evo |
| **Left** | Essentials, attributes, associations | Timeline, quote line editor |
| **Center** | Overview / Activities / Intelligence; composer | Settings, layout admin |
| **Right** | Ask Evo rail + related | Primary edit surface |

**Mobbin (density only):**

- HubSpot 3-pane + Note / Email / Call / Task / Meet — [f215a882](https://mobbin.com/screens/f215a882-8c79-4bf8-8483-4d8ae465c3c1)
- Contact activities grouping — [f93e89bd](https://mobbin.com/screens/f93e89bd-1b63-4d1d-92d6-9753e9f4c8ba)
- Log call — [344a79cd](https://mobbin.com/screens/344a79cd-4663-471c-b710-dd920abd0718)
- Ask Evo rail shape — [7783b0d6](https://mobbin.com/screens/7783b0d6-ca17-40ef-89ea-bc8752e3a6fb)
- Salesforce Path + Convert — [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6)
- Salesforce inline pencils — [d61b0a8f](https://mobbin.com/screens/d61b0a8f-84b6-4c8f-b9a8-a3d2186b0e78)
- Activity composer — [45c8db2b](https://mobbin.com/screens/45c8db2b-5cd1-4b82-8df9-5cfd9135acef)

---

## 4. URL-addressable drawer

| Requirement | Spec |
|---|---|
| Open | Host URL + `?record={id}` (additive). Optional `?object=contact` if the host lists mixed types. |
| Close | Esc, overlay click, explicit Close — strip `record` from the query; stay on the list/board/inbox |
| Share | The peek URL is pasteable; refresh re-opens the same peek |
| Click vs peek | Row **click** stays **Open full record**. Peek is a control or command “Peek”. Do not steal the obvious click. |
| Focus | Trap inside the drawer; return to the peek control (`micro-ux-benchmark.md`) |
| `?create=1` | Unrelated; still opens `CreateDrawer` |

Do not use `#` only. Do not replace `/crm/{object}/{id}`.

---

## 5. ADOPT / ADAPT / REJECT

### HubSpot

| | |
|---|---|
| **ADOPT** | 3-pane workspace; quick actions Note / Email / Call / Task / Meet; activities grouping; AI as a **rail**, not a product name |
| **ADAPT** | Inspector depth becomes QuickRecordDrawer; Ask Evo not Breeze; DZD / wilaya stay EvoCRM |
| **REJECT** | Teal paint; Copilot/Breeze copy; CMS / datasets [1b68fa46](https://mobbin.com/screens/1b68fa46-fe8c-41ba-a4cf-06d9de230388) |

### Attio

| | |
|---|---|
| **ADOPT** | Fast peek from list/board; quiet inspector; associations as first-class |
| **ADAPT** | Peek is a drawer over DataWorkspace, not a new Attio-like canvas |
| **REJECT** | Replacing RecordShell with an Attio-only list-centric CRM |

### Salesforce

| | |
|---|---|
| **ADOPT** | Lead Path + Convert + Change Owner on the **full** lead record; inline pencils on the full record; activity composer icon row |
| **ADAPT** | Path chrome uses EvoCRM tokens; Convert stays a modal on the show page |
| **REJECT** | Slack Channel rail [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6); Einstein; Lightning density as paint; Path inside the peek drawer |

### Pipedrive

| | |
|---|---|
| **ADOPT** | Deal next-step / next activity visible on peek and on the full deal; stale when meaningful |
| **ADAPT** | Next activity is a line + shortcut, not a second scheduler product |
| **REJECT** | Green paint; a deal-only inspector that ignores contact/company |

---

## 6. Drawer slots (v1)

1. Identity (name, object badge)
2. Status / stage
3. Owner
4. Essentials (object-specific)
5. Associations
6. Recent (last 3)
7. Next action
8. Shortcuts: **Open full record** · Log activity · Ask Evo (secondary)

Hydrate from the existing show payload or a thin additive partial. Do not add a new REST resource unless a later PR’s AC says so.

---

## 7. Behavior that must not change

- Show-page URLs and Inertia component names
- Ask Evo POST `/crm/{object}/{id}/ask` and permissions
- Inline field PATCH / attribute bags
- Lead Path + Convert (`LeadPathTest`, `LeadConversionTest`)
- Quote send / revoke / public accept
- Record layout GET/PUT
- `CreateDrawer` + `?create=1`

Backend stays. Paint stays EvoCRM.
