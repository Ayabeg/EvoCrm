<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'workspace_id',
    'user_id',
    'type',
    'status',
    'filename',
    'source_hash',
    'headers',
    'mapping',
    'total_rows',
    'processed_rows',
    'created_count',
    'updated_count',
    'skipped_count',
    'error_count',
    'error_summary',
    'started_at',
    'finished_at',
])]
class ImportBatch extends Model
{
    use BelongsToWorkspace;

    public const TYPE_CONTACTS = 'contacts';

    public const TYPE_DEALS = 'deals';

    public const STATUS_UPLOADED = 'uploaded';

    public const STATUS_MAPPED = 'mapped';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    protected function casts(): array
    {
        return [
            'headers' => 'array',
            'mapping' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<ImportRow, $this> */
    public function rows(): HasMany
    {
        return $this->hasMany(ImportRow::class)->orderBy('row_number');
    }
}
