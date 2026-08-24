<?php

namespace App\Services\Crm;

use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\Workspace;
use Illuminate\Support\Collection;

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
     * @return array{
     *     stages: \Illuminate\Support\Collection<int, array<string, mixed>>,
     *     deals: \Illuminate\Support\Collection<int, array<string, mixed>>,
     *     forecast: array{count: int, amount_cents: int, weighted_cents: int}
     * }
     */
    public function boardData(Workspace $workspace, Pipeline $pipeline): array
    {
        $deals = Deal::query()
            ->forWorkspace($workspace)
            ->where('pipeline_id', $pipeline->id)
            ->with(['contact.company', 'company', 'stage', 'owner'])
            ->orderByDesc('last_activity_at')
            ->orderByDesc('id')
            ->limit(200)
            ->get();

        $stages = $pipeline->stages->map(function (Stage $stage) use ($deals) {
            $column = $deals->where('stage_id', $stage->id);
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
            'deals' => $deals->map(fn (Deal $deal) => [
                'id' => $deal->id,
                'title' => $deal->title,
                'amount_cents' => (int) $deal->amount_cents,
                'currency' => $deal->currency ?? 'DZD',
                'stage_id' => $deal->stage_id,
                'contact_name' => $deal->contact?->displayName(),
                'company_name' => $deal->company?->name ?? $deal->contact?->company?->name,
                'owner_name' => $deal->owner?->name,
                'close_date' => $deal->close_date?->toDateString(),
                'url' => "/crm/deals/{$deal->id}",
            ])->values(),
            'forecast' => [
                'count' => $deals->count(),
                'amount_cents' => (int) $stages->sum('amount_cents'),
                'weighted_cents' => (int) $stages->sum('weighted_cents'),
            ],
        ];
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
}
