<?php

namespace App\Console\Commands;

use App\Models\Company;
use App\Models\Contact;
use App\Models\EnrichmentRun;
use App\Models\Lead;
use App\Models\Workspace;
use App\Services\Enrichment\EnrichmentService;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

class EnrichLeadsCommand extends Command
{
    protected $signature = 'leads:enrich
        {--type=lead : lead, contact, company, or all}
        {--id= : Specific record id}
        {--workspace= : Limit to one workspace id}
        {--limit=50 : Max records to queue per type}
        {--sync : Run inline instead of dispatching EnrichRecordJob}';

    protected $description = 'Queue first-party website + Google Places enrichment (E1). Nightly graph can call this.';

    public function handle(EnrichmentService $enrichment): int
    {
        $type = (string) $this->option('type');
        $id = $this->option('id');
        $workspaceId = $this->option('workspace');
        $limit = max(1, (int) $this->option('limit'));
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

            $records = $this->query($targetType, $workspaceId, $id)->limit($limit)->get();

            foreach ($records as $record) {
                $workspace = $record->workspace ?? Workspace::query()->find($record->workspace_id);

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
     * @return Builder<Model>
     */
    private function query(string $type, mixed $workspaceId, mixed $id): Builder
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

        return $query->latest('id');
    }
}
