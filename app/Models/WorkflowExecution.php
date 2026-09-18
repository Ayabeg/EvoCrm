<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'workflow_id',
    'workflow_name',
    'contact_id',
    'deal_id',
    'ticket_id',
    'trigger',
    'branch',
    'action',
    'condition_passed',
    'delay_minutes',
    'action_parameters',
    'result_summary',
    'error_summary',
    'run_at',
    'started_at',
    'finished_at',
    'status',
])]
class WorkflowExecution extends Model
{
    use BelongsToWorkspace;

    public const STATUS_PENDING = 'pending';

    public const STATUS_RUNNING = 'running';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Persisted statuses only. Do not invent UI-only states.
     *
     * @var list<string>
     */
    public const STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_RUNNING,
        self::STATUS_COMPLETED,
        self::STATUS_FAILED,
        self::STATUS_CANCELLED,
    ];

    /**
     * @var list<string>
     */
    public const TERMINAL_STATUSES = [
        self::STATUS_COMPLETED,
        self::STATUS_FAILED,
        self::STATUS_CANCELLED,
    ];

    protected function casts(): array
    {
        return [
            'run_at' => 'datetime',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
            'condition_passed' => 'boolean',
            'delay_minutes' => 'integer',
            'action_parameters' => 'array',
            'result_summary' => 'array',
        ];
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, self::TERMINAL_STATUSES, true);
    }

    /** @return BelongsTo<Workflow, $this> */
    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    /** @return BelongsTo<Contact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    /** @return BelongsTo<Deal, $this> */
    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    /** @return BelongsTo<Ticket, $this> */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}
