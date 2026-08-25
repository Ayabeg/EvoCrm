# Evotechly CRM — Full Building Stack

Meta-playbook for Cloud Agents building features on **crm.evotechly.com** (Laravel 13 + Inertia 3 + React). Read this first, then invoke the phase-specific skill listed for your task.

**Skill inventory:** 37 skills in `.agents/skills/` tracked by `skills-lock.json` at repo root.

---

## How to use this stack

```
User request
    │
    ├─ Ambiguous / greenfield? ──────────────→ Phase: Define
    ├─ Needs layout / charts / visual design? → Phase: Design
    ├─ Writing code? ────────────────────────→ Phase: Build
    ├─ Tests / QA / broken behavior? ──────→ Phase: Verify
    └─ Deploy / monitor / launch? ───────────→ Phase: Ship
```

Within each phase, **read the skill's SKILL.md fully** before acting. Chain skills in order — do not skip Define when requirements are unclear, and do not skip Design when building dashboards or record pages.

**Evotechly constraints (always apply):**
- Brand orange: `#EC6025` (`--evosales-mark`, `--color-primary`). See `docs/brandbook/` and `resources/css/app.css`.
- Palette: white/black/orange only — no invented accent colors.
- Typography: Geist Sans via `--font-sans`.
- Existing shells: `CrmListShell`, `record-chrome`, `EvoKpiCard`, `EvoVizChart`, `ask-evo-panel`.
- Chart runtime: custom `EvoVizChart` (`resources/js/evoviz/`) — not Chart.js in production, but chart-designer configs translate cleanly.

---

## Phase: Define

Clarify *what* to build before *how*.

| Skill | Path | When to use |
|-------|------|-------------|
| **interview-me** | `.agents/skills/interview-me/` | Vague request, missing stakeholders, unknown success criteria. Runs structured Q&A. |
| **idea-refine** | `.agents/skills/idea-refine/` | Rough concept exists; need variants, trade-offs, or scope options. Includes `frameworks.md`, `refinement-criteria.md`. |
| **spec-driven-development** | `.agents/skills/spec-driven-development/` | Requirements are clear enough to write a spec: user stories, acceptance criteria, edge cases. |

**Outputs:** Problem statement, audience, KPIs/metrics definitions, acceptance criteria, file/module touch list.

**CRM examples:**
- "Improve reports" → **interview-me** (who views reports? daily vs weekly? which modules?)
- "Add pipeline forecast" → **idea-refine** (kanban column totals vs time-series forecast vs both)
- "Build multi-dashboard reporting" → **spec-driven-development** (dashboard CRUD, widget catalog, permissions)

---

## Phase: Design

Decide information architecture, visual hierarchy, and chart types before implementation.

### Taste & brand (general UI)

| Skill | Path | When to use |
|-------|------|-------------|
| **design-taste-frontend** | `.agents/skills/design-taste-frontend/` | Default high-end UI polish for React pages. |
| **brandkit** | `.agents/skills/brandkit/` | Apply Evotechly tokens, logo rules, color discipline. |
| **minimalist-ui** | `.agents/skills/minimalist-ui/` | Dense CRM lists, settings, admin surfaces. |
| **redesign-existing-projects** | `.agents/skills/redesign-existing-projects/` | Refactoring legacy pages (hub chrome → record-chrome). |
| **stitch-design-taste** | `.agents/skills/stitch-design-taste/` | Multi-screen flows with consistent spacing/rhythm. |

### Charts & dashboards (data UI)

| Skill | Path | When to use | Key dependencies / assumptions |
|-------|------|-------------|----------------------------------|
| **dashboard-designer** | `.agents/skills/dashboard-designer/` | KPI selection, F-pattern layout, audience archetypes (strategic/operational/analytical), color coding rules, BI tool choice. **Design only — no code.** | References chart-builder/sql-analyst (not installed). Maps to EvoViz + EvoKpiCard in this repo. |
| **chart-designer** | `.agents/skills/chart-designer/` | Pick chart type (bar, line, funnel, gauge), generate ECharts/Chart.js configs, color palettes, decision tree. | Optional MCP: `office-mcp` (create_chart, read_xlsx) — not required. Output configs → adapt to `EvoVizPayload`. |
| **interactive-dashboard-builder** | `.agents/skills/interactive-dashboard-builder/` | Self-contained HTML/JS prototypes with Chart.js 4.5, filters, KPI cards, sortable tables. | CDN Chart.js + date-fns adapter. Use for **prototypes**; production uses Inertia + EvoViz. Patterns (filter bar, KPI row, chart grid) port directly. |

**Design phase order for dashboards:**
1. **dashboard-designer** — audience, KPI tiers, layout wireframe
2. **chart-designer** — chart type per metric, configs, color mapping to `#EC6025`
3. **brandkit** + **design-taste-frontend** — map to Tailwind tokens, `EvoKpiCard`, `EvoVizChart`
4. *(optional)* **interactive-dashboard-builder** — static HTML proof for stakeholder review

**Chart → EvoViz mapping:**

| chart-designer type | EvoViz chart kind | CRM usage |
|--------------------|-------------------|-----------|
| Line / area | `line`, `area` | Revenue trend, activity over time |
| Bar / grouped bar | `bar` | Rep performance, source breakdown |
| Donut / pie (≤5) | `donut` | Stage mix, deal outcome split |
| Funnel | custom / `FunnelStageBoard` | Conversion funnels (`/reports/funnels`) |
| Gauge | KPI card + hint | Quota attainment, win rate vs target |
| Heatmap | table or future viz | Activity by day/hour |

**Evotechly chart colors:** Use `--color-chart-1` … `--color-chart-5` from `app.css`; primary series `#EC6025`, context series neutral grays (`--evosales-mute`).

---

## Phase: Build

Implement incrementally against the spec and design artifacts.

| Skill | Path | When to use |
|-------|------|-------------|
| **planning-and-task-breakdown** | `.agents/skills/planning-and-task-breakdown/` | Spec exists; decompose into ordered tasks. |
| **incremental-implementation** | `.agents/skills/incremental-implementation/` | Default implementation loop: small commits, one concern at a time. |
| **frontend-ui-engineering** | `.agents/skills/frontend-ui-engineering/` | React/Inertia pages, components, Tailwind, accessibility. |
| **api-and-interface-design** | `.agents/skills/api-and-interface-design/` | Laravel controllers, form requests, API resources, Inertia props. |
| **source-driven-development** | `.agents/skills/source-driven-development/` | Framework APIs (Laravel 13, Inertia 3) — read `node_modules/next/dist/docs/` equivalent / official docs before coding. |
| **context-engineering** | `.agents/skills/context-engineering/` | Large features; curate what the agent reads. |
| **doubt-driven-development** | `.agents/skills/doubt-driven-development/` | High-stakes or unfamiliar subsystems. |

**CRM module map:**

| Module | Routes / pages | Shell / components |
|--------|----------------|---------------------|
| Contacts | `/crm/contacts`, `contacts/show` | `CrmListShell`, `record-chrome` |
| Companies | `/crm/companies`, `companies/show` | `CrmListShell`, `record-chrome` |
| Deals | `/crm/deals`, `deals/show` | `CrmListShell`, `record-chrome`, pipeline kanban |
| Reports | `/crm/reports` | `EvoKpiCard`, `EvoVizChart`, `WidgetPicker` |
| Funnels | `/reports/funnels` | `FunnelStageBoard`, `SourceBreakdownTable` |
| Home | `/home` | Command center KPIs + charts |
| Sequences / Desk / Outbound | respective routes | module-specific shells |

**Build conventions:**
- Lists: wrap in `CrmListShell` with filters, saved views, bulk actions.
- Record pages: `RecordShell` from `record-chrome` + tabs + `ask-evo-panel` AI rail.
- KPIs: `EvoKpiCard` with `format: 'number' | 'money'`, DZD via `formatDzd`.
- Charts: server builds `EvoVizPayload`; client renders via `EvoVizChart`.

---

## Phase: Verify

Prove correctness before merge.

| Skill | Path | When to use |
|-------|------|-------------|
| **test-driven-development** | `.agents/skills/test-driven-development/` | PHPUnit/Pest feature tests, Vitest component tests. |
| **browser-testing-with-devtools** | `.agents/skills/browser-testing-with-devtools/` | Manual QA in browser, network tab, React DevTools. |
| **debugging-and-error-recovery** | `.agents/skills/debugging-and-error-recovery/` | Failures, regressions, production errors. |
| **code-review-and-quality** | `.agents/skills/code-review-and-quality/` | Pre-PR self-review. |

**Dashboard-specific checks (from dashboard-designer checklist):**
- [ ] Chart titles state insights, not bare metric names
- [ ] Every KPI has comparison (prior period, target, or hint)
- [ ] Date range labeled; filters default to common view
- [ ] Color coding consistent; colorblind-safe (don't rely on red/green alone)
- [ ] Mobile: KPIs stack; charts single-column below 768px
- [ ] "Data as of" / window shown in footer or `PageHeader`

---

## Phase: Ship

Deploy and observe.

| Skill | Path | When to use |
|-------|------|-------------|
| **shipping-and-launch** | `.agents/skills/shipping-and-launch/` | PR, deploy checklist, rollout communication. |
| **observability-and-instrumentation** | `.agents/skills/observability-and-instrumentation/` | PostHog events, logs, error tracking for new surfaces. |
| **git-workflow-and-versioning** | `.agents/skills/git-workflow-and-versioning/` | Branch naming, commit messages, PR hygiene. |
| **ci-cd-and-automation** | `.agents/skills/ci-cd-and-automation/` | Pipeline fixes, Render deploy config. |

**Render constraints:** Bind `0.0.0.0:$PORT`, ephemeral filesystem — no local persistence.

---

## CRM-specific recipes

Each recipe lists skills **in order**. Complete each phase before the next.

### Recipe: Build Reports Dashboard

**Goal:** Extend `/crm/reports` — KPI row, category charts, customizable widget rooms.

| Step | Phase | Skill | Actions |
|------|-------|-------|---------|
| 1 | Define | **interview-me** | Who owns dashboards? Shared vs private? Widget catalog scope. |
| 2 | Define | **spec-driven-development** | Dashboard CRUD, widget types, date window, Inertia props schema. |
| 3 | Design | **dashboard-designer** | Operational archetype: 4 headline KPIs, 2 primary charts, detail table. F-pattern layout. |
| 4 | Design | **chart-designer** | Line for trends, bar for breakdowns, donut for mix — output configs. |
| 5 | Design | **brandkit** | Map to `EvoKpiCard`, `--color-chart-*`, orange for primary series. |
| 6 | Build | **api-and-interface-design** | Laravel report aggregations, `EvoVizPayload` builders, dashboard persistence. |
| 7 | Build | **frontend-ui-engineering** | `reports.tsx`, `WidgetPicker`, dialog for dashboard switcher. |
| 8 | Build | **incremental-implementation** | Ship KPI row first, then charts, then multi-dashboard. |
| 9 | Verify | **test-driven-development** | Feature tests for report queries; snapshot key KPI values. |
| 10 | Verify | **browser-testing-with-devtools** | Filter changes, dashboard switch, empty states. |
| 11 | Ship | **observability-and-instrumentation** | Track `$pageview` on `/crm/reports`, widget add/remove events. |

**Key files:** `resources/js/pages/crm/reports.tsx`, `resources/js/evoviz/`, backend report controllers.

---

### Recipe: Build Funnel Analytics

**Goal:** Conversion funnel reporting at `/reports/funnels` — stage conversion, CPL, source breakdown.

| Step | Phase | Skill | Actions |
|------|-------|-------|---------|
| 1 | Define | **spec-driven-development** | Funnel model, stage definitions, attribution window, KPI formulas (CPL, CR). |
| 2 | Design | **dashboard-designer** | Analytical archetype: spend, visits, orders, CPL, CR as headline KPIs. |
| 3 | Design | **chart-designer** | **Funnel chart** for stage drop-off; bar for source breakdown. |
| 4 | Design | **minimalist-ui** | Dense `FunnelStageBoard` + `SourceBreakdownTable`. |
| 5 | Build | **api-and-interface-design** | Funnel query API, window params (`from`, `to`, `funnel_id`). |
| 6 | Build | **frontend-ui-engineering** | `resources/js/pages/reports/funnels/index.tsx`, filter form. |
| 7 | Verify | **test-driven-development** | Stage math, edge cases (zero visits → null CPL). |
| 8 | Ship | **shipping-and-launch** | Link from sidebar (`Conversion funnels`). |

**Key files:** `resources/js/pages/reports/funnels/index.tsx`, `resources/js/components/funnels/`.

---

### Recipe: Build Contact Record Page

**Goal:** Full contact record with timeline, properties, related deals, AI rail.

| Step | Phase | Skill | Actions |
|------|-------|-------|---------|
| 1 | Define | **interview-me** | Tabs needed? Custom properties? Activity sources? |
| 2 | Define | **spec-driven-development** | Record layout spec: header fields, tab order, permissions. |
| 3 | Design | **design-taste-frontend** + **brandkit** | Record chrome: header, stage badge, action bar. |
| 4 | Design | **stitch-design-taste** | Tab rhythm, timeline density, empty states. |
| 5 | Build | **frontend-ui-engineering** | `record-chrome` components, `contacts/show.tsx`. |
| 6 | Build | **api-and-interface-design** | Eager-load relations, activity feed endpoint. |
| 7 | Build | **incremental-implementation** | Header → tabs → timeline → ask-evo-panel. |
| 8 | Verify | **browser-testing-with-devtools** | Mobile record layout, tab keyboard nav. |
| 9 | Ship | **observability-and-instrumentation** | Record view events, AI panel usage. |

**Key files:** `resources/js/pages/crm/contacts/show.tsx`, `resources/js/components/crm/record-chrome/`.

---

### Recipe: Build Kanban Pipeline View

**Goal:** Deal pipeline board — stages as columns, drag-drop, column totals, forecast.

| Step | Phase | Skill | Actions |
|------|-------|-------|---------|
| 1 | Define | **idea-refine** | Kanban vs list default; WIP limits; forecast formula. |
| 2 | Define | **spec-driven-development** | Stage model, drag-drop API, optimistic updates. |
| 3 | Design | **dashboard-designer** | Operational KPIs: pipeline value, weighted forecast, deals at risk. |
| 4 | Design | **chart-designer** | Bar for stage totals; optional gauge for quota coverage. |
| 5 | Design | **minimalist-ui** | Compact deal cards, column headers with sums. |
| 6 | Build | **frontend-ui-engineering** | Kanban board component, `@dnd-kit` or equivalent. |
| 7 | Build | **api-and-interface-design** | PATCH deal stage, pipeline aggregation queries. |
| 8 | Verify | **test-driven-development** | Stage transition authorization, sum recalculation. |
| 9 | Verify | **browser-testing-with-devtools** | Drag-drop, filter by owner, large pipeline perf. |
| 10 | Ship | **shipping-and-launch** | Feature flag or gradual rollout. |

**Key files:** `resources/js/pages/crm/deals/index.tsx`, deal pipeline backend.

---

### Recipe: Build Home Command Center KPIs

**Goal:** `/home` — at-a-glance KPIs and charts for daily CRM pulse.

| Step | Phase | Skill | Actions |
|------|-------|-------|---------|
| 1 | Define | **interview-me** | Which 3–5 KPIs matter most day-one? |
| 2 | Design | **dashboard-designer** | Strategic/operational hybrid: 4 KPIs top row, 2 charts below. |
| 3 | Design | **chart-designer** | Area for activity trend, bar for pipeline by stage. |
| 4 | Build | **frontend-ui-engineering** | `home.tsx`, `EvoKpiCard` grid, `EvoVizChart` row. |
| 5 | Build | **api-and-interface-design** | Home dashboard Inertia props, cached aggregates. |
| 6 | Verify | **browser-testing-with-devtools** | Loading states, empty workspace. |
| 7 | Ship | **observability-and-instrumentation** | Home as default landing; track engagement. |

**Key files:** `resources/js/pages/home.tsx`.

---

## Quick skill index (all 37)

### Engineering workflow (addyosmani/agent-skills)
`using-agent-skills`, `interview-me`, `idea-refine`, `spec-driven-development`, `planning-and-task-breakdown`, `incremental-implementation`, `frontend-ui-engineering`, `api-and-interface-design`, `source-driven-development`, `context-engineering`, `doubt-driven-development`, `test-driven-development`, `browser-testing-with-devtools`, `debugging-and-error-recovery`, `code-review-and-quality`, `code-simplification`, `security-and-hardening`, `performance-optimization`, `git-workflow-and-versioning`, `ci-cd-and-automation`, `deprecation-and-migration`, `documentation-and-adrs`, `observability-and-instrumentation`, `shipping-and-launch`

### Design aesthetics (Leonxlnx/taste-skill)
`design-taste-frontend`, `design-taste-frontend-v1`, `brandkit`, `minimalist-ui`, `high-end-visual-design`, `industrial-brutalist-ui`, `redesign-existing-projects`, `stitch-design-taste`, `full-output-enforcement`, `gpt-taste`, `image-to-code`, `imagegen-frontend-web`, `imagegen-frontend-mobile`

### Charts & dashboards (new)
`chart-designer`, `dashboard-designer`, `interactive-dashboard-builder`

---

## Installing / updating skills

```bash
# Chart designer
npx skills add claude-office-skills/skills --skill chart-designer

# Dashboard designer
npx skills add nickcrew/claude-cortex --skill dashboard-designer

# Interactive dashboard builder
npx skills add w95/awesome-claude-corporate-skills --skill interactive-dashboard-builder
```

Skills install to `.agents/skills/<name>/`. Update `skills-lock.json` after manual installs.

---

## Related documents

- `docs/brandbook/design-tokens.md` — color, spacing, typography tokens
- `skills-lock.json` — installed skill registry with content hashes
- `.agents/skills/using-agent-skills/SKILL.md` — meta-skill discovery tree
