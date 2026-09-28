# WhatsApp (Evolution hub)

## 1. Screen Identity

Screen ID: SCR-SET-014
Product area: Settings / Communication
Route: `/settings/evolution`
Route names: `settings.evolution` GET; `settings.evolution.sync` POST (redirects to WhatsApp Business)
Frontend file: `resources/js/pages/settings/evolution.tsx`
Primary component: `EvolutionSettings`
Layout: `[AppLayout, SettingsLayout]`; not wide.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.integrations'`
- **GET:** EPP skip (safe)
- **POST sync:** `settings.integrations`
Parent navigation: Settings IA **Communication**, title **WhatsApp** (href `/settings/evolution`). Distinct from Cloud (`/settings/whatsapp`) and Business (`/settings/whatsapp-business`).
Entry points: settings nav “WhatsApp”.
Exit points: Manage → `/settings/whatsapp` or `/settings/whatsapp-business`; Facebook connect `/auth/meta?popup=1`.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `whatsapp`, `whatsapp_business`, `facebook_url`, `last_webhook_at`, `last_event`.
Evidence: `EvolutionSettingsController`; `evolution.tsx`; `ia.ts`; runtime-index.

## 2. Purpose

Hub status for Evolution-attached personal WhatsApp and WhatsApp Business; connect via Facebook; show last inbox event.

## 3. Current UX Summary

Two-column cards (WhatsApp / WhatsApp Business) with badges, messages, Connect or Manage. Empty state if both disconnected. Footer last event.

## 4. Screen Anatomy

Header; optional `SettingsEmptyState`; grid md:2 cards with brand marks; last inbox event line.

## 5. Data Displayed

Each channel: available, connected, message, display_phone. facebook_url default `/auth/meta?popup=1`. last_webhook_at, last_event `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Continue with Facebook (`BrandConnectButtons`); Manage links.

## 7. Secondary Actions

None on page. POST `/settings/evolution/sync` exists but **no button** `[CONFIRMED-CODE]` `[UNREACHABLE]` from this UI.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Static. Connect is OAuth navigation.

## 14. Forms

NOT PRESENT on page.

## 15. Overlays

Facebook popup `[UNVERIFIED]`.

## 16. States

Both disconnected empty; mixed; both connected. Badge Connected / Not connected.

## 17. Empty State

“WhatsApp is disconnected” when neither connected `[CONFIRMED-CODE]`.

## 18. Error Handling

Channel `message` strings from connector `[CONFIRMED-CODE]`. 403 without capability on POST only.

## 19. Feedback

None on GET. Connect toasts live on WhatsApp controllers after OAuth `[UNVERIFIED]`.

## 20. Navigation Behavior

Breadcrumbs: WhatsApp. Manage deep-links to sibling screens.

## 21. Entity Relationships

Evolution/WhatsAppConnector; workspace evolution_last_webhook_at/event; Meta OAuth.

## 22. Business Rules

- Facebook login is the connect path (copy: no API key)
- Personal vs Business are separate channels
- Nav gated `settings.integrations`

## 23. Backend Dependencies

`EvolutionSettingsController`, `WhatsAppConnector`.

## 24. Frontend Dependencies

Brand marks, `BrandConnectButtons`, settings chrome empty.

## 25. Responsive Behavior

`md:grid-cols-2` `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: empty icon decorative.
LIKELY ISSUE: last event timestamps not `time` element.
REQUIRES MANUAL TEST: Facebook popup.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-014-01 | LOW | Three WhatsApp nav items (Evolution, Cloud, Business) | Users may not know which is hub | `ia.ts` titles |
| SET-014-02 | OBSERVATION | `sync` route unused in UI | Dead capability | controller vs page |

## 28. Consistency Comparison

Communication group; similar empty+card pattern as WhatsApp Cloud page.

## 29. Functional Preservation Contract

- Dual status cards
- Facebook connect when disconnected
- Manage when connected
- Last inbox event
- Nav `settings.integrations`

## 30. Design Input Contract

Purpose: Evolution WhatsApp overview.
Primary actions: Connect Facebook; Manage channel.
Required information: connected flags, messages, phones, last event.
Required states: none/one/both connected.
Must not remove: distinction personal vs Business; official Facebook path.

## 31. Open Questions / Unknowns

- When `display_phone` is omitted from Channel type vs shown on child pages `[UNVERIFIED]`
