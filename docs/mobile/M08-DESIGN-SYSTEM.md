# M08 Contacts — design system notes

Uses the shared Evotechly mobile tokens in `mobile/theme/tokens` (accent `#E8530E` family). No parallel palette.

## Surfaces

| Element | Token usage |
|---|---|
| Screen canvas | `colors.canvas` |
| Cards / inputs | `colors.surface` + `colors.border` |
| Primary CTA (New / Save) | `colors.accent` / `colors.accentPressed` |
| Lead status badge | `colors.accentWash` + accent label |
| Secondary / empty copy | `colors.secondary` / `colors.muted` |
| Validation | `colors.danger` on input border + meta text |
| Touch targets | `metrics.minTouch` |
| Page / section / body | `type.page` / `type.section` / `type.body` / `type.label` / `type.meta` |

## Components (M08)

- **ContactRow** — initials circle, name, subtitle; min touch height.
- **Search field** — single-line, clear while editing (iOS), placeholder “Search name, email, phone”.
- **Error banner** — bordered surface alert + Try again (list/detail).
- **Form fields** — label + input + optional hint (lead_status) + field error.

## Accessibility

- Headers use `accessibilityRole="header"`.
- Buttons labeled (New contact, Edit contact, Save).
- Errors use `accessibilityRole="alert"` / `accessibilityLiveRegion` on field errors.
- Loading spinners expose accessibility labels.

## Out of scope visuals

No WhatsApp branding, no custom illustration set, no dark-theme fork in M08.
