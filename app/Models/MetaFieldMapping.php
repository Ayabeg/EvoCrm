<?php

namespace App\Models;

use App\Models\Concerns\BelongsToWorkspace;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'workspace_id',
    'meta_field',
    'crm_property',
    'is_custom',
])]
class MetaFieldMapping extends Model
{
    use BelongsToWorkspace;

    protected function casts(): array
    {
        return [
            'is_custom' => 'boolean',
        ];
    }
}
