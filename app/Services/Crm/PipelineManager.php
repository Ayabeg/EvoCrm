<?php

namespace App\Services\Crm;

use App\Models\Activity;
use App\Models\Deal;
use App\Models\OutboundMessage;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\Thread;
use App\Models\Workspace;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PipelineManager
{
    public function resolve(Workspace $workspace, ?int $requestedId = null): Pipeline
    {
        $pipelines = $this->options($workspace);

        if ($requestedId && $requestedId > 0) {
            $match = $pipelines->firstWhere('id', $requestedId);
            if ($match instanceof Pipeline) {
                return $match->load('stages');
            }
        }

        $default = $pipelines->firstWhere('is_default', true) ?? $pipelines->first();

        abort_unless($default instanceof Pipeline, 404);

        return $default->load('stages');
    }

    /**
     * @return Collection<int, Pipeline>
     */
    public function options(Workspace $workspace): Collection
    {
        return $workspace->pipelines()
            ->withCount('stages')
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get();
    }

    public function create(Workspace $workspace, string $name, bool $isDefault = false): Pipeline
    {
        if ($isDefault) {
            Pipeline::query()
                ->where('workspace_id', $workspace->id)
                ->update(['is_default' => false]);
        }

        $pipeline = Pipeline::query()->create([
            'workspace_id' => $workspace->id,
            'name' => $name,
            'is_default' => $isDefault,
        ]);

        $this->seedStages($pipeline);

        return $pipeline->load('stages');
    }

    public function seedStages(Pipeline $pipeline): void
    {
        foreach (config('evosales.pipeline') as $stage) {
            $pipeline->stages()->firstOrCreate(
                ['slug' => $stage['slug'], 'workspace_id' => $pipeline->workspace_id],
                [
                    'name' => $stage['name'],
                    'position' => $stage['position'],
                    'is_won' => $stage['is_won'],
                    'is_lost' => $stage['is_lost'],
                    'probability' => $stage['probability'] ?? null,
                ]
            );
        }
    }

    /**
     * @param  array<string, mixed>  $options
     * @param  (callable(Builder<Deal>): void)|null  $constrain
     * @return array{
     *     stages: Collection<int, array<string, mixed>>,
     *     deals: Collection<int, array<string, mixed>>,
     *     forecast: array{count: int, amount_cents: int, weighted_cents: int}
     * }
     */
    public function boardData(Workspace $workspace, Pipeline $pipeline, array $options = [], ?callable $constrain = null): array
    {
        $options = array_merge(DealBoardOptions::defaults(), $options);
        $query = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->with(['contact.company', 'company', 'stage', 'owner'])
            ->withCount('quotes');

        if ($constrain) {
            $constrain($query);
        }

        $deals = $query->limit(200)->get();

        $touches = $this->lastTouches($workspace, $deals);
        $nextByDeal = $this->nextActivityByDeal($workspace, $deals);
        $evaluator = app(DealAttentionEvaluator::class);
        $attentions = $evaluator->presentMany($deals);

        $presented = $deals->map(function (Deal $deal) use ($touches, $nextByDeal, $options, $evaluator, $attentions) {
            $lastTouch = $touches[$deal->id] ?? $deal->last_activity_at;
            $inactiveDays = $lastTouch instanceof CarbonInterface
                ? (int) $lastTouch->diffInDays(now('Africa/Algiers'))
                : null;
            $threshold = (int) $options['inactive_after_days'];
            $isInactive = $inactiveDays === null || $inactiveDays >= $threshold;
            $next = $nextByDeal[$deal->id] ?? null;
            $hasNext = $next !== null
                || $deal->next_activity_at instanceof CarbonInterface;

            return [
                'id' => $deal->id,
                'title' => $deal->title,
                'amount_cents' => (int) $deal->amount_cents,
                'currency' => $deal->currency ?? 'DZD',
                'stage_id' => $deal->stage_id,
                'contact_name' => $deal->contact?->displayName(),
                'company_name' => $deal->company?->name ?? $deal->contact?->company?->name,
                'owner_name' => $deal->owner?->name,
                'close_date' => $deal->close_date?->toDateString(),
                'priority' => $this->priorityBand($deal->priority),
                'last_touch_at' => $lastTouch instanceof CarbonInterface
                    ? $lastTouch->timezone('Africa/Algiers')->toIso8601String()
                    : null,
                'inactive_days' => $inactiveDays,
                'is_inactive' => $isInactive,
                'has_next_activity' => $hasNext,
                'next_activity_label' => is_array($next) ? ($next['label'] ?? null) : null,
                'quote_count' => (int) ($deal->quotes_count ?? 0),
                'url' => "/crm/deals/{$deal->id}",
                'attention' => $evaluator->compact($attentions[(int) $deal->id] ?? null),
            ];
        });

        $presented = $this->sortBoardDeals($presented, (string) $options['sort']);

        $stages = $pipeline->stages->map(function (Stage $stage) use ($presented) {
            $column = $presented->where('stage_id', $stage->id);
            $amountCents = (int) $column->sum('amount_cents');
            $probability = $stage->winProbability();

            return [
                'id' => $stage->id,
                'name' => $stage->name,
                'slug' => $stage->slug,
                'position' => $stage->position,
                'is_won' => $stage->is_won,
                'is_lost' => $stage->is_lost,
                'probability' => $probability,
                'count' => $column->count(),
                'amount_cents' => $amountCents,
                'weighted_cents' => DealBoardForecast::weightedCents($amountCents, $probability),
            ];
        })->values();

        return [
            'stages' => $stages,
            'deals' => $presented->values(),
            'forecast' => [
                'count' => $presented->count(),
                'amount_cents' => (int) $stages->sum('amount_cents'),
                'weighted_cents' => (int) $stages->sum('weighted_cents'),
            ],
        ];
    }

    /**
     * @param  Collection<int, Deal>  $deals
     * @return array<int, CarbonInterface|null>
     */
    private function lastTouches(Workspace $workspace, Collection $deals): array
    {
        $contactIds = $deals->pluck('contact_id')->filter()->unique()->values();

        $threadLast = Thread::query()
            ->forWorkspace($workspace)
            ->whereIn('contact_id', $contactIds)
            ->get(['contact_id', 'last_message_at'])
            ->groupBy('contact_id')
            ->map(fn (Collection $rows) => $rows->max('last_message_at'));

        $outboundLast = OutboundMessage::query()
            ->forWorkspace($workspace)
            ->whereIn('contact_id', $contactIds)
            ->get(['contact_id', 'sent_at', 'replied_at', 'opened_at', 'created_at'])
            ->groupBy('contact_id')
            ->map(function (Collection $rows) {
                return $rows->flatMap(fn (OutboundMessage $row) => [
                    $row->sent_at,
                    $row->replied_at,
                    $row->opened_at,
                    $row->created_at,
                ])->filter()->max();
            });

        $touches = [];
        foreach ($deals as $deal) {
            $candidates = collect([
                $deal->last_activity_at,
                $deal->contact?->last_activity_at,
                $threadLast[$deal->contact_id] ?? null,
                $outboundLast[$deal->contact_id] ?? null,
            ])->filter(fn ($value) => $value instanceof CarbonInterface);

            $touches[$deal->id] = $candidates->max();
        }

        return $touches;
    }

    /**
     * @param  Collection<int, Deal>  $deals
     * @return array<int, array{at: string, label: string}>
     */
    private function nextActivityByDeal(Workspace $workspace, Collection $deals): array
    {
        $ids = $deals->pluck('id');

        return Activity::query()
            ->forWorkspace($workspace)
            ->whereIn('deal_id', $ids)
            ->where('done', false)
            ->whereNotNull('due_at')
            ->where('due_at', '>=', now('Africa/Algiers'))
            ->get(['deal_id', 'due_at', 'subject', 'type'])
            ->groupBy('deal_id')
            ->map(function (Collection $rows) {
                $row = $rows->sortBy('due_at')->first();

                if (! $row?->due_at) {
                    return null;
                }

                $when = $row->due_at->timezone('Africa/Algiers')->format('d M H:i');
                $label = trim(($row->subject ?: ucfirst((string) $row->type)).($when ? ' · '.$when : ''));

                return [
                    'at' => $row->due_at->timezone('Africa/Algiers')->toIso8601String(),
                    'label' => $label,
                ];
            })
            ->filter()
            ->all();
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $deals
     * @return Collection<int, array<string, mixed>>
     */
    private function sortBoardDeals(Collection $deals, string $sort): Collection
    {
        return match ($sort) {
            'amount' => $deals->sortByDesc('amount_cents')->values(),
            'close_date' => $deals->sortBy(fn (array $deal) => $deal['close_date'] ?? '9999-12-31')->values(),
            'title' => $deals->sortBy(fn (array $deal) => mb_strtolower((string) $deal['title']))->values(),
            default => $deals
                ->sort(fn (array $a, array $b) => [$b['last_touch_at'] ?? '', $b['id']] <=> [$a['last_touch_at'] ?? '', $a['id']])
                ->values(),
        };
    }

    private function priorityBand(?string $priority): ?string
    {
        $value = mb_strtolower(trim((string) $priority));

        return match ($value) {
            'high', 'urgent' => 'high',
            'low' => 'low',
            default => null,
        };
    }

    /**
     * @return array{count: int, amount_cents: int, weighted_cents: int, open_cents: int}
     */
    public function forecast(Workspace $workspace, Pipeline $pipeline): array
    {
        $board = $this->boardData($workspace, $pipeline);

        $openCents = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->whereHas('stage', fn ($query) => $query->where('is_won', false)->where('is_lost', false))
            ->sum('amount_cents');

        return [
            ...$board['forecast'],
            'open_cents' => (int) $openCents,
        ];
    }

    /**
     * @return array<int, array{id: int, name: string, is_default: bool, stages_count: int, deals_count: int}>
     */
    public function adminIndex(Workspace $workspace): array
    {
        return $workspace->pipelines()
            ->withCount(['stages', 'deals'])
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->map(fn (Pipeline $pipeline) => [
                'id' => $pipeline->id,
                'name' => $pipeline->name,
                'is_default' => (bool) $pipeline->is_default,
                'stages_count' => (int) $pipeline->stages_count,
                'deals_count' => (int) $pipeline->deals_count,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, name: string, slug: string, position: int, probability: int|null, is_won: bool, is_lost: bool, deals_count: int}>
     */
    public function stagesAdmin(Pipeline $pipeline): array
    {
        return $pipeline->stages()
            ->withCount('deals')
            ->orderBy('position')
            ->get()
            ->map(fn (Stage $stage) => [
                'id' => $stage->id,
                'name' => $stage->name,
                'slug' => $stage->slug,
                'position' => $stage->position,
                'probability' => $stage->probability,
                'is_won' => (bool) $stage->is_won,
                'is_lost' => (bool) $stage->is_lost,
                'deals_count' => (int) $stage->deals_count,
                'required_properties' => $stage->requiredPropertyKeys(),
            ])
            ->values()
            ->all();
    }

    public function createStage(Pipeline $pipeline, string $name, ?int $probability = null): Stage
    {
        $slug = Str::slug($name);
        $base = $slug;
        $i = 1;
        while ($pipeline->stages()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i;
            $i++;
        }

        $position = (int) $pipeline->stages()->max('position') + 1;

        return $pipeline->stages()->create([
            'workspace_id' => $pipeline->workspace_id,
            'name' => $name,
            'slug' => $slug,
            'position' => $position,
            'is_won' => false,
            'is_lost' => false,
            'probability' => $probability,
        ]);
    }

    public function updateStage(Stage $stage, array $data): Stage
    {
        if (isset($data['name'])) {
            $stage->name = $data['name'];
        }

        if (array_key_exists('probability', $data)) {
            $stage->probability = $data['probability'];
        }

        if (isset($data['is_won'])) {
            $stage->is_won = (bool) $data['is_won'];
            if ($stage->is_won) {
                $stage->is_lost = false;
            }
        }

        if (isset($data['is_lost'])) {
            $stage->is_lost = (bool) $data['is_lost'];
            if ($stage->is_lost) {
                $stage->is_won = false;
            }
        }

        if (array_key_exists('required_properties', $data)) {
            $stage->required_properties = array_values(array_unique(array_map('strval', $data['required_properties'] ?? [])));
        }

        $stage->save();

        return $stage;
    }

    public function deleteStage(Stage $stage, ?int $migrateToStageId = null): void
    {
        $dealCount = $stage->deals()->count();

        if ($dealCount > 0) {
            if (! $migrateToStageId) {
                throw ValidationException::withMessages([
                    'migrate_to_stage_id' => 'Choose a stage to move existing deals before deleting.',
                ]);
            }

            $target = Stage::query()
                ->where('pipeline_id', $stage->pipeline_id)
                ->where('id', $migrateToStageId)
                ->first();

            if (! $target) {
                throw ValidationException::withMessages([
                    'migrate_to_stage_id' => 'Target stage not found in this pipeline.',
                ]);
            }

            $stage->deals()->update(['stage_id' => $target->id]);
        }

        $stage->delete();
    }

    /**
     * @param  array<int, int>  $orderedStageIds
     */
    public function reorderStages(Pipeline $pipeline, array $orderedStageIds): void
    {
        foreach ($orderedStageIds as $position => $stageId) {
            Stage::query()
                ->where('pipeline_id', $pipeline->id)
                ->where('id', $stageId)
                ->update(['position' => $position]);
        }
    }
}
