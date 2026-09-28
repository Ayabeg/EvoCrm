<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Agent\AgentWorkspaceSettings;
use App\Services\OpenManusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OpenManusController extends Controller
{
    public function run(
        Request $request,
        OpenManusService $openManus,
        AgentWorkspaceSettings $settings,
    ): JsonResponse {
        abort_unless(config('services.openmanus.enabled'), 404);
        abort_unless($settings->workspaceEnabled($request->user()->workspace), 404);

        $validated = $request->validate([
            'prompt' => ['required', 'string', 'max:20000'],
            'session_id' => ['nullable', 'string', 'max:120'],
            'plugin_ids' => ['sometimes', 'array', 'max:20'],
            'plugin_ids.*' => ['string', 'max:80', Rule::in(array_keys(config('agent.plugins', [])))],
        ]);

        $result = $openManus->run(
            $validated['prompt'],
            $request->user()->workspace,
            $validated['session_id'] ?? null,
            $validated['plugin_ids'] ?? [],
        );

        return response()->json($result);
    }

    public function health(Request $request, OpenManusService $openManus): JsonResponse
    {
        return response()->json($openManus->health($request->user()->workspace));
    }

    public function status(
        Request $request,
        OpenManusService $openManus,
        AgentWorkspaceSettings $settings,
    ): JsonResponse {
        $workspace = $request->user()->workspace;
        $health = $openManus->health($workspace);

        return response()->json($settings->onboarding($workspace, $health));
    }
}
