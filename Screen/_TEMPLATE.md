# SCREEN SPEC TEMPLATE

Use this structure for every meaningful screen and major overlay. Do not omit sections. If a section does not apply, write `NOT PRESENT` or `NOT APPLICABLE` with evidence.

Uncertainty labels (mandatory when stating facts):

- `[CONFIRMED-UI]` observed on localhost
- `[CONFIRMED-CODE]` verified in implementation
- `[CONFIRMED-BOTH]` UI and code
- `[UNVERIFIED]` evidence exists, not executed
- `[UNKNOWN]` could not determine
- `[BROKEN]` exists but fails
- `[UNREACHABLE]` implementation exists, no normal UI entry

Localhost runtime summaries: `Screen/_evidence/` and `%TEMP%/evocrm-inertia/*.json`.

Seed owner used for UI crawl: `owner@evosales.local` / `password`. Workspace Evotechly has `simple_mode: true` on this local database. That 403s `/crm/tickets*`, `/ads*`, `/outbound/warmup`, `/crm/report-builder` via `App\Support\SimpleMode::blocks()`. Document the full-mode screen from code anyway.

Do not modify application code. Write only under `Screen/`.

--------------------------------------------------

# [SCREEN NAME]

## 1. Screen Identity

Screen ID:
Product area:
Route:
Route name:
Frontend file:
Primary component:
Layout:
Authentication:
Permissions:
Parent navigation:
Entry points:
Exit points:
Runtime HTTP (owner, simple_mode=true):
Evidence:

## 2. Purpose

## 3. Current UX Summary

## 4. Screen Anatomy

## 5. Data Displayed

## 6. Primary Actions

## 7. Secondary Actions

## 8. Search

## 9. Filters

## 10. Sorting

## 11. Selection

## 12. Bulk Actions

## 13. Pagination / Loading Strategy

## 14. Forms

## 15. Overlays

## 16. States

## 17. Empty State

## 18. Error Handling

## 19. Feedback

## 20. Navigation Behavior

## 21. Entity Relationships

## 22. Business Rules

## 23. Backend Dependencies

## 24. Frontend Dependencies

## 25. Responsive Behavior

Mark `NOT VERIFIED` unless code or viewport evidence exists.

## 26. Accessibility Observations

Separate CONFIRMED / LIKELY ISSUE / REQUIRES MANUAL TEST.

## 27. Current UX Friction

UX-ID, Severity (BLOCKER|HIGH|MEDIUM|LOW|OBSERVATION), Observed issue, User impact, Evidence.

## 28. Consistency Comparison

## 29. Functional Preservation Contract

Checklist of functionality a redesign MUST keep.

## 30. Design Input Contract

Purpose, primary goal, primary/secondary actions, required information, required components, required states, information priority, business-critical elements, elements that may NOT be removed. Do not prescribe a new look.

## 31. Open Questions / Unknowns
