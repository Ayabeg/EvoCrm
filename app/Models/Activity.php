<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'type',
    'provider',
    'provider_event_id',
    'subject',
    'body',
    'due_at',
    'completed_at',
    'done',
    'owner_id',
    'actor_id',
    'contact_id',
    'deal_id',
    'company_id',
    'meta',
])]
class Activity extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
            'done' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function deal(): BelongsTo
    {
        return $this->belongsTo(Deal::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function markDone(): void
    {
        $this->forceFill([
            'done' => true,
            'completed_at' => now(),
        ])->save();
    }
}
