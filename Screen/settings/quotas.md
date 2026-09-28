# Quotas

## 1. Screen Identity

Screen ID: SCR-SET-011
Product area: Settings / CRM
Route: `/settings/quotas`
Route names: `settings.quotas` GET, `settings.quotas.update` PUT
Frontend file: `resources/js/pages/settings/quotas.tsx`
Primary component: `QuotaSettings`
Layout: `[AppLayout, SettingsLayout]`; **wide**.
Authentication: `auth` + `verified`.
Permissions:
- **Nav:** `adminOnly: true`
- **GET/PUT:** `can-manage-settings`
- PUT EPP → `settings.integrations` (generic settings.*) `[CONFIRMED-CODE]`
Parent navigation: Settings IA **CRM**, title **Quotas**.
Entry points: settings nav “Quotas”.
Exit points: Home (copy: Home compares month).
Runtime HTTP (owner, simple_mode=true): **200** `[CONFIRMED-UI]`. Props: `workspace_amount_dzd`, `timezone`, `month_label`, `people`.
Evidence: `QuotaController`; `quotas.tsx`; runtime-index.

## 2. Purpose

Set monthly closed-won target in DZD for the workspace and optional per-person targets. Home uses Africa/Algiers calendar month.

## 3. Current UX Summary

One card: workspace target input, then a people table of amount inputs, Save quotas.

## 4. Screen Anatomy

Header with dynamic month/timezone; card “Monthly targets”; workspace row; “Per person” table; save bar.

## 5. Data Displayed

`workspace_amount_dzd` (DZD integer from cents/100); `timezone` always `Africa/Algiers`; `month_label` e.g. current F Y; `people[]` id, name, role, amount_dzd `[CONFIRMED-BOTH]`.

## 6. Primary Actions

Save quotas (PUT).

## 7. Secondary Actions

Cancel/reset.

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT. All workspace users listed.

## 10. Sorting

Owner, admin, member, then name `[CONFIRMED-CODE]`.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

Saving writes all people rows in one PUT (implicit bulk).

## 13. Pagination / Loading Strategy

Full people list. Processing on save.

## 14. Forms

`workspace_amount_dzd` nullable numeric ≥0. `people[i][id]`, `people[i][amount_dzd]` nullable. Empty deletes personal quota. 0 treated as null `[CONFIRMED-CODE]`. Stored as cents.

## 15. Overlays

NOT PRESENT.

## 16. States

Empty placeholder “-” / “8000000”. Processing. No dedicated empty people (seed always has owner).

## 17. Empty State

NOT PRESENT.

## 18. Error Handling

Validation max; no field error UI `[CONFIRMED-CODE]`. 403 non-admin.

## 19. Feedback

Toast: “Monthly quotas saved. Home uses the current Africa/Algiers calendar month.” `[CONFIRMED-CODE]`. Redirect GET quotas.

## 20. Navigation Behavior

PRG to same page. Breadcrumbs: Quotas.

## 21. Entity Relationships

`Workspace.monthly_quota_cents`; `SalesQuota` per user; Home dashboard comparison `[UNVERIFIED]` UI of Home.

## 22. Business Rules

- Workspace target is **not** the sum of people (hint copy)
- Empty = no target
- Amounts DZD integers in UI, cents in DB
- Admin/owner only

## 23. Backend Dependencies

`QuotaController`, `SalesQuota`, `User`.

## 24. Frontend Dependencies

Settings chrome, `Input`, table markup.

## 25. Responsive Behavior

Person input `max-w-[10rem]` right-aligned. Table may overflow `[NOT VERIFIED]`. Wide pane.

## 26. Accessibility Observations

CONFIRMED: workspace label. People amounts lack unique labels (placeholder only) `[CONFIRMED-CODE]` LIKELY ISSUE.
REQUIRES MANUAL TEST: table SR.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
|---|---|---|---|---|
| SET-011-01 | MEDIUM | Per-person inputs unlabeled | SR/click-label fail | `quotas.tsx` |
| SET-011-02 | OBSERVATION | PUT gated `settings.integrations` | Odd | EPP |

## 28. Consistency Comparison

Card + save bar. Wide unlike Qualify. CRM group.

## 29. Functional Preservation Contract

- Workspace + per-person DZD
- Empty means none
- Africa/Algiers month copy
- Toast on save
- Admin-only

## 30. Design Input Contract

Purpose: monthly closed-won targets.
Primary action: Save quotas.
Required information: workspace amount, each person amount, month, timezone.
Required states: empty/filled, processing, success toast.
Must not remove: independent workspace vs people; cents conversion; timezone.

## 31. Open Questions / Unknowns

- Currency formatting (spaces, DZD suffix) `[UNKNOWN]` not in UI
- Inactive users still listed? `[UNVERIFIED]` all workspace users
