<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'sequence_id',
    'contact_id',
    'status',
    'next_step',
    'next_run_at',
    'variant_key',
])]
class Enrollment extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'next_run_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Sequence, $this> */
    public function sequence(): BelongsTo
    {
        return $this->belongsTo(Sequence::class);
    }

    /** @return BelongsTo<Contact, $this> */
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
