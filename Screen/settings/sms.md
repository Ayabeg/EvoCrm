# SMS gateway

## 1. Screen Identity

Screen ID: SCR-SET-019
Product area: Settings / Communication
Route: `/settings/sms`
Route names: `settings.sms` GET; `update` POST; `destroy` DELETE
Frontend file: `resources/js/pages/settings/sms.tsx`
Primary component: `SmsSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.integrations'` + `adminOnly: true` + **`requiresSmsFeature: true`**
- `requiresSmsFeature` hides nav when `features.sms` is false (simple_mode on) `[CONFIRMED-CODE]`
- **GET/POST/DELETE:** `can-manage-settings`; mutations EPP → `settings.integrations`
- SimpleMode does **not** 403 this URL (`blocks()` omits SMS) — crawl **200** even with simple_mode `[CONFIRMED-BOTH]`
Parent navigation: Settings IA **Communication**, title **SMS**. Also listed on full product rail (`SimpleMode::FULL_NAV`).
Entry points: settings nav when feature on; setup wizard SMS step POSTs here.
Exit points: Disconnect stays on page; setup return=start → wizard finish.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props include connected, status, key_set, driver, url, method, http_auth, sender, field_*, env_* .
Evidence: `SmsSettingsController`; `sms.tsx`; `ia.ts`; `SimpleMode.php`; runtime-index.

## 2. Purpose

Configure the Algeria HTTP/Twilio SMS gateway (encrypted API key). Sends only to DZ mobiles; quiet hours mentioned in copy.

## 3. Current UX Summary

Empty or status badge; large gateway form; disconnect card if connected.

## 4. Screen Anatomy

Header (DZ numbering copy); empty or “Gateway status”; form card all HTTP fields; disconnect card.

## 5. Data Displayed

connected, status (unused in TS props but passed), key_set, driver, url, method, http_auth, sender, field_to/message/sender/api_key, env_http_configured, env_twilio_configured `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Save SMS gateway; Disconnect.

## 7. Secondary Actions

Cancel/reset. Driver/method/auth selects.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

NOT APPLICABLE.

## 11. Selection

Driver http|twilio; method GET|POST; auth form|bearer.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Form processing.

## 14. Forms

POST validated: driver required, url requiredIf http and no existing/env, sender required alphanumeric max 11, api_key requiredIf http and no stored token, field names optional `[CONFIRMED-CODE]`. Password input never echoes key.

## 15. Overlays

Disconnect `window.confirm`.

## 16. States

Disconnected empty; connected badge + env flags; key_set placeholder bullets.

## 17. Empty State

“SMS gateway is disconnected” `[CONFIRMED-CODE]`.

## 18. Error Handling

Validation `[UNVERIFIED]` not bound on fields. 403 members.

## 19. Feedback

Toast save (key never shown again); toast disconnect `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Redirect GET sms, or setup finish if `return=start`. Breadcrumbs: SMS. Nav hidden in simple mode.

## 21. Entity Relationships

`Integration` PROVIDER_SMS; `Channel` type SMS; sequences/outbound SMS `[UNVERIFIED]`.

## 22. Business Rules

- Admin/owner
- Feature flag hides nav in simple mode; URL still works
- Key encrypted, write-only
- Twilio via env; HTTP aggregator default
- Quiet hours 21:00–08:00 Africa/Algiers (copy)
- Only +213 05/06/07 (copy; send-path enforcement `[UNVERIFIED]`)

## 23. Backend Dependencies

`SmsSettingsController`, `Integration`, `Channel`, `config/sms.php`.

## 24. Frontend Dependencies

Settings chrome, password Input.

## 25. Responsive Behavior

Wide pane, stacked rows `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: labels. LIKELY ISSUE: confirm(); errors not shown. REQUIRES MANUAL TEST: password managers on api_key.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-019-01 | MEDIUM | URL reachable when nav hidden (simple mode) | Power users configure SMS while launch mode on | runtime 200 vs `requiresSmsFeature` |
| SET-019-02 | LOW | Many aggregator fields vs setup wizard’s 3 fields | Two UX levels | wizard vs page |

## 28. Consistency Comparison

Communication + wide. Disconnect pattern like WhatsApp.

## 29. Functional Preservation Contract

- HTTP/Twilio driver
- Encrypted key write-only
- Field mapping
- Disconnect deletes key
- Admin + integrations + sms feature nav
- Setup return=start

## 30. Design Input Contract

Purpose: real SMS send path for DZ numbers.
Primary actions: Save; Disconnect.
Required information: driver, URL, auth, sender, key, field names, env flags.
Required states: disconnected, connected, key set, processing.
Must not remove: never display key; DZ-only copy; confirm disconnect.

## 31. Open Questions / Unknowns

- Should simple_mode 403 `/settings/sms` like tickets? `[UNKNOWN]`
- `status` prop unused `[CONFIRMED-CODE]`
