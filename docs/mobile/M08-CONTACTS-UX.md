# M08 Contacts — UX

## Flows

1. **List** (CRM tab): load page 1 → search debounced 300ms → replace results → end-reached append with locks → pull-to-refresh keeps query.
2. **Show** (`/contact/[id]`): load record → mailto/tel when safe → Edit header if `crm.edit`.
3. **Create** (`/contact/new`): requires `crm.edit`; otherwise denial screen.
4. **Edit** (`/contact/[id]/edit`): same permission gate; load then save; duplicate-submit lock.

## Empty / error states

| State | Copy intent |
|---|---|
| Empty list | “No contacts yet” + role-aware body |
| Empty search | “Nothing matched that search.” |
| Offline / 5xx | User-facing; retry |
| 403 write | “You do not have permission to change contacts.” |
| 404 show | “This contact was not found in this workspace.” |
| Invalid id | “This contact link is invalid.” |

## Permissions UX

- Hide New / Edit when `!can('crm.edit')`.
- Deep-link to write routes still **does not** show a writable form.
- Server 403 remains the source of truth.

## Non-goals

- WhatsApp send from contact detail.
- Companies module, deals board, activity complete, thread show (G01–G04).
- Contact delete.
