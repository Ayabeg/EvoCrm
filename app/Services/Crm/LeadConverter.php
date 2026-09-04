<?php

namespace App\Services\Crm;

use App\Models\Deal;
use App\Models\Lead;
use App\Models\Stage;
use App\Models\User;
use App\Services\Analytics\ProductAnalytics;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class LeadConverter
{
    public function __construct(
        private ActivityRecorder $activities,
        private PipelineManager $pipelines,
        private ProductAnalytics $analytics,
    ) {}

    /**
     * @param  array<string, mixed>  $input
     */
    public function convert(Lead $lead, User $actor, array $input = []): Deal
    {
        return DB::transaction(function () use ($lead, $actor, $input): Deal {
            $lead->refresh();
            $workspace = $lead->workspace ?? $actor->workspace;

            $existing = Deal::query()
                ->where('workspace_id', $lead->workspace_id)
                ->where('lead_id', $lead->id)
                ->lockForUpdate()
                ->first();

            if ($existing instanceof Deal) {
                $lead->qualify();

                return $existing;
            }

            $mode = (string) ($input['mode'] ?? 'create');
            $deal = $mode === 'link'
                ? $this->linkExisting($lead, $actor, $input)
                : $this->createDeal($lead, $actor, $input);

            $lead->qualify();

            $this->activities->record($workspace, [
                'type' => 'lead_converted',
                'subject' => 'Lead converted to deal',
                'body' => $mode === 'link'
                    ? "Qualified lead linked to {$deal->title}."
                    : "Qualified lead created deal {$deal->title}.",
                'contact_id' => $lead->contact_id,
                'deal_id' => $deal->id,
                'company_id' => $lead->company_id ?? $deal->company_id,
                'owner_id' => $deal->owner_id,
                'meta' => [
                    'lead_id' => $lead->id,
                    'mode' => $mode,
                    'source' => $lead->source,
                ],
            ], $actor);

            $this->analytics->capture(ProductAnalytics::LEAD_CONVERTED, [
                'lead_id' => $lead->id,
                'deal_id' => $deal->id,
                'mode' => $mode,
                'source' => $lead->source,
            ], $actor, $workspace);

            return $deal->fresh() ?? $deal;
        });
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function createDeal(Lead $lead, User $actor, array $input): Deal
    {
        $workspace = $lead->workspace ?? $actor->workspace;
        $pipeline = $this->pipelines->resolve($workspace, isset($input['pipeline_id']) ? (int) $input['pipeline_id'] : null);
        $stage = $this->resolveStage($pipeline->id, $input['stage_id'] ?? null);

        return Deal::query()->create([
            'workspace_id' => $lead->workspace_id,
            'contact_id' => $lead->contact_id,
            'company_id' => $lead->company_id,
            'lead_id' => $lead->id,
            'pipeline_id' => $pipeline->id,
            'stage_id' => $stage->id,
            'owner_id' => $this->resolveOwner($lead, $actor, $input),
            'title' => $lead->title,
            'amount_cents' => $this->toCents($input),
            'currency' => 'DZD',
            'source' => $lead->source,
        ]);
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function linkExisting(Lead $lead, User $actor, array $input): Deal
    {
        $dealId = (int) ($input['deal_id'] ?? 0);
        abort_unless($dealId > 0, 404);

        $deal = Deal::query()
            ->forWorkspace($lead->workspace_id)
            ->whereKey($dealId)
            ->lockForUpdate()
            ->firstOrFail();

        if ($deal->lead_id && (int) $deal->lead_id !== (int) $lead->id) {
            throw new InvalidArgumentException('Deal is already linked to another lead.');
        }

        $updates = [
            'lead_id' => $lead->id,
            'source' => $lead->source ?: $deal->source,
        ];

        if (isset($input['owner_id'])) {
            $updates['owner_id'] = $this->resolveOwner($lead, $actor, $input);
        }

        if (isset($input['stage_id'])) {
            $updates['stage_id'] = $this->resolveStage((int) $deal->pipeline_id, $input['stage_id'])->id;
        }

        if (isset($input['amount_cents']) || isset($input['amount_dzd'])) {
            $updates['amount_cents'] = $this->toCents($input, (int) $deal->amount_cents);
        }

        $deal->forceFill($updates)->save();

        return $deal;
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function resolveOwner(Lead $lead, User $actor, array $input): ?int
    {
        $ownerId = isset($input['owner_id']) ? (int) $input['owner_id'] : $actor->id;

        if ($ownerId < 1) {
            return $actor->id;
        }

        $exists = User::query()
            ->where('workspace_id', $lead->workspace_id)
            ->whereKey($ownerId)
            ->exists();

        return $exists ? $ownerId : $actor->id;
    }

    private function resolveStage(int $pipelineId, mixed $stageId): Stage
    {
        if (filled($stageId)) {
            return Stage::query()
                ->where('pipeline_id', $pipelineId)
                ->whereKey((int) $stageId)
                ->firstOrFail();
        }

        return Stage::query()
            ->where('pipeline_id', $pipelineId)
            ->orderBy('position')
            ->firstOrFail();
    }

    /**
     * @param  array<string, mixed>  $input
     */
    private function toCents(array $input, int $fallback = 0): int
    {
        if (array_key_exists('amount_cents', $input) && $input['amount_cents'] !== null && $input['amount_cents'] !== '') {
            return max(0, (int) $input['amount_cents']);
        }

        if (array_key_exists('amount_dzd', $input) && $input['amount_dzd'] !== null && $input['amount_dzd'] !== '') {
            return max(0, (int) round(((float) $input['amount_dzd']) * 100));
        }

        return $fallback;
    }
}
