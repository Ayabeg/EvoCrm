# Meta Ads + Lead Ads integration

EvoSales connects Meta → CRM → Meta Conversions API using the existing workspace, CRM, ads, attribution, queue, and settings architecture. It does not add a second contact, lead, or attribution system.

Official references:

- [Facebook Login](https://developers.facebook.com/docs/facebook-login)
- [Marketing API — Ad Account](https://developers.facebook.com/docs/marketing-api/reference/ad-account)
- [Lead Ads — retrieving](https://developers.facebook.com/docs/marketing-api/guides/lead-ads/retrieving)
- [Graph API webhooks](https://developers.facebook.com/docs/graph-api/webhooks/getting-started)
- [Conversions API server events](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/server-event)

## Architecture

```
META
├── Facebook Pages / Instagram Professional
├── Ad accounts → campaigns → ad sets → ads
└── Lead forms
        │ webhook (leadgen) + Graph retrieve
        ▼
EVOSALES
├── Integration (encrypted user token + page tokens)
├── AdAccount / AdCampaign / AdSet / Ad / AdLead
├── Contact / Lead / Deal (existing CRM)
├── FunnelEvent + AdsFunnel (existing attribution)
└── MetaConversionConfig / MetaConversionEvent
        │ Conversions API (hashed user data)
        ▼
META optimization
```

Provider layer:

- `MetaGraphClient` — Graph GET/POST, pagination, retry, rate-limit and token-expiry detection. Tokens are never logged.
- `MetaAdsService` — idempotent ads hierarchy + insights sync.
- `MetaLeadAdsService` — form catalog, lead retrieve, historical import.
- `MetaWebhookService` — verify token, HMAC, persist, queue.
- `MetaFieldMapper` — default + tenant mappings; unknown fields stay custom.
- `MetaConversionsService` — CAPI Lead / QualifiedLead / SubmitApplication / Purchase.
- `MetaSyncService` — ads / forms / leads / full, recorded on `meta_sync_runs`.
- `LeadFormIngestor` — existing CRM intake (LeadCapture + Contact/Lead + AdLead).

## OAuth setup

1. Create a Meta app with Facebook Login, Webhooks, Marketing API, and Lead Ads.
2. Add the exact redirect URI: `META_REDIRECT_URI` (default `https://crm.evotechly.com/auth/meta/callback`).
3. Set `META_APP_ID` and `META_APP_SECRET` on every process (web, queue, scheduler).
4. In EvoSales: Settings → Apps → Meta → Connect. One workspace grant unlocks Pages, Instagram, WhatsApp Cloud, Ads, and Lead Ads as scopes are granted.

Reconnect replaces the encrypted workspace token. Disconnect deletes the `integrations` row (tokens included).

## Required Meta permissions

Requested scopes live in `config/meta.php`:

| Scope | Used for |
| --- | --- |
| `pages_show_list`, `pages_manage_metadata`, `pages_read_engagement` | Pages + lead forms |
| `leads_retrieval` | Lead Ads retrieve / historical import |
| `instagram_basic` | Instagram Professional discovery |
| `ads_management`, `ads_read` | Ad account / campaign / insights sync |
| `business_management` | Business + ad account discovery |
| `whatsapp_business_*` | Existing WhatsApp Cloud unlock (unchanged) |

Live Ads and messaging still need Meta Business Verification and App Review advanced access.

## Webhook configuration

Callback (per workspace):

```
GET/POST {APP_URL}/webhooks/meta/leads/{workspaceWebhookKey}
```

1. Settings → Meta shows the workspace URL.
2. Meta App Dashboard → Webhooks → Page → subscribe `leadgen`.
3. Verify token: `META_WEBHOOK_VERIFY_TOKEN`, or the workspace webhook key.
4. Official envelopes (`object` / `entry`) require `X-Hub-Signature-256` = HMAC-SHA256 of the raw body with `META_APP_SECRET`.
5. The HTTP handler persists `meta_webhook_events` and queues `ProcessMetaWebhookEvent`. Graph retrieve happens in the worker, not in the request.

Duplicate `leadgen_id` deliveries reuse the same event row and do not create a second AdLead.

## Lead Ads

- Form catalog: Settings → Meta → Sync lead forms (`/{page_id}/leadgen_forms`).
- Live intake: webhook → queue → retrieve `/{leadgen_id}` when the payload has no `field_data` → `LeadFormIngestor`.
- Historical import: Settings → Meta → Historical leads (`/{form_id}/leads`).
- Duplicate detection uses existing `LeadCaptureDeduper` (email / phone) plus `ad_leads (workspace_id, external_id)`.
- Custom Instant Form questions stay on `ad_leads.fields` and `leads.payload.custom_fields`.

## Field mapping

Defaults in `MetaFieldMapper` cover Meta Instant Form names (`full_name`, `email`, `phone_number`, `company_name`, `job_title`, …). Settings → Meta → Field mapping stores tenant overrides on `meta_field_mappings`. Unmapped fields are not dropped.

## Attribution

`LeadFormIngestor` writes campaign / ad set / ad / form / page ids onto `AdLead.attribution` and the existing `leads.ad_campaign_id`, `leads.ad_set_id`, `leads.ad_id`. `FunnelEventRecorder` records `lead.created` / `lead.qualified` / deal events on the workspace conversion funnel. Ads Hub (`/ads/attribution`) shows Meta-reported metrics (impressions, reach, clicks, spend), CRM metrics (leads, qualified, deals, revenue), and calculated CPL / CPQL / CAC / ROAS only when the denominator exists.

## Conversions API

`LeadObserver` and `DealObserver` queue CAPI events when a mapping is enabled and a pixel/dataset id is set. Defaults (disabled until configured):

| EvoSales event | Meta standard event |
| --- | --- |
| `lead.created` | `Lead` |
| `lead.qualified` | `QualifiedLead` |
| `deal.created` | `SubmitApplication` |
| `deal.won` | `Purchase` |

Payload includes `event_name`, `event_time`, `event_id` (idempotency key), `action_source=system_generated`, hashed email/phone (`SHA256` of lowercase trimmed values), hashed external id, and purchase value/currency when winning a deal. Raw email/phone and tokens are never stored on `meta_conversion_events`.

`SendMetaConversionEvent` retries with exponential backoff (`15s, 60s, 180s, 600s`, 5 tries). Duplicate `event_id` rows that already sent are skipped.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `META_APP_ID` | Yes, to connect | Facebook Login app id |
| `META_APP_SECRET` | Yes, to connect | OAuth + webhook HMAC |
| `META_REDIRECT_URI` | Recommended | Must match the Meta app dashboard exactly |
| `META_GRAPH_VERSION` | No (default `v21.0`) | Graph version |
| `META_WEBHOOK_VERIFY_TOKEN` | Recommended in production | Hub challenge verify token |

Never commit populated values. Templates: `.env.example`, `.env.production.example`.

## Queue requirements

Production must run a queue worker (`php artisan queue:work`). Jobs:

- `ProcessMetaWebhookEvent` — Lead Ads retrieve + ingest
- `SendMetaConversionEvent` — CAPI send (unique per event for 1 hour)

`QUEUE_CONNECTION=database` in production. Tests use `sync` except where they `Queue::fake()`.

## Scheduler requirements

`meta:sync --kind=ads` runs every 15 minutes (`routes/console.php`) and upserts the ads hierarchy for each connected workspace. Manual sync from Settings → Meta can run `ads`, `forms`, `leads`, or `all`.

Restarting a failed sync is safe: rows upsert on `(workspace_id, external_id)`.

## Token expiration

Long-lived user tokens last ~60 days. Graph error `190` / HTTP 401 marks the integration `expired`. Reconnect from Settings → Apps → Meta. Page tokens are stored encrypted on `integrations.refresh_token` (JSON `page_tokens`) and never rendered.

## Rate limits

`MetaGraphClient` retries Graph codes `4, 17, 32, 613, 80000–80004` and HTTP 429 / 5xx with capped backoff. Partial ads sync failures on ad sets or ads do not wipe already upserted campaigns.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Connect button 404 | `META_APP_ID` / `META_APP_SECRET` empty |
| OAuth “Invalid state” | Session/cookie domain; exact redirect URI |
| Webhook challenge 403 | Verify token mismatch |
| Official webhook 403 | Missing/invalid `X-Hub-Signature-256` |
| Leads accepted but not created | Queue worker down; `meta_webhook_events.error` |
| Sync “token has expired” | Reconnect Meta |
| Conversions not sending | Mapping disabled or pixel id empty; `meta_conversion_events` |
| Token visible in UI | Bug — report immediately; tokens are hidden + encrypted |

Settings → Meta → Logs shows webhook and conversion outcomes without payloads that contain tokens.

## Production deployment

1. Set Meta env vars on web, queue, and scheduler.
2. `php artisan migrate --force` (adds Meta tables and ads columns).
3. Restart web + queue + scheduler together.
4. Connect Meta per workspace, select an ad account, subscribe the webhook, enable conversion mappings.
5. Confirm `php artisan schedule:list` includes `meta:sync`.
6. Confirm a queue worker is consuming `ProcessMetaWebhookEvent` and `SendMetaConversionEvent`.
