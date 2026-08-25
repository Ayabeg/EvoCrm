<?php

namespace App\Http\Controllers\Ads;

use App\Http\Controllers\Controller;
use App\Models\Ad;
use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdLead;
use App\Models\AdSet;
use App\Models\OutboundCampaign;
use App\Models\SavedFilter;
use App\Models\Workspace;
use App\Services\Ads\AdsFunnel;
use App\Services\Ads\MetaAdsService;
use App\Services\Meta\WorkspaceMetaCredentials;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdsCenterController extends Controller
{
    public function __construct(private WorkspaceMetaCredentials $metaCredentials) {}

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
                ->with(['contact', 'lead.deal', 'campaign'])
                ->latest()
                ->limit(50)
                ->get(),
            'meta' => $this->metaStatus($workspace),
        ]);
    }


    public function campaigns(Request $request, AdsFunnel $funnel): Response
    {
        $workspace = $request->user()->workspace;
        $campaigns = AdCampaign::query()->forWorkspace($workspace)->with('account')->withCount(['adSets'])->latest()->get();
        return Inertia::render('ads/campaigns/index', ['campaigns' => $campaigns, 'funnels' => $funnel->forWorkspace($workspace), 'meta' => $this->metaStatus($workspace)]);
    }

    public function adSets(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        return Inertia::render('ads/ad-sets/index', ['adSets' => AdSet::query()->forWorkspace($workspace)->with('campaign:id,name,status')->withCount('ads')->latest()->get(), 'meta' => $this->metaStatus($workspace)]);
    }

    public function adsIndex(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        return Inertia::render('ads/ads/index', ['ads' => Ad::query()->forWorkspace($workspace)->with('adSet:id,name,ad_campaign_id', 'adSet.campaign:id,name')->latest()->get(), 'meta' => $this->metaStatus($workspace)]);
    }

    public function attribution(Request $request, AdsFunnel $funnel): Response
    {
        $workspace = $request->user()->workspace;

        $campaigns = AdCampaign::query()
            ->forWorkspace($workspace)
            ->with('account')
            ->withCount(['adSets'])
            ->latest()
            ->get();

        $funnels = $funnel->forWorkspace($workspace);

        return Inertia::render('ads/attribution', [
            'campaigns' => $campaigns,
            'funnels' => $funnels,
            'totals' => $funnel->totals($funnels),
            'meta' => $this->metaStatus($workspace),
        ]);
    }

    public function audiences(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        $campaignsByFilter = OutboundCampaign::query()
            ->forWorkspace($workspace)
            ->whereNotNull('saved_filter_id')
            ->get(['id', 'name', 'status', 'saved_filter_id'])
            ->groupBy('saved_filter_id');

        $segments = SavedFilter::query()
            ->forWorkspace($workspace)
            ->where('entity', 'contact')
            ->orderBy('name')
            ->get()
            ->map(fn (SavedFilter $saved) => [
                'id' => $saved->id,
                'name' => $saved->name,
                'entity' => $saved->entity,
                'campaigns' => ($campaignsByFilter[$saved->id] ?? collect())
                    ->map(fn (OutboundCampaign $c) => [
                        'id' => $c->id,
                        'name' => $c->name,
                        'status' => $c->status,
                    ])
                    ->values()
                    ->all(),
            ]);

        return Inertia::render('ads/audiences', [
            'segments' => $segments,
            'meta' => $this->metaStatus($workspace),
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
                ->with(['contact', 'lead.deal'])
                ->latest()
                ->limit(50)
                ->get(),
            'threads' => $campaign->threads()
                ->with('contact:id,first_name,last_name,phone_e164')
                ->orderByDesc('last_message_at')
                ->limit(20)
                ->get(),
            'meta' => $this->metaStatus($request->user()->workspace),
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

    protected function metaStatus(Workspace $workspace): array
    {
        $status = $this->metaCredentials->status($workspace);

        return [
            'connected' => $status['connected'],
            'app_id_set' => filled(config('meta.app_id')),
            'ad_account_id_set' => $status['ad_account_id_set'],
            'reason' => $status['reason'],
        ];
    }
}
