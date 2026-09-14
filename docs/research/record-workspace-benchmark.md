# Record workspace benchmark (reconstructed)

**Status:** Reconstructed 2026-09-14. Original file never existed on `main` or any searched branch.  
**Provenance:** Approved research summary + live `RecordShell` / `RecordPageFrame` + `docs/evocrm-mobbin-contract.md` contact/lead screens.  
**Honesty:** No invented scores. Keep the full workspace; add a peek drawer.

---

## Reference pattern (behavior only)

HubSpot + Attio:

- **Full record is a workspace**, not a form. Identity + properties | timeline / overview | AI + associations.
- **Quick inspector** from lists, boards, inbox, activities, and command — identity, status, owner, essentials, associations, recent, next action, shortcuts. **Not** deep edit.
- URL / back are explicit. Peek does not replace `/crm/{object}/{id}`.

Density refs already locked:

- HubSpot contact 3-pane + quick actions — [f215a882](https://mobbin.com/screens/f215a882-8c79-4bf8-8483-4d8ae465c3c1)
- AI rail shape — [7783b0d6](https://mobbin.com/screens/7783b0d6-ca17-40ef-89ea-bc8752e3a6fb) *(ID as cited in `evocrm-mobbin-contract.md`)*
- Salesforce path + Convert — [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6)
- Activity composer — [344a79cd](https://mobbin.com/screens/344a79cd-4663-471c-b710-dd920abd0718)

Do not ship Breeze / Copilot / Einstein names. Product name is **Ask Evo**.

---

## Current implementation (verified)

| Layer | Path | Role |
|---|---|---|
| Frame | `components/crm/record-hub.tsx` (`RecordPageFrame`, `RecordIdentity`, …) | Page chrome |
| Shell | `components/crm/record-chrome.tsx` (`RecordShell`, `RecordActions`, `RecordBack`) | 3-pane via `AdaptiveWorkspaceShell` |
| Facts / timeline | `record-workspace.tsx`, `record-activity-panel.tsx`, `record-properties.tsx` | Domain panels |
| Ask Evo | `ask-evo-panel.tsx` | Capability-gated POST `/crm/{object}/{id}/ask` |
| Create | `create-drawer.tsx` | **Create only**, not a record peek |
| Layout editor | `record-layout-editor.tsx` + `/crm/record-layouts/{entity}` | Stays |

Show pages using the full workspace:

- `pages/crm/contacts/show.tsx`
- `pages/crm/companies/show.tsx`
- `pages/crm/deals/show.tsx` (line items, quotes, splits)
- `pages/crm/leads/show.tsx` (Path + convert dialogs)
- `pages/crm/quotes/show.tsx` (line editor in center)
- `pages/crm/tickets/show.tsx` (desk thread preview)

**`QuickRecordDrawer` / `RecordDrawer` do not exist in code.** They are specified in `docs/design-system.md` and `docs/ui-migration-plan.md` P09 only.

---

## Approved target

```
KEEP  FullRecordWorkspace on /crm/{object}/{id}
ADD   QuickRecordDrawer from list / pipeline / inbox / activities / command
```

Drawer contents (slots, not a new API if possible):

1. Identity (name, object badge)
2. Status / stage
3. Owner
4. Essentials (phone, email, amount — object-specific)
5. Associations (company / contact / deal links)
6. Recent (last 3 timeline items)
7. Next action
8. Shortcuts: Open full record, Log activity, Ask Evo (secondary)

**Not in the drawer:** layout editor, custom-property admin, quote line-item builder, merge, import.

URL: stay on the list (`?record={id}` additive). Esc / overlay closes. Back is explicit (“Open full record”), not a browser-history trap.

---

## Ownership

| Owner | Owns |
|---|---|
| `ds/chrome` or `ds/workspace` | `QuickRecordDrawer` shell, focus trap, URL helper |
| `components/crm` | Identity/status/association slots reused from record-hub |
| Domain page | When to open, which object, Inertia partial reload if needed |
| Laravel | Existing show/update/ask routes — **no new resource** required for v1 if the drawer hydrates from the existing show payload or a thin JSON partial later |

Do not build a second record property editor.

---

## Behavior that must not change

- Show-page URLs and Inertia component names
- Ask Evo POST shapes and permissions
- Inline field PATCH / attribute bags
- Lead Path + Convert (`LeadPathTest`, `LeadConversionTest`)
- Quote send / revoke / public accept
- Record layout GET/PUT
