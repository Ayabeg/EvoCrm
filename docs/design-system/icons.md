# Icon inventory (PR1)

Canonical entry: `@/evo/icons` (Phosphor, named exports only).

`components.json` already sets `iconLibrary: phosphor`. `@phosphor-icons/react` is the production set. `lucide-react` stays installed until PR12. New lucide imports warn in ESLint.

## lucide-react (verified 2026-10-01)

| File | Icons | Status |
|---|---|---|
| `resources/js/types/navigation.ts` | `LucideIcon` type | Shared type; migrate with nav |
| `resources/js/pages/leads/board.tsx` | `CalendarClock`, `Ellipsis`, `Plus`, `Search` | Legacy unreachable board |
| `resources/js/components/crm/quick-launch-grid.tsx` | `Inbox`, `Megaphone`, `Send`, `Users`, `UserCircle`, `Plug` + `LucideIcon` | Live CRM chrome |
| `resources/js/components/crm/saved-view-tabs.tsx` | `ChevronDown` | Live list views |
| `resources/js/components/app-header.tsx` | `BookOpen`, `Folder`, `LayoutGrid`, `Menu`, `Search` | Dead starter header |
| `resources/js/components/shell/evo-sidebar.tsx` | `BarChart3`, `Bot`, `Building2`, `Calendar`, `FileText`, `Handshake`, `House`, `Inbox`, `LayoutGrid`, `LifeBuoy`, `Megaphone`, `MessageCircle`, `Search`, `Send`, `Settings`, `UserPlus`, `Users`, `Waypoints` + `LucideIcon` | Legacy sidebar |
| `resources/js/components/aurora/prompt-input.tsx` | — | **Deleted in PR7** (last AGPL Aurora file) |
| `resources/js/components/ui/aurora/badge.tsx` | comment only | Aurora |

No other icon families (`react-icons`, Heroicons, Tabler, Radix icons) are imported in `resources/js`.

`bot-avatars` (MIT) remains for bot marks.

Mass migration is **out of scope for PR1**.
