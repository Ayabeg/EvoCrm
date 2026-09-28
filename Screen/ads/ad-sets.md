# Ads ad sets list

## 1. Screen Identity

Screen ID: SCR-ADS-004
Product area: Ads
Route: `/ads/ad-sets`
Route name: `ads.ad-sets.index`
Frontend file: `resources/js/pages/ads/ad-sets/index.tsx`
Primary component: `AdsAdSetsIndex`
Layout: `AdsShell` title “Ad sets”. No breadcrumbs export. Tab “Ad sets” prefix-matches `/ads/ad-sets`. [CONFIRMED-CODE]
Authentication: `auth` + `verified`. [CONFIRMED-CODE]
Permissions: GET unscoped by `ads.manage`. Simple mode 403 `/ads*`. [CONFIRMED-CODE]
Parent navigation: Ads room tab. [CONFIRMED-CODE]
Entry points: Ads tabs only (no command-palette item). [CONFIRMED-CODE]
Exit points: campaign name → `/ads/campaigns/{id}`; other tabs. No ad-set detail route. [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): **403**. [CONFIRMED-UI]
Evidence: runtime-index `/ads/ad-sets` 403. `AdsCenterController::adSets`. [CONFIRMED-CODE] [CONFIRMED-UI]

## 2. Purpose

Flat inventory of synced Meta ad sets with parent campaign, status, daily budget, and ads count. Read-only. [CONFIRMED-CODE]

## 3. Current UX Summary

Header “Ad sets” / “Synced ad sets.” Single table. Ad set name is plain text (not a link). Campaign is the only navigation out of the row. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. App shell + Ads tabs. [CONFIRMED-CODE]
2. `space-y-5 p-6` + `SurfaceHeader`. [CONFIRMED-CODE]
3. Table columns: Ad set, Campaign, Status, Budget/day (right), Ads (right). [CONFIRMED-CODE]

## 5. Data Displayed

Props: `adSets`, `meta` (typed unused). Query: `AdSet::forWorkspace` with `campaign:id,name,status` (campaign status unused), `withCount('ads')`, `latest()`. [CONFIRMED-CODE]

Row: `name`, campaign link or `-`, `status`, `formatDzd(daily_budget_cents)` or `-` if 0/falsy, `ads_count`. [CONFIRMED-CODE]

## 6. Primary Actions

Open parent campaign. [CONFIRMED-CODE]

## 7. Secondary Actions

Room tabs. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT. [CONFIRMED-CODE]

## 10. Sorting

NOT PRESENT. Server `latest()`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

All ad sets. No paginator. [CONFIRMED-CODE]

## 14. Forms

NOT PRESENT. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT. [CONFIRMED-CODE]

## 16. States

Empty: “No ad sets yet.” Simple mode 403. [CONFIRMED-CODE] [CONFIRMED-UI]

## 17. Empty State

Inline table row. [CONFIRMED-CODE]

## 18. Error Handling

403 simple mode only at runtime here. [CONFIRMED-CODE]

## 19. Feedback

NOT PRESENT. [CONFIRMED-CODE]

## 20. Navigation Behavior

No show route; campaign detail is the drill-down. Ads count is not a link to `/ads/ads`. [CONFIRMED-CODE]

## 21. Entity Relationships

AdSet belongs to AdCampaign; has many Ad. Workspace scoped. [CONFIRMED-CODE]

## 22. Business Rules

Budget 0 displays `-`. Status raw. No targeting fields shown. [CONFIRMED-CODE]

## 23. Backend Dependencies

`AdsCenterController::adSets`, `AdSet` model. [CONFIRMED-CODE]

## 24. Frontend Dependencies

`AdsShell`, `SurfaceHeader`, `HairlineTable`, `Link`, `formatDzd`. [CONFIRMED-CODE]

## 25. Responsive Behavior

Same Ads list pattern. Viewport NOT VERIFIED. [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: sr-only h1 Ads; h2 Ad sets. [CONFIRMED-CODE]
LIKELY ISSUE: unlabeled table; ad set name not a heading/link. [CONFIRMED-CODE]
REQUIRES MANUAL TEST: 403, keyboard. [UNKNOWN]

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-ADS-SETS-001 | BLOCKER | 403 simple_mode | Unreachable | runtime-index [CONFIRMED-UI] |
| UX-ADS-SETS-002 | MEDIUM | No ad-set detail; name not clickable | Dead-end list | `ad-sets/index.tsx` [CONFIRMED-CODE] |
| UX-ADS-SETS-003 | LOW | Unused `meta`; no sync | Cannot refresh from this tab | JSX [CONFIRMED-CODE] |

## 28. Consistency Comparison

Mirrors ads list and campaigns list chrome. Campaign detail also lists ad sets nested — duplication without targeting/schedule fields. [CONFIRMED-CODE]

## 29. Functional Preservation Contract

Must keep: `/ads/ad-sets`, columns (name, campaign link, status, budget, ads count), empty copy, workspace scope, simple-mode 403.

## 30. Design Input Contract

Purpose: Browse synced ad sets.
Primary goal: Identify set and jump to campaign.
Primary action: Open campaign.
Required information: name, campaign, status, daily budget, ads count.
Required components: Ads shell, header, table.
Required states: empty, 403.
May NOT be removed: campaign links, budget, ads count.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- Whether an ad-set show route is planned (none exists). [UNKNOWN]
