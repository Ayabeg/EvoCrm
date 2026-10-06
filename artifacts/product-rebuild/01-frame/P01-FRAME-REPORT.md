EVOCRM P0.1 FRAME: COMPLETE
BLUEPRINT V1: READ COMPLETELY / REQUIREMENTS MAPPED

CURSOR AGENTS USED (Agent / Mission / Result):
- PR #284 CI fix (bc-47ea6402): merged as 89eb457
- Wave 0 agents x4 (architecture, blueprint matrix, visual baseline, QA baseline): PRs #285-#289, merged to main 1e146ff
- Agent 05 Shell (bc-ca99d291): PR #290 — head `1e5eb94` (R05-01 first-paint from Inertia `sidebarOpen`; R05-02 child-link focus class on `rowClass`; R05-03 P16 Ask Evo lock retargeted to `evo-shell.tsx`; rail tokens 224/56; logical overlay centering; G-chord shortcuts in source)
- Agent 06 Workspace Frame (bc-156f355c): PR #291 — head `39c7de4` includes the shell. R06-01 Deals forecast/attention closed-`<details>` REVERTED (board y=793, list y=717). R06-03 conversation header quiet (`sr-only` h1). R06-02 stronger one-orange locks. R06-04/06/07 handshake / no-op cleanup
- Independent code review (bc-bff60b26): 0 P0, 1 P1 (R06-01), since fixed
- QA + visual certification (you, bc-2d3654bf): PR #292 — first pass certified `02fa629`; this pass recertifies `39c7de4`

BASELINE: BRANCH main, HEAD 1e146ffb, DIRTY WORKTREE no (measurement worktree `/tmp/p01-qa-main` clean of product edits), PRE-EXISTING FAILURES tsc 3 errors (dashboard-recent `dir` on RecordLink; tablecn `EyeSlash` + `sortableColumnIds`); ESLint 439 problems (436 errors, 3 warnings) on this VM; Pest 1 skipped (GoldenCopyGuard without `/tmp/pw`) + 1 risky; Companies/Leads document titles stay English

ARCHITECTURE: APP SHELL EvoShell + EvoRail, no `.app-topbar`, rail measured 224px at 1440 / 56px at 1024 / overlay (sidebar width 0) at 768 and 390. NAVIGATION hierarchical `product-nav` + Simple Mode `SIMPLE_NAV` unchanged (Home, Inbox, Leads, Contacts, Companies, Deals, Quotes, Activities + Settings); Agents Full-only. WORKSPACE FRAME `WorkspaceFrame` on the Agent 06 mount in `app-sidebar-layout.tsx`; `data-shell-scroll="frame"` on the 10 acceptance routes. WORKSPACE HEADER 48/40/36 slots; Accueil title is `t('Home')` not a greeting; Inbox conversation h1 is `sr-only`. SCROLL OWNERSHIP acceptance routes frame-owned; Companies/Leads lists and unmigrated routes still document. RESPONSIVE 1024 icon rail; ≤768 overlay does not resize workspace (390 main width 390 with overlay open). RTL AR 1440 Contacts `dir=rtl`; Inbox rail at x=1216 (1440−224). DARK rail distinct from canvas on `contacts__1440x1000__fr__dark.png`

REMOVED: GLOBAL TOP BAR yes (metrics `topBar: null` on every after 1440 shot). DUPLICATE CREATE global orange Créer removed; rail Créer is neutral; Accueil « Nouvelle affaire » is secondary (primaryActionCount 0). DEAD SHELL SPACE 212px always-expanded dark slab gone. OTHER Menu/Agents/Search mode pill retired

PRESERVED (YES/NO + evidence each):
- LARAVEL YES — `composer ci:check` PASS 1214/1213 on `39c7de4`; app still `artisan` / Pest / Eloquent
- INERTIA YES — pages still Inertia; first-paint collapse seeded from Inertia `sidebarOpen` (R05-01); URL writes still `router.get`
- ROUTES YES — same live paths `/dashboard` `/crm/contacts` `/crm/deals` `/crm/deals/board` `/inbox` `/crm/quotes` `/settings`; 12/12 HTTP 200
- PERMISSIONS YES — not rewritten; Simple Mode still hides power hrefs (`leakedPower=[]`); member 403s not re-run this pass beyond existing Pest
- PRODUCT NAV YES — `product-nav.ts` presentation only (Agents Full-only, sentence-case). `SIMPLE_NAV` membership unchanged
- SIMPLE MODE YES — hrefs `/dashboard` `/inbox` `/crm/contacts` `/crm/companies` `/crm/leads` `/crm/activities` `/crm/deals` `/crm/quotes` `/settings`; C-02 still OPEN
- DATAWORKSPACE YES — SavedViews + FilterBar + thead still below the title; Contacts first row y=209 (same stack)
- TABLECN YES — still unimported; still 2 of 3 `tsc` errors
- FILTER BUILDER YES — Contacts filters still write `owner` / `sort` / `page` / `view` on the URL
- SAVED VIEWS YES — « Mes contacts » → `?owner=1&view=my`
- QUICKRECORD YES — Enter on `tr[data-row-peek=true]` opens 448px drawer (Sara Khelifi, Open full, Vue d’ensemble)
- RECORDWORKSPACE YES — left/center/right untouched (C-19); identity y=22/14/14
- PIPELINE YES — `POST /crm/deals/1/move` body `{"stage_id":2}`; stage restored to 1. ForecastBar + AttentionQueue visible by default (R06-01)
- INBOX YES — native desk, no CSP banner with `inbox_url` null; composer y=636 h=248 bottom=884; list/thread independent; page does not scroll
- QUOTES YES — one seeded row; one orange « Créer un devis »; Envoyer remains the document primary
- URL STATE YES — `?direction=asc&owner=1&page=2&sort=name&view=my` survives reload, Back, and Forward

VISUAL ROUTES:
- Contacts HTTP 200 · first row y=209 · 1 orange create · PASS
- Deals List HTTP 200 · first row y=717 · forecast/attention visible · PASS
- Deals Board HTTP 200 · first card y=793 · 5 nested column scrollers · PASS (Wave 2 density)
- Contact Record HTTP 200 · identity y=22 · PASS
- Company Record HTTP 200 · identity y=14 · PASS
- Lead Record HTTP 200 · identity y=14 · still English + orange « New » · PASS (internals old)
- Inbox HTTP 200 · first useful y=42 · no CSP banner · quiet header · PASS
- Quotes HTTP 200 · first row y=195 · status « Sent » EN · PASS
- Dashboard HTTP 200 · Accueil y=29 · 0 page primaries · PASS
- Settings HTTP 200 · y=169 · still a modal · PASS (LAW-09 Wave 1)

VIEWPORTS: 1440 (rail 224), 1280 (rail 224), 1024 (rail 56), 768 (overlay, rail 0), 430 (overlay), 390 (overlay; board metric latched « Voir tous » at y=173 — first card still below the fold)

LANGUAGES: FR 103-set default; EN 1440 Contacts/Deal/Inbox/Dashboard captured; AR 1440 same four + `dir=rtl`

THEMES: LIGHT default matrix; DARK 1440 Contacts/Deal/Inbox/Dashboard captured

ACCESSIBILITY: KEYBOARD tab order collapse → search → create → Accueil → Inbox → CRM. FOCUS top-level rail/header teal `rgb(15, 76, 92)` solid 2px; Contacts *child* via Tab measured `rgb(74, 90, 99)` solid 2px (ink-secondary) — R05-02 incomplete on nested children. REDUCED MOTION `prefers-reduced-motion: reduce` matches; rail `transitionDuration=1e-05s`. G-chord shortcuts NOT TESTED

TESTS: TYPESCRIPT FAIL 3/3 identical PRE-EXISTING both SHAs. VITEST main 26/89 PASS; head 27/96 PASS. PEST main 1200/1199 + skip + risky PASS; head 1214/1213 + skip + risky PASS. BUILD both PASS (main 15.26s, head 20.04s). BROWSER CONSOLE 12/12 sweep routes empty on both SHAs; 103/103 after shots empty

NEW P0: none
NEW P1: none
P2: Inbox empty-state lie (« Vous êtes à jour » while 8 threads list) PRE-EXISTING; Accueil date/timezone crowding on the 48px title row NEW P3-adjacent (kept P3); 390 board still chrome-first PRE-EXISTING
P3: Accueil title-row date + `Africa/Algiers` tight at 1440 NEW; Contacts child focus ring still ink-secondary on Tab NEW (top-level teal works); FR/EN « Leads » / « Contacts » PRE-EXISTING; GAP-14 no Tâche in rail create PRE-EXISTING

PRE-EXISTING deferred to Wave 2:
- Contacts first row y=209 (SavedViews + FilterBar + thead) — LAW-06
- Deals board first card y=793 and list y=717 (ForecastBar + AttentionQueue + views/filters/stage pills) — C-18 / LAW-06 / LAW-07
- DataWorkspace views/filters not folded into header slots J–N
- Board chrome / column scrollers
- Settings modal (LAW-09)
- Lead record English island
- Companies / Leads lists still document scroller
- Quote « Sent » / Resend orange (LAW-10 Documents wave)

BEFORE PRODUCT COHERENCE: 3.0 / 10
AFTER PRODUCT COHERENCE: 6.0 / 10
GAP TO 9.0: 3.0 — the shared shell + header exist; Deals still opens with the old forecast/attention slab (793), lists still stack DataWorkspace chrome, Settings is a modal, lead record is English. Gate A cannot close that gap without Wave 2 page work.

FILES CHANGED: 279 files `main..39c7de4` (+19582 / −1192). Cert branch adds/replaces `docs/product-rebuild/01-frame/*`, `artifacts/product-rebuild/01-frame/P01-FRAME-REPORT.md`, recaptured `after/` (103 shots, `inbox_url` null), `BEFORE-AFTER-COMPARISON.png`, `P01-AFTER-CONTACT-SHEET.png`
COMMITS: 24 on `main..39c7de4` prefixes tokens(shell) 1, layout(shell) 4, test(shell) 8, layout(workspace) 2, test(workspace) 6, fix(workspace) 1, merge(workspace) 2. Cert branch extra: `docs(p01):` then `docs(rebuild):` (this report)
BEFORE CONTACT SHEET path: artifacts/product-rebuild/00-baseline/BEFORE-CONTACT-SHEET.png
AFTER CONTACT SHEET path: artifacts/product-rebuild/01-frame/P01-AFTER-CONTACT-SHEET.png
REPORT path: artifacts/product-rebuild/01-frame/P01-FRAME-REPORT.md

DEPLOYMENT PERFORMED: NO
WAVE 2 STARTED: NO / INBOX REDESIGN STARTED: NO / DEALS REDESIGN STARTED: NO / RECORD REDESIGN STARTED: NO
READY FOR PRODUCT OWNER VISUAL REVIEW: YES
OPEN PRODUCT-OWNER DECISIONS: C-02 (Simple Mode currently still shows Leads/Companies/Activities vs the brief's Accueil, Contacts, Deals, Inbox, Devis + Paramètres); C-18 (hide Deals forecast/attention by default in Wave 2? The board is at 793 because of it); Settings is still a modal; blueprint data quirks (example deals consume the stage totals; DV-2026-0047 shows Expiré after 3 Oct — NOT TESTED this pass; seeded quote is Quote #1 status Sent, no DV-2026-0047 in VisualQaSeeder)
STOP NOW. WAIT FOR PRODUCT OWNER APPROVAL.
