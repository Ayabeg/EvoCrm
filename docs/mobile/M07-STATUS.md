# M07 status

In progress on `feat/mobile-m07-auth-workspace` from M06R merge `a9b3095fa449d4ee0ce5a64880d8c6476d761f31`.

See the PR description and the closing status block for executed gates. This file is updated when commands are run.

```
EVOCRM MOBILE — M07 STATUS

M06R: MERGED (PR #237)
M06R MERGE SHA: a9b3095fa449d4ee0ce5a64880d8c6476d761f31

BASE SHA: a9b3095fa449d4ee0ce5a64880d8c6476d761f31
TIP SHA: (branch tip; update after commit)
PR: (set after open)

EXPO SDK: 57.0.24 (sdkVersion 57.0.0)
REACT NATIVE: 0.86.3
EXPO ROUTER: 57.0.22
TYPESCRIPT: 6.0.3

BACKEND AUTH AUDIT: DONE (docs/mobile/M07-AUTH-WORKSPACE-AUDIT.md)
AUTH TOKEN ENDPOINT: POST /api/v1/auth/token
TOKEN REVOKE ENDPOINT: DELETE /api/v1/auth/token
ME ENDPOINT: GET /api/v1/me

LOGIN: IMPLEMENTED (email + password; device_name automatic)
SESSION RESTORATION: IMPLEMENTED (boot screen; no login flash)
AUTH STATE MACHINE: IMPLEMENTED
SECURESTORE: TOKEN ONLY
CURRENT USER: FROM GET /me
CURRENT WORKSPACE: FROM GET /me
WORKSPACE ISOLATION: ws:{id}: keys; logout wipe
WORKSPACE SWITCHING: DEFERRED (no backend contract)
PERMISSIONS: /me + can(); unknown = deny
AUTH GUARD: Stack.Protected + boot screen
DEEP LINK AUTH: authenticated only
LOGOUT: DELETE + local wipe; honest remote flag
401: centralized expire
403: not logout
404: keep session
422: validation (including bad password)
OFFLINE/NETWORK: does not destroy credentials

TYPECHECK: NOT YET RUN
LINT: NOT YET RUN
TESTS: NOT YET RUN
TEST COUNT: —
EXPO CONFIG: NOT YET RUN
EXPO DOCTOR: NOT YET RUN
CI: NOT YET RUN

WEB RUNTIME: NOT YET RUN
ANDROID RUNTIME: NOT EXECUTED
IOS RUNTIME: NOT EXECUTED
EAS ANDROID: NOT EXECUTED AUTH REQUIRED
EAS IOS: NOT EXECUTED AUTH REQUIRED

SECURITY: documented
SECRETS SCAN: unit tests added
TOKEN LOGGING: forbidden by test
ASYNCSTORAGE TOKEN CHECK: unit tests added

BACKEND CHANGES: NONE
WEB CHANGES: NONE
DOMAIN DUPLICATION: NONE

P0 API BLOCKERS: G01–G04 unchanged; out of scope
API HANDOFFS: G01 Home, G02 Deals list, G03 Activity complete, G04 Thread show

DOCUMENTATION: M07-* docs written
KNOWN LIMITATIONS: Web SecureStore is in-memory; EAS not executed; no workspace switch API

M07 READY: YES (implementation present; gates pending)
M07 COMPLETE: NO (gates not yet executed)
M08 READY: NO
MERGE READY: NO
```
