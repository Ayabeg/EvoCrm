<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Per-user Home checklist dismissal. Not activation. Not step completion.
 *
 * @property int $id
 * @property int $workspace_id
 * @property int $user_id
 * @property Carbon|null $dismissed_at
 */
#[Fillable(['workspace_id', 'user_id', 'dismissed_at'])]
class WorkspaceActivationPreference extends Model
{
    protected function casts(): array
    {
        return [
            'dismissed_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isDismissed(): bool
    {
        return $this->dismissed_at !== null;
    }
}
