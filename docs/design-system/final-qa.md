# Final QA — PR12

Axe-equivalent: keyboard focus uses teal `#0F4C5C` / `--evo-focus`. Contrast target WCAG AA. Light canvas `#F7F8F5`, dark cabinet `#0A0A0A` / `#121212` / `#1C1C1C`. Production UI copy is French via `t()` + `lang/fr.json` (fr-DZ, DZD, +213, 24h, week starts Saturday).

Guards (`lucide-react`, Aurora/Astryx, raw hex outside `evo/tokens`) are **errors**.

Screenshots live in `/opt/cursor/artifacts/screenshots/`. Captured from seeded `owner@evosales.local` against `php artisan serve` + production Vite build. Dark shots toggle `document.documentElement.dark`.

## Per-route table

| Route | Light | Dark | A11y | Notes |
|---|---|---|---|---|
| `/dashboard` (home) | `home-1440-light.png` | `home-1440-dark.png` | Pass visual | French chrome (« Bonjour », « Nouvelle affaire », DZD). `/home` 404s — operating home is `/dashboard`. |
| `/crm/contacts` | `contacts-1440-light.png` · `contacts-1280-light.png` | `contacts-1440-dark.png` · `contacts-1280-dark.png` | Pass visual | French list chrome; +213 phones; table usable at 1280. |
| `/crm/deals/1` | `deal-record-1440-light.png` | `deal-record-1440-dark.png` | Pass visual | Record workspace; DZD amounts. Some activity body text is seeded English. |
| `/crm/deals/board` | `pipeline-1440-light.png` | `pipeline-1440-dark.png` | Pass visual | Pipeline board. |
| `/inbox` | `inbox-1440-light.png` · `inbox-composer-1280-light.png` | `inbox-1440-dark.png` · `inbox-composer-1280-dark.png` | Pass visual | One thread list + empty pane when none selected (not three stacked empties). Desk iframe banner is expected (desk.evotechly.com not framed). Composer at `?thread=1`. |
| `/outbound` | `outbound-1440-light.png` | `outbound-1440-dark.png` | Pass visual | Overview French. |
| `/ads` | `ads-1440-light.png` | `ads-1440-dark.png` | Pass visual | 403 in simple mode; shot after `simple_mode=false`. French hub + DA amounts. |
| `/reports` | `reports-1440-light.png` | `reports-1440-dark.png` | Pass visual | Room title Rapports; window copy French (`jours`, Africa/Algiers). Some EvoViz chart titles still English from payload. |
| `/crm/workflows` | `workflow-editor-1440-light.png` | `workflow-editor-1440-dark.png` | Pass visual | List/editor French. |
| `/settings` | `settings-1440-light.png` | `settings-1440-dark.png` | Pass visual | Settings rooms French. |
| `/agents` + CreateBotSheet | `agents-1440-*.png` · `agents-create-bot-1440-*.png` | same | Pass visual | Sheet French: « Créer un nouveau bot », Outils, Enregistrer le bot. |

## Fixes recorded in this PR

- Quote amount column min-width `8.5rem`; ticket subject `16rem`.
- Inbox composer action row `flex-nowrap` so paperclip/send stay on one row at 1280.
- Empty inbox: one `EmptyState` when the conversation list is empty.
- `npm run types:check` runs `wayfinder:generate --with-form` before `tsc --noEmit`.
- Orange primary labels on quote create use `--evo-on-primary` (`#121212`).

## POLISH left

- A few EvoViz / record activity strings still arrive English from the server.
- Inbox search placeholder needed `fr.json` (merged from `evo/inbox/messages.ts`).
- Ads hub is simple-mode gated (403) — not a PR12 regression.
- Repo-wide stylistic ESLint (`padding-line-between-statements`, curly, brace-style, etc.) already failed on `main`. Left as-is. Design-system import/hex guards stay errors and clean.
