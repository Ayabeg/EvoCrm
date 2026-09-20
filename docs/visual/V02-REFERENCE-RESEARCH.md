# V02 — Shopify × HubSpot reference research

**Status:** Authoritative design research for the V02 Dashboard revision.  
**Method:** Mobbin `search_screens` (web, deep). Screens were read as images, not from titles.  
**Primary:** Shopify Admin Home / Analytics.  
**Secondary:** HubSpot CRM Home / Sales Workspace / deals / tasks / activity.  
**Not cloned:** Shopify branding, Polaris blue, mascots, merchant nouns, HubSpot orange CTAs, exact cards, exact spacing.

Taste is applied *after* this research. Taste may adapt references to EvoCRM. Taste may not replace this document with generic aesthetic rules.

---

## 1. Shopify — screens examined

| Screen | Role | Cite |
|---|---|---|
| Admin Home — greeting, metric strip, operational chips, 3 setup cards | Primary Home composition | [a14400bb](https://mobbin.com/screens/a14400bb-6617-4890-af09-01c012c69998) |
| Admin Home — sessions chart + same setup cards | Sparse data still occupies a real module | [7ba97517](https://mobbin.com/screens/7ba97517-3e1e-4be3-9b51-f834f72b62b5) |
| Admin Home — alerts popover over the same Home | Secondary chrome stays out of the page body | [668a7524](https://mobbin.com/screens/668a7524-57c0-476a-8ce1-6f9cb05f85da) |
| Onboarding Home — product tiles + setup rows | Setup-as-furniture (reject illustrations) | [2483d325](https://mobbin.com/screens/2483d325-15ba-4b24-a732-8b468f614960) |
| Analytics — compact KPI strip + sales breakdown + product bars + donut | Metric grammar | [35153b56](https://mobbin.com/screens/35153b56-4d7f-4398-ae6b-2fefaba5d024) |
| Analytics — editable dashboard, same strip + breakdown | Module, not cell | [abe020de](https://mobbin.com/screens/abe020de-7640-469a-a000-6ec3f8bcc780) |
| Live View — white metric tiles + empty-state structure | Empty modules keep their box | [ebf992f2](https://mobbin.com/screens/ebf992f2-c7b2-4275-8adf-1c92c173fc6f) |
| Analytics empty / date-range | Sparse modules still claim space | [2a263161](https://mobbin.com/screens/2a263161-8c84-4bc8-a954-e0b43944222e) |

### 1.1 Overall Home composition

Shopify Home is **not** a card wall and **not** a spreadsheet.

From top of the content column:

1. A **thin metric rail** in the page chrome (Sessions / Total sales / Orders / Conversion). Small label over a compact value. No card per KPI.
2. A **center greeting + Ask field** (reject for EvoCRM — merchant voice, mascot globe).
3. **Operational chips** under the Ask field: `Fulfill orders 4` · `Capture payments 1`. These are work queues, not decoration.
4. **Three contained white setup modules** on a cool gray canvas. Each module is a complete thought: title, one next action, one object or illustration, one button.

The page reads as: **numbers in the header → one operating moment → a few contained modules**. There are typically 3–5 white surfaces, not 12.

### 1.2 Content max-width, margins, rhythm

- Content lives in a **centered column**, not edge-to-edge of the viewport. Side canvas remains visible. Approximate content width on a 1440 admin frame: **1040–1200px**.
- Horizontal page pad is generous (**~32px** from rail to content, more outside the column).
- Vertical rhythm between modules is **24–32px**, not 64–80. Premium here is *finish*, not emptiness.
- Module internal pad is **20–24px**. Title sits inside the surface, not on the canvas above it.

EvoCRM reuse: `px-8` (32) + optional `max-w-[72rem]` content column. Do **not** use the string `max-w-6xl` (P17/ProductPolish lock). Do **not** stretch modules to the rail edge so they read as spreadsheet bands.

### 1.3 Information hierarchy

| Layer | Shopify treatment | Weight |
|---|---|---|
| Page / period | `Last 30 days` in the chrome, not a hero | Quiet |
| Metrics | Label 11–12 / value ~18–20 / no hint shouting | Compact, always present |
| Operating work | Chips with counts (`Fulfill 4`) | Actionable |
| Setup | Contained, secondary, dismissible | Lower |
| Greeting / Ask | Center theater | **Reject** |

The eye hits **numbers first, then work, then setup**. Setup never outranks the operating body.

### 1.4 Primary vs secondary surfaces

- **Canvas:** cool gray (`#F1F1F1`–`#F6F6F7`). This is what makes white modules feel finished.
- **Primary module:** white, ~10–12 radius, 1px light border, **almost no shadow**. Depth = contrast against canvas, not float.
- **Secondary:** same white language, smaller type, progress as a quiet fraction (`1 of 2 tasks completed`).
- **Chrome metrics:** unboxed, sitting on canvas. They are *not* four KPI cards.

### 1.5 Cards vs open canvas

Shopify uses **modules**, not Tailwind Card components.

A module:

- groups one information job
- has a title *inside* the surface
- may contain rows, a chart, or an empty structure
- does not nest another card unless the inner object is a product/media tile (onboarding only)

A card wall (3 illustrated setup tiles as the *whole* Home) appears only in early onboarding. Mature Home still uses 3 modules, but they sit *under* metrics and work chips.

**How the page avoids feeling empty:** every region keeps its structure. A sessions chart with one spike still occupies a full white module. Live View empty tiles still show label + `0` + reserved sparkline slot. Empty is a *state of a module*, not missing chrome.

**How the page avoids becoming a card wall:** KPIs are *not* cards. Rows inside a module are *not* cards. Only the information group is boxed.

### 1.6 Border, shadow, radius, density

| Token | Observed | EvoCRM map |
|---|---|---|
| Module radius | ~10–12 | Visual Law card **10** |
| Border | 1px light gray | `#E3E3DF` |
| Shadow | none or 1px canvas-tinted hair | **none** on `.home-widget`; modules use canvas contrast |
| Density | medium-high in Analytics, calmer on Home | Dial **7** |
| Section containment | Title + body share one white box | Required |

Dashboard density on Analytics is higher (grid of modules). Home is calmer but **populated**. Neither is a gallery of huge blank cards.

### 1.7 Header treatment

- Home does **not** use a giant page title in the body. Identity is the rail + metric strip + greeting.
- Actions in the body are **secondary** (Resume, Buy a domain). Primary create lives in chrome.
- Date range is chrome, not a hero control.

EvoCRM already has V01 chrome + Page 28/34 `Accueil` / `Home`. Keep the page title (product language). Do not add a Shopify greeting.

### 1.8 Setup / onboarding

- Progress is a **fraction + quiet bar**, not a marketing stepper.
- Each step is one row or one small module: title, one sentence, one CTA.
- Illustrations / mascots / “Good morning” are merchant theater.

EvoCRM: P23 activation only. Compact, secondary, contained. Ink progress. No orange wash. No mascots.

### 1.9 Business metric presentation

This is the load-bearing Shopify pattern.

**Home chrome strip** ([a14400bb](https://mobbin.com/screens/a14400bb-6617-4890-af09-01c012c69998)):

```
Sessions          Total sales        Orders        Conversion
61                $827               5             0%
```

- Small contextual label (mute)
- Strong but **not enormous** value (~18–20px, not 28–32)
- No card, no trend arrow, no sparkline on Home itself

**Analytics KPI strip** ([35153b56](https://mobbin.com/screens/35153b56-4d7f-4398-ae6b-2fefaba5d024)):

```
Gross sales          Returning customer     Orders fulfilled     Orders
SGD 1,303.46         66.66%                 4                    5
[tiny sparkline]     [tiny sparkline]       [tiny sparkline]     [tiny sparkline]
```

Four metrics share **one hairline band**. They are typographic columns, not SaaS KPI cards.

**Sales breakdown module** (same screen, right column):

```
Gross sales          SGD 1,000.40
Discounts            -SGD 0.00
Returns              -SGD 235.27
Net sales            SGD 1,068.18
…                    …
Total sales          SGD 1,068.18
```

Label left, amount right, hairline rows, **one** white module. This is how Shopify makes numbers feel commercial without a spreadsheet grid.

**Product distribution** (same screen): name + amount + one proportional bar. Neutral single series. Not a loading bar because the bar is *next to a labeled commercial row*, and the module title states the job.

**Reject from Shopify Analytics:** donuts, date-range theater, rainbow series, sparklines we do not have, goal gauges, globe.

EvoCRM snapshot grammar:

```
Won this month              Open pipeline             Win rate           Open deals
620K DZD                    2.285M DZD                67%                12
vs last month (if real)     open                      closed this month  in pipeline
```

Small label → 20/26 value → quiet hint. Four columns in **one** module. No invented arrows. No fake charts.

### 1.10 Action placement

- Page-level create is chrome.
- Module actions are text or quiet buttons, top-right of the module.
- Operational work is **count chips** or rows, not a primary orange button per row.

EvoCRM: V01 global Create stays orange. Page `New deal` stays **secondary**. View all / Open board stay mute 13px.

### 1.11 Responsive behavior (observed)

- Modules stack; the metric strip remains a strip or wraps as compact columns.
- Empty modules keep height; they do not collapse into a caption on canvas.
- The 3-up setup row becomes 1-up.

EvoCRM already locks KPI `grid-cols-2` / `lg:grid-cols-4`. This revision does not finalize 1280/1024/768 — human review of 1440 first.

---

## 2. HubSpot — screens examined

| Screen | Role | Cite |
|---|---|---|
| Sales workspace home — Guided actions + activity feed | **Primary CRM IA** | [1f571c85](https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748) |
| Sales home — empty trophies + guided actions + feed CTA | Sparse operating home | [9c28666d](https://mobbin.com/screens/9c28666d-6777-4f00-9a52-e3d5bb58d9aa) |
| Sales home — Insights / revenue rail | Side context, not the hero | [91ad0652](https://mobbin.com/screens/91ad0652-0bcd-4bfe-b1bf-c421c8d50642) |
| Open deals list — next step / stage / amount / attention views | Deal context + saved views | [d947de05](https://mobbin.com/screens/d947de05-912e-49f9-8db7-c846ac7e50ee) |
| Pipeline board — stage columns, deal cards, column totals | Pipeline semantics | [b1e0be46](https://mobbin.com/screens/b1e0be46-49a1-44ba-a06e-abe62d9bdebe), [924adecd](https://mobbin.com/screens/924adecd-ba3c-4bbf-82e9-36a972e5eeaf), [fedd9c09](https://mobbin.com/screens/fedd9c09-b271-46a7-819c-956f51723a30) |
| Tasks — Due today / Overdue / Upcoming queues | Today / attention queues | [46f872bc](https://mobbin.com/screens/46f872bc-5277-412c-bea3-482bf03ff2a0) |
| Contact activity — Upcoming task (Overdue date) / meetings / calls | Activity semantics | [f215a882](https://mobbin.com/screens/f215a882-8c79-4bf8-8483-4d8ae465c3c1), [9612f93d](https://mobbin.com/screens/9612f93d-707f-4f74-8837-4015f930cfd9) |

### 2.1 CRM attention patterns

HubSpot Home is an **attention OS**, not an analytics dashboard.

The body is **Guided actions**: a queue of things a seller should do next. Tabs (`All 3` / `Deal 3` / `Prospecting 2`) are filters over that queue. “You’re all caught up” is an empty *operating* state, not an empty page — the module and the feed column remain.

Each action row answers:

| Slot | Example | Job |
|---|---|---|
| WHAT | Add a contact for Landing page | The work |
| WHY | You don’t have any contacts associated with this deal | The reason it is here |
| CONTEXT | Landing page · $2,500 · Close 08/20 | The deal |
| STATE | implied by queue / overdue copy | Urgency |

This is the row contract EvoCRM Attention must keep.

### 2.2 Sales task prioritization

Tasks IA ([46f872bc](https://mobbin.com/screens/46f872bc-5277-412c-bea3-482bf03ff2a0)):

- Saved views: **Due today / Overdue / Upcoming** — not a flat list
- Overdue is a **first-class queue**, visually and in IA
- Row = title · owner · associated records

On the contact timeline, overdue is written into the event: `Overdue: Aug 1, 2025 1:57 PM`. It is not the same gray meta as “Logged call”.

**Severity rule to adopt:** Overdue is louder than “no next action”. Equal treatment is a miss.

### 2.3 Pipeline summaries

Board columns ([b1e0be46](https://mobbin.com/screens/b1e0be46-49a1-44ba-a06e-abe62d9bdebe)):

- Stage name + deal count in the header
- Column **total amount** + weighted in the footer
- Deal tile: name, amount, close date, activity stale line, priority

List views add **attention slices**: Open, Stalled, No Activity, Stale Close Date — each with count and amount.

EvoCRM Home is not the board. Reuse the *semantics*:

- stage
- deal count
- amount
- relative distribution

Not: rainbow columns, priority dots, AI summaries, forecast gauges.

### 2.4 Deal context

A deal on Home or in a row always carries:

1. Name
2. Amount
3. Date or stage
4. Why it needs a human (no activity, no contact, overdue)

Amount is commercial context, not a KPI card.

### 2.5 Activity feeds

Right column on Sales Home ([1f571c85](https://mobbin.com/screens/1f571c85-2b3e-4f10-8125-f6aac6e49748)):

```
9:00 PM
Charlotte Walker  ·  Marketing Director at Rockets…
Opened email
```

Row = **time · person · event**. Compact. Not a card per event. The feed is a contained column, not loose canvas text.

Contact timeline groups by type (Upcoming / Logged) and writes Overdue into the event title.

### 2.6 Next-action presentation

- Guided action rows are the next action.
- Deal list “Next step” / “Schedule” empties are explicit holes.
- “No activity for N days” is a **reason line**, not a badge wall.

EvoCRM already has P12 `overdue_activity` vs `no_next_action`. Present them as different severities, not two equally gray captions.

### 2.7 CRM terminology hierarchy

Spoken order on HubSpot Home:

1. **Actions / tasks** (do this)
2. **Deals** (the money object)
3. **Pipeline / stage** (where the deal sits)
4. **Activity** (what happened)
5. **Insights / forecast** (secondary; often empty theater)

EvoCRM Home order must stay: Attention → Today → Snapshot → Pipeline → Recent. HubSpot confirms Attention/Today as the operating pair. Snapshot and Pipeline are commercial context, not the first click.

### 2.8 Actionable row patterns

One row, not a card:

```
[icon]  Title (ink, medium)
        Reason (secondary)
        Associated record · amount · date (meta)
        [overflow]
```

Hover wash on the row. Click opens the record. No nested buttons competing with the row.

### 2.9 Status treatment

- Overdue is **named and dated**
- Empty operating states keep the module (“You’re all caught up” + Manage tasks)
- Priority dots on board tiles are HubSpot chrome — do not copy
- Orange is HubSpot’s *create* color, not status color

EvoCRM: Overdue → destructive text. No next action → mute. Do not paint both ink. Do not use orange as a status.

### 2.10 Operational density

HubSpot Home is **denser than the rejected EvoCRM V02**. Guided actions are a real list. The feed column is populated or has a structured empty. Whitespace is the canvas around two columns, not a hole between two captions.

Target: density 7. A single Today event must still sit inside a finished module, time-first, not float in dead paper.

---

## 3. Design synthesis

### 3.1 Shopify patterns to adopt

1. **Page composition** — content column on paper canvas; 3–5 white modules; metrics are a strip, not a gallery.
2. **Premium surface hierarchy** — `#F7F7F5` canvas / `#FFFFFF` module / `#F1F1EF` inset. Depth from contrast, not drop shadows.
3. **Spacing** — 32 page pad, 24 module gap, 20–24 module pad. Rhythm, not voids.
4. **Dashboard rhythm** — header → secondary setup → strongest operating module → commercial snapshot → supporting modules.
5. **Contained modules** — title lives *inside* the surface. Empty states keep the box.
6. **Restrained polish** — 10 radius, 1px `#E3E3DF`, no glass, no gradient, no illustration.
7. **Metric grammar** — small label / 20px value / quiet hint. One module, four typographic columns.
8. **Distribution viz** — one labeled commercial breakdown (stacked share + rows), not per-row loading bars and not a donut.

### 3.2 HubSpot patterns to adopt

1. **CRM IA** — Attention is the home. Analytics is context.
2. **Attention queue** — WHAT / WHY / WHEN·STATE on every row.
3. **Today** — schedule/work module; time is a first-class column.
4. **Deals as context** — name + amount + stage/date ride along, they do not become KPI cards.
5. **Pipeline semantics** — stage + count + amount + relative share.
6. **Activity feed** — event · associated record · timestamp. Contained. No card-per-row.
7. **Severity** — Overdue outranks “No next action”.
8. **Actionable rows** — hover wash, open record, mute overflow links.

### 3.3 Patterns to reject

| Reject | Why |
|---|---|
| Shopify “Good morning” / globe / Ask theater | Merchant voice; EvoCRM already has Command OS |
| Shopify mascots / 3-up illustrated setup as the page | Onboarding furniture, not an operating home |
| Shopify donuts, sparklines, date-range popovers, goal gauges | We do not have that truth; would be fake |
| HubSpot trophy empty, sequence automation, Copilot, Breeze AI | Fake intelligence / extra product |
| HubSpot rainbow board / priority dots / forecast attainment | Board is V07; forecast is invented |
| HubSpot orange Create on the page | Conflicts with V01: page Create is secondary |
| Card per KPI | Shopify itself does not do this on Home |
| Card per row | Both references use rows inside a module |
| Spreadsheet KPI grid (full-bleed `border-y` cells) | The rejected V02 failure |
| Per-stage loading bars | Looks unfinished; not a distribution |
| Continuous-surface-as-no-cards | Misread of Visual Law |
| Giant SaaS KPI numbers (28–32) | Shopify values are compact |
| Equal visual weight for Overdue and No next action | HubSpot does not |
| Landing-page Taste (hero, bento, images, eyebrows) | Wrong page kind |

### 3.4 EvoCRM adaptation

```
SHOPIFY
  page composition
  premium surface hierarchy
  spacing / rhythm
  contained modules
  restrained polish
  compact metrics
        +
HUBSPOT
  Attention → Today → deals → pipeline → activities
  WHAT / WHY / WHEN rows
  overdue severity
  time-first schedule
        +
EVOCRM
  orange identity (Create + focus + one chart accent)
  Geist type scale (Page 28 / Section 18 / Card 15 / Body 14 / Meta 12)
  frozen P17 nouns and payload
  V01 64/240 shell
  Visual Law paper / ink / #E8530E
```

**One 1440 composition**

```text
[ Accueil 28/34/650                    workspace · date 12     ] [ New deal secondary ]
[ ACTIVATION — compact contained module, P23 only, secondary                          ]
[ ╔ PRIMARY OPERATING MODULE ══════════════════════════════════════════════════════╗ ]
[ ║  À traiter / Needs attention          │  Aujourd'hui / Today                   ║ ]
[ ║  WHAT / WHY / STATE rows              │  18:33  subject · type · person        ║ ]
[ ╚═══════════════════════════════════════╧════════════════════════════════════════╝ ]
[ BUSINESS SNAPSHOT — one module, 4 typographic columns, 20/26 values                 ]
[ PIPELINE — one module: stacked share + stage rows (count · amount · %)              ]
[ RECENT ACTIVITY — one module: event · context · timestamp                           ]
```

**Surface count:** 4 modules always (Operating, Snapshot, Pipeline, Recent) + Activation when P23 visible = **4–5**.  
**Card-in-card:** none. `HomeWidget` is a header+body, not a card. The module is the only box.  
**KPI:** not a sixth card and not a spreadsheet band — columns *inside* the snapshot module.  
**Orange:** V01 Create, focus rings, at most **one** pipeline segment (largest stage). No orange activation, no orange View all, no orange status.

---

## 4. Taste second pass (after research)

**Reading this as:** authenticated CRM operating home for all-day sellers, with Shopify Home composition + HubSpot queue IA + EvoCRM paper/orange, leaning toward Aurora/`ds` + Geist. Dials **4 / 3 / 7**. Product-design Taste only. Landing-page Taste does not fire.

| Taste pressure | Research override |
|---|---|
| §4.4 “cards only if elevation is hierarchy” | Adopt **modules**. A module is a semantic group (Visual Law §6). 4–5 is the Shopify count, not a card wall. |
| §4.4 density>7 bans generic card containers | Density is 7. Modules are information groups, not generic cards. KPI columns stay unboxed *inside* the snapshot module. |
| Variance 4 | Symmetric Attention \| Today split is correct. Do not force asymmetry. |
| Motion 3 | Hover wash 120ms only. No module entrance. |
| No eyebrows | Snapshot has no uppercase tracking label. Section titles are 18/26. |
| No hero | Page title stays 28/34. No greeting. |
| No images | No mascots, no trophies, no generated art. |
| Accent discipline | Orange does **one** job on the page body: largest pipeline segment. Create remains chrome. |

Taste must not flatten the page back to “text + lines + empty paper.” That was the rejected V02, and it contradicts Shopify’s actual Home.

Taste must not HubSpot-clone guided-action tabs, Copilot, or orange page Creates.

---

## 5. Mapping to existing P17 data

| Module | Frozen noun | Payload | Presentation change only |
|---|---|---|---|
| Header | `Home` / Accueil | `context.name`, `context.date`, `context.timezone` | Unchanged type; secondary New deal |
| Activation | `Get started` / `Workspace ready` | P23 `activation` | Contained, secondary |
| Attention | `Needs attention` | `attention.items` title / reason / label / severity | WHAT / WHY / STATE; overdue louder |
| Today | `Today` | `work.items` subject / type / due_at / related | Time-first column |
| Snapshot | aria `Sales snapshot` | `metrics.kpis` + existing hints/change | One module, typographic columns |
| Pipeline | `Pipeline` | `pipeline.stages` name / count / amount_cents | Stacked share + rows |
| Recent | `Recent records` | `recent.items` subject / type / related / at | Contained feed rows |

No new APIs. No invented trends. No Date.now. No complete-from-Home.

---

## 6. Rejection of the previous V02

The first V02 read Visual Law “continuous surface” as **no cards**. Result:

- text on paper
- hairline rules
- spreadsheet KPI cells
- per-stage loading bars
- Today floating in whitespace

Shopify demonstrates the correct reading: **no unnecessary cards, no cards inside cards without reason**. Useful containment is how a restrained product UI gets depth.
