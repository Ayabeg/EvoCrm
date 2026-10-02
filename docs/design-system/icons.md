# Icon inventory (PR12)

Canonical entry: `@/evo/icons` (Phosphor, named exports only).

`components.json` sets `iconLibrary: phosphor`. `@phosphor-icons/react` is the production set.

## lucide-react — removed in PR12

`lucide-react` is no longer a dependency. ESLint `no-restricted-imports` treats any `lucide-react` import as an error. Product chrome, leftover starter header, and the legacy sidebar import Phosphor from `@/evo/icons`.

| File | Status |
|---|---|
| `resources/js/types/navigation.ts` | `Icon` type from `@/evo/icons` |
| `resources/js/pages/leads/board.tsx` | Phosphor via `@/evo/icons` |
| `resources/js/components/crm/quick-launch-grid.tsx` | Phosphor via `@/evo/icons` |
| `resources/js/components/crm/saved-view-tabs.tsx` | Phosphor via `@/evo/icons` |
| `resources/js/components/app-header.tsx` | Phosphor via `@/evo/icons` |
| `resources/js/components/shell/evo-sidebar.tsx` | Phosphor via `@/evo/icons` |
| `resources/js/components/aurora/prompt-input.tsx` | Deleted in PR7 |
| `resources/js/components/ui/aurora/badge.tsx` | Deleted with Aurora |

No other icon families (`react-icons`, Heroicons, Tabler, Radix icons) are imported in `resources/js`.

`bot-avatars` (MIT) remains for bot marks.
