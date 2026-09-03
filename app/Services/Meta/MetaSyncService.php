<?php

namespace App\Services\Meta;

use App\Models\MetaSyncRun;
use App\Models\Workspace;
use App\Services\Ads\MetaAdsService;
use Illuminate\Support\Facades\Log;
use Throwable;

class MetaSyncService
{
    public function __construct(
        private MetaAdsService $ads,
        private MetaLeadAdsService $leads,
    ) {}

    /**
     * @return array{ok: bool, reason: string|null, run: MetaSyncRun, stats: array<string, mixed>}
     */
    public function run(Workspace $workspace, string $kind, string $mode = MetaSyncRun::MODE_MANUAL): array
    {
        $run = MetaSyncRun::query()->create([
            'workspace_id' => $workspace->id,
            'kind' => $kind,
            'mode' => $mode,
            'status' => MetaSyncRun::STATUS_RUNNING,
            'started_at' => now(),
        ]);

        try {
            $result = match ($kind) {
                MetaSyncRun::KIND_ADS, MetaSyncRun::KIND_INSIGHTS => $this->ads->sync($workspace),
                MetaSyncRun::KIND_FORMS => $this->leads->syncForms($workspace),
                MetaSyncRun::KIND_LEADS => $this->leads->importHistoricalLeads($workspace),
                default => $this->full($workspace),
            };

            $ok = (bool) ($result['ok'] ?? false);
            $stats = $result;
            unset($stats['ok'], $stats['reason']);

            $run->forceFill([
                'status' => $ok ? MetaSyncRun::STATUS_COMPLETED : MetaSyncRun::STATUS_FAILED,
                'processed' => (int) ($stats['campaigns'] ?? $stats['forms'] ?? $stats['imported'] ?? 0),
                'stats' => $stats,
                'error' => $ok ? null : ($result['reason'] ?? 'Sync failed'),
                'finished_at' => now(),
            ])->save();

            Log::info('meta.sync.finished', [
                'workspace_id' => $workspace->id,
                'kind' => $kind,
                'ok' => $ok,
            ]);

            return [
                'ok' => $ok,
                'reason' => $result['reason'] ?? null,
                'run' => $run->refresh(),
                'stats' => $stats,
            ];
        } catch (Throwable $exception) {
            $run->forceFill([
                'status' => MetaSyncRun::STATUS_FAILED,
                'error' => mb_substr($exception->getMessage(), 0, 500),
                'finished_at' => now(),
            ])->save();

            Log::warning('meta.sync.failed', [
                'workspace_id' => $workspace->id,
                'kind' => $kind,
            ]);

            return [
                'ok' => false,
                'reason' => 'Sync failed.',
                'run' => $run->refresh(),
                'stats' => [],
            ];
        }
    }

    /**
     * @return array{ok: bool, reason: string|null, campaigns: int, forms: int, imported: int}
     */
    protected function full(Workspace $workspace): array
    {
        $ads = $this->ads->sync($workspace);

        if (! $ads['ok']) {
            return [
                'ok' => false,
                'reason' => $ads['reason'],
                'campaigns' => 0,
                'forms' => 0,
                'imported' => 0,
            ];
        }

        $forms = $this->leads->syncForms($workspace);

        return [
            'ok' => true,
            'reason' => null,
            'campaigns' => (int) ($ads['campaigns'] ?? 0),
            'forms' => (int) ($forms['forms'] ?? 0),
            'imported' => 0,
        ];
    }
}
