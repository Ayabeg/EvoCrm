# M08 Contacts — status

**Status:** IMPLEMENTED / PR OPEN — **not shipped / not merged**  
**PR:** https://github.com/Mohamedbeghanem/EvoCrm/pull/249 (`feat/m08-contacts`)  
**BASE tip (pre-acceptance hardenings):** `99ed61ea715675ccd54ea6edadc4bfb6526d5397`

## Scope delivered

- Contacts list with search (`q`) and page append against `GET /api/v1/contacts`
- Contact show against `GET /api/v1/contacts/{id}`
- Contact create / update against `POST` / `PUT` (gated by `crm.edit`; server authoritative)
- Search race + pagination locks + refresh preserves query
- Safe mailto/tel; user-facing errors; free-text `lead_status`
- Docs: API audit, Mobbin research, design, UX, visual QA, test report, M09 handoff

## Out of scope (unchanged)

- Companies show/list
- Home / deals list / activity complete / thread show (G01–G04)
- Delete contact (not in v1)
- WhatsApp actions on contact (explicit non-goal for M08)

## Verify

```bash
cd mobile
npm ci
npm run typecheck
npm run lint
npm test
npx expo config --type public
npm run doctor
```

Sign in, open CRM, search, open a contact, create/edit when `crm.edit` is present. Device Android/iOS QA is still owed on a device-capable runner (see `M08-VISUAL-QA.md`).
