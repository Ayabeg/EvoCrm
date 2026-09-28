# Connectors

## 1. Screen Identity

Screen ID: SCR-SET-022
Product area: Settings / Integrations
Route: `/settings/connectors`
Route names: `settings.connectors` GET; `store` POST; `google` GET reconnect; `sync.start` / `sync.pause` POST
Frontend file: `resources/js/pages/settings/connectors.tsx`
Primary component: `ConnectorsSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.integrations'`
- **GET:** EPP skip
- **POST store/sync/pause:** `settings.integrations`
- `can_configure` = same capability (hides actions)
- Google reconnect 404 if GoogleAuth disabled
Parent navigation: Settings IA **Integrations**, title **Connectors**.
Entry points: settings nav; Apps Google Manage; setup Google connect URL.
Exit points: Inbox for desk channels; Google OAuth; reconnect anchors.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: googleEnabled, googleCallback, googleOrigin, deskConnectors, googleConnectors, can_configure.
Evidence: `ConnectorController`; `connectors.tsx`; runtime-index.

## 2. Purpose

Show **instances and sync jobs** (vs Apps products). Google Gmail/Calendar intent + sync; official Desk channels status (Meta Cloud only, no Baileys).

## 3. Current UX Summary

Google section (origin/callback copy, cards or empty) then Official Desk channels read-only cards.

## 4. Screen Anatomy

Header; Google h2 + URI help; GoogleConnectorCard(s) or empty; Desk h2 + Inbox link; desk cards with ChannelMark.

## 5. Data Displayed

googleEnabled, callback, origin; googleConnectors (name, tagline, status, scopes_on_client, reconnect_url, account_label, sync {status, last_synced_at, last_error, has_token}); deskConnectors name/tagline/status/provider `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Save {name} intent; Reconnect Google; Start sync; Pause sync.

## 7. Secondary Actions

Inbox link. Desk cards have no connect buttons (copy: connect from Inbox).

## 8. Search

NOT PRESENT.

## 9. Filters

Two sections only.

## 10. Sorting

Catalog order from `ConnectorRegistrar` `[UNVERIFIED]`.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Form processing per button.

## 14. Forms

POST provider hidden. POST sync/pause per provider. Reconnect is GET redirect OAuth.

## 15. Overlays

NOT PRESENT.

## 16. States

Google not configured empty; reconnect empty (`showReconnectEmpty`); connected with sync panel; can_configure false; desk statuses.

## 17. Empty State

“Google is not configured”; “Reconnect Google” per connector; desk list may still render `[CONFIRMED-CODE]`.

## 18. Error Handling

Sync last_error in panel. Toasts on store/sync/pause `[CONFIRMED-CODE]`. 404 unofficial WhatsApp provider refused.

## 19. Feedback

Toasts: intent saved, sync started/paused `[CONFIRMED-CODE]`.

## 20. Navigation Behavior

Stay except OAuth. Breadcrumbs: Apps → Connectors. `return=start` on Google reconnect for wizard `[CONFIRMED-CODE]`.

## 21. Entity Relationships

Gmail/Calendar connectors; Desk official connectors; Inbox; Google OAuth client shared with login but extra scopes.

## 22. Business Rules

- EvoSales does not send mail from these connectors (copy)
- No unofficial WhatsApp
- WhatsApp Cloud Evolution only
- Intent can be saved without live Google
- Nav/actions `settings.integrations`

## 23. Backend Dependencies

`ConnectorController`, `ConnectorRegistrar`, `GoogleMailSync`, `GoogleCalendarSync`, `GoogleAuth`.

## 24. Frontend Dependencies

`connectorStatusLabel`, `ChannelMark`, settings chrome.

## 25. Responsive Behavior

Wide pane; wrap action buttons `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: section headings.
LIKELY ISSUE: reconnect empty vs actions duplication.
REQUIRES MANUAL TEST: OAuth round-trip.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-022-01 | MEDIUM | Desk channels not actionable | User must leave for Inbox | copy + no buttons |
| SET-022-02 | LOW | “Save intent” vs “Reconnect” dual CTAs | Unclear which is needed | GoogleConnectorCard |

## 28. Consistency Comparison

Integrations pair with Apps. Wide. Status cards like Apps.

## 29. Functional Preservation Contract

- Google origin/callback display
- Intent save, reconnect, start/pause sync
- Sync status/error/token flags
- Desk catalog read-only
- can_configure
- Refuse unofficial WhatsApp

## 30. Design Input Contract

Purpose: manage Google sync instances and see official desk channels.
Primary actions: reconnect, sync, pause, save intent.
Required information: URIs, status, last sync, errors, desk statuses.
Required states: Google off, needs scopes, connected, error, no permission.
Must not remove: no mail-send claim; official Meta Cloud only.

## 31. Open Questions / Unknowns

- Desk connector providers list `[UNVERIFIED]` catalog contents
- Sync is sync vs async job `[UNKNOWN]`
