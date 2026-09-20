# V02 — Dashboard baseline

**Status:** Recorded before V02 paint.  
**Base:** `bb50aa7dc803e3f209287fe99b99e1ba9ad627ea` (V01 #247 merge).  
**Method:** Source-true audit plus populated local Home (`owner@evosales.local`) at 1440 / 1280 / 1024 / 768.

**Taste read:** authenticated CRM operating home for all-day sellers, Apple restraint + Linear speed + Shopify snapshot clarity + HubSpot queue usability + EvoCRM orange. Dials 4 / 3 / 7. Product-design Taste only.

---

## CURRENT HIERARCHY

1. Page title Home + orange `New deal`
2. Activation band (when visible)
3. Two equal `HomeWidget` cards: Needs attention | Today
4. KPI strip (4-up / 2×2)
5. Two equal `HomeWidget` cards: Pipeline | Recent records

Eye lands on the orange page Create and the boxed widget chrome, not on the first exception.

---

## CURRENT COMPOSITION

Generic SaaS dashboard: title + CTA + 2×2 widget gallery with a KPI rail in the middle. Pipeline and Recent share equal weight. Sections are cards, not one workspace.

---

## CURRENT KPI TREATMENT

Hairline 4-up strip. Labels 11px. Values 20px / 18px / 28px (`text-kpi` at lg). Truthful money / percent / count. Optional `change` only when the payload has it. Not four giant cards, but still visually louder than Attention.

---

## CURRENT ATTENTION

Card titled 13px + 11px “Deal exceptions”. Rows: deal name 13, reason 12, severity label 12. QRD click + href preserved. Empty uses `HomeWidgetEmpty`.

---

## CURRENT TODAY

Sister card. Count line 12px (overdue · today · upcoming). Rows: subject 13, type/when 12, related 12. No complete-from-Home.

---

## CURRENT PIPELINE

Equal card next to Recent. Stage name 12, count · amount 11, ink bar. Overview only — not the board.

---

## CURRENT RECENT ACTIVITY

Equal card. Subject 13, type · related 12, timestamp 11.

---

## CURRENT ACTIONS

Global `+ Create` (V01) plus page-level orange `New deal` plus orange “View all” / “Open board” in every widget. Two equally loud Creates.

---

## CURRENT TYPOGRAPHY

Page title uses `text-page-title` (28). Section titles 13. Descriptions 11. Floor violated on captions and timestamps.

---

## CURRENT SURFACES / SHADOWS

`.home-widget`: white fill, hairline border, `box-shadow: 0 1px 0 rgba(0,0,0,0.04)`. Card-in-card vs canvas. Activation is a rounded bordered card.

---

## CURRENT RESPONSIVE

1440/1280: 2-col widgets. 1024: still 2-col (`lg`). 768: stacked widgets; KPI 2×2. Labeled 240 rail (V01/P25). No page H-overflow observed.

---

## Defects to solve in V02

- Generic 2×2 widget gallery
- Card-inside-canvas (and min-height empty boxes)
- Home widget shadow debt
- 11px captions / timestamps
- Equal visual weight Attention / Today / Pipeline / Recent
- Orange page Create competing with global Create
- Orange “View all” on every widget
- KPI values shouting at lg (28)
- Duplicated “Deal exceptions” / “Your schedule” helper noise
- Activation looking like another widget card

---

## Intended 1440 composition (one, recorded before paint)

```text
[ Home 28/34/650 · workspace · date 12     ] [ New deal secondary ]
[ Activation band — hairline, not a card, only if visible        ]
[ NEEDS ATTENTION queue          |  TODAY queue                 ]
[ BUSINESS SNAPSHOT — 4 numbers, hairlines, no cards            ]
[ PIPELINE overview — full width, stage rows                    ]
[ RECENT ACTIVITY — full width, secondary hairline feed         ]
```

Not: title → 4 KPI cards → chart → more cards.
