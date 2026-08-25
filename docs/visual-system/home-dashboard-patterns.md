# Home Dashboard UX Patterns

Canonical reference for EvoSales command-center surfaces after the Shopify-inspired Home redesign.

## Information flow

**Context → Performance → Attention → Action → Detail**

1. **Header** — title, period filters, owner scope, primary CTA (`DashboardHeader`)
2. **KPI strip** — value + change + context (`CrmKpiStrip` / `EvoKpiCard`)
3. **Performance** — primary EvoViz chart (revenue won over time)
4. **Pipeline health** — stage distribution + board link
5. **Needs attention** — actionable items with buttons (`AttentionList`)
6. **Recent activity** — compact feed (`ActivityFeed`)
7. **Quick actions** — module entry points (`QuickActions`)

## Design authority

- Tokens: `resources/css/app.css`
- Brand rules: `docs/brandbook/`
- Charts: `resources/js/evoviz/contract.ts`
- Visual foundation: PR #80 (`stage-colors`, tokenized Desk, typography utilities)

## KPI pattern

Each KPI tile includes when data allows:

- **Value** — primary metric
- **Change** — % vs previous period of equal length
- **Context** — hint or comparison label
- **Href** — drill-down to module

## Attention pattern

Each item: title, human-readable description, single primary action linking to an existing route.

Empty state: “You're all caught up” — no decorative card.

## Data integrity

`HomeDashboardBuilder` uses real Deal, Activity, Lead, Thread, OutboundMessage queries. Sections omitted when empty — no fabricated charts.

## Responsive

- Desktop: 2/3 + 1/3 grid (performance left, attention right)
- Mobile: stacked sections, scrollable tables

## Unsupported metrics (documented)

- Historical pipeline value comparison (no snapshots) — pipeline KPI shows current open value only
- Team filter beyond owner_id — not in backend yet
