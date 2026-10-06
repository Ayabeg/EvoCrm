# MASTER MIGRATION MAP — Wave 0 consolidation

**Wave:** 0 · **Agent:** consolidation (this document)  
**Branch:** `rebuild/w0-master-migration-map`  
**UX authority:** EvoCRM Product Layout Blueprint V1 (6 Oct 2026)  
**Contract authority:** this repository. Where the blueprint invents a route, prop, permission, filter, saved-view, status machine, or component API that the code does not have, **the existing contract wins**.  
**Product-code freeze:** this PR is documentation only. `resources/js`, `app/`, `routes/`, `database/`, `config/`, `tests/` are not touched here.

**How to read.** This map is the Wave 1 hand-off. It merges four Wave 0 baselines — [BASELINE-QA.md](./BASELINE-QA.md) (#285), [REPOSITORY-ARCHITECTURE.md](./REPOSITORY-ARCHITECTURE.md) (#288), [BLUEPRINT-IMPLEMENTATION-MATRIX.md](./BLUEPRINT-IMPLEMENTATION-MATRIX.md) (#287), [BEFORE-VISUAL-AUDIT.md](./BEFORE-VISUAL-AUDIT.md) (#286) — with Blueprint V1. Wave 1 implementers start at §4 (ownership) and §9 (sequence). Gate A is a **stop**: do not start Inbox / Deals / Records / Resource / Documents / Full Mode / Mobile / RTL / Dark page-body lanes until the frame is certified.

**Wave 0 sources on main**

| PR | Branch | Merge SHA | What it landed |
|---|---|---|---|
| [#285](https://github.com/Evotechly/EvoCrm/pull/285) | `rebuild/w0-qa-baseline` | `c3a6346c02b628ccc229f190f171758b7d63877d` | `BASELINE-QA.md` + `scripts/product-rebuild/qa-baseline.sh` |
| [#288](https://github.com/Evotechly/EvoCrm/pull/288) | `rebuild/w0-repo-architecture` | `0d3f6fc29e485dc991abbc8c924baf9b7ec2400d` | `REPOSITORY-ARCHITECTURE.md` |
| [#287](https://github.com/Evotechly/EvoCrm/pull/287) | `rebuild/w0-blueprint-matrix` | `a74972f0401ea384fd295a77989597606201da8e` | `BLUEPRINT-IMPLEMENTATION-MATRIX.md` |
| [#286](https://github.com/Evotechly/EvoCrm/pull/286) | `rebuild/w0-visual-baseline` | `0c6063438e1656908a0b707e60395b110c158a2c` | `artifacts/product-rebuild/00-baseline/**`, `BEFORE-VISUAL-AUDIT.md`, `scripts/product-rebuild/capture.mjs` |

**#286 extras (called out, allowed):** root `.gitignore` only — ignore `scripts/product-rebuild/node_modules` and un-ignore `artifacts/product-rebuild/**/screenshots`. Playwright lives in `scripts/product-rebuild/package.json` (`playwright ^1.56.1`) + lockfile, **not** root `package.json`. Required by `capture.mjs`. No product-code files.

---

## 1. Baseline facts

### 1.1 Git / worktree identity

| Fact | Value |
|---|---|
| Measurement branch / SHA (QA, architecture, matrix, visual) | `main` @ **`89eb45787c207a5550ef0eff60c44444efbc824d`** — `Merge pull request #284 from Evotechly/feat/hierarchical-crm-sidebar` |
| Worktree at measurement | Clean (`git status --porcelain` empty). Local `.env`, `vendor/`, `node_modules/`, `database/database.sqlite`, `public/build/` are gitignored. |
| This map’s parent `main` (after Wave 0 docs merged) | **`0c6063438e1656908a0b707e60395b110c158a2c`** — `Merge pull request #286 from Evotechly/rebuild/w0-visual-baseline` |
| Product code vs measurement | Unchanged. Wave 0 PRs added only `docs/product-rebuild/**`, `artifacts/product-rebuild/**`, `scripts/product-rebuild/**`, plus the #286 `.gitignore` lines above. |
| Live production SHA in Blueprint V1 | `2f19ece` (2 Oct deploy). Hierarchical nav and RecordShell re-export exist at `89eb4578` and are **not** in those live screenshots. |

**Classification:** Wave 1 starts from `89eb4578` product code + the four Wave 0 documents. Do not treat production `2f19ece` captures as the local baseline.

### 1.2 Pre-existing suite results (do not “fix” in Wave 1 unless a Wave owns the file)

Every failure is **PRE-EXISTING**. CI runs **Pest only** (`composer ci:check`). A green GitHub `ci` job can ship the TypeScript and ESLint errors.

| Command | Result | Counts | Classification |
|---|---|---|---|
| `npm run types:check` | FAIL (exit 2) | **3 errors / 0 warnings** | PRE-EXISTING |
| `npm test` (`vitest run`) | PASS (exit 0) | **26 files / 89 tests** | CURRENTLY GREEN |
| `npm run lint:check` | FAIL (exit 1) | **389 problems (386 errors, 3 warnings)** across 114 files | PRE-EXISTING |
| `npm run build` | PASS (exit 0) | 31.98s; chunk-size + ineffective-dynamic-import warnings | CURRENTLY GREEN |
| `composer ci:check` (`php artisan test`) | PASS (exit 0) | **1200 tests / 1199 passed / 1 skipped / 1 risky** / 33706 assertions | CURRENTLY GREEN |
| Headless Playwright (QA 12 routes + visual 103 frames) | PASS | **12/12 routes HTTP 200**; **0 console errors**; visual matrix 103/103 clean | CURRENTLY GREEN |

**TypeScript errors (verbatim):**

1. `resources/js/components/dashboard/dashboard-recent.tsx(53,33)` — `RecordLink` is passed `dir`; `RecordLink` does not accept `dir`.
2. `resources/js/evo/data/crm-list/tablecn.tsx(20,44)` — `@/evo/icons` has no `EyeSlash`.
3. `resources/js/evo/data/crm-list/tablecn.tsx(32,23)` — `@/lib/list-view-config` has no `sortableColumnIds`.

`tablecn.tsx` is **unimported** (PR #284 leftover). `tsc` still typechecks it. Wave 1 must not edit it (PROTECTED / LEAVE). Do not treat these three as Wave 1 regressions.

Pest skip: `GoldenCopyGuardTest` — Playwright missing at `/tmp/pw` (CI-normal). Risky: 1 (plus two no-effect `use InvalidArgumentException` warnings). Do not “fix” in Wave 0/1 docs work.

Rerun: `scripts/product-rebuild/qa-baseline.sh`.

### 1.3 Before-scores (local visual baseline, 1440 FR light, Full Mode)

**Mean: 4.2 / 10.** Product coherence: **3 / 10.**

| Axis | Score |
|---|---|
| Shell | 3 |
| Navigation | 5 |
| Workspace density | 3 |
| Lists | 6 |
| Records | 4 |
| Pipeline | 2 |
| Inbox | 5 |
| Documents | 4 |
| Mobile | 3 |
| RTL | 6 |
| Dark | 6 |
| Product coherence | **3** |

Chrome at 1440: **52px top bar** + **212px** dark sidebar on every page except Quotes (40px top strip, same 212 rail). Blueprint target: **no top bar**, sidebar **224 / 56** light cabinet, first kanban card ≤ 200 (goal ≈ 148).

### 1.4 Ten worst visual findings (local baseline)

1. **Deals board first card at y=843** (target ≤ 200 / ≈ 148). Deals list first row at y=767.
2. **Global 52px top bar** still mostly empty. Quotes secretly uses a 40px bar and drops Créer.
3. **Dark 212px sidebar always expanded**, including 768 and 1024. Target 224 / 56, light, collapsing to a rail.
4. **Two (sometimes three) orange primaries** on one screen: top-bar Créer + page create; quote **Save lines** + **Envoyer le devis**; lead **New** + **Mark Status as Complete**.
5. **Pipeline has 6 nested scrollers** and 41 overflowing children at 1440; the page and the board both scroll.
6. **Lead record is an English island** inside a French app.
7. **Inbox conversation is not the main surface**: four columns after a 212px rail; “Vous êtes à jour” while 8 conversations sit in the list.
8. **Settings is a height-capped modal** with a clipped 25-item nav and three WhatsApp entries.
9. **Mobile board is chrome-only** at 390×844 — KPI, attention, views, and four filters consume the first screen.
10. **Money and language drift:** `220 000 DA` beside Ask Evo `220000 DZD`; compact `2,3 M DA` on Accueil; “Sent” / “Save lines” / “Leads” in FR chrome.

Findings 1, 5, 6, 7, 8, 9, 10 are **later lanes**. Wave 1 (P0.1) owns the frame behind 2, 3, 4 (chrome oranges) and the scroll-owner half of 5 (`.aurora-page-shell`), not Deals KPI removal.

---

## 2. Route → archetype map

Four archetypes (Blueprint L1 / §26): **WORKSPACE** · **RECORD** · **CONVERSATION** · **DOCUMENT**. Public and Fortify auth stay outside the product shell.

**Current chrome (every App route):** `AppLayout` → `AppSidebarLayout` → `AppShell` (`--sidebar-width: 248px`) → `EvoShell` (212px rail) + **`AppSidebarHeader` (`.app-topbar`)** + `.aurora-page-shell.overflow-y-auto`. Settings nest `SettingsLayout` (Radix dialog) inside that tree.

**Target chrome (Wave 1):** same AppLayout tree, **no** `.app-topbar`, rail 224/56, page children wrapped in `WorkspaceFrame` + `WorkspaceHeader` (slots A–Q). Settings remain a modal in Wave 1 (P3.2 later); Frame still mounts a header on the Settings acceptance route.

Blueprint aliases that **do not exist:** `/crm/inbox`, `/crm/ads`, `/crm/agents`, `/crm/outbound/*`. Live paths below.

### 2.1 Every Inertia GET in `web.php` + `settings.php`

| Live path | Route name | Archetype | Current layout / header | Target frame |
|---|---|---|---|---|
| `/terms` | `legal.terms` | — Public | `PublicLayout` | Out of AppShell |
| `/privacy` | `legal.privacy` | — Public | `PublicLayout` | Out of AppShell |
| `/q/{token}` | `quotes.public.show` | — Public | `PublicLayout` | Out of AppShell |
| `/book/{slug}` | `meetings.public.show` | — Public | `PublicLayout` | Out of AppShell |
| `/book/{slug}/done` | `meetings.public.done` | — Public | `PublicLayout` | Out of AppShell |
| `/dashboard` | `dashboard` | **DOCUMENT** | App + inline greeting `<header>` in `home.tsx` (27px `Hello :name`) | WorkspaceFrame DOCUMENT (page scrolls; Row 1 only; Slot C = **Accueil**, not a greeting) |
| `/agents` | `agents.index` | **WORKSPACE** | App + `AgentsWorkspace`; rail **mode** `agents` | WorkspaceFrame WORKSPACE. Agents is a Full-mode nav item, not a rail mode |
| `/agents/chats` | `agents.chats.index` | **WORKSPACE** | same component | same |
| `/agents/chats/{chat}` | `agents.chats.show` | **WORKSPACE** | same | same |
| `/agents/bots` | `agents.bots.index` | **WORKSPACE** | same | same |
| `/agents/bots/new` | `agents.bots.create` | **WORKSPACE** | same | same |
| `/agents/bots/{bot}` | `agents.bots.show` | **WORKSPACE** | same | same |
| `/inbox` | `desk.inbox` | **CONVERSATION** | App + `DeskShell` title + `InboxWorkspace` (queue 220 + list + thread + context) | WorkspaceFrame CONVERSATION. Queue column is Inbox-lane, not Wave 1 |
| `/conversations` | `crm.conversations` | **WORKSPACE** | App + `DeskShell` | WorkspaceFrame WORKSPACE |
| `/reports` | `reports` | **DOCUMENT** | App + `ReportsShell` | WorkspaceFrame DOCUMENT |
| `/reports/{category}` | `reports.category` | **DOCUMENT** | same | same |
| `/crm/reports` | `crm.reports` | **DOCUMENT** | same | same |
| `/reports/funnels` | `reports.funnels` | **DOCUMENT** | App + `ReportsShell` | WorkspaceFrame DOCUMENT |
| `/crm/report-builder` | `crm.report-builder.index` | **DOCUMENT** | App + report-builder chrome | WorkspaceFrame DOCUMENT (Simple-mode 403) |
| `/crm/report-builder/cross-object` | `crm.report-builder.cross-object` | **DOCUMENT** | same | same |
| `/crm/report-builder/{id}/run` | `crm.report-builder.run` | **DOCUMENT** | same | same |
| `/crm/activities` | `crm.activities.index` | **WORKSPACE** | App + `CrmShell` / `RoomShell` | WorkspaceFrame WORKSPACE |
| `/crm/segments` | `crm.segments.index` | **WORKSPACE** | App + `CrmObjectHeader` | WorkspaceFrame WORKSPACE |
| `/crm/segments/{segment}` | `crm.segments.show` | **WORKSPACE** | App + `CrmObjectHeader` | WorkspaceFrame WORKSPACE (membership list, not a CRM record) |
| `/automation` | `automation` | **WORKSPACE** | App + `CrmShell` + in-page nav | WorkspaceFrame WORKSPACE |
| `/crm/workflows` | `crm.workflows.index` | **WORKSPACE** | same page | same |
| `/crm/quotes` | `crm.quotes.index` | **WORKSPACE** | App + `CrmListShell` → `DataWorkspace` → `PageHeader` (40px top bar, no global Créer) | WorkspaceFrame WORKSPACE · **Wave 1 acceptance** |
| `/crm/quotes/{quote}` | `crm.quotes.show` | **DOCUMENT** | App + `QuoteWorkspace` / `quote-split-builder` | WorkspaceFrame DOCUMENT |
| `/crm/companies` | `crm.companies.index` | **WORKSPACE** | App + `CrmListShell` → `PageHeader` | WorkspaceFrame WORKSPACE |
| `/crm/companies/{company}` | `crm.companies.show` | **RECORD** | App + `RecordPageFrame` / `RecordShell` | WorkspaceFrame RECORD · **Wave 1 acceptance** |
| `/crm/contacts` | `crm.contacts.index` | **WORKSPACE** | App + `CrmListShell` → `DataWorkspace` → `PageHeader` | WorkspaceFrame WORKSPACE · **Wave 1 acceptance** |
| `/crm/contacts/import` | `crm.contacts.import` | **DOCUMENT** | App + import wizard | WorkspaceFrame DOCUMENT |
| `/crm/contacts/import/{batch}` | `crm.contacts.import.show` | **DOCUMENT** | same | same |
| `/crm/contacts/duplicates` | `crm.contacts.merge.index` | **DOCUMENT** | App | WorkspaceFrame DOCUMENT |
| `/crm/contacts/merge/{a}/{b}` | `crm.contacts.merge.show` | **DOCUMENT** | App | WorkspaceFrame DOCUMENT |
| `/crm/contacts/{contact}` | `crm.contacts.show` | **RECORD** | App + `RecordPageFrame` / `RecordShell` | WorkspaceFrame RECORD · **Wave 1 acceptance** |
| `/crm/leads` | `crm.leads.index` | **WORKSPACE** | App + `CrmListShell` → `PageHeader` | WorkspaceFrame WORKSPACE |
| `/crm/leads/captures` | `crm.leads.captures` | **WORKSPACE** | App + `CrmObjectHeader` / `CrmShell` | WorkspaceFrame WORKSPACE |
| `/crm/leads/{lead}` | `crm.leads.show` | **RECORD** | App + `RecordPageFrame` / `RecordShell` (English path chrome) | WorkspaceFrame RECORD · **Wave 1 acceptance** |
| `/crm/deals/import` | `crm.deals.import` | **DOCUMENT** | App | WorkspaceFrame DOCUMENT |
| `/crm/deals/import/{batch}` | `crm.deals.import.show` | **DOCUMENT** | same | same |
| `/crm/deals` | `crm.deals.index` | **WORKSPACE** | App + `CrmListShell` → `PageHeader` + KPI/attention chrome | WorkspaceFrame WORKSPACE · **Wave 1 acceptance** (KPI removal is Deals lane) |
| `/crm/deals/board` | `crm.deals.board` | **WORKSPACE** | App + `CrmListShell` + `DealPipelineBoard` | WorkspaceFrame WORKSPACE · **Wave 1 acceptance** |
| `/crm/deals/{deal}` | `crm.deals.show` | **RECORD** | App + `RecordPageFrame` / `RecordShell`; stage = `<select>` + Déplacer | WorkspaceFrame RECORD (path row is Records lane) |
| `/crm/tickets` | `crm.tickets.index` | **WORKSPACE** | App + `CrmListShell` | WorkspaceFrame WORKSPACE (Simple-mode 403) |
| `/crm/tickets/board` | `crm.tickets.board` | **WORKSPACE** | App + `CrmObjectHeader` | WorkspaceFrame WORKSPACE |
| `/crm/tickets/{ticket}` | `crm.tickets.show` | **RECORD** | App + `RecordPageFrame` / `RecordShell` | WorkspaceFrame RECORD |
| `/crm/quick-record-drawer/harness` | `crm.quick-record-drawer.harness` | **DOCUMENT** | App — local/testing only | Dev only |
| `/ads` | `ads.index` | **DOCUMENT** | App + `evo/ads/shell.tsx` sub-nav | WorkspaceFrame DOCUMENT |
| `/ads/attribution` | `ads.attribution` | **DOCUMENT** | same | same |
| `/ads/audiences` | `ads.audiences` | **DOCUMENT** | same | same |
| `/ads/campaigns` | `ads.campaigns.index` | **DOCUMENT** | same | same |
| `/ads/ad-sets` | `ads.ad-sets.index` | **DOCUMENT** | same | same |
| `/ads/ads` | `ads.ads.index` | **DOCUMENT** | same | same |
| `/ads/campaigns/{id}` | `ads.campaigns.show` | **DOCUMENT** | same | same |
| `/outbound` | `outbound.index` | **DOCUMENT** | App + `OutboundShell` | WorkspaceFrame DOCUMENT |
| `/outbound/lists` | `outbound.lists.index` | **WORKSPACE** | App + `OutboundShell` | WorkspaceFrame WORKSPACE |
| `/outbound/mailboxes` | `outbound.mailboxes.index` | **DOCUMENT** | App + `OutboundShell` | WorkspaceFrame DOCUMENT |
| `/outbound/warmup` | `outbound.warmup.index` | **DOCUMENT** | same (Simple-mode 403) | same |
| `/outbound/domains` | `outbound.domains.index` | **DOCUMENT** | same | same |
| `/outbound/campaigns` | `outbound.campaigns.index` | **WORKSPACE** | same | WorkspaceFrame WORKSPACE |
| `/outbound/campaigns/{id}` | `outbound.campaigns.show` | **DOCUMENT** | same | WorkspaceFrame DOCUMENT |
| `/outbound/sequences` | `outbound.sequences.index` | **WORKSPACE** | same | WorkspaceFrame WORKSPACE |
| `/outbound/sequences/{id}` | `outbound.sequences.show` | **DOCUMENT** | same | WorkspaceFrame DOCUMENT |
| `/outbound/outbox` | `outbound.outbox.index` | **WORKSPACE** | same | WorkspaceFrame WORKSPACE |
| `/outbound/replies` | `outbound.replies.index` | **WORKSPACE** | same | WorkspaceFrame WORKSPACE |
| `/outbound/suppressions` | `outbound.suppressions.index` | **WORKSPACE** | same | WorkspaceFrame WORKSPACE |
| `/outbound/quiet-hours` | `outbound.quiet-hours.edit` | **DOCUMENT** | same | WorkspaceFrame DOCUMENT |
| `/outbound/templates` | `outbound.templates.index` | **WORKSPACE** | same | WorkspaceFrame WORKSPACE |
| `/outbound/templates/{id}` | `outbound.templates.show` | **DOCUMENT** | same | WorkspaceFrame DOCUMENT |
| `/settings` → `/settings/profile` | `profile.edit` | **DOCUMENT** | App + **SettingsLayout Radix modal** | WorkspaceFrame DOCUMENT **inside the existing dialog** · **Wave 1 acceptance**. Full-page conversion is PAGE-SET-01 (Full Mode), not Wave 1 |
| `/settings/apps` | `settings.apps` | **DOCUMENT** | App+Settings modal | same |
| `/settings/setup/{provider}` | `settings.setup.show` | **DOCUMENT** | App+Settings modal | same |
| `/settings/apps/meta` | `settings.apps.meta` | **DOCUMENT** | App+Settings modal | same |
| `/settings/connectors` | `settings.connectors` | **DOCUMENT** | App+Settings modal | same |
| `/settings/evolution` | `settings.evolution` | **DOCUMENT** | App+Settings modal | same |
| `/settings/whatsapp` | `settings.whatsapp` | **DOCUMENT** | App+Settings modal | same |
| `/settings/whatsapp-business` | `settings.whatsapp-business` | **DOCUMENT** | App+Settings modal | same |
| `/settings/meta` | `settings.meta` | **DOCUMENT** | App+Settings modal | same |
| `/settings/channels` | `settings.channels` | **DOCUMENT** | App+Settings modal | same |
| `/settings/attributes` | `settings.attributes` | **DOCUMENT** | App+Settings modal | same |
| `/settings/pipelines` | `settings.pipelines` | **DOCUMENT** | App+Settings modal | same |
| `/settings/permissions` | `settings.permissions` | **DOCUMENT** | App+Settings modal | same |
| `/settings/record-layouts` | `settings.record-layouts` | **DOCUMENT** | App+Settings modal | same |
| `/settings/security` | `security.edit` | **DOCUMENT** | App+Settings modal | same |
| `/settings/appearance` | `appearance.edit` | **DOCUMENT** | App+Settings modal | same |
| `/settings/meetings` | `settings.meetings` | **DOCUMENT** | App+Settings modal | same |
| `/settings/system-health` | `settings.system-health` | **DOCUMENT** | App+Settings modal | same |
| `/settings/audit` | `settings.audit` | **DOCUMENT** | App+Settings modal | same |
| `/settings/qualify` | `settings.qualify` | **DOCUMENT** | App+Settings modal | same |
| `/settings/playbooks` | `settings.playbooks` | **DOCUMENT** | App+Settings modal | same |
| `/settings/people` | `settings.people` | **DOCUMENT** | App+Settings modal | same |
| `/settings/sms` | `settings.sms` | **DOCUMENT** | App+Settings modal | same |
| `/settings/quotas` | `settings.quotas` | **DOCUMENT** | App+Settings modal | same |
| `/settings/workspace` | `settings.workspace` | **DOCUMENT** | App+Settings modal | same |
| `/settings/agent` | `settings.agent` | **DOCUMENT** | App+Settings modal | same |

**Counts (96 Inertia GET definitions):** WORKSPACE 29 · RECORD 5 · CONVERSATION 1 · DOCUMENT 56 · Public 5. Fortify `auth/*` use `AuthLayout` and are out of Wave 1. No Inertia `errors/*` pages exist (ARCH-08 / P0.2).

**Orphan (not routed):** `resources/js/pages/leads/board.tsx` — `/leads` redirects to `/crm/deals/board`. LEAVE.

### 2.2 Wave 1 acceptance routes (Frame Agent page-level mounting)

| Route | Path | Mount path | What Frame may change | What Frame must not change |
|---|---|---|---|---|
| Contacts | `/crm/contacts` | `PageHeader` adapter inside DataWorkspace | Title/count/primary → WorkspaceHeader slots C/D/H | DataWorkspace props, SavedViews, FilterBuilder, list-query |
| Deals List | `/crm/deals` | same | Header slots only | KPI strip, attention queue, ForecastBar (Deals lane) |
| Deals Board | `/crm/deals/board` | `CrmListShell` header + Frame scroll | Header slots + scroll owner | Pipeline / DnD / board body |
| Contact Record | `/crm/contacts/{id}` | page wrapper / `crm-object-header` / Record header slot | WorkspaceHeader Row 1 around existing RecordShell | RecordWorkspace `left/center/right` API |
| Company Record | `/crm/companies/{id}` | same | same | same |
| Lead Record | `/crm/leads/{id}` | same | same | English path body is Records/i18n later |
| Inbox | `/inbox` | `DeskShell` title → WorkspaceHeader | Title + Frame scroll | `InboxWorkspace` queues/composer/thread |
| Quotes | `/crm/quotes` | `PageHeader` adapter | Header slots | Quote constrain / statuses |
| Dashboard / Accueil | `/dashboard` | `home.tsx` greeting `<header>` → Slot C | Title becomes **Accueil**; Row 1 sticky | KPI tiles, pipeline viz, greeting-as-body, Objectifs |
| Settings | `/settings/profile` | header inside existing dialog | Slot C title; do not convert Dialog → page | `settings-layout.tsx` modal IA, destinations |

---

## 3. Blueprint requirement → files → owning wave / agent

Priority buckets match the matrix (94 rows). Wave 1 = **P0.1 frame only**.

### 3.1 P0.1 FRAME — expanded file-level checklist

Implement **in this order**. Shell Agent goes first. Frame Agent lands new files (passthrough OK), then Shell mounts Frame and deletes the top bar, then Frame fills slots on the 10 acceptance routes.

#### Step 0 — Tokens (DEN-02, COL-01, COL-02, LAW-13) · **Shell Agent**

File: `resources/js/evo/tokens/evo.css` only (the only legal `--evo-*` declarer).

| Task | Token | Value / note |
|---|---|---|
| Keep hexes | `--evo-primary` `#EC6025`, `--evo-teal` `#0F4C5C`, `--evo-canvas` `#F7F8F5`, `--evo-ink` `#0D1B24`, `--evo-hairline` `#E6E8E3`, `--evo-success/warning/danger` PR1 | Do not change ([C-10](#c-10), [C-11](#c-11)) |
| Add | `--evo-sidebar` | `#F0F2EE` |
| Add | `--evo-sidebar-hover` | `#E8EBE6` |
| Change | `--evo-rail` | `212px` → **`224px`** |
| Add | `--evo-rail-collapsed` | **`56px`** (today collapse = 0) |
| Add density | `--evo-row-comfortable` `40px`, `--evo-row-touch` `44px` | Keep compact 32 / standard 36 ([C-15](#c-15)) |
| Controls | add 28/32/36 aliases | Do **not** silently retarget `--evo-control-standard` (today 36) |
| Add | `--gutter` | `clamp(16px, calc(1.25vw + 6px), 24px)` |
| Declare (consume later) | `--fiche-w` 340, `--peek-w` clamp, `--context-w` 360, `--inbox-list-w` 340 | |
| Frame heights | Frame Agent writes `--workspace-header-1/2/3` = 48/40/36 in **workspace-frame CSS**, not in `evo.css` | Handshake: if a height must be `--evo-*`, Shell is the only `evo.css` writer |

**Also Shell (leftover width systems):** align or neutralize `resources/js/components/app-shell.tsx` `--sidebar-width: 248px`; do not let `resources/js/components/ui/sidebar.tsx` 240/64 become the desktop rail; stop new chrome rules in `resources/css/approved-v02.css` (52px `.app-topbar`, 248 offsets). Deleting `approved-v02.css` in Wave 1 is high-risk — neutralize conflicting width/height only.

#### Step 1 — Light sidebar 224 / 56 (SHELL-01, SHELL-14, LAW-02) · **Shell Agent**

| File | Task |
|---|---|
| `resources/css/evo-shell.css` | Stop `.evo-cabinet` + `color-scheme: dark` on the rail in **light** mode. `.evo-rail-slot` width 224 expanded / 56 collapsed (not 0). Hairline at inline-end. Replace hardcoded `212px` / `calc(100% - 212px)`. |
| `resources/js/components/shell/evo-shell.tsx` | Collapse = 56px icon rail. Default expanded ≥1280; rail at ≤1023. Persist via one cookie (see §7). Inbox 1600 rail-force is a **class/prop hook only** — Inbox lane consumes it later. |
| `resources/js/components/shell/evo-rail.tsx` | Light cabinet `#F0F2EE`, ink text, 20px orange logo (SHELL-17). Honour persisted collapse on first paint. |
| `resources/js/components/app-shell.tsx` | Drop or align 248px `--sidebar-width`. |

#### Step 2 — Delete the global top bar (SHELL-02, REM-01) · **Shell Agent**

| File | Task |
|---|---|
| `resources/js/layouts/app/app-sidebar-layout.tsx` | Remove `<AppSidebarHeader />`. After Frame files exist, mount `<WorkspaceFrame>{children}</WorkspaceFrame>` at the **single agreed mount point** (Frame Agent owns that one line; Shell owns the rest of the file). Remove `.aurora-page-shell.overflow-y-auto` as the page scroller (hand scroll to Frame). |
| `resources/js/components/app-sidebar-header.tsx` | Unmount from the tree. Migrate Create / Theme / Ask Evo / Bell into the rail (Step 3). Do not leave an empty 52px strip. |
| `resources/css/approved-v02.css` | Neutralize `.app-topbar` 52px / 248 offsets so they cannot resurrect a strip. |

#### Step 3 — Chrome homes (SHELL-03…07, SHELL-13, SHELL-15) · **Shell Agent**

| Control | New home | Files | Contract to keep |
|---|---|---|---|
| Search | Sidebar header “Rechercher… ⌘K” 32px → existing cmdk, size **640** | `evo-rail.tsx`; `evo-shell.tsx` (palette host); `evo/shell/mode-switch.tsx` (retire Search **mode**); placement only on `evo/patterns/command-palette/index.tsx` | `command-os.ts` actions; `/crm/command/search` |
| Créer | Sidebar header **neutral** “+” 32px, shortcut `C` | `evo-rail.tsx` (move menu from `app-sidebar-header.tsx`) | Existing `?create=1` URLs. **Omit Tâche** ([GAP-14](#gap-14)) |
| Bell | Sidebar footer next to avatar; badge = `evoOpenTaskCount`; panel = `TasksOverlay` 400px; `G N` | `evo-rail.tsx`; keep `components/crm/tasks-overlay.tsx` | Not a notifications API ([GAP-01](#gap-01)) |
| Theme | User menu → Apparence Clair / Sombre / Système | `components/user-menu-content.tsx`; reuse `hooks/use-appearance.tsx` | Cookie + localStorage |
| Ask Evo | Hide top-bar sparkle. `⌘J` opens existing drawer (Full Mode only) | `app-layout.tsx` keeps `AskEvoDrawer`; `lib/ask-evo.ts` unchanged | **Do not enable in Simple Mode** ([C-07](#c-07)) |
| Account | Footer user row 44 | `evo-rail.tsx` + `user-menu-content.tsx` | Settings + Log out stay; add Apparence + Langue |
| Paramètres | Footer row 32 (flatten expandable settings group) | `evo-rail.tsx` | `/settings/*` hrefs unchanged |
| Shortcuts | `G A/C/D/I/V/P/G/N`, `⌘\`, `C`, `⌘K`, `/`, `?`, `⌘J` | `evo-shell.tsx` (shell keymap). `/` focuses Frame Slot M | Do not steal keys from focused inputs |

#### Step 4 — Nav rows + Simple membership (SHELL-10, SHELL-16) · **Shell Agent**

| File | Allowed | Forbidden |
|---|---|---|
| `evo-rail.tsx` | 32px rows; teal 8% + inset **inline-start** bar (not `border-left`); sentence-case group labels; no ALL CAPS | Changing hrefs, ids, capability filters |
| `product-nav.ts` | **Presentation only:** label casing / visual order of items that already exist | Membership, `SIMPLE_NAV`, capabilities, feature gates, new hrefs — except a documented Full-mode **Agents** additive if the pill is retired (risk §7.4). Coordinate; do not rewrite the tree |
| `app/Support/SimpleMode.php` | **Nobody in Wave 1** | [C-02](#c-02) is OPEN. Do not drop Leads / Companies / Activities |

#### Step 5 — WorkspaceHeader 48 / 40 / 36 (LAW-03, HDR-01, HDR-04, HDR-07) · **Workspace Frame Agent**

| File | Task |
|---|---|
| **NEW** `resources/js/evo/workspace/WorkspaceFrame.tsx` | Header slot + `flex-1 min-h-0` scroll owner. DOCUMENT vs WORKSPACE/RECORD/CONVERSATION scroll variants |
| **NEW** `resources/js/evo/workspace/WorkspaceHeader.tsx` | Row 1 TitleBar 48 always; Row 2 ViewBar 40 on Workspace & Conversation; Row 3 ChipBar **or** BulkBar 36 exclusive. Slots A–Q |
| **NEW** `resources/js/evo/workspace/types.ts` | The **only** shared type both agents import (`archetype`, `title`, `primary`, …) |
| **NEW** workspace-frame CSS | 48/40/36, gutters, chip canvas. **Not** rail widths |
| `resources/js/ds/chrome/PageHeader.tsx` | Thin adapter → WorkspaceHeader so DataWorkspace lists pick up the grammar without editing DataWorkspace props |
| `resources/js/evo/patterns/page-header/index.tsx` | Re-export only |
| `resources/js/components/crm/crm-object-header.tsx` | Adapter for non-DataWorkspace object pages |
| 10 acceptance pages (mount only) | See §2.2. Accueil Slot C = “Accueil”. Contacts H = one orange “+ Nouveau contact” |

#### Step 6 — One scroll owner (LAW-05) · **split**

| Owner | File | Task |
|---|---|---|
| **Shell** | `app-sidebar-layout.tsx` | Stop `.aurora-page-shell { overflow-y-auto }` as the global scroller |
| **Frame** | `WorkspaceFrame.tsx` | Workspace/Record/Conversation: `document.scrollingElement.scrollHeight === innerHeight`. Accueil + Settings remain document scrollers. Header-level sticky ownership lives here |

#### Step 7 — Density + type (LAW-13, DEN-01, DEN-03, A11Y-02) · **Shell tokens + Frame chrome**

Shell declares comfortable 40 / touch 44 in `evo.css`. Frame consumes them on header/list chrome. **Do not edit** `evo/data/data-grid/index.tsx` in Wave 1 (PROTECTED). Density switcher wiring on DataGrid is Resource/later unless it is token-only CSS.

#### Step 8 — Colour discipline + a11y chrome (LAW-04, COL-01, A11Y-01, PRES-01)

Orange fills per view ≤ 1 + 20px logo. Global “+” is neutral. `?` shortcut sheet. Pipeline announcements file is **PROTECTED** — do not edit. After the frame: Pest filters in §8 must stay green.

#### P0.1 out of scope (do not pull into Wave 1)

Inbox queue flyout (SHELL-11–12), peek (LAW-08), settings-as-page (LAW-09), send confirms (LAW-10), French/DZD sweep (LAW-11), logical CSS sweep (LAW-12), empty/error trio (LAW-14), bottom tab bar (RESP-05 — Shell may stub mobile sheet only), RTL isolate (RTL-01), dark §31 hex swap (DARK-01), Deals KPI removal (REM-02), quote PDF (TRUST-04).

### 3.2 Remaining requirements (compact)

| IDs | Wave / lane | Primary files | Owner when that wave starts |
|---|---|---|---|
| LAW-06, LAW-07, ARCH-04, PAGE-DEAL-01, REM-02 | **Deals** | `pages/crm/deals/board.tsx`, `deal-forecast-bar.tsx`, `deal-attention-queue.tsx` | Deals agent. Keep `needs_attention` contract |
| LAW-08, HDR-05/08/09, ARCH-02, PAGE-CON-01, PAGE-QR-01 | **Resource** | `QuickRecordDrawer.tsx`, `DataWorkspace.tsx`, `SavedViews.tsx`, `FilterBar.tsx` | Resource agent. Wave 1: **nobody** |
| LAW-09, SHELL-08, HDR-06/10, ARCH-01, PAGE-HOME-*, PAGE-ADS-01, PAGE-SET-01, PAGE-AUT-01, PAGE-AGT-01, PAGE-OUT-01 | **Full Mode** | `settings-layout.tsx`, `home.tsx`, ads/outbound/agents shells | Later. Wave 1 Shell may add a Full-mode Agents **row** so retiring the pill does not strand `/agents` |
| LAW-10, ARCH-07, TRUST-04, PAGE-QTE-* | **Documents** | `QuoteWorkspace.tsx`, `QuoteDocument.php` | Later |
| LAW-11, LAW-14, ARCH-08, TRUST-01…03,05,06 | **P0.2 trust** | `format.ts` call sites, i18n hydrate, error pages | Later |
| LAW-12, RTL-01 | **RTL** | `evo/**` physical CSS | Later; Wave 1 rail must still be logical `start`/`end` |
| LAW-15, HDR-02, RESP-04/05, PAGE-DEAL-02 | **Mobile** | `evo-shell.tsx`, tab bar (does not exist) | Shell owns the **shell** mobile surface; board-as-list is Deals/Mobile |
| SHELL-11, SHELL-12, ARCH-06, PAGE-INB-*, REM-03 | **Inbox** | `InboxWorkspace.tsx`, `product-nav.ts` children, `InboxController` | Later. No fake Équipe/Support queues |
| HDR-03, ARCH-03/05, PAGE-REC-01, PAGE-DEAL-03, REM-04 | **Records** | `RecordWorkspace.tsx`, `RecordPath.tsx` | Later. Keep slot props |
| DARK-01 | **Dark** | `evo.css` `.dark` | Later. Light mode must already detach `.evo-cabinet` |

---

## 4. Exclusive ownership — Wave 1

Two agents. **They never edit the same primitive.** Shared files are listed with a single writer. Handshake types live in `evo/workspace/types.ts` (Frame writes; Shell imports).

### 4.1 Shell Agent (05) — exclusive

| File | Allowed work |
|---|---|
| `resources/js/layouts/app-layout.tsx` | Keep QuickRecord / AskEvo drawers. Do not add WorkspaceHeader |
| `resources/js/layouts/app/app-sidebar-layout.tsx` | Everything **except** the single `WorkspaceFrame` mount point. Remove `AppSidebarHeader`. Remove page-shell overflow scroller. Do not implement header slots |
| `resources/js/components/app-shell.tsx` | Align/drop 248px `--sidebar-width`; keep `SidebarProvider` only if mobile still needs it |
| `resources/js/components/shell/evo-shell.tsx` | 224/56 geometry, persist collapse, Inbox rail-force **hook**, CommandPalette **host**, mobile sheet |
| `resources/css/evo-shell.css` | Rail/workspace widths 224/56. No header-row rules |
| `resources/js/components/shell/evo-rail.tsx` | Light cabinet, search field + neutral “+”, footer bell + user, retire mode pill, render `visibleSections()` |
| `resources/js/components/shell/product-nav.ts` | **Presentation only** (label casing / visual order). **NOT** membership, capabilities, feature gates, Simple Mode ids |
| `resources/js/evo/shell/mode-switch.tsx` | Retire from the rail |
| `resources/js/components/app-sidebar-header.tsx` | Unmount; migrate Create / Theme / Ask Evo / Bell |
| `resources/js/evo/tokens/evo.css` | `--evo-rail`, `--evo-rail-collapsed`, sidebar surface, **all shell/density tokens** listed in Step 0. Not header 48/40/36 (those are workspace-frame CSS) |
| `resources/css/approved-v02.css` | Neutralize leftover **52 / 248** chrome width/height that fights the new rail |
| `resources/js/components/ui/sidebar.tsx` | Mobile sheet only. Do not reintroduce 240/64 as the desktop rail |
| Mobile nav | Offcanvas / future tab-bar **shell** surface |
| Command palette **placement** | Host + size 640 + sidebar field that opens it. Do not rewrite catalog |
| Notification / tasks bell + user menu / theme | Footer bell → `TasksOverlay`; `user-menu-content.tsx` Apparence / Langue |

### 4.2 Workspace Frame Agent (06) — exclusive

| File | Allowed work |
|---|---|
| **NEW** `resources/js/evo/workspace/WorkspaceFrame.tsx` | Header slot + single workspace scroll owner |
| **NEW** `resources/js/evo/workspace/WorkspaceHeader.tsx` | Slots A–Q; 48 / 40 / 36 |
| **NEW** `resources/js/evo/workspace/types.ts` | Shared props |
| **NEW** workspace-frame CSS | Header heights, gutters — **not** rail widths |
| `resources/js/ds/chrome/PageHeader.tsx` | Adapter → WorkspaceHeader |
| `resources/js/evo/patterns/page-header/index.tsx` | Re-export |
| `resources/js/components/crm/crm-object-header.tsx` | Adapter for non-DataWorkspace pages |
| `app-sidebar-layout.tsx` **one line** | The `WorkspaceFrame` mount point only |
| 10 acceptance routes (mount) | Contacts, Deals List, Deals Board, Contact / Company / Lead Record, Inbox, Quotes, Dashboard/Accueil, Settings — **header mount + title/primary wiring only** |
| Header-level scroll ownership | Sticky Row 1; DOCUMENT page scroll vs WORKSPACE regional scroll |

### 4.3 Shared files — who may touch them

| File | Who may touch | Who must not |
|---|---|---|
| `app-sidebar-layout.tsx` | Shell (file) + Frame (**mount line only**) | Anyone else |
| `evo/workspace/types.ts` | Frame writes; Shell **imports only** | Shell must not edit |
| `evo.css` | **Shell only** | Frame sends a one-line patch request if an `--evo-*` header token is required |
| `product-nav.ts` | Shell presentation only; Agents additive only if pill retirement requires it | Frame; membership edits |
| `user-menu-content.tsx` | Shell | Frame |
| `command-palette/index.tsx` | Shell **placement/size** only | Frame; catalog/actions |
| `use-appearance.tsx` | Shell, only if user-menu needs a small API | Frame |
| `tasks-overlay.tsx` | Nobody (keep). Shell moves the **trigger** | Frame |
| `ask-evo-drawer.tsx` / `lib/ask-evo.ts` | Nobody (keep). Shell hides the sparkle | Frame |
| `approved-v02.css` | Shell, width/height neutralization only | Frame |
| `ui/sidebar.tsx` | Shell, mobile only | Frame |

### 4.4 Nobody in Wave 1

Do **not** touch:

`DataWorkspace` · `DataGrid` · `tablecn.tsx` · `FilterBuilder` / `evo/data/filters` · `SavedViews` · `RecordWorkspace` / `RecordShell` / `RecordPageFrame` · `QuickRecord*` / peek adapters · Pipeline + DnD (`evo/crm/pipeline/*`) · Inbox Desk / `InboxWorkspace` / `Composer` · Quotes logic (`QuoteController`, `QuoteWorkspace` body, `QuoteDocument`) · `lib/list-query/*` · `crm-list-shell.tsx` props/API · `settings-layout.tsx` (modal stays) · `SimpleMode.php` · page **bodies** (Accueil modules, Deals KPI/attention, Inbox queues, record 3-pane, quote PDF).

---

## 5. Conflict register

Resolution default: **business contract wins**. Visual intent is implemented without inventing or breaking contracts.

| ID | Blueprint says | Contract (wins) | Resolution |
|---|---|---|---|
| <a id="c-01"></a>**C-01** | Paths like `/crm/inbox`, `/crm/ads`. §26 | Live URLs: `/inbox`, `/desk`, `/conversations`, `/ads`, `/outbound`, `/agents`, `/reports`, `/crm/report-builder`, `/dashboard` | **Business contract wins.** Use live hrefs. Do not add alias routes. |
| <a id="c-02"></a>**C-02** | Simple nav = Accueil · Contacts · Deals · Inbox · Devis + Paramètres. §10.2, §33.2 | `SimpleMode::SIMPLE_NAV` = Home, Inbox, **Leads, Contacts, Companies, Deals, Quotes, Activities** | **OPEN product-owner decision — unresolved.** Simple Mode currently keeps Leads / Companies / Activities. The product owner's stated Simple Mode nav is Accueil, Contacts, Deals, Inbox, Devis + Paramètres at the bottom. **Do not change Simple Mode membership in Wave 1.** Do not drop Leads / Companies / Activities. Do not implement the owner list until the founder writes the decision. Relabel/reorder of **existing** items is allowed as presentation. |
| <a id="c-03"></a>**C-03** | Deal board shown with three named stages + Gagné/Perdu drop bar. §17 | Stages come from the workspace pipeline. Won/lost are real stages | **Business contract wins.** Render pipeline JSON. Drop targets = existing won/lost stages only. |
| <a id="c-04"></a>**C-04** | Inbox assignment on the **thread**. §19 | `Thread` has no assignee. Folders filter `contact.owner_id` | **Business contract wins.** Assignment UI binds to contact owner. No `threads.assignee_id`. |
| <a id="c-05"></a>**C-05** | Channels are not queues. §19 I1 | `normalizedFolder` accepts channel keys and counts them | **Business contract wins.** Stop *presenting* channel keys as sidebar queues. Keep `?folder=` values as ChannelFilter. |
| <a id="c-06"></a>**C-06** | Hide the Inbox CSP / Reverb / “dev” banner. §5, §19 I9 | `InboxStatusBanner` is a real Desk embed / CSP probe | **Business contract wins.** Replace copy with a live/polling dot. Do not remove the probe or embed path. |
| <a id="c-07"></a>**C-07** | Ask Evo is chrome (`⌘J`) for product users. §10.3 | `ask_evo` is false in Simple Mode; routes 404 | **Business contract wins.** Relocate the trigger. **Do not enable Ask Evo in Simple Mode.** |
| <a id="c-08"></a>**C-08** | Accueil = 5 brief KPI tiles. §13 | `HomeDashboardBuilder` exposes 4 KPIs | **Business contract wins.** Ship the four existing tiles. Fifth tile waits on GAP-08. |
| <a id="c-09"></a>**C-09** | Quote views En attente / Brouillons / Acceptés / Expirés / Refusés. §20.1 | `constrain` status ∈ `draft`, `sent`, `accepted` | **Business contract wins.** Map labels onto existing statuses. No new status values. |
| <a id="c-10"></a>**C-10** | Status hexes `#2F7A4F` / `#A86A00` / `#B3261E`. §31 | PR1 `--evo-success/warning/danger` | **Business contract wins.** Keep PR1. No second status palette. |
| <a id="c-11"></a>**C-11** | Dark surfaces `#0B0F12` / … §31 | PR1 dark neutrals `#0a0a0a` / `#121212` / `#1c1c1c` | **Business contract wins.** One dark system (PR1) unless a dedicated Dark-lane PR updates tokens + consumers together. Hierarchy still required. |
| <a id="c-12"></a>**C-12** | Agents = DataWorkspace of configurable agents. §24 | `/agents` is a chat/bots desk | **Business contract wins.** Nav item opens the existing desk. |
| <a id="c-13"></a>**C-13** | Settings IA includes Teams, Email, Billing, API, Webhooks. §22 | `settings/ia.ts` omits those on purpose | **Business contract wins.** Do not add empty pages. Keep the three WhatsApp URLs. |
| <a id="c-14"></a>**C-14** | Feature flag `layout_v1` | Flag does not exist | **Business contract wins.** Do not gate the frame on a missing flag. New shell replaces the old one. |
| <a id="c-15"></a>**C-15** | Density Compact / Standard / Comfortable (32/36/40) | DataGrid density is `compact` \| `standard` only | **Business contract wins.** Add `comfortable` additively. Do not remove/rename `compact`/`standard`. |
| <a id="c-16"></a>**C-16** | Never show `DZD` in the UI | DB / API currency column is `DZD` | **Business contract wins.** Display through `format.ts`. Do not change the column. |
| <a id="c-17"></a>**C-17** | Ads 4 tabs; Outbound 6 tabs | Live children include ad-sets, ads, mailboxes, domains, warmup, outbox, suppressions | **Business contract wins.** Header tabs = all live children. Do not delete routes. |
| <a id="c-18"></a>**C-18** | Remove ForecastBar / attention from Deals | `attention=needs_attention` and forecast props are real | **Business contract wins.** Hide the blocks on the board (Deals lane). Keep query param + props. |
| <a id="c-19"></a>**C-19** | Record = two columns + optional context | `RecordWorkspace` API is `left` / `center` / `right` | **Business contract wins.** Keep slot props. Change only layout of those slots (Records lane). |
| <a id="c-20"></a>**C-20** | Older visual law: orange for active nav | Blueprint L4: teal = active. PR1 hexes stay | **Business contract wins** for token **values**; blueprint wins for layout **roles**. Do not reopen hexes. |

### 5.1 Open decisions (not Wave 1 work)

| ID | Status | What is frozen until the founder writes |
|---|---|---|
| **C-02** | **OPEN** | Simple Mode nav membership: code keeps Leads / Companies / Activities; owner brief wants Accueil, Contacts, Deals, Inbox, Devis + Paramètres. Wave 1 presentation may reorder/relabel existing items only. |
| AMB-01 | Resolved in matrix | Accueil has **no** page-primary orange. Create lives in the sidebar “+”. |
| AMB-02 | Resolved in matrix | Footer bell = **tasks** overlay, labelled “Tâches”. |
| Agents additive in `product-nav.ts` | Coordinated exception | If the mode pill is retired, Shell may add one Full-mode Agents row (presentation + href `/agents`) so the desk stays reachable. Not a membership rewrite of Simple Mode. |

---

## 6. Missing backend data (do not fake)

Flag only. No placeholder tiles, queues, timestamps, or menu items.

| ID | Blueprint want | What exists | Blocked UI | Until then |
|---|---|---|---|---|
| <a id="gap-01"></a>**GAP-01** | Notification feed + unread badge | Bell = open **tasks** (`evoOpenTaskCount`) | True notification panel | Footer bell opens `TasksOverlay` |
| <a id="gap-02"></a>**GAP-02** | Inbox queues “Équipe commerciale”, “Support” | Folders: `all`, `unassigned`, `mine`, `open`, `closed` + channel keys | Those two sidebar children | Do not ship them |
| <a id="gap-03"></a>**GAP-03** | Record prev/next (`K`/`J`) | No neighbour-id API | Slot B ↑↓ | Parent list link only |
| <a id="gap-04"></a>**GAP-04** | Accueil period + owner-scope selector | Window = current calendar month only | Slot E period control | Show `metrics.window.label` read-only |
| <a id="gap-08"></a>**GAP-08** | Accueil Objectifs, lead-source tile, pending-quotes tile | Not in `HomeDashboardBuilder` | Those tiles | Compose from `metrics`, `pipeline`, `recentDeals`, `activation` only |
| <a id="gap-05"></a>**GAP-05** | Accueil “top affaires” by amount | `recentDeals` ordered by `created_at` | Amount-ranked module | Do not relabel create-date rows as “top” |
| <a id="gap-12"></a>**GAP-12** | WhatsApp 24-hour window + template-only lock | Composer has a template picker. No `last_inbound_at` | “Fenêtre fermée” + disabled free-text | Do **not** disable send |
| <a id="gap-13"></a>**GAP-13** | Quote statuses expired / refused | `draft` \| `sent` \| `accepted` | Expirés / Refusés views | No new status strings the controller rejects |
| <a id="gap-14"></a>**GAP-14** | Créer menu includes Tâche | No Task `?create=1` in `command-os.ts` | Tâche item | **Omit Tâche** |
| GAP-06 | Settings › Canaux › E-mail | Email destination omitted on purpose | Moving tokens behind that page | Hide token/Roundcube from non-admin views (P0.2) |
| GAP-07 | Terms / Privacy legal copy | Placeholders | Real legal pages | Out of layout scope |
| GAP-09 | Server-chosen record primary | No `primary_action` prop | Server-driven H | Derive from phone/email/thread already on the record |
| GAP-10 | QuickRecord Overview deal + quote | Not guaranteed on every peek type | Fabricated rows | Show “—” |
| GAP-11 | Per-stage deal checklist | No stage-checklist config | Configurable checklist | Display-only from existing fields |
| GAP-15 | `layout_v1` flag | Does not exist | Gated dual-run | Not required to start the frame |

`attention` and `work` are already computed by `HomeDashboardBuilder` and unused on `home.tsx` — unused contract data, not a gap.

---

## 7. Risk register

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Four width systems: 212 / 240 / 248 / 224.** Production rail 212 (`--evo-rail`, `evo-shell.css`). shadcn sidebar 240/64 (`ui/sidebar.tsx`). `AppShell` 248. Blueprint 224/56. `approved-v02.css` still encodes 248 offsets. Changing only `--evo-rail` will not move `.evo-rail-slot { width: 212px }` or `calc(100% - 212px)`. | Shell owns **all four leftovers** in one PR: `evo.css`, `evo-shell.css`, `app-shell.tsx`, neutralize `approved-v02.css`, keep `ui/sidebar.tsx` off the desktop rail. Measure computed width at 1440 and 1024. |
| 2 | **Nested scrollers**, including `.aurora-page-shell.overflow-y-auto` on every App page. DataGrid, Pipeline columns, Record panes, Inbox, Ads, Outbound, Automation, Agents, Settings all add inner overflow. A prettier sidebar will not fix Deals/Inbox double-scroll. | Shell removes page-shell overflow. Frame becomes the one workspace scroll owner. Do not edit DataGrid/Pipeline/Inbox overflow in Wave 1. Acceptance: no `document` scroll on Contacts, Deals board, a record, Inbox. Accueil + Settings **may** scroll. |
| 3 | **Rail collapse is in-memory; `sidebar_state` cookie is a different component.** Desktop `EvoShell` `collapsedState` is React only. `sidebar_state` / Inertia `sidebarOpen` drive shadcn `SidebarProvider`, which is **not** the desktop rail. Shipping 224/56 without SSR persist will flash the wrong width. | Shell picks **one** persist key, writes cookie + first-paint width. Do not reuse `sidebar_state` unless every reader is migrated in the same PR. Acceptance: reload matches cookie; `⌘\` toggles 224 ↔ 56. |
| 4 | **Agents is a rail mode, not a product-nav item.** `NAV_SECTIONS` has no Agents row. `/agents*` flips `EvoShell` to `agents` and replaces the tree with `AgentsSidebar`. Retiring the pill without a Full-mode row strands Agents. | Preferred P0.1: hide the pill and add a **temporary Full-mode Agents row** (Shell presentation exception). Simple Mode unchanged (Agents stays hidden). Do not invent an agent DataWorkspace ([C-12](#c-12)). |
| 5 | **Settings is a Radix modal** (`SettingsLayout` dialog, ~800×1120). Removing the top bar changes the dimmed backdrop. Converting to a full page is P3.2 / PAGE-SET-01. | Wave 1: leave the dialog. Frame mounts header **inside** it on `/settings/profile`. Screenshots will look unfinished — that is expected. Do not convert the modal. |
| 6 | **Stale source-lock Pest tests.** `Wave0ShellChromeTest` and `P04AppShellTest` `file_get_contents` **`app-sidebar.tsx`** and lock flat labels (`Home`, `Vendre`, `Inbox`, `useSimpleMode`). Live chrome is `evo-rail.tsx` + `product-nav.ts`. Those tests stay green if the dead file is untouched while the live rail breaks. | Do **not** delete the tests. When the top bar / rail changes, **update assertions** to the live files (`evo-rail.tsx`, `product-nav.ts`, no `.app-topbar`). Add live-rail locks (see §8). Leave `app-sidebar.tsx` unwired (LEAVE). |

Other risks (token merge magnet, `approved-v02.css` colour `#E8530E`, Cmd+K vs Search mode vs `/`, quote workspace special-casing the top bar) are owned by Shell and called out in §3 Steps 0–3.

---

## 8. Test guard plan for Wave 1

### 8.1 Must stay green (do not weaken)

| Suite | Files / filters | Why |
|---|---|---|
| Pest CI | `composer ci:check` — 1200 / 1199 passed / 1 skipped | GitHub `ci` job |
| Vitest | `npm test` — 26 files / 89 tests | Includes `product-nav.test.ts`, pipeline announcements, url-state, record-workspace, inbox helpers, DataGrid i18n |
| Simple Mode | `SimpleModeToggleTest`, `SimpleModeNavTest`, `SimpleModeGuardTest` | Default-on, hidden power routes, `/leads` → board |
| List query | `P03CListQueryOwnershipTest`, `P05DataWorkspaceTest`, `P03A`/`P03B`/`P03D`, `CrmListWorkspaceTest` | URL is source of truth |
| Saved views / filters | `CrmSavedViewTest`, `CrmFilterTest` | `?view=` / filter_id |
| QuickRecord | `P09QuickRecordDrawerTest`, `P10QuickRecordDrawerIntegrationTest` | Peek JSON, one drawer, five adapters |
| Deal move / stages | `MoveDealTest`, `DealStagesTest`, `P11DealsPipelineBoardTest` | HTTP move + board mount |
| Inbox folder | `P13InboxWorkspaceTest`, `P14InboxCrmContextTest`, `DeskComposerTest` | `?folder=` + reply persist |
| Quotes | `P18QuotesBuilderTest` (and quote send tests) | Send endpoint + capabilities |
| Permissions | `CrmPermissionsTest`, `P16CommandOsTest` | `?create=1` + capability gates |
| i18n keys | `I18nFoundationTest` | Identical keys across `fr` / `en` / `ar` |
| Vitest nav helper | `resources/js/components/shell/product-nav.test.ts` | Deepest-child active, trailing slash, simple-mode groups, capability filter |

Pre-existing `tsc` 3 errors and ESLint 389 must **not get worse**. Wave 1 does not auto-fix lint.

### 8.2 Source-lock tests that may legitimately need updating

**Update assertions. Never delete coverage.**

| Test | Today it locks | When the top bar / rail changes |
|---|---|---|
| `tests/Feature/Wave0ShellChromeTest.php` | `app-sidebar.tsx` strings / `useSimpleMode` | Point at **`evo-rail.tsx` + `product-nav.ts`**. Assert no `.app-topbar` in the live layout. Keep Simple Mode visibility coverage. |
| `tests/Feature/P04AppShellTest.php` | Dead `app-sidebar.tsx` labels (`Home`, `Vendre`, `Inbox`) | Same: live rail file + hierarchical ids/hrefs. Do not keep locking an unmounted file as the only chrome contract. |
| Any grep for `.app-topbar`, `evo-create-btn` in the header, `AppSidebarHeader` | Top-bar presence | Assert **absence** of `.app-topbar` in `app-sidebar-layout.tsx`. Assert Create lives in the rail as a **neutral** control. |

Do not delete `app-sidebar.tsx` in Wave 1 just to make these tests fail-closed — update the tests first, leave the leftover file (LEAVE).

### 8.3 New tests to add in Wave 1

| Test | Suite | Assertion |
|---|---|---|
| Hierarchical nav × capability | Expand `product-nav.test.ts` (Vitest) | Every Wave 1 destination (settings children, quotes, inbox, deals board) is filtered by feature + capability. Simple Mode still exposes every current `SIMPLE_NAV` href (C-02 OPEN — do not assert the owner’s shorter list). |
| Rail collapse persistence | Pest or Vitest + cookie | First paint width matches cookie. `⌘\` toggles 224 ↔ 56. Not the shadcn `sidebar_state` unless explicitly migrated. |
| No `.app-topbar` | Pest source-lock on `app-sidebar-layout.tsx` / rendered chrome | Product tree has no `.app-topbar`. |
| Single orange primary per header | Pest or screenshot-guard on Contacts (and Accueil = **zero** page oranges) | Slot H ≤ 1 orange fill + 20px logo. Global “+” is not `--evo-primary` fill. |
| Live rail, not dead sidebar | Pest lock on `evo-rail.tsx` section ids / hrefs | Complements the updated Wave0 / P04 tests. |

**Do not add Playwright to GitHub CI in Wave 1.** Visual certification is a local `capture.mjs` run (§9).

---

## 9. Wave 1 sequence (Gate A)

1. **Shell first.** Tokens (Step 0) → light 224/56 rail → delete top bar → chrome homes → nav presentation → persist collapse → remove `.aurora-page-shell` overflow. Frame’s new files may already exist as a passthrough so Shell can mount them.
2. **Workspace Frame second.** `WorkspaceFrame` / `WorkspaceHeader` / types / CSS → `PageHeader` + `crm-object-header` adapters → mount on the 10 acceptance routes → header scroll ownership. No page-body redesigns.
3. **QA rerun.** `scripts/product-rebuild/qa-baseline.sh`. Pest must stay green. Record tsc/eslint counts (may stay 3 / 389). Vitest 26/89 must stay green.
4. **Code review.** Ownership table in §4 is the review checklist. Diff must not include DataWorkspace / DataGrid / Tablecn / FilterBuilder / SavedViews / RecordWorkspace / QuickRecord / Pipeline / Inbox / Quotes logic / `SimpleMode.php`.
5. **Visual certification.**  
   `node scripts/product-rebuild/capture.mjs --out artifacts/product-rebuild/01-frame`  
   Compare to `artifacts/product-rebuild/00-baseline`. Gate A visual bar (1440 `/crm/contacts`): light 224 sidebar, **no** `.app-topbar`, no mode pill, no orange Create, no sun, no dark cabinet, orange count ≤ 1 + logo.
6. **Gate A stop.** Do not start Inbox / Deals / Records / Resource / Documents / Full Mode / Mobile tab-bar / RTL / Dark / P0.2 trust lanes until Gate A is signed.

---

## 10. Protected contracts (reminder)

Inertia page contracts and props · permissions/policies · routes and URLs · server-side filtering / sorting / pagination · saved views · DataWorkspace / DataGrid / FilterBuilder / SavedViews / RecordWorkspace slots / QuickRecordPeek / Pipeline + DnD announcements / LostReasonDialog / Inbox real-time hooks / Outbound / Automation / Agents desk / EvoViz / cmdk internals / PR1 token **hexes** / `format.ts` / `SimpleMode.php` membership · canonical list-query keys.

The rebuild is **one shell, one header, one scroll rule, one density scale, four archetypes**. It is not a rewrite.

---

## 11. Revision log

| Rev | Contents |
|---|---|
| 1 | Consolidation of #285 / #288 / #287 / #286 + Blueprint V1. Baseline facts, full Inertia route map, P0.1 file-level tasks, exclusive ownership, C-01…C-20 (C-02 OPEN), backend gaps, risks, test guards, Gate A sequence. |
