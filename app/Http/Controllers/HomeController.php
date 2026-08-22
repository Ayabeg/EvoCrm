<?php

namespace App\Http\Controllers;

use App\Models\Activity;
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
                'open_pipeline_cents' => (int) (clone $openDeals)->sum('amount_cents'),
                'inbox_unread' => (int) Thread::query()->forWorkspace($workspace)->sum('unread_count'),
                'sequences_enrolled' => Enrollment::query()->forWorkspace($workspace)->where('status', 'active')->count(),
                'ads_leads_today' => AdLead::query()
                    ->forWorkspace($workspace)
                    ->whereDate('created_at', now('Africa/Algiers')->toDateString())
                    ->count(),
                'open_tasks' => Activity::query()
                    ->forWorkspace($workspace)
                    ->where('type', 'task')
                    ->where('done', false)
                    ->count(),
            ],
            'nextSteps' => Activity::query()
                ->forWorkspace($workspace)
                ->with(['contact', 'deal.stage', 'owner'])
                ->where('type', 'task')
                ->where('done', false)
                ->orderByRaw('due_at is null')
                ->orderBy('due_at')
                ->limit(16)
                ->get(),
            'evolution' => $evolution->health($workspace),
            'meta_connected' => filled(config('meta.access_token')) && filled(config('meta.ad_account_id')),
            'deskUrl' => $workspace->inboxUrl(),
        ]);
    }
}
