<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['workspace_id', 'user_id', 'entity', 'layout', 'is_workspace_default'])]
class RecordLayout extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'layout' => 'array',
            'is_workspace_default' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
