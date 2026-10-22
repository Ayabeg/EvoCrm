# Agent runtime for EvoCRM

OpenManus is kept as a **separate Python service**. Do not copy the upstream repository into Laravel. EvoCRM talks to it over HTTP on a private network.

The product surface in the app is **Settings → Integrations → Agent**.

## Env (Laravel)

```env
OPENMANUS_ENABLED=false
OPENMANUS_URL=http://127.0.0.1:8001
OPENMANUS_API_TOKEN=replace-with-a-long-random-token
OPENMANUS_TIMEOUT=120
```

`OPENMANUS_ENABLED` stays false unless an operator turns it on. Workspace admins still have to enable the runtime in Settings. The run API is 404 until both are on.

LLM provider keys are **not** Laravel env vars. Put them in `config.toml` on this service.

## Bootstrap

From this directory:

```bash
git clone https://github.com/FoundationAgents/OpenManus.git OpenManus
cp OpenManus/config/config.example.toml config.toml
```

Edit `config.toml` with the LLM provider/model credentials. Do not commit secrets.

The compose file mounts this repo's `evo_api.py` into the cloned OpenManus service. Ensure FastAPI + Uvicorn are installed in the OpenManus environment:

```bash
cd OpenManus
uv pip install fastapi uvicorn
cd ..
docker compose up --build
```

For local development without Docker:

```bash
cd OpenManus
cp ../evo_api.py .
uv run uvicorn evo_api:app --host 127.0.0.1 --port 8001
```

## HTTP contract

- `GET /health` → `{ "ok": true, "status": "ready" }`
- `POST /v1/run`

```json
{
  "prompt": "Summarize this deal",
  "session_id": "optional",
  "plugin_ids": ["crm.read"],
  "plugins": [{ "id": "crm.read", "name": "CRM read", "permission": "read", "requires": [] }],
  "tools": [{ "id": "crm.search", "name": "CRM search", "plugin": "crm.read" }],
  "connectors": [{ "id": "openmanus.runtime", "name": "Agent runtime", "status": "connected", "wired": true }],
  "mcp": { "browser-use": { "connected": false }, "mcp.custom": { "connected": false } },
  "callback": { "url": "http://127.0.0.1/api/agent/tools", "workspace_id": 1 }
}
```

The adapter calls Laravel at `{callback.url}/{tool}` with the same shared bearer and `workspace_id`. MCP tokens never appear in this payload.

Response:

```json
{
  "status": "ok",
  "result": "...",
  "tools_used": [{ "name": "crm.search", "args": { "q": "Amira", "type": "contact" }, "status": "ok" }],
  "errors": []
}
```

The adapter refuses tools that are not in the Laravel-supplied manifest. It does not expose shell, filesystem, or git. Draft tools must not send.

## MCP

Browser Use and custom MCP servers are connected in Settings → Agent. Laravel proxies JSON-RPC `tools/list` and `tools/call`. The Python adapter only sees allowed tool names plus the Laravel callback.

## Security

Keep the service private. The compose file binds port 8001 to localhost. In production, put Laravel and the runtime on a private network, require the shared bearer token, and do not expose the agent endpoint on the public internet.

The adapter fails closed: requests return `503` when `OPENMANUS_API_TOKEN` is missing and `401` when the bearer token is invalid.

OpenManus is MIT licensed. Keep its upstream license and attribution when distributing its source.
