<?php

namespace App\Http\Controllers;

use App\Models\AdLead;
use App\Models\Deal;
use App\Models\Enrollment;
use App\Models\Thread;
use App\Services\Evolution\EvolutionCloudService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(Request $request, EvolutionCloudService $evolution): Response
    {
        $workspace = $request->user()->workspace;

        $openDeals = Deal::query()
            ->forWorkspace($workspace)
            ->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false));

        return Inertia::render('home', [
            'stats' => [
                'open_deals' => (clone $openDeals)->count(),
                'inbox_unread' => (int) Thread::query()->forWorkspace($workspace)->sum('unread_count'),
                'sequences_enrolled' => Enrollment::query()->forWorkspace($workspace)->where('status', 'active')->count(),
                'ads_leads_today' => AdLead::query()
                    ->forWorkspace($workspace)
                    ->whereDate('created_at', now('Africa/Algiers')->toDateString())
                    ->count(),
            ],
            'nextSteps' => Deal::query()
                ->forWorkspace($workspace)
                ->with(['contact', 'company', 'stage'])
                ->whereNull('next_activity_at')
                ->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false))
                ->latest()
                ->limit(12)
                ->get(),
            'evolution' => $evolution->health($workspace),
            'meta_connected' => filled(config('meta.access_token')) && filled(config('meta.ad_account_id')),
            'deskUrl' => $workspace->inboxUrl(),
        ]);
    }
}
