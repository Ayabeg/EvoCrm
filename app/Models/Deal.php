<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Database\Factories\DealFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use InvalidArgumentException;

#[Fillable([
    'workspace_id',
    'contact_id',
    'company_id',
    'lead_id',
    'pipeline_id',
    'stage_id',
    'title',
    'amount_cents',
    'currency',
    'closed_at',
    'next_activity_at',
])]
class Deal extends Model
{
    /** @use HasFactory<DealFactory> */
    use BelongsToWorkspace, HasFactory;

    protected function casts(): array
    {
        return [
            'closed_at' => 'datetime',
            'next_activity_at' => 'datetime',
        ];
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function pipeline(): BelongsTo
    {
        return $this->belongsTo(Pipeline::class);
    }

    public function stage(): BelongsTo
    {
        return $this->belongsTo(Stage::class);
    }

    public function moveTo(Stage $stage): void
    {
        if ((int) $stage->pipeline_id !== (int) $this->pipeline_id) {
            throw new InvalidArgumentException('Stage does not belong to this deal pipeline.');
        }

        $this->stage()->associate($stage);
        $this->closed_at = $stage->isTerminal() ? now() : null;
        $this->save();
    }
}
