# EvoSales architecture

EvoSales is Evotechly’s single sales OS: **one workspace, one login, four rooms**.

It is the product control plane. Evolution API is the native WhatsApp Cloud connector. [EvoDesk](https://github.com/Mohamedbeghanem/evodesk) (Chatwoot Community, MIT) is an optional sibling desk and a documented integration target — this repo does not vendor Chatwoot and does not sell that name.

Default timezone: **Africa/Algiers**. Algeria-first (`+213`). Company: **Evotechly**.

## What this is not

- Not Baileys, WhatsApp Web QR, Linked-devices, OpenWA, or any consumer-WhatsApp takeover.
- Not a Kommo / amoCRM UI clone.
- Not an Instantly clone.
- Not Chatwoot Enterprise.

## System context

```mermaid
flowchart LR
    Seller[Seller browser] --> EvoSales[EvoSales Laravel control plane]
    EvoSales --> DB[(SQLite local / MySQL)]
    EvoSales --> Evolution[Evolution API Cloud / Business mode]
    Evolution --> MetaWA[Meta WhatsApp Cloud API]
    EvoSales --> MetaAds[Meta Marketing API]
    EvoSales --> SMTP[SMTP mailbox]
    EvoSales -.-> EvoDesk[Optional EvoDesk / Chatwoot Community URL]
    Ads[Meta ads: lead form + click-to-WA] --> MetaAds
    Ads --> MetaWA
    MetaWA --> Evolution
    Evolution -->|webhook| EvoSales
    MetaAds -->|lead ingest| EvoSales
```

## Bounded contexts

| Context | Responsibility |
| --- | --- |
| **Identity** | Workspace, User, RBAC (`owner` / `admin` / `member`) |
| **CRM** | Company, Contact, Lead, Deal, Pipeline / Stage |
| **Desk** | Channel, Thread, Message — three-pane inbox |
| **Ads** | AdAccount, AdCampaign, AdLead, Meta env settings |
| **Outbound** | Mailbox, Sequence, SequenceStep, Enrollment, OutboundMessage, Suppression, QuietHours |
| **Evolution** | Cloud-only instance lifecycle, session text, template send, webhook ingest |
| **Integrations** | Env-driven Meta + optional EvoDesk URL; later Embedded Signup / IMAP |

## Canonical objects

See [OBJECT_MODEL.md](./OBJECT_MODEL.md). Person identity is **one Contact**. A Desk `Thread` and a CRM `Deal` both point at that Contact.

## Event flow

```mermaid
sequenceDiagram
    participant Meta as Meta ads
    participant Evo as Evolution Cloud
    participant App as EvoSales
    participant Desk as Desk
    participant CRM as CRM
    participant Out as Outbound

    Meta->>App: Lead form ingest
    App->>CRM: Contact + Lead (+ AdLead)
    Meta->>Evo: Click-to-WhatsApp message
    Evo->>App: MESSAGES_UPSERT webhook
    App->>CRM: findOrCreate Contact
    App->>Desk: Thread + Message
    Out->>App: Sequence step
    alt email
        App->>Out: SMTP or DisabledMailer
    else WhatsApp
        App->>Evo: sendTemplate only
    end
    Evo->>App: reply webhook
    App->>Desk: inbound Message on same Contact
```

Quiet hours (Africa/Algiers) and the suppression list run **before** automated Outbound sends. Human Desk replies use the Cloud session window (`sendText`) and are not blocked by quiet hours.

## Left-nav IA

- Home
- Desk
- CRM → Companies / Contacts / Leads / Deals
- Ads
- Outbound → Mailboxes / Sequences / Templates
- Settings → Evolution / Meta / Channels (plus profile / security / appearance)

## Security

- Mailbox SMTP passwords use Laravel’s `encrypted` cast (APP_KEY).
- Meta and Evolution tokens live in environment variables only — never committed.
- Workspace RBAC: `owner` and `admin` manage settings; members work the rooms.
- Quiet hours default 21:00–08:00 `Africa/Algiers`.
- Public `/unsubscribe` writes Suppression.
- CSRF is disabled only for `/webhooks/*`.
- Unofficial WhatsApp paths throw `UnofficialWhatsAppRefused`.

## Later work (explicitly not this slice)

- Meta Tech Provider / Embedded Signup
- IMAP reply poller (class exists as a stub: `ImapReplyPoller`)
- EvoOutreach mail server
- Evoleads scraper
- Live Meta OAuth
- Telegram channel (status `later`)
