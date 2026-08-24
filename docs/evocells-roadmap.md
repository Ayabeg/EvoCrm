# EvoCells HubSpot Depth Scorecard

**Production baseline:** commit `0304154` (pre-EvoCells) → **`3c271d8`** on `main` (EvoCells 1–6 + HubSpot chrome + 500 fixes, 2026-08-24).

**Full side-by-side audit:** [hubspot-parity-comparison.md](./hubspot-parity-comparison.md)

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

## Dimension scorecard (`main` @ `3c271d8`)

Scores are **HubSpot Sales/Service Hub parity** (0–100). Moat dimensions may exceed 100 when EvoSales is ahead.

| Dim | @ `9a17fd0` | @ `3c271d8` | Omega | Δ | Evidence / remaining gap |
|-----|-------------|-------------|-------|---|--------------------------|
| **M1** Core CRM | 94 | **94** | 98 | 0 | Hubs, associations, DZD commerce, deal splits — no enterprise object model |
| **M2** Lists & views | 88 | **85** | 95 | −3 | Chrome index lacks FilterBuilder / persisted columns; backend + hub components intact |
| **M3** Pipelines & forecast | 87 | **87** | 95 | 0 | Stage CRUD/reorder, weighted forecast, AI band — no validated revenue intelligence |
| **M4** Record UX | 82 | **84** | 92 | +2 | Record chrome landed; Ask Evo + custom props not on new show pages |
| **M5** Segments | 84 | **84** | 90 | 0 | FilterBuilder groups, behavior filters, `SegmentMatcher` — no `segment.exited` |
| **M6** Workflows | 78 | **78** | 85 | 0 | Delays queue, 6 triggers, 8 actions, quiet hours — no visual canvas |
| **M7** Sequences | 92 | **92** | **105** | 0 | A/B subjects, call/meeting steps, reply pause, warmup moat |
| **M8** Inbox | 76 | **76** | **102** | 0 | Email/desk/WA strong; SMS stub; no live-chat widget |
| **M9** Reporting | 78 | **78** | 88 | 0 | Calculated props, report builder, cross-object wilaya report, scheduled email stub |
| **M10** AI | 65 | **60** | 80 | −5 | Service deep; new record pages don't render Ask Evo / engagement UI |
| **M11** Admin/permissions | 70 | **70** | 90 | 0 | `users.permissions`, dashboard sharing — no full RBAC UI |
| **M12** Integrations/ads | 93 | **93** | **110** | 0 | Native Meta funnel + segment → Custom Audience sync |
| **M13** Regional DZ | 95 | **95** | **120** | 0 | Wilaya, DZD, Algiers TZ, AR/FR prompts |
| **M14** Visual chrome | ~62 | **79** | 90 | +17 | Sidebar, list/record chrome, home command center — dual UI with legacy hub |

### Composite

| Metric | @ `9a17fd0` | @ `3c271d8` |
|--------|-------------|-------------|
| **M1–M11 average** | **~81** | **~81** |
| **M14 Visual chrome** | ~62 | **~79** |
| **Omega gate (≥95)** | **Not met** | **Not met** |

Chrome improved **look-and-feel (+17 M14)** but functional composite is flat: list/record feature wiring lagged the UI port.

Moat headline: **M7 92**, **M12 93** — ahead on owned outbound + Meta native funnel; **M8 76** — not yet at 105.

---

## Visual chrome (post-`6b1f65c`)

| Surface | Component / route | HubSpot parity | Notes |
|---------|-------------------|----------------|-------|
| Sidebar | `app-sidebar.tsx` | ~85% | Primary nav + pinned More drawer |
| List chrome | `list-chrome.tsx` → contacts/deals/companies `index` | ~82% | Header tabs, toolbar, drawer create, export footer |
| Record chrome | `record-chrome.tsx` → contacts/deals `show` | ~78% | 3-column layout; missing AI rail |
| Home | `home.tsx` `/dashboard` | ~80% | Command center + EvoViz |
| Desk | `desk/inbox.tsx` | ~75% | Embed + native fallback in shell |
| Stage pills | `stage-pills.tsx` on deals list | ~90% | Counts per stage |

**Screenshot QA checklist:** see [hubspot-parity-comparison.md § Screenshot-worthy QA checklist](./hubspot-parity-comparison.md#screenshot-worthy-qa-checklist).

---

## Workflow parity map

| Workflow | HubSpot reference | Cell | Status | Notes |
|----------|-------------------|------|--------|-------|
| A Lead → won deal | Sales pipeline | 4, 5 | **Partial** | Calculated fields + forecast band; no 15% backtest |
| B List → sequence → track | Sequences | 2, 3 | **Mostly done** | Behavior enroll, A/B, reply pause; basic step funnel |
| C Team saved view | List views | 1 | **Mostly done** | Workspace views work; chrome index missing save/filter UI |
| D Pipeline admin | Pipeline settings | 1 | **Done** | Stage CRUD, reorder, safe delete |
| E Deal automation | Operations Hub | 2 | **Mostly done** | Backend + form UI for delays/triggers/actions |
| F Weekly reporting | Custom reports | 5 | **Partial** | Saved reports + schedule stub; not arbitrary SQL |
| G Inbox → record | Conversations | 6 | **Partial** | WA/email; SMS stub |
| H Ask AI | Breeze | 4 | **Partial** | Service ready; chrome show pages don't render panel |

---

## Exit criteria checklist

| Cell | Criterion | Met |
|------|-----------|-----|
| 1 | Teammate sees admin-published view | ✅ |
| 1 | Complex filter count correct | ✅ (hub/ListToolbar; not on chrome index) |
| 1 | Stage reorder updates kanban | ✅ |
| 1 | Layout survives new browser | ✅ |
| 2 | Delayed automation without manual action | ✅ |
| 3 | Step drop-off visible | ⚠️ Text funnel only |
| 3 | A/B winner after N sends | ✅ |
| 3 | Reply auto-pauses enrollment | ✅ |
| 4 | Ask Evo uses timeline context | ⚠️ Keyword RAG; UI not on chrome show |
| 4 | Forecast within 15% backtest | ❌ |
| 5 | Cross-object chart without code | ⚠️ One wilaya report |
| 6 | Segment → Meta audience | ✅ (needs Meta creds) |
| 6 | Team-scoped deals | ✅ |
| Chrome | HubSpot shell on Home/CRM/Desk | ✅ |
| Chrome | Feature parity on chrome vs hub | ❌ |

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

1. **M2 + M14** — Wire `FilterBuilder` + persisted `ColumnChooser` onto chrome `index` pages; retire or merge hub split-panel
2. **M4 + M10** — Render Ask Evo, engagement, custom properties on `show` pages
3. **M6** — Visual workflow list with delay preview; optional read-only canvas v1
4. **M8** — Twilio/DZ SMS send path; live-chat routing config
5. **M10** — Activity-index RAG or LLM key rollout; forecast backtest
6. **M9** — Scheduled reports attach real report output
7. **M11** — Permission matrix settings UI
8. **Tests** — Realign `CrmSavedViewTest` to `index` components

See [Top 10 gaps](./hubspot-parity-comparison.md#top-10-gaps-to-close-for-omega-95-composite) for full prioritized list.
