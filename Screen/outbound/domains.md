# Outbound sending domains

## 1. Screen Identity

Screen ID: `SCR-OUT-003`
Product area: Outbound / Settings
Route: `/outbound/domains`
Route name: `outbound.domains.index`
Frontend file: `resources/js/pages/outbound/domains/index.tsx`
Primary component: `DomainsIndex`
Layout: `AppLayout` + `OutboundShell` / `OutboundPage`. Title `"Sending domains"`.
Authentication: `auth`, `verified`. [CONFIRMED-CODE]
Permissions: GET open; mutations `outbound.manage`. [CONFIRMED-CODE]
Parent navigation: Settings subtab **Domains**.
Entry points: Settings subnav; Overview KPI “Domains”.
Exit points: other outbound tabs; stay on page after mutations (`back()`).
Runtime HTTP (owner, simple_mode=true): `200`, component `outbound/domains/index`, prop `domains`. [CONFIRMED-UI]
Evidence: `runtime-index.json`; `DomainController.php`; `domains/index.tsx`.

## 2. Purpose

Store sending-domain DNS checklists (SPF/DKIM/DMARC) and a **manual** verified flag. The product never looks up DNS.

## 3. Current UX Summary

Page description states EvoSales stores the checklist and never calls a DNS API. Add-domain form, then per-domain articles: badge, mark verified/unverified, delete, checklist table with copy buttons, `<details>` edit records.

## 4. Screen Anatomy

1. Settings room chrome + subtabs. [CONFIRMED-CODE]
2. Title “Sending domains” + description. [CONFIRMED-CODE]
3. Add domain form (2-col grid). [CONFIRMED-CODE]
4. Empty copy or list of domain articles. [CONFIRMED-CODE]
5. Per domain: name, status badge, verified_at, Mark verified/unverified, Delete. [CONFIRMED-CODE]
6. Checklist table: Record, Type, Host, Value, Copy. [CONFIRMED-CODE]
7. Edit records details form. [CONFIRMED-CODE]

## 5. Data Displayed

Each domain: `toArray()` plus `checklist()` — SPF TXT at domain, DKIM TXT at `{selector}._domainkey.{domain}`, DMARC TXT at `_dmarc.{domain}`, `ready` if value filled. [CONFIRMED-CODE]
Status `verified` | `unverified`. Missing values show “missing — paste it below”. [CONFIRMED-CODE]

## 6. Primary Actions

- **Add domain** POST `/outbound/domains`. [CONFIRMED-CODE]
- **Mark verified / Mark unverified** POST `/outbound/domains/{id}/verify`. [CONFIRMED-CODE]
- **Copy** clipboard for each record with value. [CONFIRMED-CODE]

## 7. Secondary Actions

- **Save records** PUT `/outbound/domains/{id}` (spf, dkim_selector, dkim_record, dmarc_record, notes). [CONFIRMED-CODE]
- **Delete** with confirm DELETE `/outbound/domains/{id}`. [CONFIRMED-CODE]

## 8. Search

NOT PRESENT.

## 9. Filters

NOT PRESENT.

## 10. Sorting

Backend `orderBy('domain')`. No UI sort. [CONFIRMED-CODE]

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

All workspace domains. [CONFIRMED-CODE] Copy button local React state 1.5s “Copied”. [CONFIRMED-CODE]

## 14. Forms

**Store** validates: domain regex FQDN, unique per workspace, max 190; optional SPF/DKIM/DMARC/notes. Domain lowercased. Status starts `unverified`. Blank DMARC → `OutboundDomain::defaultDmarc` (`v=DMARC1; p=quarantine; rua=mailto:postmaster@{domain}`). [CONFIRMED-CODE]
Create form shows `errors.domain`. [CONFIRMED-CODE]
**Update** does not change domain name. [CONFIRMED-CODE]

## 15. Overlays

NOT PRESENT. `window.confirm` for delete. [CONFIRMED-CODE]

## 16. States

- Empty list copy. [CONFIRMED-CODE]
- Verified vs unverified badge. [CONFIRMED-CODE]
- Missing vs present checklist values. [CONFIRMED-CODE]
- Copied vs Copy on clipboard control. [CONFIRMED-CODE]
- Processing on submit. [CONFIRMED-CODE]

## 17. Empty State

“No sending domain yet. Add the domain your From addresses use.” Form still above. [CONFIRMED-CODE]

## 18. Error Handling

- Unique domain / regex: `errors.domain` under the field. [CONFIRMED-CODE]
- Other field errors not rendered on create. [CONFIRMED-CODE]
- Cross-workspace 404. [CONFIRMED-CODE]
- Clipboard API may fail silently if `navigator.clipboard` missing. [CONFIRMED-CODE]

## 19. Feedback

No server toasts. Copy button local “Copied”. Verify/delete silent `back()`. [CONFIRMED-CODE]

## 20. Navigation Behavior

Stay on page. Breadcrumbs: Domains. [CONFIRMED-CODE]
Verification is a toggle, not a wizard. [CONFIRMED-CODE]

## 21. Entity Relationships

`OutboundDomain` per workspace. Not FK-linked to Mailbox in this UI; operator matches From-address domains mentally. [CONFIRMED-CODE]

## 22. Business Rules

- **No DNS lookups, no DNS API** (controller docblock and UI copy). [CONFIRMED-CODE]
- Verified is operator honor system; sets `verified_at` or null. [CONFIRMED-CODE]
- `checklist().ready` means stored value, not published DNS. [CONFIRMED-CODE]

## 23. Backend Dependencies

`DomainController`, `OutboundDomain`, unique rule on `outbound_domains.domain` + workspace_id.

## 24. Frontend Dependencies

`OutboundPage`, `OutboundShell`, `Badge`, `Button`, `Input`, `Label`, Phosphor `Check`/`Copy`, React `useState`, Inertia `Form`/`router`.

## 25. Responsive Behavior

Form `md:grid-cols-2`; checklist table not HairlineTable — may overflow. [CONFIRMED-CODE] Truncate value `max-w-96`. NOT VERIFIED viewport.

## 26. Accessibility Observations

CONFIRMED:

- Copy control is a `<button type="button">` with `title="Copy record"`. [CONFIRMED-CODE]
- Icons `aria-hidden`. [CONFIRMED-CODE]
- Domain field labeled. [CONFIRMED-CODE]

LIKELY ISSUE:

- Copied state is visual only (no live region). [CONFIRMED-CODE]
- Checklist tables lack captions; truncated values rely on `title`. [CONFIRMED-CODE]

REQUIRES MANUAL TEST: clipboard permission, keyboard copy.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-OUT-020 | MEDIUM | “Mark verified” does not check DNS; copy is easy to miss. | False sense of deliverability. | `toggleVerified` comment [CONFIRMED-CODE] |
| UX-OUT-021 | LOW | Notes field only in edit, not create. | Extra click. | create form vs update [CONFIRMED-CODE] |
| UX-OUT-022 | LOW | No toast on verify/delete. | Weak confirmation besides badge change. | `DomainController` [CONFIRMED-CODE] |
| UX-OUT-012 | MEDIUM | Warmup subtab 403 in simple_mode (shared Settings chrome). | Same as mailboxes. | [CONFIRMED-BOTH] |

## 28. Consistency Comparison

Inline articles vs HairlineTable on Mailboxes. Copy-to-clipboard unique in outbound settings. Verify toggle similar to mailbox enable.

## 29. Functional Preservation Contract

Must keep: add FQDN unique per workspace; store SPF/DKIM/DMARC; default DMARC if blank; checklist with copy; manual verify toggle; no automatic DNS; delete with confirm; workspace isolation.

## 30. Design Input Contract

- Purpose: DNS checklist + honor-system verification.
- Primary goal: operator publishes records then marks verified.
- Required information: domain, status, three TXT records + hosts, verified_at.
- Must not remove: “never calls DNS API” honesty; copy values; unique domain rule.

## 31. Open Questions / Unknowns

- Seed domain rows present? [UNKNOWN]
- Clipboard on HTTP localhost vs secure context. [UNVERIFIED]
