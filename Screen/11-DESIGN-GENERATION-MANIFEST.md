# Design generation manifest

Input for a later image → HTML → Figma pipeline. **Do not generate visuals from this audit.**

Readiness:

- **READY** — spec + populated localhost 200; enough to design without unblocking the app
- **READY WITH OPEN QUESTIONS** — spec exists; some states/tokens/roles not executed
- **BLOCKED** — cannot capture live UI on this seed without changing workspace flags or data; spec is still written from code

This local seed has `simple_mode: true`. Live capture of Tickets, Ads, Warmup, Report builder, Ask Evo is blocked until Settings → General turns simple mode off. That toggle was **not** performed (non-destructive audit).

| Screen ID | Spec | Implementation | Route | Entity | Primary action | Required states | Overlays | Readiness | Notes |
|-----------|------|----------------|-------|--------|----------------|-----------------|----------|-----------|-------|
| SCR-SHELL-001 | `shell/application-shell.md` | `layouts/app-layout.tsx` | layout | — | navigate | collapsed/expanded/mobile | all shell OVRs | READY WITH OPEN QUESTIONS | mobile viewport not lab-tested |
| SCR-SHELL-002 | `shell/sidebar.md` | `app-sidebar.tsx` | layout | — | go to room | simple vs full | More | READY | simple mode observed |
| SCR-SHELL-003 | `shell/header.md` | `app-sidebar-header.tsx` | layout | — | search/create | | palette, create, tasks, user | READY |
| SCR-SHELL-004 | `shell/settings-layout.md` | `layouts/settings/layout.tsx` | `/settings/*` | — | filter settings | search empty | | READY |
| OVR-SHELL-001 | `overlays/command-palette.md` | `crm/command-palette.tsx` | `/crm/command/search` | mixed | search | empty/results | | READY WITH OPEN QUESTIONS | search GET not crawled |
| OVR-SHELL-002 | `overlays/tasks-overlay.md` | `tasks-overlay.tsx` | — | Activity | complete | empty/populated | | READY WITH OPEN QUESTIONS |
| OVR-SHELL-003 | `overlays/global-create-menu.md` | header dropdown | `?create=1` | | create | quote gated | | READY |
| OVR-SHELL-004 | `overlays/user-menu.md` | `user-menu-content.tsx` | | User | settings/logout | | | READY |
| OVR-SHELL-005 | `overlays/ask-evo.md` | ask-evo-* | `/ask-evo` | | ask | 403 simple | | BLOCKED | `features.ask_evo=false`; APIs 403. Reason: SimpleMode |
| OVR-SHELL-006 | `overlays/quick-record.md` | ds/quick-record | peek | mixed | peek | | | READY WITH OPEN QUESTIONS | unused on production lists |
| SCR-AUTH-001 | `auth/login.md` | `pages/auth/login.tsx` | `/login` | User | sign in | validation | | READY | crawled as guest earlier in session |
| SCR-AUTH-002 | `auth/register.md` | register.tsx | `/register` | | register | | | READY WITH OPEN QUESTIONS | authed 302 |
| SCR-AUTH-003 | `auth/forgot-password.md` | | `/forgot-password` | | send link | | | READY WITH OPEN QUESTIONS |
| SCR-AUTH-004 | `auth/reset-password.md` | | `/reset-password/{token}` | | set password | | | READY WITH OPEN QUESTIONS |
| SCR-AUTH-005 | `auth/verify-email.md` | | verify | | resend | | | READY WITH OPEN QUESTIONS |
| SCR-AUTH-006 | `auth/two-factor-challenge.md` | | 2FA | | verify | | | READY WITH OPEN QUESTIONS | seed owner 2FA off |
| SCR-AUTH-007 | `auth/confirm-password.md` | | confirm | | confirm | | | READY WITH OPEN QUESTIONS |
| SCR-HOME-001 | `home/home.md` | `pages/home.tsx` (dirty V02) | `/dashboard` | mixed | scan work | populated, activation | peek, create | READY WITH OPEN QUESTIONS | working-tree V02; do not treat git HEAD as visual truth |
| SCR-CONTACT-001 | `contacts/contacts-list.md` | `crm/contacts/index.tsx` | `/crm/contacts` | Contact | find/create | populated, createOpen | OVR-CONTACT-001, bulk | **READY** | recommended first pipeline screen |
| SCR-CONTACT-002 | `contacts/contact-detail.md` | show.tsx | `/crm/contacts/1` | Contact | edit/relate | populated | ask evo, activity | READY |
| SCR-CONTACT-003 | `contacts/contact-import.md` | import.tsx | `/crm/contacts/import` | ImportBatch | map/commit | empty batch | | READY WITH OPEN QUESTIONS |
| SCR-CONTACT-004 | `contacts/contact-duplicates.md` | duplicates.tsx | `/crm/contacts/duplicates` | Contact | merge | groups | | READY |
| SCR-CONTACT-005 | `contacts/contact-merge.md` | merge.tsx | `/crm/contacts/merge/{a}/{b}` | Contact | confirm merge | | | READY WITH OPEN QUESTIONS | pair URL not crawled |
| OVR-CONTACT-001 | `contacts/contact-create-drawer.md` | CreateDrawer | `?create=1` | Contact | submit | | | READY |
| SCR-COMPANY-001 | `companies/companies-list.md` | index | `/crm/companies` | Company | list/create | populated | OVR-COMPANY-001 | READY | not on simple rail |
| SCR-COMPANY-002 | `companies/company-detail.md` | show | `/crm/companies/1` | Company | edit | | | READY |
| OVR-COMPANY-001 | `companies/company-create-drawer.md` | | `?create=1` | Company | create | | | READY |
| SCR-DEAL-001 | `deals/deals-list.md` | index | `/crm/deals` | Deal | list/create | populated, bulk | OVR-DEAL-001 | READY |
| SCR-DEAL-002 | `deals/deals-board.md` | board | `/crm/deals/board` | Deal | drag stage | populated columns | options sheet | READY |
| SCR-DEAL-003 | `deals/deal-detail.md` | show | `/crm/deals/1` | Deal | edit/move | | | READY |
| SCR-DEAL-004 | `deals/deal-import.md` | import | `/crm/deals/import` | ImportBatch | import | | | READY WITH OPEN QUESTIONS |
| OVR-DEAL-001 | `deals/deal-create-drawer.md` | | `?create=1` | Deal | create | | | READY |
| SCR-LEAD-001 | `leads/leads-list.md` | index | `/crm/leads` | Lead | list | thinner filters | | READY WITH OPEN QUESTIONS |
| SCR-LEAD-002 | `leads/lead-detail.md` | show | `/crm/leads/1` | Lead | qualify | | dialogs | READY |
| SCR-LEAD-003 | `leads/lead-captures.md` | captures | `/crm/leads/captures` | LeadCapture | accept | | | READY |
| SCR-LEAD-004 | `leads/leads-legacy-redirect.md` | redirect + orphan board.tsx | `/leads` | Deal | — | redirect | | READY | document mismatch; do not design orphan board as live |
| SCR-QUOTE-001 | `quotes/quotes-list.md` | index | `/crm/quotes` | Quote | list | | OVR-QUOTE-001 | READY |
| SCR-QUOTE-002 | `quotes/quote-detail.md` | show | `/crm/quotes/1` | Quote | send | slim props | | READY WITH OPEN QUESTIONS |
| OVR-QUOTE-001 | `quotes/quote-create.md` | | | Quote | create | needs deal | | READY WITH OPEN QUESTIONS |
| SCR-TICKET-001 | `tickets/tickets-list.md` | index | `/crm/tickets` | Ticket | list | | | BLOCKED | HTTP 403 SimpleMode. Spec from code. |
| SCR-TICKET-002 | `tickets/tickets-board.md` | board | `/crm/tickets/board` | Ticket | move | | | BLOCKED | 403 |
| SCR-TICKET-003 | `tickets/ticket-detail.md` | show | `/crm/tickets/{id}` | Ticket | update | | | BLOCKED | no seed ticket; would 403 |
| SCR-ACTIVITY-001 | `activities/activities-index.md` | index | `/crm/activities` | Activity | complete | queue | | READY |
| SCR-INBOX-001 | `inbox/inbox.md` | desk/inbox | `/inbox` | Thread | reply / embed | embed states | | READY WITH OPEN QUESTIONS | third-party frame |
| SCR-INBOX-002 | `inbox/conversations.md` | conversations.tsx | `/conversations` | Thread | open | | | READY WITH OPEN QUESTIONS |
| SCR-SEGMENT-001 | `segments/segments-list.md` | index | `/crm/segments` | SavedFilter | open list | | | READY |
| SCR-SEGMENT-002 | `segments/segment-detail.md` | show | `/crm/segments/1` | | history | | | READY WITH OPEN QUESTIONS |
| SCR-WF-001 | `workflows/workflows.md` | index | `/crm/workflows` | Workflow | build | | | READY |
| SCR-ADS-001 | `ads/ads-index.md` | ads/index | `/ads` | AdCampaign | overview | | | BLOCKED | 403 SimpleMode |
| SCR-ADS-002 | `ads/campaigns.md` | campaigns/index | `/ads/campaigns` | AdCampaign | list | | | BLOCKED | 403 |
| SCR-ADS-003 | `ads/campaign-detail.md` | show | `/ads/campaigns/{id}` | AdCampaign | funnel | | | BLOCKED | 403 |
| SCR-ADS-004 | `ads/ad-sets.md` | ad-sets | `/ads/ad-sets` | AdSet | list | | | BLOCKED | 403 |
| SCR-ADS-005 | `ads/ads-list.md` | ads/ads | `/ads/ads` | Ad | list | | | BLOCKED | 403 |
| SCR-ADS-006 | `ads/audiences.md` | audiences | `/ads/audiences` | | | | | BLOCKED | 403 |
| SCR-ADS-007 | `ads/attribution.md` | attribution | `/ads/attribution` | | | | | BLOCKED | 403 |
| SCR-OUT-001 | `outbound/outbound-index.md` | outbound/index | `/outbound` | mixed | enter room | | | READY |
| SCR-OUT-002 … SCR-OUT-014 | `outbound/*.md` | pages/outbound/* | `/outbound/*` | mail stack | CRUD/send | populated seed | | READY | warmup excluded |
| SCR-OUT-015 | `outbound/warmup.md` | warmup.tsx | `/outbound/warmup` | Mailbox | toggle warmup | | | BLOCKED | 403 SimpleMode |
| SCR-REPORT-001 | `reports/reports.md` | crm/reports | `/reports` | Dashboard | filter rooms | populated | | READY |
| SCR-REPORT-002 | `reports/report-builder.md` | report-builder | `/crm/report-builder` | SavedReport | build | | | BLOCKED | 403 SimpleMode |
| SCR-REPORT-003 | `reports/funnels.md` | funnels/index | `/reports/funnels` | Funnel | inspect | | | READY |
| SCR-SET-001 … 025 | `settings/*.md` | pages/settings/* | `/settings/*` | workspace | configure | | | READY or READY WITH OPEN QUESTIONS | Security 302 confirm; Apps Meta 302; Setup 302 |
| SCR-PUB-001 | `public/quote.md` | public/quote | `/q/{token}` | Quote | accept | 404 invalid | | READY WITH OPEN QUESTIONS | no live token |
| SCR-PUB-002 | `public/book.md` | public/book | `/book/{slug}` | MeetingSchedule | book | 404 missing | | READY WITH OPEN QUESTIONS |
| SCR-PUB-003 | `public/book-done.md` | book-done | `/book/{slug}/done` | | | | | READY WITH OPEN QUESTIONS |
| SCR-PUB-004 | `public/unsubscribe.md` | Blade | `/unsubscribe` | Suppression | unsubscribe | 200 | | READY WITH OPEN QUESTIONS | GET mutates |
| SCR-DEV-001 | `dev/quick-record-harness.md` | harness | harness | | | 200 | | READY WITH OPEN QUESTIONS | not a product screen |

## Recommended first design-pipeline screen

**SCR-CONTACT-001 Contacts list** (`Screen/contacts/contacts-list.md`)

Why: it is the canonical DataWorkspace / CrmListShell contract that Companies, Deals, Quotes, and (in full mode) Tickets reuse. Populated 200 on localhost. Create drawer, filters, bulk, pagination, and row→detail all exist. Home is also critical but currently has uncommitted V02 visual work — do not start the pipeline there until that working tree is settled.

## Counts

| Readiness | Count (approx from table) |
|-----------|---------------------------|
| READY | 40+ (core CRM lists/details, outbound GET 200s, most settings GET 200s, shell) |
| READY WITH OPEN QUESTIONS | remainder of 200s + public + auth guests + home V02 |
| BLOCKED | 12: Ask Evo overlay, 3 tickets, 7 ads, warmup, report-builder |

Unblock BLOCKED live capture: `PUT /settings/workspace` `simple_mode=false` as owner (changes local DB — not done in this audit).
