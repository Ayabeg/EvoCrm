# M08 Contacts — API audit

**Branch tip audited:** `99ed61ea715675ccd54ea6edadc4bfb6526d5397` (`feat/m08-contacts`)  
**Sources:** `app/Http/Controllers/Api/V1/ContactController.php`, `ApiPayload::contact`, mobile catalog `contactsIndex|Show|Store|Update`.

## Endpoints used by mobile

| Action | Method | Catalog key | Auth / policy |
|---|---|---|---|
| List | `GET /api/v1/contacts` | `contactsIndex` | Workspace session; list scoped by `forWorkspace` |
| Show | `GET /api/v1/contacts/{id}` | `contactsShow` | `ensureInWorkspace` |
| Create | `POST /api/v1/contacts` | `contactsStore` | `authorize('create', Contact::class)` |
| Update | `PUT /api/v1/contacts/{id}` | `contactsUpdate` | `authorize('update', $contact)` + workspace |

**Not in v1 / out of M08:** contact delete, ContactIdentity as a separate mobile resource, WhatsApp deep links.

## List contract

- Query: `q` (trim; LIKE on first_name, last_name, email, phone, phone_e164), `page`, `per_page` (default **25**, clamp **1..100**).
- Sort: `orderBy('first_name')->orderBy('id')` — client must not invent alternate sorts.
- Response: `{ data: Contact[], meta: pagination }` via `ApiPayload`.

## Write contract

Validated fields (store/update):

| Field | Rules |
|---|---|
| `first_name` | required, string, max 120 |
| `last_name` | nullable, string, max 120 |
| `email` | nullable, email |
| `phone` | nullable, string, max 40 |
| `company_id` / `owner_id` | nullable integer; company must exist in workspace |
| `city` / `wilaya` | nullable, string, max 80 |
| `lead_status` | **nullable free text**, string, **max 40** — **not an enum** |
| `unanswered` | update only, sometimes boolean |
| `attributes` | update only, nullable array (custom attributes service) |

Create goes through `ContactIdentity::createUnique` (server-side uniqueness). Mobile must not re-implement identity rules.

## Permissions (client vs server)

- Mobile gates create/edit UI with `can('crm.edit')`.
- **Server remains authoritative** — 403 must still be handled honestly if a stale client navigates to `/contact/new` or `/edit`.
- 401 uses the existing M07 session-expiry path; contact screens do not invent a second logout.

## Payload honesty

Mobile maps only documented `ApiPayload::contact` fields (display_name, company_name, owner_name, phones, lead_status, etc.). No invented ContactIdentity duplication on the client.

## Mobile hardening implications

1. Search race: generation + query key; stale responses discarded.
2. Pagination: pending-page lock + dedupe by id on append.
3. Refresh: replace mode, preserves current query, does not append.
4. mailto/tel: builders reject empty/malformed; open failures do not crash.
5. `lead_status`: free-text field + hint; no fake status picker.
6. Errors: user-facing copy for 401/403/404/422/offline/5xx; no Laravel/SQL internals.
