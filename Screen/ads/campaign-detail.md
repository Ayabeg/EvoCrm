# Ads campaign detail

## 1. Screen Identity

Screen ID: SCR-ADS-003
Product area: Ads
Route: `/ads/campaigns/{campaign}`
Route name: `ads.campaigns.show`
Frontend file: `resources/js/pages/ads/show.tsx`
Primary component: `CampaignShow`
Layout: `AdsShell` title = campaign name. Breadcrumbs: Ads Hub `/ads`, Campaign `#`. Campaigns room tab remains active (`activePaths: ['/ads/campaigns']`). [CONFIRMED-CODE]
Authentication: `auth` + `verified`. [CONFIRMED-CODE]
Permissions: GET not `ads.manage`. Workspace mismatch `abort_unless` **404**. Simple mode 403 `/ads*`. [CONFIRMED-CODE]
Parent navigation: from campaigns list and overview tables, attribution cards, ad-set/ads campaign links. [CONFIRMED-CODE]
Entry points: `/ads/campaigns/{id}` links across Ads. [CONFIRMED-CODE]
Exit points: contact/lead/deal links; CTWA thread `/conversations?thread={id}`; Ads tabs (no explicit back button). [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): **403** for `/ads/campaigns/1`. [CONFIRMED-UI]
Evidence: runtime-index `/ads/campaigns/1` 403. `AdsCenterController::show`. `AdsHubTest` asserts funnel, daily, leads, threads when not simple mode. [CONFIRMED-CODE] [CONFIRMED-UI]

## 2. Purpose

Per-campaign truth: Meta top-of-funnel + CRM bottom-of-funnel, 30-day impression spark bars, nested ad sets/ads, attributed form leads, and Click-to-WhatsApp threads. [CONFIRMED-CODE]

## 3. Current UX Summary

Scroll page. Header with campaign name, account · objective · connected/demo, status badge. Two-column funnel board + last-N-days bar chart. Two-column ad sets table + leads table. Full-width CTWA conversations table. Read-only. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. App shell + Ads tabs (Campaigns active). [CONFIRMED-CODE]
2. `SurfaceHeader` title `campaign.name`, description `{account} · objective {objective} · Meta connected|demo data`, Badge status (default if `active`, else outline). [CONFIRMED-CODE]
3. Grid `lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]`: Funnel panel (`FunnelBoard` + spend/budget caption) | Last {n} days impression bars. [CONFIRMED-CODE]
4. Grid `lg:grid-cols-2`: Ad sets & ads table | Leads from this campaign. [CONFIRMED-CODE]
5. Click-to-WhatsApp conversations table. [CONFIRMED-CODE]

## 5. Data Displayed

Props: `campaign` (account, `adSets.ads`), `funnel` (`AdsFunnel::forCampaign`), `daily` (stats `orderByDesc date` limit 30 reversed), `leads` (AdLead for campaign, limit 50), `threads` (limit 20, contact subset), `meta.connected`. [CONFIRMED-CODE]

**FunnelBoard stages:** Impressions → Clicks → Conversations / Leads (hint CTWA · form) → Qualified → Deals → Won. Bar width vs impressions; step % vs previous. Caption: spend DZD, optional daily budget, “Bottom-of-funnel counts are CRM truth”. [CONFIRMED-CODE]

**Daily:** CSS height bars by impressions; `title` tooltip date · impressions · clicks · spend. Empty: “No insights yet.” [CONFIRMED-CODE]

**Ad sets:** name, status, budget/day or `-`, ads as `name · kind` inline (not links). [CONFIRMED-CODE]

**Leads:** contact, CRM lead title, deal title, `created_at` raw. [CONFIRMED-CODE]

**Threads:** contact (or `-`) link to conversations, status, `last_message_at`. [CONFIRMED-CODE]

## 6. Primary Actions

Navigate to CRM contact/lead/deal and desk conversation. No edit/pause/sync on this page. [CONFIRMED-CODE]

## 7. Secondary Actions

Ads room tabs; implicit return via Campaigns tab. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT. Daily is last 30 stat rows, not a date picker. [CONFIRMED-CODE]

## 10. Sorting

NOT PRESENT. Daily oldest→newest after reverse. Leads `latest()`. Threads `orderByDesc last_message_at`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

Caps: daily 30, leads 50, threads 20. Ad sets/ads eager-loaded all for campaign. No “load more”. [CONFIRMED-CODE]

## 14. Forms

NOT PRESENT. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT (native `title` tooltips on bars only). [CONFIRMED-CODE]

## 16. States

Empty ad sets / leads / threads / daily each have muted copy. Status badge variant by `active`. `meta.connected` only in description string. 404 other workspace. 403 simple mode. [CONFIRMED-CODE] [CONFIRMED-UI]

## 17. Empty State

- Funnel still renders zero stages via `FunnelBoard`. [CONFIRMED-CODE]
- “No insights yet.” [CONFIRMED-CODE]
- “No ad sets synced yet.” [CONFIRMED-CODE]
- “No leads attributed yet.” [CONFIRMED-CODE]
- “No CTWA conversations attributed yet.” [CONFIRMED-CODE]

## 18. Error Handling

Wrong workspace campaign: 404. Simple mode: 403. No client error UI. Raw timestamps not formatted. [CONFIRMED-CODE]

## 19. Feedback

NOT PRESENT (read-only). Bar `title` hover. [CONFIRMED-CODE]

## 20. Navigation Behavior

Does not switch to Overview. Breadcrumb second item `href: '#'` (non-navigating). Thread opens conversations with query. [CONFIRMED-CODE]

## 21. Entity Relationships

Campaign → account, ad sets → ads. Funnel: stats + Thread(`ad_campaign_id`) + AdLead + Lead status/qualified_at + Deal via lead_id + won stage. [CONFIRMED-CODE]

## 22. Business Rules

Workspace 404 isolation. Funnel CPL/ROAS computed in service; this page shows spend/budget not CPL/ROAS (those on Attribution). Daily chart is impressions not spend. Ads listed inline, no `/ads/ads/{id}`. [CONFIRMED-CODE]

## 23. Backend Dependencies

`AdsCenterController::show`, `AdsFunnel::forCampaign`, `AdCampaign::stats()`, `AdLead`, `threads()`. [CONFIRMED-CODE]

## 24. Frontend Dependencies

`AdsShell`, `FunnelBoard`, `HairlineTable`, `SurfaceHeader`, `Badge`, `formatDzd`, `Link`. [CONFIRMED-CODE]

## 25. Responsive Behavior

Grids collapse below `lg`. Funnel board 3-column grid may wrap poorly on narrow widths — NOT VERIFIED. Tabs overflow-x. [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: sr-only h1 “Ads”; campaign name is SurfaceHeader h2. Status as text badge. [CONFIRMED-CODE]

LIKELY ISSUE: Daily bars are non-focusable `div`s; data only in `title`. Funnel % for screen readers is adjacent text. Thread/contact links. Tables unlabeled. Breadcrumb `#`. [CONFIRMED-CODE]

REQUIRES MANUAL TEST: keyboard access to bar tooltips; 403/404 pages. [UNKNOWN]

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-ADS-SHOW-001 | BLOCKER | 403 simple_mode | Cannot inspect campaign | runtime-index [CONFIRMED-UI] |
| UX-ADS-SHOW-002 | MEDIUM | No Sync or date window | Stale/all-time funnel vs 30-day bars mixed | `show.tsx` vs `AdsFunnel` [CONFIRMED-CODE] |
| UX-ADS-SHOW-003 | MEDIUM | `created_at` / `last_message_at` unformatted ISO/raw | Hard to scan | `ads/show.tsx` [CONFIRMED-CODE] |
| UX-ADS-SHOW-004 | LOW | Ads not linked to ads list; ad set names not linked | Dead-end hierarchy | JSX [CONFIRMED-CODE] |
| UX-ADS-SHOW-005 | LOW | Breadcrumb Campaign href `#` | Broken crumb | `CampaignShow.layout` [CONFIRMED-CODE] |

## 28. Consistency Comparison

FunnelBoard shared with Attribution (detail uses full, attribution `compact`). Overview campaign table is thinner. Reports `/reports/ads` is workspace windowed analytics, not this entity page. [CONFIRMED-CODE]

## 29. Functional Preservation Contract

Must keep: workspace 404, funnel six stages + CRM-truth caption, 30-day impression bars with tooltip metrics, ad set/ads nested table, 50 leads with CRM links, 20 CTWA threads to `/conversations?thread=`, status badge, spend/budget, simple-mode block.

## 30. Design Input Contract

Purpose: Diagnose one Meta campaign’s delivery and CRM outcomes.
Primary goal: See drop-off and jump to people/deals/threads.
Primary actions: Open CRM records and conversations.
Secondary: Room navigation.
Required information: identity, status, funnel, daily impressions, ad sets/ads, leads, CTWA threads.
Required components: header+badge, FunnelBoard, bar chart, three tables.
Required states: empty sections, 404, 403.
Information priority: funnel → daily → structure → CRM intake.
Business-critical: attributed funnel math, record links, workspace isolation.
May NOT be removed: FunnelBoard stages, CRM links, thread links, ad set listing.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- Whether local campaign id 1 exists (403 before model). [UNKNOWN]
- Daily bar color contrast. [UNKNOWN]
