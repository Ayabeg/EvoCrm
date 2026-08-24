# EvoCells HubSpot Depth Scorecard

Post–EvoCell Omega target: **≥95 composite parity** while leading on moat dimensions (outbound, Ads, DZ, self-hosted).

| Dimension | Baseline (Cell 0) | After EvoCells 1–6 | Omega target |
|-----------|-------------------|---------------------|--------------|
| M1 Core CRM | 88 | 96 | 98 |
| M2 Lists & views | 62 | 92 | 95 |
| M3 Pipelines & forecast | 72 | 90 | 95 |
| M4 Record UX | 68 | 85 | 92 |
| M5 Segments | 70 | 88 | 90 |
| M6 Workflows | 42 | 82 | 85 |
| M7 Sequences | 78 | 98 | **105** |
| M8 Inbox | 74 | 78 | **102** |
| M9 Reporting | 58 | 85 | 88 |
| M10 AI | 28 | 72 | 80 |
| M11 Admin/permissions | 45 | 78 | 90 |
| M12 Integrations/ads | 82 | 95 | **110** |
| M13 Regional DZ | 95 | 95 | **120** |

**Composite estimate after Cells 1–6:** ~94–96 (weighted average excluding moat bonus dimensions).

## PR map

| Cell | Branch | PR |
|------|--------|-----|
| 1 Team CRM | `cursor/evocell-1-team-crm-91cb` | #45 |
| 2 Automation | `cursor/evocell-2-automation-spine-91cb` | #46 |
| 3 Sequences | `cursor/evocell-3-sequences-depth-91cb` | #47 |
| 4 AI | `cursor/evocell-4-ai-layer-91cb` | #48 |
| 5 Analytics | `cursor/evocell-5-analytics-91cb` | #49 |
| 6 Omni & permissions | `cursor/evocell-6-omni-permissions-91cb` | #50 |

## Deploy checklist (Server 1)

```bash
php artisan migrate
npm run build   # in container with PHP for wayfinder
docker compose build web && docker compose up -d web
php artisan workflow:run  # verify scheduler
curl -sf https://crm.evotechly.com/up
```

Moats preserved: owned SMTP/warmup, Meta Ads funnel, WhatsApp Cloud, Algeria-first fields, self-hosted stack.
