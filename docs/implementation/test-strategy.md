# Test strategy (UX program)

Docs in this PR do not change application code. Every later Pxx must leave **Pest + types + lint** green in the same PR that changes strings those tests lock.

---

## 1. Commands

```bash
# Focused chrome locks (run on every UI phase)
php artisan test --filter=Wave0
php artisan test --filter=Wave1
php artisan test --filter=Wave2
php artisan test --filter=Wave3
php artisan test --filter=Wave4
php artisan test --filter=Wave5
php artisan test --filter=P03
php artisan test --filter=P04
php artisan test --filter=P05
php artisan test --filter=SimpleMode

# Domain contracts that UI must not break
php artisan test --filter=MoveDeal
php artisan test --filter=Quote
php artisan test --filter=LeadPath
php artisan test --filter=LeadConversion
php artisan test --filter=Inbox
php artisan test --filter=OAuthSetup
php artisan test --filter=FirstRun

npm run types:check
npm run lint:check
```

Update `toContain` hex/class/`data-*` assertions **in the same PR**. Do not leave red tests for a follow-up.

---

## 2. What each layer is for

| Layer | Lives in | Use for |
|---|---|---|
| Pest feature (HTTP / Inertia) | `tests/Feature/*` | Routes, props, permissions, chrome string locks |
| Pest unit | `tests/Unit/*` | Pure PHP (phones, wilaya) — rarely touched |
| TypeScript | `npm run types:check` | DS props, page props |
| Lint | `npm run lint:check` | Import rules |
| Manual / visual | PR checklist | Accent, density, focus, 375/768/1280 |
| A11y | PR checklist + later axe if added | Esc, focus return, contrast, keyboard board |

There is **no** Playwright/Cypress suite in this repo today. Do not add a browser runner in P01–P03. If one is added later, it belongs after P03 when DataWorkspace owns rows.

Existing chrome tests are often **source-string locks** (they `file_get_contents` TSX). That is brittle but is the house style (`P05DataWorkspaceTest`, `P04AppShellTest`, `P03SharedUiPrimitivesTest`). Match it; do not silently switch to RTL.

---

## 3. Per-phase test ownership

| Phase | Must stay green | Likely update | New lock (optional) |
|---|---|---|---|
| P00 | n/a (docs) | — | This file |
| P01 | P03 primitives, Wave0 icons | Any test that asserts `lucide-react` on a migrated file | Phosphor-only on listed chrome files |
| P02 | P04, Wave0, SimpleModeNav | Header/search / Tasks labels | `P02ActiveShellNormalizationTest`: Home `/dashboard`; leftover header unused |
| P03A–D | P05, Wave1, `P03ADataWorkspaceOwnershipTest`, `P03BDataWorkspaceSelectionTest` | P05/P03A adapter assertions when selection/rows move | P03B: workspace owns selection; contacts/deals consume it |
| P04 Contacts | Wave1, P05 | `data-crm="contacts-workspace"` | Selection + bulk via DS bar |
| P05 Companies | Wave1-style if present | Remove CrmShell lock if any | — |
| P06 Leads | Lead* feature tests | New chrome test for DataWorkspace on leads | Do not break `/crm/leads/{id}` |
| P07 Deals list | Wave2 | Layout toggle still present | Bulk still posts `/crm/deals/bulk` |
| P08 Quotes list | Wave4 | Hex leftovers | Create still needs a deal |
| P09–P10 Drawer | Show-page tests | Additive `?record=` | Esc / focus (manual + optional Pest see-source) |
| P11–P12 Board | MoveDeal, Wave2, StageRequired | Board `data-crm` | Keyboard + undo (feature if you add a hook) |
| P13–P14 Inbox | Wave3, InboxCsp | Native/embed flags | CSP headers untouched |
| P15 Activities | Activity composer tests | — | Complete / attendance POSTs |
| P16 Command | — | Home href already `/dashboard` (P02) | Sections exist |
| P17 Home | HomeCommandCenter, HomeQuota, Wave0 home | Widget class names | Attention above charts |
| P18 Quotes builder | QuoteAcceptance, QuoteDelivery, Wave4 | — | Public `/q/{token}` |
| P19–P20 Workflows | EvoCell2, workflow feature tests | — | Toggle / store / no canvas |
| P21–P22 Settings | Wave5, Settings/*, Connectors | Group labels | Permissions still 403 |
| P23 Activation | FirstRun, OAuthSetup, Home* | Additive home props | Wizard dismiss ≠ complete |
| P24 Ask Evo | EvoCell4, RecordInsight | — | Capability hide |
| P25–P27 | Wave6 empty/motion | motion CSS | `prefers-reduced-motion` |
| P28 | full Pest + types + lint | deleted-file tests | rg dead imports |
| P29 | same + visual QA | — | hex rg |

---

## 4. Compatibility checklist (every UI PR)

Copied from the historical plan; still mandatory:

- Same URL, same Inertia component name (unless the phase AC says otherwise — none should)
- Same POST/PATCH endpoints
- `?create=1` still opens create
- Saved views still round-trip `/crm/filters`
- Simple mode nav still works
- `auth.capabilities` still hide Import / Merge / Settings leaves

---

## 5. Visual / a11y / responsive QA (manual)

See each Pxx in the master plan. Floor:

- Accent only on one primary / selection / focus
- Canvas `#F7F7F5`, surface white, border `#E3E3DF`
- Controls 36, rows 48, desktop pad-x 32, rail 64/240
- 375 / 768 / 1280 / 1440
- Focus ring, Esc, no color-only status, keyboard alt for DnD (from P11)

---

## 6. What not to test in this program

- Rebuilding Pest into Jest/RTL as a side quest
- Screenshot diffs against HubSpot/Salesforce paint
- Load tests
- Changing Wave tests to allow `#0176D3` / `#00A4BD`
