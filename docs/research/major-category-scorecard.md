# EvoCRM Major Category Scorecard

## Scoring rubric

Scores are 1–10. For the first ten dimensions, 10 is stronger. Implementation complexity is inverted as a suitability score here: 10 means easier to implement safely and 1 means very complex. This keeps a higher total consistently better.

Dimensions: information hierarchy, ease of use, speed, discoverability, professional density, scalability, accessibility, keyboard efficiency, responsive behavior, EvoCRM suitability, implementation simplicity.

## Scorecard

| Category | Reference candidate | Hierarchy | Ease | Speed | Discoverability | Density | Scale | A11y | Keyboard | Responsive | Fit | Simplicity | Total / 110 |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| App shell | Linear | 9 | 9 | 10 | 9 | 8 | 8 | 8 | 10 | 8 | 9 | 8 | 96 |
| Dashboard | Shopify | 9 | 8 | 8 | 8 | 7 | 8 | 7 | 6 | 8 | 8 | 7 | 86 |
| Data workspace | HubSpot | 9 | 8 | 7 | 9 | 8 | 9 | 7 | 7 | 7 | 9 | 6 | 86 |
| Record workspace | HubSpot | 9 | 8 | 7 | 9 | 8 | 9 | 7 | 7 | 7 | 9 | 6 | 86 |
| Pipeline | Pipedrive | 9 | 9 | 9 | 9 | 8 | 7 | 7 | 7 | 8 | 9 | 8 | 90 |
| Inbox | Intercom | 9 | 9 | 8 | 9 | 8 | 8 | 7 | 8 | 7 | 9 | 6 | 88 |
| Activities | Linear/Asana hybrid | 9 | 9 | 9 | 9 | 8 | 8 | 8 | 9 | 8 | 9 | 8 | 94 |
| Automation | Shopify Flow | 9 | 9 | 8 | 9 | 7 | 8 | 7 | 6 | 7 | 9 | 8 | 87 |
| Quotes | Stripe | 9 | 8 | 8 | 9 | 8 | 9 | 8 | 7 | 8 | 9 | 7 | 90 |
| Settings | Stripe | 10 | 8 | 8 | 9 | 8 | 10 | 8 | 7 | 8 | 9 | 7 | 92 |
| Integrations | Shopify/Zapier hybrid | 9 | 8 | 8 | 9 | 7 | 9 | 7 | 7 | 8 | 9 | 7 | 88 |
| Search/command | Linear/Slack hybrid | 9 | 9 | 10 | 9 | 8 | 9 | 8 | 10 | 8 | 9 | 7 | 96 |
| Forms/create | Stripe/Linear hybrid | 9 | 9 | 9 | 9 | 8 | 8 | 8 | 8 | 8 | 9 | 8 | 93 |
| Onboarding | Shopify | 9 | 9 | 8 | 10 | 7 | 8 | 7 | 6 | 8 | 9 | 8 | 89 |
| AI | Contextual Intercom/HubSpot | 8 | 7 | 8 | 7 | 7 | 7 | 6 | 7 | 7 | 8 | 5 | 77 |

## Interpretation

The highest value patterns are not necessarily the most visually sophisticated. Command, shell, activities, settings, and create flows score highly because their behavior is direct and reusable. AI scores lower because usefulness depends on data grounding, permissions, trust, and explainability.

The largest current implementation risk is not raw complexity. It is divergence between existing primitives: DataWorkspace versus domain tables, native versus embedded inbox, legacy versus active shell, and Lucide versus Phosphor icon usage. Normalize those contracts before adding more visual variants.

## Evidence and limitation

These are expert benchmark scores synthesized from production-oriented product references, Mobbin screens/flows, official documentation, and the current repository audit. They are not a substitute for task-based usability testing with EvoCRM users.
