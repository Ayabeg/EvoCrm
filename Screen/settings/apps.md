# Apps marketplace

## 1. Screen Identity

Screen ID: SCR-SET-020
Product area: Settings / Integrations
Route: `/settings/apps`
Route name: `settings.apps`
Frontend file: `resources/js/pages/settings/apps/index.tsx`
Primary component: `AppsMarketplace`
Layout: `[AppLayout, SettingsLayout]`; not wide.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `permission: 'settings.integrations'`
- **GET:** EPP skip
- Connect buttons require `can_configure` = `settings.integrations`
Parent navigation: Settings IA **Integrations**, title **Apps**.
Entry points: settings nav; setup “Apps” links; WhatsApp disconnect redirects here.
Exit points: `/settings/setup`; Manage URLs (meta, whatsapp, connectors, outbound mailboxes); Facebook connect; webmail.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `can_configure`, `apps`.
Evidence: `AppsController::index`; `apps/index.tsx`; runtime-index.

## 2. Purpose

Directory of real workspace apps (Meta, WhatsApp, WhatsApp Business, Google, Email/SMTP) with connection status — “not a live health probe” (header copy).

## 3. Current UX Summary

Header + Get started; empty if no apps; “Nothing connected yet” plus cards; each card logo, badge, tagline, unlocks (Meta), Google Console URIs, SMTP mailbox count, connect/manage.

## 4. Screen Anatomy

Header; empty states; stack of SettingsCards via `AppCard`.

## 5. Data Displayed

Per app: key, name, tagline, connected, status, account_label, connect_url, manage_url, unlocks, plus Google callback/origin, SMTP mailboxes/webmail, Meta connected_at `[CONFIRMED-CODE]`. Runtime `apps` array `[CONFIRMED-UI]`.

## 6. Primary Actions

Get started → `/settings/setup`; Continue with Facebook for meta/whatsapp*; Manage.

## 7. Secondary Actions

Open webmail (SMTP); Google URI copy (display only).

## 8. Search

NOT PRESENT on marketplace (settings nav filter can match “Apps”).

## 9. Filters

NOT PRESENT.

## 10. Sorting

Fixed controller order: Meta, WhatsApp, WhatsApp Business, Google, SMTP `[CONFIRMED-CODE]`.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Static list.

## 14. Forms

NOT PRESENT on this page (OAuth links).

## 15. Overlays

Facebook popup `[UNVERIFIED]`.

## 16. States

connected / not_connected / needs_attention badges; can_configure false hides Facebook buttons; connectedCount 0 extra empty.

## 17. Empty State

“No apps on this workspace” if array empty; “Nothing connected yet” if all disconnected `[CONFIRMED-CODE]`.

## 18. Error Handling

Status needs_attention destructive badge. No form errors.

## 19. Feedback

None on GET. `data-settings="disconnected"` copy.

## 20. Navigation Behavior

Breadcrumbs: Apps. Manage navigates away. Google manage → connectors; SMTP → `/outbound/mailboxes` (simple mode still allows outbound mailboxes `[UNVERIFIED]`).

## 21. Entity Relationships

Integrations, mailboxes, WhatsAppConnector, MetaAuth unlocks, GoogleAuth.

## 22. Business Rules

- Only real backend apps (controller comment)
- Connected = configuration exists, not live probe
- Nav `settings.integrations`
- Configure actions need same capability

## 23. Backend Dependencies

`AppsController::index`, MetaAuth, InstagramAuth, GoogleAuth, WhatsAppConnector, Mailbox.

## 24. Frontend Dependencies

Brand marks, BrandConnectButtons, settings chrome.

## 25. Responsive Behavior

Cards stack; wrap actions `[CONFIRMED-CODE]`. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: headings per card.
LIKELY ISSUE: Check/Minus icons without text alternative beyond adjacent label.
REQUIRES MANUAL TEST: Facebook buttons.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-020-01 | MEDIUM | Google has no Facebook-style connect on card (manage → connectors) | Extra hop | AppCard conditions |
| SET-020-02 | LOW | Dual empty states can stack with cards | Noise | connectedCount === 0 still maps apps |

## 28. Consistency Comparison

Integrations group. Cards like Evolution. Get started unique.

## 29. Functional Preservation Contract

- Five real apps
- Status badges
- Meta unlocks list
- Google URI help
- SMTP mailbox count + webmail
- Get started
- can_configure

## 30. Design Input Contract

Purpose: see what is connected and jump to setup/manage.
Primary actions: Get started; Connect; Manage.
Required information: name, status, account, unlocks, URIs.
Required states: none connected, mixed, needs attention, no permission.
Must not remove: no fake tiles; “not a health probe” meaning.

## 31. Open Questions / Unknowns

- `needs_attention` ever set for these five? `[UNVERIFIED]`
- `setup_url` unused in UI `[CONFIRMED-CODE]`
