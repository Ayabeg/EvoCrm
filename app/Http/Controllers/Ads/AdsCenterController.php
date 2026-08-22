<?php

namespace App\Http\Controllers\Ads;

use App\Http\Controllers\Controller;
use App\Models\AdAccount;
use App\Models\AdCampaign;
use App\Models\AdLead;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdsCenterController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;

        return Inertia::render('ads/index', [
            'accounts' => AdAccount::query()->forWorkspace($workspace)->withCount('campaigns')->latest()->get(),
            'campaigns' => AdCampaign::query()->forWorkspace($workspace)->with('account')->latest()->get(),
            'leads' => AdLead::query()->forWorkspace($workspace)->with(['contact', 'lead'])->latest()->limit(50)->get(),
            'meta' => [
                'connected' => filled(config('meta.access_token')) && filled(config('meta.app_id')),
                'app_id_set' => filled(config('meta.app_id')),
                'ad_account_id_set' => filled(config('meta.ad_account_id')),
                'reason' => filled(config('meta.access_token'))
                    ? null
                    : 'Meta is not connected. Set META_APP_ID, META_ACCESS_TOKEN, and META_AD_ACCOUNT_ID. Do not invent Tech Provider status.',
            ],
        ]);
    }
}
