# EvoCRM micro-UX benchmark

| | |
|---|---|
| **Status** | Approved research |
| **Audited revision** | `a0b9a8571fed2a1cbe7bd98d58b47d043c4fc7b2` |
| **Companion** | [`ux-benchmark.md`](./ux-benchmark.md) |
| **Authority** | EvoCRM tokens / type / density / motion (`docs/design-system.md`). Linear + Stripe + WAI-ARIA / WCAG for **behavior**, never paint. |
| **Principal consistency risk** | Lucide and Phosphor on the same product. `components.json` is Phosphor. Rail/topbar are Phosphor. Command palette, `record-chrome`, Ask Evo, activity composer, setup wizard, leftover `app-header` still import `lucide-react`. One family per screen is mandatory; Phosphor is the product family. |

---

## Locked rules

| Rule | Meaning |
|---|---|
| **One primary CTA per region** | `PageHeader` has one `primaryAction`. Topbar Create is global. A page must not ship a second filled accent button that competes with it. |
| **Escape + focus return** | Drawer, modal, palette, overlay close on Escape. Focus returns to the control that opened them. |
| **No color-only status** | Stage, stale, won/lost, SLA, unread need a label or icon plus color. Accent wash is selection, not meaning. |
| **Keyboard alternative for DnD** | Pipeline (and any board) must move via menu + keyboard, not drag alone. |
| **URL query state** | Saved views, filters, `?create=1`, future `?record=` / `?drawer=` are shareable. No second client-only filter store. |
| **Reduced motion** | Honor `prefers-reduced-motion`. Overlay motion is 150–200ms opacity/transform only. |

---

## Behavior matrix

| Primitive | Adopt | Reject | EvoCRM owner |
|---|---|---|---|
| **Button** | One primary per region; 36px; primary = accent fill + white label; secondary = surface + border; ghost; danger = semantic red | Two filled oranges in one header; `rounded-full` except search/avatar; clickable `div` | `ds/components/Button.tsx` |
| **Input** | Label above, error below; 36px; never placeholder-as-label | Placeholder-only required fields | `ds/components/Input.tsx` |
| **Select** | Same 36px / label / error as Input | Native unstyled `<select>` on product chrome (bulk leftover) | `ds/components/Select.tsx` |
| **Checkbox** | Labeled; page select-all has `aria-label` | Color-only selected row without a checkbox when selectable | `ds/components/Checkbox.tsx` |
| **Tabs** | One accent underline or wash on the active tab only | Orange fill on every tab | `ds/components/Tabs.tsx` |
| **Badge / status** | Text + optional color; stale/won/lost/unread named | Color-only status | `ds/components/Badge.tsx` |
| **Saved view pills** | Visible workset tabs; overflow after a useful set | Hard 3-tab ceiling as the product rule (`SavedViews` `slice(0, 3)` is a finding, not a lock) | `ds/workspace/SavedViews.tsx` |
| **Filter chip** | Removable chip; Advanced opens a drawer | Second inline advanced band on desktop | `ds/workspace/FilterBar.tsx` |
| **Advanced filter** | Right drawer; AND/OR groups; apply via URL | Client-only filter state that cannot be shared | `ds/workspace/AdvancedFilterDrawer.tsx` |
| **Bulk bar** | Sticky when `selectedIds.length > 0`; count announced; 36px actions | Bulk that only exists on some objects because the workspace does not own selection | `ds/workspace/BulkActionBar.tsx` |
| **Table row** | 48px; row click vs checkbox are separate hit targets | Entire row is a drag handle with no keyboard path | `ds/workspace/DataTable.tsx` / `list-view-table.tsx` |
| **Empty state** | Title + body + one action; page empty ≠ filtered empty | Illustration-only emptiness; fake KPI % | `ds/components/EmptyState.tsx` |
| **Skeleton** | Same geometry as the row/card it replaces | Orange pulse wash | `ds/components/Skeleton.tsx` |
| **Toast** | Success / error / **undo**; not the only record of a failure | Error only in a toast when the field is still wrong | `ds/components/Toast.tsx` (Sonner) |
| **Drawer** | 480 default / 560 filters; Esc; overlay click; focus trap; return focus | Drawer that steals browser Back without an explicit close | `ds/components/Drawer.tsx` |
| **Modal** | Confirm destructive; Convert; stage-required recovery | Modal for routine create when a drawer is the pattern | `ds/components/Modal.tsx` |
| **Tooltip** | Supplementary only | Tooltip-only critical actions (delete, send, activate, move) | `ds/components/Tooltip.tsx` |
| **Menu** | Card / row overflow for Move, Peek, Open, Delete | Menu as the only way to complete a primary task | `ds/components/Dropdown.tsx` |
| **Focus ring** | Accent, 3:1 against canvas | Ring removed “for cleanliness” | `--color-focus-ring` |
| **Drag and drop** | Preview + drop target; **menu + keyboard required** | Drag-only stage change | `pipeline-kanban.tsx` |
| **Undo** | Toast undo after a successful reversible move | Silent move; undo that fakes success when the server rejected | Sonner + move POST |
| **Keyboard shortcut** | `Cmd/Ctrl+K` command; Esc overlays; labeled icon buttons | Shortcut-only actions with no visible control | `command-palette.tsx`, topbar |
| **Command item** | 36px row; Navigate · Records · Create · Ask | Lucide-only island; dead `/home` href | `components/crm/command-palette.tsx` |
| **Ask Evo** | Contextual, secondary, capability-gated | First orange hero block; second AI product name | `ask-evo-panel.tsx` |
| **Create** | `?create=1` + `CreateDrawer`; one visible primary | Page Create + topbar Create both filled accent | `create-drawer.tsx` |
| **Link / back** | Explicit “Open full record” / `RecordBack` | History-trap peek | `record-chrome.tsx` `RecordBack` |

---

## ADOPT

| Pattern | From | Apply on EvoCRM |
|---|---|---|
| Keyboard OS | Linear + Slack | `Cmd/Ctrl+K`, Esc, focus return, visible Create/Ask in command — not tooltip-only |
| Filters | HubSpot + Airtable | Chips + Advanced drawer [edbed4a5](https://mobbin.com/screens/edbed4a5-0814-4c04-bf4e-c55dc948a900); URL query state via `list-query.ts` |
| Bulk | HubSpot | Sticky bar [fedf5525](https://mobbin.com/screens/fedf5525-727c-4f83-92d8-9ebc647363d4) once DataWorkspace owns selection |
| Errors | Stripe + Vercel | Inline field error + optional toast; destructive confirm; no color-only invalid |
| Density | Locked DS | Controls 36, rows 48, pad-x 32 / 16, rail 64/240 |
| Motion | Linear + DS | 150–200ms transform+opacity; `prefers-reduced-motion` |
| A11y | WAI-ARIA / WCAG | Named buttons, focus trap, contrast `#161616` on `#F7F7F5` / white; muted `#929292` for metadata only |

---

## REJECT

| Anti-pattern | Why |
|---|---|
| **Color-only status** | Fails WCAG; stale/won/lost/unread must be labeled |
| **Tooltip-only critical actions** | Activate workflow, send quote, delete, move stage need a named control or confirm |
| **Per-page primitives** | No third Button, no page-local Sheet that is not the DS Drawer, no new toast library |
| **Two icon families on one screen** | Lucide / Phosphor split is the principal consistency risk |
| **Two filled primaries** | Topbar Create + page Create both orange |
| **Drag-only boards** | Keyboard + menu required (see `pipeline-benchmark.md`) |
| **Client-only filter state** | Breaks share / refresh / back |
| **Marketing motion** | Marquees, mesh, glass on scrolling content |
| **Orange wash backgrounds** | Accent is CTA / selection / focus, not page paint |
| **HubSpot teal / Salesforce blue / Linear purple** | Pattern only; EvoCRM tokens stay |

---

## Overlay contract

Canonical overlays: `ds/components/{Drawer,Modal,Toast,EmptyState,Skeleton}`.  
`@/components/ui/sheet` and `dialog` are strangler re-exports. New work does not add a third path.

| Overlay | Esc | Focus return | URL |
|---|---|---|---|
| CreateDrawer | Yes | Create control / `?create=1` host | `?create=1` |
| AdvancedFilterDrawer | Yes | Advanced button | Apply writes list query |
| Quick Record Drawer (future) | Yes | Peek control / row | Additive `?record=` |
| Command palette | Yes | Search field | No (ephemeral) |
| Confirm modal | Yes | Trigger | No |

---

## Icon family (principal consistency risk)

| Surface | Today | Target |
|---|---|---|
| Sidebar / topbar / FilterBar / SavedViews | Phosphor | Phosphor |
| Command palette | Lucide | Phosphor |
| Record actions / Ask Evo / composer | Lucide | Phosphor |
| Setup wizard / several settings pages | Lucide | Phosphor |
| `app-header.tsx` | Lucide | **Deprecate** with the unused header layout |

Do not mix families on one screen. Do not restyle Phosphor to look like Lucide stroke icons.

---

## Responsive micro-UX

From `docs/visual-system/responsive-architecture.md`:

- Independent scroll regions; `h-app-workspace` uses `100dvh`
- `<lg` inbox / record: `AdaptiveWorkspaceShell` panel switcher, not a squeezed 4-pane
- 375: Sheet nav; do not clip Create
- Touch targets: 36px controls minimum; icon-only buttons labeled

---

## Out of scope

- Cloning Linear or Stripe visual identity
- Dark cabinet redesign
- Inventing numeric heuristic scores
- Per-page “just this once” primitives
