# Deal detail

## 1. Screen Identity

Screen ID: SCR-DEAL-003
Product area: CRM / Deals
Route: `/crm/deals/{deal}`
Route name: `crm.deals.show` [CONFIRMED-CODE]
Frontend file: `resources/js/pages/crm/deals/show.tsx`
Primary component: `DealShow`
Layout: App shell + `RecordPageFrame` / `RecordShell` three columns (About | Activity | Related). Breadcrumbs: Deals → Deal (`href: '#'`). [CONFIRMED-CODE]
Authentication: same CRM middleware group.
Permissions: workspace match else 404. Updates/move/attributes/quotes/line-items need `crm.edit`. Splits require `role->canManageSettings()`. [CONFIRMED-CODE]
Parent navigation: not a sidebar leaf; reached from list/board/quotes/dashboard.
Entry points: list/board cards; dashboard recent; quote association; command search; attention queue; peek “open”.
Exit points: **Back to Deals** `/crm/deals`; contact/company/quote/ticket/inbox links; quote preview PDF.
Runtime HTTP (owner, simple_mode=true): **200** Inertia `crm/deals/show` for `/crm/deals/1`. [CONFIRMED-BOTH]
Evidence: `Screen/_evidence/runtime-index.json`; `%TEMP%/evocrm-inertia/crm_deals_1.json`.

## 2. Purpose

Full opportunity record: identity and economics, stage move, health/next-move coaching, line items, quotes, splits, custom attributes, activity timeline, Ask Evo, related contact/company/quotes/tickets/thread.

## 3. Current UX Summary

Classic CRM record hub. Left column is the working surface (facts, stage, suggestions, products, quotes, splits). Center is activity + catch-up. Right is Ask Evo and associations. Seed record: **Clinic website intake**, Qualified, 220_000 DZD, contact Amine Benali, company Clinique El Djazair, 1 quote, 2 line items, health 100 Healthy, next move “Advance to Demo”. `features.ask_evo` is **false** on this workspace but `askEvo` payload is still sent (`live: false`, source fields). [CONFIRMED-BOTH]

## 4. Screen Anatomy

Header: Back to Deals; mobile Ask Evo trigger (`md:hidden`). `data-crm="deals-record"`.

**Left — About**
- Identity: title, kind Deal, amount · pipeline · owner, stage badge, health line `{label} ({score}/100) · {reason}`.
- Record actions toolbar: Note, Email, Call, Task, Meet, WhatsApp, More (create another deal for contact, etc.).
- About this deal facts: Amount, Owner, Close date, Last activity, Type, Priority.
- Stage `<select>` + **Move** (`POST /crm/deals/{id}/move`).
- Suggestion cards: Next move / After-touch / Loss reason (Apply / Dismiss).
- Health factors list.
- Line items table + add.
- Quotes list + create disclose.
- Deal splits (settings managers).
- Playbooks.
- Custom attributes form.

**Center — Activity:** `RecordActivityPanel` (timeline, catch-up inbound/outbound, deal next action, highlights amount/stage/contact/company).

**Right — Related:** AskEvoPanel, DeskThreadCard, Contact, Company, Quotes (links to **preview** URL), TicketsRelatedCard.

Loading: `SkeletonRecord`.

## 5. Data Displayed

Props: `deal` (full Eloquent with contact, company, stage, pipeline.stages, lead, owner, quotes.items, lineItems.product, splits.user), `selected` (same), `associations`, `timeline`, `catchUp`, `attributes`, `playbooks`, `stages`, `members`, `products`, `splits`, `canManageSplits`, `dealHealth`, `nextMove`, `afterTouch`, `lostReason`, `askEvo`. [CONFIRMED-BOTH]

Seed `/crm/deals/1`:
- amount_cents 22000000, currency DZD, stage Qualified probability 25, source whatsapp_cloud, next_step “Relancer le décideur”, owner null, lead_id 1.
- quotes[0] status `sent` but `sent_at` null, total 22000000, notes “Clinic workspace + desk handoff”, 2 items.
- line_items: EvoSales workspace 18000000 + second line.
- splits empty.
- dealHealth score 100 band healthy.
- nextMove id 1 kind next_move action advance title “Advance to Demo” payload stage_id 3.
- afterTouch/lostReason null.
- askEvo summary with stage/amount/contact; suggestions include “Stage and amount”.
- associations.threads[0] WhatsApp Cloud unread 2.

## 6. Primary Actions

- Move stage.
- Record actions (note/email/call/task/meeting/WhatsApp).
- Apply/dismiss next-move suggestion.
- Create/update line items; create quote; save attributes.

## 7. Secondary Actions

- Back to list.
- Peek-unrelated: View contact/company; quote PDF preview; tickets create with contact_id & deal_id; Ask Evo POST `/crm/deals/{id}/ask`; draft email `/crm/deals/{id}/draft-email`; playbook read.

## 8. Search

NOT PRESENT on the record (global command palette still available). [CONFIRMED-CODE]

## 9. Filters

NOT APPLICABLE.

## 10. Sorting

NOT APPLICABLE (timeline order owned by `CrmHub::timeline`). [UNVERIFIED] exact sort key.

## 11. Selection

NOT PRESENT.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Single record. `useInertiaLoading` → `SkeletonRecord`. Timeline not paginated in the page component. [CONFIRMED-CODE]

## 14. Forms

| Form | Method | Action | Fields |
| --- | --- | --- | --- |
| Stage move | POST | `/crm/deals/{id}/move` | stage_id |
| Deal update | PUT | `/crm/deals/{id}` | title, amount_*, owner, dates, type, priority, lost_reason, next_step, attributes — **not wired as a single left-column save form**; facts are display `RecordFact`. [CONFIRMED-CODE] show.tsx has no general update Form |
| Attributes | PUT | `/crm/deals/{id}/attributes` | attributes[] |
| Line items | POST/PUT/DELETE | `/crm/deals/{id}/line-items` | product, qty, DZD |
| Quotes | POST | `/crm/deals/{id}/quotes` | items[0], notes |
| Quote send | POST | `/crm/quotes/{id}/send` | to |
| Splits | PUT | `/crm/deals/{id}/splits` | splits[] user_id/percent must sum 100 |
| Suggestions | POST | `/crm/deals/{id}/suggestions/{id}/apply\|dismiss` | — |
| Ask Evo | POST | `/crm/deals/{id}/ask` | question |

Update of title/amount from this screen is **not** an obvious header editor; amount rolls up from line items when they exist (`update()` keeps amount_cents if line items). [CONFIRMED-CODE]

## 15. Overlays

Ask Evo panel/trigger (OVR-SHELL-005 pattern). Record action composers (note/email/call/task/meet) inline expand. `RecordDisclose` for create quote / splits. No dedicated create-deal drawer on show.

## 16. States

Loading skeleton; missing contact/company/quotes copy; splits hidden if `!canManage && splits.length===0`; suggestions omitted when null; health factors omitted if empty; Ask Evo live false on this workspace; tickets related may 403 in simple mode when navigating to `/crm/tickets*` — card still rendered. [CONFIRMED-CODE] [UNVERIFIED] ticket click.

## 17. Empty State

Per-section empties: No contact linked, No company linked, No quotes yet, No products on this deal yet, No split yet. Not a whole-page empty (404 if missing). [CONFIRMED-CODE]

## 18. Error Handling

Move `errors.stage_id` under the select. Splits 422 if percent ≠ 100. Quote send 422 without email. Immutable quotes cannot be edited (422). Workspace mismatch 404. [CONFIRMED-CODE]

## 19. Feedback

Inertia Form processing disables buttons. Suggestion apply/dismiss POST. No explicit success toast in show.tsx. [CONFIRMED-CODE]

## 20. Navigation Behavior

Back always list, not board (even if user came from board). Related quotes use `/crm/quotes/{id}/preview` not show. WhatsApp uses thread query or `/inbox`.

## 21. Entity Relationships

Contact, company, lead, pipeline/stages, owner, quotes + items, products/line items, splits, tickets, inbox thread, activities, playbooks, custom attributes, DealSuggestion (next_move, after_touch, lost_reason), DealHealthSnapshot.

## 22. Business Rules

- Stage move same as board (pipeline + property gate + optional lost_reason not in this form).
- Line items drive amount when present.
- Quote create needs `crm.edit` (`canCreateQuote`).
- Splits: settings managers only; percents = 100; `amount_cents` derived.
- Health from snapshot else `RecordInsight::dealHealth`.
- Ask Evo feature flag false still shows panel with field-sourced summary.
- Simple mode does not 403 this page.

## 23. Backend Dependencies

`DealController::show|update|move|updateAttributes`; `DealLineItemController`; `QuoteController::store|send`; `DealSplitController`; `AskEvoController::deal|draftDeal`; `LeadOsController` suggestions; `DealHealthScorer`; `NextMoveAdvisor`; `CrmHub` associations/timeline/catchUp/attributes/playbooks.

## 24. Frontend Dependencies

`show.tsx`, `record-hub`, `record-chrome`, `deal-line-items`, `deal-quotes`, `deal-splits`, `deal-suggestion-card`, `ask-evo-panel`, `record-activity-panel`, `playbook-card`, `tickets-related-card`, `desk-thread-card`.

## 25. Responsive Behavior

Three-column `RecordShell` collapses; mobile Ask Evo in header. Health reason `hidden sm:inline`. [CONFIRMED-CODE] Viewport [NOT VERIFIED].

## 26. Accessibility Observations

CONFIRMED: Record actions `role="toolbar"` aria-label; More actions labelled with record id; stage select + Move.
LIKELY ISSUE: breadcrumb href `#`; facts not labeled as a definition list for SR beyond text; quote related links go to PDF.
REQUIRES MANUAL TEST: composer toolbar, Ask Evo, split editor.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| UX-DEAL-020 | MEDIUM | No general “edit deal” form on show | Cannot change title/owner/close date without another path | show.tsx vs `update()` |
| UX-DEAL-021 | MEDIUM | Related quote links to PDF preview, not SCR-QUOTE-002 | Skips builder | `href={`/crm/quotes/${id}/preview`}` |
| UX-DEAL-022 | LOW | Back always list, never board | Extra click after kanban | RecordBack href |
| UX-DEAL-023 | LOW | Quote status `sent` with null `sent_at` / not immutable | Confusing delivery state | dump quote 1 |
| UX-DEAL-024 | OBSERVATION | Ask Evo shown while `features.ask_evo=false` | Dead/non-live assistant | dump features vs askEvo.live |
| UX-DEAL-025 | LOW | Stage move has no lost_reason field | Same as board | Form fields |

## 28. Consistency Comparison

Same record hub as contact/company show (identity, facts, activity, related). Unique: stage mover, line items, quotes, splits, deal health, next move.

## 29. Functional Preservation Contract

Must keep: three-column hub; DZD amount; stage move + error; health score; next-move apply/dismiss; line items CRUD; quote create/send/preview; splits 100%; attributes; timeline/catch-up; associations; Ask Evo POST; record action composers; WhatsApp deep link.

## 30. Design Input Contract

Purpose: work a single opportunity to close.
Primary goal: understand health and advance stage / quote.
Primary actions: move, log activity, quote, apply next move.
Secondary: splits, attributes, related records.
Required information: title, amount DZD, stage, owner, close, contact, company, health, next move, line items, quotes.
Required components: record shell, stage control, suggestions, line items, quotes, activity, Ask Evo, associations.
Required states: loading, empty associations, suggestion present/absent, immutable quotes on deal.
Information priority: identity/amount/stage → health/next move → activity → quotes/products → related.
Business-critical: move gates, DZD rollup from lines, quote send, splits = 100%.
Must not remove: move, quotes, line items, health, next move, associations.

## 31. Open Questions / Unknowns

- Where title/owner/close_date are edited in UI if not on show: possibly peek/quick-record or missing. [UNKNOWN]
- Playbook card contents on seed. [UNVERIFIED]
- Ticket related navigation under simple_mode 403. [UNVERIFIED]
