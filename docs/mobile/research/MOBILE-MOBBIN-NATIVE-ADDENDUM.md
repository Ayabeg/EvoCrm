# MOBILE-MOBBIN-NATIVE-ADDENDUM — platform QA deltas

**M06R note:** Dual SwiftUI/Compose *implementation* is superseded. Keep this file for **platform QA** (tab chrome, sheets, system share) on the single Expo app.  
**Parent research:** `MOBILE-MOBBIN-BENCHMARK.md`, `MOBILE-PATTERN-MAP.md` (kept from PR #233)  
**Purpose:** Only note where **OS UX** differs for iOS vs Android — pattern grammar stays the same.

---

## Shared (do not fork product)

- Bottom tabs: HOME / CRM / INBOX / ACTIVITIES / MORE
- Attention-first Home; Attio/Jobber density
- Inbox = OpenPhone/Outlook thread list grammar
- Activities = Todoist today/overdue sections
- Evotechly tokens (`#E8530E`) — never HubSpot teal

---

## Where SwiftUI vs Compose may differ (allowed)

| Surface | iOS (SwiftUI) | Android (Compose) | Parity rule |
|---|---|---|---|
| Tab bar | `TabView` + system tab bar; accent wash on selected | NavigationBar / NavigationSuite / custom bottom bar with Material 3 | Same 5 destinations & labels |
| Sheets | `.sheet` / `.presentationDetents` for qualify/move/create | Modal bottom sheet `ModalBottomSheet` | Same fields & validation |
| Lists | Inset grouped `List` OK | `LazyColumn` + sticky headers | Same row content & actions |
| Search chrome | `.searchable` when Search API exists | `DockedSearchBar` / top app bar | Hide until `/api/v1/search` |
| Notifications permission | System dialog timing (post-login soft ask) | Runtime POST_NOTIFICATIONS (API 33+) | Same register-only outcome |
| Share quote link | `ShareLink` / UIActivity | Android Sharesheet | Same `public_url` |
| Large titles | Nav bar large title on Home/CRM root | Optional collapsing top bar | Optional chrome only |
| Haptics | UIKit haptics on move success | Performance/HapticFeedback | Optional |
| Edge swipe back | System interactive pop | Predictive back / Nav back | System default OK |

---

## Explicit non-differences

Do **not** allow different: required fields, stage gates, permission hiding, offline enqueue allowlist, error copy semantics, object model.

---

## Research status

PR #233 Mobbin work remains authoritative for **pattern selection**. This addendum does not replace screen citations; it only constrains native implementation chrome.
