# HubSpot gap modules — porting guide (Next.js archive → Laravel CRM)

The Next.js skeleton on `archive/nextjs-skeleton-gaps-91cb` was built in parallel to the
production Laravel CRM. **Do not deploy that stack.** Use this guide to port UX patterns and
logic into the Laravel + Inertia CRM at `3014d04` (production baseline).

Production CRM stack: **Laravel + Inertia + React (Vite) + SQLite/Postgres**, deployed at
`/home/deploy/evosales` on Server 1.

## Gap → Laravel target map

| Gap | Next.js archive (reference) | Laravel CRM (integrate here) | Status on Laravel |
|-----|----------------------------|------------------------------|-------------------|
| #1 Saved views | `src/hooks/useListView.ts`, `ListViewToolbar.tsx` | `resources/js/components/crm/saved-view-tabs.tsx`, `list-toolbar.tsx`, `SavedFilter` model | **Exists** — extend AND/OR groups if missing |
| #2 Pipelines + forecast | `src/lib/pipelines.ts`, `ForecastWorkspace.tsx` | `app/Models/Pipeline.php`, `DealBoardForecast.php`, deals board | **Exists** — polish UI parity |
| #3 Record layout | `src/hooks/useRecordLayout.ts`, `RecordLayoutEditor.tsx` | `resources/js/components/crm/record-workspace.tsx` | **Partial** — add card customize panel |
| #4 Workflows | `src/lib/workflow-engine.ts`, `WorkflowEditor.tsx` | `WorkflowRunner.php`, `WorkflowController.php` | **Exists** — wire triggers if gaps remain |
| #5 Custom properties | `PropertiesWorkspace.tsx`, `CustomPropertyFields.tsx` | `CustomAttributeController.php`, `CustomAttributes.php` | **Exists** as CustomAttribute |
| #6 Sequences + cron | `sequences-repository.ts`, `SequenceEditor.tsx` | `Sequence.php`, `RunOutboundSequences.php`, `Enrollment.php` | **Exists** in Outbound |
| #7 Dashboards | `useDashboards.ts`, `DashboardWorkspace.tsx` | `Dashboard.php`, `DashboardController.php`, reports routes | **Exists** — EvoViz widgets |
| #8 Inbox | `InboxWorkspace.tsx` | `InboxController.php`, `desk/inbox.tsx`, `Thread` model | **Exists** as Desk/Inbox |
| #9 Segments filters | `segment-filters.ts`, `SegmentsWorkspace.tsx` | `SegmentController.php`, `resources/js/pages/crm/segments` | **Partial** — port live count preview |
| #10 AI layer | `ai-summary.ts`, `ai-client.ts` | `RecordInsight.php`, `AiInsight.php`, Ask Evo panel | **Exists** — align templates |

## Archive branch contents worth reading

```
archive/nextjs-skeleton-gaps-91cb:
  src/lib/list-view-config.ts      — filter group schema
  src/lib/segment-filters.ts       — segment member preview logic
  src/lib/record-layout.ts         — card registry pattern
  src/lib/forecast.ts              — category math
  src/lib/ai-summary.ts            — template summaries
  src/components/list-view/        — toolbar UX reference
  CHANGELOG.md                     — gap acceptance criteria
```

## What was reversed (2026-08-24)

- VPS Server 1: Next.js container stopped; Laravel `evosales-web-1` restored
- Next.js code preserved at `/home/deploy/evosales-hubspot/src` (parked, not serving traffic)
- GitHub `main` restored to Laravel CRM baseline (`3014d04`)

## Next integration steps

1. Branch from `main` (Laravel): `cursor/integrate-gap-modules-91cb`
2. For each gap, diff archive reference vs Laravel and port **UI/behavior only**
3. Never replace Laravel routes/models — extend `app/Services/Crm/*` and Inertia pages
4. Deploy by building Laravel Docker image on Server 1 (`/home/deploy/evosales`)
