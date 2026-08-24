# Evotechly typography

## Font stack

**Geist Sans** via `@fontsource/geist-sans` (weights 400, 500, 600).

```css
--font-sans: 'Geist Sans', Geist, ui-sans-serif, system-ui, sans-serif, …;
```

Tailwind: `font-sans` on all UI. Geist is taste-skill approved; do not swap to Inter as default.

## UI scale (EvoSales CRM)

| Role | Size | Weight | Tailwind / notes |
|------|------|--------|------------------|
| Page title (list header) | 22px | semibold | Contacts, Deals, Reports room |
| Record title | 20px | semibold | Contact/deal name |
| UI body / data | 13px | normal | Lists, records, desk — density default |
| Section label | 11–12px | semibold uppercase | Association cards, KPI labels |
| Micro | 10–11px | medium | Badges, Ask Evo source chip |
| KPI number | 28px | semibold | Home tiles, funnel KPIs — use `.money` |

Proposed `@theme` additions (redesign PR 1): `--text-page-title`, `--text-record-title`, `--text-ui`.

## Data & money

```css
.money {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}
```

Apply to all DZD amounts, counts in tables, and KPI numbers.

## Copy tone

- Plain, specific — never "HubSpot", "Breeze", "Elevate", "Seamless"
- Sentence case labels (not Title Case Everywhere)
- Algeria-first: DZD, wilaya, Africa/Algiers, +213
- Ask Evo: two short sentences, record-grounded

## Marketing typography (reference only)

Google Drive *Evotechly Web Design System v1.0* specifies **Plus Jakarta Sans** for landing pages. Product apps (EvoSales, EvoDesk embed) use **Geist Sans** at 13px base — do not mix without explicit redesign scope.
