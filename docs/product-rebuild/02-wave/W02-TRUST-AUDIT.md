# W02 TRUST / LANGUAGE AUDIT — Deals + Inbox (Agent C)

**Wave:** 2 · Agent C · Trust / language  
**Kind:** AUDIT ONLY. No product code was modified.  
**Product head:** `rebuild/p01-certification` `72877f7c` (Gate A frame)  
**Audit branch:** `cursor/w02-trust-audit-438c`  
**Date:** 7 October 2026  
**Host:** localhost only (`:8000`). No deploy, DNS, production, or extra seed records.  
**Seed:** `DatabaseSeeder` + `VisualQaSeeder` (already called from `DatabaseSeeder`). Login `owner@evosales.local` / `password`.  
**Locales:** FR default (`APP_LOCALE=fr`), EN, AR (RTL). Timezone contract: `Africa/Algiers`. Money contract: `1 280 000 DA` (never `DZD` in UI).  
**Capture note:** workspace `inbox_url` was nulled for native Inbox panes (same as P0.1). `.env` `EVOSALES_INBOX_URL=https://desk.evotechly.com` still applies via `Workspace::inboxUrl()` fallback — that is why the Desk CSP banner is visible on seeded `/inbox`. Simple Mode is the seeded default; one Full Mode shot documents `Leads` in the shell.

Evidence: `artifacts/product-rebuild/02-wave/trust/`.

---

## 1. Scope

Wave 2 surfaces only:

| Surface | Routes | What was audited |
|---|---|---|
| Deals list | `/crm/deals` | Header, Import, attention queue, grid, create drawer, shell |
| Deals board | `/crm/deals/board` | Forecast, attention, cards, close dates, Board options drawer |
| Deal QuickRecord | opened from list row and board card | Tabs, property labels, attention, Open full |
| Inbox | `/inbox`, `/inbox?thread=1`, `/inbox?folder=closed` | List, empty-right, thread, composer, internal note, CRM context, Desk banner, channel folders |
| Shell chrome those pages render | sidebar, header, desk tabs | FR/EN mixing (`Leads`, `Import`, `Outbound`…) |

Out of scope: Contacts / Leads / Quotes / Settings / Home interiors, quote PDF, outbound infra pages (except shared keys they collide with).

---

## 2. Method

1. Static read of Wave 2 TSX/PHP + `lang/{fr,en,ar}.json`.
2. Seed + `composer setup` + Vite build. Live login on `:8000`.
3. Playwright capture at 1440×1000 light for **FR, EN, AR**, plus Full Mode shell and seeded Desk URL.
4. Every finding below is either **seen on a screenshot** or **code-locked** (path not hit by this seed, still user-facing).

**Classification**

| Tag | Meaning |
|---|---|
| **system_copy** | Product chrome. Fixable. |
| **user_generated** | Seeded titles, message bodies, contact names. **NEVER modify.** Report only. |

**Severity**

| Sev | Meaning |
|---|---|
| **P0** | Production FR default shows English system chrome, or an empty state that contradicts visible data |
| **P1** | Tech/ops leak, missing keys (English fallback), `DZD` in UI, dates in the wrong locale |
| **P2** | Hardcoded string whose key already exists, inconsistent format, brand/ops wording |
| **P3** | Polish / loanword / unused path |

---

## 3. Counts

### By severity

| Sev | Count |
|---|---:|
| P0 | **2** |
| P1 | **14** |
| P2 | **10** |
| P3 | **6** |
| User-generated (report only) | **4** |
| **Total findings** | **36** (32 system + 4 user-generated) |

### By owner (system_copy only)

| Owner | P0 | P1 | P2 | P3 | Total |
|---|---:|---:|---:|---:|---:|
| **Deals agent** | 1 | 6 | 3 | 3 | **13** |
| **Inbox agent** | 1 | 6 | 5 | 2 | **14** |
| **Shared lang files** | 0 | 2 | 2 | 1 | **5** |
| **Shared (Deals + Inbox + lang)** | — | — | — | — | conflicts listed in §6 |

P0 board-options is one finding (the whole drawer), not one finding per string.

---

## 4. Top 10

| # | ID | Sev | Owner | What the user sees (FR default) |
|---|---|---|---|---|
| 1 | **T-I-01** | P0 | Inbox | Right pane: « Sélectionnez une conversation / Vous êtes à jour. » while 8 threads are listed |
| 2 | **T-D-01** | P0 | Deals | Board options drawer is 100% English (`Edit board view`, `Cancel`, `Save`…) on FR |
| 3 | **T-I-07** | P1 | Inbox | Banner: `desk.evotechly.com` + `EvoDesk CSP frame-ancestors` on every Inbox pane |
| 4 | **T-D-15** | P1 | Deals + lang | Create deal: **Montant (DZD)** — violates TRUST-02 / never-DZD |
| 5 | **T-D-16** | P1 | Deals | Board cards: `11 October` / `14 October` (`en-GB`) on FR UI |
| 6 | **T-D-18** | P1 | Deals | QuickRecord labels: `Stage`, `Amount`, `Company`, `Close date`… untranslated |
| 7 | **T-D-19** | P1 | Deals + lang | Drawer: **Open full** + tab **Associations** (keys missing in fr/en/ar) |
| 8 | **T-I-09** | P1 | Inbox + lang | Context: **Contact owner**, **Peek** (keys missing → English on FR/AR) |
| 9 | **T-S-01** | P1 | Shared lang | Full Mode CRM child: **Leads** (`nav.crm.leads`) while `Leads` → « Pistes » |
| 10 | **T-I-22** | P1 | Inbox | Probe caches `__()`’d reason 5 min; AR Inbox showed leftover **French** CSP copy |

---

## 5. Findings

### 5.1 Deals agent

#### T-D-01 — Board options drawer is English on FR/AR — **P0** · system_copy

| | |
|---|---|
| **Route** | `/crm/deals/board` → Options du tableau → Modifier les cartes |
| **Screenshot** | `fr__deals-board-options.png`, `en__deals-board-options.png`, `ar__deals-board-options.png` |
| **Source** | `resources/js/components/crm/board-options-sheet.tsx` **43–209** (no `t()`) |
| **Current** | `Edit board view` · `Cards` · `Board` · `Choose card style` · `Default` · `Compact` · `Display priority and associated records` · `Deal activity information` · `Show next and last activity information for each deal` · `Inactive cards` · `Mark cards that have gone a designated amount of time with no recorded activity` · `Mark cards inactive after` · `days` · `Sort` · `Last activity` · `Amount` · `Close date` · `Deal name` · `Cancel` · `Save` · `Columns, stage names, and win probabilities live in pipeline settings.` · `Edit stages` · `Export view` |
| **Proposed FR** | Titre « Modifier la vue tableau ». Onglets « Cartes / Tableau ». « Style de carte » · « Standard / Compact ». « Afficher la priorité et les fiches liées ». « Activité de l’affaire » / « Afficher la prochaine et la dernière activité ». « Cartes inactives » / « Marquer les cartes sans activité après N jours ». « Trier » · « Dernière activité ». Boutons « Annuler / Enregistrer ». |
| **EN key / AR** | Add the English literals as keys (or dedicated `board.options.*`). AR: « تعديل عرض اللوحة », « البطاقات », « اللوحة », « إلغاء », « حفظ ». |
| **Conflict** | `Cancel` / `Save` / `Board` / `Edit stages` / `Export view` already exist in `lang/*.json`. Wire `t()`; do **not** invent parallel keys. |

#### T-D-15 — Create-deal amount label shows DZD — **P1** · system_copy · **shared key**

| | |
|---|---|
| **Route** | `/crm/deals` and `/crm/deals/board` create popover |
| **Screenshot** | `fr__deals-create.png` (FR: « Montant (DZD) ») |
| **Source** | `resources/js/pages/crm/deals/index.tsx:216` · `board.tsx:156` · `lang/fr.json:364` |
| **Current** | `t('Amount (DZD)')` → FR **Montant (DZD)** · EN `Amount (DZD)` · AR `المبلغ (DZD)` |
| **Proposed FR** | « Montant (DA) » |
| **EN key / AR** | Prefer new key `Amount (DA)` in all three files (`Amount (DA)` / `Montant (DA)` / `المبلغ (DA)`). Keep storage column `DZD`. |
| **Conflict** | Same key is used by Quotes (`quote-split-builder.tsx`). Deals agent must not rewrite the FR value in isolation — coordinate with shared lang (§6). |

#### T-D-16 — Board close dates use `en-GB` — **P1** · system_copy

| | |
|---|---|
| **Route** | `/crm/deals/board` cards |
| **Screenshot** | `fr__deals-board.png` — `11 October`, `14 October`, `6 October` |
| **Source** | `resources/js/pages/crm/deals/deal-pipeline-board.tsx:61–75` |
| **Current** | `toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })` |
| **Proposed** | `formatDate(value, { year: undefined })` from `@/evo/lib/format` (`Africa/Algiers`, active locale). FR: « 11 oct. ». EN: « 11 Oct ». AR: « 11 أكتوبر » with Latin digits. |
| **EN key / AR** | n/a (formatter) |

#### T-D-18 — QuickRecord property labels hardcoded English — **P1** · system_copy

| | |
|---|---|
| **Route** | Deal QuickRecord from `/crm/deals` or `/crm/deals/board` |
| **Screenshot** | `fr__deals-quickrecord.png` — `Stage`, `Amount`, `Company`, `Contact`, `Owner`, `Close date`, `Next step`, `Priority`; stage value **New** (list pills say « Nouveau ») |
| **Source** | `resources/js/ds/workspace/record-adapters/deal.ts:21–43` |
| **Current** | `` `Deal #${id}` `` fallback; labels are English literals; `stage_name` raw; `currency ?? 'DZD'` internal only |
| **Proposed FR** | `t('Stage')`…; `stageLabel(slug, name)` so New → « Nouveau »; title fallback « Affaire n° :id » |
| **EN key / AR** | Existing `Stage` / `Amount` / `Company` / `Close date`. New: `Deal #:id` → « Affaire n° :id » / « الصفقة رقم :id » |

#### T-D-19 — Missing drawer keys (`Open full`, `Associations`, `Quick record`) — **P1** · system_copy · **shared keys**

| | |
|---|---|
| **Route** | Deal QuickRecord |
| **Screenshot** | `fr__deals-quickrecord.png` — button **Open full**, tab **Associations** |
| **Source** | `QuickRecordDrawer.tsx:28–34, 218, 295, 360` |
| **Current** | `t('Open full')`, `t('Associations')`, `t('Quick record')` — **absent from all three JSON files** → fallback = English key |
| **Proposed FR** | « Ouvrir la fiche » · « Associations » / « Fiches liées » · « Aperçu » |
| **EN key / AR** | Add `Open full`, `Associations`, `Quick record` to fr/en/ar. AR: « فتح البطاقة », « الارتباطات », « معاينة ». Do not reuse `Open full record` only — drawer uses the short key. |

#### T-D-09 — Attention *reasons* are English templates (overdue) — **P1** · system_copy

| | |
|---|---|
| **Route** | `/crm/deals`, `/crm/deals/board`, QuickRecord |
| **Screenshot** | Not hit this seed (all open deals = « aucune prochaine action », which **is** translated). Code-locked. |
| **Source** | `app/Services/Crm/DealAttentionEvaluator.php:85–93` · drawer renders `signal.reason` without `t()` at `QuickRecordDrawer.tsx:390–394` |
| **Current** | `"{subject} was due {when}"` / `"An activity was due {when}"` with `d M H:i` (`05 Oct 14:30`) |
| **Proposed FR** | Parameterized keys: « :subject était dû(e) le :when » · « Une activité était due le :when ». Format `:when` via Algiers locale. List queue already `t(reason)` (`deal-attention-queue.tsx:85`) — **drawer must too**. |
| **Conflict** | Stable reason `This open deal has no scheduled next action.` already in lang files. Dynamic overdue strings must become real keys, not interpolated English. |

#### T-D-12 — Forecast backtest label is a dynamic English sentence — **P1** · system_copy

| | |
|---|---|
| **Route** | `/crm/deals/board` forecast strip |
| **Screenshot** | This seed shows the **translated** empty-sample line (« Il faut 3+ affaires fermées »). Dynamic path is code-locked. |
| **Source** | `app/Services/Ai/RecordInsight.php:500–502` · `deal-forecast-bar.tsx:110` `t(forecastBacktest.label)` |
| **Current** | `'Within 15% · '.$counted.' deals'` / `round($error, 1).'% off · '.$counted.' deals'` — not stable keys, so `t()` cannot work |
| **Proposed FR** | « Écart ≤ 15 % · :count affaires » / « :pct % d’écart · :count affaires » |
| **EN key / AR** | New parameterized keys in all three files |

#### T-D-24 — `Import` not wrapped in `t()` — **P2** · system_copy

| | |
|---|---|
| **Route** | `/crm/deals` header |
| **Screenshot** | `fr__deals-list.png`, `ar__deals-list.png` — **Import** next to « Créer une affaire » / « إنشاء صفقة » |
| **Source** | `resources/js/pages/crm/deals/index.tsx:128` |
| **Current** | `Import` |
| **Proposed FR** | `t('Import')` → « Importer » (key exists `lang/fr.json:326`) |
| **EN key / AR** | `Import` / `استيراد` (already present) |

#### T-D-31 — Native `type="date"` shows `mm/dd/yyyy` — **P2** · system_copy

| | |
|---|---|
| **Route** | Create deal drawer |
| **Screenshot** | `fr__deals-create.png` — placeholder `mm/dd/yyyy` |
| **Source** | `index.tsx:221`, `board.tsx:161` (`<Input name="close_date" type="date" />`) |
| **Current** | Browser locale of the agent VM (en-US), not `fr-DZ` / Africa/Algiers |
| **Proposed** | Keep the stored `Y-m-d` value; display via a locale-aware picker or `lang`/`format` hint. Do not invent a timezone. |

#### T-D-23 — Pipeline switcher aria / `(default)` — **P2** · system_copy

| | |
|---|---|
| **Route** | `/crm/deals`, `/crm/deals/board` |
| **Source** | `resources/js/components/crm/pipeline-switcher.tsx:36, 52` |
| **Current** | `aria-label="Pipeline"`; suffix ` (default)` |
| **Proposed FR** | `t('Pipeline')` · « (par défaut) » |
| **Note** | Pipeline **names** are user_generated. |

#### T-D-27 — « Pipeline » leftover in FR chrome — **P3** · system_copy

Breadcrumb / forecast KPI use `t('Pipeline')` → FR value is still `Pipeline` (`lang/fr.json:114`). Acceptable loanword or change to « Pipeline commercial » — shared key.

#### T-D-28 — List vs board empty copy diverge — **P3** · system_copy

`deal-columns.tsx` `No deals yet` vs `board.tsx` `No deals in this pipeline`. Align once both are empty (not this seed).

#### T-D-20 — QuickRecord error strings hardcoded — **P3** · system_copy

`quick-record/hydrate.ts:9–38` — `This record is missing…` / `You do not have permission…` / `That record reference is not valid.` Not hit this seed.

---

### 5.2 Inbox agent

#### T-I-01 — « Vous êtes à jour » while threads are listed — **P0** · system_copy · **shared key**

| | |
|---|---|
| **Route** | `/inbox` (no `?thread=`) and `/inbox?folder=closed` right pane |
| **Screenshot** | `fr__inbox-list.png`, `fr__inbox-folder-closed.png`, `ar__inbox-list.png` |
| **Source** | `resources/js/pages/desk/inbox.tsx:649–652` · also `InboxWorkspace.tsx:173–174` |
| **Current** | Title `Select a conversation` + description `You're all caught up.` → FR « Sélectionnez une conversation » / « Vous êtes à jour. » AR « اختر محادثة » / « أنت محدّث. » |
| **Proposed FR** | Titre inchangé. Description: « Choisissez un fil dans la liste. » |
| **EN key / AR** | **New** key `Pick a conversation from the list.` → « Choisissez un fil dans la liste. » / « اختر محادثة من القائمة. » **Do not reuse** `You're all caught up.` (dashboard + true-empty still need it). |

#### T-I-02 — Folder empty uses the same “caught up” lie — **P1** · system_copy · **shared key**

| | |
|---|---|
| **Route** | `/inbox?folder=mine` / `whatsapp` / `email` / `?q=` when that folder is empty |
| **Screenshot** | Code-locked this seed (`whatsapp`/`email` counts are 0; closed has 4). Default in `ConversationList.tsx:103–104`. |
| **Source** | `inbox.tsx:500–501` |
| **Current** | `No open conversations here` + `You're all caught up.` |
| **Proposed FR** | « Aucune conversation dans ce dossier » + « Essayez un autre dossier ou effacez le filtre. » |
| **EN key / AR** | New description key. Do not share with T-I-01 or the dashboard. |

#### T-I-07 — Desk CSP / frame-ancestors / hostname banner — **P1** · system_copy

| | |
|---|---|
| **Route** | Every `/inbox` pane (list, thread, note, closed) |
| **Screenshot** | `fr__inbox-list.png`, `fr__inbox-thread.png`, `fr__inbox-desk-embed.png`, `ar__inbox-list.png` |
| **Source** | `marks.tsx:54–68` · `DeskEmbedProbe.php:52–71` · `Workspace.php:182–186` (falls back to `config('evosales.inbox_url')` = `.env` Desk URL) · FR string `lang/fr.json:1904` |
| **Current** | `desk.evotechly.com n’est pas intégré ici. EvoDesk CSP frame-ancestors n’inclut pas cette origine CRM. Autorisez le cadrage sur le desk. Affichage du desk CRM natif.` |
| **Proposed FR** | « La messagerie intégrée n’est pas disponible ici. Les conversations s’affichent dans EvoCRM. » Hide host + CSP tokens from non-admin chrome (TRUST-03). |
| **EN key / AR** | New user keys. Keep the current English sentences for admin/docs only. |

#### T-I-22 — Embed reason is pre-translated + cached — **P1** · system_copy

| | |
|---|---|
| **Route** | `/inbox` after a locale switch within 5 minutes |
| **Screenshot** | `ar__inbox-list.png` — AR chrome + **French** CSP sentence |
| **Source** | `DeskEmbedProbe.php:16–25` (`Cache::remember` 300s) + `__()` then `t(embedReason)` in `marks.tsx:68` |
| **Current** | First locale’s `__()` string is cached; client looks up that *translated* text as a key and falls back to it |
| **Proposed** | Cache `{state, reason_key, replace}`; pass the **English key** to Inertia; `t()` once on the client. |

#### T-I-09 — CRM context keys missing — **P1** · system_copy · **shared keys**

| | |
|---|---|
| **Route** | `/inbox?thread=1` context column |
| **Screenshot** | `fr__inbox-thread.png`, `fr__inbox-note.png` — **Contact owner**, **Peek** |
| **Source** | `inbox-crm-context.tsx:168, 188, 198, 219, 263–266, 330, 336, 353, 371, 411, 417, 431` |
| **Current (missing in fr/en/ar)** | `CRM context failed` · `Loading context` · `No CRM contact linked` · `This conversation has no CRM contact to show.` · `Select a deal to inspect. Nothing is marked primary.` · `Contact owner` · `Deal owner` · `View activity` · `Create activity` · `Next activity` · `Peek` |
| **Proposed FR** | « Propriétaire du contact » · « Aperçu » · « Chargement du contexte » · « Aucun contact CRM lié » · « Voir l’activité » · « Créer une activité » · « Prochaine activité » |
| **EN key / AR** | Add every key above to all three files. AR: « مالك جهة الاتصال », « معاينة », « جاري تحميل السياق ». |

#### T-I-03 — Global empty mentions Baileys / WhatsApp Cloud — **P1** · system_copy · **shared key**

| | |
|---|---|
| **Route** | `/inbox` when `workspaceEmpty` |
| **Screenshot** | Not this seed (8 threads). Code-locked. |
| **Source** | `inbox.tsx:142–143` · `lang/fr.json:405` |
| **Current** | `You're all caught up. Connect official WhatsApp Cloud to start. No Baileys.` → « Vous êtes à jour. Connectez WhatsApp Cloud officiel pour commencer. Pas de Baileys. » |
| **Proposed FR** | « Aucune conversation pour l’instant. Connectez WhatsApp Business pour recevoir des messages ici. » Drop Baileys / Evolution from Inbox empty (ops copy belongs in Settings). |

#### T-I-04 — Channel fallback labels bypass `t()` — **P2** · system_copy

| | |
|---|---|
| **Route** | `/inbox` thread header |
| **Screenshot** | `fr__inbox-thread.png` — **WhatsApp Business** |
| **Source** | `resources/js/lib/inbox-workspace.ts:259–287` (used at `inbox.tsx:533–536`) |
| **Current** | `'WhatsApp Business'`, `'WhatsApp'`, `'Email'`, `'SMS'`, `'Telegram'`, `'Channel'` |
| **Proposed** | Reuse `inboxChannelLabel()` in `evo/inbox/channel.tsx` (already `t()`-wrapped). PHP folder labels at `InboxController.php:114–120` are English keys consumed via `t(item.label)` — OK if keys exist. |

#### T-I-11 — Activity `type` enum shown raw — **P2** · system_copy

| | |
|---|---|
| **Route** | Inbox context Last / Next / Tasks |
| **Source** | `inbox-crm-context.tsx:122` · `InboxCrmContextComposer.php` emits `type` |
| **Current** | `{item.type}` → `call`, `note`, `scheduled` |
| **Proposed FR** | Map through `t()` (`Call` → « Appel » already exists). |

#### T-I-12 / T-I-13 — Message status fallback + raw `failure_reason` — **P2** / **P1** · system_copy

| | |
|---|---|
| **Route** | Thread bubbles |
| **Source** | `MessageThread.tsx:15–26, 61–64` |
| **Current** | Known statuses `t(status)` (FR « envoyé » / « reçu » — **good** on `fr__inbox-thread.png`). Default = raw enum. `failureReason` printed verbatim. |
| **Proposed FR** | Unknown → « Statut inconnu ». Failed → « Envoi impossible. » (hide provider codes). |
| **Note** | `message.body` is **user_generated** — do not `t()`. |

#### T-I-08 — “EvoDesk” / “CRM inbox” / “desk” as product verbs — **P2** · system_copy

Keys: `Continue in CRM inbox`, `Showing the CRM inbox. Desk stays on this host.`, `Desk framed on this host`, `EvoDesk inbox`, `Loading desk`. FR still says « desk » / « CRM ». Propose « Messagerie » / « Continuer ici ».

#### T-I-19 — `:count conversations` keeps the English noun in FR — **P2** · shared lang

`lang/fr.json:1466` = `":count conversations"`. Propose « :count conversation(s) ».

#### T-I-14 — WhatsApp template titles are API slugs — **P3** · system_copy

`canned.ts` `devis_envoye`, `relance_devis`. Agent-facing. Propose human titles.

#### T-I-20 — `Next` → « Suiv. » on deal rows — **P3** · shared key

`inbox-crm-context.tsx:183` uses global `Next` (`fr.json` « Suiv. »). Propose a dedicated `Next activity` key (also missing — T-I-09).

---

### 5.3 Shared lang files + shell chrome

#### T-S-01 — FR nav child is `Leads` — **P1** · shared lang

| | |
|---|---|
| **Route** | Shell on `/crm/deals` and `/inbox` in **Full Mode** (seeded default is Simple Mode — child hidden) |
| **Screenshot** | `fr__deals-shell-fullmode.png` — CRM → **Leads**; also `Outbound`, `Warmup`, `Outbox` |
| **Source** | `lang/fr.json:58` `"nav.crm.leads": "Leads"` vs `:124` `"Leads": "Pistes"` |
| **Proposed FR** | `nav.crm.leads` → « Pistes » (same as `Leads`). Optional: `nav.outbound.title` → « Outbound » is a product name — flag only; `Warmup` → « Chauffe », `Outbox` → « Boîte d’envoi ». |

#### T-S-02 — `Amount (DZD)` shared with Quotes — **P1** · shared lang

See T-D-15. **Conflict:** changing `lang/fr.json` value to « Montant (DA) » without a new key still leaves the English key saying DZD (visible if a locale misses the entry). New key `Amount (DA)` in all three files; migrate Deals + Quotes call sites together.

#### T-S-03 — `You're all caught up.` is overloaded — **P1** · shared lang

Used by: Inbox no-selection (T-I-01), Inbox folder empty (T-I-02), Inbox global empty variants, `guided-actions.tsx` (Home). **Inbox agent must add new keys.** Do not change the dashboard meaning in the same edit.

#### T-S-04 — Missing keys that must land in **fr + en + ar together** — **P1** · shared lang

I18nFoundationTest requires **identical key sets**. Adding a key in one file only will fail CI.

| Key | Needed by |
|---|---|
| `Open full` | QuickRecord |
| `Quick record` | QuickRecord a11y |
| `Associations` | QuickRecord tab |
| `Inspect :label` | List peek aria (`Inspect :title` already exists) |
| `Move to stage` | Board card menu |
| `No activity for :count day` / `No activity for :count days` | Board cards |
| `Loading` | Drawer skeleton |
| `Select :id` | Bulk bar |
| `Peek` | Inbox context |
| `Contact owner` / `Deal owner` | Inbox context |
| `Loading context` / `CRM context failed` / `No CRM contact linked` / `This conversation has no CRM contact to show.` / `Select a deal to inspect. Nothing is marked primary.` / `View activity` / `Create activity` / `Next activity` | Inbox context |
| `Instagram` / `Replies` | Inbox channel / adapters |
| Board-options strings (T-D-01) | Deals board |
| `Pick a conversation from the list.` | Inbox (T-I-01) |
| `Amount (DA)` | Deals + Quotes |

#### T-S-05 — AR Inbox/embed strings are English/French mash — **P2** · shared lang

Examples (`lang/ar.json`):

- `1461` `Showing the CRM inbox…` → `Showing CRM صندوق الوارد. Desk stays تشغيل هذا host.`
- `1467` embed/ops sentence still English tokens
- `661` `My Inbox` → `My صندوق الوارد`

Not all appear on Wave 2, but T-I-07’s AR path does. Inbox agent + lang owner: rewrite those values as real Arabic, keep `:placeholders`.

#### T-S-06 — `Contacts` / `Pipeline` FR loanwords — **P3** · shared lang

`nav.crm.contacts` = `Contacts` (FR also uses « Contacts » commercially). `Pipeline` stays `Pipeline`. Record only; do not churn unless PO wants « Contacts » → « Fiches » (not recommended).

---

### 5.4 User-generated — report only, NEVER modify

| ID | Where | What | Why not to touch |
|---|---|---|---|
| U-01 | Deals list/board/QR | Titles (`Oran lab CRM demo`, `Annaba hospital intake`…) | Seeded deal names |
| U-02 | Inbox list/thread | Bodies (`Salam, je veux un devis…`, `Besoin WhatsApp Cloud officiel seulement`, `Click-to-WA`) | Customer/agent messages. « WhatsApp Cloud » here is **not** system copy |
| U-03 | Inbox / deals | Contact & company names (`Amine Benali`, `Clinique El Djazair`) | CRM records |
| U-04 | Inbox composer | Whatever the agent types | User input |

Stage **slugs** stay English in the API. Display must go through `stageLabel` (T-D-18). Raw `stage_name` “New” on the drawer is a **system** bug, not a request to rename the seed.

---

## 6. Shared lang-file conflicts (do not double-edit)

| Key / area | Owners who would touch it | Collision |
|---|---|---|
| `Amount (DZD)` | Deals + Quotes + lang | One FR value change hits Quotes. Prefer new `Amount (DA)` + dual migrate |
| `You're all caught up.` | Inbox + Home `guided-actions` | Inbox must **fork** keys; do not rewrite the dashboard sentence |
| `Open full` vs `Open full record` | Deals QuickRecord | Only the long form exists today |
| `Inspect :label` vs `Inspect :title` | Deals list | Only `:title` exists |
| `Next` | Inbox context + pagination | FR « Suiv. » is wrong in CRM context |
| `Pipeline` | Deals forecast + switcher + nav | Loanword; one value everywhere |
| `nav.crm.leads` vs `Leads` | Shell + Leads page | FR `Leads` vs `Pistes` |
| Embed reason keys | Inbox + `DeskEmbedProbe` `__()` | Must stay the **English** key on the wire (T-I-22) |
| New keys (T-S-04) | Whoever implements first | Add to **fr, en, and ar in the same commit** or I18nFoundationTest fails |

**Recommended split**

1. **Lang PR / shared commit first:** T-S-04 keys + `Amount (DA)` + Inbox empty-state keys + AR embed rewrite.  
2. **Deals agent:** `t()` Board options, `formatDate` on cards, `stageLabel` + `t()` in `deal.ts`, `t('Import')`, create-deal key swap.  
3. **Inbox agent:** new empty-state keys, hide CSP soup, `t()` channel labels, context keys, stop `__()`+`t()` double translate.

Do not have Deals and Inbox both rewrite `You're all caught up.` or `Amount (DZD)` on the same day without a listed owner.

---

## 7. What is already good (do not “fix”)

- List amounts: `220 000 DA` via `formatDzd` (TRUST-02 call site on the grid is correct).
- Forecast totals: DA, narrow-space groups.
- Inbox thread clock: `06:04` 24h + `7 oct.` via `evo/inbox/format.ts` + `Africa/Algiers`.
- Message statuses `envoyé` / `reçu` for known enums.
- Composer / note chrome: « Répondre », « Note », « Saisissez votre message », « Ajouter une note », « Note privée ».
- Simple Mode nav: Accueil / Boîte de réception / Affaires / Devis — French.
- AR list/inbox: `dir=rtl`, rail on the right.
- Attention queue label « Aucune prochaine action » + reason « Cette affaire ouverte n’a pas d’action planifiée » — translated.

---

## 8. Evidence index

All files under `artifacts/product-rebuild/02-wave/trust/`.

| File | Locale | Route / state |
|---|---|---|
| `fr__deals-list.png` | FR | `/crm/deals` — Import + DA amounts + attention |
| `fr__deals-create.png` | FR | Create drawer — Montant (DZD), mm/dd/yyyy |
| `fr__deals-quickrecord.png` | FR | Peek — Open full, Associations, English labels |
| `fr__deals-board.png` | FR | Board — October dates, DA, forecast |
| `fr__deals-board-options.png` | FR | Board options — English drawer |
| `fr__deals-board-quickrecord.png` | FR | Board peek |
| `fr__inbox-list.png` | FR | `/inbox` — caught-up lie + CSP banner + 8 threads |
| `fr__inbox-thread.png` | FR | Thread + composer + context (Contact owner, Peek) |
| `fr__inbox-note.png` | FR | Internal note |
| `fr__inbox-context.png` | FR | Context toggle / note (context already open on thread shot) |
| `fr__inbox-folder-closed.png` | FR | Closed folder — still « Vous êtes à jour » |
| `fr__inbox-desk-embed.png` | FR | Seeded Desk URL — same CSP banner |
| `fr__deals-shell-fullmode.png` | FR | Full Mode — Leads / Outbound / Warmup / Outbox |
| `en__deals-*.png` / `en__inbox-*.png` | EN | Same matrix |
| `ar__deals-*.png` / `ar__inbox-*.png` | AR | RTL + Import leftover + FR CSP leak + caught-up |

---

## 9. Acceptance for the implementing agents

A finding is closed only when:

1. FR default no longer shows the English/tech string (screenshot).
2. EN and AR have the **same new keys** (Pest `I18nFoundationTest`).
3. User-generated bodies/titles are unchanged.
4. Money still prints `DA` (not `DZD`); dates use `format.ts` + `Africa/Algiers`.
5. Shared keys listed in §6 are migrated once, with the named owner.

**Gate:** this audit is GO for Wave 2 implementation. No product code on this branch.
