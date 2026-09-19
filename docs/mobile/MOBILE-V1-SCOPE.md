# Mobile V1 Scope

**AUTHORITATIVE CLIENT STACK:** Expo + React Native + TypeScript (M06R). Dual-native delivery is superseded.  
**Baseline:** `4d2976befc7a94c267528e4a1fa7a810fe45e4a8`  
**Definition:** Smallest **complete daily sales loop** on the real backend.

## MUST (V1)

| Item | Why | API posture |
|---|---|---|
| Email/password login + logout | Enter product | READY |
| Me + permission-aware UI | Hide forbidden actions | READY |
| Home attention feed | “What now?” | **MISSING** (gap) |
| Contacts list/search/create/show/update | Core identity | READY (no delete) |
| Lead show + qualify | Convert interest | READY |
| Pipeline board view | See stages | READY via `/leads/board` |
| Deal show + move | Progress revenue | READY |
| Deals list | Find deals without board | **MISSING** (gap) |
| Activities list + create | Log work | READY |
| Activity complete | Close tasks | **MISSING** (gap) |
| Threads list + reply | Respond on WhatsApp/email path | READY index/reply; show **MISSING** |
| Thread/messages show | Read conversation | **MISSING** (gap) |
| Quote show + send | Advance commercial | READY |
| Device register | Future push | READY |

## SHOULD (V1.1 / fast follow)

- Companies list/show/create
- Lead create/update + leads list (non-board)
- Deal create/update
- Quotes list
- Global search
- Contact custom attributes editing polish
- Mark thread read / unread counts on Home
- Simple mode flag from API

## LATER

- Ask Evo on mobile (coord with web P23)
- Tickets
- Enrichment
- Deal line items / splits
- Segments, workflows authoring
- Reports builder
- Outbound enrollment controls
- Ads read-only funnel
- Profile password change
- Biometric unlock
- Full offline CRM

## NOT MOBILE APPROPRIATE

| Surface | Reason |
|---|---|
| Contact/deal CSV import & merge | Multi-step desktop density |
| Meta/Evolution/SMS secret entry | Secrets must stay server-side |
| People / role admin / audit | Owner/admin on web |
| Pipeline / attribute schema admin | Config, not field work |
| Workflow canvas | Authoring |
| Desk iframe / Chatwoot UI | Wrong client; use API |
| Public quote accept / booking pages | Buyer/lead public surfaces |
| Webhooks | Server only |
| Warmup / mailbox password UI | Outbound admin |

## V1 success criteria (product)

A member with `crm.edit` + `desk.manage` can complete in one session:

1. Sign in
2. See at least one attention item on Home (once API exists)
3. Open a contact, add a note
4. Qualify a lead **or** move a deal
5. Reply to a thread
6. Send a quote (when one exists)

Without leaving the app or using fake data.
