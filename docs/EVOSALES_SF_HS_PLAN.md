# EvoSales UI/UX pass — Salesforce + HubSpot structure, Evotechly paint

Repo: Mohamedbeghanem/EvoSales (`main`)
Not EvoCrm. Do not copy EvoCrm pages blindly. Map IA onto existing EvoSales routes and engines.

## Paint (already in this repo)
- Light: canvas #FFFFFF / #F7F7F6, ink #111111, hairline #E5E5E5
- Dark: canvas-soft #000000, elevated #0A0A0A, hairline #1F1F1F
- Mark orange: `#EC6025` (`--evosales-mark`). Do not swap to EvoCrm `#FF6A00`.
- Rail stays true black. Orange is CTA only, not rail fill.

## Structure sources
- Salesforce Lightning: home widget grid, dense lists, activity/tasks overlay, command search
- HubSpot: deals board + column totals, record drawer, create sheet

## Existing rooms (keep APIs)
- `/crm/contacts` `/crm/companies` `/crm/leads` `/crm/leads/captures`
- `/crm/deals` `/crm/deals/board` `/crm/activities` `/crm/workflows`
- Desk, Ads, Outbound, Home, Settings — same engines

## Phases
1. CRM tab order + Home entry — done
2. Home as widget grid from live props — already on `/home`
3. Lists: whole-row click → existing show — done (`list-view-table`)
4. Deals board: column totals + card click, keep `POST /crm/deals/{id}/move` — in this pass
5. Tasks overlay + command palette live records — in this pass (`POST /crm/activities/{id}/complete`)
6. Outbound / Desk / Ads chrome only — existing shells, no engine rewrite
7. Auth / settings polish — existing DS tokens

## Rules
- No fake KPIs or client-only invents
- No navy/teal
- Incremental commits on `main`
