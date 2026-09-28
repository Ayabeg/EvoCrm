# Meta (leads / ads / CAPI)

## 1. Screen Identity

Screen ID: SCR-SET-017
Product area: Settings / Communication
Route: `/settings/meta`
Route names: `settings.meta` GET; `ad-account` PUT; `mappings` PUT; `conversions` PUT; `sync` POST; `webhook-url` POST (reveal)
Frontend file: `resources/js/pages/settings/meta.tsx`
Primary component: `MetaSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.integrations'`
- **GET:** EPP skip
- **Mutations:** `can-manage-settings` + EPP `settings.integrations`
- `can_manage` prop = `role->canManageSettings()` (disables fields)
Parent navigation: Settings IA **Communication**, title **Meta**.
Entry points: settings nav; “Connection details” from this page goes to Apps Meta.
Exit points: `/settings/apps/meta`; `/auth/meta`; Facebook popup.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Many props (connected, status, accounts, mappings, logs, webhook_callback, …).
Evidence: `MetaSettingsController`; `meta.tsx`; runtime-index.

## 2. Purpose

Manage the workspace Meta connection for Pages, Instagram, lead forms, field mapping, Conversions API, and sync/logs. Tokens stay encrypted.

## 3. Current UX Summary

Long stacked cards: empty if disconnected, Connection, Ad accounts, Pages/IG, Lead forms & webhook, Field mapping, CAPI, Sync buttons, Logs.

## 4. Screen Anatomy

Header; empty; Connection (badge, account, graph, reconnect); Ad account select; Pages/Instagram lists; Secret webhook field + forms; mapping rows; pixel + conversion configs; sync kinds; webhook/conversion logs.

## 5. Data Displayed

Runtime keys `[CONFIRMED-UI]`: connected, status, account_label, app_id_set, ad_account_id_set, ad_accounts, selected_ad_account_id, graph_version, reason, can_manage, connect_url, expires_at, last_sync_at, webhook_callback, verify_token_set, pages, instagram_accounts, forms, field_mappings, default_mappings, conversion_configs, conversion_events, sync_runs, webhook_events, conversion_logs, last_success_at.
`app_id_set`, `verify_token_set`, `last_success_at` unused in page TS `[CONFIRMED-CODE]`.

## 6. Primary Actions

Continue with Facebook; Save account; Save mappings; Save conversions; Sync (ads/forms/leads/all); Reveal webhook URL.

## 7. Secondary Actions

Connection details; Reconnect; Add mapping row.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT. Logs limited server-side (10/20/50).

## 10. Sorting

Forms latest synced; mappings by meta_field; logs latest `[CONFIRMED-CODE]`.

## 11. Selection

Ad account `<select>`; conversion event selects; mapping pairs; enable checkboxes.

## 12. Bulk Actions

Full sync kind `all`. Mapping save sends entire array.

## 13. Pagination / Loading Strategy

Limits not paginated. Processing per form. Mapping state is React-controlled.

## 14. Forms

PUT ad-account_id in discovered list. PUT mappings transformed from state. PUT conversions pixel_id + configs[]. POST sync kind. POST reveal webhook (admin).

## 15. Overlays

`SecretCallbackField` may reveal `[UNVERIFIED]` implementation. Facebook popup.

## 16. States

not_connected / connected / needs_attention; can_manage false disables writes; no forms; no sync runs; empty logs.

## 17. Empty State

“Meta is disconnected” `[CONFIRMED-CODE]`. Sub-empties: None pages/IG, No forms, No sync, None logs.

## 18. Error Handling

`errors.ad_account_id` shown. Other forms little error UI. `reason` shown in brand color. 403 mutations.

## 19. Feedback

Audit on ad account select `[CONFIRMED-CODE]`. Other toasts `[UNVERIFIED]`. Button processing.

## 20. Navigation Behavior

Stay on page except OAuth. Breadcrumbs: Meta. Link to Apps Meta.

## 21. Entity Relationships

Meta Integration; lead forms; field mappings; conversion configs/events; sync runs; webhook endpoint; Ads product (`ads.manage` is separate). Simple mode 403s `/ads*` but **not** this settings page `[CONFIRMED-CODE]`.

## 22. Business Rules

- Official Facebook Login only
- Tokens encrypted; webhook key is tenant secret
- CAPI hashes email/phone (copy)
- can_manage owner/admin for writes
- Nav `settings.integrations`

## 23. Backend Dependencies

`MetaSettingsController`, `WorkspaceMetaCredentials`, `MetaSyncService`, `MetaConversionsService`, `WebhookEndpointManager`, `AuditLogger`.

## 24. Frontend Dependencies

`SecretCallbackField`, BrandConnectButtons, settings chrome, mapping `useState`.

## 25. Responsive Behavior

Wide pane; mapping `grid-cols-2`; logs `md:grid-cols-2`; conversion `md:grid-cols-4` `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: some labels (ad account, pixel).
LIKELY ISSUE: mapping inputs unlabeled; logs raw text.
REQUIRES MANUAL TEST: secret reveal, OAuth.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-017-01 | HIGH | Very long single page | Hard to find mapping vs CAPI | `meta.tsx` |
| SET-017-02 | MEDIUM | Duplicate Meta surfaces (this, Apps Meta, Setup Meta) | Unclear source of truth | three screens |
| SET-017-03 | LOW | Unused props | Dead | controller vs page |

## 28. Consistency Comparison

Communication group but operationally Ads/CRM. Wide. Heavier than Evolution cards.

## 29. Functional Preservation Contract

- Connect/reconnect Facebook
- Ad account select
- Webhook secret
- Lead forms list
- Field mappings CRUD rows
- CAPI pixel + event map + stats
- Sync kinds + run list
- Webhook/conversion logs
- can_manage disable
- Encrypted-token copy

## 30. Design Input Contract

Purpose: operate Meta leadgen and conversion loop.
Primary actions: connect, save account, save mappings, save conversions, sync.
Required information: connection health, accounts, pages, forms, mappings, CAPI, logs.
Required states: disconnected, needs attention, connected, empty lists, no permission.
Must not remove: no raw tokens; hashed PII copy; official OAuth.

## 31. Open Questions / Unknowns

- Reveal webhook UX details `[UNVERIFIED]`
- Historical leads sync duration `[UNKNOWN]`
