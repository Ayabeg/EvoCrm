# EvoCRM Dashboard Benchmark

## Scope

This benchmark covers Home and the adjacent Reports surface. It is deliberately about dashboard behavior and hierarchy, not about copying a visual style.

## Current EvoCRM baseline

The current Home implementation is resources/js/pages/home.tsx. It already has a DashboardHeader, KPI strip, reusable HomeWidget and HomeWidgetEmpty primitives, section grouping, pipeline bars, a Needs attention area, recent activity, quota content, and activity/pipeline summaries. Analytics also exists as a separate Reports room under resources/js/pages/crm/reports.tsx and the reports routes.

This means the decision is not whether EvoCRM needs a dashboard at all. The decision is how Home should become a reliable operating surface while Reports remains the place for exploration and saved dashboards.

## Benchmark evidence

| Product | Evidence | Strong behavior | Limitation for EvoCRM |
|---|---|---|---|
| Shopify | [Mobbin dashboard screen](https://mobbin.com/screens/926a4f5e-3766-40eb-8c89-30f6429d4ced); [official overview dashboard guidance](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/overview-dashboard/using-the-overview-dashboard) | Prioritizes business health, period comparison, alerts, and drill-downs. A merchant can move from signal to action quickly. | Commerce metrics and store operations do not map directly to CRM work. |
| Stripe | [Dashboard basics](https://docs.stripe.com/dashboard/basics) | High signal-to-noise, clear object status, strong progressive disclosure, and direct links to operational records. | Financial/accounting terminology and risk surfaces are domain-specific. |
| HubSpot | [record index and filtering model](https://knowledge.hubspot.com/records/view-and-filter-records-in-the-updated-index-page) | Connects overview metrics to records, tasks, pipeline, and follow-up queues. | The product can expose too many hubs and promotional modules for an SMB user. |
| Ramp | Product dashboard pattern observed in production-oriented finance workspaces. | Uses exception-oriented information hierarchy: items needing a decision appear before passive reporting. | Expense controls and approvals are not EvoCRM objects. |

## Score comparison

Scores are 1–10. The implementation score is effort, where 10 means high complexity.

| Candidate | Hierarchy | Ease | Speed | Discoverability | Density | Scale | A11y | Keyboard | Responsive | EvoCRM fit | Complexity |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Shopify | 9 | 8 | 8 | 8 | 7 | 8 | 7 | 6 | 8 | 8 | 5 |
| Stripe | 9 | 8 | 8 | 8 | 8 | 9 | 8 | 7 | 8 | 8 | 6 |
| HubSpot | 8 | 7 | 7 | 9 | 8 | 9 | 7 | 7 | 7 | 9 | 7 |
| Ramp | 8 | 8 | 8 | 8 | 8 | 8 | 7 | 6 | 7 | 7 | 6 |

## What wins

Shopify wins the overview hierarchy: orient the user around the health of the business, compare against a meaningful time period, surface exceptions, and let every important metric lead to a concrete view or record.

Stripe wins the operational details: compact KPI cards, status language, clear drill-down, and a strong separation between a summary surface and a deeper analytical surface.

HubSpot wins the CRM connection: a dashboard is most useful when a metric such as stale deals, overdue tasks, or new leads opens the exact object list that can resolve it.

## EvoCRM target architecture

Home should use this order:

1. Context bar: current workspace, date range, comparison period, refresh state, and dashboard actions.
2. Needs attention: overdue activities, unassigned inbox conversations, stale open deals, failed automations, and integration health.
3. KPI strip: pipeline value, weighted forecast, win rate, open activities, response time, and revenue/quote progress where data exists.
4. Performance: pipeline movement, activity completion, response volume, and source/channel contribution.
5. Work queues: today, upcoming, recent conversations, recent records, and saved shortcuts.
6. Empty and partial-data states: explain what is missing and provide the next setup action.

The key rule is that Home is an operating dashboard, not a report gallery. Reports owns configurable analysis, historical comparison, and saved dashboards.

## ADOPT / ADAPT / REJECT

| Decision | Rationale |
|---|---|
| ADOPT Shopify's signal-to-action hierarchy | It gives the user a reason to visit the dashboard and a direct next step. |
| ADOPT Stripe's compact status and drill-down behavior | It keeps dense business data legible without making the page feel like a spreadsheet. |
| ADAPT HubSpot's record-linked metrics | Route each insight to the existing DataWorkspace, PipelineBoard, Activities, Inbox, or automation surface. |
| ADAPT Ramp's exception-first ordering | Use Needs attention as a ranked queue with owner, age, and one primary action. |
| REJECT a widget marketplace on Home by default | Customization belongs in Reports. A blank grid or widget catalog delays time-to-value. |
| REJECT decorative charts and vanity totals | A metric must answer what changed, why it matters, or what the user should do next. |

## Date, state, and empty behavior

Date controls must be explicit and consistent: Today, This week, This month, This quarter, Custom, plus a comparison toggle. Persist the choice per dashboard but show the active range in the header.

Every widget needs four states: loading skeleton, populated, empty with a useful setup action, and error with retry. Partial data must identify the unavailable source rather than quietly showing a zero.

## Responsive behavior

Desktop uses a two-column widget grid with the attention queue spanning the primary content width. Tablet collapses to one primary column and keeps filters and actions visible. Mobile prioritizes Needs attention, KPI summary, and Today; charts become horizontally scrollable or switch to a compact list. No widget should require hover to disclose its meaning.

## Implementation impact

Eventually affect resources/js/pages/home.tsx, HomeWidget primitives, dashboard filter/header components, the reports page and saved-dashboard routes, and links into the existing DataWorkspace, Activities, PipelineBoard, Inbox, and Workflow pages. This document does not authorize implementation.

## Sources

See the [EvoCRM Mobbin contract](../evocrm-mobbin-contract.md), [design system](../design-system.md), and [overall benchmark](ux-benchmark.md) for the normalized reference policy and source register.
