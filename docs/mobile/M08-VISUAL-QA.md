# M08 Contacts — visual QA

## Environment honesty

| Surface | Status on this acceptance run |
|---|---|
| Unit / typecheck / lint / expo config / doctor | Exercised on Linux box |
| Expo web smoke | Not required for code gates; not claimed as device QA |
| Android device / emulator | **Not run** on this Linux agent box |
| iOS Simulator | **Not run** (no macOS/Xcode here) |

Stub 1×1 PNG assets may be present in the assembled worktree for Metro; they are **not** a visual ship claim.

## Checklist (manual on device when available)

- [ ] CRM tab list: search field, rows, New (if `crm.edit`)
- [ ] Empty + search-empty states readable on light canvas
- [ ] Detail: name, company, badge, field card; mailto/tel accent links
- [ ] Form: validation borders; lead_status hint; Save disabled look while saving
- [ ] Denial screens when opening new/edit without `crm.edit`
- [ ] Safe area / keyboard avoiding on form (iOS)

## Known limitations

Visual QA on physical Android/iOS is **deferred** to a device-capable runner. Do not mark M08 as device-shipped from this run alone.
