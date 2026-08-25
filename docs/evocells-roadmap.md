# EvoCells HubSpot Depth Scorecard

**Production baseline:** commit `0304154` (pre-EvoCells) → **`3c271d8`** on `main` (EvoCells 1–6 + HubSpot chrome, 2026-08-24) → **`d139f6e`** on `cursor/hubspot-gap-remaining-waves-fd45` (Waves 1–5, 2026-08-25).

**Full side-by-side audit:** [hubspot-side-by-side.md](./hubspot-side-by-side.md) · [scores](./hubspot-parity-comparison.md)

**Omega target:** ≥95 composite on M1–M11, ≥105 on moat dimensions (M7, M8, M12, M13).

---

## Merge note (PR stack)

EvoCells shipped as **six stacked feature branches** but landed on `main` through a **single merge commit**:

| What happened | Detail |
|---------------|--------|
| Real merge on `main` | [PR #50](https://github.com/Mohamedbeghanem/EvoSales/pull/50) only → merge commit `9a17fd0` |
| GitHub “merged” PRs #45–#49 | Commits were already ancestors of #50; GitHub closed them when #50 merged — **not** five separate merges |
| Feature commits on `main` | `f161a4d` (Cell 1) … `c6ce018` (CI fixes) — linear stack inside #50 |
| Evidence-based scorecard | [PR #51](https://github.com/Mohamedbeghanem/EvoSales/pull/51) → `2726c0d` |
| HubSpot chrome on production | `6b1f65c` → `4f0a31a` → `3c271d8` (500 fixes) |

Going forward: one EvoCell = one branch off latest `main`, one merge each (see plan rule #1).

---

## Dimension scorecard (`d139f6e`, 2026-08-25)

Scores are **HubSpot Sales/Service Hub parity** (0–100). Moat dimensions may exceed 100 when EvoSales is ahead.

| Dim | @ `9a17fd0` | @ `3c271d8` | @ `d139f6e` | Omega | Δ vs chrome | Evidence / remaining gap |
|-----|-------------|-------------|-------------|-------|-------------|--------------------------|
| **M1** Core CRM | 94 | 94 | **96** | 98 | +2 | Lead convert, quote send/accept, import/merge — no tickets/custom objects |
| **M2** Lists & views | 88 | 85 | **90** | 95 | +5 | FilterBuilder + columns + bulk + import on chrome; no calculated list columns |
| **M3** Pipelines & forecast | 87 | 87 | **90** | 95 | +3 | List+board pipeline switcher, wired forecast/health — no 15% backtest |
| **M4** Record UX | 82 | 84 | **90** | 92 | +6 | Ask Evo + props on contact/deal/company; layouts settings; no playbooks |
| **M5** Segments | 84 | 84 | **88** | 90 | +4 | `segment.exited`; membership history still deleted on exit |
| **M6** Workflows | 78 | 78 | **80** | 85 | +2 | 7 triggers, 8 actions — no visual canvas |
| **M7** Sequences | 92 | 92 | **93** | **105** | +1 | Bounce webhook + suppression; no SMS/LinkedIn steps |
| **M8** Inbox | 76 | 76 | **76** | **102** | 0 | Email/desk/WA; SMS stub; no Laravel live chat |
| **M9** Reporting | 78 | 78 | **85** | 88 | +7 | Real scheduled HTML delivery; no SQL explorer |
| **M10** AI | 65 | 60 | **72** | 80 | +12 | Ask Evo/health/engagement rendered; keyword RAG, not Breeze agents |
| **M11** Admin/permissions | 70 | 70 | **80** | 90 | +10 | Permission matrix + health; no SAML/audit log |
| **M12** Integrations/ads | 93 | 93 | **96** | **110** | +3 | Gmail/Calendar sync + tenant webhooks; no marketplace |
| **M13** Regional DZ | 95 | 95 | **95** | **120** | 0 | Wilaya, DZD, Algiers TZ, AR/FR prompts |
| **M14** Visual chrome | ~62 | 79 | **84** | 90 | +5 | Hub split-panel retired; leads still a second pattern |

### Composite

| Metric | @ `9a17fd0` | @ `3c271d8` | @ `d139f6e` |
|--------|-------------|-------------|-------------|
| **M1–M11 average** | **~81** | **~81** | **~85** |
| **M14 Visual chrome** | ~62 | **~79** | **~84** |
| **Omega gate (≥95)** | **Not met** | **Not met** | **Not met** |

Waves 1–5 closed the chrome-wiring gap that kept the 2026-08-24 composite flat. Omega is still out of reach because tickets/custom objects, canvas, SMS/live chat, SSO, and Breeze-scale AI remain deferred.

Moat headline: **M7 93**, **M12 96** — owned outbound + Meta funnel + Google timeline sync; **M8 76** — not yet at 105.

---

## Visual chrome (post-`6b1f65c`)

| Surface | Component / route | HubSpot parity | Notes |
|---------|-------------------|----------------|-------|
| Sidebar | `app-sidebar.tsx` | ~85% | Primary nav + pinned More drawer |
| List chrome | `CrmListShell` → contacts/deals/companies `index` | ~88% | FilterBuilder, columns, saved views, bulk, export |
| Record chrome | `record-chrome.tsx` → contacts/deals/companies `show` | ~86% | 3-column + Ask Evo + properties; deal commerce mounted |
| Home | `home.tsx` `/dashboard` | ~80% | Command center + EvoViz |
| Desk | `desk/inbox.tsx` | ~75% | Embed + native fallback in shell |
| Stage pills | `stage-pills.tsx` on deals list | ~90% | Counts per stage |

**Screenshot QA checklist:** see [hubspot-parity-comparison.md § Screenshot-worthy QA checklist](./hubspot-parity-comparison.md#screenshot-worthy-qa-checklist).

---

## Workflow parity map

| Workflow | HubSpot reference | Cell | Status | Notes |
|----------|-------------------|------|--------|-------|
| A Lead → won deal | Sales pipeline | 4, 5 | **Mostly done** | Conversion + quote accept; no 15% forecast backtest |
| B List → sequence → track | Sequences | 2, 3 | **Mostly done** | Behavior enroll, A/B, reply pause, bounces |
| C Team saved view | List views | 1 | **Done** | Chrome FilterBuilder + save-view + columns |
| D Pipeline admin | Pipeline settings | 1 | **Done** | Stage CRUD, reorder, list+board switcher |
| E Deal automation | Operations Hub | 2 | **Mostly done** | 7 triggers including segment exit; no canvas |
| F Weekly reporting | Custom reports | 5 | **Mostly done** | Saved reports + real HTML cron delivery |
| G Inbox → record | Conversations | 6 | **Partial** | WA/email; SMS stub |
| H Ask AI | Breeze | 4 | **Partial** | Ask Evo on records; keyword RAG, not agents |

---

## Exit criteria checklist

| Cell | Criterion | Met |
|------|-----------|-----|
| 1 | Teammate sees admin-published view | ✅ |
| 1 | Complex filter count correct | ✅ chrome `FilterBuilder` on contacts/deals/companies |
| 1 | Stage reorder updates kanban | ✅ |
| 1 | Layout survives new browser | ✅ |
| 2 | Delayed automation without manual action | ✅ |
| 3 | Step drop-off visible | ⚠️ Text funnel only |
| 3 | A/B winner after N sends | ✅ |
| 3 | Reply auto-pauses enrollment | ✅ |
| 4 | Ask Evo uses timeline context | ⚠️ Keyword RAG; now rendered on chrome show |
| 4 | Forecast within 15% backtest | ❌ |
| 5 | Cross-object chart without code | ⚠️ One wilaya report |
| 6 | Segment → Meta audience | ✅ (needs Meta creds) |
| 6 | Team-scoped deals | ✅ |
| Chrome | HubSpot shell on Home/CRM/Desk | ✅ |
| Chrome | Feature parity on chrome vs hub | ✅ FilterBuilder / Ask Evo / properties on primary routes |

---

## PR / branch map

| Cell | Branch | PR | On `main` via |
|------|--------|-----|---------------|
| 1 Team CRM | `cursor/evocell-1-team-crm-91cb` | #45 | #50 stack |
| 2 Automation | `cursor/evocell-2-automation-spine-91cb` | #46 | #50 stack |
| 3 Sequences | `cursor/evocell-3-sequences-depth-91cb` | #47 | #50 stack |
| 4 AI | `cursor/evocell-4-ai-layer-91cb` | #48 | #50 stack |
| 5 Analytics | `cursor/evocell-5-analytics-91cb` | #49 | #50 stack |
| 6 Omni | `cursor/evocell-6-omni-permissions-91cb` | #50 | **#50 merge** |
| Scorecard redo | `cursor/fix-evocell-merge-comparison-91cb` | #51 | Direct merge |
| HubSpot chrome | `cursor/hubspot-chrome-port-91cb` | — | Cherry-pick to main |
| Gap Waves 1–5 | `cursor/hubspot-gap-remaining-waves-fd45` | #92 | Pending (includes #88/#91 stack) |
| Scorecard redo 2026-08-25 | same branch | #92 | This audit (`d139f6e`+) |

---

## Deploy checklist (Server 1)

```bash
cd /home/deploy/evosales
git pull origin main   # expect 3c271d8+
php artisan migrate --force
npm ci && npm run build
docker compose build web && docker compose up -d web
php artisan test --filter=EvoCell
curl -sf https://crm.evotechly.com/up
```

**Moats preserved:** owned SMTP/warmup, Meta Ads funnel, WhatsApp Cloud, wilaya/DZD, self-hosted stack.

---

## Next work toward Omega

1. **M3 + M10** — Forecast band backtest within 15% on historical deals
2. **M8** — Twilio/DZ SMS send path (live chat stays EvoDesk)
3. **M6** — Optional read-only workflow canvas v1
4. **M2** — Calculated columns and deeper association filters
5. **M4** — Playbooks on records
6. **M11** — Login/audit trail; SAML remains deferred
7. **M5** — Segment membership history (exit is an event today)

See [Top remaining gaps](./hubspot-parity-comparison.md#top-remaining-gaps-toward-omega-95-composite) for the full list.
