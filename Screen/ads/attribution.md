# Ads attribution

## 1. Screen Identity

Screen ID: SCR-ADS-007
Product area: Ads
Route: `/ads/attribution`
Route name: `ads.attribution`
Frontend file: `resources/js/pages/ads/attribution.tsx`
Primary component: `AdsAttribution`
Layout: `AdsShell` title “Attribution”. Breadcrumbs Ads `/ads`, Attribution `/ads/attribution`. Tab exact. [CONFIRMED-CODE]
Authentication: `auth` + `verified`. [CONFIRMED-CODE]
Permissions: GET not `ads.manage`. Simple mode 403. [CONFIRMED-CODE]
Parent navigation: Ads tab; overview caption “Funnel boards: Attribution”. [CONFIRMED-CODE]
Entry points: Ads tabs, overview link. [CONFIRMED-CODE]
Exit points: campaign name → show; Ads overview empty-state link `/ads`. [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): **403**. [CONFIRMED-UI]
Evidence: runtime-index `/ads/attribution` 403. `AdsCenterController::attribution`. [CONFIRMED-CODE] [CONFIRMED-UI]

## 2. Purpose

Full-funnel performance from Meta spend through CRM outcomes, per campaign and as workspace totals (ROAS/CPL). Complements overview (ops) with funnel boards. [CONFIRMED-CODE]

## 3. Current UX Summary

Header + connected/demo badge. Six KPI totals including ROAS. Optional reason panel. Empty panel with link to overview, or `xl:grid-cols-2` cards: name, kind badge, status badge, account, compact `FunnelBoard`, spend/CPL/ROAS/ad-set/budget caption. No date window. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. App shell + Ads tabs. [CONFIRMED-CODE]
2. `SurfaceHeader` “Attribution” / “Full-funnel performance from Meta spend through CRM outcomes.” Badge. [CONFIRMED-CODE]
3. `KpiMeter`: Spend (Meta), Impressions (Meta), Clicks (Meta), Leads (CRM)=conversations+form_leads, Won (CRM), ROAS (calc) or “Not enough data”. [CONFIRMED-CODE]
4. Optional reason `HairlinePanel`. [CONFIRMED-CODE]
5. Empty **or** campaign funnel cards. [CONFIRMED-CODE]

## 5. Data Displayed

Same campaign query as overview (with account, ad_sets_count). `funnels` + `totals` from `AdsFunnel`. Per card: `kindOf` same as hub, `FunnelBoard compact`, `formatDzd(spend)`, CPL or “CPL unavailable”, ROAS or “ROAS unavailable”, ad_sets_count, optional daily budget. [CONFIRMED-CODE]

`AdsFunnel` math: CPL = spend/form_leads (not conversations); ROAS = won revenue_cents / spend_cents. Totals ROAS uses aggregated revenue/spend. [CONFIRMED-CODE]

## 6. Primary Actions

Open campaign detail. [CONFIRMED-CODE]

## 7. Secondary Actions

Empty state → Ads overview. Room tabs. No sync on this page. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. [CONFIRMED-CODE]

## 9. Filters

NOT PRESENT. All-time stats, not Reports date window. [CONFIRMED-CODE]

## 10. Sorting

Server `latest()` campaigns, not spend-ranked. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

All campaigns, each with full funnel query (`forWorkspace` maps `forCampaign`). [CONFIRMED-CODE]

## 14. Forms

NOT PRESENT. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT. [CONFIRMED-CODE]

## 16. States

Disconnected badge “Demo data”. Reason panel if `meta.reason`. Zero campaigns empty copy. Funnel zeros still draw compact board. 403 simple mode. [CONFIRMED-CODE] [CONFIRMED-UI]

## 17. Empty State

“No campaigns yet. Connect Meta and sync from the Ads overview.” with link. [CONFIRMED-CODE]

## 18. Error Handling

403 simple mode. No per-card error. ROAS/CPL null copy instead of throwing. [CONFIRMED-CODE]

## 19. Feedback

Badge only. No toasts. [CONFIRMED-CODE]

## 20. Navigation Behavior

Exact tab. Campaign click keeps Campaigns tab on detail. [CONFIRMED-CODE]

## 21. Entity Relationships

Same as AdsFunnel: stats, threads, AdLeads, leads, deals/won revenue. [CONFIRMED-CODE]

## 22. Business Rules

- Leads KPI uses conversations+form_leads; CPL uses form_leads only — numbers can disagree. [CONFIRMED-CODE]
- ROAS needs spend > 0 and won revenue. [CONFIRMED-CODE]
- No owner/date filter (unlike `/reports/ads`). [CONFIRMED-CODE]

## 23. Backend Dependencies

`AdsCenterController::attribution`, `AdsFunnel`, `AdCampaign`. [CONFIRMED-CODE]

## 24. Frontend Dependencies

`AdsShell`, `KpiMeter`, `FunnelBoard`, `EMPTY_FUNNEL`, `HairlinePanel`, `SurfaceHeader`, `Badge`, `formatDzd`, `Link`. [CONFIRMED-CODE]

## 25. Responsive Behavior

Cards `xl:grid-cols-2`. FunnelBoard compact 3-col grid. Viewport NOT VERIFIED. [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: sr-only h1 Ads; h2 Attribution. [CONFIRMED-CODE]
LIKELY ISSUE: KPI meter not a list/table; badges without extra text; campaign cards not articles with headings (name is a link). [CONFIRMED-CODE]
REQUIRES MANUAL TEST: 403, contrast of compact bars. [UNKNOWN]

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-ADS-ATTR-001 | BLOCKER | 403 simple_mode | Unreachable | runtime-index [CONFIRMED-UI] |
| UX-ADS-ATTR-002 | HIGH | No date window while Reports ads room is windowed | Attribution vs `/reports/ads` disagree | `attribution.tsx` vs `ReportController` [CONFIRMED-CODE] |
| UX-ADS-ATTR-003 | MEDIUM | Leads KPI vs CPL denominator mismatch | Misleading efficiency | `AdsFunnel` cpl vs UI leads sum [CONFIRMED-CODE] |
| UX-ADS-ATTR-004 | LOW | No sync; empty state sends user to overview | Extra hop | empty copy [CONFIRMED-CODE] |
| UX-ADS-ATTR-005 | LOW | Campaigns not sorted by spend | Weak performers intermixed | `latest()` [CONFIRMED-CODE] |

## 28. Consistency Comparison

FunnelBoard shared with campaign detail. Reports Ads category uses EvoViz spend charts + CPL from ad leads in window — different definition. [CONFIRMED-CODE]

## 29. Functional Preservation Contract

Must keep: `/ads/attribution`, six KPIs including ROAS null copy, per-campaign compact funnel, kind/status/account, spend/CPL/ROAS caption, campaign links, empty→overview, simple-mode 403.

## 30. Design Input Contract

Purpose: Compare campaign funnels and efficiency.
Primary goal: See drop-off and ROAS/CPL then open a campaign.
Primary action: Open campaign.
Required information: totals, per-campaign funnel + efficiency, Meta badge.
Required components: header, KPI meter, campaign funnel cards or empty.
Required states: empty, disconnected, 403.
May NOT be removed: FunnelBoard stages, ROAS/CPL, campaign links.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- Performance of N+1 `forCampaign` on large workspaces. [UNVERIFIED]
