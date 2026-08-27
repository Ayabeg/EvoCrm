<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workspace_id',
    'triggered_by',
    'status',
    'started_at',
    'finished_at',
    'ok_count',
    'skipped_count',
    'failed_count',
    'nodes',
    'error',
])]
class GraphRun extends Model
{
    use BelongsToWorkspace;

    public const STATUS_PENDING = 'pending';

    public const STATUS_RUNNING = 'running';

    public const STATUS_OK = 'ok';

    public const STATUS_FAILED = 'failed';

    public const NODE_PENDING = 'pending';

    public const NODE_OK = 'ok';

    public const NODE_SKIPPED = 'skipped';

    public const NODE_FAILED = 'failed';

    /**
     * Nightly order. Parallel PRs own capture-drain / enrich / score.
     *
     * @var list<string>
     */
    public const NODES = [
        'capture-drain',
        'enrich',
        'research',
        'score',
        'deal-health',
        'next-move',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'nodes' => 'array',
            'ok_count' => 'integer',
            'skipped_count' => 'integer',
            'failed_count' => 'integer',
        ];
    }

    /** @return HasMany<DealHealthSnapshot, $this> */
    public function healthSnapshots(): HasMany
    {
        return $this->hasMany(DealHealthSnapshot::class);
    }

    /** @return HasMany<DealSuggestion, $this> */
    public function suggestions(): HasMany
    {
        return $this->hasMany(DealSuggestion::class);
    }

    /**
     * @return array<string, array{key: string, status: string, counts: array<string, int>, error: string|null}>
     */
    public function nodeMap(): array
    {
        $nodes = is_array($this->nodes) ? $this->nodes : [];

        return collect($nodes)
            ->keyBy(fn (array $node): string => (string) ($node['key'] ?? ''))
            ->all();
    }

    /**
     * @param  array<string, int>  $counts
     */
    public function recordNode(string $key, string $status, array $counts = [], ?string $error = null): void
    {
        $nodes = $this->nodeMap();
        $nodes[$key] = [
            'key' => $key,
            'status' => $status,
            'counts' => $counts,
            'error' => $error,
        ];

        $this->forceFill([
            'nodes' => array_values(array_replace(
                collect(self::NODES)->mapWithKeys(fn (string $name) => [
                    $name => $nodes[$name] ?? [
                        'key' => $name,
                        'status' => self::NODE_PENDING,
                        'counts' => [],
                        'error' => null,
                    ],
                ])->all(),
                $nodes,
            )),
            'ok_count' => collect($nodes)->where('status', self::NODE_OK)->count(),
            'skipped_count' => collect($nodes)->where('status', self::NODE_SKIPPED)->count(),
            'failed_count' => collect($nodes)->where('status', self::NODE_FAILED)->count(),
        ])->save();
    }

    public function markRunning(): void
    {
        $this->forceFill([
            'status' => self::STATUS_RUNNING,
            'started_at' => $this->started_at ?? now(),
        ])->save();
    }

    public function finish(?string $error = null): void
    {
        $failed = (int) $this->failed_count > 0 || filled($error);

        $this->forceFill([
            'status' => $failed ? self::STATUS_FAILED : self::STATUS_OK,
            'finished_at' => now(),
            'error' => $error,
        ])->save();
    }

    /**
     * @return array{
     *     id: int,
     *     triggered_by: string,
     *     status: string,
     *     started_at: string|null,
     *     finished_at: string|null,
     *     ok_count: int,
     *     skipped_count: int,
     *     failed_count: int,
     *     error: string|null,
     *     nodes: list<array{key: string, status: string, counts: array<string, int>, error: string|null}>
     * }
     */
    public function present(): array
    {
        $nodes = collect(self::NODES)->map(function (string $key): array {
            $row = $this->nodeMap()[$key] ?? null;

            return [
                'key' => $key,
                'status' => is_array($row) ? (string) ($row['status'] ?? self::NODE_PENDING) : self::NODE_PENDING,
                'counts' => is_array($row) && is_array($row['counts'] ?? null) ? $row['counts'] : [],
                'error' => is_array($row) ? ($row['error'] ?? null) : null,
            ];
        })->values()->all();

        return [
            'id' => $this->id,
            'triggered_by' => $this->triggered_by,
            'status' => $this->status,
            'started_at' => $this->started_at?->timezone('Africa/Algiers')->toIso8601String(),
            'finished_at' => $this->finished_at?->timezone('Africa/Algiers')->toIso8601String(),
            'ok_count' => (int) $this->ok_count,
            'skipped_count' => (int) $this->skipped_count,
            'failed_count' => (int) $this->failed_count,
            'error' => $this->error,
            'nodes' => $nodes,
        ];
    }
}
