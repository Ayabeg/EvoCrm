# EvoCrm API v1

Token API for a future iOS / Android client. **Web Inertia remains the system of record.** Controllers wrap the same CRM / Desk services the browser uses; they do not invent a second pipeline, quote acceptor, or chat engine.

Source: [Laravel Sanctum mobile tokens](https://laravel.com/docs/13.x/sanctum#mobile-application-authentication).

## Base URL

All routes are under `/api/v1`. Send JSON and a Sanctum bearer token:

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer {plain-text-token}
```

Unauthenticated requests return `401`. Wrong-workspace records return `404` (same as the web controllers). Missing product permissions return `403`. Validation errors return `422` with Laravel’s `{ message, errors }` shape.

## Authz

Tokens belong to a **Fortify user** and are stamped with `workspace:{id}`. Every authenticated request must present that ability for the user’s current workspace.

Writes reuse the same permission strings as the web app (`config/permissions.capabilities`) and the G4 policies (`ContactPolicy`, `DealPolicy`, `QuotePolicy`, plus `LeadPolicy` / `ActivityPolicy` where those writes exist):

| Surface | Safe methods | Writes |
| --- | --- | --- |
| contacts, leads, deals, activities, quotes | `crm.view` (default on for members) | `crm.edit` |
| threads / reply | (list is allowed) | `desk.manage` |
| devices, me, token revoke | authenticated user | — |

Import, Data Hub, tickets, SMS, warmup, and ads are **not** in v1. Public quote acceptance stays at `GET/POST /q/{token}` and is unchanged.

## Issue / revoke a token

```bash
curl -sS -X POST "$APP_URL/api/v1/auth/token" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@clinic.dz","password":"secret","device_name":"iPhone"}'
```

```json
{
  "data": {
    "token": "1|plainText…",
    "token_type": "Bearer",
    "user": { "id": 1, "name": "Lina", "email": "owner@clinic.dz", "role": "owner" },
    "workspace": { "id": 1, "name": "Evotechly", "slug": "evotechly-ab12c", "timezone": "Africa/Algiers" }
  }
}
```

Rate limit: 10 requests / minute. Email must be verified. Password check matches Sanctum’s mobile example (no second identity store).

```bash
curl -sS -X DELETE "$APP_URL/api/v1/auth/token" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

Returns `204` and deletes only the current token.

## Me + current workspace

```bash
curl -sS "$APP_URL/api/v1/me" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{
  "data": {
    "user": { "id": 1, "name": "Lina", "email": "owner@clinic.dz", "role": "owner" },
    "workspace": { "id": 1, "name": "Evotechly", "slug": "evotechly-ab12c", "timezone": "Africa/Algiers" },
    "permissions": ["crm.view", "crm.edit", "desk.manage"]
  }
}
```

## Contacts

Wraps `ContactIdentity::createUnique` and the same field rules as `ContactController`.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/contacts` | Paginated. Query: `q`, `page`, `per_page` (max 100). |
| `GET` | `/contacts/{id}` | Workspace-scoped `404`. |
| `POST` | `/contacts` | `201`. `first_name` required. |
| `PUT` | `/contacts/{id}` | Same body as create; optional `attributes`. |

```bash
curl -sS "$APP_URL/api/v1/contacts?q=amine" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"

curl -sS -X POST "$APP_URL/api/v1/contacts" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"first_name":"Amine","last_name":"Saidi","email":"amine@clinic.dz","phone":"0550188001"}'
```

List responses are `{ data: [...], meta: { current_page, per_page, total, last_page } }`.

## Leads board / qualify

The board is the existing deal pipeline (`PipelineManager::boardData`) — same engine as `/crm/deals/board`. Qualify wraps `LeadConverter::convert`.

| Method | Path |
| --- | --- |
| `GET` | `/leads/board` optional `pipeline` |
| `GET` | `/leads/{id}` |
| `POST` | `/leads/{id}/qualify` body: `mode` (`create`\|`link`), `pipeline_id`, `stage_id`, `owner_id`, `amount_cents` / `amount_dzd`, `deal_id` |

```bash
curl -sS "$APP_URL/api/v1/leads/board" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"

curl -sS -X POST "$APP_URL/api/v1/leads/12/qualify" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode":"create","amount_dzd":180000}'
```

## Deal show + stage move

Move calls `Deal::moveTo` (stage-property gate + activity + live health score).

```bash
curl -sS "$APP_URL/api/v1/deals/44" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"

curl -sS -X POST "$APP_URL/api/v1/deals/44/move" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"stage_id":7,"lost_reason":null}'
```

## Activities

Wraps `ActivityRecorder::record`. Create requires `contact_id` and/or `deal_id`.

| Method | Path | Query / body |
| --- | --- | --- |
| `GET` | `/activities` | `type`, `owner_id`, `contact_id`, `deal_id`, `date` (`today`\|`overdue`\|`YYYY-MM-DD`), `page`, `per_page` |
| `POST` | `/activities` | `type` (`note`\|`task`\|`call`\|`meeting`\|`email`), `subject`, `body`, `due_at`, `contact_id`, `deal_id` |

```bash
curl -sS -X POST "$APP_URL/api/v1/activities" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"note","body":"Called the clinic","contact_id":9,"deal_id":44}'
```

## Quotes (show / send)

Show is read-only. Send wraps `QuoteMailer::send`. **Do not use this API to accept a quote** — that remains `POST /q/{token}` via `QuoteAcceptor`.

```bash
curl -sS "$APP_URL/api/v1/quotes/3" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN"

curl -sS -X POST "$APP_URL/api/v1/quotes/3/send" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"to":"buyer@clinic.dz"}'
```

`to` is optional; it defaults to the deal contact’s email. `data.public_url` is the existing `/q/{token}` link when a public token exists.

## Inbox threads (reply)

Desk already has `DeskComposer::reply` and `/desk/threads/{thread}/reply`. The API wraps that path — it is **not** a second chat engine.

| Method | Path |
| --- | --- |
| `GET` | `/threads` |
| `POST` | `/threads/{id}/reply` body: `body` (required), `as_note`, `resolve` |

```bash
curl -sS -X POST "$APP_URL/api/v1/threads/18/reply" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"body":"On our way at 16:00"}'
```

`as_note=true` logs an internal note (same as the web desk). Outbound WhatsApp / SMS still go through Evolution / the SMS client; if Evolution is disconnected the message is stored as `failed`, matching the web composer.

## Devices (APNs / FCM)

Simple upsert on `(user_id, token)`.

```bash
curl -sS -X POST "$APP_URL/api/v1/devices" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"platform":"ios","token":"apns-or-fcm-device-token"}'
```

`provider` is optional (`apns` or `fcm`). Defaults: iOS → `apns`, Android → `fcm`. The push token is stored; v1 does not send notifications.

## Out of scope (v1)

- Contact / deal **import** (web only)
- Data Hub / PostHog product analytics
- Tickets, SMS settings, warmup, ads
- Redesigning Inertia, public `/q/{token}`, or `/book/{slug}`

## Tests

```bash
php artisan test --filter='Api/V1|Sanctum|ApiV1'
```
