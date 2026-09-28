# WhatsApp Business (Cloud API)

## 1. Screen Identity

Screen ID: SCR-SET-016
Product area: Settings / Communication
Route: `/settings/whatsapp-business`
Route names: `settings.whatsapp-business` GET; `connectBusiness` POST; `destroyBusiness` DELETE (`can-manage-settings`)
Frontend file: `resources/js/pages/settings/whatsapp-business.tsx`
Primary component: `WhatsAppBusinessSettings`
Layout: `[AppLayout, SettingsLayout]`; not wide.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.integrations'`
- **GET:** EPP skip
- **POST connect:** `settings.integrations`
- **DELETE:** can-manage-settings + `settings.integrations`
- `can_configure` = `settings.integrations`
Parent navigation: Settings IA **Communication**, title **WhatsApp Business**.
Entry points: settings nav; Evolution Manage; Apps Manage; setup wizard.
Exit points: Facebook; DELETE → `/settings/apps`.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `channel`, `facebook_url`, `can_configure`.
Evidence: `WhatsAppController::showBusiness`; page; runtime-index.

## 2. Purpose

Connect/disconnect WhatsApp **Cloud** via Evolution. Separate from personal WhatsApp. Disconnect removes Cloud instance; Meta OAuth and inbox stay.

## 3. Current UX Summary

Empty if disconnected; status card with badge, optional display_phone, message, Connect or Disconnect.

## 4. Screen Anatomy

Header; empty state; SettingsCard status + actions. No QR (unlike personal).

## 5. Data Displayed

`channel`: available, connected, needs_facebook, display_phone, verified_name, message. `facebook_url`, `can_configure` `[CONFIRMED-BOTH]`. `verified_name` **not rendered** `[CONFIRMED-CODE]`.

## 6. Primary Actions

Continue with Facebook; Disconnect (confirm).

## 7. Secondary Actions

POST `connectBusiness` unused in UI `[UNREACHABLE]`.

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

Static GET. `provisionBusinessIfReady` on show `[CONFIRMED-CODE]`.

## 14. Forms

DELETE with confirm copy that Meta OAuth is not disconnected.

## 15. Overlays

`window.confirm`. Facebook popup `[UNVERIFIED]`.

## 16. States

Disconnected / connected / can_configure false.

## 17. Empty State

“WhatsApp Business is disconnected” `[CONFIRMED-CODE]`.

## 18. Error Handling

Channel message. 403 delete.

## 19. Feedback

Toast “WhatsApp Business disconnected.” Connect toast on POST `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Breadcrumbs: Apps → WhatsApp Business. Destroy → Apps.

## 21. Entity Relationships

Cloud Evolution instance; Meta grant; meeting WA templates; inbox.

## 22. Business Rules

- Separate from personal WhatsApp
- No phone-number ID to type (copy)
- Admin/owner to disconnect
- `settings.integrations` to configure

## 23. Backend Dependencies

`WhatsAppController` business methods, `WhatsAppConnector`.

## 24. Frontend Dependencies

Brand connect, settings chrome.

## 25. Responsive Behavior

Flex wrap actions `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: empty icon.
LIKELY ISSUE: confirm(); verified_name unused.
REQUIRES MANUAL TEST: OAuth.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-016-01 | LOW | `verified_name` unused | Missing WABA identity | page vs controller |
| SET-016-02 | OBSERVATION | Naming overlap with SCR-SET-015 “WhatsApp Cloud” | Confusion | IA |

## 28. Consistency Comparison

Near clone of personal WhatsApp minus QR/polling.

## 29. Functional Preservation Contract

- Facebook connect
- Disconnect confirm + Apps redirect
- can_configure
- Copy: Cloud vs personal; inbox kept; Meta OAuth kept

## 30. Design Input Contract

Purpose: Cloud number for templates/inbox.
Primary actions: Connect; Disconnect.
Required information: status, phone, message.
Required states: disconnected, connected, no permission.
Must not remove: no token/App ID fields; Meta OAuth independence.

## 31. Open Questions / Unknowns

- `needs_facebook` UI? unused `[CONFIRMED-CODE]`
