<?php

namespace App\Services\Operations;

use App\Models\ScheduledCommandRun;
use App\Models\Workspace;
use Illuminate\Support\Str;
use Throwable;

class ScheduledCommandHealth
{
    public function start(string $command, Workspace|int|null $workspace = null): ScheduledCommandRun
    {
        return ScheduledCommandRun::query()->create([
            'workspace_id' => $workspace instanceof Workspace ? $workspace->id : $workspace,
            'run_uuid' => (string) Str::uuid(),
            'command' => $command,
            'status' => ScheduledCommandRun::STATUS_RUNNING,
            'instance_id' => $this->instanceId(),
            'started_at' => now(),
        ]);
    }

    public function succeed(ScheduledCommandRun $run, float $runtimeSeconds): void
    {
        $run->forceFill([
            'status' => ScheduledCommandRun::STATUS_SUCCESS,
            'finished_at' => now(),
            'duration_ms' => max(0, (int) round($runtimeSeconds * 1000)),
            'error_type' => null,
            'error_summary' => null,
        ])->save();
    }

    public function fail(ScheduledCommandRun $run, Throwable $exception): void
    {
        $duration = $run->started_at->diffInMilliseconds(now());

        $run->forceFill([
            'status' => ScheduledCommandRun::STATUS_FAILED,
            'finished_at' => now(),
            'duration_ms' => max(0, (int) $duration),
            'error_type' => $exception::class,
            'error_summary' => 'Command failed. Inspect application logs using run '.$run->run_uuid.'.',
        ])->save();
    }

    /**
     * @return list<array{
     *     command: string,
     *     label: string,
     *     cadence: string,
     *     state: string,
     *     last_started_at: string|null,
     *     last_success_at: string|null,
     *     last_failure_at: string|null,
     *     duration_ms: int|null,
     *     error_type: string|null
     * }>
     */
    public function summary(Workspace|int|null $workspace = null): array
    {
        $definitions = config('operations.scheduled_commands', []);
        $summary = [];

        if (! is_array($definitions)) {
            return $summary;
        }

        foreach ($definitions as $command => $definition) {
            if (! is_string($command) || ! is_array($definition)) {
                continue;
            }

            $query = ScheduledCommandRun::query()->where('command', $command);

            if ($workspace !== null) {
                $query->forWorkspace($workspace);
            } else {
                $query->whereNull('workspace_id');
            }

            $latest = (clone $query)->latest('started_at')->first();
            $lastSuccess = (clone $query)
                ->where('status', ScheduledCommandRun::STATUS_SUCCESS)
                ->latest('finished_at')
                ->first();
            $lastFailure = (clone $query)
                ->where('status', ScheduledCommandRun::STATUS_FAILED)
                ->latest('finished_at')
                ->first();

            $summary[] = [
                'command' => $command,
                'label' => (string) ($definition['label'] ?? $command),
                'cadence' => (string) ($definition['cadence'] ?? 'Not configured'),
                'state' => $this->state($latest, (int) ($definition['stale_after_seconds'] ?? 300)),
                'last_started_at' => $latest?->started_at?->toIso8601String(),
                'last_success_at' => $lastSuccess?->finished_at?->toIso8601String(),
                'last_failure_at' => $lastFailure?->finished_at?->toIso8601String(),
                'duration_ms' => $latest?->duration_ms,
                'error_type' => $lastFailure?->error_type,
            ];
        }

        return $summary;
    }

    private function state(?ScheduledCommandRun $latest, int $staleAfterSeconds): string
    {
        if (! $latest) {
            return 'never';
        }

        if ($latest->status === ScheduledCommandRun::STATUS_FAILED) {
            return ScheduledCommandRun::STATUS_FAILED;
        }

        if ($latest->started_at->lt(now()->subSeconds($staleAfterSeconds))) {
            return 'stale';
        }

        return $latest->status;
    }

    private function instanceId(): string
    {
        return Str::limit((string) gethostname().':'.getmypid(), 180, '');
    }
}
