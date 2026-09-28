# Outbound mailboxes

## 1. Screen Identity

Screen ID: `SCR-OUT-002`
Product area: Outbound / Settings
Route: `/outbound/mailboxes`
Route name: `outbound.mailboxes.index`
Frontend file: `resources/js/pages/outbound/mailboxes/index.tsx`
Primary component: `MailboxesIndex`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Mailboxes"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET unrestricted by product permission; POST/PUT/DELETE require `outbound.manage` (`EnforceProductPermissions` maps `outbound.*` mutations). [CONFIRMED-CODE]
Parent navigation: Outbound primary tab **Settings** (href `/outbound/mailboxes`) + Settings subtab **Mailboxes**. [CONFIRMED-CODE]
Entry points: Settings tab, Overview mailbox links, Contacts list “Connect email” (`/outbound/mailboxes`), command palette via Outbound then tab.
Exit points: other outbound tabs/subtabs; Roundcube; remaining on page after mutations (`back()`).
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/mailboxes/index`, props `mailboxes`, `mail_stack`. [CONFIRMED-UI]
Evidence: `Screen/_evidence/runtime-index.json`; `MailboxController.php`; `mailboxes/index.tsx`.

## 2. Purpose

Configure SMTP/IMAP sending identities: add, edit, enable/disable, set default, send a real test, sync from the live mail stack, delete non-stack boxes.

## 3. Current UX Summary

Settings sub-nav, then `OutboundPage` title “SMTP mailboxes” with a long description. A HairlinePanel for stack sync (or connect-token instructions), an “Add mailbox” grid form, then a HairlineTable of boxes with inline action cluster and a `<details>` edit form per row.

## 4. Screen Anatomy

1. Room chrome: Settings primary tab active; subtabs Mailboxes, Domains, Warmup, Suppressions, Quiet hours. [CONFIRMED-CODE]
2. Page title + description (passwords encrypted; new boxes start disabled). [CONFIRMED-CODE]
3. Mail stack panel: Sync now **or** env-token instructions. [CONFIRMED-CODE]
4. Add mailbox form (4-column grid). [CONFIRMED-CODE]
5. HairlineTable (`minWidth` 880) with mobile card fallback. [CONFIRMED-CODE]
6. Per-row `MailboxActions` + `<details>Edit mailbox</details>`. [CONFIRMED-CODE]

## 5. Data Displayed

Controller maps each `Mailbox` plus `password_set`, `imap_password_set`, `imap_configured`, `effective_status`, `sent_today`. Passwords themselves are not sent. [CONFIRMED-CODE]

Table: name, default badge, Mail stack badge (`source === 'mail_stack'`), from_name/from_address, effective_status badge, SMTP host:port (encryption), IMAP replies on/off, sent_today/daily_limit, last_tested_at.

## 6. Primary Actions

- **Save mailbox** POST `/outbound/mailboxes` (`store`). [CONFIRMED-CODE]
- **Enable / Disable** POST `/outbound/mailboxes/{id}/toggle`. [CONFIRMED-CODE]
- **Send test** POST `/outbound/mailboxes/{id}/test` with `to` email; disabled if mailbox not enabled. [CONFIRMED-CODE]
- **Sync now** POST `/outbound/mailboxes/sync` when stack configured. [CONFIRMED-CODE]

## 7. Secondary Actions

- **Make default** POST `.../default` if not already default. [CONFIRMED-CODE]
- **Open Roundcube** external. [CONFIRMED-CODE]
- **Delete** with `window.confirm`; hidden for `source === 'mail_stack'`. DELETE `/outbound/mailboxes/{id}`. [CONFIRMED-CODE]
- **Save changes** PUT `/outbound/mailboxes/{id}` inside details. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT. List is all workspace mailboxes, latest first. [CONFIRMED-CODE]

## 10. Sorting

NOT PRESENT. Backend `latest()`. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT. No row checkboxes.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Full collection, no paginator. [CONFIRMED-CODE] Mutations use Inertia Form/`router` with `processing` disable on submit. [CONFIRMED-CODE]

## 14. Forms

**Create** POST `/outbound/mailboxes` — fields: name, from_name, from_address, daily_limit (default 50), host, port (587), encryption (tls/ssl/none), username, password, imap_host, imap_port (993), imap_encryption (ssl/tls/none), imap_username, imap_password. `resetOnSuccess`. [CONFIRMED-CODE]

**Update** PUT — same SMTP/IMAP fields; passwords optional (blank = keep); if enabled, Warmup status select `warming` | `active`. [CONFIRMED-CODE]

**Test** POST — `to` email required. [CONFIRMED-CODE]

Validation (store): name/from_name max 120, from_address email, host/username max 180, port min 1, encryption in tls,ssl,none, password required, daily_limit 0–10000. [CONFIRMED-CODE]

Create always `enabled=false`, `status=disabled`; first mailbox in workspace becomes `is_default`. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT. Native `window.confirm` for delete. Edit is inline `<details>`, not a modal. [CONFIRMED-CODE]

## 16. States

- Stack configured vs not. [CONFIRMED-CODE]
- Empty table: “No mailbox - SMTP is disabled.” [CONFIRMED-CODE]
- Enabled/disabled, warming/active/disabled badges. [CONFIRMED-CODE]
- Default / Mail stack badges. [CONFIRMED-CODE]
- Test button disabled when `!box.enabled`. [CONFIRMED-CODE]
- Form `processing`. [CONFIRMED-CODE]

## 17. Empty State

HairlineTable empty string above. Add form remains visible so empty is not a dead end. [CONFIRMED-CODE]

## 18. Error Handling

- Sync failure: Inertia flash toast type error with `reason`. [CONFIRMED-CODE]
- Test failure: toast error with `failure_reason`. [CONFIRMED-CODE]
- Mail-stack delete blocked with error toast (must remove on stack). [CONFIRMED-CODE]
- Cross-workspace mailbox: 404. [CONFIRMED-CODE]
- Validation errors: Inertia Form (create form does not render `errors.*` inline except processing). [CONFIRMED-CODE] LIKELY ISSUE: create form has no error text nodes.

## 19. Feedback

- Sync success toast: `"Mail stack sync: {total} mailbox(es) — {created} added, {updated} updated."` [CONFIRMED-CODE]
- Test success/error toasts. [CONFIRMED-CODE]
- Canonical toaster: Sonner via `useFlashToast`. [CONFIRMED-CODE]
- Enable/disable/default/update: silent `back()` — no toast. [CONFIRMED-CODE]

## 20. Navigation Behavior

- Mutations `return back()` except none redirect away. [CONFIRMED-CODE]
- Breadcrumbs: Mailboxes → `/outbound/mailboxes`. [CONFIRMED-CODE]
- Settings subtabs include Warmup even when simple_mode 403s that route. [CONFIRMED-CODE] [CONFIRMED-UI] warmup 403.

## 21. Entity Relationships

Mailbox belongs to Workspace. Used by sequences, campaigns, outbox, warmup, reply poller. Test send creates/finds Contact (`source=mailbox_test`) and `OutboundMessage`.

## 22. Business Rules

- New boxes start disabled; enable sets status `warming`; disable sets `disabled`. [CONFIRMED-CODE]
- Status `warming`/`active` only writable when enabled. [CONFIRMED-CODE]
- Passwords write-only. [CONFIRMED-CODE]
- Mail-stack boxes cannot be deleted in CRM. [CONFIRMED-CODE]
- Set default clears other defaults. [CONFIRMED-CODE]
- Test uses `OutboundDispatcher`; records `last_tested_at`. [CONFIRMED-CODE]
- Without enabled mailbox, copy says outbound uses Disabled provider and fails in outbox. [CONFIRMED-CODE]
- Sync also scheduled every 15 minutes (controller comment). [CONFIRMED-CODE] scheduler [UNVERIFIED] here.

## 23. Backend Dependencies

`MailboxController`, `Mailbox`, `Contact`, `MailboxSync`, `OutboundDispatcher`. Routes: index/store/sync/update/toggle/default/test/destroy.

## 24. Frontend Dependencies

`OutboundPage`, `OutboundShell`, `HairlinePanel`, `HairlineTable`, `Badge`, `Button`, `Input`, `Label`, `NativeSelect`, Inertia `Form`, `router`.

## 25. Responsive Behavior

HairlineTable: desktop table `@[480px]/hairline`; below that mobile title/meta/footer. [CONFIRMED-CODE]
Add/edit forms `md:grid-cols-4`. [CONFIRMED-CODE]
Action cluster `flex-wrap`. [CONFIRMED-CODE]
NOT VERIFIED in a viewport.

## 26. Accessibility Observations

CONFIRMED:

- Test recipient input `aria-label="Test recipient"`. [CONFIRMED-CODE]
- Labels on create/edit fields. [CONFIRMED-CODE]

LIKELY ISSUE:

- `<details>/<summary>` “Edit mailbox” is the only disclosure control; no button semantics beyond native details. [CONFIRMED-CODE]
- Delete/enable have no `aria` besides visible text. [CONFIRMED-CODE]
- Table actions packed; likely cramped for keyboard. [CONFIRMED-CODE]

REQUIRES MANUAL TEST: confirm dialogs, password managers, focus after sync.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-010 | HIGH | Create form does not surface Inertia validation errors. | Failed save looks like a no-op. | `mailboxes/index.tsx` create Form only uses `processing` [CONFIRMED-CODE] |
| UX-OUT-011 | MEDIUM | Enable immediately sets `warming` with no explanation on this row except badge. | Operator may not know warmup is a separate (and simple-mode-blocked) screen. | `toggle()`, simple_mode warmup 403 [CONFIRMED-CODE] [CONFIRMED-UI] |
| UX-OUT-012 | MEDIUM | Settings subtab Warmup remains clickable in simple_mode → 403. | Dead-end from this chrome. | `room-shell.tsx` OUTBOUND_SETTINGS_SUB; runtime 403 [CONFIRMED-BOTH] |
| UX-OUT-013 | LOW | Dense action row (toggle, default, test input, Roundcube, delete) in table cell. | Horizontal overflow / misclicks. | `MailboxActions` [CONFIRMED-CODE] |
| UX-OUT-014 | OBSERVATION | Enable/disable/default have no toast. | Uncertain if save worked. | `MailboxController` [CONFIRMED-CODE] |

## 28. Consistency Comparison

Same HairlinePanel+Table pattern as Sequences. Unlike Domains, uses HairlineTable. Test-send pattern unique. Contacts empty-state links here.

## 29. Functional Preservation Contract

Must keep: list of workspace mailboxes without exposing secrets; add SMTP+IMAP; edit with blank-password keep; enable/disable; default; SMTP test to an address; stack sync; prevent deleting stack-synced boxes; daily_limit; warmup status when enabled; Roundcube link; toasts for sync/test/stack-delete.

## 30. Design Input Contract

- Purpose: manage sending mailboxes.
- Primary goal: get at least one enabled, tested mailbox.
- Primary actions: add, enable, test, sync.
- Secondary: default, edit, delete, Roundcube.
- Required information: from identity, SMTP/IMAP, status, sent today/cap, last test, source.
- Required states: empty, stack on/off, disabled/warming/active, processing, confirm delete.
- Must not remove: password write-only behavior, stack-delete guard, test logging to outbox, workspace 404.

## 31. Open Questions / Unknowns

- Seed mailbox count and whether stack is configured on this DB. [UNKNOWN] GET 200 only.
- Scheduler 15-minute sync actually registered? [UNVERIFIED]
- Member without `outbound.manage` can view but not mutate — UI still shows buttons. [CONFIRMED-CODE] [UNVERIFIED] 403 on POST.
