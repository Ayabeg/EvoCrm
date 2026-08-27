<?php

namespace App\Services\Enrichment;

use App\Jobs\EnrichRecordJob;
use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Collection;

class EnrichmentService
{
    public function __construct(
        private WebsiteEnricher $website,
        private GooglePlacesEnricher $places,
        private EnrichmentPersister $persister,
    ) {}

    public function queue(Workspace $workspace, string $targetType, int $targetId): void
    {
        EnrichRecordJob::dispatch($workspace->id, $targetType, $targetId);
    }

    public function enrich(Workspace $workspace, string $targetType, int $targetId): void
    {
        $target = $this->resolve($workspace, $targetType, $targetId);

        if (! $target) {
            return;
        }

        $this->website->enrich($workspace, $targetType, $target);
        $this->places->enrich($workspace, $targetType, $target);
    }

    public function apply(EnrichmentRun $run, ?User $user = null): EnrichmentRun
    {
        if (! $run->isProposed()) {
            return $run;
        }

        $workspace = $run->workspace ?? Workspace::query()->find($run->workspace_id);

        if (! $workspace instanceof Workspace) {
            return $run;
        }

        $target = $this->resolve($workspace, $run->target_type, (int) $run->target_id);

        if (! $target) {
            $run->forceFill([
                'status' => EnrichmentRun::STATUS_FAILED,
                'error' => 'Target record is gone.',
                'decided_by' => $user?->id,
                'decided_at' => now(),
            ])->save();

            return $run;
        }

        if (! $this->persister->writeField($target, (string) $run->field, (string) $run->value, force: true)) {
            $run->forceFill([
                'status' => EnrichmentRun::STATUS_FAILED,
                'error' => 'Could not apply this field (duplicate or unmapped).',
                'decided_by' => $user?->id,
                'decided_at' => now(),
            ])->save();

            return $run;
        }

        $run->forceFill([
            'status' => EnrichmentRun::STATUS_APPLIED,
            'error' => null,
            'decided_by' => $user?->id,
            'decided_at' => now(),
        ])->save();

        return $run;
    }

    public function dismiss(EnrichmentRun $run, ?User $user = null): EnrichmentRun
    {
        if (! $run->isProposed()) {
            return $run;
        }

        $run->forceFill([
            'status' => EnrichmentRun::STATUS_DISMISSED,
            'decided_by' => $user?->id,
            'decided_at' => now(),
        ])->save();

        return $run;
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function history(Workspace $workspace, string $targetType, int $targetId): Collection
    {
        return EnrichmentRun::query()
            ->forWorkspace($workspace)
            ->where('target_type', $targetType)
            ->where('target_id', $targetId)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (EnrichmentRun $run): array => [
                'id' => $run->id,
                'source' => $run->source,
                'field' => $run->field,
                'value' => $run->value,
                'confidence' => (float) $run->confidence,
                'status' => $run->status,
                'error' => $run->error,
                'created_at' => $run->created_at?->toIso8601String(),
            ])
            ->values();
    }

    public function resolve(Workspace $workspace, string $type, int $id): Company|Contact|Lead|null
    {
        return match ($type) {
            EnrichmentRun::TARGET_COMPANY => Company::query()->forWorkspace($workspace)->find($id),
            EnrichmentRun::TARGET_CONTACT => Contact::query()->forWorkspace($workspace)->with('company')->find($id),
            EnrichmentRun::TARGET_LEAD => Lead::query()->forWorkspace($workspace)->with(['company', 'contact.company'])->find($id),
            default => null,
        };
    }
}
