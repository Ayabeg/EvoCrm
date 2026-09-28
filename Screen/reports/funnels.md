# Conversion funnels

## 1. Screen Identity

Screen ID: SCR-REPORT-003
Product area: Reports
Route: `/reports/funnels`
Route name: `reports.funnels`
Frontend file: `resources/js/pages/reports/funnels/index.tsx`
Primary component: `ConversionFunnels` Inertia `reports/funnels/index`
Layout: `ReportsShell` title/pageTitle “Conversion funnels”. Custom tab is active (`activePaths` includes `/reports/funnels`). Breadcrumbs Reports `/reports`, Conversion funnels `/reports/funnels`. [CONFIRMED-CODE]
Authentication: `auth` + `verified`. [CONFIRMED-CODE]
Permissions: GET method-safe, no `reports.manage`. **Not** blocked by SimpleMode (unlike report-builder). [CONFIRMED-CODE]
Parent navigation: Reports Custom tab (shared with builder). No dedicated sidebar item. JSON cousin `GET /api/funnels/{funnel}` (`api.funnels.show`) is not this UI. [CONFIRMED-CODE]
Entry points: `/reports/funnels` URL; Custom tab actually points to `/crm/report-builder` — **funnels has no first-class tab href**. Users must know the URL or use breadcrumbs from this page. [CONFIRMED-CODE]
Exit points: Reports Overview/Sales/etc. tabs; Custom tab leaves for builder (403 in simple mode). [CONFIRMED-CODE]
Runtime HTTP (owner, simple_mode=true): **200** component `reports/funnels/index`. [CONFIRMED-UI]
Evidence: runtime-index `/reports/funnels` 200, props `funnels`, `report`, `custom`. `FunnelController::index`. `ConversionFunnelQueryTest`. [CONFIRMED-CODE] [CONFIRMED-UI]

## 2. Purpose

Stage drop-off for a workspace conversion funnel (default: Visits → Orders placed → Confirmed → Delivered) in an Africa/Algiers date window, with ad spend/CPL KPIs and per-source breakdown. Distinct from Ads `FunnelBoard` (Meta impressions→won). [CONFIRMED-CODE]

## 3. Current UX Summary

Reports chrome with filter form (funnel, from, to, Apply, Last 30 days if custom). Five KPI tiles. Section “Stage conversion — where drop-off happens” with vertical bars. Section “Source breakdown — which channels convert” table. Footer names funnel and window. [CONFIRMED-CODE]

## 4. Screen Anatomy

1. App shell + Reports tabs (Custom highlighted even though href is report-builder). [CONFIRMED-CODE]
2. Optional h2 “Conversion funnels” (pageTitle ≠ “Reports”). Description `{from} → {to} · {days} days · {timezone}. Stage drop-off with source spend and CPL.` [CONFIRMED-CODE]
3. Filter form `aria-label="Funnel filters"`. [CONFIRMED-CODE]
4. `CrmKpiStrip` columns=5. [CONFIRMED-CODE]
5. Stage board in bordered canvas. [CONFIRMED-CODE]
6. `SourceBreakdownTable`. [CONFIRMED-CODE]
7. Footer. [CONFIRMED-CODE]

## 5. Data Displayed

Props: `funnels[]` `{id,name,slug,is_default}` ordered default first then name; `report` payload; `custom` bool if from/to query. [CONFIRMED-CODE]

**report.window:** from, to, days, timezone Africa/Algiers. Default last 30 days; swap if inverted. No 92-day clamp (unlike ReportController). [CONFIRMED-CODE]

**report.funnel:** id, name, slug. Missing default → `ConversionFunnelProvisioner::provision`. Query `?funnel=` must exist in workspace. [CONFIRMED-CODE]

**report.kpis:** spend_cents (sum AdCampaignStat in window), visits, orders (`orders_placed` stage), cpl_cents = spend/visits or null, conversion_rate = orders/visits % or null. [CONFIRMED-CODE]

KPI tiles: Ad spend (money, hint total source spend), Visits, Orders (bottom-of-funnel conversions), Cost per lead (money; hint spend÷visits or “No visits in window”), Visit → order (percent). [CONFIRMED-CODE]

**report.stages:** from funnel stages config (4 default): key, label, count (unique subject per event_type), rate_from_previous, rate_from_top. Board: bar width vs first stage count; first row shows rate_from_top else previous %. [CONFIRMED-CODE]

**report.sources:** source (facebook/instagram/google/direct labeled), visits, orders_placed, confirmed, delivered, spend_cents, cpl_cents. Empty: “No source data in this window yet.” Spend from events’ ad_campaign_id stats; facebook/instagram/meta may inherit total spend if none. [CONFIRMED-CODE]

Runtime prop keys confirmed; values not dumped. [CONFIRMED-UI]

## 6. Primary Actions

**Apply** GET `/reports/funnels` `{ from, to, funnel }` preserveState. [CONFIRMED-CODE]

## 7. Secondary Actions

**Last 30 days** when `custom`: GET with `{ funnel }` only. Reports room tabs. [CONFIRMED-CODE]

No create/edit funnel UI. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT. [CONFIRMED-CODE]

## 9. Filters

- Funnel `<select>` (name + “ (default)”). [CONFIRMED-CODE]
- From/To date inputs with max/min. [CONFIRMED-CODE]

Owner filter NOT PRESENT (unlike analytics rooms). [CONFIRMED-CODE]

## 10. Sorting

NOT PRESENT. Sources sorted visits desc server-side. Stages by funnel position. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT. [CONFIRMED-CODE]

## 12. Bulk Actions

NOT PRESENT. [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

Single report payload. Inertia GET preserveState. JSON API exists but unused by this page. [CONFIRMED-CODE]

## 14. Forms

Filter GET only. No POST. Funnel id string in query `funnel`. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT. [CONFIRMED-CODE]

## 16. States

- Always shows KPI strip (nulls as —). [CONFIRMED-CODE]
- Stages can all be zero (empty bars). [CONFIRMED-CODE]
- Empty sources copy. [CONFIRMED-CODE]
- `custom` toggles reset button. [CONFIRMED-CODE]
- Invalid funnel id: validation/exists 422. [CONFIRMED-CODE]
- 200 in simple_mode. [CONFIRMED-UI]

## 17. Empty State

No workspace-empty hero. Provisioner creates default funnel if missing. Source table has empty copy; stage board always renders. [CONFIRMED-CODE]

## 18. Error Handling

Date/funnel validation. No on-page error display. 403 not applicable for simple mode. [CONFIRMED-CODE]

## 19. Feedback

No toasts. Apply is a full GET. [CONFIRMED-CODE]

## 20. Navigation Behavior

Stays on `/reports/funnels`. Custom tab looks active; clicking Custom navigates to report-builder (403 simple). Overview is `/reports`. [CONFIRMED-CODE]

## 21. Entity Relationships

ConversionFunnel has stages; FunnelEvent (event_type, source, ad_campaign_id, subject uniqueness); AdCampaignStat spend. Default stages from `config/evosales.php` conversion_funnel. [CONFIRMED-CODE]

## 22. Business Rules

- Counts unique subject_type+subject_id per stage event. [CONFIRMED-CODE]
- CPL here is spend/visits, not spend/ad-leads (Reports ads room) or spend/form_leads (AdsFunnel). [CONFIRMED-CODE]
- Spend is all workspace ad stats in window, not per source except breakdown heuristic. [CONFIRMED-CODE]
- Simple mode allows this page; Ads hub 403. [CONFIRMED-CODE]

## 23. Backend Dependencies

`FunnelController`, `ConversionFunnelQuery`, `ConversionFunnelProvisioner`, `ConversionFunnel`, `FunnelEvent`, `AdCampaignStat`. [CONFIRMED-CODE]

## 24. Frontend Dependencies

`ReportsShell`, `CrmKpiStrip`, `FunnelStageBoard`, `SourceBreakdownTable` (`formatDzd` from hub-chrome). [CONFIRMED-CODE]

## 25. Responsive Behavior

Filters wrap. Stage board 3-col grid (`10rem` label). Source table overflow hidden rounded; may need horizontal scroll on small screens — NOT VERIFIED. KPI 5 columns. [CONFIRMED-CODE]

## 26. Accessibility Observations

CONFIRMED: form `aria-label="Funnel filters"`; section h2s; room h1 sr-only Reports. [CONFIRMED-CODE]
LIKELY ISSUE: funnel/date controls lack `aria-label` (visual labels only). Stage bars non-focusable. Source table no caption. Custom tab mismatch. [CONFIRMED-CODE]
REQUIRES MANUAL TEST: keyboard, contrast of opacity bars. [UNKNOWN]

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-FUN-001 | HIGH | No nav item; Custom tab goes to builder | Funnels undiscoverable; simple users 403 if they click Custom | reports-shell vs FunnelController [CONFIRMED-CODE] [CONFIRMED-UI] |
| UX-FUN-002 | MEDIUM | Three different “funnel/CPL” definitions vs Ads attribution and Reports ads | Conflicting numbers | ConversionFunnelQuery vs AdsFunnel vs ReportController [CONFIRMED-CODE] |
| UX-FUN-003 | LOW | No 92-day clamp | Very wide windows possible | FunnelController parseWindow [CONFIRMED-CODE] |
| UX-FUN-004 | LOW | Cannot edit stages in UI | Stuck with provisioned 4 stages | no routes [CONFIRMED-CODE] |
| UX-FUN-005 | OBSERVATION | Orders KPI uses orders_placed vs source table extra confirmed/delivered | Users may look at different bottoms | kpis vs sources [CONFIRMED-CODE] |

## 28. Consistency Comparison

Filter chrome matches analytics rooms (dates + Apply + Last 30 days) but adds funnel select and omits owner. Stage UI similar to Ads FunnelBoard with different stages. Reports Ads tab is spend/leads not visits/orders. [CONFIRMED-CODE]

## 29. Functional Preservation Contract

Must keep: `/reports/funnels` 200 in simple mode; funnel+date query; default 4 stages; KPI set (spend, visits, orders, CPL, conversion); FunnelStageBoard rates; source table columns; provision default funnel; Algiers window; Custom tab activePaths include this URL without requiring builder.

## 30. Design Input Contract

Purpose: Show conversion drop-off and channel efficiency.
Primary goal: See where visits fail to become delivered orders and which source spends.
Primary actions: Apply funnel/date window.
Secondary: Reset 30 days; jump to other report rooms.
Required information: funnel identity, window, 5 KPIs, stages, sources.
Required components: Reports shell, filter form, KPI strip, stage board, source table.
Required states: zero events, empty sources, custom vs default window, 200 simple mode.
Information priority: KPIs → stages → sources.
Business-critical: unique subject counts, spend/CPL math, default stage keys.
May NOT be removed: funnel selector, date window, stage rates, source spend/CPL.

Do not prescribe a new look.

## 31. Open Questions / Unknowns

- Whether command palette or evo search indexes `/reports/funnels`. Command-os has reports + report-builder only. [CONFIRMED-CODE]
- Local funnel event volume on Evotechly. [UNVERIFIED]
- JSON `api.funnels.show` consumers (not this screen). [UNVERIFIED]
