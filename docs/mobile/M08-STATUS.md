# M08 Contacts — status

**Status:** MERGED / FROZEN — shipped on `main`  
**PR:** https://github.com/Mohamedbeghanem/EvoCrm/pull/249 (`feat/m08-contacts`) — **merged**  
**Merge commit:** `d2809ab7e81cc923a8d1ad13de420f7591faa80c`  
**Pre-acceptance tip:** `99ed61ea715675ccd54ea6edadc4bfb6526d5397`  
**Acceptance tip (pre-merge):** `68bd93dddbe399da2adc9924172702f42d17fec1`

## Scope delivered (frozen)

- Contacts list with search (`q`) and page append against `GET /api/v1/contacts`
- Contact show against `GET /api/v1/contacts/{id}`
- Contact create / update against `POST` / `PUT` (gated by `crm.edit`; server authoritative)
- Search race + pagination locks + refresh preserves query
- Safe mailto/tel; user-facing errors; free-text `lead_status`
- Docs: API audit, Mobbin research, design, UX, visual QA, test report, M09 handoff

## Out of scope (still not M08)

- Companies show/list
- Home / deals list / activity complete / thread show (G01–G04)
- Delete contact (not in v1)
- WhatsApp actions on contact

## Frozen contract for M09+

Do not reopen Contacts race helpers, permission gating, or payload mapping unless a regression is proven. Extend via new modules.

## Still owed (non-blocking)

Device Android/iOS visual QA — see `M08-VISUAL-QA.md`.
