# Evo tokens

Canonical values live in `resources/js/evo/tokens/evo.css`. `app.css`, `evo-shell.css`, the Aurora bridge, and Design Lab alias into that file. Do not add a parallel hex palette.

## Light workspace

| Token | Value | Role |
|---|---|---|
| `--evo-canvas` | `#F7F8F5` | Workspace background |
| `--evo-surface` | `#FFFFFF` | Cards, panels, fields |
| `--evo-surface-subtle` | `#F1F2EE` | Wells, chips |
| `--evo-ink` | `#0D1B24` | Text and structure |
| `--evo-ink-secondary` | `#4A5A63` | Secondary text |
| `--evo-ink-muted` | `#5B6B73` | Captions (AA) |
| `--evo-ink-faint` | `#8A969C` | Non-text only |
| `--evo-hairline` | `#E6E8E3` | Borders |
| `--evo-teal` | `#0F4C5C` | Focus, selection, active |
| `--evo-primary` | `#EC6025` | Primary actions only |
| `--evo-on-primary` | `#121212` | Label on orange (AA) |
| `--evo-logo` | `#D9500F` | Logo mark only |

White on `#EC6025` is 3.35:1 and fails WCAG AA for 13–14px labels. Primary buttons use `#121212`.

## Dark cabinet (one scale)

| Token | Value |
|---|---|
| `--evo-canvas` | `#0A0A0A` |
| `--evo-surface` | `#121212` |
| `--evo-surface-raised` | `#1C1C1C` |
| `--evo-ink` | `#F5F5F5` (not pure white) |
| `--evo-ink-secondary` | `#A3A3A3` |
| `--evo-ink-muted` | `#8A8A8A` |
| `--evo-hairline` | `#262626` |
| `--evo-focus` | `#5EB0C0` |

No glows, glass, gradients, or blue SaaS defaults.

## Type, density, motion

- Font: Geist only. Inter is no longer imported.
- Scale: 11 / 12 / 13 / 14 / 16 / 18 / 20 / 24 / 32.
- Controls: 32 compact / 36 standard. Table rows: 32–36.
- Radii: 8 / 10 / 12 / 999.
- Motion: 120ms / 200ms / 240ms, `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- `prefers-reduced-motion` is global (not scoped to `html.dark` or `.evo-shell`).

## Locale

`resources/js/evo/lib/format.ts`: `fr-DZ`, `Africa/Algiers`, 24h, DZD as `1 280 000 DA`, `+213` phones, `WEEK_STARTS_ON = 6` (Saturday).

## Conflicts vs discovery (25)

Resolved by aliasing production names onto the canonical layer:

1. Canvas `#F7F7F5` → `#F7F8F5`
2. Text `#161616` → `#0D1B24`
3. Hairline `#E3E3DF` / `#eaeaea` / `#e6e6e3` → `#E6E8E3`
4. Muted `#929292` (fails AA) → `#5B6B73`
5. Secondary `#666666` → `#4A5A63`
6. Accent `#E8530E` → `#EC6025` + derived hover/pressed
7. Logo `#D9500F` stays logo-only (`--evo-logo`)
8. Brief `#000` → `#0A0A0A`
9. Orange focus ring → teal
10. Orange selection → teal-soft
11. `--chart-1` orange → ink series
12. Hard-coded hex in pages — **deferred** (no page migration in PR1)
13. `--evo-surface` `#FBFCF9` → `#FFFFFF`
14. Three dark palettes → one (`#0A0A0A` / `#121212` / `#1C1C1C`)
15. Inter removed
16. Production `--text-page` 28px / 15px card — **deferred** (tokens exist; utilities stay until page PRs)
17. 48px list rows / 40px Aurora lg — **deferred** (PR3/PR4)
18. Assorted radii — **deferred** for existing components
19. Glass tokens unused by the new layer; Aurora glass CSS stays until PR3
20. New motion tokens exist; leftover 150ms `ease` on shell rows — **deferred** (PR2)
21. Mode transition −8 / +10 — **deferred** (PR2)
22. Reduced motion is global
23. Stale 288 / 64 / 240 comments in `app.css` header corrected
24. `--sidebar-online` → `--evo-success`
25. `--destructive-foreground` → `--evo-on-danger` (`#FFFFFF`)

## Corrections to the discovery report

Verified against `main` @ `595c84e`:

- Lucide usage is **6 files**, not UNVERIFIED: `types/navigation.ts`, `pages/leads/board.tsx` (legacy unreachable), `crm/quick-launch-grid.tsx`, `crm/saved-view-tabs.tsx`, `app-header.tsx` (dead), `shell/evo-sidebar.tsx` (legacy). `aurora/prompt-input.tsx` deleted in PR7. Plus a comment in `ui/aurora/badge.tsx`.
- `formatDzd` already exists in `resources/js/lib/money.ts` (currency style, centimes). Design Lab already had `formatDa`. PR1 adds `evo/lib/format.ts` rather than replacing production `formatDzd`.
- `composer ci:check` runs Pest only. JS gates are `npm run types:check`, `lint:check`, `test`, `build`.
- Design Lab already imported Geist and a near-canonical light palette; it now aliases `evo.css` instead of redeclaring hex.
