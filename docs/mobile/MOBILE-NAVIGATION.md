# Mobile Navigation

**AUTHORITATIVE CLIENT STACK:** Expo Router tabs (M06R). IA unchanged from PR #233.  
**Baseline:** `4d2976befc7a94c267528e4a1fa7a810fe45e4a8`  
**Recommendation:** **HOME / CRM / INBOX / ACTIVITIES / MORE**

## 1. Research inputs

### Web product (code)

- Simple Mode rail: Home / Contacts / Deals / Inbox / Quotes (`EVOCRM_PRODUCT_READY.md`)
- Full sidebar groups: Home · CRM · Communication · Sales · Automation · More · Settings (`current-system-map.md`, `design-system.md`)
- Activities are the task spine (`OBJECT_MODEL`: Home next steps = open tasks)

### Mobbin iOS (see research docs)

Common patterns in Attio, Jobber, monday.com, Deel, ClickUp, OpenPhone, Asana:

- 4–5 bottom tabs
- Home / work queue as first tab
- Messaging or Inbox as dedicated tab when chat is core
- Overflow “More” / “Menu” for secondary surfaces
- Avoid 6+ tabs

## 2. Options considered

| Option | Tabs | Pros | Cons |
|---|---|---|---|
| **A (recommended)** | HOME CRM INBOX ACTIVITIES MORE | Matches daily loop; activities visible; quotes in More | CRM hub must switch objects |
| B | HOME CONTACTS DEALS INBOX MORE | Closer to Simple Mode | Loses activities tab; tasks buried |
| C | HOME PIPELINE INBOX TASKS PROFILE | Strong ops focus | Weak contacts entry |
| D | Mirror full web sidebar | Familiar to power users | Unusable on phone |

## 3. Recommended structure

```
[ HOME ] [ CRM ] [ INBOX ] [ ACTIVITIES ] [ MORE ]
```

| Tab | Stack roots | Badge |
|---|---|---|
| HOME | Home | Count of attention items (when API) |
| CRM | Hub → Contacts / Leads / Deals / Board | — |
| INBOX | Threads → Thread | Unread threads |
| ACTIVITIES | Queue → Create | Overdue count |
| MORE | Quotes, Search, Profile, Help, Sign out | — |

## 4. CRM hub pattern

Single **CRM** tab with top segmented control or nested top tabs:

`Contacts | Leads | Deals`

Deals offers list/board toggle (board uses existing `/api/v1/leads/board` until deals board alias exists).

## 5. Global affordances

- FAB or header **Create** on CRM / Activities (contact, task, note)
- Search entry from MORE (and HOME header when G11 lands)
- Deep links: `evocrm://contacts/{id}`, `deals/{id}`, `threads/{id}`, `activities/{id}`

## 6. More tab contents (V1)

1. Quotes  
2. Search (when ready)  
3. Companies (when ready)  
4. Profile (name, email, role, workspace)  
5. Open in browser (workspace URL)  
6. Sign out

Admin settings: **not** in app — link out.

## 7. Decision record

Proposed for approval in `EXECUTIVE-DECISION.md` §51.5. Alternative B acceptable if product insists on Quotes in the primary five — then fold Activities into HOME (worse for overdue visibility).
