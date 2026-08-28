# Implementation plan: EvoSales pro product UI

**Blocked on approval of** [`docs/design-system/PRO-PRODUCT-DIRECTION.md`](../docs/design-system/PRO-PRODUCT-DIRECTION.md).

Do not implement product UI until that document is accepted.

This plan does **not** replace [`tasks/plan.md`](./plan.md) (HubSpot-gap closure). It is a separate frontend workstream on top of PR #101 / #114 / #115.

## Architecture

Keep Brand Book → tokens → Aurora bridge → Aurora primitives → EvoSales IA.

## Task list (after approval)

1. Shell + orange discipline + honest top-bar copy
2. AppSidebar CRM grouping (not Aurora Sidebar)
3. Home: attention first, compact KPIs
4. CRM list chrome (keep ListViewTable)
5. Record: identity before Ask Evo
6. Pipeline: one forecast strip
7. Desk: quieter frame, denser threads
8. Create-drawer form consistency
9. Empty/loading copy
10. Mobile filter Sheet + 320–1920 light/dark QA

Each step is its own reviewable PR with Pest + types + lint + build.
