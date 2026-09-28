<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use App\Services\Agent\AgentWorkspaceSettings;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateAgentRuntime
{
    public function __construct(private AgentWorkspaceSettings $settings) {}

    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($this->settings->envEnabled(), 404);

        $workspaceId = $request->header('X-Evo-Workspace') ?? $request->input('workspace_id');
        abort_unless(filled($workspaceId), 401);

        $workspace = Workspace::query()->find($workspaceId);
        abort_unless($workspace, 404);
        abort_unless($this->settings->workspaceEnabled($workspace), 404);

        $expected = $this->settings->runtimeToken($workspace);
        $provided = $request->bearerToken();

        abort_unless(filled($expected) && is_string($provided) && hash_equals($expected, $provided), 401);

        $request->attributes->set('agent_workspace', $workspace);

        return $next($request);
    }
}
