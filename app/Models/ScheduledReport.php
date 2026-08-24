<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'workspace_id',
    'saved_report_id',
    'dashboard_id',
    'cron',
    'recipients',
    'active',
    'last_sent_at',
])]
class ScheduledReport extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'recipients' => 'array',
            'active' => 'boolean',
            'last_sent_at' => 'datetime',
        ];
    }

    public function savedReport(): BelongsTo
    {
        return $this->belongsTo(SavedReport::class);
    }

    public function dashboard(): BelongsTo
    {
        return $this->belongsTo(Dashboard::class);
    }
}
