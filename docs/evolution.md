# Evolution API — Cloud only

EvoSales uses Evolution API as the **native WhatsApp connector**, exclusively in **Cloud / Business API** mode.

`integration` is always `WHATSAPP-BUSINESS`. `qrcode` is always `false`.

## Forbidden

Do not implement or enable:

- Baileys
- WhatsApp Web QR
- Linked-devices
- OpenWA
- Any unofficial / consumer-WhatsApp takeover

`EvolutionCloudService` refuses any other integration and any `qrcode=true` payload by throwing `UnofficialWhatsAppRefused`.

## Env keys

See `.env.example`:

- `EVOLUTION_BASE_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE`
- `EVOLUTION_WEBHOOK_URL` — legacy fallback only; Settings provisions a random workspace-scoped endpoint
- `WA_BUSINESS_TOKEN` — Meta Cloud permanent token
- `WA_BUSINESS_PHONE_NUMBER_ID`
- `WA_BUSINESS_WABA_ID`
- `WA_BUSINESS_GRAPH_VERSION`
- `WA_BUSINESS_TOKEN_WEBHOOK` — Meta verify token (also used by Evolution as `WA_BUSINESS_TOKEN_WEBHOOK`)
- `EVODESK_URL` — optional sibling Chatwoot Community URL (documented target only)

Empty credentials render a **not connected** state in Settings → Evolution. Do not invent Meta app IDs or Tech Provider status.

## Instance lifecycle

Implemented in `App\Services\Evolution\EvolutionCloudService`:

| Action | Evolution route | Notes |
| --- | --- | --- |
| Create | `POST /instance/create` | Always `WHATSAPP-BUSINESS`, `qrcode: false`, Cloud token + phone number id + WABA id |
| Fetch | `GET /instance/fetchInstances` | Health check |
| Set webhook | `POST /webhook/set/{instance}` | Points at the workspace's `/webhooks/evolution/{webhookKey}` endpoint |
| Session text | `POST /message/sendText/{instance}` | Desk composer, 24h customer window |
| Template | `POST /message/sendTemplate/{instance}` | Outbound Center only |

Settings → Evolution can trigger create + webhook sync when Cloud credentials exist.

## Chatwoot / EvoDesk bridge

This repo is the control plane. Optional `EVODESK_URL` documents a sibling Chatwoot Community (MIT) desk.

Typical production topology:

1. Meta Cloud webhook → Evolution `/webhook/meta` (verify token = `WA_BUSINESS_TOKEN_WEBHOOK`).
2. Evolution emits `MESSAGES_UPSERT` to the workspace-scoped EvoSales endpoint.
3. EvoSales maps the event onto Contact + Thread + Message.
4. If you also run EvoDesk, configure Evolution’s Chatwoot plugin toward that URL — EvoSales does not vendor Chatwoot.

Click-to-WhatsApp ads land on the same Evolution webhook path and become Desk threads on the resolved Contact.

## Template send vs session reply

| Path | When | API |
| --- | --- | --- |
| Desk composer | Human reply inside the Cloud session window | `sendText` |
| Outbound sequences / Templates page | Outside the session window, official templates only | `sendTemplate` |

Session replies never go through Baileys. Template sends never use unofficial sessions.

## Docker

`docker compose --profile evolution up` starts Evolution API **without** enabling a Baileys default instance. You must still create the instance through EvoSales (Cloud-only payload) or Evolution’s API with `WHATSAPP-BUSINESS`.

Default `docker compose up` runs the app only.
