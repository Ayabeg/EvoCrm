# EvoCRM permission matrix

Authorization is **not** a classic ACL UI per record. It is:

1. Laravel `auth` + `verified` on the product group (`routes/web.php`).
2. `EnforceProductPermissions` mapping route **name prefixes** → capability keys.
3. `User::canPermission($key)` using role defaults from `config/permissions.php` plus member JSON grants.
4. `EnforceSimpleMode` 403 on blocked paths when `workspace.simple_mode`.
5. Extra middleware: `can-manage-settings` (owner/admin), `password.confirm` (security), policies on Contact/Company/Lead/Deal/Quote/Activity for workspace scoping.
6. Owner always returns true for every capability. `[CONFIRMED-CODE]` `User::canPermission`

Confidence: **CONFIRMED IN CODE** unless marked OBSERVED IN UI or UNKNOWN.

## Roles

| Role | Settings manage | Default capabilities (`config/permissions.php`) |
|------|-----------------|--------------------------------------------------|
| owner | yes | all 16 keys true |
| admin | yes | all except `settings.permissions` |
| member | no | `crm.view`, `reports.manage` only |

Local seed: owner `owner@evosales.local` (all caps); member `sara@evosales.local`. Member UI **not crawled** this session (UNKNOWN / REQUIRES TESTING for member chrome).

Shared Inertia `auth.capabilities` is the filtered list of keys the user canPermission. Local owner crawl: 16 items, first `crm.view`. `[CONFIRMED-UI]`

## Capability → product area

| Permission | View (GET safe) | Create/Edit (non-GET crm.*) | Delete | Export | Bulk | Admin/special |
|------------|-----------------|-----------------------------|--------|--------|------|----------------|
| crm.view | CRM GET pages (middleware returns null on safe methods) | no | | | | |
| crm.edit | | POST/PUT/DELETE under `crm.*` except specialized | quote revoke etc. | | | Create menu quote gated `canCreateQuote(capabilities)` |
| crm.export | | | | `crm.contacts.export`, `crm.deals.export` | | |
| crm.import | import GET also requires import (name contains `.import`) | import POST | | | | |
| crm.merge | merge GET | merge POST | | | | |
| crm.bulk | | bulk POST | | | bulk | |
| desk.manage | GET inbox allowed (safe) | reply, ticket-from-thread, connectors POST | | | | |
| reports.manage | GET reports allowed | dashboards + report-builder mutations | dashboard delete | | | report-builder GET is **not** safe-exception — wait: `$request->isMethodSafe() return null` happens **before** report-builder check. So GET report-builder does **not** need reports.manage. It is 403 from **SimpleMode**, not permission, on this seed. `[CONFIRMED-CODE]` |
| automation.manage | GET workflows allowed | workflow mutations | destroy/toggle | | | |
| ads.manage | GET ads allowed (unless SimpleMode) | ads.sync, segment sync-meta | | | | |
| outbound.manage | GET outbound allowed | mailbox/campaign/sequence mutations | deletes | | | warmup GET blocked by SimpleMode not this key |
| settings.integrations | many settings GET allowed | settings POST/PUT (default settings.*) | disconnect Meta/WA | | | |
| settings.people | people GET uses can-manage-settings middleware not this key alone | invite/role/remove | remove | | | adminOnly nav |
| settings.pipelines | GET pipelines | stage CRUD | destroy | | | |
| settings.attributes | GET attributes; record-layout writes | attribute CRUD | destroy | | | |
| settings.permissions | GET | PUT member grants | | | | owner default only |

Safe GET generally **does not** require the matching manage/edit capability. A member with only `crm.view` can open CRM list pages if simple mode and nav allow, but POST create 403s. `[CONFIRMED-CODE]` Not OBSERVED IN UI for member.

## Simple mode overlay (independent of capabilities)

When `simple_mode` true, `SimpleMode::blocks()` 403s `[CONFIRMED-BOTH]`:

- `/crm/tickets*`
- `/ads*`
- `/outbound/warmup*`
- `/crm/report-builder*`
- route name `desk.ticket.open`
- names ending `.ask`, containing `draft-email`, `ask-evo`, `ask-evo.context`

Owner still 403s those URLs. Turning off simple mode is Settings → General.

## Policy layer

`ContactPolicy`, `CompanyPolicy`, `LeadPolicy`, `DealPolicy`, `QuotePolicy`, `ActivityPolicy` — workspace membership via `AuthorizesWorkspaceCrmRecord`. `[CONFIRMED-CODE]` Record-level owner-only edit: UNKNOWN without reading each policy in full (see individual screen specs).

## Nav vs URL

Members may hide Settings People (adminOnly) but URL is still 403 via `EnsureUserCanManageSettings`. `[CONFIRMED-CODE]`

SMS settings also `requiresSmsFeature` which is false in simple mode — nav hidden; URL `/settings/sms` still 200 for owner in crawl `[CONFIRMED-UI]` because SimpleMode::blocks does not include `/settings/sms`. Feature flag is nav/IA only for SMS.

## UNKNOWN / REQUIRES TESTING

- Member login chrome (simple nav vs full)
- Policy deny when record is other workspace (should 404/403)
- `permissions: ['*']` on member
- API v1 token of member vs owner
