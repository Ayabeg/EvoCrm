<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use App\Models\Concerns\HasRecordRelationships;
use App\Services\Crm\StagePropertyGate;
use App\Services\LeadOs\DealHealthScorer;
use Database\Factories\DealFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
    'owner_id',
    'team_id',
    'source',
    'external_id',
    'type',
    'priority',
    'lost_reason',
    'close_date',
    'next_step',
    'last_activity_at',
])]
class Deal extends Model
{
    /** @use HasFactory<DealFactory> */
    use BelongsToWorkspace, HasFactory, HasRecordRelationships;

    protected function casts(): array
    {
        return [
            'closed_at' => 'datetime',
            'next_activity_at' => 'datetime',
            'close_date' => 'date',
            'last_activity_at' => 'datetime',
        ];
    }

    public function amountDzd(): float
    {
        return round(((int) $this->amount_cents) / 100, 2);
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

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class)->latest();
    }

    public function probabilitySnapshots(): HasMany
    {
        return $this->hasMany(DealProbabilitySnapshot::class)->latest('recorded_at');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(Quote::class)->latest();
    }

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class)->latest();
    }

    /** @return HasMany<DealLineItem, $this> */
    public function lineItems(): HasMany
    {
        return $this->hasMany(DealLineItem::class)->orderBy('id');
    }

    /** @return HasMany<DealSplit, $this> */
    public function splits(): HasMany
    {
        return $this->hasMany(DealSplit::class);
    }

    public function moveTo(Stage $stage, ?User $actor = null): void
    {
        if ((int) $stage->pipeline_id !== (int) $this->pipeline_id) {
            throw new InvalidArgumentException('Stage does not belong to this deal pipeline.');
        }

        app(StagePropertyGate::class)->assertCanEnter($this, $stage);

        $fromStage = $this->stage;
        $from = $fromStage?->name ?? $this->stage_id;

        $this->stage()->associate($stage);
        $this->closed_at = $stage->isTerminal() ? now() : null;
        $this->last_activity_at = now();
        $this->save();

        Activity::query()->create([
            'workspace_id' => $this->workspace_id,
            'type' => 'stage_change',
            'subject' => "Stage → {$stage->name}",
            'body' => "Moved from {$from} to {$stage->name}.",
            'actor_id' => $actor?->id,
            'owner_id' => $this->owner_id,
            'contact_id' => $this->contact_id,
            'deal_id' => $this->id,
            'company_id' => $this->company_id,
            'meta' => [
                'stage_id' => $stage->id,
                'stage_slug' => $stage->slug,
                'from_stage_id' => $fromStage?->id,
                'from_stage_slug' => $fromStage?->slug,
            ],
        ]);

        app(DealHealthScorer::class)->refreshLive($this);
    }
}
