# EvoCRM route matrix

`php artisan route:list` reported **337** routes on 2026-09-21 including vendor (Fortify, Inertia DevTools, storage). Application routes live in `routes/web.php`, `routes/settings.php`, `routes/api.php`.

This matrix lists **user-facing Inertia/HTML routes** and important JSON/mutation endpoints. Vendor health (`/up`), storage, and Inertia DevTools are system routes, not screens.

Query parameters: only keys actually supported in list-query / observed props. See `Screen/02-NAVIGATION-MAP.md`.

Legend — Runtime column is seed **owner + simple_mode=true** crawl unless noted.

## Auth / Fortify

| Method | URI | Name | Page / action | Authz | Screen | Runtime |
|--------|-----|------|---------------|-------|--------|---------|
| GET | `/login` | login | `auth/login` | guest | SCR-AUTH-001 | 200 guest; 302 authed |
| POST | `/login` | login.store | Fortify | guest | | 200 `{two_factor}` |
| GET | `/register` | register | `auth/register` | guest | SCR-AUTH-002 | 302 authed |
| GET | `/forgot-password` | password.request | `auth/forgot-password` | guest | SCR-AUTH-003 | 302 authed |
| GET | `/reset-password/{token}` | password.reset | `auth/reset-password` | guest | SCR-AUTH-004 | `[UNVERIFIED]` |
| GET | `/verify-email` | verification.notice | `auth/verify-email` | auth | SCR-AUTH-005 | `[UNVERIFIED]` |
| GET/POST | `/two-factor-challenge` | two-factor.login | `auth/two-factor-challenge` | | SCR-AUTH-006 | |
| GET | `/user/confirm-password` | password.confirm | `auth/confirm-password` | auth | SCR-AUTH-007 | 302 from security |
| GET | `/auth/google` | auth.google | redirect | | | 404 if unconfigured `[CONFIRMED-CODE]` |
| GET | `/auth/google/callback` | auth.google.callback | | | | |
| POST | `/logout` | logout | | auth | OVR-SHELL-004 | `[UNVERIFIED]` |

## Public

| Method | URI | Name | Page | Screen | Runtime |
|--------|-----|------|------|--------|---------|
| GET | `/q/{token}` | quotes.public.show | `public/quote` | SCR-PUB-001 | `[UNVERIFIED]` token |
| POST | `/q/{token}/accept` | quotes.public.accept | | | |
| GET | `/book/{slug}` | meetings.public.show | `public/book` | SCR-PUB-002 | |
| POST | `/book/{slug}` | meetings.public.store | throttle 20/1 | | |
| GET | `/book/{slug}/done` | meetings.public.done | `public/book-done` | SCR-PUB-003 | |
| GET | `/unsubscribe` | unsubscribe | | SCR-PUB-004 | |
| GET | `/outbound/t/{token}.gif` | outbound.track.open | pixel | system | |
| GET | `/outbound/c/{token}` | outbound.track.click | | system | |
| GET | `/track/{slug}/visit.gif` | funnel.track.visit | | system | |
| GET/POST | `/webhooks/evolution/{webhookKey}` | webhooks.evolution | CSRF except | system | |
| GET/POST | `/webhooks/meta/leads/{webhookKey}` | webhooks.meta.leads | | system | |
| POST | `/webhooks/outbound/bounces/{webhookKey}` | webhooks.outbound.bounces | | system | |

## Home / shell JSON

| Method | URI | Name | Controller | Screen | Runtime |
|--------|-----|------|------------|--------|---------|
| GET | `/` | home | redirect dashboard | | 302 |
| GET | `/dashboard` | dashboard | HomeController | SCR-HOME-001 | 200 `home` |
| POST | `/dashboard/activation/dismiss` | | ActivationDismissalController | | `[UNVERIFIED]` |
| GET | `/crm/command/search` | | CommandSearchController | OVR-SHELL-001 | `[UNVERIFIED]` |
| GET | `/ask-evo/context` | ask-evo.context | AskEvoController | OVR-SHELL-005 | 403 simple |
| POST | `/ask-evo` | ask-evo | | | 403 simple |
| GET | `/crm/records/{type}/{id}/peek` | | QuickRecordController | OVR-SHELL-006 | `[UNVERIFIED]` |
| GET | `/crm/quick-record-drawer/harness` | | QuickRecordHarnessController | SCR-DEV-001 | 200 local |

## CRM lists / records

| Method | URI | Name | Page | Screen | Runtime |
|--------|-----|------|------|--------|---------|
| GET | `/crm/contacts` | crm.contacts.index | crm/contacts/index | SCR-CONTACT-001 | 200; `?create=1` |
| GET | `/crm/contacts/{contact}` | crm.contacts.show | show | SCR-CONTACT-002 | 200 /1 |
| GET | `/crm/contacts/import` | crm.contacts.import | import | SCR-CONTACT-003 | 200 |
| GET | `/crm/contacts/import/{batch}` | crm.contacts.import.show | | | `[UNVERIFIED]` |
| GET | `/crm/contacts/duplicates` | crm.contacts.merge.index | duplicates | SCR-CONTACT-004 | 200 |
| GET | `/crm/contacts/merge/{survivor}/{absorbed}` | crm.contacts.merge.show | merge | SCR-CONTACT-005 | bare `/merge` 404 |
| GET | `/crm/contacts/export` | crm.contacts.export | csv | | `[UNVERIFIED]` |
| POST | `/crm/contacts` | crm.contacts.store | | OVR-CONTACT-001 | crm.edit |
| PUT | `/crm/contacts/{contact}` | crm.contacts.update | | | |
| PUT | `/crm/contacts/{contact}/attributes` | | | | |
| POST | `/crm/contacts/bulk` | crm.contacts.bulk | | | crm.bulk |
| POST | `/crm/contacts/merge` | crm.contacts.merge.store | | | crm.merge |
| GET | `/crm/companies` | crm.companies.index | index | SCR-COMPANY-001 | 200 |
| GET | `/crm/companies/{company}` | crm.companies.show | show | SCR-COMPANY-002 | 200 |
| POST/PUT | companies store/update/attributes/enrich/ask | | | | |
| GET | `/crm/deals` | crm.deals.index | index | SCR-DEAL-001 | 200 |
| GET | `/crm/deals/board` | crm.deals.board | board | SCR-DEAL-002 | 200 |
| PUT | `/crm/deals/board/options` | crm.deals.board.options | | | |
| GET | `/crm/deals/{deal}` | crm.deals.show | show | SCR-DEAL-003 | 200 |
| GET | `/crm/deals/import` | crm.deals.import | import | SCR-DEAL-004 | 200 |
| GET | `/crm/deals/export` | crm.deals.export | | | |
| POST | `/crm/deals/{deal}/move` | crm.deals.move | | | |
| POST/PUT/DELETE | line-items, splits, suggestions, ask, draft-email | | | | |
| GET | `/crm/leads` | crm.leads.index | index | SCR-LEAD-001 | 200 |
| GET | `/crm/leads/{lead}` | crm.leads.show | show | SCR-LEAD-002 | 200 |
| GET | `/crm/leads/captures` | crm.leads.captures | captures | SCR-LEAD-003 | 200 |
| GET | `/leads` | | redirect board | SCR-LEAD-004 | 302 |
| POST | `/crm/leads/{lead}/qualify` | crm.leads.qualify | | | |
| GET | `/crm/quotes` | crm.quotes.index | index | SCR-QUOTE-001 | 200 |
| GET | `/crm/quotes/{quote}` | crm.quotes.show | show | SCR-QUOTE-002 | 200 |
| GET | `/crm/quotes/{quote}/preview` | crm.quotes.preview | | | `[UNVERIFIED]` |
| POST | `/crm/deals/{deal}/quotes` | crm.quotes.store | | OVR-QUOTE-001 | |
| POST | `/crm/quotes/{quote}/send` `/revoke` | | | | |
| GET | `/crm/tickets` | crm.tickets.index | index | SCR-TICKET-001 | **403** simple |
| GET | `/crm/tickets/board` | crm.tickets.board | board | SCR-TICKET-002 | **403** |
| GET | `/crm/tickets/{ticket}` | crm.tickets.show | show | SCR-TICKET-003 | 404 id=1 (no row) / 403 list |
| GET | `/crm/activities` | crm.activities.index | index | SCR-ACTIVITY-001 | 200 |
| POST | `/crm/activities` | store | | | |
| POST | `/crm/activities/{activity}/complete` | complete | | | |
| GET | `/crm/segments` | crm.segments.index | index | SCR-SEGMENT-001 | 200 |
| GET | `/crm/segments/{segment}` | show | show | SCR-SEGMENT-002 | 200 |
| GET | `/crm/workflows` | crm.workflows.index | index | SCR-WF-001 | 200 |
| GET | `/automation` | automation | same | SCR-WF-001 | `[UNVERIFIED]` crawl |
| GET | `/conversations` | crm.conversations | crm/conversations | SCR-INBOX-002 | `[UNVERIFIED]` this crawl used wrong path first |

List query params (GET lists): `q,page,view,filter_id,filter_groups,sort,direction,owner,created,last_activity,status,stage,city,wilaya,unanswered,unassigned,priority,channel,attention,pipeline,create`.

## Desk / reports / ads / outbound

| Method | URI | Name | Page | Screen | Runtime |
|--------|-----|------|------|--------|---------|
| GET | `/inbox` | desk.inbox | desk/inbox | SCR-INBOX-001 | 200 |
| GET | `/desk` | desk.index | same family | | `[UNVERIFIED]` |
| POST | `/desk/threads/{thread}/reply` | desk.reply | | | desk.manage |
| GET | `/reports` `/crm/reports` `/reports/{category}` | reports | crm/reports | SCR-REPORT-001 | 200 |
| GET | `/reports/funnels` | reports.funnels | reports/funnels/index | SCR-REPORT-003 | 200 |
| GET | `/crm/report-builder` | crm.report-builder.index | crm/report-builder | SCR-REPORT-002 | **403** simple |
| GET | `/ads` and nested | ads.* | ads/* | SCR-ADS-* | **403** simple |
| POST | `/ads/sync` | ads.sync | | | ads.manage |
| GET | `/outbound` | outbound.index | outbound/index | SCR-OUT-001 | 200 |
| GET | `/outbound/mailboxes` | | mailboxes/index | SCR-OUT-002 | 200 |
| GET | `/outbound/domains` | | domains | SCR-OUT-003 | 200 |
| GET | `/outbound/templates` `/{id}` | | | SCR-OUT-004/005 | 200 |
| GET | `/outbound/sequences` `/{id}` | | | SCR-OUT-006/007 | 200 |
| GET | `/outbound/campaigns` `/{id}` | | | SCR-OUT-008/009 | 200 |
| GET | `/outbound/lists` | | | SCR-OUT-010 | 200 |
| GET | `/outbound/outbox` | | | SCR-OUT-011 | 200 |
| GET | `/outbound/replies` | | | SCR-OUT-012 | 200 |
| GET | `/outbound/suppressions` | | | SCR-OUT-013 | 200 |
| GET | `/outbound/quiet-hours` | | | SCR-OUT-014 | 200 |
| GET | `/outbound/warmup` | outbound.warmup.index | warmup | SCR-OUT-015 | **403** simple |

Outbound mutations (store/update/toggle/send/enroll/etc.) are named in `routes/web.php` ~295–353. Full field-level contracts: outbound screen specs.

## Settings

| GET URI | Name | Page | Screen | Runtime |
|---------|------|------|--------|---------|
| `/settings` | | redirect profile | | 302 |
| `/settings/profile` | profile.edit | settings/profile | SCR-SET-001 | 200 |
| `/settings/security` | | settings/security | SCR-SET-002 | 302 confirm-password |
| `/settings/appearance` | | appearance | SCR-SET-003 | 200 |
| `/settings/workspace` | settings.workspace | workspace | SCR-SET-004 | 200 |
| `/settings/people` | settings.people | people | SCR-SET-005 | 200 |
| `/settings/meetings` | settings.meetings | meetings | SCR-SET-006 | 200 |
| `/settings/setup` | settings.setup.start | wizard | SCR-SET-007 | 302 `/settings/setup/start` |
| `/settings/setup/{provider}` | settings.setup.show | wizard | | |
| `/settings/attributes` | settings.attributes | attributes | SCR-SET-008 | 200 |
| `/settings/pipelines` | settings.pipelines | pipelines | SCR-SET-009 | 200 |
| `/settings/qualify` | settings.qualify | qualify | SCR-SET-010 | 200 |
| `/settings/quotas` | settings.quotas | quotas | SCR-SET-011 | 200 |
| `/settings/record-layouts` | settings.record-layouts | record-layouts | SCR-SET-012 | 200 |
| `/settings/playbooks` | settings.playbooks | playbooks | SCR-SET-013 | 200 |
| `/settings/evolution` | settings.evolution | evolution | SCR-SET-014 | 200 |
| `/settings/whatsapp` | settings.whatsapp | whatsapp | SCR-SET-015 | 200 |
| `/settings/whatsapp-business` | settings.whatsapp-business | whatsapp-business | SCR-SET-016 | 200 |
| `/settings/meta` | settings.meta | meta | SCR-SET-017 | 200 |
| `/settings/channels` | settings.channels | channels | SCR-SET-018 | 200 |
| `/settings/sms` | settings.sms | sms | SCR-SET-019 | 200 |
| `/settings/apps` | settings.apps | apps/index | SCR-SET-020 | 200 |
| `/settings/apps/meta` | settings.apps.meta | apps/meta | SCR-SET-021 | 302 apps |
| `/settings/connectors` | settings.connectors | connectors | SCR-SET-022 | 200 |
| `/settings/permissions` | settings.permissions | permissions | SCR-SET-023 | 200 |
| `/settings/audit` | settings.audit | audit | SCR-SET-024 | 200 |
| `/settings/system-health` | settings.system-health | system-health | SCR-SET-025 | 200 |

OAuth: `GET /auth/meta`, callback, instagram — `settings.integrations` on those names.

## API v1 (mobile, not Inertia screens)

Prefix `/api/v1`: auth token, me, contacts CRUD, leads board/show/qualify, deals show/move, activities, quotes show/send, threads, devices. Sanctum. Documented in `docs/api-v1.md`. Not given SCR-* IDs (non-visual).

## System / non-visual

- `GET /up` health
- `storage/{path}`
- `_inertia/devtools/*`
- Funnel `GET /api/funnels/{funnel}` (web.php, authenticated group)

## Route / page mismatches found

| Issue | Evidence |
|-------|----------|
| `/crm/conversations` 404; live route is `/conversations` | crawl + web.php |
| `/crm/contacts/merge` 404; needs two IDs | crawl + web.php |
| `/leads` → deals board, not leads list; `pages/leads/board.tsx` may be leftover | crawl + pages |
| README Kommo `/leads` vs implementation | README vs route |
| `/settings/apps/meta` redirects when Meta unconfigured | crawl 302 |
| Simple mode 403 vs pages that still exist | crawl + SimpleMode |
