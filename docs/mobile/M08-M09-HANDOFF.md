# M08 → M09 handoff

M08 Contacts is **merged and frozen** on `main` (PR #249 → `d2809ab7e81cc923a8d1ad13de420f7591faa80c`).

## Stable after M08

- Auth + workspace (M07) unchanged
- Contacts module under `mobile/features/contacts/`
- Catalog keys: `contactsIndex`, `contactsShow`, `contactsStore`, `contactsUpdate`
- Permission key for writes: `crm.edit` (server authoritative)
- `lead_status` is free text (max 40) — do not invent enums without a backend change

## Intentional gaps for later milestones

| Gap | Suggested owner |
|---|---|
| Companies list/show | **M09 candidate** (READY `/api/v1` company endpoints) |
| Inbox thread show | Roadmap M09 historically — **blocked on G04** |
| Home attention / next tasks | G01 |
| Deals list / pipeline move | G02 |
| Activity complete | G03 |
| Contact delete | Only if `/api/v1` gains delete |
| WhatsApp actions on contact | Product decision; not M08 |

## Risks / watchouts

1. List race logic depends on generation refs — keep helpers covered when changing search.
2. Custom `attributes` on update exist server-side but are **not** edited in M08 UI.
3. Device visual QA still owed (`M08-VISUAL-QA.md`).

## Suggested M09 first slice (READY path)

Companies list + show against existing `/api/v1` company endpoints only — mirror Contacts patterns (search race, permissions, errors, Mobbin map row). Do not invent endpoints. If product prefers Inbox instead, unblock G04 first.
