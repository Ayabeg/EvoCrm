# Members (People)

## 1. Screen Identity

Screen ID: SCR-SET-005
Product area: Settings / Workspace
Route: `/settings/people`
Route names: `settings.people` GET; `settings.people.store` POST; `settings.people.resend` POST; `settings.people.role` PUT; `settings.people.destroy` DELETE
Frontend file: `resources/js/pages/settings/people.tsx`
Primary component: `People`
Layout: `[AppLayout, SettingsLayout]`; **wide** (`WIDE_SETTINGS_COMPONENTS` includes `settings/people`).
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `adminOnly: true` (owner or admin) `[CONFIRMED-CODE]`
- **All routes:** `can-manage-settings` `[CONFIRMED-CODE]`
- **Mutations:** `EnforceProductPermissions` → `settings.people` `[CONFIRMED-CODE]`
- Capability default: owner/admin true, member false (`config/permissions.php`)
Parent navigation: Settings IA **Workspace**, title **Members**.
Entry points: settings nav “Members”.
Exit points: invite drawer close; settings siblings; Outbound Mailboxes mentioned in empty-mailbox banner.
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `people`, `ownerCount`, `actorRole`, `hasEnabledMailbox`.
Evidence: `PeopleController`; `people.tsx`; `routes/settings.php`; runtime-index.

## 2. Purpose

List workspace users, invite admin/member, change roles, resend pending invites, remove people (not self).

## 3. Current UX Summary

Header + Invite button, hairline table of people, invite `CreateDrawer`. Role `<select>` inline. Remove uses confirm dialog.

## 4. Screen Anatomy

1. App + settings chrome (wide pane)
2. Header “Members” + primary Invite
3. Table: Name (you), Email, Role badge, Last login / invited, Status, Actions
4. Invite drawer: name, email, role member|admin
5. Remove dialog

## 5. Data Displayed

Per row: `id`, `name`, `email`, `role`, `status` active|pending (`email_verified_at`), `last_login_at`, `invited_at`, `is_self`. Also `ownerCount`, `actorRole`, `hasEnabledMailbox` `[CONFIRMED-BOTH]`.

## 6. Primary Actions

- Invite (drawer → POST store)
- Change role (PUT)
- Remove (DELETE)

## 7. Secondary Actions

- Resend invite (pending only)
- Cancel drawer / dialog

## 8. Search

NOT PRESENT on the table. Settings nav filter only.

## 9. Filters

NOT PRESENT.

## 10. Sorting

Server order: owner, admin, then member, then name `[CONFIRMED-CODE]`. No user sort.

## 11. Selection

NOT PRESENT (no row checkboxes).

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Full list, no paginator `[CONFIRMED-CODE]`. Inertia `preserveScroll` on mutations.

## 14. Forms

Invite: `name` required max 120, `email` unique, `role` admin|member only (never owner) `[CONFIRMED-CODE]`.
Role PUT: `role` admin|member only — cannot promote to owner through this UI.

## 15. Overlays

`CreateDrawer` invite; Remove `Dialog`.

## 16. States

- Rows with (you)
- Role select disabled via `canTouchRow`: self; non-owner touching owner; last owner `[CONFIRMED-CODE]`
- Pending vs Active badges
- Mailbox warning in drawer if `!hasEnabledMailbox`
- Empty people array theoretically possible but seed has owner `[UNVERIFIED]` empty UI (table would just have no rows — no dedicated empty component)

## 17. Empty State

NOT PRESENT as dedicated empty. Table body would be blank `[CONFIRMED-CODE]`.

## 18. Error Handling

Toasts for mailbox missing, resend on already-active, last-owner demote/remove, self-delete blocked `[CONFIRMED-CODE]`. 403/404 workspace mismatch.

## 19. Feedback

Success/error Inertia toasts (invite sent, role change, removed, mailbox failure).

## 20. Navigation Behavior

Stay on page (`back()`). Breadcrumbs: Members.

## 21. Entity Relationships

`User` in current `workspace_id`. Invite mail via `WorkspaceInviteMailer` + enabled `Mailbox`. Contacts/deals stay unassigned on remove (dialog copy) `[CONFIRMED-CODE]` UI copy; unassign implementation `[UNVERIFIED]` (user delete cascade).

## 22. Business Rules

- Owner never invited here
- Last owner cannot be demoted or removed
- Only owner may touch another owner
- Cannot remove self (use Profile delete)
- Pending = unverified email
- Invites need mailbox to actually send; person still created pending

## 23. Backend Dependencies

`PeopleController`, `WorkspaceInviteMailer`, `Mailbox`, `WorkspaceRole`, `EnsureUserCanManageSettings`, EPP `settings.people`.

## 24. Frontend Dependencies

`CreateDrawer`, `HairlineTable`, `NativeSelect`, `Dialog`, `PeopleController` wayfinder, `Badge`, `Button`.

## 25. Responsive Behavior

Table `minWidth="40rem"` — horizontal scroll in hairline table `[CONFIRMED-CODE]`. Wide pane. Viewport `[NOT VERIFIED]`.

## 26. Accessibility Observations

CONFIRMED: role select `aria-label={`Role for ${name}`}`.
LIKELY ISSUE: Invite button not `aria-expanded`; table has no caption.
REQUIRES MANUAL TEST: drawer focus, dialog, disabled selects announced.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-005-01 | MEDIUM | No table search/filter | Hard to find people at scale | `people.tsx` |
| SET-005-02 | LOW | No empty-state component | Blank table if zero users | `people.tsx` |
| SET-005-03 | OBSERVATION | Hardcoded “Evotechly” in copy | Wrong workspace name if renamed | header + dialog |

## 28. Consistency Comparison

Wide table like Attributes. Invite drawer matches CRM create drawers. Unique: role matrix rules.

## 29. Functional Preservation Contract

- List all workspace users
- Invite admin/member
- Resend pending
- Role change with last-owner / self / owner-touch rules
- Remove with confirm
- Mailbox warning
- `settings.people` + can-manage-settings

## 30. Design Input Contract

Purpose: who can sign in and at what role.
Primary actions: Invite, change role, remove.
Secondary: resend.
Required information: name, email, role, status, last login/invite.
Required components: table, invite drawer, remove dialog, mailbox callout.
Required states: active/pending, disabled role, last owner, no mailbox.
Must not remove: owner-protection rules; no owner invite.

## 31. Open Questions / Unknowns

- Ownership transfer path (copy says it exists elsewhere) `[UNKNOWN]`
- User delete cascade vs unassign `[UNVERIFIED]`
