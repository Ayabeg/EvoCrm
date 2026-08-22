<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Deal;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $start = Carbon::now('Africa/Algiers')->startOfMonth();

        $open = Deal::query()
            ->forWorkspace($workspace)
            ->with('stage')
            ->whereHas('stage', fn ($q) => $q->where('is_won', false)->where('is_lost', false))
            ->get();

        $byStage = $open->groupBy(fn (Deal $deal) => $deal->stage?->name ?? '—')
            ->map(fn ($rows) => [
                'count' => $rows->count(),
                'amount_cents' => $rows->sum('amount_cents'),
            ]);

        $won = Deal::query()
            ->forWorkspace($workspace)
            ->whereHas('stage', fn ($q) => $q->where('is_won', true))
            ->where('closed_at', '>=', $start)
            ->get();

        $lost = Deal::query()
            ->forWorkspace($workspace)
            ->whereHas('stage', fn ($q) => $q->where('is_lost', true))
            ->where('closed_at', '>=', $start)
            ->get();

        return Inertia::render('crm/reports', [
            'wonThisMonth' => [
                'count' => $won->count(),
                'amount_cents' => $won->sum('amount_cents'),
            ],
            'lostThisMonth' => [
                'count' => $lost->count(),
                'amount_cents' => $lost->sum('amount_cents'),
            ],
            'pipelineByStage' => $byStage,
            'activitiesCompleted' => Activity::query()
                ->forWorkspace($workspace)
                ->where('done', true)
                ->where('completed_at', '>=', $start)
                ->count(),
            'openPipelineCents' => $open->sum('amount_cents'),
        ]);
    }
}
