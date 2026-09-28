# Ask Evo drawer

## 1. Screen Identity

Screen ID: `OVR-SHELL-005`
Product area: Shell overlays / AI
Route: Drawer UI. APIs `GET /ask-evo/context` (`ask-evo.context`), `POST /ask-evo` (`ask-evo`)
Route name: `ask-evo.context`, `ask-evo`
Frontend file: `resources/js/components/crm/ask-evo-drawer.tsx`
Primary component: `AskEvoDrawer` (global). Separate in-record `AskEvoPanel` (`ask-evo-panel.tsx`) on contact/company/ticket show — not this overlay.
Layout: Bottom `Drawer` `max-h-[85dvh]` mounted in `AppLayout`
Authentication: APIs sit in the authenticated `web.php` group
Permissions: Simple mode **blocks** both API route names (`SimpleMode::blocks` matches `ask-evo` and `ask-evo.context`) → 403. Client also `if (!features.ask_evo) return null`.
Parent navigation: Command OS Ask item (`openAskEvo`). Header sparkle does **not** open this drawer.
Entry points: `window` event `open-ask-evo` (`ASK_EVO_OPEN_EVENT`). Command catalog `ask-evo` when `features.ask_evo`. Record pages may use `AskEvoPanel` instead.
Exit points: Drawer close; context `actions` `router.visit(href)`
Runtime HTTP (owner, simple_mode=true): `features.ask_evo: false`. Drawer does not mount. Hitting APIs would 403 via `EnforceSimpleMode`. Sparkle still opens Command OS. `[CONFIRMED-BOTH]`
Evidence: `ask-evo-drawer.tsx`, `resources/js/lib/ask-evo.ts`, `AskEvoController.php`, `SimpleMode.php`, `routes/web.php`, dashboard `features`.

## 2. Purpose

Grounded Q&A about the current page or peek record using authorized workspace fields, with suggestions and follow-up actions.

## 3. Current UX Summary

**On this seed workspace the overlay is unreachable** (`[UNREACHABLE]` from UI, `[CONFIRMED-CODE]` implementation exists).

When `features.ask_evo` is true: bottom sheet titled “Ask Evo” with live context line, optional note, turn history (`question — answer`), suggestion chips, question input (max 280 server-side), submit “Ask Evo” / “Asking…”, error alert, action buttons.

## 4. Screen Anatomy

`DrawerContent side="bottom"` with header (Sparkle + title + sr-only description + `data-testid="ask-evo-context"`). Body: note, turns, chips `role="group" aria-label="Suggested questions"`, form, actions.

## 5. Data Displayed

Identity from URL + open quick-record (`parseAskEvoIdentityFromUrl`): pages `workspace|dashboard|activation|contact|company|deal|quote|inbox|activity|automation|qrd`. Peek record wins as `page: 'qrd'`.

Context payload: `kind`, `label`, `scope_key`, suggestions `{id,label,question}`, actions `{id,label,href}`, notes / unavailable codes.

Turns stored only in React state (reset when `scope_key` changes).

## 6. Primary Actions

Submit question (`POST /ask-evo` JSON with CSRF). Click a suggestion (sets input and asks).

## 7. Secondary Actions

Follow context actions (navigate). Close restores focus to opener.

## 8. Search

NOT APPLICABLE (free-text question, not record search).

## 9. Filters

NOT PRESENT.

## 10. Sorting

Suggestions/actions as returned.

## 11. Selection

NOT APPLICABLE.

## 12. Bulk Actions

NOT PRESENT.

## 13. Pagination / Loading Strategy

Context fetched on open. Ask is a single POST. `aria-busy` on input while loading. No streaming UI.

## 14. Forms

Question `Input` + submit. Server validation: `question` required max 280; page/entity/scope optional.

## 15. Overlays

This drawer. Record `AskEvoPanel` is a second, page-local UI that posts through record `ask` routes (those names also 403 in simple mode because they end with `.ask`).

## 16. States

Unmounted (simple mode). Closed. Open loading context. Context note. Turns. Loading ask. Error (`role="alert"`). Unavailable context (422/404 JSON).

## 17. Empty State

No turns until first answer. Empty suggestions hide the chip group.

## 18. Error Handling

Client maps: timeout, rate_limit, unauthorized/forbidden, stale, empty, default unavailable (`askEvoErrorMessage`). HTTP: 404 unauthorized, 429 rate limit, 504 timeout, 409 stale, else 422. Fetch throw → “Ask Evo is unavailable.” Non-JSON Inertia fallback `back()` with errors — drawer always `fetch` JSON.

Simple mode: 403 before controller.

## 19. Feedback

Context `aria-live="polite"`; status sr-only “Ask Evo is thinking”; submit label Asking…; errors `role="alert"`. Copy largely English.

## 20. Navigation Behavior

Scope reset clears history when identity changes. Actions close drawer then visit. Header sparkle never dispatches `open-ask-evo`.

## 21. Entity Relationships

Grounded on contact/company/deal/quote/inbox thread/activity/workflow depending on URL. Peek overlay can retarget identity to `qrd`.

## 22. Business Rules

- Simple mode: feature off + HTTP 403.
- Answers must use authorized fields (controller/copilot; not re-specified in UI).
- Question max 280.
- Stale scope: user must ask again.

## 23. Backend Dependencies

`AskEvoController`, `AskEvoCopilot`, `AskEvoContextRequest`, `EnforceSimpleMode`. CSRF for POST.

## 24. Frontend Dependencies

Drawer, Input, Button, `useQuickRecord`, `useSimpleMode`, `ask-evo` helpers.

## 25. Responsive Behavior

Bottom sheet `max-h-[85dvh]` scroll. `NOT VERIFIED` keyboard on mobile.

## 26. Accessibility Observations

**CONFIRMED:** labelled drawer, sr-only description, input aria-label/describedby/busy, live regions, suggestion group, alert.

**LIKELY ISSUE:** unreachable in seed so a11y untested; header control name mismatch; no announced new turn besides appending text.

**REQUIRES MANUAL TEST:** full-mode keyboard, SR reading of answers.

## 27. Current UX Friction

| UX-ID | Severity | Observed issue | User impact | Evidence |
| --- | --- | --- | --- | --- |
| ASK-001 | BLOCKER (this seed) | Drawer unmounted + APIs 403 | Cannot Ask Evo | `features.ask_evo` false, `SimpleMode::blocks` |
| ASK-002 | HIGH | Sparkle does not open this drawer | Label lie | header vs `openAskEvo` |
| ASK-003 | MEDIUM | Two UIs (global drawer vs record panel) | Inconsistent | `AskEvoPanel` on show pages |
| ASK-004 | LOW | English copy in `fr` workspace | Mixed language | hard-coded strings |

## 28. Consistency Comparison

Command OS Ask item is the only global opener. Record panels use Inertia `Form` to record-specific ask endpoints. Copilot is not in the rail.

## 29. Functional Preservation Contract

- Keep `open-ask-evo` event, context GET, ask POST, 280 cap, suggestion chips, actions, scope reset, focus restore.
- Keep simple-mode kill switch on both client and `EnforceSimpleMode`.
- Keep identity parsing including peek `qrd`.
- Do not treat sparkle as this drawer unless product changes P16 (“one Command OS”).

## 30. Design Input Contract

Purpose: ask a grounded question about the current context.
Primary goal: get an answer or a next action.
Primary actions: ask, pick suggestion, follow action.
Required information: context label, turns, errors, suggestions.
Required components: bottom drawer, input, chips, transcript.
Required states: unavailable, loading, error, empty, answered, simple-mode hidden.
Must not remove: authorization/grounding, simple-mode 403, CSRF JSON.

## 31. Open Questions / Unknowns

- `[UNVERIFIED]` copilot quality / empty grounding notes on full-mode.
- `[UNKNOWN]` whether turning off simple_mode is enough or an AI key is also required.
- Ticket/lead pages are not in `ASK_EVO_PAGES` map for records except via generic workspace page.
