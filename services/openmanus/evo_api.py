import json
import hmac
import os
import urllib.error
import urllib.request
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

try:
    from app.agent.manus import Manus
except ImportError:  # pragma: no cover - local stub without a cloned OpenManus tree
    Manus = None


app = FastAPI(title="EvoCRM Agent Runtime", version="0.3.0")


class PluginManifest(BaseModel):
    id: str
    name: str
    description: str = ""
    permission: str = "read"
    requires: list[str] = Field(default_factory=list)


class ToolManifest(BaseModel):
    id: str
    name: str
    description: str = ""
    plugin: str | None = None
    connector: str | None = None


class ConnectorContext(BaseModel):
    id: str
    name: str
    status: str
    wired: bool = False


class Callback(BaseModel):
    url: str
    workspace_id: int | str


class RunRequest(BaseModel):
    prompt: str
    session_id: str | None = None
    plugin_ids: list[str] = Field(default_factory=list)
    plugins: list[PluginManifest] = Field(default_factory=list)
    tools: list[ToolManifest] = Field(default_factory=list)
    connectors: list[ConnectorContext] = Field(default_factory=list)
    mcp: dict[str, Any] = Field(default_factory=dict)
    callback: Callback | None = None


SECRET_KEYS = {"token", "access_token", "secret", "password", "authorization", "api_key", "apikey"}


def authorize(authorization: str | None) -> None:
    expected = os.getenv("OPENMANUS_API_TOKEN")
    if not expected:
        raise HTTPException(status_code=503, detail="OpenManus API token is not configured")
    if not authorization or not hmac.compare_digest(authorization, f"Bearer {expected}"):
        raise HTTPException(status_code=401, detail="Unauthorized")


def allowed_plugin_ids(request: RunRequest) -> list[str]:
    catalog = {plugin.id for plugin in request.plugins}
    if not catalog:
        return list(request.plugin_ids)
    return [plugin_id for plugin_id in request.plugin_ids if plugin_id in catalog]


def allowed_tool_ids(request: RunRequest) -> list[str]:
    return [tool.id for tool in request.tools]


def summarize_args(arguments: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in arguments.items():
        if str(key).lower() in SECRET_KEYS:
            continue
        if isinstance(value, dict):
            value = summarize_args(value)
        elif isinstance(value, str) and len(value) > 120:
            value = value[:120] + "…"
        out[key] = value
    return out


def call_laravel_tool(
    callback: Callback,
    authorization: str | None,
    tool: str,
    arguments: dict[str, Any],
) -> dict[str, Any]:
    url = callback.url.rstrip("/") + "/" + tool
    body = json.dumps(
        {"workspace_id": callback.workspace_id, "arguments": arguments}
    ).encode()
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Evo-Workspace": str(callback.workspace_id),
    }
    if authorization:
        headers["Authorization"] = authorization
    request = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode() if exc.fp else ""
        return {
            "ok": False,
            "invocation": {"name": tool, "args": summarize_args(arguments), "status": "error"},
            "error": f"tool_http_{exc.code}",
            "detail": detail[:200],
        }
    except urllib.error.URLError:
        return {
            "ok": False,
            "invocation": {"name": tool, "args": summarize_args(arguments), "status": "error"},
            "error": "tool_unreachable",
        }

    invocation = payload.get("invocation") if isinstance(payload, dict) else None
    if not isinstance(invocation, dict):
        invocation = {"name": tool, "args": summarize_args(arguments), "status": "ok"}
    return {"ok": bool(payload.get("ok", True)), "payload": payload, "invocation": invocation}


def constrain_prompt(request: RunRequest) -> str:
    allowed = allowed_plugin_ids(request)
    tools = allowed_tool_ids(request)
    lines = [
        "You are the EvoCRM workspace assistant.",
        "Call only the live tools listed below by posting to the Laravel callback.",
        "Do not invent tools. Do not use shell, filesystem, or git tools.",
        "Draft tools prepare text only. Never send.",
        f"Allowed plugins: {', '.join(allowed) if allowed else 'none'}.",
        f"Allowed tools: {', '.join(tools) if tools else 'none'}.",
        f"Session: {request.session_id or 'none'}.",
        "Connector status (no secrets): "
        + ", ".join(f"{item.id}={item.status}" for item in request.connectors),
        "",
        request.prompt.strip(),
    ]
    return "\n".join(lines)


def pick_bootstrap_call(request: RunRequest) -> tuple[str, dict[str, Any]] | None:
    tools = set(allowed_tool_ids(request))
    query = request.prompt.strip()[:200]
    if "crm.search" in tools:
        return "crm.search", {"q": query, "type": "contact"}
    if "desk.list_threads" in tools:
        return "desk.list_threads", {"limit": 10}
    if "browser.research" in tools:
        return "browser.research", {"query": query}
    if "mcp.list_tools" in tools:
        return "mcp.list_tools", {}
    return None


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"ok": True, "status": "ready"}


@app.post("/v1/run")
async def run_agent(
    request: RunRequest,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    authorize(authorization)
    if not request.prompt.strip():
        raise HTTPException(status_code=422, detail="prompt is required")

    prompt = constrain_prompt(request)
    tools_used: list[dict[str, Any]] = []
    tool_results: list[Any] = []

    if request.callback and allowed_tool_ids(request):
        bootstrap = pick_bootstrap_call(request)
        if bootstrap:
            tool, arguments = bootstrap
            called = call_laravel_tool(request.callback, authorization, tool, arguments)
            tools_used.append(called["invocation"])
            if called.get("ok"):
                tool_results.append(called.get("payload"))

    if Manus is None:
        if tool_results:
            return {
                "status": "ok",
                "result": tool_results[0].get("result") if isinstance(tool_results[0], dict) else tool_results[0],
                "tools_used": tools_used,
                "errors": [],
            }
        return {
            "status": "error",
            "result": None,
            "tools_used": tools_used,
            "errors": [
                "OpenManus Manus agent is not installed in this runtime. Clone upstream into services/openmanus/OpenManus."
            ],
        }

    agent = await Manus.create()
    try:
        result = await agent.run(prompt)
        return {
            "status": "ok",
            "result": result,
            "tools_used": tools_used,
            "errors": [],
        }
    except Exception as exc:  # noqa: BLE001 - fail closed to Laravel
        return {
            "status": "error",
            "result": None,
            "tools_used": tools_used,
            "errors": [str(exc.__class__.__name__)],
        }
    finally:
        await agent.cleanup()
