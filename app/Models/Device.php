<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $workspace_id
 * @property int $user_id
 * @property string $platform
 * @property string $provider
 * @property string $token
 * @property Carbon|null $last_seen_at
 */
#[Fillable([
    'workspace_id',
    'user_id',
    'platform',
    'provider',
    'token',
    'last_seen_at',
])]
class Device extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
