# Ads creatives list

## 1. Screen Identity

Screen ID: SCR-ADS-005
Product area: Ads
Route: `/ads/ads`
Route name: `ads.ads.index`
Frontend file: `resources/js/pages/ads/ads/index.tsx`
Primary component: `AdsListIndex`
Layout: `AdsShell` title “Ads” (same document title as overview). Tab “Ads” href `/ads/ads` (not exact; prefix). Overview is exact `/ads` so this tab is distinct. [CONFIRMED-CODE]
Authentication: `auth` + `verified`. [CONFIRMED-CODE]
Permissions: GET not `ads.manage`. Simple mode 403. [CONFIRMED-CODE]
Parent navigation: Ads room last tab. [CONFIRMED-CODE]
Entry points: Ads tabs. [CONFIRMED-CODE]
Exit points: campaign link `/ads/campaigns/{id}`. No `/ads/ads/{id}`. [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): **403**. [CONFIRMED-UI]
Evidence: runtime-index `/ads/ads` 403. `AdsCenterController::adsIndex`. [CONFIRMED-CODE] [CONFIRMED-UI]

## 2. Purpose

Flat list of synced Meta ads (creatives) with kind, parent ad set name, campaign, status. Read-only inventory. [CONFIRMED-CODE]

## 3. Current UX Summary

Header “Ads” / “Synced ads.” One table. Ad name and ad set are plain text. Campaign is the only row link. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. App shell + Ads tabs (Ads active). [CONFIRMED-CODE]
2. `SurfaceHeader` + `HairlineTable`. [CONFIRMED-CODE]
3. Columns: Ad, Kind, Ad set, Campaign, Status. [CONFIRMED-CODE]

## 5. Data Displayed

Props: `ads`, `meta` unused. Query: `Ad::forWorkspace` with `adSet:id,name,ad_campaign_id` and `adSet.campaign:id,name`, `latest()`. [CONFIRMED-CODE]

Row: `name`, `kind`, `ad_set?.name ?? '-'`, campaign link or `-`, `status`. No preview, copy, URL, or metrics. [CONFIRMED-CODE]

## 6. Primary Actions

Open parent campaign. [CONFIRMED-CODE]

## 7. Secondary Actions

Room tabs. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT (no kind/status filter). [CONFIRMED-CODE]

## 10. Sorting

NOT PRESENT. `latest()`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

All ads. No paginator. [CONFIRMED-CODE]

## 14. Forms

NOT PRESENT. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT. [CONFIRMED-CODE]

## 16. States

Empty: “No ads yet.” 403 simple mode. [CONFIRMED-CODE] [CONFIRMED-UI]

## 17. Empty State

Inline table row. [CONFIRMED-CODE]

## 18. Error Handling

403 simple mode. [CONFIRMED-CODE]

## 19. Feedback

NOT PRESENT. [CONFIRMED-CODE]

## 20. Navigation Behavior

Document title “Ads” collides with overview title in `AdsShell`. Tab still distinguishes via href. [CONFIRMED-CODE]

## 21. Entity Relationships

Ad belongs to AdSet belongs to AdCampaign. [CONFIRMED-CODE]

## 22. Business Rules

Kind is stored field (not computed like campaign CTWA/lead form). No spend at ad level on this screen. [CONFIRMED-CODE]

## 23. Backend Dependencies

`AdsCenterController::adsIndex`, `Ad` model. [CONFIRMED-CODE]

## 24. Frontend Dependencies

`AdsShell`, `SurfaceHeader`, `HairlineTable`, `Link`. [CONFIRMED-CODE]

## 25. Responsive Behavior

List pattern. Viewport NOT VERIFIED. [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: two “Ads” titles (room h1 + page h2). [CONFIRMED-CODE]
LIKELY ISSUE: Head title also “Ads” same as overview — history/tab confusion. Unlabeled table. [CONFIRMED-CODE]
REQUIRES MANUAL TEST: 403. [UNKNOWN]

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-ADS-LIST-001 | BLOCKER | 403 simple_mode | Unreachable | runtime-index [CONFIRMED-UI] |
| UX-ADS-LIST-002 | MEDIUM | No creative preview or ad-level metrics | List is names only | `ads/ads/index.tsx` [CONFIRMED-CODE] |
| UX-ADS-LIST-003 | LOW | Title “Ads” duplicates hub | Browser tab ambiguity | `AdsShell title="Ads"` on both [CONFIRMED-CODE] |
| UX-ADS-LIST-004 | LOW | Ad set not linked | Extra hop via campaign | JSX [CONFIRMED-CODE] |

## 28. Consistency Comparison

Same skeleton as ad-sets list. Campaign detail shows ads inline under ad sets (`name · kind`). [CONFIRMED-CODE]

## 29. Functional Preservation Contract

Must keep: `/ads/ads`, columns, campaign links, empty copy, workspace scope, 403 simple mode, distinct tab from `/ads`.

## 30. Design Input Contract

Purpose: Inventory synced ads.
Primary goal: See kind/status and jump to campaign.
Primary action: Open campaign.
Required information: ad name, kind, ad set, campaign, status.
Required components: shell tabs, header, table.
Required states: empty, 403.
May NOT be removed: kind, campaign link.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- Kind enum values in production (page types `string`). [UNVERIFIED]
