# Mobile API Gap Matrix

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript (M06R). This matrix is preserved from PR #233 and revalidated against `routes/api.php` on `fa13a64`.  
**Baseline:** `4d2976befc7a94c267528e4a1fa7a810fe45e4a8` · Prefer extending `/api/v1` only · **Do not invent these routes in the Expo client**

## Priority legend

- **P0** — blocks V1 complete loop  
- **P1** — V1.1 / polish  
- **P2** — later  
- **Skip** — not mobile / unsafe

Estimates are **engineering estimates** for backend API wrap work only (not mobile UI).

| ID | Mobile capability | Needed endpoint(s) | Wrap existing | Status now | Priority | Est. | Notes |
|---|---|---|---|---|---|---|---|
| G01 | Home feed | `GET /api/v1/home` | `HomeDashboardBuilder` | MISSING | P0 | M | Return attention, tasks, unread, pipeline snapshot JSON |
| G02 | Deals list | `GET /api/v1/deals` | DealController@index query | MISSING | P0 | M | Pagination + q + stage filters |
| G03 | Activity complete | `POST /api/v1/activities/{id}/complete` | Crm ActivityController@complete | MISSING | P0 | S | |
| G04 | Thread show | `GET /api/v1/threads/{id}` | Desk thread+messages | MISSING | P0 | M | Include messages chronologically |
| G05 | Thread mark read | `POST /api/v1/threads/{id}/read` | unread_count clear | MISSING | P1 | S | |
| G06 | Leads list | `GET /api/v1/leads` | LeadController@index | MISSING | P1 | M | |
| G07 | Lead create/update | `POST/PUT /api/v1/leads` | LeadController | MISSING | P1 | M | |
| G08 | Deal create/update | `POST/PUT /api/v1/deals` | DealController | MISSING | P1 | M | |
| G09 | Quotes list | `GET /api/v1/quotes` | QuoteController@index | MISSING | P1 | S | |
| G10 | Companies CRUD | `/api/v1/companies` | CompanyController | MISSING | P1 | M | |
| G11 | Search | `GET /api/v1/search` | CommandSearchController | MISSING | P1 | M | |
| G12 | Contact delete | `DELETE /api/v1/contacts/{id}` | policy delete | MISSING | P2 | S | Optional |
| G13 | Device delete | `DELETE /api/v1/devices` | Device | MISSING | P1 | XS | Logout cleanup |
| G14 | Push send pipeline | internal | Device + notifications | MISSING | P2 | L | After taxonomy; quiet hours |
| G15 | Activity attendance | `POST .../attendance` | web | MISSING | P2 | S | |
| G16 | Ask Evo | `POST /api/v1/.../ask` | AskEvoController | MISSING | P2 | M | Coord web P23 |
| G17 | Tickets | `/api/v1/tickets` | TicketController | MISSING | P2 | L | |
| G18 | Ads / outbound / settings secrets | — | — | UNSAFE / Skip | Skip | — | Stay web |
| G19 | Desk iframe API | — | — | WEB-COUPLED | Skip | — | Forbidden |

## Dependency order (backend before mobile screens)

```
G01 Home ──────────────► Home tab
G02 Deals list ─────────► CRM deals (board may ship first via existing leads/board)
G03 Activity complete ──► Activities tab done states
G04 Thread show ────────► Inbox detail (reply alone is insufficient UX)
G06–G11 ───────────────► V1.1
G14 ───────────────────► after device register proven
```

## Non-gaps (already sufficient for slice)

| Surface | Endpoints |
|---|---|
| Auth | token store/destroy, me |
| Contacts | index/store/show/update |
| Lead qualify + board | board, show, qualify |
| Deal move | show, move |
| Activities create | index, store |
| Quote send | show, send |
| Inbox reply | threads index, reply |
| Device register | devices store |

## Contract rules for future gaps

1. Same JSON error shapes as `docs/api-v1.md`
2. Same permission strings & G4 policies
3. Workspace 404 semantics
4. Update `docs/api-v1.md` in the same PR as routes
5. Pest filter `Api/V1` must cover new endpoints
