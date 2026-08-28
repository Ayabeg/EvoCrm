# Home Dashboard UX Patterns

Canonical reference for the EvoSales command-center Home after the pro product redesign.

## Information flow

**Context → Metrics → Needs attention → Pipeline → Performance / Activity**

1. **Header** — title, period, one primary CTA (`DashboardHeader`)
2. **Filter toolbar** — date + owner, no enclosing card
3. **KPI strip** — compact values + change (`HomeKpiStrip`)
4. **Needs attention** — full-width work queue (`AttentionList`)
5. **Pipeline** — stage rows from existing open-deal totals
6. **Performance** — existing EvoViz revenue-won chart, demoted
7. **Activity / Won by owner** — compact rows; omitted when empty

Quick actions are not rendered. The global Create control covers create paths. `quickActions` remains on the Inertia payload so existing tests and future command Actions can reuse the hrefs.

## Design authority

- Tokens: `resources/css/app.css` Brand Book aliases (`bg-canvas`, `border-hairline`, `text-ink`, `text-mute`, `text-kpi`)
- Brand rules: `docs/brandbook/`
- Direction: `docs/design-system/PRO-PRODUCT-DIRECTION.md`
- Charts: `resources/js/evoviz/contract.ts`
- Home chrome must not use raw `--aurora-*` (PR #101)

## Visual language

- **Cards only when grouping work.** Needs attention is one panel. KPI, pipeline, activity use dividers and rows.
- **KPI values** — Brand `--text-kpi` (28px), compact DZD (`formatCompactDzd`)
- **Labels** — mute 11–12px, sentence case
- **Orange** — New deal only on this page. Attention actions stay outline.

## KPI pattern

Each KPI includes when data allows:

- **Value** — primary metric (compact money)
- **Change** — % vs previous period of equal length
- **Context** — hint
- **Href** — drill-down to an existing module

## Attention pattern

Each item: leading count (from the existing description), title, description, one outline action to an existing route.

Empty state: “You're all caught up.” — no decorative card.

## Data integrity

`HomeDashboardBuilder` uses real Deal, Activity, Lead, Thread, OutboundMessage queries. Sections omitted when empty — no fabricated charts or forecasts. Pipeline bars are share of existing `amount_cents`.

## Responsive

- Desktop: `max-w-6xl`. Attention full width. Pipeline + Performance two columns. Activity + won-by-owner two columns.
- Mobile: same order, stacked. Filters wrap. KPI strip is 2 / 3 / 5 columns. Chart height is constrained.

## Unsupported metrics (documented)

- Historical pipeline value comparison (no snapshots) — pipeline KPI shows current open value only
- Team filter beyond owner_id — not in backend yet
