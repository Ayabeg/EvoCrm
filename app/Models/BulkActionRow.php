<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'bulk_action_run_id',
    'record_id',
    'status',
    'error_message',
])]
class BulkActionRow extends Model
{
    public const STATUS_SUCCESS = 'success';

    public const STATUS_FAILED = 'failed';

    /** @return BelongsTo<BulkActionRun, $this> */
    public function run(): BelongsTo
    {
        return $this->belongsTo(BulkActionRun::class, 'bulk_action_run_id');
    }
}
