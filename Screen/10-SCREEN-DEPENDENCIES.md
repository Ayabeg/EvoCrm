# EvoCRM screen dependency graph

How screens connect. Overlays in parentheses.

```
Guest
├── SCR-AUTH-001 Login ──► SCR-HOME-001
├── SCR-AUTH-002 Register ──► Home (after provision)
├── SCR-AUTH-003 Forgot ──► email ──► SCR-AUTH-004 Reset
├── SCR-AUTH-006 2FA (if enabled after login)
├── SCR-PUB-001 Quote token
├── SCR-PUB-002 Book ──► SCR-PUB-003 Done
└── SCR-PUB-004 Unsubscribe

SCR-HOME-001 Home
├── (OVR-SHELL-001 Command OS)
├── (OVR-SHELL-002 Tasks)
├── (OVR-SHELL-003 Create) ──► lists ?create=1
├── Deals list / board
├── Activities
├── Contact/deal peek (OVR-SHELL-006)
└── Activation ──► settings / create contact

SCR-SHELL-002 Sidebar (simple mode)
├── Home
├── Contacts
├── Deals (list, not board)
├── Inbox
├── Quotes
└── Settings ──► Profile

Full-mode rail adds Companies, Pipeline board, Activities, Workflows, More(Leads, Tickets, Segments, Ads, Reports, Outbound)

Contacts list
    ↓ row / peek
Contact detail
    ├── Company detail
    ├── Deal detail / deals kanban on contact
    ├── Activities timeline
    ├── Import / Duplicates / Merge
    └── Ask Evo (blocked simple)

Companies list
    ↓
Company detail ── contacts, deals, activities

Deals list ── toggle ── Deals board
    ↓ row / card
Deal detail
    ├── Contact / Company
    ├── Quotes
    ├── Line items / splits
    ├── Move stage
    └── Ask Evo (blocked)

GET /leads ──302──► Deals board   [mismatch]
GET /crm/leads ──► Lead list ──► Lead detail ── qualify ──► Deal
Lead captures ── accept ──► Lead

Quotes list ──► Quote detail ── send ──► SCR-PUB-001
                └── needs Deal

Tickets (403 simple) list ── board ── detail ── thread / inbox

Inbox ── EvoDesk iframe or native thread
      └── /conversations history
      └── open ticket (blocked simple)

Activities index ← header Tasks overlay

Segments list ── row often ──► Contacts/Deals ?filter_id=
              └── show ── history

Workflows ← /automation alias

Reports rooms ← category URLs
Report builder (403 simple)
Funnels

Outbound hub
├── Mailboxes / Domains / Templates / Sequences / Campaigns
├── Lists / Outbox / Replies / Suppressions / Quiet hours
└── Warmup (403 simple)

Ads * (403 simple)

Settings layout
├── Personal: Profile, Security (confirm-password), Appearance
├── Workspace: General (simple_mode), People, Meetings, Setup
├── CRM: Attributes, Pipelines, Qualify, Quotas, Layouts, Playbooks
├── Communication: Evolution, WA, WA Business, Meta, Channels, SMS
├── Integrations: Apps, Apps Meta (redirect if disconnected), Connectors
└── Developer: Permissions, Audit, System health
```

## Overlay attachment

| Overlay | Attached to |
|---------|-------------|
| Command palette, Tasks, Create, User menu | Every AppLayout page |
| Ask Evo | Record hubs when `features.ask_evo` |
| Quick record | Home, some lists/harness; **not** production CRM table rows generally |
| Entity create drawers | Respective list pages |
