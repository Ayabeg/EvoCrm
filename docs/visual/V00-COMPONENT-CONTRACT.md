# V00 — Component visual contract

Target appearance for V01–V15. Behavior stays on the Aurora / `ds` primitive named in each row.

Paint changes. State machines stay.

---

## Buttons

| | |
|---|---|
| **Role** | One primary action per surface. Secondary and ghost support. Danger is destructive only. |
| **Visual hierarchy** | Primary filled accent + white label. Secondary surface + border. Ghost ink on transparent. Danger filled `#D92D20`. |
| **Size** | Height 36. Large CTA 40. Icon 36. No third product size. |
| **Spacing** | Padding 12–16 horizontal. Gap 8 to icon. |
| **Border** | Primary none. Secondary `#E3E3DF`. |
| **Radius** | 8 |
| **Typography** | Label 13 / 18 / 500 |
| **State** | Hover `#D74908` (primary). Pressed `scale(0.98)` 120ms. Focus P26 orange ring. Disabled 45% opacity. Loading spinner holds width. |
| **Aurora primitive** | `ui/aurora/button` via `ds/Button` |
| **Taste rule** | One accent CTA intent per surface. Text never wraps at 1440. Contrast AA. |

---

## Inputs

| | |
|---|---|
| **Role** | Enter a value. Label is never the placeholder. |
| **Visual hierarchy** | Label above. Control. Hint or error below. |
| **Size** | Height 36. |
| **Spacing** | Field stack gap 8. |
| **Border** | `#E3E3DF`. Focus / invalid uses border strong or danger. |
| **Radius** | 8 |
| **Typography** | Label 13/18/500. Value 14/20/400. Hint 12/16/400. |
| **State** | Default, hover, focus, error, warn, success, disabled, clearable. |
| **Aurora primitive** | `ui/aurora/input` via `ds/Input` |
| **Taste rule** | No placeholder-as-label. |

---

## Search

| | |
|---|---|
| **Role** | Filter a list, or open Command OS from the topbar. |
| **Visual hierarchy** | Leading MagnifyingGlass. Field. Optional ⌘K hint in muted 12. |
| **Size** | Height 36. Topbar may stay 36 even if chrome is 56. |
| **Spacing** | Sits in the filter band or topbar, not in its own card. |
| **Border** | Hairline. Topbar search may be pill. |
| **Radius** | 8 in toolbars. 999 only for the global topbar field. |
| **Typography** | 13 / 18 / 400 |
| **State** | Focus opens Command OS on the topbar (P16). List search updates list-query. |
| **Aurora primitive** | Input |
| **Taste rule** | One search intent per chrome. Do not ship two bells or two palettes. |

---

## Select

| | |
|---|---|
| **Role** | Choose one from a known set. |
| **Visual hierarchy** | Same as Input. |
| **Size** | Trigger 36. |
| **Spacing** | Menu 4 inset. Item 36. |
| **Border** | Hairline trigger. Menu uses elevation. |
| **Radius** | Trigger 8. Menu 10. |
| **Typography** | 13 / 18 / 400 |
| **State** | Open, disabled, placeholder. |
| **Aurora primitive** | `ui/aurora/select` via `ds/Select` |
| **Taste rule** | Menus elevate. Triggers do not. |

---

## Combobox

| | |
|---|---|
| **Role** | Typeahead choice when the set is large. |
| **Visual hierarchy** | Input + listbox. |
| **Size** | 36 trigger. |
| **Spacing** | Same as Select. |
| **Border** | Same as Input. |
| **Radius** | 8 / menu 10 |
| **Typography** | 13 / 18 / 400 |
| **State** | Empty query, results, no results, disabled. |
| **Aurora primitive** | Not a `ds` export yet. Do not invent a parallel. |
| **Taste rule** | **DEFER** until a screen cannot use Select + server filter. |

---

## Tabs

| | |
|---|---|
| **Role** | In-page mode, not app navigation. |
| **Visual hierarchy** | Line tabs for record / settings sections. Pills only for exclusive binary modes (list/board). |
| **Size** | Height 36. |
| **Spacing** | Gap 8. |
| **Border** | Line: 2px accent on active. Pill: hairline group. |
| **Radius** | Line 0. Pill group 8, item 6. |
| **Typography** | 13 / 18 / 500 |
| **State** | Active, hover, disabled. |
| **Aurora primitive** | `ui/aurora/tabs` |
| **Taste rule** | Tabs never duplicate the rail. |

---

## Badges

| | |
|---|---|
| **Role** | Status or a compact fact. Not a CTA. |
| **Visual hierarchy** | Neutral default. Success / warn / danger semantic. Accent rare. |
| **Size** | Height 20–22. |
| **Spacing** | Padding 8. |
| **Border** | Soft fill preferred over outline clutter. |
| **Radius** | 999 |
| **Typography** | 12 / 16 / 500 |
| **State** | Optional removable chip. |
| **Aurora primitive** | `ui/aurora/badge` via `ds/Badge` |
| **Taste rule** | Map shadcn `default` away from Aurora `cyan`. No orange badge sprawl. |

---

## Tables / Rows

| | |
|---|---|
| **Role** | Scan and open records. |
| **Visual hierarchy** | Identity first. Status. Owner. Money. Dates last. |
| **Size** | Row 48. Header 40. |
| **Spacing** | Cell padding 12–16. |
| **Border** | Bottom hairline only. No boxed table card. |
| **Radius** | 0 |
| **Typography** | Header 12–13 / 18 / 500 muted. Cell 13 / 18 / 400. Identity 13 / 18 / 500. |
| **State** | Hover subtle. Selected accent-soft + `aria-selected`. Peek affordance P26. |
| **Aurora primitive** | Product `ListDataTable` / `list-view-table` (not Aurora DataTable) |
| **Taste rule** | Do not install official Aurora DataTable. Do not hairline both top and bottom of every row. |

---

## Saved views

| | |
|---|---|
| **Role** | Named query. |
| **Visual hierarchy** | Text pills. One active. Overflow in a menu. |
| **Size** | Height 32–36. |
| **Spacing** | Gap 8. Lives with the filter band. |
| **Border** | Hairline. Active uses accent-soft, not a filled orange pill. |
| **Radius** | 999 |
| **Typography** | 13 / 18 / 500 |
| **State** | Active, hover, create, manage (settings-capable). |
| **Aurora primitive** | Button / Dropdown |
| **Taste rule** | Views are not a second nav. |

---

## Filter bars

| | |
|---|---|
| **Role** | Narrow the list without leaving the page. |
| **Visual hierarchy** | Search, 2–4 quick filters, chips, Advanced, columns. |
| **Size** | Controls 36. |
| **Spacing** | Band padding 12–16 vertical, 32 horizontal. Wraps (P25). |
| **Border** | One divider under the band. Not a card. |
| **Radius** | Controls 8. |
| **Typography** | 13 / 18 / 400 |
| **State** | Chips removable, named `Clear {label}`. |
| **Aurora primitive** | Input + Button + Drawer |
| **Taste rule** | Advanced stays a drawer. Do not inline a query builder on the page. |

---

## Cards

| | |
|---|---|
| **Role** | A real semantic group. |
| **Visual hierarchy** | Title 15/22/600. Body 14/20. |
| **Size** | Padding 20. |
| **Spacing** | Section gap 32. |
| **Border** | `#E3E3DF` or none if the background change is enough. |
| **Radius** | 10 |
| **Typography** | Card / Body / Meta |
| **State** | Interactive cards are buttons/links, not decorative hover lifts. |
| **Aurora primitive** | `ui/aurora/card` |
| **Taste rule** | No card-in-card. No shadow. If it is a table or a list, it is not a card. |

---

## KPI blocks

| | |
|---|---|
| **Role** | One number an operator checks. |
| **Visual hierarchy** | Value 28/34/650. Label 12/16 muted. Optional delta 13 secondary. |
| **Size** | Sit in a strip, not four boxed tiles. |
| **Spacing** | Gap 24–32. Padding 16–20. |
| **Border** | Dividers, not four cards. |
| **Radius** | 0 in a strip. |
| **Typography** | Page number + Meta label. Tabular nums. |
| **State** | Empty: em dash or 0, never a fake 99%. |
| **Aurora primitive** | Layout + type. Do not revive `stat-card` unless already imported. |
| **Taste rule** | Series 1 orange only for the one KPI that is the story. |

---

## Charts

| | |
|---|---|
| **Role** | Trend or mix. EvoViz only. |
| **Visual hierarchy** | Series 1 `#E8530E`. Grid `#E3E3DF`. Ink / mute for other series. |
| **Size** | Fill the band. No decorative legend cards. |
| **Spacing** | Plot padding 16. |
| **Border** | None |
| **Radius** | 0 |
| **Typography** | Axis 12 / 16 / 400 |
| **State** | Empty / loading skeletons matching the plot. |
| **Aurora primitive** | None (EvoViz) |
| **Taste rule** | No rainbow. No orange area flood. |

---

## Dropdowns / Popovers / Tooltips

| | |
|---|---|
| **Role** | Local floating UI. |
| **Visual hierarchy** | Surface + elevation. 36px rows. |
| **Size** | Min width from trigger. Max `100vw` minus inset (P25). |
| **Spacing** | 4 inset. |
| **Border** | Hairline |
| **Radius** | Menu 10. Tooltip 8. |
| **Typography** | 13 / 18 / 400 |
| **State** | Open 150ms opacity + small translate. |
| **Aurora primitive** | dropdown-menu, popover, tooltip |
| **Taste rule** | Elevation is allowed. Glow is not. |

---

## Dialogs / Sheets / Drawers

| | |
|---|---|
| **Role** | Dialog: blocking task. Sheet/Drawer: auxiliary workspace (QRD, filters, Ask Evo, mobile nav). |
| **Visual hierarchy** | Title 18/26/600. Body 14. Footer actions 36. |
| **Size** | Dialog sm–lg. Drawer 480 default, 560 filters. |
| **Spacing** | Dialog padding 24. Drawer header 16/20. |
| **Border** | Drawer: 0 radius, hairline on the open edge. |
| **Radius** | Dialog 12. Drawer 0. |
| **Typography** | Section / Body / Label |
| **State** | Esc, trap, named Close (P26). 180ms modal / 200ms drawer (P27). |
| **Aurora primitive** | dialog via `ds/Modal`; sheet via `ds/Drawer` |
| **Taste rule** | Drawers are rooms, not cards. |

---

## Toasts

| | |
|---|---|
| **Role** | Transient confirmation or failure. |
| **Visual hierarchy** | One line + optional action. |
| **Size** | Compact. |
| **Spacing** | 16 padding. |
| **Border** | Hairline |
| **Radius** | 10 |
| **Typography** | 13 / 18 / 400 |
| **State** | 150ms enter. |
| **Aurora primitive** | Sonner via `ds/Toast`. Do not mount Aurora toast. |
| **Taste rule** | Toasts are not errors for forms. Forms stay inline. |

---

## Empty states / Skeletons

| | |
|---|---|
| **Role** | Tell the operator how to populate, or hold layout while loading. |
| **Visual hierarchy** | Title 18. Body 14. One action. |
| **Size** | Page empty centered. Panel empty inline. |
| **Spacing** | 32 around page empty. |
| **Border** | None (retire dashed empty frames if they read as decoration). |
| **Radius** | — |
| **Typography** | Section + Body |
| **State** | `aria-busy` + `data-p27="loading"` on workspace skeletons. |
| **Aurora primitive** | EmptyState, Skeleton |
| **Taste rule** | Skeleton matches the final shape. No page-level spinner. |

---

## Command palette

| | |
|---|---|
| **Role** | Navigate, find records, create, Ask Evo. |
| **Visual hierarchy** | Search field. Grouped 36px rows. |
| **Size** | Modal measure, 180ms. |
| **Spacing** | 8 around groups. |
| **Border** | Elevation. |
| **Radius** | 12 |
| **Typography** | 13 / 18 / 400. Group 12 muted. |
| **State** | P16 sections. P26 trap + restore. |
| **Aurora primitive** | Product Command OS. Not the unused Aurora block. |
| **Taste rule** | One command surface. |

---

## Navigation

| | |
|---|---|
| **Role** | App wayfinding. |
| **Visual hierarchy** | Groups 12/16/500. Items 13/18/400. Active 13/18/500 on accent-soft. |
| **Size** | 64 collapsed / 240 expanded. Row 36 expanded / 48 collapsed. |
| **Spacing** | 8 group gap. |
| **Border** | Rail edge hairline only. |
| **Radius** | Active item 8. |
| **Typography** | See hierarchy. No 11px uppercase groups. |
| **State** | Collapse cookie. Simple mode leaf swap. |
| **Aurora primitive** | Product `AppSidebar` + shadcn sidebar + Aurora Sheet on mobile |
| **Taste rule** | Do not install official Aurora Sidebar. |

---

## Record headers / Property groups / Timeline items

| | |
|---|---|
| **Role** | Identify the record. Group facts. Show work over time. |
| **Visual hierarchy** | Name 20/26/600. Facts 13. Group label 12/16/500 (not 11 uppercase). Timeline identity 13, meta 12. |
| **Size** | Header pad 16–20. Fact row 32–36. Timeline row 48. |
| **Spacing** | Property grid label column ~120–140. |
| **Border** | Group divider, not a card per group. |
| **Radius** | 0 in the workspace. |
| **Typography** | Record title + Label + Table + Meta |
| **State** | Actions 36. Ask Evo is a panel, not a header badge. |
| **Aurora primitive** | RecordShell + Field + Avatar |
| **Taste rule** | Flatten. The 3-pane split is the signature, not inner cards. |
