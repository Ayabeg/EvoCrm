# EvoCRM screen registry

Audit date: 2026-09-21  
Repository: `C:\Users\Moham\EvoCrm`  
Branch: `main`  
Base SHA: `04fe5a4467652f494ab83764624e8f1e9afb7be0`  
Runtime: `http://127.0.0.1:8000` as `owner@evosales.local`  
Workspace: Evotechly, `simple_mode: true`

IDs are stable. Kind: P = primary screen, S = secondary, O = overlay, R = redirect/alias, D = dev/hidden.

Status: **documented** = spec file exists. Runtime: HTTP from owner crawl.

| ID | Product Area | Screen | Route | File | Kind | Runtime | Priority |
|----|--------------|--------|-------|------|------|---------|----------|
| SCR-SHELL-001 | Shell | Application shell | (layout) | `shell/application-shell.md` | P | n/a | P0 |
| SCR-SHELL-002 | Shell | Sidebar | (layout) | `shell/sidebar.md` | P | n/a | P0 |
| SCR-SHELL-003 | Shell | Header | (layout) | `shell/header.md` | P | n/a | P0 |
| SCR-SHELL-004 | Shell | Settings layout | `/settings/*` | `shell/settings-layout.md` | P | n/a | P1 |
| OVR-SHELL-001 | Shell | Command palette | `/crm/command/search` | `overlays/command-palette.md` | O | `[UNVERIFIED]` search GET | P0 |
| OVR-SHELL-002 | Shell | Tasks overlay | (client) | `overlays/tasks-overlay.md` | O | | P1 |
| OVR-SHELL-003 | Shell | Global create menu | `?create=1` | `overlays/global-create-menu.md` | O | | P0 |
| OVR-SHELL-004 | Shell | User menu | logout / profile | `overlays/user-menu.md` | O | | P1 |
| OVR-SHELL-005 | Shell | Ask Evo | `/ask-evo` | `overlays/ask-evo.md` | O | 403 simple | P1 |
| OVR-SHELL-006 | Shell | Quick record / peek | `/crm/records/{type}/{id}/peek` | `overlays/quick-record.md` | O | | P1 |
| SCR-AUTH-001 | Auth | Login | `GET /login` | `auth/login.md` | P | 200 guest / 302 authed | P0 |
| SCR-AUTH-002 | Auth | Register | `GET /register` | `auth/register.md` | S | 200 guest | P1 |
| SCR-AUTH-003 | Auth | Forgot password | `GET /forgot-password` | `auth/forgot-password.md` | S | 200 guest | P2 |
| SCR-AUTH-004 | Auth | Reset password | `GET /reset-password/{token}` | `auth/reset-password.md` | S | 200 fake token | P2 |
| SCR-AUTH-005 | Auth | Verify email | `GET /email/verify` | `auth/verify-email.md` | S | 302 guest | P2 |
| SCR-AUTH-006 | Auth | Two-factor challenge | `GET /two-factor-challenge` | `auth/two-factor-challenge.md` | S | 302 guest | P2 |
| SCR-AUTH-007 | Auth | Confirm password | `GET /user/confirm-password` | `auth/confirm-password.md` | S | 302 from security | P1 |
| SCR-HOME-001 | Home | Operating home | `GET /dashboard` | `home/home.md` | P | 200 | P0 |
| SCR-CONTACT-001 | Contacts | List | `GET /crm/contacts` | `contacts/contacts-list.md` | P | 200 | P0 |
| SCR-CONTACT-002 | Contacts | Detail | `GET /crm/contacts/{id}` | `contacts/contact-detail.md` | P | 200 | P0 |
| SCR-CONTACT-003 | Contacts | Import | `GET /crm/contacts/import` | `contacts/contact-import.md` | S | 200 | P1 |
| SCR-CONTACT-004 | Contacts | Duplicates | `GET /crm/contacts/duplicates` | `contacts/contact-duplicates.md` | S | 200 | P1 |
| SCR-CONTACT-005 | Contacts | Merge | `GET /crm/contacts/merge/{a}/{b}` | `contacts/contact-merge.md` | S | bare merge 404 | P1 |
| OVR-CONTACT-001 | Contacts | Create drawer | `?create=1` | `contacts/contact-create-drawer.md` | O | 200 same page | P0 |
| SCR-COMPANY-001 | Companies | List | `GET /crm/companies` | `companies/companies-list.md` | P | 200 (hidden in simple nav) | P0 |
| SCR-COMPANY-002 | Companies | Detail | `GET /crm/companies/{id}` | `companies/company-detail.md` | P | 200 | P0 |
| OVR-COMPANY-001 | Companies | Create drawer | `?create=1` | `companies/company-create-drawer.md` | O | | P0 |
| SCR-DEAL-001 | Deals | List | `GET /crm/deals` | `deals/deals-list.md` | P | 200 | P0 |
| SCR-DEAL-002 | Deals | Board | `GET /crm/deals/board` | `deals/deals-board.md` | P | 200 | P0 |
| SCR-DEAL-003 | Deals | Detail | `GET /crm/deals/{id}` | `deals/deal-detail.md` | P | 200 | P0 |
| SCR-DEAL-004 | Deals | Import | `GET /crm/deals/import` | `deals/deal-import.md` | S | 200 | P1 |
| OVR-DEAL-001 | Deals | Create drawer | `?create=1` | `deals/deal-create-drawer.md` | O | 200 | P0 |
| SCR-LEAD-001 | Leads | List | `GET /crm/leads` | `leads/leads-list.md` | P | 200 | P1 |
| SCR-LEAD-002 | Leads | Detail | `GET /crm/leads/{id}` | `leads/lead-detail.md` | P | 200 | P1 |
| SCR-LEAD-003 | Leads | Captures | `GET /crm/leads/captures` | `leads/lead-captures.md` | S | 200 | P1 |
| SCR-LEAD-004 | Leads | Legacy /leads | `GET /leads` → board | `leads/leads-legacy-redirect.md` | R | 302 | P1 |
| SCR-QUOTE-001 | Quotes | List | `GET /crm/quotes` | `quotes/quotes-list.md` | P | 200 | P1 |
| SCR-QUOTE-002 | Quotes | Detail | `GET /crm/quotes/{id}` | `quotes/quote-detail.md` | P | 200 | P1 |
| OVR-QUOTE-001 | Quotes | Create | `?create=1` / deal | `quotes/quote-create.md` | O | | P1 |
| SCR-TICKET-001 | Tickets | List | `GET /crm/tickets` | `tickets/tickets-list.md` | P | **403** simple | P1 |
| SCR-TICKET-002 | Tickets | Board | `GET /crm/tickets/board` | `tickets/tickets-board.md` | P | **403** | P1 |
| SCR-TICKET-003 | Tickets | Detail | `GET /crm/tickets/{id}` | `tickets/ticket-detail.md` | P | 404 id=1 / 403 if exists | P1 |
| SCR-ACTIVITY-001 | Activities | Index | `GET /crm/activities` | `activities/activities-index.md` | P | 200 | P1 |
| SCR-INBOX-001 | Inbox | Desk inbox | `GET /inbox` | `inbox/inbox.md` | P | 200 | P0 |
| SCR-INBOX-002 | Inbox | Conversation history | `GET /conversations` | `inbox/conversations.md` | S | live route | P2 |
| SCR-SEGMENT-001 | Segments | List | `GET /crm/segments` | `segments/segments-list.md` | S | 200 | P1 |
| SCR-SEGMENT-002 | Segments | Detail | `GET /crm/segments/{id}` | `segments/segment-detail.md` | S | 200 | P2 |
| SCR-WF-001 | Automation | Workflows | `GET /crm/workflows` | `workflows/workflows.md` | P | 200 | P1 |
| SCR-ADS-001 | Ads | Ads home | `GET /ads` | `ads/ads-index.md` | P | **403** | P1 |
| SCR-ADS-002 | Ads | Campaigns | `GET /ads/campaigns` | `ads/campaigns.md` | P | **403** | P1 |
| SCR-ADS-003 | Ads | Campaign detail | `GET /ads/campaigns/{id}` | `ads/campaign-detail.md` | S | **403** | P2 |
| SCR-ADS-004 | Ads | Ad sets | `GET /ads/ad-sets` | `ads/ad-sets.md` | S | **403** | P2 |
| SCR-ADS-005 | Ads | Ads list | `GET /ads/ads` | `ads/ads-list.md` | S | **403** | P2 |
| SCR-ADS-006 | Ads | Audiences | `GET /ads/audiences` | `ads/audiences.md` | S | **403** | P2 |
| SCR-ADS-007 | Ads | Attribution | `GET /ads/attribution` | `ads/attribution.md` | S | **403** | P2 |
| SCR-OUT-001 | Outbound | Hub | `GET /outbound` | `outbound/outbound-index.md` | P | 200 | P1 |
| SCR-OUT-002 | Outbound | Mailboxes | `GET /outbound/mailboxes` | `outbound/mailboxes.md` | P | 200 | P1 |
| SCR-OUT-003 | Outbound | Domains | `GET /outbound/domains` | `outbound/domains.md` | S | 200 | P1 |
| SCR-OUT-004 | Outbound | Templates | `GET /outbound/templates` | `outbound/templates.md` | P | 200 | P1 |
| SCR-OUT-005 | Outbound | Template detail | `GET /outbound/templates/{id}` | `outbound/template-detail.md` | S | 200 | P2 |
| SCR-OUT-006 | Outbound | Sequences | `GET /outbound/sequences` | `outbound/sequences.md` | P | 200 | P1 |
| SCR-OUT-007 | Outbound | Sequence detail | `GET /outbound/sequences/{id}` | `outbound/sequence-detail.md` | S | 200 | P1 |
| SCR-OUT-008 | Outbound | Campaigns | `GET /outbound/campaigns` | `outbound/campaigns.md` | P | 200 | P1 |
| SCR-OUT-009 | Outbound | Campaign detail | `GET /outbound/campaigns/{id}` | `outbound/campaign-detail.md` | S | 200 | P2 |
| SCR-OUT-010 | Outbound | Lists | `GET /outbound/lists` | `outbound/lists.md` | S | 200 | P2 |
| SCR-OUT-011 | Outbound | Outbox | `GET /outbound/outbox` | `outbound/outbox.md` | S | 200 | P2 |
| SCR-OUT-012 | Outbound | Replies | `GET /outbound/replies` | `outbound/replies.md` | S | 200 | P2 |
| SCR-OUT-013 | Outbound | Suppressions | `GET /outbound/suppressions` | `outbound/suppressions.md` | S | 200 | P2 |
| SCR-OUT-014 | Outbound | Quiet hours | `GET /outbound/quiet-hours` | `outbound/quiet-hours.md` | S | 200 | P2 |
| SCR-OUT-015 | Outbound | Warmup | `GET /outbound/warmup` | `outbound/warmup.md` | S | **403** | P2 |
| SCR-REPORT-001 | Reports | Analytics rooms | `GET /reports` | `reports/reports.md` | P | 200 | P1 |
| SCR-REPORT-002 | Reports | Report builder | `GET /crm/report-builder` | `reports/report-builder.md` | P | **403** | P1 |
| SCR-REPORT-003 | Reports | Funnels | `GET /reports/funnels` | `reports/funnels.md` | S | 200 | P2 |
| SCR-SET-001 | Settings | Profile | `GET /settings/profile` | `settings/profile.md` | P | 200 | P1 |
| SCR-SET-002 | Settings | Security | `GET /settings/security` | `settings/security.md` | P | 302 confirm | P1 |
| SCR-SET-003 | Settings | Appearance | `GET /settings/appearance` | `settings/appearance.md` | S | 200 | P1 |
| SCR-SET-004 | Settings | Workspace | `GET /settings/workspace` | `settings/workspace.md` | P | 200 | P0 |
| SCR-SET-005 | Settings | People | `GET /settings/people` | `settings/people.md` | P | 200 | P1 |
| SCR-SET-006 | Settings | Meetings | `GET /settings/meetings` | `settings/meetings.md` | S | 200 | P1 |
| SCR-SET-007 | Settings | Setup wizard | `GET /settings/setup` | `settings/setup-wizard.md` | S | 302 start | P1 |
| SCR-SET-008 | Settings | Attributes | `GET /settings/attributes` | `settings/attributes.md` | P | 200 | P1 |
| SCR-SET-009 | Settings | Pipelines | `GET /settings/pipelines` | `settings/pipelines.md` | P | 200 | P1 |
| SCR-SET-010 | Settings | Qualify | `GET /settings/qualify` | `settings/qualify.md` | S | 200 | P2 |
| SCR-SET-011 | Settings | Quotas | `GET /settings/quotas` | `settings/quotas.md` | S | 200 | P2 |
| SCR-SET-012 | Settings | Record layouts | `GET /settings/record-layouts` | `settings/record-layouts.md` | S | 200 | P2 |
| SCR-SET-013 | Settings | Playbooks | `GET /settings/playbooks` | `settings/playbooks.md` | S | 200 | P2 |
| SCR-SET-014 | Settings | Evolution / WhatsApp | `GET /settings/evolution` | `settings/evolution.md` | S | 200 | P1 |
| SCR-SET-015 | Settings | WhatsApp Cloud | `GET /settings/whatsapp` | `settings/whatsapp.md` | S | 200 | P1 |
| SCR-SET-016 | Settings | WhatsApp Business | `GET /settings/whatsapp-business` | `settings/whatsapp-business.md` | S | 200 | P1 |
| SCR-SET-017 | Settings | Meta | `GET /settings/meta` | `settings/meta.md` | S | 200 | P1 |
| SCR-SET-018 | Settings | Channels | `GET /settings/channels` | `settings/channels.md` | S | 200 | P1 |
| SCR-SET-019 | Settings | SMS | `GET /settings/sms` | `settings/sms.md` | S | 200 (nav hidden) | P2 |
| SCR-SET-020 | Settings | Apps | `GET /settings/apps` | `settings/apps.md` | P | 200 | P1 |
| SCR-SET-021 | Settings | Apps Meta | `GET /settings/apps/meta` | `settings/apps-meta.md` | S | 302 apps | P2 |
| SCR-SET-022 | Settings | Connectors | `GET /settings/connectors` | `settings/connectors.md` | S | 200 | P1 |
| SCR-SET-023 | Settings | Permissions | `GET /settings/permissions` | `settings/permissions.md` | S | 200 | P1 |
| SCR-SET-024 | Settings | Audit | `GET /settings/audit` | `settings/audit.md` | S | 200 | P2 |
| SCR-SET-025 | Settings | System health | `GET /settings/system-health` | `settings/system-health.md` | S | 200 | P2 |
| SCR-PUB-001 | Public | Quote accept | `GET /q/{token}` | `public/quote.md` | P | 404 invalid token | P1 |
| SCR-PUB-002 | Public | Book meeting | `GET /book/{slug}` | `public/book.md` | P | 404 missing slug | P1 |
| SCR-PUB-003 | Public | Booked | `GET /book/{slug}/done` | `public/book-done.md` | S | 404 | P2 |
| SCR-PUB-004 | Public | Unsubscribe | `GET /unsubscribe` | `public/unsubscribe.md` | S | 200 Blade | P2 |
| SCR-DEV-001 | Dev | Quick-record harness | `GET /crm/quick-record-drawer/harness` | `dev/quick-record-harness.md` | D | 200 local | P3 |

## Also documented (not separate SCR)

- `/desk` → inbox
- `/automation` → workflows
- `/crm/reports` → reports
- `/reports/{sales|pipeline|outbound|ads}` → reports same component
- `/crm/report-builder/cross-object` and `/{id}/run` → same report-builder page
- Import `{batch}` → same import page
- `pages/leads/board.tsx` — **UNREACHABLE** (see SCR-LEAD-004)
- `/api/v1/*` — mobile API, non-visual (`docs/api-v1.md`)
- Webhooks, tracking pixels, `/up` — system

## Totals (counted from this registry, not estimated)

| Metric | Count |
|--------|-------|
| Product areas (named folders + shell/auth/public/dev) | 19 |
| Routes in `artisan route:list` | 337 |
| Localhost paths crawled | 86 |
| Screen IDs (SCR-*) | 93 |
| Overlay IDs (OVR-*) | 10 |
| Workflow IDs in `04-WORKFLOW-MAP.md` | 18 |
| Major state classes in `07-STATE-INVENTORY.md` | 28 |
| Spec markdown files under `Screen/` (including maps) | 114+ |

Primary screens: Home, Contacts list/detail, Companies list/detail, Deals list/board/detail, Inbox, Login, Settings workspace, Outbound hub.  
Board views: deals, tickets, (unreachable leads board).  
Empty-state variants: DataWorkspace empty, settings empty, outbound empty, 403 simple-mode (unfriendly).  
Permission-dependent: member vs owner; simple mode 403 modules; password.confirm; can-manage-settings.
