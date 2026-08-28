# Implementation plan: EvoSales pro product UI

**Blocked on approval of** [`docs/design-system/PRO-PRODUCT-DIRECTION.md`](../docs/design-system/PRO-PRODUCT-DIRECTION.md).

Do not implement product UI until that document is accepted.

This plan does **not** replace [`tasks/plan.md`](./plan.md) (HubSpot-gap closure). It is a separate frontend workstream on top of PR #101 / #114 / #115.

## Architecture

Keep Brand Book → tokens → Aurora bridge → Aurora primitives → EvoSales IA.

## Task list (approved order)

1. Global chrome — #7 + #4 + #10 (this PR)
2. Navigation — #3 expanded rail
3. Home — #1 act first
4. CRM lists — #2 one chrome band
5. Records — #6 identity before Ask Evo
6. Pipeline — #8 one forecast strip
7. Desk — #9 quieter frame
8. Command — #5 honesty + Actions

Each step is its own reviewable PR with Pest + types + lint + build.
