# UX benchmark (reconstructed)

**Status:** Reconstructed 2026-09-14. Original file never existed on `main` or any searched branch.  
**Provenance:** Approved research summary (implementation-plan brief, audited Mohamedbeghanem/EvoCrm @ `a0b9a85`) + present locks (`docs/design-system.md`, `docs/evocrm-mobbin-contract.md`, `docs/ui-audit.md`) + code inspection of `main` @ `7d05ca7`.  
**Honesty:** Behavioral references only. No invented scores or Mobbin IDs.

---

## Product

EvoCRM is an all-in-one **sales OS** (CRM + Desk + Outbound + Ads). Stack as shipped:

| Layer | Version / path |
|---|---|
| Laravel | 13 (`composer.json` `^13.17`) |
| Inertia | Laravel 3 + React 3 |
| React | 19 |
| TypeScript | `resources/js/**` |
| Tailwind | 4 (`@tailwindcss/vite`) |

Authenticated product UI lives under `resources/js/pages/**` and is wrapped by `AppLayout` → `layouts/app/app-sidebar-layout.tsx`.

---

## Redesign method (locked)

**CONSOLIDATE → NORMALIZE → MIGRATE → IMPROVE → POLISH.**  
Not a rewrite. Not a HubSpot/Salesforce/Linear reskin.

Backend stays: Laravel controllers, Inertia prop contracts, permissions, models, route semantics, imports/exports/bulk, deal movement, workflow execution, quote lifecycle, Inbox/EvoDesk boundary, Ask Evo permissions, connectors.

EvoCRM tokens, typography, density, icons, and motion remain authority (`docs/design-system.md`). Mobbin/contract files are **pattern + density only**. Never import paint (no HubSpot teal, no Salesforce blue, no Linear purple).

---

## Behavioral references (never import paint)

| Surface | Reference pattern (behavior / density) | EvoCRM authority |
|---|---|---|
| Shell | Linear (grouped rail, command-first topbar) | 64 / 240 sidebar, `#E8530E` accent, Geist |
| Dashboard | Shopify + Stripe + HubSpot (attention first, not widget soup) | `pages/home.tsx`, `HomeDashboardBuilder` |
| DataWorkspace | HubSpot + Attio + Airtable (views, chips, advanced drawer, bulk) | `ds/workspace/*` |
| Records | HubSpot + Attio (full workspace + inspector) | `RecordShell` / `RecordPageFrame` |
| Pipeline | Pipedrive + HubSpot (one deal engine, stage + money) | `/crm/deals` + `/crm/deals/board` |
| Inbox | Intercom + Front + HubSpot (thread + CRM context) | Native `/inbox` + optional EvoDesk embed |
| Activities | Linear + Asana (work queue, not a dump) | `/crm/activities` |
| Automation | Shopify Flow + HubSpot + Zapier — **structured, not n8n canvas default** | `/crm/workflows` table + drawer |
| Quotes | Stripe + HubSpot / PandaDoc | Compact create drawer today; show page is the editor |
| Settings | Stripe + Vercel + Shopify + Linear (IA by scope) | `layouts/settings/layout.tsx` |
| Integrations | Shopify + Zapier (directory, not a dump of env vars) | `/settings/apps`, `/settings/connectors` |
| Command | Linear + Slack + Notion | `components/crm/command-palette.tsx` |
| Onboarding | Shopify + Linear + Stripe (activation, not wizard-dismiss) | `/settings/setup` + Home `GuidedActions` |
| AI | Contextual Intercom / HubSpot | Ask Evo on records; topbar AI currently opens the palette |
| Micro-UX | Linear + Stripe + WAI-ARIA / WCAG | `docs/design-system.md` Do/Don't |

Mobbin IDs already locked in-repo (do not add new ones here):

- HubSpot contacts saved views + chips — [2c2951a8](https://mobbin.com/screens/2c2951a8-ec56-41c0-a3e0-990330bdc5f4)
- HubSpot bulk bar — [fedf5525](https://mobbin.com/screens/fedf5525-727c-4f83-92d8-9ebc647363d4)
- HubSpot advanced filters — [edbed4a5](https://mobbin.com/screens/edbed4a5-0814-4c04-bf4e-c55dc948a900)
- HubSpot deals board density — [35b26dbf](https://mobbin.com/screens/35b26dbf-8d2b-4f6c-a789-738b02d927b1)
- HubSpot 3-pane contact — [f215a882](https://mobbin.com/screens/f215a882-8c79-4bf8-8483-4d8ae465c3c1)
- Salesforce path + composer — [6443cff9](https://mobbin.com/screens/6443cff9-7eab-42f5-b620-1af1a9385cc6)

---

## Foundations that already exist (do not rebuild)

Verified on `main` @ `7d05ca7`:

- **Shell:** 64/240 grouped rail — `app-sidebar.tsx`, `P04AppShellTest`
- **DataWorkspace suite:** `ds/workspace/{DataWorkspace,SavedViews,FilterBar,AdvancedFilterDrawer,DataTable,BulkActionBar}`
- **Adapter:** `CrmListShell` wraps DataWorkspace (chrome only; rows/selection stubbed)
- **Full records:** `RecordShell` / `RecordPageFrame` / Ask Evo rail on contact, company, deal, lead, quote, ticket show pages
- **Inbox:** native CRM inbox + optional EvoDesk iframe (`pages/desk/inbox.tsx`)
- **One deal engine in IA:** `/leads` redirects to `/crm/deals/board`; list is `/crm/deals`
- **Quotes, Workflows, Reports, Settings, setup wizard, command palette** all ship

---

## Top gaps (approved intent, confirmed in code)

1. **DataWorkspace is an adapter shell.** `CrmListShell` passes `rows={[]}` and `selectedIds={[]}`. Domain pages own `ListViewTable`, selection, and `components/crm/bulk-action-bar.tsx`.
2. **No universal Quick Record Drawer.** Create is `CreateDrawer`. Show is a full page. Nothing peeks a record from list/pipeline/inbox/activities/command.
3. **Lucide vs Phosphor.** `components.json` `"iconLibrary": "phosphor"` but ~34 files still import `lucide-react` (command palette, `record-chrome`, Ask Evo, setup wizard, leftover `app-header`).
4. **Parallel app-header.** `layouts/app/app-header-layout.tsx` + `app-header.tsx` are unused by `AppLayout`.
5. **Pipeline attention.** Board has `inactive_days` / `has_next_activity` / weighted footer; no keyboard move, no undo, no explicit next-activity line on every card.
6. **Home activation is not a durable checklist.** `GuidedActions` is server-driven and dismissible by emptiness; `/settings/setup` is a separate OAuth wizard.
7. **Settings IA is not scoped as approved.** Live groups: You / Workspace / Integrations / CRM / Admin. Target: Personal / Workspace / CRM / Communication / Automation / Integrations / Developer.
8. **Quote create is a compact drawer**, not a Stripe-style split builder. Show page is already the line-item editor.
9. **Command / Ask Evo are not unified.** Topbar AI opens the palette. Palette sections are Records + Navigate only (Lucide). Home nav item targets `/home` (no such authenticated route; dashboard is `/dashboard`).

---

## What this file is not

- Not a scorecard. `major-category-scorecard.md` is absent and must not be faked.
- Not permission to restyle EvoCRM to match a reference app's paint.
- Not an implementation ticket. Sequencing lives in `docs/implementation/MASTER-IMPLEMENTATION-PLAN.md`.
