# Sidebar

## 1. Screen Identity

Screen ID: `SCR-SHELL-002`
Product area: Shell
Route: Persistent left rail on every `AppLayout` page
Route name: NOT APPLICABLE
Frontend file: `resources/js/components/app-sidebar.tsx`
Primary component: `AppSidebar`
Layout: `Sidebar collapsible="icon"` inside `AppShell` / `SidebarProvider` (`data-cabinet="rail"`)
Authentication: Authenticated product pages only
Permissions: Rail does **not** hide items by `auth.capabilities`. Simple mode filters by shared `nav` ids.
Parent navigation: Application shell (`SCR-SHELL-001`)
Entry points: Always visible in the product shell
Exit points: Each `Link` is an Inertia visit; Settings sits in a footer section
Runtime HTTP (owner, simple_mode=true): Rail present on `/dashboard` 200 and all other 200 product pages. Shared `simpleMode: true`, `nav` length 5 (`home`, `contacts`, `deals`, `inbox`, `quotes`) with French labels (`Accueil` sampled). `[CONFIRMED-BOTH]`
Evidence: `resources/js/components/app-sidebar.tsx`, `app/Support/SimpleMode.php`, `resources/js/hooks/use-simple-mode.ts`, `Screen/_evidence/dashboard.json` (`nav._list: 5`, `simple_mode: true`).

## 2. Purpose

Primary wayfinding for the workspace: a 64px icon rail that expands to a 240px labeled list, plus a mobile sheet. Simple-mode workspaces get a short launch list; full-mode workspaces get grouped CRM/Communication/Sales/Automation plus a More flyout.

## 3. Current UX Summary

Local seed Evotechly is simple mode. `useSimpleMode()` reads `simpleMode` + `nav`. `allowedIds` is a `Set` of those five ids. `NAV_GROUPS` is filtered to items whose `id` is allowed. Resulting visible groups `[CONFIRMED-CODE]`:

- Home → Home (`/dashboard`)
- CRM → Contacts, Deals (Companies and Pipeline dropped)
- Communication → Inbox (Activities dropped)
- Sales → Quotes
- Automation group empty → omitted
- Extra SIMPLE_NAV leaves not already in groups: none (all five ids exist in `NAV_GROUPS`)
- More flyout: **hidden** (`showMore = !simpleMode`)
- Footer: Settings (`/settings`) always

Full mode (`simple_mode` false): all `NAV_GROUPS` items plus More (Leads, Tickets, Segments, Ads, Reports, Outbound). PHP `FULL_NAV` is **not** the rail source in full mode; it is only the shared `nav` prop.

## 4. Screen Anatomy

Top: `AppLogoIcon` size-7 + “EvoCrm” when labeled, otherwise `sr-only`.
Scrollable `nav aria-label="EvoCrm"` with grouped `ul`s. CRM group has `data-nav="crm-objects"`.
More: button `aria-haspopup="menu"` / `aria-expanded`; panel `#sidebar-more-panel` `role="menu"`. Collapsed More panel is `absolute left-[calc(100%+8px)] w-56`; labeled More is inline.
Footer `section`: Settings `RailLink`.
`CRM_RAIL_OBJECTS` is exported but **not rendered** by `AppSidebar` `[CONFIRMED-CODE]`.

## 5. Data Displayed

**SIMPLE_NAV** (`SimpleMode.php`) — used when `workspace.simple_mode` is true:

| id | label key | href |
| --- | --- | --- |
| home | Home | `/dashboard` |
| contacts | Contacts | `/crm/contacts` |
| deals | Deals | `/crm/deals` |
| inbox | Inbox | `/inbox` |
| quotes | Quotes | `/crm/quotes` |

Runtime labels are `__($item['label'])` → French `Accueil` etc.

**NAV_GROUPS** (client, full mode):

- home: Home `/dashboard` (`activePaths: ['/']`)
- CRM: Contacts, Companies, Deals (`excludePaths: ['/crm/deals/board']`), Pipeline `/crm/deals/board`
- Communication: Inbox (`activePaths` `/desk`, `/conversations`), Activities `/crm/activities`
- Sales: Quotes
- Automation: Workflows `/crm/workflows` (`activePaths: ['/automation']`)

**MORE_ITEMS** (full mode only): Leads, Tickets, Segments, Ads, Reports, Outbound.

**FULL_NAV** (PHP share, not the rail renderer): includes companies, leads, pipelines, tickets, ads, outbound-warmup, report-builder, sms. Warmup / report-builder / SMS never appear as rail leaves even in full UI.

Active state: `pathMatches` prefix match unless `exact`, with optional extra/exclude paths.

## 6. Primary Actions

Click a rail leaf → Inertia `Link` with `prefetch`. Mobile click also `toggleSidebar()` to close the sheet.

## 7. Secondary Actions

- Toggle More flyout; Escape / outside mousedown closes it (panel id is excluded from outside-click).
- Settings at the bottom.
- Logo is **not** a link in the sidebar (header collapsed state has a logo link to `/dashboard`).

## 8. Search

NOT PRESENT. Search lives in the topbar.

## 9. Filters

Simple-mode id filter only. No user-facing filter.

## 10. Sorting

Hard-coded group and item order. More items keep `MORE_ITEMS` array order (category field is unused in the panel UI).

## 11. Selection

Single current-path highlight (`aria-current="page"`, `data-active`, fill vs regular icon weight). More button uses `data-active` when open, not when a More destination is current `[CONFIRMED-CODE]`.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Prefetch on links. No async nav loading.

## 14. Forms

NOT PRESENT.

## 15. Overlays

More flyout is a nested menu, not a portal overlay. Mobile uses the sidebar `Sheet` (opaque 240px list) from `ui/sidebar.tsx`.

## 16. States

- `state === 'expanded' | 'collapsed'`
- `isMobile` + `openMobile`
- `simpleMode` true/false
- `moreOpen`
- Active vs hover (`bg-sidebar-accent` vs `hover:bg-sidebar-hover`)

## 17. Empty State

If every group filtered out, the nav list would only show extraLeaves + Settings. With current SIMPLE_NAV this does not happen. `[UNVERIFIED]` empty-nav UI.

## 18. Error Handling

404/403 happen after navigation (e.g. Tickets in simple mode is not in the rail; if visited, `EnforceSimpleMode` 403). More still contains Tickets/Ads in full mode; those URLs 403 when simple mode is on if a user had a stale bookmark.

## 19. Feedback

Tooltip on icon-only links (`side="right"`). Active item medium weight. No badge for inbox unread or task count on the rail.

## 20. Navigation Behavior

Inbox active also on `/desk` and `/conversations`. Deals list is inactive on `/crm/deals/board` so Pipeline can own that path. Home treats `/` as extra active path (but `/` redirects). Workflows also active under `/automation`. Settings uses prefix match so `/settings/profile` highlights Settings.

## 21. Entity Relationships

Rail points at list rooms, not records. No entity counts.

## 22. Business Rules

- Simple mode: `showMore` false; filter `NAV_GROUPS` by `nav` ids; map icons from `NAV_ICONS` with House fallback.
- `extraLeaves` only in simple mode for `nav` ids not in `NAV_GROUPS` and not `settings`. Current SIMPLE_NAV has no such ids, so this branch is unused.
- Settings is always shown, even if omitted from SIMPLE_NAV.
- Tickets in More is a full-mode destination; simple mode 403s `/crm/tickets*`.

## 23. Backend Dependencies

`SimpleMode::nav` / `enabled` via Inertia share. No dedicated sidebar endpoint.

## 24. Frontend Dependencies

Phosphor icons, `Sidebar`/`useSidebar`, Inertia `Link`, `useSimpleMode`, `t()`, tooltips.

## 25. Responsive Behavior

`[CONFIRMED-CODE]`: labeled when `isMobile || state === 'expanded'`. Collapsed icon row `h-12` centered; labeled row `h-9` with text. Mobile close on navigate. Keyboard shortcut `b` with Ctrl/Cmd toggles sidebar (primitive). `NOT VERIFIED` at specific viewports.

## 26. Accessibility Observations

**CONFIRMED:** `aria-label="EvoCrm"` on nav; `aria-current`; focus rings; icon-only tooltips; More `aria-expanded`/`aria-haspopup`; menu `role="menu"` / `menuitem`; sr-only brand when collapsed.

**LIKELY ISSUE:** collapsed More panel is `position:absolute` without focus trap; group labels disappear when collapsed so groups are indistinguishable; More does not mark the current More-destination page on the trigger.

**REQUIRES MANUAL TEST:** mobile sheet focus, VoiceOver on French labels.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| SIDE-001 | MEDIUM | Companies / Activities / Pipeline / Workflows disappear in simple mode with no “upgrade” hint | Users cannot discover those rooms from the rail | `allowedIds` filter + SIMPLE_NAV |
| SIDE-002 | MEDIUM | PHP `FULL_NAV` includes Warmup, Report builder, SMS; the rail never shows them | Shared `nav` is misleading for full mode | `SimpleMode::FULL_NAV` vs `NAV_GROUPS`/`MORE_ITEMS` |
| SIDE-003 | LOW | `CRM_RAIL_OBJECTS` exported, unused | Dead catalog | `export { CRM_RAIL_OBJECTS }` |
| SIDE-004 | LOW | More `category` never rendered | Flat list instead of grouped More | `MORE_ITEMS` map |
| SIDE-005 | OBSERVATION | Tickets sit in More, not CRM group, in full mode | Split CRM objects | `MORE_ITEMS` vs `CRM_LEAVES` |

## 28. Consistency Comparison

Settings inner nav is a text list with scopes, not icons. Command OS Navigate list is wider than the rail (includes Companies/Leads/Pipeline/Automation even in simple mode). Header collapsed logo is a Home link; sidebar logo is not.

## 29. Functional Preservation Contract

- Preserve SIMPLE_NAV five-item launch list when `simple_mode` is true.
- Preserve full-mode groups CRM / Communication / Sales / Automation + More items listed above.
- Preserve Settings footer and 64/240 collapse.
- Preserve active-path exceptions (deals vs board, inbox aliases, workflows/automation).
- Preserve prefetch links and mobile auto-close.
- Do not treat PHP `FULL_NAV` as the visual rail without an explicit product change.

## 30. Design Input Contract

Purpose: wayfinding.
Primary goal: one tap to Home, Contacts, Deals, Inbox, Quotes in simple mode; fuller IA in full mode.
Primary actions: go to a room; open More; open Settings.
Required information: current path, simpleMode, nav ids, labels.
Required components: logo, grouped links, More menu, Settings.
Required states: collapsed, expanded, mobile sheet, more open, active leaf.
Information priority: current room > primary objects > more > settings.
Must not remove: SIMPLE_NAV destinations; Settings; collapse behavior.

## 31. Open Questions / Unknowns

- `[UNKNOWN]` whether any other file imports `CRM_RAIL_OBJECTS` for a second rail.
- `[UNVERIFIED]` More flyout collision with the 64px collapsed rail on small laptop widths.
- Should full-mode rail consume `FULL_NAV` (warmup/SMS/report-builder) or stay on `NAV_GROUPS`?
