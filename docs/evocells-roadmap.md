# EvoCells HubSpot Depth Scorecard

**Production baseline:** commit `0304154` (pre-EvoCells) → **`9a17fd0`** on `main` (EvoCells 1–6, merged 2026-08-24).

**Omega target:** ≥95 composite on M1–M11, ≥105 on moat dimensions (M7, M8, M12, M13).

---

## Merge note (PR stack)

EvoCells shipped as **six stacked feature branches** but landed on `main` through a **single merge commit**:

| What happened | Detail |
|---------------|--------|
| Real merge on `main` | [PR #50](https://github.com/Mohamedbeghanem/EvoSales/pull/50) only → merge commit `9a17fd0` |
| GitHub “merged” PRs #45–#49 | Commits were already ancestors of #50; GitHub closed them when #50 merged — **not** five separate merges |
| Feature commits on `main` | `f161a4d` (Cell 1) … `c6ce018` (CI fixes) — linear stack inside #50 |

Going forward: one EvoCell = one branch off latest `main`, one merge each (see plan rule #1).

---

## Dimension scorecard (post-audit, `main` @ `9a17fd0`)

Scores are **HubSpot Sales/Service Hub parity** (0–100). Moat dimensions may exceed 100 when EvoSales is ahead.

| Dim | Baseline (Cell 0) | After EvoCells 1–6 | Omega | Δ | Evidence / remaining gap |
|-----|-------------------|---------------------|-------|---|--------------------------|
| **M1** Core CRM | 88 | **94** | 98 | +6 | Hubs, associations, DZD commerce, deal splits — no enterprise object model |
| **M2** Lists & views | 62 | **88** | 95 | +26 | Shared views (`private`/`team`/`workspace`), FilterBuilder, extended operators — no calculated list columns |
| **M3** Pipelines & forecast | 72 | **87** | 95 | +15 | Stage CRUD/reorder, weighted forecast, AI band — no validated revenue intelligence |
| **M4** Record UX | 68 | **82** | 92 | +14 | Server `record_layouts` + workspace-default API — no admin layout UI |
| **M5** Segments | 70 | **84** | 90 | +14 | FilterBuilder groups, behavior filters, `SegmentMatcher` — no `segment.exited` |
| **M6** Workflows | 42 | **78** | 85 | +36 | Delays queue, 6 triggers, 8 actions, quiet hours — no visual canvas / multi-step chains |
| **M7** Sequences | 78 | **92** | **105** | +14 | A/B subjects, call/meeting steps, reply pause, warmup moat — funnel not EvoViz; SMS N/A here |
| **M8** Inbox | 74 | **76** | **102** | +2 | Email/desk/WA strong; SMS stub only; no live-chat widget |
| **M9** Reporting | 58 | **78** | 88 | +20 | Calculated props, report builder, cross-object wilaya report, scheduled email stub |
| **M10** AI | 28 | **65** | 80 | +37 | RAG-lite Ask Evo, engagement score, forecast band — not Breeze-class vector RAG |
| **M11** Admin/permissions | 45 | **70** | 90 | +25 | `users.permissions`, dashboard sharing, team deal scope — no full RBAC UI |
| **M12** Integrations/ads | 82 | **93** | **110** | +11 | Native Meta funnel + segment → Custom Audience sync |
| **M13** Regional DZ | 95 | **95** | **120** | 0 | Wilaya, DZD, Algiers TZ, AR/FR prompts — moat preserved |

### Composite

| Metric | Value |
|--------|-------|
| **M1–M11 average** | **~81** |
| **Previous doc claim** | ~94–96 (optimistic; counted backend without UI/deployment gaps) |
| **Omega gate (≥95)** | **Not met** — largest gaps: M6 canvas, M8 SMS/live chat, M10 AI depth |

Moat headline: **M7 92**, **M12 93** — ahead on owned outbound + Meta native funnel; **M8 76** — not yet at 105.

---

## Workflow parity map

| Workflow | HubSpot reference | Cell | Status | Notes |
|----------|-------------------|------|--------|-------|
| A Lead → won deal | Sales pipeline | 4, 5 | **Partial** | Calculated fields + forecast band; no 15% backtest |
| B List → sequence → track | Sequences | 2, 3 | **Mostly done** | Behavior enroll, A/B, reply pause; basic step funnel |
| C Team saved view | List views | 1 | **Done** | Workspace/team visibility, wired FilterBuilder |
| D Pipeline admin | Pipeline settings | 1 | **Done** | Stage CRUD, reorder, safe delete |
| E Deal automation | Operations Hub | 2 | **Mostly done** | Backend + form UI for delays/triggers/actions |
| F Weekly reporting | Custom reports | 5 | **Partial** | Saved reports + schedule stub; not arbitrary SQL |
| G Inbox → record | Conversations | 6 | **Partial** | WA/email; SMS stub |
| H Ask AI | Breeze | 4 | **Partial** | Keyword RAG + heuristics; not full context |

---

## Exit criteria checklist

| Cell | Criterion | Met |
|------|-----------|-----|
| 1 | Teammate sees admin-published view | ✅ |
| 1 | Complex filter count correct | ✅ |
| 1 | Stage reorder updates kanban | ✅ |
| 1 | Layout survives new browser | ✅ |
| 2 | Delayed automation without manual action | ✅ |
| 3 | Step drop-off visible | ⚠️ Text funnel only |
| 3 | A/B winner after N sends | ✅ |
| 3 | Reply auto-pauses enrollment | ✅ |
| 4 | Ask Evo uses timeline context | ⚠️ Keyword RAG |
| 4 | Forecast within 15% backtest | ❌ |
| 5 | Cross-object chart without code | ⚠️ One wilaya report |
| 6 | Segment → Meta audience | ✅ (needs Meta creds) |
| 6 | Team-scoped deals | ✅ |

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

---

## Deploy checklist (Server 1)

```bash
cd /home/deploy/evosales
git pull origin main   # expect 9a17fd0+
php artisan migrate --force
npm ci && npm run build
docker compose build web && docker compose up -d web
php artisan test --filter=EvoCell
curl -sf https://crm.evotechly.com/up
```

**Moats preserved:** owned SMTP/warmup, Meta Ads funnel, WhatsApp Cloud, wilaya/DZD, self-hosted stack.

---

## Next work toward Omega

1. **M6** — Visual workflow list with delay preview; optional read-only canvas v1
2. **M8** — Twilio/DZ SMS send path; live-chat routing config
3. **M10** — Activity-index RAG or LLM key rollout; forecast backtest
4. **M9** — Scheduled reports attach real report output; arbitrary dimension picker
5. **M4** — Settings UI for workspace-default record layouts
