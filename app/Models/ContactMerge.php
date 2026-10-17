<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'survivor_contact_id',
    'absorbed_contact_id',
    'merged_by',
    'snapshot',
    'merged_at',
    'undone_at',
    'undone_by',
])]
class ContactMerge extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'snapshot' => 'array',
            'merged_at' => 'datetime',
            'undone_at' => 'datetime',
        ];
    }

    public function survivor(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'survivor_contact_id')->withTrashed();
    }

    public function absorbed(): BelongsTo
    {
        return $this->belongsTo(Contact::class, 'absorbed_contact_id')->withTrashed();
    }

    public function mergedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'merged_by');
    }

    public function undoneBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'undone_by');
    }
}
