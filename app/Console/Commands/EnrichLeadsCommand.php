<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\Workspace;
use App\Services\Enrichment\EnrichmentService;
use Illuminate\Console\Command;

class EnrichLeadsCommand extends Command
{
    protected $signature = 'leads:enrich
        {--type=lead : lead, contact, company, or all}
        {--id= : Specific record id}
        {--workspace= : Limit to one workspace id}
        {--limit=50 : Max records to queue per type}
        {--stale-hours=168 : Only queue records without a recent successful/proposed enrichment}
        {--sync : Run inline instead of dispatching EnrichRecordJob}';

    protected $description = 'Queue first-party website + Google Places enrichment (E1). Nightly graph can call this.';

    public function handle(EnrichmentService $enrichment): int
    {
        $type = (string) $this->option('type');
        $id = $this->option('id');
        $workspaceId = $this->option('workspace');
        $limit = max(1, (int) $this->option('limit'));
        $staleHours = max(0, (int) $this->option('stale-hours'));
        $sync = (bool) $this->option('sync');

        $types = $type === 'all'
            ? [EnrichmentRun::TARGET_LEAD, EnrichmentRun::TARGET_CONTACT, EnrichmentRun::TARGET_COMPANY]
            : [$type];

        $queued = 0;

        foreach ($types as $targetType) {
            if (! in_array($targetType, [EnrichmentRun::TARGET_LEAD, EnrichmentRun::TARGET_CONTACT, EnrichmentRun::TARGET_COMPANY], true)) {
                $this->error("Unknown type [{$targetType}]. Use lead, contact, company, or all.");

                return self::FAILURE;
            }

            foreach ($this->records($targetType, $workspaceId, $id, $limit, $staleHours) as $record) {
                $workspace = Workspace::query()->find($record->workspace_id);

                if (! $workspace instanceof Workspace) {
                    continue;
                }

                if ($sync) {
                    $enrichment->enrich($workspace, $targetType, (int) $record->id);
                } else {
                    $enrichment->queue($workspace, $targetType, (int) $record->id);
                }

                $queued++;
            }
        }

        $this->info("leads:enrich — {$queued} record(s).");

        return self::SUCCESS;
    }

    /**
     * @return list<Company|Contact|Lead>
     */
    private function records(string $type, mixed $workspaceId, mixed $id, int $limit, int $staleHours): array
    {
        $query = match ($type) {
            EnrichmentRun::TARGET_CONTACT => Contact::query(),
            EnrichmentRun::TARGET_COMPANY => Company::query(),
            default => Lead::query(),
        };

        if (filled($workspaceId)) {
            $query->where('workspace_id', (int) $workspaceId);
        }

        if (filled($id)) {
            $query->where('id', (int) $id);
        }

        $cutoff = now()->subHours($staleHours);
        $table = $query->getModel()->getTable();
        $targetType = $type;
        $query->whereNotExists(function ($recent) use ($targetType, $cutoff, $table): void {
            $recent->selectRaw('1')
                ->from('enrichment_runs as recent_enrichment')
                ->whereColumn('recent_enrichment.target_id', "{$table}.id")
                ->where('recent_enrichment.target_type', $targetType)
                ->where('recent_enrichment.created_at', '>=', $cutoff)
                ->whereIn('recent_enrichment.status', [
                    EnrichmentRun::STATUS_QUEUED,
                    EnrichmentRun::STATUS_PROPOSED,
                    EnrichmentRun::STATUS_APPLIED,
                ]);
        });

        return array_values($query->latest('id')->limit($limit)->get()->all());
    }
}
