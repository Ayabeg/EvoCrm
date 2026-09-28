# Agent runtime

EvoCRM can optionally talk to an isolated Python agent service. The product name is **Agent**. OpenManus is the default runtime implementation, not the brand.

Ask Evo and Command OS stay on their existing Laravel paths. They do not require this service.

## Architecture

```
EvoCRM (Laravel + Inertia)
  Settings → Integrations → Agent
  POST /api/agent/run   (auth, throttle, fail closed)
        │
        │  private network + shared bearer token
        ▼
services/openmanus (FastAPI adapter)
        │
        │  POST /api/agent/tools/{tool}
        │  same shared bearer + workspace_id
        ▼
Laravel-owned tools (CRM / Desk / MCP proxy)
```

Laravel owns:

- the onboarding status (`disabled` / `not_configured` / `unhealthy` / `ready`)
- the plugin registry and live tool catalog
- connector credentials (encrypted at rest, write-only in the UI)
- the allowed plugin/tool manifest sent on every run
- CRM, Desk, and MCP execution (the Python service never holds MCP tokens)

The Python service stays a thin HTTP adapter. This repository does not vendor the OpenManus source tree.

## Security

- `OPENMANUS_ENABLED` defaults to `false`. The run API and tool API return 404 until the host flag **and** the workspace toggle are on.
- The tool callback (`POST /api/agent/tools/{tool}`) is authenticated with the same workspace-scoped shared token used for the runtime. It is not session-authenticated and is CSRF-exempt.
- Unhealthy or unreachable runtimes return structured `{ status, result, tools_used, errors }` and never 500 the CRM.
- Secrets (shared token, connector tokens) are encrypted on the `integrations` table and never returned to the browser, Inertia props, or JSON logs.
- LLM provider keys stay in `services/openmanus/config.toml` on the Python host.
- MCP server URLs and tokens stay on Laravel. The run payload only includes `{ connected: true|false }`.
- Draft tools prepare text only. `send`, `action=send`, and any tool whose name includes `send` are rejected (`send_forbidden`).
- The business agent path does not expose shell, filesystem, or git tools from Laravel.
- Bind the runtime to localhost or a private network. Do not publish port 8001.

## Plugins and live tools

Plugins are EvoCRM capability packs. Each pack unlocks one or more Laravel-owned tools.

| Plugin | Permission | Tools | Notes |
|---|---|---|---|
| `crm.read` | read | `crm.search`, `crm.get` | Contacts, companies, deals, leads, quotes |
| `crm.draft` | prepare | `crm.draft_note`, `crm.draft_email`, `crm.draft_reply` | Prepare only. Nothing is sent |
| `desk.inbox` | read | `desk.list_threads`, `desk.get_thread` | Read-only inbox |
| `browser.research` | read | `browser.research` | Only when the `browser-use` connector is **connected** |

Custom MCP (no plugin pack): `mcp.list_tools`, `mcp.call` — only while `mcp.custom` is connected.

A run request only includes plugins that are enabled **and** have their required connectors connected. Tools follow the same gate. The runtime must not invent tools outside that manifest.

`tools_used` is a real invocation trace:

```json
[{ "name": "crm.search", "args": { "q": "Amira", "type": "contact" }, "status": "ok" }]
```

Args never include tokens or other secret keys.

## Connectors

| ID | Status | Config |
|---|---|---|
| `openmanus.runtime` | Wired | Private service URL + shared bearer. Health probe. |
| `browser-use` | Wired | MCP HTTP endpoint + Bearer token. Required for `browser.research`. Laravel proxies `tools/list` and `tools/call`. |
| `mcp.custom` | Wired | Custom MCP HTTP endpoint + optional Bearer. Laravel lists and calls tools. |
| `webhook` | Wired | Optional outbound URL (+ optional Bearer) for run `started` / `finished` / `failed`. No secrets are posted. |

### Browser Use

1. Run or subscribe to a Browser Use MCP server that speaks JSON-RPC over HTTP (`tools/list`, `tools/call`).
2. In Settings → Agent, connect **Browser Use** with the MCP URL and Bearer token (encrypted).
3. Enable the **Browser research** plugin.

Laravel calls the MCP tool named `browser_research`, then `research`, then the first advertised tool. Arguments are `{ "query": "..." }`.

### Custom MCP

Register one MCP HTTP server (URL + optional Bearer). While connected, `mcp.list_tools` and `mcp.call` appear in the run manifest. Disconnected servers refuse those tools.

### Webhook

Optional. When connected, Laravel POSTs `{ event, workspace_id, session_id, status }` on run lifecycle. Tokens are sent only as `Authorization` if configured — never in the JSON body.

## Fallback

When the agent is disabled, not configured, or down:

- CRM lists, records, Ask Evo, and Command OS keep working
- `/api/agent/run` and `/api/agent/tools/*` are 404 while disabled
- Settings still explains the status and can store workspace config

## Env

See `.env.example` and `services/openmanus/README.md`. Placeholders only — never commit real tokens.
