# Mobile Design System

**AUTHORITATIVE CLIENT STACK:** Expo + React Native (M06R). Tokens port to `mobile/theme/tokens.ts`.  
**Baseline:** `4d2976befc7a94c267528e4a1fa7a810fe45e4a8`  
**Source tokens:** `docs/design-system.md` (locked web DS)  
**Brand:** Accent `#E8530E` (note: older ARCHITECTURE mentions `#EC6025`; **mobile follows design-system.md lock `#E8530E`**)

## 1. Principles

1. One design system with web — **same tokens**, mobile metrics.
2. Apple restraint / quiet surfaces; one accent.
3. No HubSpot teal, no Salesforce blue, no second AI name (Ask Evo only when shipped).
4. Mobile density ≠ desktop cockpit: larger hit targets, less simultaneous chrome.

## 2. Color tokens (port)

| Token | Hex | Mobile use |
|---|---|---|
| Accent | `#E8530E` | Primary CTA, active tab, focus |
| Accent hover/pressed | `#CF4A0C` / `#B8410B` | Pressed states |
| Accent wash | `rgba(232,83,14,0.10)` | Selected rows, active tab bg |
| Background | `#F7F7F5` | Screen canvas |
| Surface | `#FFFFFF` | Cards, sheets |
| Subtle | `#F1F1EF` | Grouped list headers |
| Text | `#161616` | Primary |
| Secondary | `#666666` | Supporting |
| Muted | `#929292` | Meta |
| Border | `#E3E3DF` | Hairlines |
| Success / Warning / Danger | semantic | Status only |

Dark mode: out of scope until web dark pass.

## 3. Typography

Keep **Geist** (or Inter if web switches — do not mix). Scale up slightly for mobile readability:

| Role | Mobile suggestion |
|---|---|
| Page | 24–28 / semibold |
| Section | 17–18 / semibold |
| Body | 15–16 / regular |
| Label | 13–14 / medium |
| Meta | 12 / regular |

## 4. Metrics (mobile)

| Measure | Value |
|---|---|
| Min touch target | 44×44 pt |
| List row | 56–64 pt |
| Screen pad-x | 16 pt |
| Tab bar | system + accent wash on active |
| Radius | 8–12 pt cards; 6 pt chips |
| Sheet | native bottom sheet for create/qualify/move |

## 5. Component inventory (mobile)

Map from web DS, not clone desktop DataWorkspace:

- Button (primary/secondary/ghost/danger)
- TextField / SearchField
- List row / Section list
- Chips / Filters
- EmptyState / Skeleton
- Badge (unread, stage)
- Avatar
- Bottom sheet forms
- Toast / Banner (offline, failed send)
- Tab bar
- Navigation header

Icons: **Phosphor** to match web product chrome.

## 6. Surface patterns ↔ Mobbin

See `research/MOBILE-PATTERN-MAP.md`. Prefer Attio / Jobber / OpenPhone grammar for CRM+inbox hybrid; keep Evotechly tokens.

## 7. Motion

Subtle; honor Reduce Motion. No decorative Lottie spam on Home.
