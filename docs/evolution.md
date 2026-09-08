# Evolution API — WhatsApp and WhatsApp Business

EvoSales uses [Evolution API](https://github.com/evolution-foundation/evolution-api) as the native WhatsApp connector. Both official Evolution instance types are first-class:

| Client channel | Evolution `integration` | How the client connects |
| --- | --- | --- |
| **WhatsApp** | `WHATSAPP-BAILEYS` | Scan a QR (`qrcode: true`). Phone → Settings → Linked devices. |
| **WhatsApp Business** | `WHATSAPP-BUSINESS` | Facebook Login, then Graph discovers the WABA + phone number. No QR. |

Paying clients never type `EVOLUTION_*` or `WA_BUSINESS_*`. Evotechly hosts Evolution (`EVOLUTION_BASE_URL` + `EVOLUTION_API_KEY` on the server).

## Forbidden

Still refused (not Evolution-native):

- OpenWA
- Linked-device takeovers outside Evolution
- Asking a client for App IDs, Cloud tokens, or phone-number IDs

Not implemented: Meta Tech Provider / Embedded Signup.

## Env keys (platform / Evotechly only)

See `.env.example`:

- `EVOLUTION_BASE_URL`
- `EVOLUTION_API_KEY`
- `EVOLUTION_INSTANCE` — legacy fallback name; workspaces now get `evo-ws{id}-wa` and `evo-ws{id}-waba`
- `EVOLUTION_WEBHOOK_URL` — legacy fallback; Settings provisions a workspace-scoped endpoint
- `WA_BUSINESS_*` — optional single-tenant Cloud fallback. Paid workspaces use the Facebook Login token + Graph WABA instead.

Empty Evolution URL/key renders “Evotechly is enabling it” — never those env names on client screens.

## Instance lifecycle

Implemented in `App\Services\Evolution\EvolutionCloudService`:

| Action | Evolution route | Notes |
| --- | --- | --- |
| Create WhatsApp | `POST /instance/create` | `WHATSAPP-BAILEYS`, `qrcode: true` |
| Create Business | `POST /instance/create` | `WHATSAPP-BUSINESS`, token + phone number id + WABA id |
| Connect / QR | `GET /instance/connect/{instance}` | Fresh QR (~60s) |
| State | `GET /instance/connectionState/{instance}` | `open` after scan |
| Fetch | `GET /instance/fetchInstances` | Health check |
| Set webhook | `POST /webhook/set/{instance}` | Workspace `/webhooks/evolution/{webhookKey}` |
| Session text | `POST /message/sendText/{instance}` | Desk composer |
| Template | `POST /message/sendTemplate/{instance}` | Outbound Center, Business only |

Settings → Apps → WhatsApp / WhatsApp Business are the client paths.

## Chatwoot / EvoDesk bridge

This repo is the control plane. Optional `EVODESK_URL` documents a sibling Chatwoot Community (MIT) desk.

Typical production topology:

1. Evolution emits `MESSAGES_UPSERT` and `CONNECTION_UPDATE` to the workspace-scoped EvoSales endpoint.
2. EvoSales maps the event onto Contact + Thread + Message on the matching channel (`whatsapp` or `whatsapp_cloud`).
3. If you also run EvoDesk, configure Evolution’s Chatwoot plugin toward that URL — EvoSales does not vendor Chatwoot.

## Template send vs session reply

| Path | When | API |
| --- | --- | --- |
| Desk composer | Human reply inside the session window | `sendText` on the thread’s instance |
| Outbound sequences / Templates page | Outside the session window, official templates only | `sendTemplate` on the Business instance |

## Docker

`docker compose --profile evolution up` starts Evolution API. Create instances through EvoSales (WhatsApp QR or WhatsApp Business Facebook login).

Default `docker compose up` runs the app only.
