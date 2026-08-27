<?php

namespace App\Http\Controllers\Crm;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\Deal;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * /leads — the Kommo-style pipeline board. This IS the existing deal
 * engine: cards are Deal records grouped by their Pipeline Stage (New →
 * Qualified → Demo → Proposal → Won / Lost). No parallel pipeline table.
 */
class LeadBoardController extends Controller
{
    /** Pending to-dos on a card: tasks, calls, and meetings with a due date. */
    private const PENDING_TYPES = ['task', 'call', 'meeting'];

    public const FILTERS = ['active', 'tasks_today', 'no_tasks', 'overdue', 'new_today'];

    public function index(Request $request): Response
    {
        $workspace = $request->user()->workspace;
        $pipeline = $workspace->defaultPipeline()->load('stages');

        $filter = (string) $request->query('filter', 'active');
        if (! in_array($filter, self::FILTERS, true)) {
            $filter = 'active';
        }
        $search = trim((string) $request->query('q', ''));

        $deals = Deal::query()
            ->forWorkspace($workspace)
            ->with(['contact', 'company', 'stage', 'owner', 'lead.latestScore'])
            ->orderByDesc('last_activity_at')
            ->orderByDesc('id')
            ->get();

        $pendingByDeal = $this->pendingActivities($deals->pluck('id')->all(), (int) $workspace->id);

        $cards = $deals->map(fn (Deal $deal) => $this->card($deal, $pendingByDeal->get($deal->id)));

        $active = $cards->filter(fn (array $card) => ! $card['terminal'])->values();

        $counts = [
            'active' => $active->count(),
            'tasks_today' => $active->filter(fn (array $card) => $card['task_due_today'])->count(),
            'no_tasks' => $active->filter(fn (array $card) => ! $card['has_task'])->count(),
            'overdue' => $active->filter(fn (array $card) => $card['task_overdue'])->count(),
            'new_today' => $active->filter(fn (array $card) => $card['created_today'])->count(),
        ];

        $visible = $this->applyFilter($active, $filter);

        if ($search !== '') {
            $needle = mb_strtolower($search);
            $visible = $visible->filter(fn (array $card) => str_contains(mb_strtolower($card['title']), $needle)
                || str_contains(mb_strtolower($card['contact_name'] ?? ''), $needle)
                || str_contains(mb_strtolower($card['company_name'] ?? ''), $needle)
            )->values();
        }

        return Inertia::render('leads/board', [
            'pipeline' => ['id' => $pipeline->id, 'name' => $pipeline->name],
            'stages' => $pipeline->stages->map(fn ($stage) => [
                'id' => $stage->id,
                'name' => $stage->name,
                'slug' => $stage->slug,
                'position' => $stage->position,
                'is_won' => $stage->is_won,
                'is_lost' => $stage->is_lost,
            ])->values(),
            'deals' => $visible->values(),
            'counts' => $counts,
            'filter' => $filter,
            'q' => $search,
        ]);
    }

    /**
     * Next pending activity per deal, in one query, earliest due first.
     *
     * @param  array<int, int>  $dealIds
     * @return Collection<int, Collection<int, Activity>>
     */
    private function pendingActivities(array $dealIds, int $workspaceId): Collection
    {
        if ($dealIds === []) {
            return collect();
        }

        return Activity::query()
            ->where('workspace_id', $workspaceId)
            ->whereIn('type', self::PENDING_TYPES)
            ->where('done', false)
            ->whereNotNull('due_at')
            ->whereIn('deal_id', $dealIds)
            ->orderBy('due_at')
            ->get()
            ->groupBy('deal_id');
    }

    /**
     * @param  Collection<int, Activity>|null  $pending
     * @return array<string, mixed>
     */
    private function card(Deal $deal, ?Collection $pending): array
    {
        $next = $pending?->first();
        $stage = $deal->stage;

        return [
            'id' => $deal->id,
            'title' => $deal->title,
            'amount_cents' => (int) $deal->amount_cents,
            'currency' => $deal->currency ?? 'DZD',
            'stage_id' => $deal->stage_id,
            'terminal' => (bool) ($stage?->is_won || $stage?->is_lost),
            'contact_name' => $deal->contact?->displayName(),
            'company_name' => $deal->company?->name,
            'owner_name' => $deal->owner?->name,
            'next_task' => $next ? [
                'subject' => $next->subject,
                'due_at' => $next->due_at?->toIso8601String(),
                'overdue' => $next->due_at?->isPast() ?? false,
            ] : null,
            'has_task' => $next !== null,
            'task_due_today' => $next !== null && $next->due_at?->isToday() === true,
            'task_overdue' => $next !== null && ($next->due_at?->isPast() ?? false),
            'created_today' => $deal->created_at?->isToday() ?? false,
            'url' => "/crm/deals/{$deal->id}",
            'lead_score' => $this->leadScore($deal),
        ];
    }

    /**
     * @return array{score: int, reason: string|null}|null
     */
    private function leadScore(Deal $deal): ?array
    {
        $lead = $deal->lead;

        if (! $lead || ! $lead->latestScore) {
            return null;
        }

        return [
            'score' => (int) $lead->score,
            'reason' => $lead->latestScore->reason,
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $active
     * @return Collection<int, array<string, mixed>>
     */
    private function applyFilter(Collection $active, string $filter): Collection
    {
        return match ($filter) {
            'tasks_today' => $active->filter(fn (array $card) => $card['task_due_today'])->values(),
            'no_tasks' => $active->filter(fn (array $card) => ! $card['has_task'])->values(),
            'overdue' => $active->filter(fn (array $card) => $card['task_overdue'])->values(),
            'new_today' => $active->filter(fn (array $card) => $card['created_today'])->values(),
            default => $active,
        };
    }
}
