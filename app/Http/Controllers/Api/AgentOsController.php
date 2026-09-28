<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Agent\AgentWorkspaceSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentOsController extends Controller
{
    public function plugins(Request $request, AgentWorkspaceSettings $settings): JsonResponse
    {
        return response()->json([
            'plugins' => $settings->plugins($request->user()->workspace),
        ]);
    }

    public function updatePlugin(Request $request, string $plugin, AgentWorkspaceSettings $settings): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
        ]);

        $settings->setPlugin($request->user()->workspace, $plugin, $validated['enabled']);

        return response()->json([
            'plugins' => $settings->plugins($request->user()->workspace),
        ]);
    }

    public function connectors(Request $request, AgentWorkspaceSettings $settings): JsonResponse
    {
        return response()->json([
            'connectors' => $settings->connectors($request->user()->workspace),
        ]);
    }

    public function updateConnector(Request $request, string $connector, AgentWorkspaceSettings $settings): JsonResponse
    {
        $validated = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'url' => ['nullable', 'url', 'max:500'],
            'token' => ['nullable', 'string', 'max:500'],
        ]);

        $settings->updateConnector($request->user()->workspace, $connector, $validated);

        return response()->json([
            'connectors' => $this->withoutSecrets($settings->connectors($request->user()->workspace)),
        ]);
    }

    public function destroyConnector(Request $request, string $connector, AgentWorkspaceSettings $settings): JsonResponse
    {
        $settings->disconnectConnector($request->user()->workspace, $connector);

        return response()->json([
            'connectors' => $this->withoutSecrets($settings->connectors($request->user()->workspace)),
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $connectors
     * @return list<array<string, mixed>>
     */
    private function withoutSecrets(array $connectors): array
    {
        return array_map(function (array $connector) {
            unset($connector['token']);

            return $connector;
        }, $connectors);
    }
}
