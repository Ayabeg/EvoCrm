# W0: Repository architecture audit

**Agent:** 01 — Repository Architect  
**Wave:** 0 (audit only)  
**Authority:** `EVOCRM_PRODUCT_LAYOUT_BLUEPRINT_V1` (product-owner UX/layout, 6 Oct 2026)  
**Checkout:** `89eb45787c207a5550ef0eff60c44444efbc824d` — `Merge pull request #284 from Evotechly/feat/hierarchical-crm-sidebar`  
**Scope:** Presentation and composition inventory. No product-code changes in this PR.  
**Method:** Read `routes/web.php` + `routes/settings.php` (required from `web.php`), every `Inertia::render` / `Route::inertia` in that graph, the default layout switch in `resources/js/app.tsx`, and the current AppShell tree. Claims are file-backed. Anything not confirmed is marked **UNCERTAIN**.

**Rebuild constraint (from the brief and blueprint §33.2):** this is a presentation/composition rebuild. Backend, routes, controllers, permissions, `product-nav.ts` (PR #284), Simple/Full Mode, DataWorkspace, DataGrid/Tablecn, FilterBuilder, SavedViews, RecordWorkspace contracts, QuickRecord, Pipeline + DnD, Inbox/Desk/WhatsApp, Outbound, Automation, Agents, EvoViz, Quotes, localization, and canonical URL state stay protected.

**Wave 1 target (blueprint D1–D10, §10, §12, P0.1):** new AppShell (light sidebar **224px** expanded / **56px** rail, **no global top bar**) + `WorkspaceFrame` + `WorkspaceHeader` (slots A–Q) + scroll/density tokens.

---

## 1. Dependency map

### 1.1 Authenticated product render tree (current)

```
createInertiaApp layout (resources/js/app.tsx)
  name.startsWith('auth/')     → AuthLayout
  name.startsWith('settings/') → [AppLayout, SettingsLayout]
  name.startsWith('public/')   → PublicLayout
  default                      → AppLayout

AppLayout (resources/js/layouts/app-layout.tsx)
  QuickRecordProvider
    HydrateI18n
    AppSidebarLayout
      AppShell variant="sidebar"          (resources/js/components/app-shell.tsx)
        SidebarProvider --sidebar-width: 248px
          EvoShell                        (resources/js/components/shell/evo-shell.tsx)
            aside.evo-rail-slot (212px, md+)
              EvoRail                     (resources/js/components/shell/evo-rail.tsx)
                ShellModeSwitch           (resources/js/evo/shell/mode-switch.tsx)
                visibleSections(product-nav.ts)
                Settings NavGroup
                UserMenuContent
            Sidebar offcanvas (mobile, <768)
              EvoRail
            .evo-workspace
              AppSidebarHeader            ← GLOBAL TOP BAR
              .aurora-page-shell overflow-y-auto
                {page}
            CommandPalette                (⌘K / Ctrl+K; desktop only)
    QuickRecordDrawer
    AskEvoDrawer
```

`AppLayout` comment at `resources/js/layouts/app-layout.tsx:6` still says “Approved 212px production shell.”

### 1.2 Layout wrappers

| Wrapper | Path | Who uses it |
|---|---|---|
| `AppLayout` | `resources/js/layouts/app-layout.tsx` | Default product pages |
| `AppSidebarLayout` | `resources/js/layouts/app/app-sidebar-layout.tsx` | Only via `AppLayout` |
| `SettingsLayout` | `resources/js/layouts/settings/layout.tsx` → `resources/js/evo/patterns/settings/settings-layout.tsx` | Nested inside `AppLayout` for `settings/*` |
| `AuthLayout` | `resources/js/layouts/auth-layout.tsx` | Fortify pages (not declared in `web.php`) |
| `PublicLayout` | `resources/js/layouts/public-layout.tsx` | `public/*` Inertia pages |
| `AppHeaderLayout` | `resources/js/layouts/app/app-header-layout.tsx` | **@deprecated, not registered** in `app.tsx` |

Page `.layout = { breadcrumbs, … }` objects are merged into layout props. `AppSidebarHeader` does `void breadcrumbs` (`resources/js/components/app-sidebar-header.tsx:39`) — breadcrumbs are **not rendered**.

### 1.3 Shell / nav module graph

```
product-nav.ts  ──visibleSections()──►  evo-rail.tsx
SimpleMode.php  ──Inertia share──►  use-simple-mode.ts ──► evo-rail.tsx + app-sidebar-header.tsx
HandleInertiaRequests.php ── sidebarOpen, locale/dir, nav, features, evoOpenTaskCount
evo-shell.tsx ── mode + collapsed (React state only) ──► evo-rail.tsx
evo-shell.tsx ── CommandPalette (separate from rail Search mode)
app-sidebar-header.tsx ── Create ?create=1, Theme, Ask Evo, TasksOverlay
```

### 1.4 List / record / peek module graph

```
pages/crm/{contacts,companies,leads,deals,quotes,tickets}/index.tsx
  └─ CrmListShell (resources/js/components/crm/crm-list-shell.tsx)
       └─ DataWorkspace (resources/js/ds/workspace/DataWorkspace.tsx)
            ├─ PageHeader (resources/js/ds/chrome/PageHeader.tsx)
            ├─ SavedViews (resources/js/ds/workspace/SavedViews.tsx)
            ├─ FilterBar + AdvancedFilterDrawer → evo/data/filters FilterBuilder
            └─ DataTable → evo/data/crm-list/table.tsx → evo/data/data-grid
                 onRowPeek → QuickRecordProvider (app-layout.tsx)

pages/crm/deals/board.tsx
  └─ CrmListShell (board slot)
       └─ DealPipelineBoard → evo/crm/pipeline/Pipeline.tsx (+ DnD)

pages/crm/{contacts,companies,leads,deals,tickets}/show.tsx
  └─ RecordPageFrame + RecordShell
       implementation: resources/js/evo/crm/record/RecordWorkspace.tsx
       re-export: resources/js/components/crm/record-chrome.tsx
                  + resources/js/evo/crm/record/index.ts
```

### 1.5 Room / sub-nav shells (page chrome, not AppShell)

```
RoomShell (components/crm/room-shell.tsx)
  ├─ CrmShell      → activities, segments, workflows, imports, captures, ticket board
  ├─ DeskShell     → desk/inbox.tsx, crm/conversations.tsx
  ├─ OutboundShell → pages/outbound/**
  ├─ ReportsShell  → crm/reports, report-builder, reports/funnels
  └─ evo/ads/shell.tsx → pages/ads/**  (legacy components/crm/ads-shell.tsx is unwired)
```

### 1.6 Unwired / leftover chrome (still in repo)

| File | Status at `89eb4578` |
|---|---|
| `resources/js/components/app-header.tsx` | `@deprecated`; not in `AppLayout` |
| `resources/js/layouts/app/app-header-layout.tsx` | `@deprecated`; not in `app.tsx` |
| `resources/js/components/app-sidebar.tsx` | No importer from the live layout (tests assert it is not mounted) |
| `resources/js/components/shell/top-nav.tsx` | No production importer found |
| `resources/js/components/shell/evo-sidebar.tsx` | Legacy; uses `shell-data.ts` demo nav |
| `resources/js/components/shell/shell-data.ts` | Demo `NAV_SECTIONS` for the leftover sidebar only |
| `resources/js/components/dashboard/dashboard-header.tsx` | **No page importer** — `pages/home.tsx` inlines its own greeting header |
| `resources/js/components/page-header.tsx` | No TS/TSX importer found |
| `resources/js/components/surface/surface-header.tsx` | No consumer found |
| `resources/js/components/crm/list-toolbar.tsx` | No importer found |
| `resources/js/evo/data/crm-list/tablecn.tsx` | Added with PR #284 tree; **no importer found** |

---

## 2. Route → layout → page component

Scope is **Inertia GET page routes reachable from `routes/web.php`**, including `require __DIR__.'/settings.php'`. Fortify auth views are **not** in `web.php`; they are listed at the bottom as out-of-file.

Redirects, JSON, pixels, webhooks, CSV, and PDF are **not** Inertia pages (see §2.2).

Layout codes:

- **App** = `AppLayout` → `AppSidebarLayout` → `EvoShell` + `AppSidebarHeader`
- **App+Settings** = App, then `SettingsLayout` (Radix dialog overlay)
- **Public** = `PublicLayout` (no AppShell)

Simple-mode **403** comes from `app/Http/Middleware/EnforceSimpleMode.php` via `SimpleMode::blocks()` (`app/Support/SimpleMode.php`). Settings routes in `settings.php` are **not** in that middleware group.

### 2.1 Inertia page routes

| Method | Path | Route name | Controller | Inertia name | React page | Layout |
|---|---|---|---|---|---|---|
| GET | `/terms` | `legal.terms` | `app/Http/Controllers/Public/LegalController.php@terms` | `public/terms` | `resources/js/pages/public/terms.tsx` | Public |
| GET | `/privacy` | `legal.privacy` | `LegalController@privacy` | `public/privacy` | `resources/js/pages/public/privacy.tsx` | Public |
| GET | `/q/{token}` | `quotes.public.show` | `app/Http/Controllers/Public/QuoteAcceptanceController.php@show` | `public/quote` | `resources/js/pages/public/quote.tsx` | Public |
| GET | `/book/{slug}` | `meetings.public.show` | `app/Http/Controllers/Public/MeetingBookController.php@show` | `public/book` | `resources/js/pages/public/book.tsx` | Public |
| GET | `/book/{slug}/done` | `meetings.public.done` | `MeetingBookController@done` | `public/book-done` | `resources/js/pages/public/book-done.tsx` | Public |
| GET | `/dashboard` | `dashboard` | `app/Http/Controllers/HomeController.php` | `home` | `resources/js/pages/home.tsx` | App |
| GET | `/agents` | `agents.index` | `app/Http/Controllers/Desk/AgentsController.php@index` | `agents/index` | `resources/js/pages/agents/index.tsx` | App |
| GET | `/agents/chats` | `agents.chats.index` | `AgentsController@chats` → `index` | `agents/index` | same | App |
| GET | `/agents/chats/{chat}` | `agents.chats.show` | `AgentsController@chat` → `index` | `agents/index` | same | App |
| GET | `/agents/bots` | `agents.bots.index` | `AgentsController@bots` → `index` | `agents/index` | same | App |
| GET | `/agents/bots/new` | `agents.bots.create` | `AgentsController@newBot` → `index` | `agents/index` | same | App |
| GET | `/agents/bots/{bot}` | `agents.bots.show` | `AgentsController@bot` → `index` | `agents/index` | same | App |
| GET | `/inbox` | `desk.inbox` | `app/Http/Controllers/Desk/InboxController.php@inbox` | `desk/inbox` | `resources/js/pages/desk/inbox.tsx` | App |
| GET | `/conversations` | `crm.conversations` | `app/Http/Controllers/Crm/ConversationHistoryController.php@index` | `crm/conversations` | `resources/js/pages/crm/conversations.tsx` | App |
| GET | `/reports` | `reports` | `app/Http/Controllers/Crm/ReportController.php@index` | `crm/reports` | `resources/js/pages/crm/reports.tsx` | App |
| GET | `/reports/{category}` | `reports.category` | `ReportController@index` (`sales`\|`pipeline`\|`outbound`\|`ads`) | `crm/reports` | same | App |
| GET | `/crm/reports` | `crm.reports` | `ReportController@index` | `crm/reports` | same | App |
| GET | `/reports/funnels` | `reports.funnels` | `app/Http/Controllers/Crm/FunnelController.php@index` | `reports/funnels/index` | `resources/js/pages/reports/funnels/index.tsx` | App |
| GET | `/crm/report-builder` | `crm.report-builder.index` | `app/Http/Controllers/Crm/SavedReportController.php@index` | `crm/report-builder` | `resources/js/pages/crm/report-builder.tsx` | App |
| GET | `/crm/report-builder/cross-object` | `crm.report-builder.cross-object` | `SavedReportController@crossObject` | `crm/report-builder` | same | App |
| GET | `/crm/report-builder/{savedReport}/run` | `crm.report-builder.run` | `SavedReportController@run` | `crm/report-builder` | same | App |
| GET | `/crm/activities` | `crm.activities.index` | `app/Http/Controllers/Crm/ActivityController.php@index` | `crm/activities/index` | `resources/js/pages/crm/activities/index.tsx` | App |
| GET | `/crm/segments` | `crm.segments.index` | `app/Http/Controllers/Crm/SegmentController.php@index` | `crm/segments/index` | `resources/js/pages/crm/segments/index.tsx` | App |
| GET | `/crm/segments/{segment}` | `crm.segments.show` | `SegmentController@show` | `crm/segments/show` | `resources/js/pages/crm/segments/show.tsx` | App |
| GET | `/automation` | `automation` | `app/Http/Controllers/Crm/WorkflowController.php@index` | `crm/workflows/index` | `resources/js/pages/crm/workflows/index.tsx` | App |
| GET | `/crm/workflows` | `crm.workflows.index` | `WorkflowController@index` | `crm/workflows/index` | same | App |
| GET | `/crm/quotes` | `crm.quotes.index` | `app/Http/Controllers/Crm/QuoteController.php@index` | `crm/quotes/index` | `resources/js/pages/crm/quotes/index.tsx` | App |
| GET | `/crm/quotes/{quote}` | `crm.quotes.show` | `QuoteController@show` | `crm/quotes/show` | `resources/js/pages/crm/quotes/show.tsx` | App |
| GET | `/crm/companies` | `crm.companies.index` | `app/Http/Controllers/Crm/CompanyController.php@index` | `crm/companies/index` | `resources/js/pages/crm/companies/index.tsx` | App |
| GET | `/crm/companies/{company}` | `crm.companies.show` | `CompanyController@show` | `crm/companies/show` | `resources/js/pages/crm/companies/show.tsx` | App |
| GET | `/crm/contacts` | `crm.contacts.index` | `app/Http/Controllers/Crm/ContactController.php@index` | `crm/contacts/index` | `resources/js/pages/crm/contacts/index.tsx` | App |
| GET | `/crm/contacts/import` | `crm.contacts.import` | `app/Http/Controllers/Crm/ContactImportController.php@create` | `crm/contacts/import` | `resources/js/pages/crm/contacts/import.tsx` | App |
| GET | `/crm/contacts/import/{batch}` | `crm.contacts.import.show` | `ContactImportController@show` | `crm/contacts/import` | same | App |
| GET | `/crm/contacts/duplicates` | `crm.contacts.merge.index` | `app/Http/Controllers/Crm/ContactMergeController.php@index` | `crm/contacts/duplicates` | `resources/js/pages/crm/contacts/duplicates.tsx` | App |
| GET | `/crm/contacts/merge/{survivor}/{absorbed}` | `crm.contacts.merge.show` | `ContactMergeController@show` | `crm/contacts/merge` | `resources/js/pages/crm/contacts/merge.tsx` | App |
| GET | `/crm/contacts/{contact}` | `crm.contacts.show` | `ContactController@show` | `crm/contacts/show` | `resources/js/pages/crm/contacts/show.tsx` | App |
| GET | `/crm/leads` | `crm.leads.index` | `app/Http/Controllers/Crm/LeadController.php@index` | `crm/leads/index` | `resources/js/pages/crm/leads/index.tsx` | App |
| GET | `/crm/leads/captures` | `crm.leads.captures` | `app/Http/Controllers/Crm/LeadCaptureController.php@index` | `crm/leads/captures` | `resources/js/pages/crm/leads/captures.tsx` | App |
| GET | `/crm/leads/{lead}` | `crm.leads.show` | `LeadController@show` | `crm/leads/show` | `resources/js/pages/crm/leads/show.tsx` | App |
| GET | `/crm/deals/import` | `crm.deals.import` | `app/Http/Controllers/Crm/DealImportController.php@create` | `crm/deals/import` | `resources/js/pages/crm/deals/import.tsx` | App |
| GET | `/crm/deals/import/{batch}` | `crm.deals.import.show` | `DealImportController@show` | `crm/deals/import` | same | App |
| GET | `/crm/deals` | `crm.deals.index` | `app/Http/Controllers/Crm/DealController.php@index` | `crm/deals/index` | `resources/js/pages/crm/deals/index.tsx` | App |
| GET | `/crm/deals/board` | `crm.deals.board` | `DealController@board` | `crm/deals/board` | `resources/js/pages/crm/deals/board.tsx` | App |
| GET | `/crm/deals/{deal}` | `crm.deals.show` | `DealController@show` | `crm/deals/show` | `resources/js/pages/crm/deals/show.tsx` | App |
| GET | `/crm/tickets` | `crm.tickets.index` | `app/Http/Controllers/Crm/TicketController.php@index` | `crm/tickets/index` | `resources/js/pages/crm/tickets/index.tsx` | App |
| GET | `/crm/tickets/board` | `crm.tickets.board` | `TicketController@board` | `crm/tickets/board` | `resources/js/pages/crm/tickets/board.tsx` | App |
| GET | `/crm/tickets/{ticket}` | `crm.tickets.show` | `TicketController@show` | `crm/tickets/show` | `resources/js/pages/crm/tickets/show.tsx` | App |
| GET | `/crm/quick-record-drawer/harness` | `crm.quick-record-drawer.harness` | `app/Http/Controllers/Crm/QuickRecordHarnessController.php@show` | `crm/quick-record-drawer/harness` | `resources/js/pages/crm/quick-record-drawer/harness.tsx` | App — **`local`/`testing` only** |
| GET | `/ads` | `ads.index` | `app/Http/Controllers/Ads/AdsCenterController.php@index` | `ads/index` | `resources/js/pages/ads/index.tsx` | App |
| GET | `/ads/attribution` | `ads.attribution` | `AdsCenterController@attribution` | `ads/attribution` | `resources/js/pages/ads/attribution.tsx` | App |
| GET | `/ads/audiences` | `ads.audiences` | `AdsCenterController@audiences` | `ads/audiences` | `resources/js/pages/ads/audiences.tsx` | App |
| GET | `/ads/campaigns` | `ads.campaigns.index` | `AdsCenterController@campaigns` | `ads/campaigns/index` | `resources/js/pages/ads/campaigns/index.tsx` | App |
| GET | `/ads/ad-sets` | `ads.ad-sets.index` | `AdsCenterController@adSets` | `ads/ad-sets/index` | `resources/js/pages/ads/ad-sets/index.tsx` | App |
| GET | `/ads/ads` | `ads.ads.index` | `AdsCenterController@adsIndex` | `ads/ads/index` | `resources/js/pages/ads/ads/index.tsx` | App |
| GET | `/ads/campaigns/{campaign}` | `ads.campaigns.show` | `AdsCenterController@show` | `ads/show` | `resources/js/pages/ads/show.tsx` | App |
| GET | `/outbound` | `outbound.index` | `app/Http/Controllers/Outbound/OutboundController.php@index` | `outbound/index` | `resources/js/pages/outbound/index.tsx` | App |
| GET | `/outbound/lists` | `outbound.lists.index` | `app/Http/Controllers/Outbound/ListsController.php@index` | `outbound/lists/index` | `resources/js/pages/outbound/lists/index.tsx` | App |
| GET | `/outbound/mailboxes` | `outbound.mailboxes.index` | `app/Http/Controllers/Outbound/MailboxController.php@index` | `outbound/mailboxes/index` | `resources/js/pages/outbound/mailboxes/index.tsx` | App |
| GET | `/outbound/warmup` | `outbound.warmup.index` | `app/Http/Controllers/Outbound/WarmupController.php@index` | `outbound/warmup` | `resources/js/pages/outbound/warmup.tsx` | App |
| GET | `/outbound/domains` | `outbound.domains.index` | `app/Http/Controllers/Outbound/DomainController.php@index` | `outbound/domains/index` | `resources/js/pages/outbound/domains/index.tsx` | App |
| GET | `/outbound/campaigns` | `outbound.campaigns.index` | `app/Http/Controllers/Outbound/CampaignController.php@index` | `outbound/campaigns/index` | `resources/js/pages/outbound/campaigns/index.tsx` | App |
| GET | `/outbound/campaigns/{campaign}` | `outbound.campaigns.show` | `CampaignController@show` | `outbound/campaigns/show` | `resources/js/pages/outbound/campaigns/show.tsx` | App |
| GET | `/outbound/sequences` | `outbound.sequences.index` | `app/Http/Controllers/Outbound/SequenceController.php@index` | `outbound/sequences/index` | `resources/js/pages/outbound/sequences/index.tsx` | App |
| GET | `/outbound/sequences/{sequence}` | `outbound.sequences.show` | `SequenceController@show` | `outbound/sequences/show` | `resources/js/pages/outbound/sequences/show.tsx` | App |
| GET | `/outbound/outbox` | `outbound.outbox.index` | `app/Http/Controllers/Outbound/OutboxController.php@index` | `outbound/outbox` | `resources/js/pages/outbound/outbox.tsx` | App |
| GET | `/outbound/replies` | `outbound.replies.index` | `app/Http/Controllers/Outbound/ReplyController.php@index` | `outbound/replies` | `resources/js/pages/outbound/replies.tsx` | App |
| GET | `/outbound/suppressions` | `outbound.suppressions.index` | `app/Http/Controllers/Outbound/SuppressionController.php@index` | `outbound/suppressions` | `resources/js/pages/outbound/suppressions.tsx` | App |
| GET | `/outbound/quiet-hours` | `outbound.quiet-hours.edit` | `app/Http/Controllers/Outbound/QuietHoursController.php@edit` | `outbound/quiet-hours` | `resources/js/pages/outbound/quiet-hours.tsx` | App |
| GET | `/outbound/templates` | `outbound.templates.index` | `app/Http/Controllers/Outbound/TemplateController.php@index` | `outbound/templates/index` | `resources/js/pages/outbound/templates/index.tsx` | App |
| GET | `/outbound/templates/{template}` | `outbound.templates.show` | `TemplateController@show` | `outbound/templates/show` | `resources/js/pages/outbound/templates/show.tsx` | App |
| GET | `/settings/apps` | `settings.apps` | `app/Http/Controllers/Settings/AppsController.php@index` | `settings/apps/index` | `resources/js/pages/settings/apps/index.tsx` | App+Settings |
| GET | `/settings/setup/{provider}` | `settings.setup.show` | `app/Http/Controllers/Settings/OAuthSetupController.php@show` | `settings/setup/wizard` | `resources/js/pages/settings/setup/wizard.tsx` | App+Settings |
| GET | `/settings/apps/meta` | `settings.apps.meta` | `AppsController@meta` | `settings/apps/meta` | `resources/js/pages/settings/apps/meta.tsx` | App+Settings |
| GET | `/settings/connectors` | `settings.connectors` | `app/Http/Controllers/Settings/ConnectorController.php@index` | `settings/connectors` | `resources/js/pages/settings/connectors.tsx` | App+Settings |
| GET | `/settings/evolution` | `settings.evolution` | `app/Http/Controllers/Settings/EvolutionSettingsController.php@edit` | `settings/evolution` | `resources/js/pages/settings/evolution.tsx` | App+Settings |
| GET | `/settings/whatsapp` | `settings.whatsapp` | `app/Http/Controllers/Settings/WhatsAppController.php@show` | `settings/whatsapp` | `resources/js/pages/settings/whatsapp.tsx` | App+Settings |
| GET | `/settings/whatsapp-business` | `settings.whatsapp-business` | `WhatsAppController@showBusiness` | `settings/whatsapp-business` | `resources/js/pages/settings/whatsapp-business.tsx` | App+Settings |
| GET | `/settings/meta` | `settings.meta` | `app/Http/Controllers/Settings/MetaSettingsController.php@edit` | `settings/meta` | `resources/js/pages/settings/meta.tsx` | App+Settings |
| GET | `/settings/channels` | `settings.channels` | `app/Http/Controllers/Settings/ChannelSettingsController.php@edit` | `settings/channels` | `resources/js/pages/settings/channels.tsx` | App+Settings |
| GET | `/settings/attributes` | `settings.attributes` | `app/Http/Controllers/Settings/CustomAttributeController.php@edit` | `settings/attributes` | `resources/js/pages/settings/attributes.tsx` | App+Settings |
| GET | `/settings/pipelines` | `settings.pipelines` | `app/Http/Controllers/Settings/PipelineController.php@index` | `settings/pipelines` | `resources/js/pages/settings/pipelines.tsx` | App+Settings |
| GET | `/settings/permissions` | `settings.permissions` | `app/Http/Controllers/Settings/PermissionsController.php@index` | `settings/permissions` | `resources/js/pages/settings/permissions.tsx` | App+Settings |
| GET | `/settings/record-layouts` | `settings.record-layouts` | `app/Http/Controllers/Settings/RecordLayoutSettingsController.php@index` | `settings/record-layouts` | `resources/js/pages/settings/record-layouts.tsx` | App+Settings |
| GET | `/settings/profile` | `profile.edit` | `app/Http/Controllers/Settings/ProfileController.php@edit` | `settings/profile` | `resources/js/pages/settings/profile.tsx` | App+Settings |
| GET | `/settings/security` | `security.edit` | `app/Http/Controllers/Settings/SecurityController.php@edit` | `settings/security` | `resources/js/pages/settings/security.tsx` | App+Settings |
| GET | `/settings/appearance` | `appearance.edit` | `Route::inertia` in `routes/settings.php` | `settings/appearance` | `resources/js/pages/settings/appearance.tsx` | App+Settings |
| GET | `/settings/meetings` | `settings.meetings` | `app/Http/Controllers/Settings/MeetingScheduleController.php@edit` | `settings/meetings` | `resources/js/pages/settings/meetings.tsx` | App+Settings |
| GET | `/settings/system-health` | `settings.system-health` | `app/Http/Controllers/Settings/SystemHealthController.php` | `settings/system-health` | `resources/js/pages/settings/system-health.tsx` | App+Settings |
| GET | `/settings/audit` | `settings.audit` | `app/Http/Controllers/Settings/AuditTrailController.php` | `settings/audit` | `resources/js/pages/settings/audit.tsx` | App+Settings |
| GET | `/settings/qualify` | `settings.qualify` | `app/Http/Controllers/Settings/LeadScoreSettingsController.php@edit` | `settings/qualify` | `resources/js/pages/settings/qualify.tsx` | App+Settings |
| GET | `/settings/playbooks` | `settings.playbooks` | `app/Http/Controllers/Settings/PlaybookController.php@index` | `settings/playbooks` | `resources/js/pages/settings/playbooks.tsx` | App+Settings |
| GET | `/settings/people` | `settings.people` | `app/Http/Controllers/Settings/PeopleController.php@index` | `settings/people` | `resources/js/pages/settings/people.tsx` | App+Settings |
| GET | `/settings/sms` | `settings.sms` | `app/Http/Controllers/Settings/SmsSettingsController.php@edit` | `settings/sms` | `resources/js/pages/settings/sms.tsx` | App+Settings |
| GET | `/settings/quotas` | `settings.quotas` | `app/Http/Controllers/Settings/QuotaController.php@edit` | `settings/quotas` | `resources/js/pages/settings/quotas.tsx` | App+Settings |
| GET | `/settings/workspace` | `settings.workspace` | `app/Http/Controllers/Settings/WorkspaceSettingsController.php@edit` | `settings/workspace` | `resources/js/pages/settings/workspace.tsx` | App+Settings |
| GET | `/settings/agent` | `settings.agent` | `app/Http/Controllers/Settings/AgentSettingsController.php@edit` | `settings/agent` | `resources/js/pages/settings/agent.tsx` | App+Settings |

**Count:** 96 Inertia GET route definitions in the `web.php` + `settings.php` graph (including the env-gated harness). `reports.category` is one definition that serves four paths.

**Orphan page (not routed):** `resources/js/pages/leads/board.tsx` — `/leads` redirects to `/crm/deals/board`.

### 2.2 Non-Inertia GET in the same files (not in the table above)

Redirects: `/` → login/dashboard; `/shell` → `/dashboard`; `/leads` → `/crm/deals/board`; `/desk` → `/inbox`; `/outbound/reports` → `/reports/outbound`; `/settings` → `/settings/profile`; `/settings/setup` → wizard.

OAuth redirects/callbacks, webhooks, tracking pixels, `/unsubscribe` (Blade), `/design-lab` (Blade), `/up/scheduler` (JSON), `/api/agent/*` (JSON), `/crm/command/search` (JSON), `/ask-evo/context` (JSON), `/crm/records/{type}/{id}/peek` (JSON), `/crm/record-layouts/{entity}` (JSON), CSV exports, `/crm/quotes/{quote}/preview` (PDF), `/settings/whatsapp/status` (JSON).

### 2.3 Fortify Inertia pages (not in `routes/web.php`)

Registered in `app/Providers/FortifyServiceProvider.php`: `auth/login`, `auth/register`, `auth/forgot-password`, `auth/reset-password`, `auth/verify-email`, `auth/two-factor-challenge`, `auth/confirm-password` → `resources/js/pages/auth/*` via `AuthLayout`. Wave 1 AppShell does not wrap these.

### 2.4 Error pages

No Inertia `errors/*` pages exist under `resources/js/pages`. `bootstrap/app.php` does not register branded 404/403/500 Inertia views. Blueprint §26 lists those as Document archetype; they are **not present** as product routes today.

---

## 3. Route → proposed archetype

Four archetypes from blueprint L1 / §26: **WORKSPACE** (lists/boards), **RECORD**, **CONVERSATION**, **DOCUMENT** (dashboard, quote document, settings, analytics/config). Public/auth stay outside the product shell.

Blueprint path aliases that **do not match the repo:** §26 writes `/crm/inbox/*`, `/crm/ads`, `/crm/agents`, `/crm/outbound/*`. Live paths are `/inbox`, `/ads`, `/agents`, `/outbound/*`. Mapping below uses **live** paths.

| Route name | Live path | Proposed archetype | Notes vs blueprint §26 |
|---|---|---|---|
| `legal.terms` | `/terms` | — (Public) | Out of AppShell |
| `legal.privacy` | `/privacy` | — (Public) | Out of AppShell |
| `quotes.public.show` | `/q/{token}` | — (Public) | Customer document, not product chrome |
| `meetings.public.show` | `/book/{slug}` | — (Public) | |
| `meetings.public.done` | `/book/{slug}/done` | — (Public) | |
| `dashboard` | `/dashboard` | **DOCUMENT** | Accueil; page scrolls; sticky header row 1 |
| `agents.index` | `/agents` | **WORKSPACE** | Blueprint “Workspace → Record”; today one page + rail Agents mode |
| `agents.chats.index` | `/agents/chats` | **WORKSPACE** | Same `agents/index` component |
| `agents.chats.show` | `/agents/chats/{chat}` | **WORKSPACE** | Same component; client URL state |
| `agents.bots.index` | `/agents/bots` | **WORKSPACE** | Same component |
| `agents.bots.create` | `/agents/bots/new` | **WORKSPACE** | Same component |
| `agents.bots.show` | `/agents/bots/{bot}` | **WORKSPACE** | Same component |
| `desk.inbox` | `/inbox` | **CONVERSATION** | Blueprint `/crm/inbox/*` |
| `crm.conversations` | `/conversations` | **WORKSPACE** | Not in §26; history list + `DeskShell` |
| `reports` | `/reports` | **DOCUMENT** | |
| `reports.category` | `/reports/{category}` | **DOCUMENT** | |
| `crm.reports` | `/crm/reports` | **DOCUMENT** | Alias of reports |
| `reports.funnels` | `/reports/funnels` | **DOCUMENT** | |
| `crm.report-builder.index` | `/crm/report-builder` | **DOCUMENT** | Simple-mode 403 |
| `crm.report-builder.cross-object` | `/crm/report-builder/cross-object` | **DOCUMENT** | Simple-mode 403 |
| `crm.report-builder.run` | `/crm/report-builder/{id}/run` | **DOCUMENT** | Simple-mode 403 |
| `crm.activities.index` | `/crm/activities` | **WORKSPACE** | |
| `crm.segments.index` | `/crm/segments` | **WORKSPACE** | |
| `crm.segments.show` | `/crm/segments/{segment}` | **WORKSPACE** | Membership list, not a CRM record |
| `automation` | `/automation` | **WORKSPACE** | Same page as workflows |
| `crm.workflows.index` | `/crm/workflows` | **WORKSPACE** | Blueprint “Workspace → canvas” |
| `crm.quotes.index` | `/crm/quotes` | **WORKSPACE** | |
| `crm.quotes.show` | `/crm/quotes/{quote}` | **DOCUMENT** | Editor + preview |
| `crm.companies.index` | `/crm/companies` | **WORKSPACE** | |
| `crm.companies.show` | `/crm/companies/{company}` | **RECORD** | |
| `crm.contacts.index` | `/crm/contacts` | **WORKSPACE** | |
| `crm.contacts.import` | `/crm/contacts/import` | **DOCUMENT** | Wizard; not in §26 |
| `crm.contacts.import.show` | `/crm/contacts/import/{batch}` | **DOCUMENT** | |
| `crm.contacts.merge.index` | `/crm/contacts/duplicates` | **DOCUMENT** | |
| `crm.contacts.merge.show` | `/crm/contacts/merge/{a}/{b}` | **DOCUMENT** | |
| `crm.contacts.show` | `/crm/contacts/{contact}` | **RECORD** | |
| `crm.leads.index` | `/crm/leads` | **WORKSPACE** | |
| `crm.leads.captures` | `/crm/leads/captures` | **WORKSPACE** | Capture inbox; not in §26 |
| `crm.leads.show` | `/crm/leads/{lead}` | **RECORD** | |
| `crm.deals.import` | `/crm/deals/import` | **DOCUMENT** | |
| `crm.deals.import.show` | `/crm/deals/import/{batch}` | **DOCUMENT** | |
| `crm.deals.index` | `/crm/deals` | **WORKSPACE** | |
| `crm.deals.board` | `/crm/deals/board` | **WORKSPACE** | |
| `crm.deals.show` | `/crm/deals/{deal}` | **RECORD** | + stage path in later wave |
| `crm.tickets.index` | `/crm/tickets` | **WORKSPACE** | Simple-mode 403 |
| `crm.tickets.board` | `/crm/tickets/board` | **WORKSPACE** | Simple-mode 403 |
| `crm.tickets.show` | `/crm/tickets/{ticket}` | **RECORD** | Simple-mode 403; §26 groups tickets with lists only |
| `crm.quick-record-drawer.harness` | harness | **DOCUMENT** | Dev only |
| `ads.index` | `/ads` | **DOCUMENT** | Blueprint `/crm/ads` |
| `ads.attribution` | `/ads/attribution` | **DOCUMENT** | View-tab of Ads |
| `ads.audiences` | `/ads/audiences` | **DOCUMENT** | |
| `ads.campaigns.index` | `/ads/campaigns` | **DOCUMENT** | |
| `ads.ad-sets.index` | `/ads/ad-sets` | **DOCUMENT** | |
| `ads.ads.index` | `/ads/ads` | **DOCUMENT** | |
| `ads.campaigns.show` | `/ads/campaigns/{id}` | **DOCUMENT** | |
| `outbound.index` | `/outbound` | **DOCUMENT** | Overview |
| `outbound.lists.index` | `/outbound/lists` | **WORKSPACE** | |
| `outbound.mailboxes.index` | `/outbound/mailboxes` | **DOCUMENT** | Infra/config; Wave 1 chrome only |
| `outbound.warmup.index` | `/outbound/warmup` | **DOCUMENT** | Simple-mode 403 |
| `outbound.domains.index` | `/outbound/domains` | **DOCUMENT** | |
| `outbound.campaigns.index` | `/outbound/campaigns` | **WORKSPACE** | |
| `outbound.campaigns.show` | `/outbound/campaigns/{id}` | **DOCUMENT** | Campaign workspace |
| `outbound.sequences.index` | `/outbound/sequences` | **WORKSPACE** | |
| `outbound.sequences.show` | `/outbound/sequences/{id}` | **DOCUMENT** | Builder |
| `outbound.outbox.index` | `/outbound/outbox` | **WORKSPACE** | |
| `outbound.replies.index` | `/outbound/replies` | **WORKSPACE** | |
| `outbound.suppressions.index` | `/outbound/suppressions` | **WORKSPACE** | |
| `outbound.quiet-hours.edit` | `/outbound/quiet-hours` | **DOCUMENT** | |
| `outbound.templates.index` | `/outbound/templates` | **WORKSPACE** | |
| `outbound.templates.show` | `/outbound/templates/{id}` | **DOCUMENT** | |
| All `settings.*` / `profile.edit` / `security.edit` / `appearance.edit` (26 routes) | `/settings/*` | **DOCUMENT** | Own left nav; today a **modal**, target is a full page (D16, P3.2 — not Wave 1 page rewrite) |

### 3.1 Archetype counts (96 Inertia GET defs)

| Archetype | Count | How counted |
|---|---|---|
| **WORKSPACE** | **29** | CRM lists/boards, activities, segments, workflows ×2, conversations, 9 outbound lists, 6 agents routes |
| **RECORD** | **5** | contact / company / lead / deal / ticket show |
| **CONVERSATION** | **1** | `/inbox` only |
| **DOCUMENT** | **56** | Accueil, quotes show, reports ×4, report-builder ×3, ads ×7, outbound overviews/builders/config ×7, imports/merge ×6, harness ×1, settings ×26 |
| **Public (no product archetype)** | **5** | terms, privacy, public quote, book, book-done |

If `reports.category` is expanded to four URLs, DOCUMENT becomes 59 and the Inertia URL count becomes 99. Counts above are **route definitions**.

---

## 4. Shared primitive map

Owner-agent codes (Wave 1 only):

- **Shell Agent** — AppShell, rail, top-bar removal, sidebar Create/Search/bell/user, collapse 224/56, Cmd+K placement
- **Workspace Frame Agent** — new `WorkspaceFrame` + `WorkspaceHeader`, page-header unification, workspace scroll slot
- **PROTECTED** — do not edit in Wave 1
- **LEAVE** — later wave; do not “clean up” now

| File | Role today | Consumers (confirmed) | Wave 1 owner |
|---|---|---|---|
| `resources/js/layouts/app-layout.tsx` | Mounts shell + global drawers | All App pages | **Shell Agent** |
| `resources/js/layouts/app/app-sidebar-layout.tsx` | `AppShell` + `EvoShell` + top bar + `overflow-y-auto` page | All App pages | **Shell Agent** — after Frame Agent publishes `WorkspaceFrame`, Shell Agent mounts it here and **stops rendering** `AppSidebarHeader`. One-line import only; Frame Agent does not edit this file. |
| `resources/js/components/app-shell.tsx` | `SidebarProvider` + `--sidebar-width: 248px` | `app-sidebar-layout.tsx` | **Shell Agent** |
| `resources/js/components/shell/evo-shell.tsx` | 212px rail, collapse, mobile sheet, CommandPalette | `app-sidebar-layout.tsx` | **Shell Agent** |
| `resources/js/components/shell/evo-rail.tsx` | Menu/Agents/Search, hierarchical nav, settings + user footer | `evo-shell.tsx` | **Shell Agent** |
| `resources/js/components/shell/product-nav.ts` | Canonical Menu tree + `visibleSections` | `evo-rail.tsx` | **PROTECTED** — render it, do not rewrite IDs/hrefs/permissions |
| `resources/js/evo/shell/mode-switch.tsx` | Menu / Agents / Search pill | `evo-rail.tsx` | **Shell Agent** (retire per D8) |
| `resources/js/components/app-sidebar-header.tsx` | Global top bar | `app-sidebar-layout.tsx` | **Shell Agent** (remove from tree) |
| `resources/js/evo/patterns/command-palette/index.tsx` | ⌘K dialog | `evo-shell.tsx` | **PROTECTED** internals; Shell Agent may only change **where it is opened from** |
| `resources/js/ds/chrome/PageHeader.tsx` | List title + primary | `DataWorkspace.tsx` | **Workspace Frame Agent** |
| `resources/js/evo/patterns/page-header/index.tsx` | Re-export of DS PageHeader | (re-export) | **Workspace Frame Agent** |
| `resources/js/components/crm/crm-object-header.tsx` | Non-DataWorkspace object header | segments, captures, ticket board, leads board; secondary links on some lists | **Workspace Frame Agent** |
| `resources/js/components/dashboard/dashboard-header.tsx` | Unused “Home” header | **none** | **LEAVE** |
| `resources/js/pages/home.tsx` greeting `<header>` | 27px “Hello :name” + New deal | home only | **LEAVE** page body; Frame Agent does not rewrite Accueil in Wave 1 |
| `resources/js/ds/workspace/DataWorkspace.tsx` | List chrome contract | `crm-list-shell.tsx` only | **PROTECTED** |
| `resources/js/ds/workspace/SavedViews.tsx` | View tabs | DataWorkspace | **PROTECTED** |
| `resources/js/ds/workspace/FilterBar.tsx` | Filter row | DataWorkspace | **PROTECTED** |
| `resources/js/ds/workspace/AdvancedFilterDrawer.tsx` | FilterBuilder host | DataWorkspace | **PROTECTED** |
| `resources/js/evo/data/filters/index.tsx` | FilterBuilder | AdvancedFilterDrawer, SegmentRulesEditor | **PROTECTED** |
| `resources/js/evo/data/data-grid/index.tsx` | DataGrid | crm-list table + ads/outbound/automation/reports | **PROTECTED** |
| `resources/js/evo/data/crm-list/tablecn.tsx` | Tablecn variant | **no importer** | **LEAVE** |
| `resources/js/evo/data/saved-views/index.tsx` | Second SavedViews | ads list-toolbar, outbound CampaignList | **LEAVE** |
| `resources/js/components/crm/crm-list-shell.tsx` | Inertia → DataWorkspace adapter | 7 CRM list/board pages | **PROTECTED** |
| `resources/js/evo/crm/record/RecordWorkspace.tsx` | `RecordPageFrame`, `RecordShell`, `RecordWorkspace` | CRM show pages + quote frame + design-lab | **PROTECTED** |
| `resources/js/components/crm/record-chrome.tsx` | Re-exports `RecordShell`; record actions/cards | CRM show + quote builder | **PROTECTED** |
| `resources/js/ds/workspace/QuickRecordDrawer.tsx` + `quick-record/` | Global peek | `app-layout.tsx`, lists, board, rail, palette, dashboard attention | **PROTECTED** |
| `resources/js/evo/crm/record/QuickRecord.tsx` | Alternate peek UI | design-lab | **PROTECTED** / **LEAVE** |
| `resources/js/evo/crm/pipeline/*` | Pipeline + DnD | deals board, tickets board | **PROTECTED** |
| `resources/js/components/crm/pipeline-kanban.tsx` | Legacy kanban (no @dnd-kit) | `pages/leads/board.tsx` only (unrouted) | **LEAVE** |
| `resources/js/components/crm/room-shell.tsx` | Horizontal room tabs | crm/desk/outbound/reports/ads shells | **LEAVE** (Wave 1 does not restyle rooms; later pages move tabs into WorkspaceHeader slot J) |
| `resources/js/components/crm/crm-shell.tsx` | CRM room wrapper | segments, workflows, activities, imports, captures, ticket board | **LEAVE** |
| `resources/js/components/crm/desk-shell.tsx` | Inbox room tabs | inbox, conversations | **LEAVE** |
| `resources/js/components/crm/outbound-shell.tsx` | Outbound room + inner scroll | `pages/outbound/**` | **LEAVE** |
| `resources/js/components/crm/reports-shell.tsx` | Reports room | reports pages | **LEAVE** |
| `resources/js/evo/ads/shell.tsx` | Ads room + header | `pages/ads/**` | **LEAVE** |
| `resources/js/components/crm/adaptive-workspace-shell.tsx` | Multi-pane responsive | inbox; quote-split-builder panel switcher | **PROTECTED** |
| `resources/js/evo/inbox/*` | Inbox workspace pieces | `pages/desk/inbox.tsx` | **PROTECTED** |
| `resources/js/evo/patterns/settings/settings-layout.tsx` | Settings **dialog** | all `settings/*` via `app.tsx` | **LEAVE** (P3.2). Shell Agent must not convert the modal in Wave 1. |
| `resources/js/evo/ui/button.tsx` / cards / drawers | Shared controls | everywhere | **PROTECTED** unless a token-only class change is required — prefer CSS tokens |
| `resources/js/components/ui/sidebar.tsx` | shadcn sidebar (240/64) | mobile sheet path in `EvoShell` | **Shell Agent** may keep using it for mobile; do not reintroduce it as the desktop rail |
| `resources/js/components/user-menu-content.tsx` | Settings + Log out only | `evo-rail.tsx` (and leftover sidebars) | **Shell Agent** (add Apparence / Langue per D6) |

**New files Wave 1 should add (do not exist today):**

| Proposed path | Owner | Purpose |
|---|---|---|
| `resources/js/evo/workspace/WorkspaceFrame.tsx` | **Workspace Frame Agent** | Header slot + single workspace scroll owner |
| `resources/js/evo/workspace/WorkspaceHeader.tsx` | **Workspace Frame Agent** | Slots A–Q (blueprint §12) |
| `resources/js/evo/workspace/types.ts` | **Workspace Frame Agent** | Slot props; the only shared type both agents import |
| `resources/css/workspace-frame.css` (or `resources/js/evo/workspace/workspace-frame.css`) | **Workspace Frame Agent** | Header row heights 48/40/36, gutters — **not** rail widths |

---

## 5. State ownership

| Concern | Owner today | Store | Wave 1 rule |
|---|---|---|---|
| Hierarchical nav tree | `product-nav.ts` + server `SimpleMode::nav()` | Module constant + Inertia `nav` / `features` / `simpleMode` (`HandleInertiaRequests.php:63–65`) | **PROTECTED** |
| Rail mode (menu/agents/search) | `EvoShell` `modeState` | React; `/agents*` defaults to `agents` (`evo-shell.tsx:54–60`) | Shell Agent retires the pill; Agents becomes a nav item (Full mode) |
| Desktop rail collapse | `EvoShell` `collapsedState` | React only — **not persisted** | Shell Agent: persist expanded/collapsed (blueprint §10.2 cookie, SSR via Inertia) |
| shadcn `sidebar_state` cookie | `SidebarProvider` + `HandleInertiaRequests.php:79` `sidebarOpen` | Cookie, 7 days (`ui/sidebar.tsx`) | **Do not confuse with EvoRail collapse.** Desktop rail ignores this. Shell Agent should decide one persist key. |
| Cmd+K palette open | `EvoShell` `paletteOpen` | React; shortcut disabled on mobile (`evo-shell.tsx:74–82`) | Shell Agent: keep palette as centred dialog (D4); do not open it inside the rail |
| Rail Search mode query | `evo-rail.tsx` | Local input + `GET /crm/command/search` | **PROTECTED** search API; UI moves to sidebar field → same palette |
| Theme | `use-appearance.tsx` + `app.blade.php` | `localStorage.appearance` + cookie `appearance` + `html.dark` | Shell Agent: remove top-bar toggle; put Clair/Sombre/Système in user menu |
| Locale / dir | `App\Support\Locale`, `SetLocale`, `HandleInertiaRequests` `locale`/`dir`/`translations` | Cookie `locale`, user/workspace prefs, `lang/{locale}.json` | **PROTECTED** |
| Tasks / bell count | `evoOpenTaskCount` / `evoOpenTasks` shared props | Server query in `HandleInertiaRequests.php:80–109` | Shell Agent: move bell to rail footer (D5); keep `TasksOverlay` |
| Ask Evo open | `openAskEvo()` custom event (`lib/ask-evo.ts`) | `AskEvoDrawer` in `app-layout.tsx` | Shell Agent may hide the top-bar sparkle; **do not change** the drawer contract (⌘J comes later, D7) |
| QuickRecord peek | `QuickRecordProvider` | Client machine + `GET /crm/records/{type}/{id}/peek` | **PROTECTED** |
| List query | `lib/list-query/*` | URL | **PROTECTED** |
| Deal list ↔ board | `lib/list-query/deal-layout.ts` | URL path + preserved query | **PROTECTED** |
| Inbox folder / thread | `lib/inbox-workspace.ts` `InboxQuery` (`thread`, `folder`, `q`, `context`) | URL | **PROTECTED** |
| Agents workspace view | `lib/desk/agents-workspace-state.ts` + `bot-catalog` | Client + `/agents/...` path | **PROTECTED** |
| Settings dialog open | `SettingsLayout` `Dialog.Root open` always true; close → `router.visit('/dashboard')` | Route presence | **LEAVE** (P3.2) |
| Record pane (mobile) | `RecordShell` `defaultPane` | React | **PROTECTED** |
| Selection / bulk | `ds/workspace/selection.ts` | Client, per DataWorkspace | **PROTECTED** |

---

## 6. Scroll ownership (today)

**Global rule today:** `app-sidebar-layout.tsx` wraps every App page in `.aurora-page-shell.flex-1.overflow-y-auto`. `EvoShell` itself is `h-dvh overflow-hidden`. So the **window does not scroll**; the **page shell does**. Many pages then add a second scroller.

| Surface | Outer scroller | Inner scroller(s) | Duplicate? |
|---|---|---|---|
| Almost all App pages | `.aurora-page-shell overflow-y-auto` | varies | Often yes |
| Accueil `pages/home.tsx` | page shell | page `overflow-x-hidden` only | Single (document-like) — matches DOCUMENT |
| Contacts / companies / leads / deals list / quotes / tickets list | page shell | DataGrid `overflow-auto` (`evo/data/data-grid/index.tsx` via crm-list table) | **Yes** — page + grid |
| Deals board | `CrmListShell` `contentClassName` includes `overflow-y-hidden` | `Pipeline.tsx` `overflow-x-auto`; `PipelineColumn.tsx` `overflow-y-auto` | Intended board/column scroll; **still inside** page shell. Blueprint: window must not scroll (L5). **UNCERTAIN** whether page shell still receives overflow when KPI/attention blocks exceed the viewport (blueprint audit: page + board both scroll on live Deals). |
| Record show | page shell | `RecordWorkspace.tsx` `ScrollPane` = `overflow-y-auto` per column | **Yes** — page + panes |
| Quote show | page shell | `quote-split-builder.tsx` panes `overflow-y-auto` | **Yes** |
| Inbox | page shell + `AdaptiveWorkspaceShell` panes | thread column `overflow-y-auto` (`desk/inbox.tsx:131`) | **Yes** — multiple panes + page |
| Settings | page shell (dimmed behind dialog) | dialog nav `overflow-y-auto` + pane `overflow-y-auto` (`settings-layout.tsx:415,433`) | Dialog-local; page shell still exists underneath |
| Ads | page shell | `evo/ads/shell.tsx` child `overflow-y-auto` | **Yes** |
| Outbound | page shell | `outbound-shell.tsx` `h-full overflow-y-auto` | **Yes** |
| Automation `workflows/index.tsx` | page shell | page `overflow-y-auto` | **Yes** |
| Agents | page shell (`agents-route-page-shell`) | section `flex-1 overflow-y-auto` | **Yes** |
| Rail itself | `evo-rail.tsx` `.evo-scroll overflow-y-auto` | settings footer also `.evo-scroll` | Rail-local only |

**Wave 1 scroll law (blueprint D10 / L5):** Workspace, Record, Conversation: `document.scrollingElement.scrollHeight === innerHeight`. Document (Accueil, Settings, quote document): the **page** (workspace column) scrolls; header row 1 sticks. Grid body / board columns / record panes are the regional owners. The current `.aurora-page-shell.overflow-y-auto` is the main obstacle — **Shell Agent owns that class** and must hand the scroll slot to `WorkspaceFrame`.

---

## 7. URL-state ownership

Canonical list bag: `resources/js/lib/list-query/`.

| Key class | File | Keys |
|---|---|---|
| Canonical workspace | `keys.ts` `CANONICAL_WORKSPACE_KEYS` | `q`, `page`, `view`, `filter_id`, `filter_groups`, `sort`, `direction` |
| Chrome filters | `CHROME_FILTER_KEYS` | `owner`, `created`, `last_activity`, `status`, `stage`, `city`, `wilaya`, `unanswered`, `unassigned`, `priority`, `channel`, `attention` |
| Preserved siblings | `UNRELATED_PRESERVED_KEYS` | `sort`, `direction`, `pipeline` |
| Unsafe (must not be rewritten) | `UNSAFE_QUERY_KEYS` | `owner_id`, `columns`, `create`, `contact_id`, `mode`, `peek` |

Writers: `DataWorkspace.tsx`, `FilterBar.tsx`, `SavedViews.tsx`, `AdvancedFilterDrawer.tsx`, `crm-list-shell.tsx`, `deal-layout-toggle.tsx`. Adapter: `resources/js/evo/data/adapters/url-state.ts` (Inertia replace, no nuqs).

Deal list ↔ board: `resources/js/lib/list-query/deal-layout.ts` + `deal-layout-contract.ts`. Board drops `page`; keeps search/view/filters/sort/`pipeline`. Never writes `peek` / `mode` / `create`.

Create deep-link: `?create=1` is an **unsafe** list key. Top-bar Create and page MorphingForms both use it. Wave 1 must keep the query working.

Inbox: `resources/js/lib/inbox-workspace.ts` — `thread`, `folder`, `q`, `context`. Folder keys today include **channel folders** (`whatsapp`, `whatsapp_cloud`, `email`, `telegram`, `sms`) plus `all` / `unassigned` / `mine` / `open` / `closed`. Blueprint D14 replaces channel-as-queue with À moi / Non assignés / Équipe / Support / Tous — **later Inbox wave**, not Wave 1.

Agents: path `/agents`, `/agents/chats/{id}`, `/agents/bots/{id}` plus client store. **PROTECTED**.

Settings: the URL **is** the page, but chrome is a modal (`Dialog.Root open`). Closing navigates to `/dashboard` (`settings-layout.tsx:28–32`).

**Wave 1:** do not change serializers, key names, or adapters.

---

## 8. Protected contracts (with paths)

| Contract | Code | Docs / tests |
|---|---|---|
| Product nav (PR #284) | `resources/js/components/shell/product-nav.ts` | `product-nav.test.ts` |
| Simple / Full Mode | `app/Support/SimpleMode.php`, `app/Http/Middleware/EnforceSimpleMode.php`, `resources/js/hooks/use-simple-mode.ts` | Inertia share in `HandleInertiaRequests.php` |
| Permissions / capabilities | `HandleInertiaRequests.php` `auth.capabilities`; `EnforceProductPermissions` | `config/permissions.php` (**UNCERTAIN** full map — not re-audited here) |
| DataWorkspace | `resources/js/ds/workspace/DataWorkspace.tsx`, `types.ts`, `data-workspace-contract.ts` | `docs/implementation/p03a-dataworkspace-ownership.md` |
| DataGrid | `resources/js/evo/data/data-grid/index.tsx` | `docs/implementation/canonical-component-map.md` |
| Tablecn | `resources/js/evo/data/crm-list/tablecn.tsx` | No consumer; treat as protected surface |
| FilterBuilder | `resources/js/evo/data/filters/index.tsx` | via `AdvancedFilterDrawer.tsx` |
| SavedViews | `resources/js/ds/workspace/SavedViews.tsx` | list-query `view` / `filter_id` |
| RecordWorkspace | `resources/js/evo/crm/record/RecordWorkspace.tsx` (`RecordShell`, `RecordPageFrame`, `RecordWorkspace`) | `record-workspace.test.ts`; barrel `evo/crm/record/index.ts` |
| QuickRecord | `resources/js/ds/workspace/QuickRecordDrawer.tsx`, `ds/workspace/quick-record/*`, peek route `crm.records.peek` | `quick-record-drawer-contract.ts`, `docs/implementation/p09-*.md`, `p10-*.md` |
| Pipeline + DnD | `resources/js/evo/crm/pipeline/Pipeline.tsx` (+ Column/Card/LostReason/announcements) | `docs/implementation/p11-deals-pipeline-board.md` |
| Inbox / Desk / WhatsApp | `resources/js/evo/inbox/*`, `pages/desk/inbox.tsx`, `lib/inbox-workspace.ts`, `InboxController` | `docs/implementation/p13-inbox-workspace.md` |
| Outbound | `resources/js/evo/outbound/*`, `pages/outbound/**` | no dedicated `pXX-outbound.md` found |
| Automation | `resources/js/evo/automation/*`, `pages/crm/workflows/index.tsx` | `docs/implementation/p19-*.md`, `p20-*.md` |
| Agents | `pages/agents/index.tsx`, `components/desk/agents-*.tsx`, `lib/desk/*` | no `docs/implementation/*agents*` contract found |
| EvoViz | `resources/js/evoviz/contract.ts`, `resources/js/evo/charts/*` | brandbook tokens |
| Quotes | `QuoteController`, `pages/crm/quotes/*`, `evo/crm/quote/*` | `docs/implementation/p08-*.md`, `p18-*.md` |
| Localization | `app/Support/Locale.php`, `resources/js/lib/i18n.ts`, `lang/{fr,en,ar}.json`, `HandleInertiaRequests` translations | `docs/i18n/glossary.md` |
| Money / date / phone | `resources/js/evo/lib/format.ts` | **PROTECTED** |
| Canonical URL state | `resources/js/lib/list-query/*` | `list-query-contract.ts`, `docs/implementation/p03c-query-ownership.md` |
| Deal layout URL | `lib/list-query/deal-layout.ts` | `deal-layout-contract.ts` |
| Cmdk palette | `resources/js/evo/patterns/command-palette/index.tsx` | blueprint §33.2 preserve |
| Routes / controllers | `routes/web.php`, `routes/settings.php`, `app/Http/Controllers/**` | do not add/rename routes in Wave 1 |

---

## 9. Top-bar inventory

Rendered only by `AppSidebarHeader` (`resources/js/components/app-sidebar-header.tsx`), mounted in `app-sidebar-layout.tsx:15`. Class `header.app-topbar`. Height tokens conflict: `--evo-chrome-height: 48px` (`evo/tokens/evo.css:95`) vs `approved-v02.css` 52px `.app-topbar`. Sticky inside `.evo-workspace` (`evo-shell.css`).

| # | Element | Rendered by | Behavior | Blueprint destination |
|---|---|---|---|---|
| 1 | Mobile logo “EvoCRM” | `Link` + `AppLogoIcon` (`md:hidden`) | → `/dashboard` | Mobile app bar (P0.1 / §29) |
| 2 | Mobile hamburger | `SidebarTrigger` `data-chrome="menu"` | Opens shadcn offcanvas `EvoRail` | Mobile tab bar; no hamburger at ≥768 (L15 / §12 slot A) |
| 3 | Theme | `Button` + `Sun`, `useAppearance().updateAppearance` | Toggles light ↔ dark | User menu → Apparence (D6) |
| 4 | Ask Evo | `Button` + `Sparkle` `data-chrome="ai"` | `openAskEvo()`; gated `features.ask_evo`; **hidden** on `/crm/quotes*` | ⌘J panel; not a top-bar icon (D7) |
| 5 | Create (orange) | `Button.evo-create-btn` + `Plus` + `t('Create')` | Dropdown | Sidebar header “+” **neutral** (D3) |
| 6 | Create → Contact | `Link` `/crm/contacts?create=1` | | Keep query; new host |
| 7 | Create → Company | `/crm/companies?create=1` | | same |
| 8 | Create → Lead | `/crm/leads?create=1` | | Full mode still has Lead (D3) |
| 9 | Create → Deal | `/crm/deals?create=1` | | same |
| 10 | Create → Quote | `/crm/quotes?create=1` if `canCreateQuote` | | same |
| 11 | Bell | `Button` + `Bell` `data-chrome="notify"`; hidden `<390px` | Opens `TasksOverlay`; count from `evoOpenTaskCount` | Sidebar footer bell (D5). Label today is **Tasks**, not “Notifications”. |
| 12 | Tasks overlay | `TasksOverlay` sibling | `openEvoTasks` window event | Keep component; move trigger |

**Not in the top bar (often confused with it):**

| Element | Actual host |
|---|---|
| Menu / Agents / Search pill | `ShellModeSwitch` in `evo-rail.tsx:288` |
| Search field | Rail Search **mode** (`evo-rail.tsx` search panel) — not a top-bar input |
| User avatar / account | Rail footer (`evo-rail.tsx:391–422`) — menu is Settings + Log out only (`user-menu-content.tsx`) |
| Breadcrumbs | Passed to layout, **not shown** |
| Workspace switcher | Rail shows workspace **name** only (`evo-rail.tsx:308–317`); no switcher dropdown found |

Orange Create CSS: `.evo-create-btn` in `resources/css/approved-v02.css` (background `#EC6025`). Quote workspace hides Create and Ask Evo (`app-sidebar-header.tsx:37–38, 92, 109`).

---

## 10. Duplicate Create / primary actions

### 10.1 Global (shell)

1. Top-bar orange **Create** dropdown (`app-sidebar-header.tsx`) — objects: Contact, Company, Lead, Deal, Quote.
2. Command palette / rail search can open create or peek (`evo-rail.tsx` `selectResult`, `command-palette`).
3. Leftover `app-sidebar.tsx` also has `createHref` — **unmounted**.

### 10.2 Page primaries that duplicate the same objects

These sit **below** the top bar, so two oranges appear (blueprint L4 / Accueil + Contacts findings).

| Location | Label / mechanism |
|---|---|
| `pages/home.tsx:93–98` | `t('New deal')` → `/crm/deals?create=1` (plus unused `dashboard-header.tsx` “New deal”) |
| `pages/crm/contacts/index.tsx` | `primaryLabel="Create contact"` → MorphingForm via `CrmListShell` / `PageHeader` |
| `pages/crm/companies/index.tsx` | `primaryLabel="Create company"` |
| `pages/crm/leads/index.tsx` | `primaryLabel="Create lead"` |
| `pages/crm/deals/index.tsx` | `primaryLabel="Create deal"` |
| `pages/crm/deals/board.tsx` | `primaryLabel="Create deal"` + empty-state `{t('Create deal')}` |
| `pages/crm/quotes/index.tsx` | `primaryLabel="Create quote"` (PageHeader forces orange for `object === 'quote'`) — top-bar Create is **hidden** here, so this is the only orange on Quotes |
| `pages/crm/tickets/index.tsx` | Create ticket MorphingForm (not in top-bar menu) |
| `pages/crm/tickets/board.tsx` | `CrmObjectHeader` `primaryLabel="Create ticket"` → `/crm/tickets?create=1` |
| `pages/leads/board.tsx` | `primaryLabel="New lead"` — **unrouted** |

### 10.3 Contextual creates (not duplicates of the global menu)

Record association `addHref` on show pages (`?create=1` + `contact_id` / `deal_id`). Segments “New segment”. Outbound sequence/campaign creates. Command-os entries. Import flows.

**Wave 1 rule:** Shell Agent moves **global** Create into the sidebar as a **neutral** “+”. Workspace Frame Agent keeps **exactly one orange page primary** in WorkspaceHeader slot H. Do not delete MorphingForm / `?create=1` handling.

---

## 11. Technical risks

1. **Three live width systems vs a fourth target.** Production rail is **212px** (`--evo-rail`, `evo-shell.css`). shadcn sidebar is **240 / 64** (`ui/sidebar.tsx`). `AppShell` sets **248px**. Blueprint wants **224 / 56**. `approved-v02.css` still encodes 248px offsets. Changing only `--evo-rail` will not move `.evo-rail-slot { width: 212px }` or `calc(100% - 212px)`.
2. **Nested scroll is structural.** `.aurora-page-shell.overflow-y-auto` wraps every page. DataGrid, Pipeline columns, Record panes, Inbox, Ads, Outbound, Automation, Agents, and Settings all add inner overflow. Wave 1 must change the **layout wrapper** or Deals/Inbox will keep double scroll after a prettier sidebar.
3. **Collapse persist is a lie in the current code.** Docs/P02 talk about a collapse cookie. Desktop EvoRail collapse is **React state only**. `sidebar_state` drives a **different** component (shadcn provider) that is not the desktop rail. Shipping D1 without an SSR cookie will flash the wrong width.
4. **Agents are a rail mode, not a nav item.** `NAV_SECTIONS` in `product-nav.ts` has **no Agents row**. `/agents*` flips `EvoShell` into Agents mode and replaces the Menu tree with `AgentsSidebar`. D8 (“Agents is a normal Full-mode nav item”) plus retiring the pill will strand Agents unless Shell Agent adds a Full-mode item **without** rewriting the protected tree carelessly. **UNCERTAIN** whether product wants a `product-nav.ts` additive item (allowed as presentation?) or a rail-only footer link. Recommend: additive `agents` item gated Full-mode, plus keep `/agents` route — treat as a **minimal additive** to `product-nav.ts` coordinated with whoever owns that file; if the freeze is absolute, Shell Agent must render Agents outside `NAV_SECTIONS` (footer or extra section) without editing `product-nav.ts`.
5. **Settings is a modal sitting on the AppShell.** `SettingsLayout` is a Radix dialog (`data-settings="dialog"`, max ~800×1120). Removing the top bar changes the dimmed backdrop composition. Converting it to a full page is **P3.2**, not Wave 1 — but Wave 1 screenshots of Settings will look unfinished (dialog + new light rail + no top bar).
6. **Simple Mode nav ≠ blueprint Simple Mode.** Code `SIMPLE_NAV` (`SimpleMode.php:11–20`): Home, Inbox, Leads, Contacts, Companies, Deals, Quotes, Activities. Blueprint §10.2 / §33.2: Accueil, Contacts, Deals, Inbox, Devis (+ Paramètres). Hierarchical `product-nav.ts` further nests CRM children. Wave 1 must **not** “fix” Simple Mode to the blueprint list.
7. **Token file is a merge magnet.** `resources/js/evo/tokens/evo.css` is the only legal `--evo-*` declarer. Both agents will want it (rail 224/56 vs header 48/40/36). See exclusive token split in §12.
8. **`approved-v02.css` still loads** from `resources/css/app.css` and can override chrome height/colours (`#E8530E` vs `#EC6025`). Shell Agent should stop new rules there; deleting it in Wave 1 is high-risk.
9. **RTL is incomplete.** `evo-shell.css` uses logical collapse + `translateX` flip; `approved-v02.css` and some shell rules still use physical `left`/`right`. Blueprint L12 bans physical directions in `evo/*`. Wave 1 rail must be logical-only.
10. **Cmd+K vs Search mode vs `/`.** Three search surfaces: rail Search tab, CommandPalette, list `q`. D4 says sidebar field opens the **centred** palette; `/` focuses list search. Wiring this without breaking `crm.command.search` or list-query `q` is easy to get wrong.
11. **Quote workspace special-cases the top bar.** Create and Ask Evo hide on `/crm/quotes*`. After top-bar removal those branches become dead — do not silently drop quote Create; the page primary remains.
12. **No branded 404/403.** Out of Wave 1 (P0.2), but testers will hit Laravel’s default English 404.

---

## 12. Wave 1 migration recommendations

Wave 1 = blueprint **P0.1 Frame** only: AppShell 224/56 light cabinet, no global top bar, Créer + Rechercher in the sidebar header, bell + user in the footer, theme in the user menu, `WorkspaceFrame` + `WorkspaceHeader` slots, one scroll owner, density/colour tokens. **No page redesigns** (Deals KPI strip, Inbox queues, Record 2-column, Settings-as-page stay later).

### 12.1 Exclusive file ownership (two agents never edit the same primitive)

#### Shell Agent — exclusive

| File | Allowed work |
|---|---|
| `resources/js/layouts/app-layout.tsx` | Keep QuickRecord / AskEvo drawers; do not add WorkspaceHeader |
| `resources/js/layouts/app/app-sidebar-layout.tsx` | Remove `<AppSidebarHeader />`. Mount `<WorkspaceFrame>{children}</WorkspaceFrame>` once the Frame Agent file exists. Do not implement header slots here. |
| `resources/js/components/app-shell.tsx` | Drop leftover `--sidebar-width: 248px` or align it with the new rail; keep `SidebarProvider` only if mobile still needs it |
| `resources/js/components/shell/evo-shell.tsx` | 224/56 geometry, persist collapse, Inbox rail-force hook **as a prop/class only**, CommandPalette host, mobile sheet / tab-bar shell |
| `resources/js/components/shell/evo-rail.tsx` | Light cabinet, search field + neutral “+”, footer bell + user, retire `ShellModeSwitch`, render `visibleSections()` |
| `resources/js/evo/shell/mode-switch.tsx` | Retire from the rail (may keep file unused) |
| `resources/js/components/app-sidebar-header.tsx` | Unmount; migrate Create/Theme/AskEvo/Bell into rail |
| `resources/js/components/user-menu-content.tsx` | Apparence + Langue + existing Settings/Log out |
| `resources/css/evo-shell.css` | Rail/workspace widths 224/56; no header-row rules |
| `resources/js/evo/tokens/evo.css` | **Only** `--evo-rail`, new `--evo-rail-collapsed: 56px`, `--evo-chrome-height` (0 or unused), sidebar surface aliases. Do not add header 48/40/36 here in the same edit as the Frame Agent. |
| `resources/js/hooks/use-appearance.tsx` | Only if the user-menu theme control needs a small API (Clair/Sombre/Système). Prefer using the existing hook. |

**Shell Agent must not edit:** `DataWorkspace.tsx`, `PageHeader.tsx`, `crm-object-header.tsx`, `RecordWorkspace.tsx`, `crm-list-shell.tsx`, `product-nav.ts` (see Agents exception in risk #4), `lib/list-query/**`, Inbox/Pipeline/Outbound page files, `settings-layout.tsx`.

#### Workspace Frame Agent — exclusive

| File | Allowed work |
|---|---|
| **NEW** `resources/js/evo/workspace/WorkspaceFrame.tsx` | Column: header slot + `flex-1 min-h-0` scroll owner; DOCUMENT vs WORKSPACE/RECORD/CONVERSATION scroll variants |
| **NEW** `resources/js/evo/workspace/WorkspaceHeader.tsx` | Slots A–Q per §12; 48 / 40 / 36 |
| **NEW** `resources/js/evo/workspace/types.ts` | Shared props (`archetype`, `title`, `primary`, …) |
| **NEW** workspace-frame CSS | Header heights, gutters, chip-bar canvas — **not** rail widths |
| `resources/js/ds/chrome/PageHeader.tsx` | Adapt to call `WorkspaceHeader` or become a thin adapter so DataWorkspace does not keep a second title grammar |
| `resources/js/evo/patterns/page-header/index.tsx` | Re-export only |
| `resources/js/components/crm/crm-object-header.tsx` | Adapter to `WorkspaceHeader` for non-DataWorkspace pages |

**Workspace Frame Agent must not edit:** `evo-shell.tsx`, `evo-rail.tsx`, `app-sidebar-layout.tsx`, `app-sidebar-header.tsx`, `evo-shell.css`, `product-nav.ts`, `app-shell.tsx`, DataWorkspace **props/API**, FilterBar, SavedViews, RecordWorkspace, Pipeline, Inbox.

**Integration handshake (one seam):**

```
EvoShell                  ← Shell Agent
  └─ WorkspaceFrame       ← Frame Agent (children = Inertia page)
       ├─ WorkspaceHeader ← Frame Agent (pages opt in later)
       └─ scroll region   ← Frame Agent
```

Frame Agent lands the new files first (passthrough Frame is OK). Shell Agent then mounts Frame and deletes the top bar. After that, Frame Agent fills header slots. **Neither re-edits the other’s files.**

Token handshake: Shell Agent may add `--evo-rail` / `--evo-rail-collapsed` to `evo.css`. Frame Agent adds `--workspace-header-1/2/3` (or equivalent) in **workspace-frame CSS** that aliases `--evo-control-*` / `--evo-row-*` already in `evo.css` (`32/36` rows already exist at `evo.css:91–94`). If a token must be declared as `--evo-*`, Frame Agent sends a one-line patch request; Shell Agent is the only writer of `evo.css`.

### 12.2 Concrete Shell Agent steps

1. Paint the rail light (`#F0F2EE` / `--evo-surface-subtle`) with a hairline; keep dark-mode rail as the dimmest surface (blueprint §31). Remove `.evo-cabinet` as the light-mode look.
2. Set expanded **224px**, collapsed **56px** (icon rail, not `width: 0` + reopen button). Today collapse is `width: 0` (`evo-shell.css:61–76`) — that is **not** the 56px rail.
3. Persist collapse (cookie + Inertia share). Do not reuse `sidebar_state` unless you migrate every reader.
4. Unmount `AppSidebarHeader`. Move Create (neutral, `C`), search field (opens CommandPalette), bell, theme-into-user-menu.
5. Retire `ShellModeSwitch`. Keep Agents reachable (risk #4).
6. Keep `visibleSections()` / Simple Mode / permission filters as-is.
7. Hand scroll ownership to `WorkspaceFrame` by removing `overflow-y-auto` from `.aurora-page-shell`.
8. Do not restyle Inbox queues, Deals KPIs, or Settings modal contents.

### 12.3 Concrete Workspace Frame Agent steps

1. Ship `WorkspaceHeader` with empty/optional slots so pages keep working with title + primary only.
2. Point `PageHeader` (DataWorkspace) at those slots so Contacts/Deals/Quotes lists pick up the grammar without editing `DataWorkspace` props.
3. Implement DOCUMENT sticky row 1 vs WORKSPACE “headers do not scroll” (grid/board/record own overflow).
4. Do not invent view-tab IA for Ads/Outbound/Inbox in Wave 1 — slot J can render **existing** `SavedViews` / room tabs as children later.
5. Density: reuse `--evo-row-compact/standard` (32/36). Comfortable 40 and touch 44 can be token aliases in workspace-frame CSS.

### 12.4 What Wave 1 must not touch

Page bodies: Accueil greeting, Deals KPI / Needs attention / ForecastBar, Inbox folder columns, Record 3-pane, quote PDF, Settings dialog IA, Outbound infra copy, Automation second nav, Agents empty canvas. Those are P0.2–P4.

### 12.5 Suggested first acceptance checks (from blueprint laws)

- At 1440, sidebar ≤ 224px and there is **no** `.app-topbar` in the product shell.
- Orange count in chrome: logo mark + **at most one** page primary (L4). Global “+” is neutral.
- `⌘K` opens a centred dialog, not a 224px rail panel (D4).
- Workspace/Record/Conversation: no documentElement scroll (L5) on Contacts + Deals board + a record + Inbox.
- `product-nav.ts` IDs/hrefs unchanged except the documented Agents additive, if any.
- `?create=1` still opens MorphingForms.
- `fr` / `ar` rail: logical start/end; collapse does not invert incorrectly.

---

## Appendix A — AppShell / nav / Simple Mode (detail)

### A.1 Current AppShell files

| Path | Job |
|---|---|
| `resources/js/layouts/app-layout.tsx` | Provider + drawers |
| `resources/js/layouts/app/app-sidebar-layout.tsx` | Compose AppShell / EvoShell / header / scroll |
| `resources/js/components/app-shell.tsx` | SidebarProvider 248px |
| `resources/js/components/shell/evo-shell.tsx` | Rail + workspace + palette |
| `resources/js/components/shell/evo-rail.tsx` | Nav chrome |
| `resources/js/components/shell/product-nav.ts` | Tree |
| `resources/js/evo/shell/mode-switch.tsx` | Three-mode pill |
| `resources/js/components/app-sidebar-header.tsx` | Top bar |
| `resources/css/evo-shell.css` | 212px layout |

### A.2 Menu / Agents / Search

`SHELL_MODES` in `mode-switch.tsx`: `menu`, `agents`, `search`. Keyboard arrows are RTL-aware. Selecting Agents navigates to `/agents` (`evo-rail.tsx` `selectMode`). Search panel queries `/crm/command/search`. ⌘K toggles `CommandPalette` in `evo-shell.tsx`, **not** the Search tab.

### A.3 Simple vs Full Mode

`workspaces.simple_mode` → `SimpleMode::enabled`. Features forced off in simple mode: `tickets`, `sms`, `ask_evo`, `ads`, `warmup`, `report_builder` (`SimpleMode.php:56–67`). `visibleSections()` filters by those features, permissions, and `nav` ids (`product-nav.ts:205–215`). Ask Evo top-bar button uses `features.ask_evo`. Settings destinations also filter via `useSimpleMode` in `settings-layout.tsx`.

Blocked paths when simple: `/crm/tickets*`, `/ads*`, `/outbound/warmup*`, `/crm/report-builder*`, Ask Evo / draft-email route names, `desk.ticket.open`.

---

## Appendix B — CSS / tokens / i18n / responsive

### B.1 CSS load order (`resources/css/app.css`)

`evo/tokens/evo.css` → `tailwind-theme.css` → `motion-utilities.css` → `evo-shell.css` → `approved-v02.css` → `settings-dialog.css`. Tailwind v4 `@theme` lives in `app.css` and `evo-shell.css`. `@custom-variant dark` is `(&:where(.dark, .dark *))`.

`resources/css/` also contains `aurora-evotechly-bridge.css` and `aurora-motion.css` (P27). `app.css` notes that vendored `aurora.css` was removed.

### B.2 Where tokens live

| Concern | Canonical file | Conflicting / leftover |
|---|---|---|
| Colour, type, radius, row/control heights, z-index, motion | `resources/js/evo/tokens/evo.css` (only file that may declare `--evo-*`) | `approved-v02.css` hard-codes greys and `#E8530E` |
| Tailwind utility mapping | `resources/js/evo/tokens/tailwind-theme.css` | `app.css` `--color-*` aliases |
| Rail geometry | `--evo-rail: 212px` in `evo.css:96`; hardcoded `212px` in `evo-shell.css:45–58` | `app-shell.tsx` `248px`; `ui/sidebar.tsx` `240` / `64` |
| Chrome height | `--evo-chrome-height: 48px` (`evo.css:95`) → `--app-chrome-height` in `app.css` | `approved-v02.css` 52px `.app-topbar` |
| Sidebar surface (light target `#F0F2EE`) | Closest today: `--evo-surface-subtle: #f1f2ee` (`evo.css:16`) | Rail uses `.evo-cabinet` + `bg-shell-paper` |
| Primary / teal (keep — PR1 / E6) | `--evo-primary: #ec6025`, `--evo-on-primary: #121212`, `--evo-teal: #0f4c5c` | — |
| One overlay shadow | `--evo-shadow-modal: 0 8px 24px …` (`evo.css:106`) | Matches blueprint §27 |
| Rows / controls | `--evo-row-compact: 32px`, `--evo-row-standard: 36px`, `--evo-control-*: 32/36` | Comfortable 40 / touch 44 **not declared** |
| Dark | `.dark`, `.evo-cabinet`, `[data-evo-theme='dark']` in `evo.css`; `html.dark` in `app.css` | Appearance hook: `use-appearance.tsx` + cookie in `resources/views/app.blade.php` |
| Settings modal palette | `resources/css/settings-dialog.css` `--settings-*` | Separate from `--evo-*` |
| Chart one-off hex | `resources/js/evo/tokens/literal-hex.ts` | Allowed for marks/charts only |
| Design-lab swatches | `resources/js/evo/tokens/palette.ts` | Not runtime CSS |

**224px is not in the repo.** Blueprint `--sidebar-w: 224` / rail 56 is the Wave 1 target, not current code.

### B.3 Localization and RTL

| Layer | Path |
|---|---|
| Dictionaries | `lang/fr.json`, `lang/en.json`, `lang/ar.json` |
| Client | `resources/js/lib/i18n.ts` — `SUPPORTED_LOCALES`, `t()`, `documentDir()`, `hydrateI18n` |
| Hydrate | `resources/js/components/i18n-provider.tsx` sets `lang`, `dir`, `data-locale` on `<html>` |
| Server | `app/Support/Locale.php` — cookie `locale`, user → workspace → cookie → `config('app.locale')` (default **fr**) |
| Inertia share | `HandleInertiaRequests.php:49–52, 122–139` |
| SSR `<html>` | `resources/views/app.blade.php` |
| Policy | `docs/i18n/glossary.md` |
| Money / date / phone | `resources/js/evo/lib/format.ts` (`Africa/Algiers`, `fr-DZ`, `numberingSystem: 'latn'`) |
| Rail RTL | `CaretLeft` `rtl:rotate-180` (`evo-rail.tsx`); mode-switch arrow swap; `evo-shell.css` `[dir='rtl']` collapse `translateX(100%)`; reopen button `start-3` |
| Arabic font | `--font-ui-arabic: 'IBM Plex Sans Arabic'` (`evo.css:67`); `html[dir='rtl']` switches `--evo-font-sans` |

Wave 1 must use logical `start`/`end` on the new rail (L12). Do not change `format.ts` or locale resolution.

### B.4 Responsive utilities

| Piece | Path | Value |
|---|---|---|
| `useIsMobile` | `resources/js/hooks/use-mobile.tsx` | `<768` (`max-width: 767px`) |
| `useMobileNavigation` | `resources/js/hooks/use-mobile-navigation.ts` | Used from user menu |
| P25 exports | `resources/js/lib/responsive.ts` | `PAGE_OVERFLOW_CLASS`, `LOCAL_SCROLL_X_CLASS`, overlay caps |
| P25 contract | `docs/responsive/P25-CONTRACT.md` | Viewports 1440 / 1280 / 1024 / 768 — still documents **64/240**, which is stale vs 212px EvoRail |
| CSS twins | `resources/css/app.css` `.overflow-page`, `.overflow-local-x` | |

Mobile tab bar (Accueil · Inbox · Contacts · Deals · Plus) does **not** exist yet. Shell Agent owns that surface in P0.1 per blueprint §32.

---

## Appendix C — Uncertainty log

| Item | Why uncertain |
|---|---|
| Visible effect of Cmd+B / `sidebar_state` on desktop | Provider updates, but desktop chrome is `EvoRail`, not shadcn `Sidebar` |
| Whether `h-app-workspace` (Record frame) is defined in CSS outside the JS grep | Used on `RecordPageFrame`; exact CSS rule not re-read in this audit |
| Whether `tablecn.tsx` is intentionally dormant after PR #284 | No importer found |
| Permissions capability map | `config/permissions.php` not fully enumerated |
| Live production SHA vs this checkout | Blueprint audited `2f19ece` (2 Oct deploy); this audit is `89eb4578` (PR #284). Hierarchical nav and RecordShell re-export exist here; some blueprint screenshots may predate #284 |
| Agents additive in `product-nav.ts` vs freeze | Product brief says product-nav is protected; D8 requires an Agents item. Needs an explicit unfreeze for one row |
| Fortify / error pages | Not in `web.php`; no Inertia error pages found |
| `DashboardHeader` leftover intent | File exists, unused by `home.tsx` |

---

## Appendix D — Wave 1 file checklist (copy for the two agents)

**Shell Agent owns:**  
`app-layout.tsx` · `app-sidebar-layout.tsx` · `app-shell.tsx` · `evo-shell.tsx` · `evo-rail.tsx` · `mode-switch.tsx` · `app-sidebar-header.tsx` · `user-menu-content.tsx` · `evo-shell.css` · `--evo-rail` / `--evo-rail-collapsed` in `evo.css`

**Workspace Frame Agent owns:**  
`evo/workspace/WorkspaceFrame.tsx` (new) · `WorkspaceHeader.tsx` (new) · `evo/workspace/types.ts` (new) · workspace-frame CSS (new) · `ds/chrome/PageHeader.tsx` · `evo/patterns/page-header/index.tsx` · `crm-object-header.tsx`

**Neither owns:**  
`product-nav.ts` (except a documented Agents additive) · `DataWorkspace.tsx` · `crm-list-shell.tsx` · `RecordWorkspace.tsx` · `QuickRecord*` · `lib/list-query/*` · Pipeline · Inbox · Settings dialog · page bodies.