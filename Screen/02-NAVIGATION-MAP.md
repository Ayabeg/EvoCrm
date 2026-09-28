# EvoCRM navigation map

Uncertainty: labels below are English source strings; local UI is French via `lang/fr.json` `[CONFIRMED-BOTH]`.

Canonical files: `resources/js/components/app-sidebar.tsx`, `app-sidebar-header.tsx`, `resources/js/lib/settings/ia.ts`, `app/Support/SimpleMode.php`.

## 1. Primary sidebar (icon rail)

Component: `AppSidebar`. Layout: `app-sidebar-layout.tsx`. Collapsible `"icon"` (`Sidebar` `collapsible="icon"`). Cookie `sidebar_state` (unencrypted). Shared prop `sidebarOpen`.

### Full mode (`simple_mode=false`) — `[CONFIRMED-CODE]`

| Label | ID | Destination | Route (typical) | Icon (Phosphor) | Visibility | Active behavior | Badge | Shortcut |
|-------|----|-------------|-----------------|-----------------|------------|-----------------|-------|----------|
| Home | home | `/dashboard` | `dashboard` | House | always | path `/` extra + `/dashboard` | none | none in rail |
| Contacts | contacts | `/crm/contacts` | `crm.contacts.index` | AddressBook | always | prefix match | none | |
| Companies | companies | `/crm/companies` | `crm.companies.index` | Buildings | always | prefix | none | |
| Deals | deals | `/crm/deals` | `crm.deals.index` | Handshake | always | prefix **excluding** `/crm/deals/board` | none | |
| Pipeline | pipeline | `/crm/deals/board` | `crm.deals.board` | SquaresFour | always | prefix | none | |
| Inbox | inbox | `/inbox` | `desk.inbox` | Tray | always | also `/desk`, `/conversations` | none on rail (tasks badge is header) | |
| Activities | activities | `/crm/activities` | `crm.activities.index` | CheckSquare | always | prefix | none | |
| Quotes | quotes | `/crm/quotes` | `crm.quotes.index` | FileText | always | prefix | none | |
| Workflows | workflows | `/crm/workflows` | `crm.workflows.index` | FlowArrow | always | also `/automation` | none | |
| More → Leads | leads | `/crm/leads` | `crm.leads.index` | Path | More panel | | | |
| More → Tickets | tickets | `/crm/tickets` | `crm.tickets.index` | Ticket | More | SimpleMode 403 if simple | | |
| More → Segments | segments | `/crm/segments` | `crm.segments.index` | UsersThree | More | | | |
| More → Ads | ads | `/ads` | `ads.index` | Megaphone | More | SimpleMode 403 if simple | | |
| More → Reports | reports | `/reports` | `reports` | ChartLine | More | | | |
| More → Outbound | outbound | `/outbound` | `outbound.index` | PaperPlaneTilt | More | | | |
| Settings | settings | `/settings` | redirects `profile.edit` | GearSix | always, footer of rail | prefix `/settings` | none | |

Groups when labeled (expanded or mobile): CRM, Communication, Sales, Automation, More.

`CRM_RAIL_OBJECTS` export lists contacts/companies/deals/leads/tickets for tests (`data-nav="crm-objects"`) but the visible CRM group does **not** include leads/tickets on the main rail — they sit in More. `[CONFIRMED-CODE]`

### Simple mode (`simple_mode=true`) — `[CONFIRMED-BOTH]` local seed

`allowedIds` from shared `nav` (`SimpleMode::SIMPLE_NAV`): home, contacts, deals, inbox, quotes. More panel hidden. Extra leaves from nav not in groups: none of the five is outside groups except quotes is in Sales group. Tickets/ads/etc. not shown.

Shared `nav` on local dashboard (French labels): Accueil `/dashboard`, Contacts `/crm/contacts`, Deals `/crm/deals`, Inbox `/inbox`, Quotes `/crm/quotes`.

### Collapsed vs expanded vs mobile

- Collapsed: 12px-tall icon buttons, tooltip on the right, logo only in topbar when collapsed (`AppSidebarHeader`).
- Expanded or mobile: text labels, group headings.
- Mobile: `Sidebar` sheet; closing resets More. `[CONFIRMED-CODE]`

### Inconsistencies

1. SimpleMode `FULL_NAV` includes `pipelines` → `/crm/deals/board`, `outbound-warmup`, `report-builder`, `sms` — **these IDs are not in `NAV_GROUPS`**. They appear as `extraLeaves` only when simpleMode is on **and** they are in `nav`. Contradiction: extraLeaves only computed when `simpleMode` is true, but FULL_NAV is used when simpleMode is **false**. So warmup/report-builder/sms/pipeline-as-id **never appear as extraLeaves in full mode**; pipeline appears as `pipeline` id in NAV_GROUPS instead. Warmup and report-builder are **not in the full-mode rail at all** — only via More→Outbound/Reports or Command OS. `[CONFIRMED-CODE]` UX inconsistency.
2. Header Create has no Lead or Ticket.
3. User menu “Settings” goes to `profile.edit` (`/settings/profile`); rail Settings goes to `/settings` which redirects to profile. Same landing `[CONFIRMED-CODE]`.
4. Inbox activePaths include `/conversations` but conversations is not a rail item.
5. `/leads` is not a nav href; it redirects to deals board. README still describes `/leads` as Kommo board. `[CONFIRMED-BOTH]` mismatch.

## 2. Header / Command OS

See `Screen/shell/header.md` and overlay specs.

| Control | Action | Shortcut |
|---------|--------|----------|
| Sidebar trigger | toggle rail | none documented in header (sidebar component may have cmd+b via shadcn — `[UNVERIFIED]`) |
| Search input (read-only) | open CommandPalette | displayed ⌘K; `useCommandPaletteShortcut` |
| Sparkle | same palette | none |
| Create | dropdown links `?create=1` | none |
| Bell | TasksOverlay | none; `openEvoTasks` window event |
| Avatar | User menu: Settings, Log out | none |

Breadcrumbs prop exists on header but is discarded (`void breadcrumbs`). `[CONFIRMED-CODE]`

## 3. Settings secondary navigation

`layouts/settings/layout.tsx`. Search/filter settings. Mobile `<select>`. Groups from `SETTINGS_DESTINATIONS`.

See `Screen/shell/settings-layout.md` for the full destination table (Profile, Security, Appearance, General, Members, Meetings, Setup, Properties, Pipelines, Qualification, Quotas, Record layouts, Playbooks, WhatsApp, WhatsApp Cloud, WhatsApp Business, Meta, Channels, SMS, Apps, Connectors, Permissions, Audit trail, System health).

Visibility: `ownerOnly`, `adminOnly` (owner+admin), `permission` capability, `requiresSmsFeature`.

## 4. Module secondary nav

- **Outbound**: `outbound-shell.tsx` — hub subsections (mailboxes, domains, templates, sequences, campaigns, lists, outbox, replies, suppressions, quiet hours, warmup). `[CONFIRMED-CODE]`
- **Ads**: `ads-shell.tsx` — campaigns, ad sets, ads, audiences, attribution. `[CONFIRMED-CODE]`
- **Reports**: `reports-shell.tsx` + category rooms. `[CONFIRMED-CODE]`
- **Deals**: list vs board toggle (`deal-layout-toggle`, `dealLayoutHref`). `[CONFIRMED-CODE]`
- **Tickets**: list vs board toggle. `[CONFIRMED-CODE]`
- **CRM lists**: saved view tabs (`saved-view-tabs.tsx`).

## 5. Record / row navigation

- List row → `{base}/{id}` show pages for contact, company, deal, lead, quote, ticket, segment, outbound template/sequence/campaign.
- Association chips on record hub → related show routes.
- Command search hits → record URLs.
- Quick peek: `/crm/records/{type}/{id}/peek` `[CONFIRMED-CODE]`

## 6. Command palette navigation catalog

`lib/command-os` `buildCommandCatalog`: Navigate section includes home, contacts, companies, leads, deals, pipeline, inbox, activities, quotes, automation, settings. Create section. Act (overdue/today/upcoming/completed tasks). Ask Evo. Remote search hits. `[CONFIRMED-CODE]`

## 7. URL query-state (lists)

Canonical keys (`lib/list-query/keys.ts`) `[CONFIRMED-CODE]`:

- Workspace: `q`, `page`, `view`, `filter_id`, `filter_groups`, `sort`, `direction`
- Chrome filters: `owner`, `created`, `last_activity`, `status`, `stage`, `city`, `wilaya`, `unanswered`, `unassigned`, `priority`, `channel`, `attention`
- Preserved: `pipeline`
- Unsafe (not rewritten as filters): `owner_id`, `columns`, `create`, `contact_id`, `mode`, `peek`
- Association via `filter_groups`: deal_stage, has_open_deal, has_won_deal, has_company, enrolled_in_sequence, email_replied, email_opened, …

Create drawer: `?create=1` on contacts/companies/deals/quotes lists `[CONFIRMED-UI]`.

## 8. Deep links / aliases / redirects `[CONFIRMED-UI unless noted]`

| From | To | Kind |
|------|----|------|
| `/` | `/dashboard` | 302 auth |
| `/login` (authed) | `/dashboard` | 302 |
| `/settings` | `/settings/profile` | 302 |
| `/leads` | `/crm/deals/board` | 302 |
| `/desk` | inbox controller index | `[CONFIRMED-CODE]` |
| `/automation` | workflows index | `[CONFIRMED-CODE]` |
| `/crm/reports` | same ReportController as `/reports` | `[CONFIRMED-CODE]` |
| `/settings/setup` | `/settings/setup/start` | 302 |
| `/settings/apps/meta` (unconfigured) | `/settings/apps` | 302 |
| `/settings/security` | `/user/confirm-password` | 302 password.confirm |
| `/crm/conversations` | 404 | wrong path |
| `/conversations` | conversation history | live |

## 9. Back navigation

Record pages use `record-path` / object headers (“Back to …”). Lists do not use the unused breadcrumbs. Browser back is the generic path. `[CONFIRMED-CODE]`

## 10. Keyboard

- Command palette: ⌘K / Ctrl+K `[CONFIRMED-CODE]` `useCommandPaletteShortcut`
- More panel: Escape closes `[CONFIRMED-CODE]`
- Other shortcuts: REQUIRES MANUAL TEST beyond code comments
