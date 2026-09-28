# EvoCRM global UI state inventory

States below are **patterns**. Per-screen occurrence is in each spec. Local crawl was a **populated** seed (companies, contacts, deals, quotes, outbound objects). Empty CRM lists were **not** produced (would require deleting seed data — skipped). Empty states are `[CONFIRMED-CODE]` via `empty-state`, `CrmListShell` `empty` prop, outbound empty copy.

| State | Where it occurs | Evidence |
|-------|-----------------|----------|
| DEFAULT / POPULATED | Home, CRM lists, outbound, settings, inbox | `[CONFIRMED-UI]` crawl 200s |
| EMPTY | DataWorkspace empty, EmptyState/aurora empty-state, empty-room, outbound empty | `[CONFIRMED-CODE]` |
| LOADING | Inertia visits; `loading` prop on CrmListShell; spinners | `[CONFIRMED-CODE]` |
| SKELETON | `ui/skeleton`, aurora skeleton | `[CONFIRMED-CODE]` not exercised in crawl |
| ERROR | Inertia error bags; 403/404 HTML; crmContextError on inbox | `[CONFIRMED-BOTH]` 403/404 crawl |
| PARTIAL ERROR | inbox `crmContextError`; import row errors | `[CONFIRMED-CODE]` |
| SEARCHING / SEARCH RESULTS / NO SEARCH RESULTS | Command OS remote search debounce; list `q=` | `[CONFIRMED-CODE]` list q not separately crawled |
| FILTERED / FILTERED EMPTY | list-query chrome filters + filter_groups | `[CONFIRMED-CODE]` |
| SORTED | `sort` + `direction` URL | `[CONFIRMED-CODE]` |
| SELECTED / MULTI-SELECTED / BULK ACTION | DataWorkspace selection; contact/deal bulk | `[CONFIRMED-CODE]` contacts/deals list props `bulk` |
| CREATING | `?create=1` drawers | `[CONFIRMED-UI]` same component, `createOpen` |
| EDITING | record inline fields, settings forms, sequence editor | `[CONFIRMED-CODE]` |
| SAVING | Inertia `processing` / SettingsSaveBar | `[CONFIRMED-CODE]` |
| SUCCESS | toasts (sonner), Fortify status, flash | `[CONFIRMED-CODE]` |
| VALIDATION ERROR | 422 Fortify login; Inertia `errors` | `[CONFIRMED-UI]` login 422 when body empty |
| DELETE CONFIRMATION / DELETING | dialogs (playbooks, people, mailboxes, workflows, quotes revoke) | `[CONFIRMED-CODE]` not all executed |
| ARCHIVED | not a first-class CRM archive flag in OBJECT_MODEL | `[UNKNOWN]` as product-wide archive |
| DISABLED / READ ONLY | quote sent/accepted immutable; Connect buttons when Meta env empty; member fields | `[CONFIRMED-CODE]` |
| PERMISSION DENIED | 403 SimpleMode and EnforceProductPermissions | `[CONFIRMED-UI]` tickets/ads/warmup/report-builder |
| OFFLINE | not implemented as a product mode | `[CONFIRMED-CODE]` no offline shell |
| PAGINATED / FIRST / LAST | paginator page, per_page, last_page | `[CONFIRMED-UI]` list props |
| BOARD / LIST | deals and tickets layout toggle | `[CONFIRMED-UI]` deals board 200 |
| MODAL / DRAWER / POPOVER OPEN | CreateDrawer, Dialog, Sheet, command palette, tasks, More menu | `[CONFIRMED-CODE]` |
| SIMPLE MODE | workspace flag; shrinks nav; 403 modules | `[CONFIRMED-BOTH]` |
| PASSWORD CONFIRM | security settings | `[CONFIRMED-UI]` 302 to confirm-password |
| EMBED FAILED | inbox embedState / embedReason | `[CONFIRMED-UI]` props present |
| 2FA | two_factor_confirmed_at null on seed owner | `[CONFIRMED-UI]` login `{two_factor:false}` |

## States not found

- Native offline banner
- Global HTTP error boundary page beyond Laravel errors
- Record “archive” as HubSpot-style lifecycle (deals use Won/Lost stages instead)
