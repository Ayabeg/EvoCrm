<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Agent\AgentWorkspaceSettings;
use App\Services\OpenManusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AgentSettingsController extends Controller
{
    public function edit(
        Request $request,
        OpenManusService $openManus,
        AgentWorkspaceSettings $settings,
    ): Response {
        $workspace = $request->user()->workspace;
        $health = $openManus->health($workspace);

        return Inertia::render('settings/agent', [
            'onboarding' => $settings->onboarding($workspace, $health),
            'plugins' => $settings->plugins($workspace),
            'connectors' => $settings->connectors($workspace),
        ]);
    }

    public function update(Request $request, AgentWorkspaceSettings $settings): RedirectResponse
    {
        $validated = $request->validate([
            'workspace_enabled' => ['required', 'boolean'],
            'url' => ['nullable', 'url', 'max:500'],
            'token' => ['nullable', 'string', 'max:500'],
        ]);

        $settings->updateOnboarding($request->user()->workspace, $validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Agent settings saved. The shared token is stored encrypted and is never shown again.',
        ]);

        return redirect()->route('settings.agent');
    }

    public function health(Request $request, OpenManusService $openManus): RedirectResponse
    {
        $health = $openManus->health($request->user()->workspace);

        Inertia::flash('toast', [
            'type' => $health['ok'] ? 'success' : 'info',
            'message' => $health['message'],
        ]);

        return back();
    }

    public function updatePlugin(Request $request, string $plugin, AgentWorkspaceSettings $settings): RedirectResponse
    {
        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'plugin' => ['sometimes', Rule::in(array_keys(config('agent.plugins', [])))],
        ]);

        $settings->setPlugin($request->user()->workspace, $plugin, $validated['enabled']);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $validated['enabled'] ? 'Plugin enabled.' : 'Plugin disabled.',
        ]);

        return back();
    }

    public function updateConnector(Request $request, string $connector, AgentWorkspaceSettings $settings): RedirectResponse
    {
        $validated = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'url' => ['nullable', 'url', 'max:500'],
            'token' => ['nullable', 'string', 'max:500'],
        ]);

        $settings->updateConnector($request->user()->workspace, $connector, $validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Connector saved. Secrets are write-only.',
        ]);

        return back();
    }

    public function destroyConnector(Request $request, string $connector, AgentWorkspaceSettings $settings): RedirectResponse
    {
        $settings->disconnectConnector($request->user()->workspace, $connector);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Connector disconnected. Stored credentials were deleted.',
        ]);

        return back();
    }
}
