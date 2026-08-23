<?php

namespace App\Http\Controllers\Ads;

use App\Http\Controllers\Controller;
use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdLead;
use App\Services\Ads\AdsFunnel;
use App\Services\Ads\MetaAdsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdsCenterController extends Controller
{
    public function index(Request $request, AdsFunnel $funnel): Response
    {
        $workspace = $request->user()->workspace;

        $campaigns = AdCampaign::query()
            ->forWorkspace($workspace)
            ->with('account')
            ->withCount(['adSets'])
            ->latest()
            ->get();

        $funnels = $funnel->forWorkspace($workspace);

        return Inertia::render('ads/index', [
            'accounts' => AdAccount::query()
                ->forWorkspace($workspace)
                ->withCount('campaigns')
                ->latest()
                ->get(),
            'campaigns' => $campaigns,
            'funnels' => $funnels,
            'totals' => $funnel->totals($funnels),
            'leads' => AdLead::query()
                ->forWorkspace($workspace)
                ->with(['contact', 'lead', 'campaign'])
                ->latest()
                ->limit(50)
                ->get(),
            'meta' => $this->metaStatus(),
        ]);
    }

    public function show(Request $request, AdCampaign $campaign, AdsFunnel $funnel): Response
    {
        abort_unless((int) $campaign->workspace_id === (int) $request->user()->workspace_id, 404);

        return Inertia::render('ads/show', [
            'campaign' => $campaign->load(['account', 'adSets.ads']),
            'funnel' => $funnel->forCampaign($campaign),
            'daily' => $campaign->stats()->orderByDesc('date')->limit(30)->get()->reverse()->values(),
            'leads' => AdLead::query()
                ->where('ad_campaign_id', $campaign->id)
                ->with(['contact', 'lead'])
                ->latest()
                ->limit(50)
                ->get(),
            'threads' => $campaign->threads()
                ->with('contact:id,first_name,last_name,phone_e164')
                ->orderByDesc('last_message_at')
                ->limit(20)
                ->get(),
            'meta' => $this->metaStatus(),
        ]);
    }

    public function sync(Request $request, MetaAdsService $meta): RedirectResponse
    {
        $result = $meta->sync($request->user()->workspace);

        if (! $result['ok']) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $result['reason'] ?? 'Meta sync failed.']);

            return back();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => "Synced {$result['campaigns']} Meta campaigns."]);

        return back();
    }

    /**
     * @return array{connected: bool, app_id_set: bool, ad_account_id_set: bool, reason: string|null}
     */
    protected function metaStatus(): array
    {
        return [
            'connected' => filled(config('meta.access_token')) && filled(config('meta.app_id')),
            'app_id_set' => filled(config('meta.app_id')),
            'ad_account_id_set' => filled(config('meta.ad_account_id')),
            'reason' => filled(config('meta.access_token'))
                ? null
                : 'Meta is not connected. Set META_APP_ID, META_ACCESS_TOKEN, and META_AD_ACCOUNT_ID. Do not invent Tech Provider status.',
        ];
    }
}
