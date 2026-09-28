# Outbound suppressions

## 1. Screen Identity

Screen ID: `SCR-OUT-013`
Product area: Outbound / Settings
Route: `/outbound/suppressions`
Route name: `outbound.suppressions.index`
Frontend file: `resources/js/pages/outbound/suppressions.tsx`
Primary component: `SuppressionsIndex`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Suppressions"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET open; POST/DELETE `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Settings subtab **Suppressions**.
Entry points: subtab; Overview suppressed KPI; public unsubscribe lands records here (copy).
Exit points: room tabs.
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/suppressions`, prop `items`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `SuppressionController.php`; `suppressions.tsx`.

## 2. Purpose

Manually add or remove emails/phones that must never receive automated outbound. Sequences skip, campaigns fail honestly, public unsub writes here.

## 3. Current UX Summary

Add form (type, value, reason) then a table Type / Value / Reason / Remove. `source` is loaded but not shown. No empty row.

## 4. Screen Anatomy

1. Settings chrome (includes Warmup subtab). [CONFIRMED-CODE]
2. Title + description. [CONFIRMED-CODE]
3. Add form `md:grid-cols-4`. [CONFIRMED-CODE]
4. Table. [CONFIRMED-CODE]

## 5. Data Displayed

All `Suppression` rows `orderByDesc id`: id, type, value, reason, source. [CONFIRMED-CODE]
UI: type, value, reason or —, Remove.

## 6. Primary Actions

- **Add** POST `/outbound/suppressions`. [CONFIRMED-CODE]

## 7. Secondary Actions

- **Remove** confirm DELETE `/outbound/suppressions/{id}`. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT (email vs phone is create-time type, not a list filter). [CONFIRMED-CODE]

## 10. Sorting

Newest id first. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT (no CSV import). [CONFIRMED-CODE]

## 13. Pagination / Loading Strategy

Full collection. [CONFIRMED-CODE] Form `resetOnSuccess`. [CONFIRMED-CODE]

## 14. Forms

type email|phone; value required max 190; reason nullable default “manual”. [CONFIRMED-CODE]
`SuppressionService::suppress(..., reason ?? 'manual', source 'settings')`. [CONFIRMED-CODE]
No inline errors. [CONFIRMED-CODE]

## 15. Overlays

`window.confirm` remove. [CONFIRMED-CODE]

## 16. States

Processing on add. [CONFIRMED-CODE]
Empty tbody if no items (header remains). [CONFIRMED-CODE]

## 17. Empty State

NOT PRESENT. [CONFIRMED-CODE]

## 18. Error Handling

Workspace 404 on destroy. [CONFIRMED-CODE]
Duplicate behavior inside `SuppressionService` not read fully. [UNVERIFIED]

## 19. Feedback

No toasts. [CONFIRMED-CODE]

## 20. Navigation Behavior

`back()`. Breadcrumb title “Suppression” (singular) vs page “Suppressions”. [CONFIRMED-CODE]

## 21. Entity Relationships

Suppression workspace-scoped. Consulted by SequenceEnrollment and campaign expand. Public unsubscribe (`SCR-PUB-004`) writes here per copy.

## 22. Business Rules

- Automated outbound must not send to suppressed values. [CONFIRMED-CODE] tests `SuppressionTest`.
- Manual source labeled `settings`. [CONFIRMED-CODE]
- Type constrained to email|phone. [CONFIRMED-CODE]

## 23. Backend Dependencies

`SuppressionController`, `Suppression`, `SuppressionService`.

## 24. Frontend Dependencies

Outbound*, Button, Input, Label, Form, router. Native select.

## 25. Responsive Behavior

Form 4-col on md; table overflow-x. [CONFIRMED-CODE] NOT VERIFIED.

## 26. Accessibility Observations

CONFIRMED: Labels on add fields. [CONFIRMED-CODE]
LIKELY ISSUE: type select not htmlFor-linked; empty table; confirm-only delete. [CONFIRMED-CODE]
REQUIRES MANUAL TEST.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-120 | MEDIUM | No empty state, no search, no source column (unsub vs bounce vs manual). | Cannot audit why someone is blocked. | `source` unused in UI [CONFIRMED-CODE] |
| UX-OUT-121 | LOW | Breadcrumb “Suppression” vs title “Suppressions”. | Minor inconsistency. | layout breadcrumbs [CONFIRMED-CODE] |
| UX-OUT-012 | MEDIUM | Warmup subtab 403 in simple_mode. | Shared chrome. | [CONFIRMED-BOTH] |

## 28. Consistency Comparison

Create-on-page like domains. Remove+confirm like domains. Thinner than mailboxes.

## 29. Functional Preservation Contract

Must keep: email/phone add; reason; delete with confirm; workspace isolation; description of sequence skip / campaign fail / public unsub.

## 30. Design Input Contract

- Purpose: legal/operational do-not-contact list.
- Primary goal: add a value quickly and remove mistakes.
- Required information: type, value, reason (source should be visible).
- Must not remove: blocking behavior described in copy.

## 31. Open Questions / Unknowns

- Seed suppression count. [UNKNOWN]
- Normalization of phone/email in SuppressionService. [UNVERIFIED]
- Bounce webhook also inserts suppressions? [UNVERIFIED]
