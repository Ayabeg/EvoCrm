<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\Meta\WorkspaceMetaCredentials;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MetaSettingsController extends Controller
{
    public function edit(Request $request, WorkspaceMetaCredentials $credentials): Response
    {
        $workspace = $request->user()->workspace;
        $resolved = $credentials->resolve($workspace);

        return Inertia::render('settings/meta', [
            'connected' => $resolved['ok'],
            'app_id_set' => filled(config('meta.app_id')),
            'ad_account_id_set' => filled($resolved['ad_account_id']),
            'ad_accounts' => $credentials->accounts($resolved['integration']),
            'selected_ad_account_id' => $resolved['ad_account_id'],
            'graph_version' => config('meta.graph_version'),
            'reason' => $resolved['reason'],
            'can_manage' => $request->user()->role->canManageSettings(),
        ]);
    }

    public function updateAdAccount(
        Request $request,
        WorkspaceMetaCredentials $credentials,
    ): RedirectResponse {
        $workspace = $request->user()->workspace;
        $integration = $workspace->integration('meta');
        $accountIds = array_column($credentials->accounts($integration), 'id');
        $data = $request->validate([
            'ad_account_id' => ['required', 'string', Rule::in($accountIds)],
        ]);

        $credentials->selectAdAccount($workspace, $data['ad_account_id']);

        return back();
    }
}
