<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\MetaConversionConfig;
use App\Models\MetaConversionEvent;
use App\Models\MetaFieldMapping;
use App\Models\MetaLeadForm;
use App\Models\MetaSyncRun;
use App\Models\MetaWebhookEvent;
use App\Services\Meta\MetaConversionsService;
use App\Services\Meta\MetaFieldMapper;
use App\Services\Meta\MetaSyncService;
use App\Services\Meta\WorkspaceMetaCredentials;
use App\Services\Operations\AuditLogger;
use App\Services\Webhooks\WebhookEndpointManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MetaSettingsController extends Controller
{
    public function edit(
        Request $request,
        WorkspaceMetaCredentials $credentials,
        MetaConversionsService $conversions,
        WebhookEndpointManager $endpoints,
    ): Response {
        $workspace = $request->user()->workspace;
        $resolved = $credentials->resolve($workspace);
        $integration = $resolved['integration'] ?? $workspace->integration('meta');

        return Inertia::render('settings/meta', [
            'connected' => $integration?->isConnected() ?? $resolved['ok'],
            'app_id_set' => filled(config('meta.app_id')),
            'ad_account_id_set' => filled($resolved['ad_account_id']),
            'ad_accounts' => $credentials->accounts($integration),
            'selected_ad_account_id' => $resolved['ad_account_id'],
            'graph_version' => config('meta.graph_version'),
            'reason' => $resolved['reason'] ?? ($integration?->isConnected() ? null : 'Meta is not connected for this workspace.'),
            'can_manage' => $request->user()->role->canManageSettings(),
            'connect_url' => '/auth/meta?popup=1',
            'expires_at' => $integration?->expires_at?->toIso8601String(),
            'webhook_url' => $endpoints->urlFor($workspace, WebhookEndpointManager::PROVIDER_META_LEADS),
            'verify_token_set' => filled(config('meta.webhook_verify_token')),
            'pages' => collect($integration?->meta['pages'] ?? [])
                ->map(fn ($page) => [
                    'id' => (string) ($page['id'] ?? ''),
                    'name' => (string) ($page['name'] ?? ''),
                ])
                ->filter(fn ($page) => $page['id'] !== '')
                ->values()
                ->all(),
            'instagram_accounts' => collect($integration?->meta['instagram_accounts'] ?? [])
                ->map(fn ($account) => [
                    'id' => (string) ($account['id'] ?? ''),
                    'name' => (string) ($account['name'] ?? ''),
                ])
                ->filter(fn ($account) => $account['id'] !== '')
                ->values()
                ->all(),
            'forms' => MetaLeadForm::query()->forWorkspace($workspace)->latest('last_synced_at')->limit(50)->get(),
            'field_mappings' => MetaFieldMapping::query()->forWorkspace($workspace)->orderBy('meta_field')->get(),
            'default_mappings' => MetaFieldMapper::defaults(),
            'conversion_configs' => $conversions->configs($workspace),
            'conversion_events' => MetaConversionConfig::metaEvents(),
            'sync_runs' => MetaSyncRun::query()->forWorkspace($workspace)->latest()->limit(10)->get(),
            'webhook_events' => MetaWebhookEvent::query()->forWorkspace($workspace)->latest()->limit(20)->get([
                'id', 'provider_event_id', 'event_type', 'status', 'attempts', 'error', 'processed_at', 'failed_at', 'created_at',
            ]),
            'conversion_logs' => MetaConversionEvent::query()->forWorkspace($workspace)->latest()->limit(20)->get([
                'id', 'event_id', 'crm_event', 'meta_event', 'status', 'attempts', 'error', 'sent_at', 'failed_at', 'created_at',
            ]),
            'last_success_at' => MetaConversionEvent::query()
                ->forWorkspace($workspace)
                ->where('status', MetaConversionEvent::STATUS_SENT)
                ->latest('sent_at')
                ->value('sent_at')?->toIso8601String(),
        ]);
    }

    public function updateAdAccount(
        Request $request,
        WorkspaceMetaCredentials $credentials,
        AuditLogger $audit,
    ): RedirectResponse {
        $workspace = $request->user()->workspace;
        $integration = $workspace->integration('meta');
        $accountIds = array_column($credentials->accounts($integration), 'id');
        $data = $request->validate([
            'ad_account_id' => ['required', 'string', Rule::in($accountIds)],
        ]);

        $credentials->selectAdAccount($workspace, $data['ad_account_id']);
        $audit->record($workspace, 'meta.ad_account_selected', 'Selected Meta ad account', $request->user());

        return back();
    }

    public function updateMappings(Request $request, MetaFieldMapper $mapper, AuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'mappings' => ['required', 'array', 'max:80'],
            'mappings.*.meta_field' => ['required', 'string', 'max:120'],
            'mappings.*.crm_property' => ['required', 'string', 'max:80'],
        ]);

        $mapper->replace($request->user()->workspace, $data['mappings']);
        $audit->record($request->user()->workspace, 'meta.field_mappings_updated', 'Updated Meta field mappings', $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Field mappings saved.']);

        return back();
    }

    public function updateConversions(Request $request, MetaConversionsService $conversions, AuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'pixel_id' => ['nullable', 'string', 'max:64'],
            'configs' => ['required', 'array'],
            'configs.*.crm_event' => ['required', 'string', Rule::in(array_keys(MetaConversionConfig::defaults()))],
            'configs.*.meta_event' => ['required', 'string', Rule::in(MetaConversionConfig::metaEvents())],
            'configs.*.enabled' => ['sometimes', 'boolean'],
        ]);

        $conversions->saveConfigs($request->user()->workspace, $data['configs'], $data['pixel_id'] ?? null);
        $audit->record($request->user()->workspace, 'meta.conversions_updated', 'Updated Meta conversion mappings', $request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Conversion mappings saved.']);

        return back();
    }

    public function sync(Request $request, MetaSyncService $sync): RedirectResponse
    {
        $kind = $request->validate([
            'kind' => ['required', 'string', Rule::in(['all', MetaSyncRun::KIND_ADS, MetaSyncRun::KIND_FORMS, MetaSyncRun::KIND_LEADS])],
        ])['kind'];

        $result = $sync->run($request->user()->workspace, $kind, MetaSyncRun::MODE_MANUAL);

        Inertia::flash('toast', [
            'type' => $result['ok'] ? 'success' : 'error',
            'message' => $result['ok']
                ? 'Meta sync completed.'
                : ($result['reason'] ?? 'Meta sync failed.'),
        ]);

        return back();
    }
}
