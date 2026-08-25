<?php

namespace App\Services\Crm;

use App\Models\Deal;
use App\Models\Pipeline;
use App\Models\Stage;
use App\Models\Workspace;
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
     * @return array{
     *     stages: Collection<int, array<string, mixed>>,
     *     deals: Collection<int, array<string, mixed>>,
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
