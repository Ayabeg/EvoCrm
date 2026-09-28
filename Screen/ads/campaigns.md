# Ads campaigns list

## 1. Screen Identity

Screen ID: SCR-ADS-002
Product area: Ads
Route: `/ads/campaigns`
Route name: `ads.campaigns.index`
Frontend file: `resources/js/pages/ads/campaigns/index.tsx`
Primary component: `AdsCampaignsIndex`
Layout: `AdsShell` title “Campaigns” + `RoomShell`. No page `layout.breadcrumbs` on this file. [CONFIRMED-CODE]
Authentication: `auth` + `verified`. [CONFIRMED-CODE]
Permissions: GET not gated by `ads.manage`. Simple mode 403s `/ads*`. [CONFIRMED-CODE]
Parent navigation: Ads room tab “Campaigns” (`href: '/ads/campaigns'`, also `activePaths: ['/ads/campaigns']` so campaign detail keeps this tab). [CONFIRMED-CODE]
Entry points: Ads tabs; command palette only to `/ads` (no dedicated campaigns command). [CONFIRMED-CODE]
Exit points: campaign name → `/ads/campaigns/{id}`; other Ads tabs. [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): **403**. [CONFIRMED-UI]
Evidence: `runtime-index.json` `/ads/campaigns` 403. Controller `AdsCenterController::campaigns`. [CONFIRMED-CODE] [CONFIRMED-UI]

## 2. Purpose

Workspace list of Meta campaigns synced into EvoCRM, with account, status, and attributed spend. Read-only directory into campaign detail. [CONFIRMED-CODE]

## 3. Current UX Summary

Minimal list: header “Campaigns” / “Meta campaigns synced into this workspace.” One hairline table. No sync button, KPI strip, or kind/budget columns (those live on overview). Empty row if none. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. App shell + Ads room tabs (Campaigns active). [CONFIRMED-CODE]
2. Body `space-y-5 p-6`. [CONFIRMED-CODE]
3. `SurfaceHeader` title + description. No header actions. [CONFIRMED-CODE]
4. `HairlinePanel` > table: Campaign, Account, Status, Spend (right). [CONFIRMED-CODE]

## 5. Data Displayed

Props: `campaigns`, `funnels`, `meta` (`connected` typed but unused in JSX). [CONFIRMED-CODE]

Campaigns: `AdCampaign` for workspace with `account`, `ad_sets_count` (count not shown), `latest()`. Row: `name` link, `account?.name ?? '-'`, raw `status`, spend `formatDzd((funnels[campaign.id] ?? EMPTY_FUNNEL).spend_cents)` from `AdsFunnel::forWorkspace`. [CONFIRMED-CODE]

## 6. Primary Actions

Open campaign detail via name link `/ads/campaigns/{id}`. [CONFIRMED-CODE]

## 7. Secondary Actions

Ads room tab navigation only. No sync, create, pause, duplicate. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT. No status/account filter despite columns. [CONFIRMED-CODE]

## 10. Sorting

NOT PRESENT. Server `latest()`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

All campaigns loaded. No paginator. Inertia full visit. [CONFIRMED-CODE]

## 14. Forms

NOT PRESENT. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT. [CONFIRMED-CODE]

## 16. States

Empty: single row “No campaigns yet.” spanning 4 columns. Simple mode 403. `meta` unused so no connected/demo badge here. [CONFIRMED-CODE] [CONFIRMED-UI]

## 17. Empty State

Inline table empty copy only. [CONFIRMED-CODE]

## 18. Error Handling

403 simple mode. No page-level error UI. Invalid campaign id handled on show (404). [CONFIRMED-CODE]

## 19. Feedback

NOT PRESENT (no mutations). [CONFIRMED-CODE]

## 20. Navigation Behavior

Campaigns tab stays active on `/ads/campaigns/{id}` because `activePaths` includes `/ads/campaigns`. Overview is exact-only. [CONFIRMED-CODE]

## 21. Entity Relationships

AdCampaign belongs to AdAccount; funnel spend from `AdCampaignStat` sums. Detail adds ad sets, ads, AdLeads, Threads. [CONFIRMED-CODE]

## 22. Business Rules

Workspace scope. Spend is funnel spend_cents (all-time stats in `AdsFunnel`, not a date window). Status shown raw from Meta/sync. [CONFIRMED-CODE]

## 23. Backend Dependencies

`AdsCenterController::campaigns`, `AdsFunnel::forWorkspace`, `AdCampaign`. [CONFIRMED-CODE]

## 24. Frontend Dependencies

`AdsShell`, `SurfaceHeader`, `HairlineTable`, `Link`, `formatDzd`, `EMPTY_FUNNEL`. [CONFIRMED-CODE]

## 25. Responsive Behavior

Header stacks `sm:flex-row`. Table horizontal overflow not wrapped; `HairlineTable` as used elsewhere. Viewport NOT VERIFIED (403). [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: sr-only room `h1` “Ads”; visible `h2` “Campaigns”. Tab nav labeled. [CONFIRMED-CODE]

LIKELY ISSUE: No table caption. Spend column `money` class only. Links distinguishable by `text-brand hover:underline`. [CONFIRMED-CODE]

REQUIRES MANUAL TEST: focus order, 403 page. [UNKNOWN]

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-ADS-CAMP-001 | BLOCKER | 403 in simple_mode | Cannot list campaigns | runtime-index [CONFIRMED-UI] |
| UX-ADS-CAMP-002 | MEDIUM | No Sync control (only on overview) | User on this tab cannot refresh Meta | `campaigns/index.tsx` no Form [CONFIRMED-CODE] |
| UX-ADS-CAMP-003 | LOW | `meta` fetched unused; no connected badge | Less context than overview/attribution | props vs JSX [CONFIRMED-CODE] |
| UX-ADS-CAMP-004 | LOW | `ad_sets_count` loaded unused | Extra query, missing column vs overview | controller `withCount(['adSets'])` [CONFIRMED-CODE] |

## 28. Consistency Comparison

Thinner than Ads overview (no KPIs, kind, budget). Same table chrome as ad-sets and ads list. Spend here vs budget on overview — two different money columns. [CONFIRMED-CODE]

## 29. Functional Preservation Contract

Must keep: `/ads/campaigns`, campaign name → show, account, status, spend from funnel, empty row, Campaigns tab active including detail URLs, workspace scope, simple-mode block.

## 30. Design Input Contract

Purpose: Find a synced Meta campaign and open it.
Primary goal: Scan name/account/status/spend and click through.
Primary action: Open campaign.
Secondary: Room tabs.
Required information: campaign name, account, status, spend.
Required components: Ads shell tabs, header, table.
Required states: empty list, 403 simple mode.
Information priority: name → spend/status.
Business-critical: campaign id links, workspace funnel spend.
May NOT be removed: name links, spend, empty copy.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- Visual of 403. [UNKNOWN]
- Typical campaign volume in production. [UNKNOWN]
