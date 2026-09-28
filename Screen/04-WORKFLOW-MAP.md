# EvoCRM workflow map

Destructive steps were **not** executed on localhost except login. Success/failure of mutations: `[UNVERIFIED]` unless a test or code path is cited.

Shared preconditions unless noted: authenticated, verified, workspace provisioned. Seed owner used for UI.

---

## FLOW-AUTH-001 Sign in (password)

- Entry: `/login`
- Permission: guest
- Steps: open login → email/password → POST Fortify login → `{two_factor:false}` → session → `/dashboard`
- Screens: SCR-AUTH-001 → SCR-HOME-001
- Success: 200 JSON two_factor false then dashboard 200 `[CONFIRMED-UI]`
- Failure: 422 validation `[CONFIRMED-UI]`
- Side effects: `last_login_at`, audit `login`, PostHog identify `[CONFIRMED-CODE]`

## FLOW-AUTH-002 Register / Google / 2FA / reset

- Register, Google OAuth, 2FA challenge, forgot/reset password, verify email: `[CONFIRMED-CODE]` Fortify + Socialite. Guest pages redirected when already authed `[CONFIRMED-UI]`.

## FLOW-HOME-001 Operate from Home

- Entry: `/dashboard`
- Props: context, metrics, attention, work, pipeline, recent, activation `[CONFIRMED-UI]`
- User outcome: scan KPIs and attention, jump to records/tasks, dismiss activation items
- Related: FLOW-ACT-001, activation dismiss POST

## FLOW-CONTACT-001 Create contact

1. Create menu or Contacts primary CTA or `?create=1`
2. CreateDrawer form
3. POST `/crm/contacts` (`crm.edit`)
4. Validation (name/email/phone Algeria)
5. Navigate to list or detail `[UNVERIFIED]` exact redirect — see contact-create-drawer spec
- Cancellation: close drawer
- Related entities: Contact, optional Company

## FLOW-CONTACT-002 Open and edit contact

- Row → `/crm/contacts/{id}` record hub
- Inline/PUT update, attributes PUT, activity composer, enrich, Ask Evo (blocked simple mode)

## FLOW-CONTACT-003 Import / merge / bulk / export

- Import wizard `/crm/contacts/import` (`crm.import`)
- Duplicates `/crm/contacts/duplicates`; merge show `/crm/contacts/merge/{survivor}/{absorbed}` (`crm.merge`)
- Bulk POST `/crm/contacts/bulk` (`crm.bulk`)
- Export GET `/crm/contacts/export` (`crm.export`)

## FLOW-COMPANY-001 Create / open company

- Analogous drawer + list + detail. No export/bulk in company route list `[CONFIRMED-CODE]`

## FLOW-DEAL-001 Create deal

- Create menu / deals `?create=1` / prefillContactId
- POST `/crm/deals` (`crm.edit`)
- Appears on list and board

## FLOW-DEAL-002 Move deal on pipeline board

1. Open `/crm/deals/board`
2. Drag card between columns
3. POST `/crm/deals/{deal}/move`
4. Stage required_properties may 422 `[CONFIRMED-CODE]`
5. Writes `stage_change` activity
- List also has stage pills / move from detail

## FLOW-DEAL-003 Import / bulk / export

- Parallel to contacts (`crm.deals.import*`, bulk, export)

## FLOW-LEAD-001 Create / qualify lead

- POST `/crm/leads`; detail qualify POST `/crm/leads/{lead}/qualify` → Deal
- Captures: csv/url/maps ingest then accept/reject

## FLOW-LEAD-002 Misleading /leads URL

- User or docs hitting `/leads` land on **deals board**, not lead list `[CONFIRMED-UI]`

## FLOW-QUOTE-001 Create and send quote

- Requires deal; POST `/crm/deals/{deal}/quotes`
- Send POST `/crm/quotes/{quote}/send` → public `/q/{token}`
- Accept POST public; revoke POST
- Sent/accepted immutable `[CONFIRMED-CODE]`

## FLOW-TICKET-001 Ticket work

- Blocked in simple mode 403 `[CONFIRMED-UI]`
- Full mode: list/board/move/update; optional thread attach; Ask Evo blocked in simple

## FLOW-ACT-001 Complete task

- Overlay or `/crm/activities` or record timeline
- POST `/crm/activities/{id}/complete`
- Count on bell

## FLOW-INBOX-001 Work a conversation

- `/inbox` embed EvoDesk or native threads
- Reply POST `/desk/threads/{thread}/reply` (`desk.manage` on non-GET)
- Open ticket POST `desk.ticket.open` (blocked simple mode)

## FLOW-SEARCH-001 Command OS search

- ⌘K / header search
- Debounced GET `/crm/command/search`
- Recents in localStorage `[CONFIRMED-CODE]`
- Ask Evo action blocked in simple mode

## FLOW-LIST-001 Filter / sort / paginate / saved view

- URL list-query contract
- POST/PATCH/DELETE `/crm/filters*`
- Combination AND via filter_groups JSON

## FLOW-OUT-001 Outbound send path

- Configure mailbox/domain/template
- Sequence enroll or campaign send-now/schedule
- Scheduler `outbound:run` / warmup command — not UI `[CONFIRMED-CODE]`
- Unsubscribe public + suppression

## FLOW-ADS-001 Sync ads

- Settings Meta connect + `/ads/sync` (`ads.manage`)
- UI 403 in simple mode

## FLOW-SET-001 Invite person

- `/settings/people` POST invite, login email set-password
- Resend, role change, remove constraints (last owner) `[CONFIRMED-CODE]` README

## FLOW-SET-002 Toggle simple mode

- `/settings/workspace` PUT `simple_mode`
- Changes nav + 403 surface
- **Not executed** this audit `[UNVERIFIED]` locally beyond tests

## FLOW-PUB-001 Public book meeting / accept quote

- `/book/{slug}` and `/q/{token}` unauthenticated
