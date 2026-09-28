# Channels (Desk embed)

## 1. Screen Identity

Screen ID: SCR-SET-018
Product area: Settings / Communication
Route: `/settings/channels`
Route names: `settings.channels` GET, `settings.channels.update` POST
Frontend file: `resources/js/pages/settings/channels.tsx`
Primary component: `ChannelSettings`
Layout: `[AppLayout, SettingsLayout]`; not wide.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.integrations'`
- **GET:** EPP skip
- **POST:** `settings.integrations`
Parent navigation: Settings IA **Communication**, title **Channels**.
Entry points: settings nav.
Exit points: Inbox `/inbox`; settings siblings.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `channels`, `evolution`, `inboxUrl`.
Evidence: `ChannelSettingsController`; `channels.tsx`; runtime-index.

## 2. Purpose

Set the EvoDesk embed URL used by Inbox, and list connected workspace channels (hiding SMS type when simple-mode `features.sms` is false).

## 3. Current UX Summary

Desk embed form (URL + Save Desk URL) then channel list or empty. Optional last Evolution event line.

## 4. Screen Anatomy

Header; SettingsCard “Desk embed”; connected channels list or empty; evolution timestamp.

## 5. Data Displayed

`channels[]` id, name, type, status; `evolution` connected, last_webhook_at, last_event; `inboxUrl` `[CONFIRMED-BOTH]`. Client filters `type === 'sms'` when `!features.sms` `[CONFIRMED-CODE]`.

## 6. Primary Actions

Save Desk URL (POST).

## 7. Secondary Actions

Link to Inbox. Cancel/reset.

## 8. Search

NOT PRESENT.

## 9. Filters

SMS hidden in simple mode `[CONFIRMED-CODE]`.

## 10. Sorting

Eloquent `Channel::forWorkspace` default `[UNVERIFIED]`.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Full channel list. Form processing.

## 14. Forms

`inbox_url` nullable URL max 255. Clear URL → native CRM desk (copy).

## 15. Overlays

NOT PRESENT.

## 16. States

Empty channels; connected vs not_connected badges; evolution timestamp missing vs shown.

## 17. Empty State

“No channels yet” when `visibleChannels.length === 0` `[CONFIRMED-CODE]`.

## 18. Error Handling

URL validation `[UNVERIFIED]` not bound on Input. 403 without integrations cap.

## 19. Feedback

No toast; `back()` `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Stay. Breadcrumbs: Channels. Inbox link.

## 21. Entity Relationships

`Workspace.inbox_url`; `Channel` rows; Evolution health; Inbox embed (`SCR-INBOX-001`).

## 22. Business Rules

- Default copy `https://desk.evotechly.com`
- Operators stay on CRM hostname (copy)
- Telegram later (copy)
- SMS channel hidden when simple_mode (feature flag)
- Nav `settings.integrations`

## 23. Backend Dependencies

`ChannelSettingsController`, `EvolutionCloudService::health`, `Workspace::inboxUrl()`.

## 24. Frontend Dependencies

Settings chrome, `useSimpleMode`, Inbox Link.

## 25. Responsive Behavior

List rows flex `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: labeled Desk URL.
LIKELY ISSUE: no error display.
REQUIRES MANUAL TEST: Inbox after save.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-018-01 | LOW | Channel list is read-only | Cannot connect from this page (must use Integrations) | empty copy |
| SET-018-02 | OBSERVATION | No save toast | Unclear success | controller |

## 28. Consistency Comparison

Communication group; Desk-specific. Empty mentions Integrations.

## 29. Functional Preservation Contract

- inbox_url save/clear
- Inbox deep link
- Channel status list
- Hide SMS in simple mode
- Evolution last event

## 30. Design Input Contract

Purpose: point Inbox at EvoDesk and show channel health.
Primary action: Save Desk URL.
Required information: URL, channel name/type/status, last Evolution event.
Required states: empty, list, sms hidden, processing.
Must not remove: native-desk-when-cleared; hostname copy.

## 31. Open Questions / Unknowns

- Valid URL allowlist besides https? `[UNKNOWN]`
- Channel create path besides SMS/WhatsApp controllers `[UNKNOWN]`
