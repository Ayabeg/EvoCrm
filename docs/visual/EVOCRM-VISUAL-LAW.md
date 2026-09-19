# EvoCRM Visual Law

**Status:** Authoritative for V01–V15.  
**Supersedes for visual work:** `docs/design-system.md` token table where this file is more specific.  
**Does not supersede:** P25 responsive, P26 accessibility, P27 motion, or any P00–P29 behavioral contract.

Identity: Premium B2B SaaS.

Apple restraint. HubSpot CRM usability. Salesforce workflow depth. EvoCRM identity.

Not a clone of any reference.

---

## 1. What V-series may change

Allowed: composition, hierarchy, spacing, typography, density, surfaces, borders, visual grouping, component presentation, icon presentation, empty/loading presentation, visual rhythm, responsive composition.

Forbidden: business logic, backend behavior, routes, permissions, workspace isolation, data models, API contracts, workflow semantics, Quote lifecycle, Automation semantics, Ask Evo security/context contract, functional P00–P29 contracts.

---

## 2. Color

| Token | Hex | Use |
|---|---|---|
| Canvas | `#F7F7F5` | App wash |
| Surface | `#FFFFFF` | Continuous workspace, tables, dialogs |
| Surface subtle | `#F1F1EF` | Table header, filter band, skeleton, inset groups |
| Text primary | `#161616` | Titles, body, primary labels |
| Text secondary | `#666666` | Descriptions, unread-but-useful |
| Text muted | `#929292` | Metadata, placeholders, table headers |
| Border | `#E3E3DF` | Hairlines, input border, row rules |
| Border strong | `#D6D6D1` | Active input, emphasized split |
| Accent | `#E8530E` | Primary CTA, active nav, focus, selected, key chart series |
| Accent hover | `#D74908` | Primary hover |
| Accent soft | `#FFF1EA` | Selected row wash, active nav wash |
| Danger | `#D92D20` | Destructive only |
| Success | `#24845B` | Healthy / complete / won |
| Warning | `#C77A11` | Caution / pending |

Orange is not decoration.

Use orange for: primary CTA, active navigation, focus, selected state, important chart emphasis.

Never create giant orange surfaces. Never orange-wash cards. Never paint every pill, tab, link, or badge orange.

**Live delta to close in V01 (tokens only, via existing CSS variables):**

| Token | Live `app.css` | This law |
|---|---|---|
| Accent hover | `#CF4A0C` | `#D74908` |
| Accent soft | `rgba(232, 83, 14, 0.10)` | `#FFF1EA` |
| Success | `#16A34A` | `#24845B` |
| Warning | `#D97706` | `#C77A11` |
| Danger | destructive oklch | `#D92D20` |
| Border strong | mix | `#D6D6D1` |

Do not introduce a second brand accent. Presence green `#22C55E` stays status-only if already used.

Dark cabinet stays out of V01–V15 unless a later brief reopens it. Light Cabinet is the product.

---

## 3. Typography

Preferred: **Geist** (already shipped). Inter is the named fallback, not a second live face. Do not mix Geist and Inter on product screens.

| Role | Size / line / weight | CSS |
|---|---|---|
| Page | 28 / 34 / 650 | `--text-page` |
| Section | 18 / 26 / 600 | `--text-section` |
| Card | 15 / 22 / 600 | `--text-card` |
| Body | 14 / 20 / 400 | `--text-body` |
| Label | 13 / 18 / 500 | `--text-label` |
| Table | 13 / 18 / 400 | `--text-table` |
| Metadata | 12 / 16 / 400 | `--text-meta` |

Enterprise density does not mean microscopic UI.

**Type floor:** 12px. 11px and 10px are banned as default operational type (table headers, section labels, AI answers, nav groups). Use metadata 12 or label 13.

Avoid 700 / 800 weight proliferation. 650 is the page-title ceiling.

`--text-page-title` at 22px is a leftover. V-series pages use Page 28/34 or Record 20 (`--text-record-title`) by signature, never a third “almost title.”

---

## 4. Spacing

Core scale: **4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64**.

| Measure | Value |
|---|---|
| Default page horizontal | 32 |
| Header → content | 24 |
| Section | 32 |
| Card (when a card is justified) | 20 |
| Table row | 48 |
| Controls | 36 |
| Primary button | 36 |
| Large CTA | 40 |

No 13px layout gaps. No 2.5 as a spacing token.

---

## 5. Radius

| Element | Radius |
|---|---|
| Buttons | 8 |
| Inputs | 8 |
| Cards | 10 |
| Drawers | 0 |
| Modals | 12 |
| Badges | 999 |

Avoid excessive rounded containers. Search field may stay pill. Avatars stay circular. Saved-view pills may stay pill. Product cards and inputs do not become squircle furniture.

Live Aurora dialog radius (20px via `--aurora-radius-3`) is **too soft**. Restyle to 12.

---

## 6. Surface law

Critical: EvoCRM must not look like cards inside cards inside cards.

Prefer:

- continuous workspace surfaces
- spacing
- typographic hierarchy
- dividers
- subtle background changes (`#F7F7F5` vs `#FFFFFF` vs `#F1F1EF`)

over:

- boxed everything
- heavy shadows
- decorative cards
- gratuitous borders

A card must communicate a real semantic group (a quote document, a settings form cluster, a marketplace app, a modal). A table is not a card. A filter bar is not a card. A KPI is not a card unless it is the only object in its band.

White island on gray canvas plus a bordered widget plus a bordered inner list is a fail.

---

## 7. Shadow law

Default application surfaces: little or no shadow.

Use elevation only when hierarchy requires it:

- popover
- menu
- floating command surface
- modal

Do not use shadows as decoration. The current Home widget `box-shadow: 0 1px 0` is a decorative tell. Remove it in V02.

Tint any required shadow to the canvas hue. No pure-black drop shadows on paper.

---

## 8. Icon law

Phosphor remains the preferred active product icon language.

Do not introduce another icon family. Do not hand-draw SVG icons.

Lucide leftovers (starter header, one Aurora badge import, legacy leads board) are retire-on-touch, not a V00 cleanup.

Icons support hierarchy. They do not decorate every label.

---

## 9. Motion

[P27](../motion/P27-CONTRACT.md) is authoritative.

Visual redesign must consume the existing motion contract.

| Role | Duration |
|---|---|
| Hover / pressed color | 120ms |
| Dropdown / popover | 150ms |
| Page / toast / backdrop | 150ms |
| Modal / Command OS | 180ms |
| Drawer / sheet / QRD | 200ms |

Easing: `cubic-bezier(.2,.8,.2,1)`. No bounce. No overshoot. No spring. No cinematic animation. No bouncing dashboard. No gratuitous entrance choreography.

`prefers-reduced-motion` remains P26 / P27.

---

## 10. Accessibility

[P26](../accessibility/P26-CONTRACT.md) remains authoritative.

Visual improvements cannot reduce: contrast, keyboard usability, focus visibility, semantic clarity, accessible names, reduced-motion behavior.

Accent `#E8530E` on white must keep button label white. Muted `#929292` on `#F7F7F5` is the contrast floor already accepted by P26. Do not lighten muted further.

Focus remains orange. Do not restyle the P26 ring into a glow.

---

## 11. Responsive

[P25](../responsive/P25-CONTRACT.md) remains authoritative.

Desktop design first at **1440**.

Every V implementation must subsequently prove: **1280 / 1024 / 768**.

No document H-overflow. Local table / board scrolling remains allowed when deliberate.

---

## 12. Navigation hierarchy

One wayfinding system: the **64 / 240 rail** plus the **topbar**.

Do not add a second product tab bar (`RoomShell`) on routes the rail already names. V01 retires or hides redundant RoomShell chrome on CRM / Inbox / Automation where the sidebar already lists the destination.

Active rail: accent-soft wash + primary text. Not a giant orange block.

---

## 13. Accent discipline

On any one surface, orange may do **at most one** of:

1. the primary CTA
2. the selected nav item
3. the focus ring
4. the selected table row wash
5. the primary chart series

If two of these appear together, one must recede to ink / wash.

---

## 14. What never changes silently

- URL structure / route slugs
- Primary nav labels and hrefs
- Form field names
- Brand wordmark
- Analytics event names
- P00–P29 compile contracts and test locks
