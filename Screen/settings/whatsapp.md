# WhatsApp Cloud / personal phone (Evolution Baileys)

## 1. Screen Identity

Screen ID: SCR-SET-015
Product area: Settings / Communication
Route: `/settings/whatsapp`
Route names: `settings.whatsapp` GET; `connect` POST; `status` GET JSON; `destroy` DELETE (`can-manage-settings`)
Frontend file: `resources/js/pages/settings/whatsapp.tsx`
Primary component: `WhatsAppSettings`
Layout: `[AppLayout, SettingsLayout]`; not wide.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.integrations'` (title “WhatsApp Cloud”)
- **GET:** ungated by EPP
- **POST connect:** `settings.integrations`
- **DELETE:** `can-manage-settings` **and** EPP `settings.integrations`
- Page prop `can_configure` = `canPermission('settings.integrations')`
Parent navigation: Settings IA **Communication**, title **WhatsApp Cloud**.
Entry points: settings nav; Evolution Manage; Apps Manage.
Exit points: Facebook connect; DELETE redirects to `/settings/apps`.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `channel`, `facebook_url`, `can_configure`.
Evidence: `WhatsAppController::show`; `whatsapp.tsx`; runtime-index.

## 2. Purpose

Connect/disconnect **personal** WhatsApp via Evolution (not Cloud API). Optional QR for phone linking. Disconnect removes instance; inbox messages stay.

## 3. Current UX Summary

Empty if disconnected; status card; Facebook connect or Disconnect; optional QR card polled every 4s.

## 4. Screen Anatomy

Header (personal vs Business copy); empty state; status card (badge, message, phone, actions); QR card if `channel.qr.base64`.

## 5. Data Displayed

`channel`: available, connected, state, qr {base64, pairingCode}, display_phone, message. `facebook_url`, `can_configure` `[CONFIRMED-BOTH]`. Pairing code **not rendered** `[CONFIRMED-CODE]`.

## 6. Primary Actions

Continue with Facebook; Disconnect (confirm).

## 7. Secondary Actions

QR poll reload `only: ['channel']`. POST connect unused in this page `[UNREACHABLE]` from UI (Facebook is primary).

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

`setInterval` 4000ms while available, not connected, qr present `[CONFIRMED-CODE]`. GET `/settings/whatsapp/status` JSON exists unused by this page `[CONFIRMED-CODE]`.

## 14. Forms

DELETE `/settings/whatsapp` with `window.confirm`.

## 15. Overlays

Browser confirm. Facebook popup `[UNVERIFIED]`.

## 16. States

Disconnected empty+connect; connected+disconnect; QR waiting; `can_configure` false hides actions.

## 17. Empty State

“WhatsApp is disconnected” `[CONFIRMED-CODE]`.

## 18. Error Handling

Channel message. 403 delete for members. Confirm cancel.

## 19. Feedback

Toast on destroy “WhatsApp disconnected.” Connect toast on POST connect `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Breadcrumbs: Apps → WhatsApp. Disconnect → Apps.

## 21. Entity Relationships

`WhatsAppConnector::phoneStatus`; Evolution instance; inbox threads remain.

## 22. Business Rules

- Personal channel ≠ Business Cloud
- Disconnect needs admin/owner
- Configure buttons need `settings.integrations`
- QR is optional phone path

## 23. Backend Dependencies

`WhatsAppController`, `WhatsAppConnector`.

## 24. Frontend Dependencies

Brand connect, settings chrome, Inertia reload.

## 25. Responsive Behavior

QR `size-52` centered `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: QR `alt="WhatsApp QR code"`.
LIKELY ISSUE: confirm() a11y; pairingCode unused.
REQUIRES MANUAL TEST: polling + live region (none).

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-015-01 | MEDIUM | IA title “WhatsApp Cloud” but page says personal Evolution / not Cloud | Naming collision with Business | `ia.ts` vs header |
| SET-015-02 | LOW | Polling without aria-live | SR misses connect | `useEffect` |
| SET-015-03 | OBSERVATION | `status` JSON unused | Dead | controller |

## 28. Consistency Comparison

Same pattern as WhatsApp Business. Breadcrumb parent Apps unlike Evolution hub.

## 29. Functional Preservation Contract

- Facebook connect
- Disconnect + confirm + redirect Apps
- QR optional + poll
- can_configure gate
- Messages persist copy

## 30. Design Input Contract

Purpose: personal WhatsApp instance.
Primary actions: Connect; Disconnect.
Required information: status, phone, QR, warning copy.
Required states: disconnected, QR, connected, no permission.
Must not remove: Evolution vs Cloud distinction; inbox-keep warning.

## 31. Open Questions / Unknowns

- Is IA keyword “qr, personal phone” the intended Cloud title? `[UNKNOWN]` product naming
