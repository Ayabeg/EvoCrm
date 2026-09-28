# Ads overview (Ads Hub)

## 1. Screen Identity

Screen ID: SCR-ADS-001
Product area: Ads
Route: `/ads`
Route name: `ads.index`
Frontend file: `resources/js/pages/ads/index.tsx`
Primary component: `AdsHub` (default export)
Layout: Application shell + `AdsShell` (`resources/js/components/crm/ads-shell.tsx`) wrapping `RoomShell` (`data-chrome="contextual"`). Page `layout.breadcrumbs`: Ads Hub → `/ads`. [CONFIRMED-CODE]
Authentication: `auth` + `verified` (`routes/web.php` group). [CONFIRMED-CODE]
Permissions: GET is method-safe, so `EnforceProductPermissions` does not require `ads.manage` to view. POST `/ads/sync` (`ads.sync`) requires `ads.manage` (owner/admin default true, member default false). Simple mode: `SimpleMode::blocks()` 403s every path starting `/ads`. [CONFIRMED-CODE]
Parent navigation: Ads room tabs (Overview exact `/ads`). Sidebar More → Ads (`/ads`) when not simple mode. Command palette `nav-ads` (feature `ads`). Full nav includes Ads; simple nav does not. [CONFIRMED-CODE]
Entry points: sidebar More, command palette, `/ads` URL, links from Reports ads charts (`href: '/ads'`), campaign-detail / attribution / audiences breadcrumbs. [CONFIRMED-CODE]
Exit points: Ads tabs (Attribution, Audiences, Campaigns, Ad sets, Ads); campaign name → `/ads/campaigns/{id}`; contact/lead/deal links from latest form leads; Facebook OAuth popup `/auth/meta?popup=1`. [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): **403** `SimpleMode::blocks` (`str_starts_with($path, '/ads')`). [CONFIRMED-UI]
Evidence: `Screen/_evidence/runtime-index.json` path `/ads` http 403, no Inertia component. Implementation: `AdsCenterController::index`, `ads/index.tsx`, `SimpleMode.php`. Feature tests in `tests/Feature/AdsHubTest.php` render the page when simple_mode is off. [CONFIRMED-CODE] [CONFIRMED-UI]

## 2. Purpose

Workspace Ads Hub overview: Meta connection status, workspace-level funnel KPIs (spend through won), campaign list, ad accounts, and latest Meta lead-form submissions mapped into CRM contacts/leads/deals. Syncs Marketing API objects into the workspace; does not create campaigns in Meta from this screen. [CONFIRMED-CODE]

## 3. Current UX Summary

A single scrolling column inside the Ads room. Header “Overview” plus Meta connected/demo badge and “Sync from Meta”. Optional connect panel (reason + Continue with Facebook). KPI meter of six totals. Inline links to Attribution and Audiences. Hairline campaign table. Two-column grid of ad accounts and latest form leads. No client-side search, filters, or pagination. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. Application chrome (sidebar, header) — SCR-SHELL-001–003. [CONFIRMED-CODE]
2. `RoomShell` title “Ads” (`h1` sr-only) + horizontal room tabs: Overview, Attribution, Audiences, Campaigns, Ad sets, Ads. [CONFIRMED-CODE]
3. Scrollable body `p-6 space-y-5`. [CONFIRMED-CODE]
4. `SurfaceHeader` title “Overview”, description “Meta ad accounts, campaigns, and lead intake. Funnel attribution lives on the Attribution tab.” Actions: Badge + Sync form. [CONFIRMED-CODE]
5. Conditional `HairlinePanel` when `meta.reason` or `!meta.connected`: reason copy, `BrandConnectButtons`, webhook caption. [CONFIRMED-CODE]
6. `KpiMeter`: Spend, Impressions, Clicks, Conv. / Leads, Deals, Won. [CONFIRMED-CODE]
7. Caption with links to `/ads/attribution` and `/ads/audiences`. [CONFIRMED-CODE]
8. Campaigns `HairlinePanel` + table. [CONFIRMED-CODE]
9. `lg:grid-cols-2`: Ad accounts table | Latest form leads table. [CONFIRMED-CODE]

## 5. Data Displayed

Inertia props from `AdsCenterController::index` (`ads/index`): `accounts`, `campaigns`, `funnels`, `totals`, `leads` (limit 50), `meta`. [CONFIRMED-CODE]

**meta:** `{ connected, ad_account_id_set, reason, connect_url: '/auth/meta?popup=1' }` via `WorkspaceMetaCredentials::status`. Badge: “Meta connected” vs “Demo data”. [CONFIRMED-CODE]

**totals / funnels:** `AdsFunnel::forWorkspace` then `totals()`. Page UI uses `totals` only (`funnels` unused on this page). KPI mapping: spend `formatDzd(totals.spend_cents)`; impressions/clicks locale strings; Conv. / Leads = `conversations + form_leads`; deals; won. [CONFIRMED-CODE]

**campaigns:** `AdCampaign` workspace-scoped, with `account`, `ad_sets_count`, latest. Columns: name (link), account name or `-`, kind (`CTWA + Lead form` / `Click-to-WhatsApp` / `Lead form` / `Traffic` from `click_to_whatsapp` + `lead_form`), status, daily budget DZD, ad set count. [CONFIRMED-CODE]

**accounts:** `AdAccount` with `campaigns_count`. Columns: name, status, currency, campaigns. [CONFIRMED-CODE]

**leads:** `AdLead` latest 50 with contact, lead.deal, campaign. Columns: contact name, campaign name, CRM lead status, deal title. [CONFIRMED-CODE]

## 6. Primary Actions

- **Sync from Meta** — Inertia `Form` POST `/ads/sync`. Button `size="sm"` disabled while `processing`. Success toast `Synced {n} Meta campaigns.`; failure toast `result.reason` or `Meta sync failed.` (`Inertia::flash('toast', …)` + Sonner). Requires `ads.manage`. [CONFIRMED-CODE]
- **Continue with Facebook** — `OAuthPopupButton` to `meta.connect_url` or `/auth/meta?popup=1`. Requires `settings.integrations` on `/auth/meta`. Shown when disconnected or a `reason` is present. [CONFIRMED-CODE]
- **Open campaign** — Link `/ads/campaigns/{id}` (SCR-ADS-003). [CONFIRMED-CODE]

## 7. Secondary Actions

- Navigate Attribution / Audiences from caption. [CONFIRMED-CODE]
- Open contact `/crm/contacts/{id}`, lead `/crm/leads/{id}`, deal `/crm/deals/{id}` from form-lead rows. [CONFIRMED-CODE]
- Room tabs. [CONFIRMED-CODE]

No create-campaign, pause, budget edit, or export on this screen. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. No search input or query param. [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT. Server returns full workspace campaign/account sets (leads capped at 50). [CONFIRMED-CODE]

## 10. Sorting

NOT PRESENT as a user control. Server `latest()` on campaigns, accounts, leads. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT. No row checkboxes. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

No paginator. Campaigns/accounts: all workspace rows. Leads: `limit(50)`. Sync button uses Inertia form `processing`. Full page Inertia visit otherwise. [CONFIRMED-CODE]

## 14. Forms

**Sync:** POST `/ads/sync`, no fields. `MetaAdsService::sync` requires connected Meta + selected ad account + `ads_management` grant. Failure reasons include: not connected, expired token, missing `ads_management`, no selected ad account. [CONFIRMED-CODE]

**Connect:** popup OAuth, not an in-page field form. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT on this page. Facebook connect uses OAuth popup (`OAuthPopupButton`), not a Dialog in `ads/index.tsx`. [CONFIRMED-CODE]

## 16. States

- Loading: Inertia visit / form `processing` on Sync. [CONFIRMED-CODE]
- Connected vs demo badge. [CONFIRMED-CODE]
- Connect panel when `reason` or not connected. [CONFIRMED-CODE]
- Empty tables: campaigns “No campaigns yet - sync from Meta or use demo data.”; accounts “No ad accounts yet.”; leads “No form submissions yet.” [CONFIRMED-CODE]
- Runtime simple_mode: Laravel 403 page, component never hydrates. [CONFIRMED-UI]
- Member without `ads.manage`: GET allowed, POST sync 403. [CONFIRMED-CODE]

## 17. Empty State

Inline table empty rows (muted copy), not a dedicated empty illustration. KPI meter still renders zeros via `AdsFunnel::totals`. [CONFIRMED-CODE]

## 18. Error Handling

- Simple mode / missing ads.manage on sync: HTTP 403. [CONFIRMED-CODE]
- Campaign show workspace mismatch is on detail, not here. [CONFIRMED-CODE]
- Sync failure: error toast, `back()`. [CONFIRMED-CODE]
- Connect/token reasons shown as body text. [CONFIRMED-CODE]
- No client-side validation. [CONFIRMED-CODE]

## 19. Feedback

Sonner toasts from `useFlashToast` on sync. Badge for Meta state. Button disabled while processing. No optimistic campaign insert. [CONFIRMED-CODE]

## 20. Navigation Behavior

Stays in Ads room. Overview tab `exact: true` so `/ads/campaigns` does not keep Overview active. Campaign click leaves overview for SCR-ADS-003 (Campaigns tab becomes active via `activePaths: ['/ads/campaigns']`). Sync `back()` preserves URL. [CONFIRMED-CODE]

## 21. Entity Relationships

AdAccount 1–N AdCampaign 1–N AdSet 1–N Ad. AdLead → Contact, Lead, AdCampaign. Lead/Thread/Deal attributed via `ad_campaign_id`. Funnel: Meta stats (impressions/clicks/spend) + CRM (CTWA threads, form leads, qualified, deals, won). Webhook `POST /webhooks/meta/leads/{webhookKey}` mentioned in copy. [CONFIRMED-CODE]

## 22. Business Rules

- Workspace scoped queries (`forWorkspace`). [CONFIRMED-CODE]
- Simple mode hard-blocks `/ads*`. [CONFIRMED-CODE]
- Sync does not invent campaigns without Meta credentials. [CONFIRMED-CODE]
- Money in DZD cents via `formatDzd`. [CONFIRMED-CODE]
- Conv./Leads KPI sums CTWA conversations and form leads. [CONFIRMED-CODE]
- Lead list is latest 50 only. [CONFIRMED-CODE]
- Viewing does not require `ads.manage`; mutating sync does. [CONFIRMED-CODE]

## 23. Backend Dependencies

`AdsCenterController`, `AdsFunnel`, `WorkspaceMetaCredentials`, `MetaAdsService`, models `AdAccount`, `AdCampaign`, `AdLead`. Middleware: `EnforceProductPermissions`, `EnforceSimpleMode`. Route `ads.sync`. [CONFIRMED-CODE]

## 24. Frontend Dependencies

`AdsShell`, `RoomShell`, `SurfaceHeader`, `HairlinePanel`/`HairlineTable`, `KpiMeter`, `Badge`, `Button`, `Form`/`Link` Inertia, `BrandConnectButtons`, `formatDzd`, `FunnelCounts` type (unused data). [CONFIRMED-CODE]

## 25. Responsive Behavior

`SurfaceHeader` stacks then `sm:flex-row`. KPI meter wraps. Account/leads grid `lg:grid-cols-2`. Room tabs `overflow-x-auto`. Body `overflow-y-auto`. Viewport crawl NOT VERIFIED (403). [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: Room `h1` is sr-only “Ads”; visible title is `h2` “Overview”. Room nav `aria-label="{title} sections"`. Tabs are links, not tabs/roving tabindex. [CONFIRMED-CODE]

LIKELY ISSUE: Tables have no `<caption>` / `aria-label`. Sync button has no explicit `aria-busy`. Connect panel reason uses `text-brand` for errors. Badge is not a live region. [CONFIRMED-CODE]

REQUIRES MANUAL TEST: keyboard order through tables and OAuth popup; 403 page a11y; screen reader of KPI meter. [UNKNOWN]

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-ADS-001 | BLOCKER | Entire Ads product 403 in simple_mode | Owner on Evotechly cannot open Hub | runtime-index `/ads` 403; `SimpleMode::blocks` [CONFIRMED-UI] [CONFIRMED-CODE] |
| UX-ADS-002 | MEDIUM | Funnel boards live on Attribution, not overview, despite `funnels` prop | Extra click; unused payload | `ads/index.tsx` does not render `funnels` [CONFIRMED-CODE] |
| UX-ADS-003 | MEDIUM | No search/filter/pagination on campaigns | Unusable at scale | controller `get()` all campaigns [CONFIRMED-CODE] |
| UX-ADS-004 | LOW | “Demo data” badge when disconnected even if tables empty | Implies seed data always present | badge copy [CONFIRMED-CODE] |
| UX-ADS-005 | OBSERVATION | Latest leads omit timestamp column (shown on campaign detail) | Harder to judge recency | `ads/index.tsx` vs `ads/show.tsx` [CONFIRMED-CODE] |

## 28. Consistency Comparison

Matches Ads siblings: `AdsShell`, `SurfaceHeader`, `HairlineTable`, DZD money, Meta badge language. Reports Ads room (`/reports/ads`) is analytics-only (EvoViz, date window) and remains reachable in simple mode — different product surface. Outbound campaigns are email, not Meta. [CONFIRMED-CODE]

## 29. Functional Preservation Contract

A redesign MUST keep:

- Route `/ads` + Inertia `ads/index`.
- Ads room tabs and Overview exact-match.
- Meta connected/demo status and connect URL `/auth/meta?popup=1`.
- POST `/ads/sync` with processing + toast success/error.
- Workspace KPI totals: spend, impressions, clicks, conversations+form_leads, deals, won.
- Campaign table with name→detail, account, kind, status, daily budget, ad-set count.
- Ad account table: name, status, currency, campaign count.
- Latest 50 form leads with CRM contact/lead/deal links.
- Empty-row copy for the three tables.
- Simple-mode 403 until product policy changes.
- `ads.manage` on sync only.

## 30. Design Input Contract

Purpose: Meta ads operations overview for a workspace.
Primary goal: Know connection state, spend/outcomes, and jump into a campaign or CRM record.
Primary actions: Sync from Meta; open campaign; connect Facebook if needed.
Secondary actions: Attribution, Audiences, CRM record links.
Required information: Meta status/reason, six KPIs, campaigns, accounts, latest form leads.
Required components: room tabs, header+actions, optional connect panel, KPI strip, three tables.
Required states: connected/disconnected, empty tables, sync processing, 403 simple mode, permission 403 on sync.
Information priority: connection → KPIs → campaigns → accounts/leads.
Business-critical: sync, campaign links, CRM lead mapping, workspace scoping.
May NOT be removed: Sync, Meta connect path, campaign name links, KPI set, form-lead CRM links, room tabs.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- Exact Laravel 403 HTML for simple mode not captured as a screenshot. [UNKNOWN]
- Whether seed demo campaigns exist on this local DB (page never rendered). [UNKNOWN]
- Toast copy localization vs English flash strings. [UNVERIFIED]
- Behavior of OAuth popup success return to `/ads`. [UNVERIFIED]
